'use client'
import { useState, useEffect } from 'react'
import { useRadar, useVolatility } from '@/hooks/useRadarData'
import { useFred } from '@/hooks/useMarketData'

import { TopBar }        from '@/components/terminal/TopBar'
import { Sidebar }       from '@/components/terminal/Sidebar'
import type { NavPage }  from '@/components/terminal/Sidebar'
import { TickerBar }     from '@/components/terminal/TickerBar'
import { SettingsPanel } from '@/components/terminal/SettingsPanel'
import { RadarView }     from '@/components/radar/RadarView'
import { FredView }      from '@/components/fred/FredView'
import { ChatPanel }     from '@/components/chat/ChatPanel'

export default function Terminal() {
  const { events, isMock: radarMock, isLoading: radarLoading, refresh: refreshRadar } = useRadar()
  const { gauge, snapshot, isMock: volMock }  = useVolatility()
  const { fred, isMock: fredMock }            = useFred()

  const [page,         setPage]        = useState<NavPage>('radar')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [chatOpen,     setChatOpen]     = useState(false)
  const [hasKey,       setHasKey]       = useState(false)

  useEffect(() => {
    const check = () => setHasKey(!!localStorage.getItem('gi_groq_key'))
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [settingsOpen])

  return (
    <div className="h-screen flex flex-col bg-black text-on-surface overflow-hidden">
      <TopBar snapshot={snapshot} isMock={volMock} onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex flex-1 min-h-0 pt-10 pb-6">
        <Sidebar active={page} onChange={setPage} hasGroqKey={hasKey} onOpenSettings={() => setSettingsOpen(true)} />

        <main className="flex-1 min-w-0 ml-12 md:ml-44 overflow-hidden px-3 pt-3 pb-1">
          {page === 'radar' && (
            <RadarView
              events={events}
              gauge={gauge}
              snapshot={snapshot}
              isMock={radarMock || volMock}
              isLoading={radarLoading}
              onRefresh={refreshRadar}
            />
          )}
          {page === 'fred' && (
            <FredView fred={fred} isMock={fredMock} />
          )}
        </main>
      </div>

      <TickerBar snapshot={snapshot} />

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-8 right-4 z-40 flex items-center gap-2 bg-primary text-on-primary font-mono text-[11px] font-bold px-4 py-2 border border-primary/30 hover:bg-primary/80 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined text-[14px]">radar</span>
          RADAR_AI
        </button>
      )}

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onOpenSettings={() => { setChatOpen(false); setSettingsOpen(true) }}
        snapshot={snapshot}
        events={events}
      />

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
