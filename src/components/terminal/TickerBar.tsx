'use client'
import type { NasdaqSnapshot } from '@/lib/radar-types'
import { clsx } from 'clsx'

export function TickerBar({ snapshot }: { snapshot: NasdaqSnapshot | null }) {
  const items = snapshot ? [
    { sym:'NDX',   val:snapshot.ndx.price.toFixed(0),  pct:snapshot.ndx.changePct },
    { sym:'NQ',    val:snapshot.nq.price.toFixed(0),   pct:snapshot.nq.changePct  },
    { sym:'VIX',   val:snapshot.vix.price.toFixed(2),  pct:snapshot.vix.changePct },
    { sym:'10Y',   val:snapshot.t10y.yield.toFixed(2)+'%', pct:snapshot.t10y.changeBps },
    { sym:'DXY',   val:snapshot.dxy.price.toFixed(2),  pct:snapshot.dxy.changePct },
  ] : [{ sym:'NDX',val:'—',pct:0 },{ sym:'NQ',val:'—',pct:0 },{ sym:'VIX',val:'—',pct:0 }]

  const doubled = [...items, ...items, ...items]

  return (
    <footer className="fixed bottom-0 left-12 md:left-44 right-0 h-6 bg-surface-container-lowest border-t border-outline-variant flex items-center overflow-hidden z-30">
      <div className="animate-marquee flex items-center gap-8 px-4 cursor-pointer">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 font-mono text-[9px]">
            <span className="text-outline">{item.sym}</span>
            <span className={clsx('font-bold', item.pct >= 0 ? 'text-secondary' : 'text-tertiary')}>{item.val}</span>
            <span className={item.pct >= 0 ? 'text-secondary/70' : 'text-tertiary/70'}>
              {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </footer>
  )
}
