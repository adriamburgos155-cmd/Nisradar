'use client'
import { clsx } from 'clsx'

export type NavPage = 'radar' | 'fred' | 'chat'

interface SidebarProps {
  active: NavPage
  onChange: (p: NavPage) => void
  hasGroqKey: boolean
  onOpenSettings: () => void
}

const NAV: { id: NavPage; icon: string; label: string }[] = [
  { id:'radar', icon:'radar',     label:'Radar Nasdaq' },
  { id:'fred',  icon:'analytics', label:'Fed / Macro'  },
]

export function Sidebar({ active, onChange, hasGroqKey, onOpenSettings }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-10 bottom-0 z-40 flex flex-col bg-surface-container-lowest border-r border-outline-variant w-12 md:w-44">
      <div className="hidden md:block px-3 py-4 border-b border-outline-variant">
        <div className="font-sans font-bold text-[11px] tracking-widest uppercase text-on-surface">NQ_RADAR</div>
        <div className="font-mono text-[9px] text-outline uppercase mt-0.5">Risk Terminal</div>
      </div>

      <nav className="flex flex-col gap-0.5 p-1.5 flex-1">
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => onChange(n.id)}
            className={clsx(
              'flex items-center gap-2.5 px-2 py-2 transition-all duration-100 text-left w-full',
              active === n.id
                ? 'bg-primary/10 text-primary border-r-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            )}
          >
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">{n.icon}</span>
            <span className="hidden md:block font-sans text-[12px] font-medium">{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-2 border-t border-outline-variant flex flex-col gap-2">
        <div className={clsx(
          'px-2 py-1.5 text-[10px] font-bold text-center cursor-pointer border hidden md:block',
          hasGroqKey
            ? 'bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20'
            : 'bg-warn/10 border-warn/30 text-warn hover:bg-warn/20'
        )} onClick={onOpenSettings}>
          {hasGroqKey ? 'RADAR_AI_ACTIVE' : 'ADD_API_KEY'}
        </div>
        <button onClick={onOpenSettings} className="flex items-center gap-2.5 px-2 py-1.5 text-on-surface-variant hover:text-on-surface w-full">
          <span className="material-symbols-outlined text-[18px]">api</span>
          <span className="hidden md:block font-sans text-[11px]">API Config</span>
        </button>
      </div>
    </aside>
  )
}
