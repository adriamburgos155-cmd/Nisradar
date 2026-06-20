'use client'
import { useState, useMemo } from 'react'
import type { RadarEvent, RadarCategory } from '@/lib/radar-types'
import { CATEGORY_LABELS } from '@/lib/radar-types'
import { RadarEventCard } from './RadarEventCard'
import { VolatilityGaugeCard, NasdaqSnapshotRow } from './VolatilityGauge'
import { clsx } from 'clsx'

interface RadarViewProps {
  events:    RadarEvent[]
  gauge:     import('@/lib/radar-types').VolatilityGauge | null
  snapshot:  import('@/lib/radar-types').NasdaqSnapshot  | null
  isMock:    boolean
  isLoading: boolean
  onRefresh: () => void
}

const CATEGORIES: (RadarCategory | 'all' | 'breaking')[] = ['all', 'breaking', 'fed', 'trump', 'geopolitics', 'tech', 'market_risk']

export function RadarView({ events, gauge, snapshot, isMock, isLoading, onRefresh }: RadarViewProps) {
  const [filter, setFilter] = useState<RadarCategory | 'all' | 'breaking'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return events
    if (filter === 'breaking') return events.filter(e => e.isBreaking)
    return events.filter(e => e.category === filter)
  }, [events, filter])

  const breakingCount = events.filter(e => e.isBreaking).length
  const highImportance = events.filter(e => e.importance === 'alta').length

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">radar</span>
          <div>
            <div className="font-sans font-bold text-headline-sm text-on-surface">Nasdaq Risk Radar</div>
            <div className="font-mono text-label-xs text-outline">Filtrado IA · Solo eventos relevantes para NQ/MNQ</div>
          </div>
          {isMock && <span className="font-mono text-[9px] text-warn border border-warn/30 px-1.5 py-0.5">DEMO — Add GROQ + FINNHUB keys</span>}
        </div>
        <div className="flex items-center gap-2">
          {breakingCount > 0 && (
            <span className="font-mono text-[9px] text-tertiary border border-tertiary/30 bg-tertiary/10 px-2 py-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary live-dot" />
              {breakingCount} ALERTA{breakingCount > 1 ? 'S' : ''}
            </span>
          )}
          <button onClick={onRefresh} disabled={isLoading} className="text-on-surface-variant hover:text-on-surface disabled:opacity-40">
            <span className={clsx('material-symbols-outlined text-[16px]', isLoading && 'animate-spin')}>refresh</span>
          </button>
        </div>
      </div>

      {/* Snapshot row */}
      <div className="shrink-0">
        <NasdaqSnapshotRow snapshot={snapshot} />
      </div>

      {/* Volatility + filters layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3 flex-1 min-h-0">

        {/* Left: Volatility gauge + stats */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          <VolatilityGaugeCard gauge={gauge} snapshot={snapshot} />

          {/* Quick stats */}
          <div className="bg-surface-container-lowest border border-outline-variant p-3">
            <div className="font-mono text-label-xs text-outline uppercase mb-2">Resumen del Radar</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-sans text-[11px] text-on-surface-variant">Eventos activos</span>
                <span className="font-mono text-[13px] font-bold text-on-surface">{events.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans text-[11px] text-on-surface-variant">🔴 Importancia alta</span>
                <span className="font-mono text-[13px] font-bold text-tertiary">{highImportance}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans text-[11px] text-on-surface-variant">⚡ Alertas inmediatas</span>
                <span className="font-mono text-[13px] font-bold text-warn">{breakingCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans text-[11px] text-on-surface-variant">📈 Sesgo alcista</span>
                <span className="font-mono text-[13px] font-bold text-secondary">{events.filter(e=>e.impactDirection==='alcista').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans text-[11px] text-on-surface-variant">📉 Sesgo bajista</span>
                <span className="font-mono text-[13px] font-bold text-tertiary">{events.filter(e=>e.impactDirection==='bajista').length}</span>
              </div>
            </div>
          </div>

          {/* Category filter buttons - vertical on desktop */}
          <div className="bg-surface-container-lowest border border-outline-variant p-2 flex flex-col gap-1">
            <div className="font-mono text-label-xs text-outline uppercase px-1 mb-1">Filtrar por categoría</div>
            {CATEGORIES.map(cat => {
              const count = cat === 'all' ? events.length : cat === 'breaking' ? breakingCount : events.filter(e => e.category === cat).length
              const label = cat === 'all' ? 'Todos' : cat === 'breaking' ? '⚡ Alertas' : CATEGORY_LABELS[cat as RadarCategory]
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={clsx(
                    'flex items-center justify-between px-2 py-1.5 font-mono text-[10px] transition-colors text-left',
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

        {/* Right: Event feed */}
        <div className="overflow-y-auto space-y-2 min-h-0">
          {isLoading && filtered.length === 0 ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="bg-surface-container border border-outline-variant h-44 animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-outline py-12">
              <span className="material-symbols-outlined text-[36px] mb-2 opacity-40">radar</span>
              <div className="font-mono text-[11px]">No hay eventos en esta categoría ahora mismo</div>
            </div>
          ) : (
            filtered.map(ev => <RadarEventCard key={ev.id} event={ev} />)
          )}
        </div>
      </div>
    </div>
  )
}
