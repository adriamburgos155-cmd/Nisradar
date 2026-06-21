import { NextResponse } from 'next/server'

const SYSTEM = `Eres el motor de análisis maestro de Nasdaq Risk Radar. Tu trabajo es sintetizar TODOS los datos en vivo (noticias filtradas, volatilidad, niveles del NDX/NQ, datos macro de la Fed) en UNA conclusión clara y accionable para un trader intradía de Nasdaq.

Además de los datos que te paso, usa tu propio conocimiento general y actualizado sobre el contexto macroeconómico, político y geopolítico mundial actual (Fed, Trump, China, tensiones geopolíticas, sector tech) para enriquecer tu análisis — no te limites solo a las noticias listadas, complementa con lo que tú ya sabes que está pasando en el mundo ahora mismo y que sea relevante para el Nasdaq.

No listes noticias una por una. Da una síntesis ejecutiva.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con este formato exacto:

{
  "direccion": "alcista" | "bajista" | "mixto" | "neutral",
  "confianza": 1-100,
  "resumenEjecutivo": "2-3 frases que resuman el panorama actual del Nasdaq ahora mismo, en español, directo, sin relleno",
  "ventajas": ["punto 1 corto", "punto 2 corto", "punto 3 corto"],
  "desventajas": ["punto 1 corto", "punto 2 corto", "punto 3 corto"],
  "catalizadorPrincipal": "el evento/factor #1 que está moviendo el mercado ahora mismo, una frase",
  "nivelesClave": "soporte y resistencia aproximados del NQ si se pueden inferir, o rango esperado del día, una frase",
  "recomendacionRiesgo": "una frase sobre el nivel de cautela apropiado ahora mismo (ej: 'reducir tamaño de posición', 'condiciones normales', etc.)"
}

Sé extremadamente conciso. Cada punto de ventajas/desventajas debe ser una frase corta de máximo 12 palabras. El resumenEjecutivo máximo 3 frases. Todo en español.`

export async function POST(req: Request) {
  try {
    const { events, gauge, snapshot, fred, apiKey } = await req.json()
    const GROQ_KEY = process.env.GROQ_API_KEY || apiKey || ''
    if (!GROQ_KEY) {
      return NextResponse.json({ error: 'NO_KEY', message: 'Configura tu Groq API key en Settings.' }, { status: 401 })
    }

    const eventsBlock = (events || []).slice(0, 10).map((e: { headline: string; category: string; importance: string; impactDirection: string; impactStrength: number; publishedAt: string }) =>
      `- [${e.category}] ${e.headline} — Impacto: ${e.impactDirection} (${e.impactStrength}/10, importancia ${e.importance})`
    ).join('\n')

    const fredBlock = fred ? `
DATOS FED (FRED):
Fed Funds Rate: ${fred.fedFunds?.observations?.slice(-1)[0]?.value ?? '—'}%
CPI reciente: ${fred.cpi?.observations?.slice(-1)[0]?.value ?? '—'}
Spread 10Y-2Y: ${fred.yield_spread?.observations?.slice(-1)[0]?.value ?? '—'}%
Desempleo: ${fred.unemployment?.observations?.slice(-1)[0]?.value ?? '—'}%` : ''

    const ctx = `
HORA ACTUAL: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })} EST

NIVELES ACTUALES:
NASDAQ 100 (NDX): ${snapshot?.ndx?.price?.toFixed(0) ?? '—'} (${snapshot?.ndx?.changePct >= 0 ? '+' : ''}${snapshot?.ndx?.changePct?.toFixed(2) ?? '0'}%)
NQ Futuros: ${snapshot?.nq?.price?.toFixed(0) ?? '—'} (${snapshot?.nq?.changePct >= 0 ? '+' : ''}${snapshot?.nq?.changePct?.toFixed(2) ?? '0'}%)
VIX: ${gauge?.vix?.toFixed(2) ?? '—'} (régimen: ${gauge?.regime ?? 'normal'}, ${gauge?.vixChangePct >= 0 ? '+' : ''}${gauge?.vixChangePct?.toFixed(2) ?? '0'}%)
Movimiento diario esperado (VIX-implied): ±${gauge?.expectedDailyMove?.toFixed(2) ?? '—'}%
10Y Treasury: ${snapshot?.t10y?.yield?.toFixed(2) ?? '—'}%
DXY: ${snapshot?.dxy?.price?.toFixed(2) ?? '—'}
${fredBlock}

EVENTOS ACTIVOS EN EL RADAR (últimos filtrados por relevancia Nasdaq):
${eventsBlock || 'Sin eventos significativos detectados en este momento.'}`

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1200,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: ctx },
        ],
      }),
    })

    if (!resp.ok) {
      if (resp.status === 401) return NextResponse.json({ error: 'INVALID_KEY', message: 'Key de Groq inválida.' }, { status: 401 })
      const e = await resp.text()
      return NextResponse.json({ error: e }, { status: 500 })
    }

    const data = await resp.json()
    const text = data.choices?.[0]?.message?.content || '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'PARSE_ERROR', message: 'No se pudo procesar la respuesta de la IA.' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ data: parsed, generatedAt: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
