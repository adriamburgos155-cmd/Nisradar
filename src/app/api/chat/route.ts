import { NextResponse } from 'next/server'

const SYSTEM = `Eres un analista macroeconómico y de riesgo especializado EXCLUSIVAMENTE en el Nasdaq (NQ/MNQ). Operas como un radar profesional de riesgo para trading intradía en Nasdaq.

PRIORIDADES (en orden):
1. Reserva Federal: tasas, FOMC, declaraciones de miembros, CPI/PPI/PCE, NFP/desempleo, rendimiento bonos del Tesoro.
2. Donald Trump: posts en X, declaraciones, aranceles, restricciones comerciales, tensiones con China, comentarios sobre la FED.
3. Geopolítica: Irán, China-Taiwán, Rusia-Ucrania, ataques a infraestructura, riesgos para petróleo/energía/cadenas de suministro.
4. Tech/IA: NVIDIA, Microsoft, Apple, Amazon, Meta, Google, OpenAI, AMD, Broadcom.
5. Riesgo de Mercado: VIX, flujos institucionales, OPEX, liquidez.

Cuando analices algo, usa este formato cuando sea relevante:
- IMPORTANCIA: 🔴 Alta / 🟠 Media / 🟢 Baja
- IMPACTO ESPERADO: Alcista / Bajista / Neutral
- FUERZA: 1-10
- ACTIVOS A VIGILAR: NQ, MNQ, ES, VIX, 10Y

Reglas:
- Responde en español, directo, sin relleno
- Máximo 5 oraciones salvo que pidan análisis profundo
- Ignora cualquier tema sin relación clara con Nasdaq/tech/Fed/Trump/geopolítica/volatilidad
- Si detectas algo con potencial de mover el Nasdaq >0.5% en <24h, dilo explícitamente como "alerta"
- Usa **negritas** para cifras clave`

export async function POST(req: Request) {
  try {
    const { messages, marketContext, radarContext, apiKey } = await req.json()
    const GROQ_KEY = process.env.GROQ_API_KEY || apiKey || ''
    if (!GROQ_KEY) return NextResponse.json({ error: 'NO_KEY', message: 'Add your Groq API key in Settings.' }, { status: 401 })

    const m = marketContext
    const r = radarContext

    const ctx = `
DATOS EN VIVO (${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} EST):
NASDAQ 100 (NDX): ${m?.ndx?.price?.toFixed(0) ?? '—'} (${m?.ndx?.changePct >= 0 ? '+' : ''}${m?.ndx?.changePct?.toFixed(2) ?? '0'}%)
NQ Futures: ${m?.nq?.price?.toFixed(0) ?? '—'} (${m?.nq?.changePct >= 0 ? '+' : ''}${m?.nq?.changePct?.toFixed(2) ?? '0'}%)
VIX: ${m?.vix?.price?.toFixed(2) ?? '—'} (régimen: ${m?.vix?.regime ?? 'normal'})
10Y Treasury: ${m?.t10y?.yield?.toFixed(2) ?? '—'}%
DXY: ${m?.dxy?.price?.toFixed(2) ?? '—'}

EVENTOS ACTIVOS EN EL RADAR (últimas clasificaciones):
${r?.slice?.(0, 5)?.map((e: { headline: string; importance: string; impactDirection: string; impactStrength: number }) =>
  `- [${e.importance.toUpperCase()}] ${e.headline} → Impacto: ${e.impactDirection} (fuerza ${e.impactStrength}/10)`
).join('\n') ?? 'Sin eventos cargados aún.'}`

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        temperature: 0.5,
        messages: [
          { role: 'system', content: SYSTEM + '\n\n' + ctx },
          ...messages.map((msg: { role: string; content: string }) => ({ role: msg.role, content: msg.content })),
        ],
      }),
    })

    if (!resp.ok) {
      if (resp.status === 401) return NextResponse.json({ error: 'INVALID_KEY', message: 'Invalid Groq API key.' }, { status: 401 })
      const e = await resp.text()
      return NextResponse.json({ error: e }, { status: 500 })
    }
    const data = await resp.json()
    return NextResponse.json({ reply: data.choices?.[0]?.message?.content || 'No response.' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
