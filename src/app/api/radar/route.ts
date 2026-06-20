import { NextResponse } from 'next/server'
import type { RadarEvent, RadarCategory } from '@/lib/radar-types'

const FH_KEY   = process.env.FINNHUB_KEY  || ''
const GROQ_KEY = process.env.GROQ_API_KEY || ''

// ─── System prompt — exact analyst persona the user defined ──────────
const RADAR_SYSTEM = `Eres un analista macroeconómico y de riesgo especializado EXCLUSIVAMENTE en el Nasdaq (NQ/MNQ). Tu misión es filtrar noticias y devolver SOLO las que pueden generar volatilidad significativa o cambios de dirección en el Nasdaq.

PRIORIDADES DE MONITOREO (en orden):
1. Reserva Federal: tasas, declaraciones de miembros FED, FOMC, CPI/PPI/PCE, NFP/desempleo, rendimiento de bonos del Tesoro.
2. Donald Trump: posts en X, declaraciones públicas, aranceles, restricciones comerciales, medidas económicas, tensiones con China, comentarios sobre la FED.
3. Geopolítica: conflictos militares, Irán, China-Taiwán, Rusia-Ucrania, ataques a infraestructura crítica, riesgos para petróleo/energía/cadenas de suministro.
4. Tech/IA: NVIDIA, Microsoft, Apple, Amazon, Meta, Google, OpenAI, AMD, Broadcom, y cualquier noticia con impacto significativo al sector tech.
5. Riesgo de Mercado: VIX, flujos institucionales, opciones de gran tamaño, OPEX, cambios en liquidez.

FILTRO DE RUIDO: Descarta CUALQUIER noticia sin relación clara con: Nasdaq, tecnología, FED, inflación, tasas, Trump, China, geopolítica relevante, o volatilidad de mercado. NO incluyas deportes, entretenimiento, política sin impacto económico, o noticias genéricas.

Para cada noticia relevante que recibas, debes clasificarla. Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, con este formato exacto para cada evento:

[{
  "id": "string único",
  "importance": "alta" | "media" | "baja",
  "impactDirection": "alcista" | "bajista" | "neutral",
  "impactStrength": 1-10,
  "summary": "resumen en máximo 3 líneas, en español",
  "whyItMatters": "explicación específica de cómo afecta al Nasdaq, en español",
  "category": "fed" | "trump" | "geopolitics" | "tech" | "market_risk",
  "volatilityProb": "baja" | "media" | "alta",
  "watchAssets": ["NQ","MNQ","ES","VIX","10Y"] (solo los relevantes),
  "isBreaking": true/false (si potencial de mover Nasdaq >0.5% en <24h),
  "isDeveloping": true/false (si la info aún no está confirmada completamente),
  "relevant": true/false (false si debe ser descartada por el filtro de ruido)
}]

Si una noticia NO es relevante para el Nasdaq según las prioridades, márcala con "relevant": false y el resto de campos pueden ser valores por defecto.`

interface RawNewsItem {
  id: string; headline: string; summary: string; source: string; url: string; publishedAt: string
}

// ─── Step 1: fetch raw news from Finnhub across relevant categories ──
async function fetchRawNews(): Promise<RawNewsItem[]> {
  if (!FH_KEY) return []
  const categories = ['general', 'forex', 'crypto', 'merger']
  const all: RawNewsItem[] = []

  for (const cat of categories) {
    try {
      const r = await fetch(`https://finnhub.io/api/v1/news?category=${cat}&token=${FH_KEY}`, { next: { revalidate: 120 } })
      if (!r.ok) continue
      const j = await r.json()
      if (Array.isArray(j)) {
        j.slice(0, 15).forEach((a: { id: number; headline: string; summary: string; source: string; url: string; datetime: number }) => {
          if (!a.headline) return
          all.push({
            id:          String(a.id),
            headline:    a.headline,
            summary:     a.summary || '',
            source:      a.source  || 'Finnhub',
            url:         a.url     || '#',
            publishedAt: new Date(a.datetime * 1000).toISOString(),
          })
        })
      }
    } catch { /* skip */ }
  }

  // Also pull company-specific news for the mega-cap tech names that move Nasdaq
  const techSymbols = ['NVDA', 'MSFT', 'AAPL', 'AMZN', 'META', 'GOOGL', 'AMD', 'AVGO']
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  for (const sym of techSymbols.slice(0, 4)) { // limit to avoid rate limits
    try {
      const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${weekAgo}&to=${today}&token=${FH_KEY}`, { next: { revalidate: 120 } })
      if (!r.ok) continue
      const j = await r.json()
      if (Array.isArray(j)) {
        j.slice(0, 3).forEach((a: { id: number; headline: string; summary: string; source: string; url: string; datetime: number }) => {
          if (!a.headline) return
          all.push({
            id:          String(a.id) + '_' + sym,
            headline:    a.headline,
            summary:     a.summary || '',
            source:      a.source  || 'Finnhub',
            url:         a.url     || '#',
            publishedAt: new Date(a.datetime * 1000).toISOString(),
          })
        })
      }
    } catch { /* skip */ }
  }

  // Dedupe by headline
  const seen = new Set<string>()
  return all.filter(n => {
    if (seen.has(n.headline)) return false
    seen.add(n.headline)
    return true
  }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

// ─── Step 2: classify with Groq using the radar persona ──────────────
async function classifyBatch(items: RawNewsItem[], groqKey: string): Promise<RadarEvent[]> {
  if (items.length === 0 || !groqKey) return []

  const batchInput = items.slice(0, 20).map(i => ({
    id: i.id, headline: i.headline, summary: i.summary, source: i.source, publishedAt: i.publishedAt,
  }))

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: RADAR_SYSTEM },
          { role: 'user', content: `Clasifica estas noticias:\n\n${JSON.stringify(batchInput, null, 2)}` },
        ],
      }),
    })
    if (!resp.ok) return []
    const data = await resp.json()
    const text = data.choices?.[0]?.message?.content || '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const classified = JSON.parse(jsonMatch[0])

    const results: RadarEvent[] = []
    for (const c of classified) {
      if (c.relevant === false) continue
      const original = items.find(i => i.id === c.id)
      if (!original) continue
      results.push({
        id:              original.id,
        headline:        original.headline,
        summary:         c.summary || original.summary,
        whyItMatters:    c.whyItMatters || '',
        source:          original.source,
        url:             original.url,
        publishedAt:     original.publishedAt,
        category:        (c.category as RadarCategory) || 'market_risk',
        importance:      c.importance || 'media',
        impactDirection: c.impactDirection || 'neutral',
        impactStrength:  c.impactStrength || 5,
        volatilityProb:  c.volatilityProb || 'media',
        watchAssets:     c.watchAssets || ['NQ', 'VIX'],
        isBreaking:      c.isBreaking || false,
        isDeveloping:    c.isDeveloping || false,
      })
    }
    return results
  } catch { return [] }
}

// ─── Fallback: realistic demo radar events ────────────────────────────
function mockRadarEvents(): RadarEvent[] {
  const now = Date.now()
  return [
    {
      id: 'demo1', headline: 'Fed holds rates at 4.25-4.50% — Powell warns tariffs create difficult inflation tradeoffs',
      summary: 'FOMC mantuvo tasas sin cambios. Powell mencionó explícitamente que los aranceles complican el balance entre inflación y empleo.',
      whyItMatters: 'Un tono hawkish inesperado podría presionar múltiplos tech. El mercado había descontado 2 recortes para 2026 — cualquier señal de retraso golpea duro al Nasdaq por su sensibilidad a tasas.',
      source: 'Reuters', url: '#', publishedAt: new Date(now - 3600000).toISOString(),
      category: 'fed', importance: 'alta', impactDirection: 'bajista', impactStrength: 8,
      volatilityProb: 'alta', watchAssets: ['NQ', 'MNQ', 'VIX', '10Y'], isBreaking: false,
    },
    {
      id: 'demo2', headline: 'Trump anuncia nuevos aranceles del 25% a semiconductores chinos en Truth Social',
      summary: 'Trump publicó que impondrá aranceles adicionales a chips importados de China, citando seguridad nacional. Sin fecha de implementación confirmada.',
      whyItMatters: 'NVDA, AMD y AVGO tienen exposición directa a cadena de suministro China. Un arancel del 25% podría comprimir márgenes del sector semiconductor que pesa ~25% del Nasdaq 100.',
      source: 'Bloomberg', url: '#', publishedAt: new Date(now - 1800000).toISOString(),
      category: 'trump', importance: 'alta', impactDirection: 'bajista', impactStrength: 7,
      volatilityProb: 'alta', watchAssets: ['NQ', 'MNQ', 'ES'], isBreaking: true, isDeveloping: true,
    },
    {
      id: 'demo3', headline: 'NVIDIA supera estimados Q1: ingresos de data center +85% YoY, guidance fuerte para Q2',
      summary: 'NVDA reportó EPS de $0.89 vs $0.75 estimado. El segmento de centros de datos sigue siendo el motor principal del crecimiento.',
      whyItMatters: 'NVDA pesa significativamente en el NDX. Un beat de esta magnitud con guidance alcista tiende a arrastrar a todo el sector semiconductor y AI-adjacent en pre-market.',
      source: 'CNBC', url: '#', publishedAt: new Date(now - 5400000).toISOString(),
      category: 'tech', importance: 'alta', impactDirection: 'alcista', impactStrength: 8,
      volatilityProb: 'media', watchAssets: ['NQ', 'MNQ'], isBreaking: false,
    },
    {
      id: 'demo4', headline: 'VIX sube 12% en la sesión — mayor salto intradía en 3 semanas',
      summary: 'El índice de volatilidad saltó de 16.2 a 18.1 sin un catalizador claro inmediato. Volumen de puts elevado en SPX.',
      whyItMatters: 'Movimientos abruptos del VIX sin noticia clara suelen preceder a flujos institucionales defensivos. Vigilar si hay rotación fuera de tech de alta beta como NVDA, TSLA.',
      source: 'MarketWatch', url: '#', publishedAt: new Date(now - 2700000).toISOString(),
      category: 'market_risk', importance: 'media', impactDirection: 'bajista', impactStrength: 5,
      volatilityProb: 'alta', watchAssets: ['VIX', 'NQ', 'ES'], isBreaking: false,
    },
    {
      id: 'demo5', headline: 'Tensión Taiwán-China se intensifica tras maniobras navales cerca del estrecho',
      summary: 'China realizó ejercicios militares de gran escala cerca de Taiwán. Taiwán elevó su nivel de alerta defensiva.',
      whyItMatters: 'TSMC fabrica la mayoría de los chips avanzados que usan NVDA, AAPL y AMD. Cualquier escalada real en Taiwán es un riesgo de cola para todo el sector semiconductor del Nasdaq.',
      source: 'Reuters', url: '#', publishedAt: new Date(now - 9000000).toISOString(),
      category: 'geopolitics', importance: 'media', impactDirection: 'bajista', impactStrength: 6,
      volatilityProb: 'media', watchAssets: ['NQ', 'MNQ', 'VIX'], isBreaking: false, isDeveloping: true,
    },
    {
      id: 'demo6', headline: 'CPI de abril sale en línea con estimados: 2.4% interanual, núcleo en 2.8%',
      summary: 'La inflación general coincidió con expectativas. El componente de vivienda sigue siendo el principal contribuyente.',
      whyItMatters: 'Un CPI en línea reduce la probabilidad de sorpresas hawkish de la Fed en el corto plazo. Generalmente neutral a ligeramente positivo para tech de alta duración como el Nasdaq.',
      source: 'BLS', url: '#', publishedAt: new Date(now - 14400000).toISOString(),
      category: 'fed', importance: 'media', impactDirection: 'neutral', impactStrength: 4,
      volatilityProb: 'baja', watchAssets: ['NQ', '10Y'], isBreaking: false,
    },
  ]
}

export async function GET(req: Request) {
  const clientGroq = req.headers.get('x-groq-key') || ''
  const groqKey    = GROQ_KEY || clientGroq

  if (!FH_KEY && !groqKey) {
    return NextResponse.json({ data: mockRadarEvents(), mock: true, updatedAt: new Date().toISOString() })
  }

  try {
    const raw = await fetchRawNews()
    if (raw.length === 0) {
      return NextResponse.json({ data: mockRadarEvents(), mock: true, updatedAt: new Date().toISOString() })
    }

    if (!groqKey) {
      // No AI classification available — return raw items as low-confidence market_risk
      return NextResponse.json({ data: mockRadarEvents(), mock: true, updatedAt: new Date().toISOString() })
    }

    const classified = await classifyBatch(raw, groqKey)
    if (classified.length === 0) {
      return NextResponse.json({ data: mockRadarEvents(), mock: true, updatedAt: new Date().toISOString() })
    }

    // Sort: breaking first, then by importance + impact strength
    const importanceRank = { alta: 3, media: 2, baja: 1 }
    classified.sort((a, b) => {
      if (a.isBreaking !== b.isBreaking) return a.isBreaking ? -1 : 1
      const ai = importanceRank[a.importance] * 10 + a.impactStrength
      const bi = importanceRank[b.importance] * 10 + b.impactStrength
      return bi - ai
    })

    return NextResponse.json({ data: classified, mock: false, updatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({ data: mockRadarEvents(), mock: true, updatedAt: new Date().toISOString() })
  }
}
