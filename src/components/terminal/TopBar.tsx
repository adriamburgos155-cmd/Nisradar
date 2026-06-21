'use client'
import { useState, useEffect } from 'react'
import type { NasdaqSnapshot } from '@/lib/radar-types'
import { clsx } from 'clsx'

interface TopBarProps {
  snapshot: NasdaqSnapshot | null
  isMock?: boolean
  onOpenSettings: () => void
}

export function TopBar({ snapshot, isMock, onOpenSettings }: TopBarProps) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setTime(n.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'America/New_York' }))
      setDate(n.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric', timeZone:'America/New_York' }))
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [])

  const items = snapshot ? [
    { label:'NDX',  value: snapshot.ndx.price.toFixed(0), pct: snapshot.ndx.changePct },
    { label:'NQ',   value: snapshot.nq.price.toFixed(0),  pct: snapshot.nq.changePct  },
    { label:'VIX',  value: snapshot.vix.price.toFixed(2), pct: snapshot.vix.changePct },
    { label:'10Y',  value: snapshot.t10y.yield.toFixed(2)+'%', pct: snapshot.t10y.changeBps, isBps:true },
  ] : []

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-3 bg-surface-container-lowest border-b border-outline-variant">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-primary">radar</span>
          <span className="font-sans text-lg font-black tracking-tighter text-on-surface">NQ_RADAR</span>
        </div>
        <nav className="hidden md:flex items-center gap-4">
          {items.map(inst => (
            <div key={inst.label} className="flex items-center gap-1.5">
              <span className={clsx(
                'font-mono text-ticker border-b pb-0.5 cursor-pointer',
                inst.pct >= 0 ? 'text-secondary border-secondary' : 'text-tertiary border-tertiary'
              )}>
                {inst.label}: {inst.value}
              </span>
              <span className={clsx('font-mono text-[9px]', inst.pct >= 0 ? 'text-secondary' : 'text-tertiary')}>
                {inst.pct >= 0 ? '+' : ''}{inst.pct.toFixed(2)}{inst.isBps ? 'bps' : '%'}
              </span>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {isMock && (
          <span className="font-mono text-label-xs text-warn border border-warn/30 px-2 py-0.5">DEMO_DATA</span>
        )}
        <span className="text-secondary border border-secondary/30 px-2 py-0.5 font-mono text-label-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary live-dot" />
          RADAR ACTIVO
        </span>
        <span className="font-mono text-data-sm text-on-surface-variant hidden lg:block">{time} EST</span>
        <span className="font-mono text-label-xs text-outline hidden lg:block">{date}</span>
        <button onClick={onOpenSettings} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[16px]">settings</span>
        </button>
      </div>
    </header>
  )
}
