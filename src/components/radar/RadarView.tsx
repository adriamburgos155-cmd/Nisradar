'use client'
import { useState, useMemo } from 'react'
import type { RadarEvent, RadarCategory } from '@/lib/radar-types'
import { CATEGORY_LABELS } from '@/lib/radar-types'
import { RadarEventCard } from './RadarEventCard'
import { VolatilityGaugeCard, NasdaqSnapshotRow } from './VolatilityGauge'
import { MasterAnalysisCard } from './MasterAnalysisCard'
import { clsx } from 'clsx'

interface RadarViewProps {
  events:    RadarEvent[]
  gauge:     import('@/lib/radar-types').VolatilityGauge | null
  snapshot:  import('@/lib/radar-types').NasdaqSnapshot  | null
  fred:      unknown
  isMock:    boolean
  mockReason?: string
  isLoading: boolean
  onRefresh: () => void
}

const CATEGORIES: (RadarCategory | 'all' | 'breaking')[] = ['all', 'breaking', 'fed', 'trump', 'geopolitics', 'tech', 'market_risk']

const reasonMessages: Record<string, string> = {
  NO_KEYS:     'Agrega tus keys de Groq y Finnhub en Settings (⚙) para datos reales',
  NO_FINNHUB:  'Agrega tu key de Finnhub en Settings (⚙) para noticias en vivo',
  NO_GROQ:     'Agrega tu key de Groq en Settings (⚙) para clasificación IA',
  NO_FRESH_NEWS: 'No hay noticias nuevas en las últimas 6 horas — mostrando contexto reciente',
  CLASSIFY_FAILED: 'Error al clasificar noticias — reintentando',
  ERROR:       'Error temporal — mostrando datos de respaldo',
}

export function RadarView({ events, gauge, snapshot, fred, isMock, mockReason, isLoading, onRefresh }: RadarViewProps) {
  const [filter, setFilter] = useState<RadarCategory | 'all' | 'breaking'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return events
    if (filter === 'breaking') return events.filter(e => e.isBreaking)
    return events.filter(e => e.category === filter)
  }, [events, filter])

  const breakingCount = events.filter(e => e.isBreaking).length

  return (
    <div className="flex flex-col h-full gap-2.5 overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">radar</span>
          <span className="font-sans font-semibold text-[14px] text-on-surface">Radar Nasdaq</span>
          {isMock && mockReason && (
            <span className="font-mono text-[8px] text-warn border border-warn/30 px-1.5 py-0.5">
              {reasonMessages[mockReason] || 'Modo demo'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {breakingCount > 0 && (
            <span className="font-mono text-[8px] text-tertiary border border-tertiary/30 bg-tertiary/10 px-1.5 py-0.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-tertiary live-dot" />
              {breakingCount} alerta{breakingCount > 1 ? 's' : ''}
            </span>
          )}
          <button onClick={onRefresh} disabled={isLoading} className="text-on-surface-variant hover:text-on-surface disabled:opacity-40">
            <span className={clsx('material-symbols-outlined text-[15px]', isLoading && 'animate-spin')}>refresh</span>
          </button>
        </div>
      </div>

      {/* Nasdaq snapshot — compact */}
      <div className="shrink-0">
        <NasdaqSnapshotRow snapshot={snapshot} />
      </div>

      {/* Master Analysis — the star of the show */}
      <div className="shrink-0">
        <MasterAnalysisCard events={events} gauge={gauge} snapshot={snapshot} fred={fred} />
      </div>

      {/* Two-column: volatility + feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-2.5 flex-1 min-h-0">

        {/* Left: Volatility + filters */}
        <div className="flex flex-col gap-2.5 overflow-y-auto">
          <VolatilityGaugeCard gauge={gauge} snapshot={snapshot} />

          <div className="bg-surface-container-lowest border border-outline-variant p-2">
            <div className="font-mono text-[8px] text-outline uppercase px-1 mb-1">Filtrar</div>
            {CATEGORIES.map(cat => {
              const count = cat === 'all' ? events.length : cat === 'breaking' ? breakingCount : events.filter(e => e.category === cat).length
              const label = cat === 'all' ? 'Todos' : cat === 'breaking' ? '⚡ Alertas' : CATEGORY_LABELS[cat as RadarCategory]
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={clsx(
                    'flex items-center justify-between w-full px-2 py-1.5 font-mono text-[10px] transition-colors text-left',
                    filter === cat ? 'bg-primary/15 text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  )}
                >
                  <span>{label}</span>
                  <span className="opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Compact event feed */}
        <div className="overflow-y-auto space-y-1.5 min-h-0">
          {isLoading && filtered.length === 0 ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="bg-surface-container border border-outline-variant h-12 animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-outline py-8">
              <span className="material-symbols-outlined text-[28px] mb-2 opacity-40">radar</span>
              <div className="font-mono text-[10px]">Sin eventos en esta categoría</div>
            </div>
          ) : (
            filtered.map(ev => <RadarEventCard key={ev.id} event={ev} />)
          )}
        </div>
      </div>
    </div>
  )
}
