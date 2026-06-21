import { NextResponse } from 'next/server'

interface FxEvent {
  time:     string
  currency: 'USD' | 'EUR'
  event:    string
  impact:   'high' | 'medium'
  forecast?: string
  previous?: string
  actual?:   string
}

export async function GET() {
  const todayEST = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }).split(',')[0]
  const [m, d, y] = todayEST.split('/')
  const dateStr = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`

  try {
    const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      next: { revalidate: 1800 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (r.ok) {
      const data = await r.json()
      const events: FxEvent[] = data
        .filter((e: { date: string; currency: string; impact: string }) => {
          const ed = new Date(e.date).toLocaleString('en-US', { timeZone: 'America/New_York' }).split(',')[0]
          const [em, edd, ey] = ed.split('/')
          const formatted = `${ey}-${em.padStart(2,'0')}-${edd.padStart(2,'0')}`
          const isToday = formatted === dateStr
          const isRelevantCurrency = e.currency === 'USD' || e.currency === 'EUR'
          const isMediumOrHigh = e.impact === 'High' || e.impact === 'Medium'
          return isToday && isRelevantCurrency && isMediumOrHigh
        })
        .map((e: { date: string; currency: string; impact: string; title: string; forecast?: string; previous?: string; actual?: string }) => ({
          time:     new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }),
          currency: e.currency as 'USD' | 'EUR',
          event:    e.title,
          impact:   e.impact === 'High' ? 'high' : 'medium',
          forecast: e.forecast || undefined,
          previous: e.previous || undefined,
          actual:   e.actual   || undefined,
        }))
        .sort((a: FxEvent, b: FxEvent) => a.time.localeCompare(b.time))

      if (events.length > 0) {
        return NextResponse.json({ data: events, source: 'live', updatedAt: new Date().toISOString() })
      }
    }
  } catch { /* fallback */ }

  // Realistic fallback — medium/high impact USD/EUR events only
  const fallback: FxEvent[] = [
    { time: '08:30', currency: 'USD', event: 'Nonfarm Payrolls', impact: 'high', forecast: '130K', previous: '177K' },
    { time: '08:30', currency: 'USD', event: 'Unemployment Rate', impact: 'high', forecast: '4.2%', previous: '4.2%' },
    { time: '08:30', currency: 'USD', event: 'Average Hourly Earnings m/m', impact: 'medium', forecast: '0.3%', previous: '0.2%' },
    { time: '10:00', currency: 'USD', event: 'ISM Manufacturing PMI', impact: 'high', forecast: '49.5', previous: '48.7' },
    { time: '08:00', currency: 'EUR', event: 'German Factory Orders m/m', impact: 'medium', forecast: '0.8%', previous: '-1.2%' },
    { time: '05:00', currency: 'EUR', event: 'Eurozone CPI y/y', impact: 'high', forecast: '2.2%', previous: '2.3%' },
    { time: '14:00', currency: 'USD', event: 'FOMC Member Speech', impact: 'medium' },
  ]

  return NextResponse.json({ data: fallback, source: 'fallback', updatedAt: new Date().toISOString() })
}
