'use client'
import type { RadarEvent } from '@/lib/radar-types'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/radar-types'
import { clsx } from 'clsx'

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 60)    return `${Math.floor(d)}s`
  if (d < 3600)  return `${Math.floor(d/60)}m`
  if (d < 86400) return `${Math.floor(d/3600)}h`
  return `${Math.floor(d/86400)}d`
}

const importanceDot: Record<string,string> = { alta:'bg-tertiary', media:'bg-warn', baja:'bg-outline' }
const importanceLabel: Record<string,string> = { alta:'🔴 ALTA', media:'🟠 MEDIA', baja:'🟢 BAJA' }
const directionStyle: Record<string,string> = {
  alcista: 'text-secondary border-secondary/30 bg-secondary/10',
  bajista: 'text-tertiary border-tertiary/30 bg-tertiary/10',
  neutral: 'text-outline border-outline/30 bg-outline/10',
}
const directionIcon: Record<string,string> = { alcista:'trending_up', bajista:'trending_down', neutral:'trending_flat' }
const volProbColor: Record<string,string> = { alta:'text-tertiary', media:'text-warn', baja:'text-secondary' }

export function RadarEventCard({ event }: { event: RadarEvent }) {
  return (
    <div className={clsx(
      'bg-surface-container-lowest border border-outline-variant relative',
      event.isBreaking && 'border-l-2 border-l-tertiary'
    )}>
      {event.isBreaking && (
        <div className="bg-tertiary/15 border-b border-tertiary/30 px-3 py-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[12px] text-tertiary live-dot">bolt</span>
          <span className="font-mono text-[9px] font-bold text-tertiary uppercase tracking-wider">
            Alerta Inmediata {event.isDeveloping && '· En Desarrollo'}
          </span>
        </div>
      )}

      <div className="p-3">
        {/* Top row: category + importance + time */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-primary">{CATEGORY_ICONS[event.category]}</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-primary">{CATEGORY_LABELS[event.category]}</span>
            <span className="text-outline">·</span>
            <span className="font-mono text-[9px] text-outline">{timeAgo(event.publishedAt)} ago</span>
          </div>
          <span className="font-mono text-[10px] font-bold">{importanceLabel[event.importance]}</span>
        </div>

        {/* Headline */}
        <h3 className="font-sans text-[13px] font-semibold text-on-surface leading-snug mb-1.5">
          {event.headline}
        </h3>

        {/* Summary */}
        <p className="font-sans text-[11.5px] text-on-surface-variant leading-relaxed mb-2">
          {event.summary}
        </p>

        {/* Why it matters */}
        <div className="bg-surface-container border-l-2 border-primary/40 px-2.5 py-2 mb-3">
          <div className="font-mono text-[8px] uppercase tracking-wider text-primary mb-1">Por qué importa</div>
          <div className="font-sans text-[11px] text-on-surface-variant leading-relaxed">{event.whyItMatters}</div>
        </div>

        {/* Metrics row */}
        <div className="flex items-center flex-wrap gap-2 mb-2.5">
          <span className={clsx('flex items-center gap-1 px-2 py-1 border font-mono text-[10px] font-bold uppercase', directionStyle[event.impactDirection])}>
            <span className="material-symbols-outlined text-[12px]">{directionIcon[event.impactDirection]}</span>
            {event.impactDirection}
          </span>
          <div className="flex items-center gap-1 px-2 py-1 bg-surface-container border border-outline-variant">
            <span className="font-mono text-[9px] text-outline">FUERZA</span>
            <span className="font-mono text-[11px] font-bold text-on-surface">{event.impactStrength}/10</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-surface-container border border-outline-variant">
            <span className="font-mono text-[9px] text-outline">VOLATILIDAD</span>
            <span className={clsx('font-mono text-[10px] font-bold uppercase', volProbColor[event.volatilityProb])}>{event.volatilityProb}</span>
          </div>
        </div>

        {/* Watch assets + source */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-outline-variant/50">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[8px] text-outline uppercase">Vigilar:</span>
            {event.watchAssets.map(a => (
              <span key={a} className="font-mono text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">{a}</span>
            ))}
          </div>
          <a href={event.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] text-outline hover:text-primary transition-colors flex items-center gap-1">
            {event.source}
            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
          </a>
        </div>
      </div>
    </div>
  )
}

// Impact strength bar — quick visual gauge
export function ImpactBar({ strength, direction }: { strength: number; direction: string }) {
  const color = direction === 'alcista' ? '#4edea3' : direction === 'bajista' ? '#ff5451' : '#8c909f'
  return (
    <div className="w-full h-1 bg-surface-container-low">
      <div className="h-full" style={{ width: `${strength*10}%`, background: color }} />
    </div>
  )
}
