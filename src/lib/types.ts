export interface Quote {
  symbol: string; name: string; price: number; change: number; changePct: number
  open: number; high: number; low: number; volume: number
  type: 'stock'|'index'|'forex'|'commodity'|'crypto'; updatedAt: string
}
export interface ForexRate {
  pair: string; base: string; quote: string
  rate: number; change: number; changePct: number; updatedAt: string
}
export interface MarketSummary {
  sp500: Quote; nasdaq: Quote; dji: Quote; vix: Quote
  xauusd: Quote; dxy: Quote; oil: Quote; btcusd: Quote
  eurusd: ForexRate; gbpusd: ForexRate; usdjpy: ForexRate
}
export interface OHLCV {
  time: string; open: number; high: number; low: number; close: number; volume: number
}
export interface EarningsEntry {
  symbol: string; company: string; date: string
  epsEst: number|null; epsActual: number|null
  revEst: number|null; revActual: number|null
  surprise?: number; status: 'beat'|'miss'|'inline'|'upcoming'|'today'
}
export interface NewsItem {
  id: string; headline: string; summary: string; source: string
  url: string; publishedAt: string
  category: 'earnings'|'macro'|'geopolitics'|'energy'|'general'|'fed'
  sentiment: 'positive'|'negative'|'neutral'; tickers?: string[]
}
export interface SectorPerf { name: string; change: number; ytd: number }
export interface CalendarEvent {
  time: string; country: string; event: string
  impact: 'high'|'medium'|'low'
  forecast?: string; previous?: string; actual?: string
}
export interface ChatMessage {
  id: string; role: 'user'|'assistant'; content: string; ts: string
}

// ─── FRED ────────────────────────────────────────────────
export interface FredObservation {
  date: string; value: number | null
}
export interface FredSeries {
  id: string; title: string; units: string
  frequency: string; lastUpdated: string
  observations: FredObservation[]
}
export interface FredRelease {
  id: number; name: string; date: string
  notes?: string; link?: string
}
export interface FredDollarAnalysis {
  dxy:         FredSeries  // DXY proxy via DTWEXBGS
  cpi:         FredSeries  // CPIAUCSL
  coreCpi:     FredSeries  // CPILFESL
  fedFunds:    FredSeries  // FEDFUNDS
  t10y:        FredSeries  // DGS10
  t2y:         FredSeries  // DGS2
  yield_spread:FredSeries  // T10Y2Y
  m2:          FredSeries  // M2SL
  unemployment:FredSeries  // UNRATE
  gdp:         FredSeries  // GDP
  pce:         FredSeries  // PCEPI
  releases:    FredRelease[]
}
