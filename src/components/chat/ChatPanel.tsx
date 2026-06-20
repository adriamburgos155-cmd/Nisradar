'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import type { NasdaqSnapshot, RadarEvent } from '@/lib/radar-types'

interface ChatMessage { id:string; role:'user'|'assistant'; content:string; ts:string }

const QUICK = [
  { label:'¿Qué vigilar ahora?',  prompt:'¿Qué eventos del radar debería vigilar ahora mismo para mi operativa en Nasdaq?' },
  { label:'Análisis VIX',         prompt:'Analiza el VIX actual y qué implica para la volatilidad esperada del Nasdaq hoy.' },
  { label:'Riesgo Trump/China',   prompt:'¿Hay riesgo activo de Trump o tensión con China que pueda mover el Nasdaq?' },
  { label:'Próximo catalizador',  prompt:'¿Cuál es el próximo catalizador de la Fed que podría mover el Nasdaq?' },
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 bg-surface-container border border-outline-variant self-start max-w-[80%]">
      <span className="w-1 h-1 rounded-full bg-outline dot-1" />
      <span className="w-1 h-1 rounded-full bg-outline dot-2" />
      <span className="w-1 h-1 rounded-full bg-outline dot-3" />
    </div>
  )
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isAI = msg.role === 'assistant'
  return (
    <div className={clsx('flex gap-2 mb-2', isAI ? 'items-start' : 'items-start flex-row-reverse')}>
      {isAI && (
        <div className="w-6 h-6 bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[12px] text-primary">radar</span>
        </div>
      )}
      <div className={clsx('max-w-[85%] font-sans text-[12px] leading-relaxed px-3 py-2',
        isAI ? 'bg-surface-container border border-outline-variant text-on-surface' : 'bg-primary/15 border border-primary/25 text-on-surface'
      )}>
        {isAI
          ? msg.content.split('\n').map((line,i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-secondary">$1</strong>') }}/>
            ))
          : msg.content
        }
        <div className="font-mono text-[8px] text-outline mt-1 text-right">
          {new Date(msg.ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>
    </div>
  )
}

interface ChatPanelProps {
  isOpen: boolean; onClose: () => void; onOpenSettings?: () => void
  snapshot: NasdaqSnapshot | null; events: RadarEvent[]
}

export function ChatPanel({ isOpen, onClose, onOpenSettings, snapshot, events }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id:'0', role:'assistant',
    content:'Radar AI activo. Monitoreo exclusivamente Fed, Trump, geopolítica, tech/IA y riesgo de mercado — todo filtrado para impacto en Nasdaq. ¿Qué necesitas saber?',
    ts: new Date().toISOString(),
  }])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [hasKey,  setHasKey]  = useState(false)
  const [expanded,setExpanded]= useState(false)
  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setHasKey(!!localStorage.getItem('gi_groq_key')) }, [isOpen])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, loading])
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 150) }, [isOpen])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const key = localStorage.getItem('gi_groq_key') || ''
    if (!key) {
      setMessages(p => [...p, { id:Date.now().toString(), role:'assistant', content:'⚠️ Configura tu Groq API key en Settings (ícono ⚙).', ts:new Date().toISOString() }])
      return
    }
    const userMsg: ChatMessage = { id:Date.now().toString(), role:'user', content:text, ts:new Date().toISOString() }
    setMessages(p => [...p, userMsg])
    setInput('')
    setLoading(true)
    try {
      const r = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m=>({role:m.role,content:m.content})),
          marketContext: snapshot, radarContext: events, apiKey: key
        })
      })
      const data = await r.json()
      setMessages(p => [...p, { id:(Date.now()+1).toString(), role:'assistant', content: data.reply || data.message || 'Error.', ts:new Date().toISOString() }])
    } catch {
      setMessages(p => [...p, { id:(Date.now()+1).toString(), role:'assistant', content:'Error de conexión.', ts:new Date().toISOString() }])
    } finally { setLoading(false) }
  }, [loading, messages, snapshot, events])

  if (!isOpen) return null

  return (
    <div className={clsx(
      'fixed bottom-6 right-4 z-50 flex flex-col bg-surface-container-lowest border border-outline-variant shadow-2xl animate-slide-up',
      expanded ? 'w-[520px] h-[80vh]' : 'w-[360px] h-[500px]'
    )}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-low shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-secondary rounded-full live-dot" />
          <span className="font-mono text-label-xs font-bold text-on-surface uppercase">Radar AI — Nasdaq Focus</span>
        </div>
        <div className="flex items-center gap-1">
          {!hasKey && (
            <button onClick={onOpenSettings} className="font-mono text-[9px] text-warn border border-warn/30 px-1.5 py-0.5 hover:bg-warn/10 transition-colors">ADD KEY</button>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-on-surface-variant hover:text-on-surface px-1">
            <span className="material-symbols-outlined text-[14px]">{expanded ? 'close_fullscreen' : 'open_in_full'}</span>
          </button>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface px-1">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      </div>

      {messages.length <= 1 && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-outline-variant shrink-0">
          {QUICK.map(q => (
            <button key={q.label} onClick={() => send(q.prompt)}
              className="font-mono text-[9px] border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/50 px-2 py-1 transition-colors">
              {q.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.map(msg => <Bubble key={msg.id} msg={msg}/>)}
        {loading && <TypingIndicator/>}
        <div ref={endRef}/>
      </div>

      <div className="px-3 py-2.5 border-t border-outline-variant shrink-0">
        <div className="flex items-center gap-2 bg-black border border-outline-variant focus-within:border-primary/50 transition-colors">
          <input
            ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send(input)}
            placeholder={hasKey ? 'Pregunta sobre el radar Nasdaq...' : 'Configura Groq key primero...'}
            className="flex-1 bg-transparent font-sans text-[12px] text-on-surface placeholder:text-outline px-3 py-2 outline-none"
          />
          <button onClick={() => send(input)} disabled={!input.trim()||loading}
            className="bg-primary text-on-primary px-3 py-2 disabled:opacity-30 hover:bg-primary/80 transition-colors shrink-0">
            <span className="material-symbols-outlined text-[14px]">send</span>
          </button>
        </div>
      </div>
    </div>
  )
}
