'use client'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface SettingsPanelProps { isOpen: boolean; onClose: () => void }

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [groqKey,    setGroqKey]   = useState('')
  const [fredKey,    setFredKey]   = useState('')
  const [finnhubKey, setFinnhubKey]= useState('')
  const [showGroq,   setShowGroq]  = useState(false)
  const [showFred,   setShowFred]  = useState(false)
  const [showFH,     setShowFH]    = useState(false)
  const [testState,  setTestState] = useState<'idle'|'testing'|'ok'|'fail'>('idle')

  useEffect(() => {
    if (isOpen) {
      setGroqKey(localStorage.getItem('gi_groq_key')    || '')
      setFredKey(localStorage.getItem('gi_fred_key')    || '')
      setFinnhubKey(localStorage.getItem('gi_fh_key')   || '')
      setTestState('idle')
    }
  }, [isOpen])

  const save = () => {
    groqKey.trim()    ? localStorage.setItem('gi_groq_key', groqKey.trim())    : localStorage.removeItem('gi_groq_key')
    fredKey.trim()    ? localStorage.setItem('gi_fred_key', fredKey.trim())    : localStorage.removeItem('gi_fred_key')
    finnhubKey.trim() ? localStorage.setItem('gi_fh_key',   finnhubKey.trim()) : localStorage.removeItem('gi_fh_key')
    onClose()
  }

  const testGroq = async () => {
    if (!groqKey.trim()) return
    setTestState('testing')
    try {
      const r = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages:[{ role:'user', content:'Say OK only.' }], apiKey: groqKey.trim() })
      })
      setTestState(r.ok ? 'ok' : 'fail')
    } catch { setTestState('fail') }
  }

  if (!isOpen) return null

  const InputField = ({
    label, link, linkText, value, onChange, show, onToggleShow, placeholder, children
  }: {
    label: string; link: string; linkText: string
    value: string; onChange: (v:string)=>void
    show: boolean; onToggleShow: ()=>void
    placeholder: string; children?: React.ReactNode
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-mono text-label-xs text-outline uppercase">{label}</label>
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="font-mono text-[9px] text-primary hover:underline flex items-center gap-1">
          {linkText} <span className="material-symbols-outlined text-[10px]">open_in_new</span>
        </a>
      </div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black border border-outline-variant px-3 py-2 font-mono text-[11px] text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors pr-8"
        />
        <button onClick={onToggleShow} className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[14px]">{show ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
      {children}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">api</span>
            <span className="font-sans font-bold text-headline-sm text-on-surface">API Config</span>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Groq */}
          <InputField
            label="Groq API Key — AI Chat"
            link="https://console.groq.com/keys"
            linkText="Get free key"
            value={groqKey} onChange={setGroqKey}
            show={showGroq} onToggleShow={() => setShowGroq(s=>!s)}
            placeholder="gsk_..."
          >
            <div className="flex items-center justify-between mt-1.5">
              <div className="font-sans text-[10px] text-outline">Free · LLaMA 3.3 70B · Ultra fast</div>
              <button onClick={testGroq} disabled={!groqKey.trim() || testState==='testing'}
                className="font-mono text-[9px] border border-outline-variant px-2 py-0.5 text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 transition-colors">
                {testState==='testing' ? '...' : testState==='ok' ? '✓ Valid' : testState==='fail' ? '✗ Invalid' : 'Test'}
              </button>
            </div>
          </InputField>

          <div className="border-t border-outline-variant" />

          {/* Finnhub */}
          <InputField
            label="Finnhub Key — Real-Time Quotes & News"
            link="https://finnhub.io/dashboard"
            linkText="Get free key"
            value={finnhubKey} onChange={setFinnhubKey}
            show={showFH} onToggleShow={() => setShowFH(s=>!s)}
            placeholder="c... (Finnhub key)"
          >
            <div className="font-sans text-[10px] text-outline mt-1">
              Free · 60 req/min · Near real-time prices · Replaces Yahoo Finance (15min delay)
            </div>
          </InputField>

          <div className="border-t border-outline-variant" />

          {/* FRED */}
          <InputField
            label="FRED API Key — Fed Macro Data"
            link="https://fredaccount.stlouisfed.org/apikeys"
            linkText="Get free key"
            value={fredKey} onChange={setFredKey}
            show={showFred} onToggleShow={() => setShowFred(s=>!s)}
            placeholder="32-character FRED key..."
          >
            <div className="font-sans text-[10px] text-outline mt-1">
              Free · CPI · Fed Rate · Yields · GDP · M2 · PCE
            </div>
          </InputField>

          <div className="border-t border-outline-variant" />

          {/* Status */}
          <div>
            <div className="font-mono text-label-xs text-outline uppercase mb-2">Data Sources Status</div>
            <div className="space-y-2">
              {[
                { name:'Yahoo Finance',   status: finnhubKey ? 'backup' : 'active', desc:'15min delay fallback' },
                { name:'Finnhub',         status: finnhubKey ? 'active' : 'needs_key', desc: finnhubKey ? 'Real-time quotes + news' : 'Add key for real-time data' },
                { name:'ForexFactory',    status:'active', desc:'Economic calendar — no key' },
                { name:'Groq AI',         status: groqKey ? 'active' : 'needs_key', desc: groqKey ? 'AI chat ready' : 'Add key above' },
                { name:'FRED St. Louis',  status: fredKey ? 'active' : 'demo', desc: fredKey ? 'Live macro data' : 'Demo data — add key for live' },
              ].map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <div>
                    <span className="font-sans text-[11px] text-on-surface-variant">{s.name}</span>
                    <span className="font-sans text-[10px] text-outline ml-2">{s.desc}</span>
                  </div>
                  <span className={clsx('font-mono text-[8px] border px-1.5 py-0.5',
                    s.status==='active'    ? 'border-secondary/30 text-secondary' :
                    s.status==='backup'    ? 'border-outline/30 text-outline' :
                    s.status==='needs_key' ? 'border-warn/30 text-warn' :
                    'border-outline-variant text-outline'
                  )}>
                    {s.status==='active'?'● LIVE':s.status==='backup'?'◌ BACKUP':s.status==='demo'?'◌ DEMO':'○ OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={save}
              className="flex-1 bg-primary text-on-primary font-sans font-bold text-[12px] py-2.5 hover:bg-primary/80 transition-colors">
              Save & Close
            </button>
            <button onClick={onClose}
              className="px-4 border border-outline-variant text-on-surface-variant hover:text-on-surface font-sans text-[12px] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
