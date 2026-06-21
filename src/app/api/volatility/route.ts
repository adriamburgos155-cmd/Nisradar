import { NextResponse } from 'next/server'
import type { VolatilityGauge, NasdaqSnapshot } from '@/lib/radar-types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FH_KEY = process.env.FINNHUB_KEY || ''

async function yahooQuote(symbol: string) {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`,
      { next: { revalidate: 15 }, headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!r.ok) return null
    const j = await r.json()
    const result = j?.chart?.result?.[0]
    const meta = result?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice ?? meta.previousClose
    const prev  = meta.chartPreviousClose ?? meta.previousClose
    const closes: number[] = (result.indicators?.quote?.[0]?.close ?? []).filter((v: number) => v != null)
    return {
      price,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      high: meta.regularMarketDayHigh ?? price,
      low:  meta.regularMarketDayLow  ?? price,
      history: closes,
    }
  } catch { return null }
}

function classifyVixRegime(vix: number): { regime: VolatilityGauge['regime']; label: string } {
  if (vix < 15) return { regime: 'low',      label: 'Calma — baja cobertura institucional' }
  if (vix < 20) return { regime: 'normal',   label: 'Normal — condiciones de mercado estándar' }
  if (vix < 30) return { regime: 'elevated', label: 'Elevado — incertidumbre activa, cautela recomendada' }
  return            { regime: 'extreme',  label: 'Extremo — pánico / evento de cola en curso' }
}

export async function GET() {
  try {
    const [ndx, nq, vixData, t10y, dxy] = await Promise.all([
      yahooQuote('^NDX'),
      yahooQuote('NQ=F'),
      yahooQuote('^VIX'),
      yahooQuote('^TNX'),
      yahooQuote('DX-Y.NYB'),
    ])

    const vix = vixData?.price ?? 17.5
    const { regime, label } = classifyVixRegime(vix)

    // Expected daily move ≈ VIX / sqrt(252)
    const expectedDailyMove = vix / Math.sqrt(252)

    // Percentile of current VIX vs its own 30d history
    const history = vixData?.history ?? []
    let percentile30d = 50
    if (history.length > 5) {
      const below = history.filter(v => v < vix).length
      percentile30d = Math.round((below / history.length) * 100)
    }

    const gauge: VolatilityGauge = {
      vix,
      vixChangePct: vixData?.changePct ?? 0,
      regime,
      regimeLabel: label,
      expectedDailyMove: Math.round(expectedDailyMove * 100) / 100,
      percentile30d,
    }

    const snapshot: NasdaqSnapshot = {
      ndx: {
        price: ndx?.price ?? 19500,
        changePct: ndx?.changePct ?? 0,
        high: ndx?.high ?? 19500,
        low:  ndx?.low  ?? 19500,
      },
      nq: {
        price: nq?.price ?? ndx?.price ?? 19500,
        changePct: nq?.changePct ?? ndx?.changePct ?? 0,
      },
      vix: {
        price: vix,
        changePct: vixData?.changePct ?? 0,
        regime,
      },
      t10y: {
        yield: t10y?.price ?? 4.38,
        changeBps: Math.round((t10y?.changePct ?? 0) * (t10y?.price ?? 4.38)),
      },
      dxy: {
        price: dxy?.price ?? 99.6,
        changePct: dxy?.changePct ?? 0,
      },
    }

    return NextResponse.json({
      gauge, snapshot,
      mock: !ndx && !vixData,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({
      gauge: { vix: 17.5, vixChangePct: 0, regime: 'normal', regimeLabel: 'Normal', expectedDailyMove: 1.1, percentile30d: 50 },
      snapshot: {
        ndx: { price: 19500, changePct: 0, high: 19500, low: 19500 },
        nq:  { price: 19500, changePct: 0 },
        vix: { price: 17.5, changePct: 0, regime: 'normal' },
        t10y:{ yield: 4.38, changeBps: 0 },
        dxy: { price: 99.6, changePct: 0 },
      },
      mock: true,
      updatedAt: new Date().toISOString(),
    })
  }
