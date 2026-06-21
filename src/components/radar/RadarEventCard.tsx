'use client'
import { useState } from 'react'
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

const importanceLabel: Record<string,string> = { alta:'🔴', media:'🟠', baja:'🟢' }
const directionStyle: Record<string,string> = {
  alcista: 'text-secondary border-secondary/30 bg-secondary/10',
  bajista: 'text-tertiary border-tertiary/30 bg-tertiary/10',
  neutral: 'text-outline border-outline/30 bg-outline/10',
}
const directionIcon: Record<string,string> = { alcista:'trending_up', bajista:'trending_down', neutral:'trending_flat' }
const volProbColor: Record<string,string> = { alta:'text-tertiary', media:'text-warn', baja:'text-secondary' }

export function RadarEventCard({ event }: { event: RadarEvent }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={clsx(
      'bg-surface-container-lowest border border-outline-variant',
      event.isBreaking && 'border-l-2 border-l-tertiary'
    )}>
      {event.isBreaking && (
        <div className="bg-tertiary/15 border-b border-tertiary/30 px-3 py-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[11px] text-tertiary live-dot">bolt</span>
          <span className="font-mono text-[8px] font-bold text-tertiary uppercase tracking-wider">
            Alerta {event.isDeveloping && '· En desarrollo'}
          </span>
        </div>
      )}

      {/* Compact header row — always visible */}
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left p-2.5 hover:bg-surface-container/40 transition-colors">
        <div className="flex items-start gap-2">
          <span className="text-[12px] mt-0.5 shrink-0">{importanceLabel[event.importance]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="material-symbols-outlined text-[12px] text-primary">{CATEGORY_ICONS[event.category]}</span>
              <span className="font-mono text-[8px] uppercase text-primary">{CATEGORY_LABELS[event.category]}</span>
              <span className="text-outline text-[9px]">·</span>
              <span className="font-mono text-[8px] text-outline">{timeAgo(event.publishedAt)}</span>
              <span className={clsx('flex items-center gap-0.5 px-1.5 py-0.5 border font-mono text-[8px] font-bold uppercase ml-auto', directionStyle[event.impactDirection])}>
                <span className="material-symbols-outlined text-[10px]">{directionIcon[event.impactDirection]}</span>
                {event.impactStrength}/10
              </span>
            </div>
            <h3 className="font-sans text-[12.5px] font-medium text-on-surface leading-snug">
              {event.headline}
            </h3>
          </div>
          <span className="material-symbols-outlined text-[16px] text-outline shrink-0">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-outline-variant/50 pt-2">
          <p className="font-sans text-[11px] text-on-surface-variant leading-relaxed">{event.summary}</p>

          <div className="bg-surface-container border-l-2 border-primary/40 px-2 py-1.5">
            <div className="font-mono text-[7px] uppercase tracking-wider text-primary mb-0.5">Por qué importa</div>
            <div className="font-sans text-[10.5px] text-on-surface-variant leading-relaxed">{event.whyItMatters}</div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[7px] text-outline uppercase">Vigilar:</span>
              {event.watchAssets.map(a => (
                <span key={a} className="font-mono text-[8px] px-1 py-0.5 bg-primary/10 text-primary border border-primary/20">{a}</span>
              ))}
              <span className={clsx('font-mono text-[8px] px-1 py-0.5 border', volProbColor[event.volatilityProb], 'border-current/30')}>
                VOL {event.volatilityProb.toUpperCase()}
              </span>
            </div>
            <a href={event.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="font-mono text-[8px] text-outline hover:text-primary transition-colors flex items-center gap-0.5">
              {event.source}
              <span className="material-symbols-outlined text-[9px]">open_in_new</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
