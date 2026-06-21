'use client'
import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { clsx } from 'clsx'

interface FxEvent {
  date:     string
  dayLabel: string
  time:     string
  currency: 'USD' | 'EUR'
  event:    string
  impact:   'high' | 'medium'
  forecast?: string
  previous?: string
  actual?:   string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const currencyFlag:  Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺' }
const currencyColor: Record<string, string> = { USD: 'text-primary', EUR: 'text-secondary' }

export function FxCalendarCard() {
  const [range, setRange] = useState<'today' | 'week'>('today')
  const { data, isLoading } = useSWR(`/api/fx-calendar?range=${range}`, fetcher, {
    refreshInterval: range === 'week' ? 7 * 24 * 3600 * 1000 : 1800000, // weekly refresh for week view, 30min for today
  })

  const events: FxEvent[] = data?.data ?? []
  const source = data?.source ?? 'fallback'
  const highCount = events.filter(e => e.impact === 'high').length

  const grouped = useMemo(() => {
    const map = new Map<string, { dayLabel: string; items: FxEvent[] }>()
    events.forEach(ev => {
      if (!map.has(ev.date)) map.set(ev.date, { dayLabel: ev.dayLabel, items: [] })
      map.get(ev.date)!.items.push(ev)
    })
    return Array.from(map.entries())
  }, [events])

  const nowLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/New_York' })

  return (
    <div className="bg-surface-container-lowest border border-outline-variant flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
          <div>
            <div className="font-sans text-[12px] font-semibold text-on-surface">Calendario USD / EUR</div>
            <div className="font-mono text-[8px] text-outline capitalize">{nowLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {source === 'live' && (
            <span className="font-mono text-[7px] text-secondary border border-secondary/30 px-1 py-0.5 flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-secondary live-dot" />LIVE
            </span>
          )}
          {highCount > 0 && (
            <span className="font-mono text-[7px] text-tertiary border border-tertiary/30 px-1 py-0.5">{highCount} ALTO</span>
          )}
        </div>
      </div>

      {/* Range toggle */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-outline-variant/50 bg-surface-container/30">
        <button
          onClick={() => setRange('today')}
          className={clsx('font-mono text-[9px] px-2.5 py-1 transition-colors',
            range === 'today' ? 'bg-primary/15 text-primary border border-primary/30' : 'text-on-surface-variant hover:text-on-surface border border-transparent'
          )}
        >
          Hoy
        </button>
        <button
          onClick={() => setRange('week')}
          className={clsx('font-mono text-[9px] px-2.5 py-1 transition-colors',
            range === 'week' ? 'bg-primary/15 text-primary border border-primary/30' : 'text-on-surface-variant hover:text-on-surface border border-transparent'
          )}
        >
          Esta Semana
        </button>
        <span className="font-mono text-[7px] text-outline ml-auto">
          {range === 'week' ? 'Actualiza semanalmente' : 'Actualiza c/30min'}
        </span>
      </div>

      {/* Events list */}
      <div className="overflow-y-auto max-h-[420px]">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {Array(5).fill(0).map((_, i) => <div key={i} className="h-10 bg-surface-container animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-outline">
            <span className="material-symbols-outlined text-[24px] mb-1 opacity-40">event_busy</span>
            <div className="font-mono text-[10px]">Sin eventos relevantes</div>
          </div>
        ) : (
          grouped.map(([date, group]) => (
            <div key={date}>
              <div className="px-3 py-1.5 bg-surface-container/60 border-b border-outline-variant/40 sticky top-0">
                <span className="font-mono text-[9px] font-bold text-on-surface-variant capitalize">{group.dayLabel}</span>
              </div>
              {group.items.map((ev, i) => (
                <div key={i} className={clsx(
                  'flex items-center gap-2.5 px-3 py-2.5 border-b border-outline-variant/30 last:border-0 hover:bg-surface-container/30 transition-colors',
                  ev.impact === 'high' && 'border-l-2 border-l-tertiary'
                )}>
                  <span className="font-mono text-[10px] text-on-surface-variant w-11 shrink-0">{ev.time}</span>
                  <span className="text-[13px] shrink-0">{currencyFlag[ev.currency]}</span>
                  <span className={clsx('font-mono text-[9px] font-bold shrink-0 w-7', currencyColor[ev.currency])}>{ev.currency}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-[11.5px] text-on-surface truncate">{ev.event}</div>
                    {(ev.forecast || ev.previous) && (
                      <div className="flex gap-2 font-mono text-[8px] text-outline mt-0.5">
                        {ev.forecast && <span>Pronóstico: <span className="text-primary">{ev.forecast}</span></span>}
                        {ev.previous && <span>Previo: <span className="text-on-surface-variant">{ev.previous}</span></span>}
                      </div>
                    )}
                  </div>
                  {ev.impact === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0" />}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
