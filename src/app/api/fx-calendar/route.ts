import { NextResponse } from 'next/server'

interface FxEvent {
  date:     string  // ISO date, e.g. "2026-06-22"
  dayLabel: string  // "Lunes 22 Jun"
  time:     string
  currency: 'USD' | 'EUR'
  event:    string
  impact:   'high' | 'medium'
  forecast?: string
  previous?: string
  actual?:   string
}

const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function dayLabelFor(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') === 'week' ? 'week' : 'today'

  const nowEST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const todayStr = `${nowEST.getFullYear()}-${String(nowEST.getMonth()+1).padStart(2,'0')}-${String(nowEST.getDate()).padStart(2,'0')}`

  try {
    const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      next: { revalidate: 1800 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (r.ok) {
      const data = await r.json()
      const events: FxEvent[] = data
        .filter((e: { date: string; currency: string; impact: string }) => {
          const isRelevantCurrency = e.currency === 'USD' || e.currency === 'EUR'
          const isMediumOrHigh = e.impact === 'High' || e.impact === 'Medium'
          if (!isRelevantCurrency || !isMediumOrHigh) return false
          if (range === 'today') {
            const ed = new Date(e.date).toLocaleString('en-US', { timeZone: 'America/New_York' })
            const edDate = new Date(ed)
            const formatted = `${edDate.getFullYear()}-${String(edDate.getMonth()+1).padStart(2,'0')}-${String(edDate.getDate()).padStart(2,'0')}`
            return formatted === todayStr
          }
          return true // week range — keep all USD/EUR med/high events for the week
        })
        .map((e: { date: string; currency: string; impact: string; title: string; forecast?: string; previous?: string; actual?: string }) => {
          const localDate = new Date(new Date(e.date).toLocaleString('en-US', { timeZone: 'America/New_York' }))
          const isoDate = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')}`
          return {
            date:     isoDate,
            dayLabel: dayLabelFor(localDate),
            time:     new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
            currency: e.currency as 'USD' | 'EUR',
            event:    e.title,
            impact:   e.impact === 'High' ? 'high' : 'medium',
            forecast: e.forecast || undefined,
            previous: e.previous || undefined,
            actual:   e.actual   || undefined,
          }
        })
        .sort((a: FxEvent, b: FxEvent) => (a.date + a.time).localeCompare(b.date + b.time))

      if (events.length > 0) {
        return NextResponse.json({ data: events, source: 'live', range, updatedAt: new Date().toISOString() })
      }
    }
  } catch { /* fallback */ }

  // Realistic fallback spanning the week — medium/high impact USD/EUR only
  const today = nowEST
  const mkDate = (offset: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    return { iso: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, label: dayLabelFor(d) }
  }

  const t0 = mkDate(0), t1 = mkDate(1), t2 = mkDate(2)

  const fallbackToday: FxEvent[] = [
    { date: t0.iso, dayLabel: t0.label, time: '08:30', currency: 'USD', event: 'Nonfarm Payrolls', impact: 'high', forecast: '130K', previous: '177K' },
    { date: t0.iso, dayLabel: t0.label, time: '08:30', currency: 'USD', event: 'Unemployment Rate', impact: 'high', forecast: '4.2%', previous: '4.2%' },
    { date: t0.iso, dayLabel: t0.label, time: '08:30', currency: 'USD', event: 'Average Hourly Earnings m/m', impact: 'medium', forecast: '0.3%', previous: '0.2%' },
    { date: t0.iso, dayLabel: t0.label, time: '10:00', currency: 'USD', event: 'ISM Manufacturing PMI', impact: 'high', forecast: '49.5', previous: '48.7' },
    { date: t0.iso, dayLabel: t0.label, time: '05:00', currency: 'EUR', event: 'Eurozone CPI y/y', impact: 'high', forecast: '2.2%', previous: '2.3%' },
  ]

  const fallbackWeek: FxEvent[] = [
    ...fallbackToday,
    { date: t1.iso, dayLabel: t1.label, time: '08:30', currency: 'USD', event: 'Initial Jobless Claims', impact: 'medium', forecast: '225K', previous: '221K' },
    { date: t1.iso, dayLabel: t1.label, time: '08:00', currency: 'EUR', event: 'German Factory Orders m/m', impact: 'medium', forecast: '0.8%', previous: '-1.2%' },
    { date: t1.iso, dayLabel: t1.label, time: '14:00', currency: 'USD', event: 'FOMC Member Speech', impact: 'medium' },
    { date: t2.iso, dayLabel: t2.label, time: '08:30', currency: 'USD', event: 'CPI m/m', impact: 'high', forecast: '0.3%', previous: '0.3%' },
    { date: t2.iso, dayLabel: t2.label, time: '08:30', currency: 'USD', event: 'Core CPI m/m', impact: 'high', forecast: '0.3%', previous: '0.4%' },
    { date: t2.iso, dayLabel: t2.label, time: '09:00', currency: 'EUR', event: 'ECB President Speech', impact: 'medium' },
  ]

  return NextResponse.json({
    data: range === 'week' ? fallbackWeek : fallbackToday,
    source: 'fallback', range,
    updatedAt: new Date().toISOString(),
  })
}
