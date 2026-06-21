'use client'
import { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import type { RadarEvent } from '@/lib/radar-types'

interface MasterAnalysis {
  direccion: 'alcista' | 'bajista' | 'mixto' | 'neutral'
  confianza: number
  resumenEjecutivo: string
  ventajas: string[]
  desventajas: string[]
  catalizadorPrincipal: string
  nivelesClave: string
  recomendacionRiesgo: string
}

const directionConfig = {
  alcista: { label: 'ALCISTA',  color: '#4edea3', bg: 'bg-secondary/10', border: 'border-secondary/40', text: 'text-secondary', icon: 'trending_up' },
  bajista: { label: 'BAJISTA',  color: '#ff5451', bg: 'bg-tertiary/10', border: 'border-tertiary/40', text: 'text-tertiary', icon: 'trending_down' },
  mixto:   { label: 'MIXTO',    color: '#ffd166', bg: 'bg-warn/10',     border: 'border-warn/40',     text: 'text-warn',     icon: 'swap_horiz' },
  neutral: { label: 'NEUTRAL',  color: '#8c909f', bg: 'bg-outline/10',  border: 'border-outline/40',  text: 'text-outline',  icon: 'trending_flat' },
}

interface MasterAnalysisCardProps {
  events:   RadarEvent[]
  gauge:    import('@/lib/radar-types').VolatilityGauge | null
  snapshot: import('@/lib/radar-types').NasdaqSnapshot  | null
  fred:     unknown
}

export function MasterAnalysisCard({ events, gauge, snapshot, fred }: MasterAnalysisCardProps) {
  const [analysis,  setAnalysis]  = useState<MasterAnalysis | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const runAnalysis = useCallback(async () => {
    const key = localStorage.getItem('gi_groq_key') || ''
    if (!key) {
      setError('Configura tu Groq API key en Settings (⚙) para activar el análisis.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/master-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, gauge, snapshot, fred, apiKey: key }),
      })
      const data = await r.json()
      if (data.error) {
        setError(data.message || 'Error al analizar.')
      } else {
        setAnalysis(data.data)
        setUpdatedAt(data.generatedAt)
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }, [events, gauge, snapshot, fred])

  const cfg = analysis ? directionConfig[analysis.direccion] : null

  return (
    <div className="bg-surface-container-lowest border border-outline-variant">
      {/* Header with the big button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
          <span className="font-sans font-semibold text-[13px] text-on-surface">Análisis IA en Vivo</span>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-on-primary font-mono text-[11px] font-bold px-4 py-2 hover:bg-primary/85 disabled:opacity-50 transition-colors"
        >
          <span className={clsx('material-symbols-outlined text-[14px]', loading && 'animate-spin')}>
            {loading ? 'progress_activity' : 'bolt'}
          </span>
          {loading ? 'Analizando...' : 'Analizar Ahora'}
        </button>
      </div>

      {/* Empty state */}
      {!analysis && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <span className="material-symbols-outlined text-[32px] text-outline mb-2 opacity-50">radar</span>
          <p className="font-sans text-[12px] text-on-surface-variant max-w-sm">
            Presiona <strong className="text-on-surface">Analizar Ahora</strong> para que la IA sintetice todo el contexto actual — noticias, volatilidad y datos macro — en una conclusión accionable.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="px-4 py-4 flex items-center gap-2 text-warn">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span className="font-sans text-[12px]">{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="px-4 py-6 space-y-3">
          <div className="h-6 w-32 bg-surface-container animate-pulse" />
          <div className="h-4 w-full bg-surface-container animate-pulse" />
          <div className="h-4 w-3/4 bg-surface-container animate-pulse" />
        </div>
      )}

      {/* Result */}
      {analysis && cfg && !loading && (
        <div className="p-4 space-y-3">
          {/* Direction badge + confidence */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className={clsx('flex items-center gap-2 px-3 py-1.5 border', cfg.bg, cfg.border)}>
              <span className={clsx('material-symbols-outlined text-[18px]', cfg.text)}>{cfg.icon}</span>
              <span className={clsx('font-mono text-[14px] font-bold', cfg.text)}>{cfg.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-outline uppercase">Confianza</span>
              <div className="w-20 h-1.5 bg-surface-container-low">
                <div className="h-full" style={{ width: `${analysis.confianza}%`, background: cfg.color }} />
              </div>
              <span className="font-mono text-[11px] font-bold text-on-surface">{analysis.confianza}%</span>
            </div>
          </div>

          {/* Executive summary */}
          <p className="font-sans text-[13px] text-on-surface leading-relaxed">
            {analysis.resumenEjecutivo}
          </p>

          {/* Catalyst + levels — compact info row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-surface-container px-3 py-2 border-l-2 border-primary/40">
              <div className="font-mono text-[8px] uppercase text-primary mb-0.5">Catalizador Principal</div>
              <div className="font-sans text-[11.5px] text-on-surface-variant">{analysis.catalizadorPrincipal}</div>
            </div>
            <div className="bg-surface-container px-3 py-2 border-l-2 border-outline/40">
              <div className="font-mono text-[8px] uppercase text-outline mb-0.5">Niveles / Rango Esperado</div>
              <div className="font-sans text-[11.5px] text-on-surface-variant">{analysis.nivelesClave}</div>
            </div>
          </div>

          {/* Ventajas / Desventajas — two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-secondary/5 border border-secondary/20 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px] text-secondary">add_circle</span>
                <span className="font-mono text-[9px] uppercase text-secondary tracking-wide">Ventajas</span>
              </div>
              <ul className="space-y-1.5">
                {analysis.ventajas.map((v, i) => (
                  <li key={i} className="font-sans text-[11.5px] text-on-surface-variant flex items-start gap-1.5">
                    <span className="text-secondary mt-0.5">·</span>{v}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-tertiary/5 border border-tertiary/20 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px] text-tertiary">remove_circle</span>
                <span className="font-mono text-[9px] uppercase text-tertiary tracking-wide">Desventajas</span>
              </div>
              <ul className="space-y-1.5">
                {analysis.desventajas.map((v, i) => (
                  <li key={i} className="font-sans text-[11.5px] text-on-surface-variant flex items-start gap-1.5">
                    <span className="text-tertiary mt-0.5">·</span>{v}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk recommendation footer */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-container border border-outline-variant">
            <span className="material-symbols-outlined text-[14px] text-warn">shield</span>
            <span className="font-sans text-[11px] text-on-surface-variant">{analysis.recomendacionRiesgo}</span>
          </div>

          {updatedAt && (
            <div className="font-mono text-[8px] text-outline text-right">
              Generado {new Date(updatedAt).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
