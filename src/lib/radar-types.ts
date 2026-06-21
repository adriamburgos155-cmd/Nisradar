// ─── Nasdaq Risk Radar — Core Types ──────────────────────

export type ImpactDirection = 'alcista' | 'bajista' | 'neutral'
export type ImportanceLevel = 'alta' | 'media' | 'baja'
export type VolatilityProb  = 'baja' | 'media' | 'alta'

export type RadarCategory =
  | 'fed'           // Reserva Federal, tasas, FOMC, inflación, empleo
  | 'trump'         // Trump, aranceles, X posts, comercio
  | 'geopolitics'   // Irán, China-Taiwán, Rusia-Ucrania, infraestructura
  | 'tech'          // NVIDIA, MSFT, AAPL, AMZN, META, GOOGL, OpenAI, AMD, AVGO
  | 'market_risk'   // VIX, flujos institucionales, OPEX, liquidez

export interface RadarEvent {
  id:                string
  headline:          string
  summary:           string            // resumen <3 líneas
  whyItMatters:       string            // por qué importa específicamente al Nasdaq
  source:            string
  url:               string
  publishedAt:       string
  category:          RadarCategory
  importance:        ImportanceLevel
  impactDirection:   ImpactDirection
  impactStrength:    number             // 1-10
  volatilityProb:    VolatilityProb
  watchAssets:       string[]           // ['NQ','MNQ','ES','VIX','10Y']
  isBreaking:        boolean            // alerta inmediata, info en desarrollo
  isDeveloping?:     boolean            // no confirmado completamente
  tickers?:          string[]
}

export interface NasdaqSnapshot {
  ndx:          { price: number; changePct: number; high: number; low: number }
  nq:           { price: number; changePct: number }       // futures
  vix:          { price: number; changePct: number; regime: 'low'|'normal'|'elevated'|'extreme' }
  t10y:         { yield: number; changeBps: number }
  dxy:          { price: number; changePct: number }
  breadth?:     { advancing: number; declining: number }
}

export interface VolatilityGauge {
  vix:              number
  vixChangePct:     number
  regime:           'low' | 'normal' | 'elevated' | 'extreme'
  regimeLabel:      string
  expectedDailyMove:number   // % implied by VIX
  percentile30d:    number   // where VIX sits vs last 30 days
}

export const CATEGORY_LABELS: Record<RadarCategory, string> = {
  fed:          'Reserva Federal',
  trump:        'Trump / Comercio',
  geopolitics:  'Geopolítica',
  tech:         'Tech / IA',
  market_risk:  'Riesgo de Mercado',
}

export const CATEGORY_ICONS: Record<RadarCategory, string> = {
  fed:          'account_balance',
  trump:        'campaign',
  geopolitics:  'public',
  tech:         'memory',
  market_risk:  'monitoring',
}
