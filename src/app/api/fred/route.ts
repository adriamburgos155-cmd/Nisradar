import { NextResponse } from 'next/server'
import { mockFredObs } from '@/lib/market-data'
import type { FredSeries, FredObservation, FredDollarAnalysis } from '@/lib/types'

const FRED_KEY = process.env.FRED_API_KEY || ''
const BASE = 'https://api.stlouisfed.org/fred'

// Key series for USD / macro analysis
const SERIES_CONFIG = {
  dxy:          { id:'DTWEXBGS',  title:'USD Broad Index (Real)',      units:'Index Mar 1973=100' },
  cpi:          { id:'CPIAUCSL',  title:'CPI - All Urban Consumers',   units:'Index 1982-84=100' },
  coreCpi:      { id:'CPILFESL',  title:'Core CPI (ex Food & Energy)', units:'Index 1982-84=100' },
  fedFunds:     { id:'FEDFUNDS',  title:'Federal Funds Rate',          units:'Percent' },
  t10y:         { id:'DGS10',     title:'10-Year Treasury Yield',      units:'Percent' },
  t2y:          { id:'DGS2',      title:'2-Year Treasury Yield',       units:'Percent' },
  yield_spread: { id:'T10Y2Y',    title:'10Y-2Y Treasury Spread',      units:'Percent' },
  m2:           { id:'M2SL',      title:'M2 Money Supply',             units:'Billions of Dollars' },
  unemployment: { id:'UNRATE',    title:'Unemployment Rate',           units:'Percent' },
  gdp:          { id:'GDP',       title:'Gross Domestic Product',      units:'Billions of Dollars' },
  pce:          { id:'PCEPI',     title:'PCE Price Index',             units:'Index 2017=100' },
}

async function fetchSeries(seriesId: string, limit = 24): Promise<FredObservation[]|null> {
  if (!FRED_KEY) return null
  try {
    const url = `${BASE}/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=${limit}`
    const r = await fetch(url, { next: { revalidate: 3600 } })
    if (!r.ok) return null
    const j = await r.json()
    return (j.observations ?? [])
      .reverse()
      .map((o: {date:string; value:string}) => ({
        date:  o.date,
        value: o.value === '.' ? null : parseFloat(o.value),
      }))
  } catch { return null }
}

async function fetchReleases(): Promise<Array<{id:number;name:string;date:string}>|null> {
  if (!FRED_KEY) return null
  try {
    const url = `${BASE}/releases/dates?api_key=${FRED_KEY}&file_type=json&limit=10&sort_order=desc&include_release_dates_with_no_data=false`
    const r = await fetch(url, { next: { revalidate: 3600 } })
    if (!r.ok) return null
    const j = await r.json()
    return (j.release_dates ?? []).map((rd: {release_id:number;release_name:string;date:string}) => ({
      id:   rd.release_id,
      name: rd.release_name,
      date: rd.date,
    }))
  } catch { return null }
}

// Mock fallback data — realistic as of May 2026
function buildMockSeries(key: string): FredSeries {
  const cfg = SERIES_CONFIG[key as keyof typeof SERIES_CONFIG]
  const mockMap: Record<string, {base:number;trend:number;noise:number}> = {
    dxy:          { base:99.6,   trend:-0.15, noise:0.4  },
    cpi:          { base:315.2,  trend:0.25,  noise:0.1  },
    coreCpi:      { base:325.8,  trend:0.22,  noise:0.08 },
    fedFunds:     { base:4.33,   trend:0,     noise:0    },
    t10y:         { base:4.38,   trend:0.02,  noise:0.08 },
    t2y:          { base:3.82,   trend:-0.01, noise:0.06 },
    yield_spread: { base:0.56,   trend:0.01,  noise:0.04 },
    m2:           { base:21200,  trend:35,    noise:20   },
    unemployment: { base:4.2,    trend:0.02,  noise:0.05 },
    gdp:          { base:29800,  trend:120,   noise:50   },
    pce:          { base:126.4,  trend:0.18,  noise:0.06 },
  }
  const m = mockMap[key] ?? { base:100, trend:0.1, noise:0.5 }
  return {
    id:          cfg.id,
    title:       cfg.title,
    units:       cfg.units,
    frequency:   key === 'gdp' ? 'Quarterly' : key === 'dxy' || key === 't10y' || key === 't2y' || key === 'yield_spread' ? 'Daily' : 'Monthly',
    lastUpdated: new Date().toISOString(),
    observations: mockFredObs(m.base, 23, m.trend, m.noise),
  }
}

export async function GET() {
  const hasFred = !!FRED_KEY
  const seriesKeys = Object.keys(SERIES_CONFIG) as Array<keyof typeof SERIES_CONFIG>

  if (!hasFred) {
    // Return realistic mock data
    const result: Partial<FredDollarAnalysis> = {}
    for (const k of seriesKeys) {
      (result as Record<string, FredSeries>)[k] = buildMockSeries(k)
    }
    result.releases = [
      { id:10,  name:'Employment Situation',          date:'2026-05-02' },
      { id:33,  name:'Advance Retail Sales',          date:'2026-05-15' },
      { id:53,  name:'Consumer Price Index',          date:'2026-05-13' },
      { id:21,  name:'GDP',                           date:'2026-04-30' },
      { id:20,  name:'Industrial Production and Capacity Utilization', date:'2026-05-16' },
      { id:182, name:'Personal Income and Outlays',   date:'2026-04-30' },
    ]
    return NextResponse.json({ data:result as FredDollarAnalysis, mock:true, updatedAt:new Date().toISOString() })
  }

  // Live FRED fetch
  try {
    const [obsResults, releases] = await Promise.all([
      Promise.allSettled(seriesKeys.map(k => fetchSeries(SERIES_CONFIG[k].id))),
      fetchReleases(),
    ])

    const result: Partial<FredDollarAnalysis> = {}
    seriesKeys.forEach((k, i) => {
      const r = obsResults[i]
      const cfg = SERIES_CONFIG[k]
      const obs = r.status === 'fulfilled' && r.value ? r.value : buildMockSeries(k).observations
      ;(result as Record<string, FredSeries>)[k] = {
        id: cfg.id, title: cfg.title, units: cfg.units,
        frequency: 'Monthly', lastUpdated: new Date().toISOString(),
        observations: obs,
      }
    })
    result.releases = releases ?? []
    return NextResponse.json({ data:result as FredDollarAnalysis, mock:false, updatedAt:new Date().toISOString() })
  } catch {
    const result: Partial<FredDollarAnalysis> = {}
    for (const k of seriesKeys) { (result as Record<string, FredSeries>)[k] = buildMockSeries(k) }
    result.releases = []
    return NextResponse.json({ data:result as FredDollarAnalysis, mock:true, updatedAt:new Date().toISOString() })
  }
}
