import type { Quote, MarketSummary, EarningsEntry, NewsItem, SectorPerf, FredObservation } from './types'

export const MOCK_MARKET: MarketSummary = {
  sp500:  { symbol:'SPX',    name:'S&P 500',       price:5611,   change:-18.4,  changePct:-0.33, open:5629,  high:5641, low:5598,  volume:1.8e9, type:'index',     updatedAt:new Date().toISOString() },
  nasdaq: { symbol:'NDX',    name:'NASDAQ 100',    price:19480,  change:42.1,   changePct:0.22,  open:19438, high:19521,low:19380, volume:1.4e9, type:'index',     updatedAt:new Date().toISOString() },
  dji:    { symbol:'DJI',    name:'Dow Jones',     price:41317,  change:-124.2, changePct:-0.30, open:41441, high:41480,low:41200, volume:310e6, type:'index',     updatedAt:new Date().toISOString() },
  vix:    { symbol:'VIX',    name:'VIX',           price:24.8,   change:1.2,    changePct:5.1,   open:23.6,  high:25.4, low:23.2,  volume:0,     type:'index',     updatedAt:new Date().toISOString() },
  xauusd: { symbol:'XAUUSD', name:'Gold XAU/USD',  price:3281,   change:18.4,   changePct:0.56,  open:3262,  high:3298, low:3255,  volume:0,     type:'commodity', updatedAt:new Date().toISOString() },
  dxy:    { symbol:'DXY',    name:'USD Index',     price:99.60,  change:-0.42,  changePct:-0.42, open:100.02,high:100.1,low:99.44, volume:0,     type:'forex',     updatedAt:new Date().toISOString() },
  oil:    { symbol:'WTI',    name:'WTI Crude',     price:58.90,  change:-0.84,  changePct:-1.41, open:59.74, high:60.1, low:58.65, volume:0,     type:'commodity', updatedAt:new Date().toISOString() },
  btcusd: { symbol:'BTC',    name:'Bitcoin',       price:96400,  change:820,    changePct:0.86,  open:95580, high:97100,low:95200, volume:28e9,  type:'crypto',    updatedAt:new Date().toISOString() },
  eurusd: { pair:'EUR/USD',  base:'EUR', quote:'USD', rate:1.1320, change:0.0048, changePct:0.43,  updatedAt:new Date().toISOString() },
  gbpusd: { pair:'GBP/USD',  base:'GBP', quote:'USD', rate:1.3310, change:-0.0021,changePct:-0.16, updatedAt:new Date().toISOString() },
  usdjpy: { pair:'USD/JPY',  base:'USD', quote:'JPY', rate:144.20, change:-0.84,  changePct:-0.58, updatedAt:new Date().toISOString() },
}

export const MOCK_EARNINGS: EarningsEntry[] = [
  { symbol:'AAPL',  company:'Apple',             date:'2026-05-01', epsEst:1.62,  epsActual:null, revEst:94e9,   revActual:null,   status:'today' },
  { symbol:'AMZN',  company:'Amazon',            date:'2026-05-01', epsEst:1.63,  epsActual:null, revEst:177e9,  revActual:null,   status:'today' },
  { symbol:'MSFT',  company:'Microsoft',         date:'2026-04-30', epsEst:3.22,  epsActual:3.46, revEst:68e9,   revActual:70.1e9, surprise:7.5,  status:'beat' },
  { symbol:'GOOGL', company:'Alphabet',          date:'2026-04-29', epsEst:2.63,  epsActual:2.81, revEst:107e9,  revActual:109e9,  surprise:6.8,  status:'beat' },
  { symbol:'META',  company:'Meta Platforms',    date:'2026-04-30', epsEst:6.65,  epsActual:6.43, revEst:55e9,   revActual:null,   surprise:-3.3, status:'miss' },
  { symbol:'TXN',   company:'Texas Instruments', date:'2026-04-22', epsEst:1.63,  epsActual:1.68, revEst:4.65e9, revActual:4.83e9, surprise:3.1,  status:'beat' },
  { symbol:'GS',    company:'Goldman Sachs',     date:'2026-04-14', epsEst:12.35, epsActual:14.12,revEst:15.1e9, revActual:15.7e9, surprise:14.3, status:'beat' },
  { symbol:'NVDA',  company:'NVIDIA',            date:'2026-05-28', epsEst:null,  epsActual:null, revEst:null,   revActual:null,   status:'upcoming' },
]

export const MOCK_NEWS: NewsItem[] = [
  { id:'1', headline:'Fed holds rates — Powell warns tariffs create difficult inflation tradeoffs', summary:'FOMC unanimous hold at 4.25-4.50%. Powell explicitly cited tariff uncertainty.', source:'Reuters', url:'#', publishedAt:new Date().toISOString(), category:'fed', sentiment:'neutral', tickers:[] },
  { id:'2', headline:'Apple and Amazon report Q1 today after bell — services growth key', summary:'Both companies expected to show strong cloud and services momentum despite macro headwinds.', source:'CNBC', url:'#', publishedAt:new Date(Date.now()-3600000).toISOString(), category:'earnings', sentiment:'positive', tickers:['AAPL','AMZN'] },
  { id:'3', headline:'Gold surges past $3,280 as DXY weakens below 100', summary:'XAU/USD hit monthly high as dollar softened on Fed uncertainty and safe-haven demand.', source:'Bloomberg', url:'#', publishedAt:new Date(Date.now()-5400000).toISOString(), category:'macro', sentiment:'positive', tickers:[] },
  { id:'4', headline:'ISM Manufacturing PMI contracts for 2nd month — tariff uncertainty cited', summary:'New orders declined sharply. Manufacturers cite policy uncertainty as primary concern.', source:'FT', url:'#', publishedAt:new Date(Date.now()-7200000).toISOString(), category:'macro', sentiment:'negative', tickers:[] },
  { id:'5', headline:'S&P 500 closes April down 4.7% — worst month since 2022', summary:'Mixed earnings, geopolitical tensions and tariff volatility drove the selloff.', source:'WSJ', url:'#', publishedAt:new Date(Date.now()-9000000).toISOString(), category:'macro', sentiment:'negative', tickers:[] },
  { id:'6', headline:'Microsoft beats Q1: EPS $3.46 vs $3.22 est — Azure up 33%', summary:'Cloud dominance continues. Copilot seat growth exceeded expectations. Stock +4% AH.', source:'MarketWatch', url:'#', publishedAt:new Date(Date.now()-10800000).toISOString(), category:'earnings', sentiment:'positive', tickers:['MSFT'] },
]

export const MOCK_SECTORS: SectorPerf[] = [
  { name:'Technology',    change:0.94,  ytd:-6.2  },
  { name:'Energy',        change:1.24,  ytd:-3.8  },
  { name:'Healthcare',    change:0.61,  ytd:2.4   },
  { name:'Utilities',     change:0.38,  ytd:4.1   },
  { name:'Materials',     change:-0.12, ytd:-4.7  },
  { name:'Financials',    change:-0.28, ytd:1.3   },
  { name:'Industrials',   change:-0.44, ytd:-7.1  },
  { name:'Comm. Services',change:-0.57, ytd:-8.4  },
  { name:'Consumer Disc.',change:-0.81, ytd:-12.3 },
  { name:'Real Estate',   change:-0.94, ytd:-5.6  },
]

// FRED mock data — realistic recent values
export function mockFredObs(baseVal: number, periods: number, trend: number, noise: number): FredObservation[] {
  const obs: FredObservation[] = []
  const now = new Date()
  let val = baseVal - trend * periods
  for (let i = periods; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    val += trend + (Math.random() - 0.5) * noise
    obs.push({ date: d.toISOString().split('T')[0], value: Math.round(val * 100) / 100 })
  }
  return obs
}

// Format helpers
export const fmt   = (n: number, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
export const fmtB  = (n: number) => n >= 1e12 ? '$'+(n/1e12).toFixed(2)+'T' : n >= 1e9 ? '$'+(n/1e9).toFixed(1)+'B' : n >= 1e6 ? '$'+(n/1e6).toFixed(1)+'M' : '$'+fmt(n)
export const timeAgo = (iso: string) => { const d=(Date.now()-new Date(iso).getTime())/1000; return d<60?`${~~d}s`:d<3600?`${~~(d/60)}m`:d<86400?`${~~(d/3600)}h`:`${~~(d/86400)}d` }
export const pctCls  = (v: number, inv = false) => { const pos = inv ? v<=0 : v>=0; return pos ? 'text-bull' : 'text-bear' }
