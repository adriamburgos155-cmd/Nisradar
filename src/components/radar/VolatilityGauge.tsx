'use client'
import type { VolatilityGauge, NasdaqSnapshot } from '@/lib/radar-types'
import { clsx } from 'clsx'

const regimeConfig = {
  low:      { color:'#4edea3', label:'BAJA',      bg:'bg-secondary/10', border:'border-secondary/30', text:'text-secondary' },
  normal:   { color:'#adc6ff', label:'NORMAL',    bg:'bg-primary/10',   border:'border-primary/30',   text:'text-primary'   },
  elevated: { color:'#ffd166', label:'ELEVADA',   bg:'bg-warn/10',      border:'border-warn/30',      text:'text-warn'      },
  extreme:  { color:'#ff5451', label:'EXTREMA',   bg:'bg-tertiary/10',  border:'border-tertiary/30',  text:'text-tertiary'  },
}

export function VolatilityGaugeCard({ gauge, snapshot }: { gauge: VolatilityGauge | null; snapshot: NasdaqSnapshot | null }) {
  if (!gauge || !snapshot) {
    return <div className="bg-surface-container border border-outline-variant h-40 animate-pulse" />
  }

  const cfg = regimeConfig[gauge.regime]
  const needleRotation = Math.min(Math.max((gauge.vix / 50) * 180 - 90, -90), 90) // -90 to 90deg

  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">speed</span>
          <span className="font-mono text-label-xs text-outline uppercase tracking-wider">Volatilidad Actual</span>
        </div>
        <span className={clsx('font-mono text-[9px] font-bold px-2 py-0.5 border uppercase', cfg.bg, cfg.border, cfg.text)}>
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-center mb-3">
        {/* Gauge visual */}
        <div className="relative w-24 h-14 overflow-hidden">
          <svg viewBox="0 0 100 55" className="w-24 h-14">
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
            <circle cx="50" cy="50" r="3" fill="#e5e2e1" />
          </svg>
        </div>

        {/* VIX number */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-on-surface">{gauge.vix.toFixed(2)}</span>
            <span className={clsx('font-mono text-[11px] font-bold', gauge.vixChangePct >= 0 ? 'text-tertiary' : 'text-secondary')}>
              {gauge.vixChangePct >= 0 ? '▲' : '▼'} {Math.abs(gauge.vixChangePct).toFixed(2)}%
            </span>
          </div>
          <div className="font-sans text-[10px] text-on-surface-variant mt-0.5">{gauge.regimeLabel}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/50">
        <div>
          <div className="font-mono text-[8px] text-outline uppercase">Movimiento Diario Esperado</div>
          <div className="font-mono text-[13px] font-bold text-on-surface">±{gauge.expectedDailyMove.toFixed(2)}%</div>
        </div>
        <div>
          <div className="font-mono text-[8px] text-outline uppercase">Percentil 30D</div>
          <div className="font-mono text-[13px] font-bold text-on-surface">{gauge.percentile30d}º</div>
        </div>
      </div>
    </div>
  )
}

// Nasdaq quick snapshot — compact row of key metrics
export function NasdaqSnapshotRow({ snapshot }: { snapshot: NasdaqSnapshot | null }) {
  if (!snapshot) return <div className="bg-surface-container border border-outline-variant h-20 animate-pulse" />

  const items = [
    { label:'NASDAQ 100', value: snapshot.ndx.price.toFixed(0), pct: snapshot.ndx.changePct, sub:`H ${snapshot.ndx.high.toFixed(0)} / L ${snapshot.ndx.low.toFixed(0)}` },
    { label:'NQ FUTURES',  value: snapshot.nq.price.toFixed(0),  pct: snapshot.nq.changePct,  sub:'CME Globex' },
    { label:'10Y YIELD',   value: snapshot.t10y.yield.toFixed(2)+'%', pct: snapshot.t10y.changeBps, sub:'Treasury', isBps:true },
    { label:'DXY',         value: snapshot.dxy.price.toFixed(2), pct: snapshot.dxy.changePct, sub:'USD Index' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {items.map(it => (
        <div key={it.label} className="bg-surface-container border border-outline-variant p-2.5">
          <div className="font-mono text-[9px] text-outline uppercase tracking-wider">{it.label}</div>
          <div className="font-mono text-base font-bold text-on-surface mt-0.5">{it.value}</div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={clsx('font-mono text-[10px] font-bold', it.pct >= 0 ? 'text-secondary' : 'text-tertiary')}>
              {it.pct >= 0 ? '+' : ''}{it.pct.toFixed(2)}{it.isBps ? 'bps' : '%'}
            </span>
            <span className="font-mono text-[8px] text-outline">{it.sub}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
