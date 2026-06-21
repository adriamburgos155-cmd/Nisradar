'use client'
import type { VolatilityGauge, NasdaqSnapshot } from '@/lib/radar-types'
import { clsx } from 'clsx'

const regimeConfig = {
  low:      { label:'BAJA',    bg:'bg-secondary/10', border:'border-secondary/30', text:'text-secondary' },
  normal:   { label:'NORMAL',  bg:'bg-primary/10',   border:'border-primary/30',   text:'text-primary'   },
  elevated: { label:'ELEVADA', bg:'bg-warn/10',      border:'border-warn/30',      text:'text-warn'      },
  extreme:  { label:'EXTREMA', bg:'bg-tertiary/10',  border:'border-tertiary/30',  text:'text-tertiary'  },
}

export function VolatilityGaugeCard({ gauge }: { gauge: VolatilityGauge | null; snapshot?: NasdaqSnapshot | null }) {
  if (!gauge) return <div className="bg-surface-container border border-outline-variant h-28 animate-pulse" />
  const cfg = regimeConfig[gauge.regime]
  const needleRotation = Math.min(Math.max((gauge.vix / 50) * 180 - 90, -90), 90)

  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Volatilidad</span>
        <span className={clsx('font-mono text-[8px] font-bold px-1.5 py-0.5 border uppercase', cfg.bg, cfg.border, cfg.text)}>
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2.5 items-center mb-2">
        <svg viewBox="0 0 100 55" className="w-16 h-9">
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="#1c1b1b" strokeWidth="8" />
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="url(#vixGrad)" strokeWidth="8"
            strokeDasharray={`${Math.min(gauge.vix/50,1)*141} 141`} strokeLinecap="round" />
          <defs>
            <linearGradient id="vixGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#4edea3" />
              <stop offset="40%"  stopColor="#adc6ff" />
              <stop offset="70%"  stopColor="#ffd166" />
              <stop offset="100%" stopColor="#ff5451" />
            </linearGradient>
          </defs>
          <line x1="50" y1="50" x2={50 + 38*Math.cos((needleRotation-90)*Math.PI/180)} y2={50 + 38*Math.sin((needleRotation-90)*Math.PI/180)}
            stroke="#e5e2e1" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="50" r="2.5" fill="#e5e2e1" />
        </svg>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold text-on-surface">{gauge.vix.toFixed(2)}</span>
            <span className={clsx('font-mono text-[10px] font-bold', gauge.vixChangePct >= 0 ? 'text-tertiary' : 'text-secondary')}>
              {gauge.vixChangePct >= 0 ? '▲' : '▼'}{Math.abs(gauge.vixChangePct).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-outline-variant/50">
        <div>
          <div className="font-mono text-[7px] text-outline uppercase">Mov. Esperado</div>
          <div className="font-mono text-[11px] font-bold text-on-surface">±{gauge.expectedDailyMove.toFixed(2)}%</div>
        </div>
        <div>
          <div className="font-mono text-[7px] text-outline uppercase">Percentil 30D</div>
          <div className="font-mono text-[11px] font-bold text-on-surface">{gauge.percentile30d}º</div>
        </div>
      </div>
    </div>
  )
}

export function NasdaqSnapshotRow({ snapshot }: { snapshot: NasdaqSnapshot | null }) {
  if (!snapshot) return <div className="bg-surface-container border border-outline-variant h-16 animate-pulse" />

  const items = [
    { label:'NASDAQ 100', value: snapshot.ndx.price.toFixed(0), pct: snapshot.ndx.changePct },
    { label:'NQ FUTUROS', value: snapshot.nq.price.toFixed(0),  pct: snapshot.nq.changePct  },
    { label:'10Y',        value: snapshot.t10y.yield.toFixed(2)+'%', pct: snapshot.t10y.changeBps, isBps:true },
    { label:'DXY',        value: snapshot.dxy.price.toFixed(2), pct: snapshot.dxy.changePct },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
      {items.map(it => (
        <div key={it.label} className="bg-surface-container border border-outline-variant px-2.5 py-2 flex items-center justify-between">
          <div>
            <div className="font-mono text-[8px] text-outline uppercase tracking-wider">{it.label}</div>
            <div className="font-mono text-[14px] font-bold text-on-surface leading-tight">{it.value}</div>
          </div>
          <span className={clsx('font-mono text-[10px] font-bold', it.pct >= 0 ? 'text-secondary' : 'text-tertiary')}>
            {it.pct >= 0 ? '+' : ''}{it.pct.toFixed(2)}{it.isBps ? 'bp' : '%'}
          </span>
        </div>
      ))}
    </div>
  )
}
