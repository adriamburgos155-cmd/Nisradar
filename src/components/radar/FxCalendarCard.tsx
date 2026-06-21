'use client'
import useSWR from 'swr'
import { clsx } from 'clsx'

interface FxEvent {
  time:     string
  currency: 'USD' | 'EUR'
  event:    string
  impact:   'high' | 'medium'
  forecast?: string
  previous?: string
  actual?:   string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const currencyFlag: Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺' }
const currencyColor: Record<string, string> = { USD: 'text-primary', EUR: 'text-secondary' }

export function FxCalendarCard() {
  const { data, isLoading } = useSWR('/api/fx-calendar', fetcher, {
    refreshInterval: 1800000, // 30 min
  })

  const events: FxEvent[] = data?.data ?? []
  const source = data?.source ?? 'fallback'
  const highCount = events.filter(e => e.impact === 'high').length

  return (
    <div className="bg-surface-container-lowest border border-outline-variant flex flex-col">
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-outline-variant">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
          <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Calendario USD / EUR</span>
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

      <div className="overflow-y-auto max-h-52">
        {isLoading ? (
          <div className="p-2 space-y-1.5">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-8 bg-surface-container animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-outline">
            <span className="material-symbols-outlined text-[20px] mb-1 opacity-40">event_busy</span>
            <div className="font-mono text-[9px]">Sin eventos relevantes hoy</div>
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className={clsx(
              'flex items-center gap-2 px-2.5 py-1.5 border-b border-outline-variant/30 last:border-0',
              ev.impact === 'high' && 'border-l-2 border-l-tertiary'
            )}>
              <span className="font-mono text-[9px] text-on-surface-variant w-10 shrink-0">{ev.time}</span>
              <span className="text-[11px] shrink-0">{currencyFlag[ev.currency]}</span>
              <span className={clsx('font-mono text-[8px] font-bold shrink-0', currencyColor[ev.currency])}>{ev.currency}</span>
              <span className="font-sans text-[10.5px] text-on-surface truncate flex-1">{ev.event}</span>
              {ev.impact === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
