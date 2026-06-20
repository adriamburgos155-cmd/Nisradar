'use client'
import { useState } from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { FredDollarAnalysis, FredSeries } from '@/lib/types'
import { clsx } from 'clsx'

// ── Chart tooltip ────────────────────────────────────────
function FredTooltip({ active, payload }: { active?:boolean; payload?:Array<{value:number;payload:{date:string}}> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container-lowest border border-outline-variant px-2 py-1.5 font-mono text-[10px]">
      <div className="text-outline mb-0.5">{payload[0].payload.date}</div>
      <div className="text-on-surface font-bold">{payload[0].value?.toFixed(2)}</div>
    </div>
  )
}

// ── FRED mini chart ──────────────────────────────────────
function FredChart({ series, color = '#adc6ff', type = 'area', showZero = false, height = 80 }: {
  series: FredSeries; color?: string; type?: 'area'|'line'; showZero?: boolean; height?: number
}) {
  const data = series.observations.filter(o => o.value !== null).map(o => ({ date: o.date.slice(0,7), value: o.value as number }))
  if (data.length < 2) return <div className="h-20 bg-surface-container-low flex items-center justify-center font-mono text-[9px] text-outline">NO DATA</div>

  const gradClass = color === '#4edea3' ? 'fred-gradient-green' : color === '#ff5451' ? 'fred-gradient-red' : 'fred-gradient'

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'area' ? (
        <AreaChart data={data} margin={{top:2,right:2,left:0,bottom:0}}>
          <defs>
            <linearGradient id={`g_${series.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.15}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="1 4" stroke="#1a1a1a" vertical={false}/>
          <XAxis dataKey="date" tick={{fontSize:8,fontFamily:'JetBrains Mono',fill:'#8c909f'}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
          <YAxis tick={{fontSize:8,fontFamily:'JetBrains Mono',fill:'#8c909f'}} tickLine={false} axisLine={false} width={40} domain={['auto','auto']}/>
          <Tooltip content={<FredTooltip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
          {showZero && <ReferenceLine y={0} stroke="#424754" strokeDasharray="2 4"/>}
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#g_${series.id})`} dot={false} activeDot={{r:3,fill:color,strokeWidth:0}}/>
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{top:2,right:2,left:0,bottom:0}}>
          <CartesianGrid strokeDasharray="1 4" stroke="#1a1a1a" vertical={false}/>
          <XAxis dataKey="date" tick={{fontSize:8,fontFamily:'JetBrains Mono',fill:'#8c909f'}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
          <YAxis tick={{fontSize:8,fontFamily:'JetBrains Mono',fill:'#8c909f'}} tickLine={false} axisLine={false} width={40} domain={['auto','auto']}/>
          <Tooltip content={<FredTooltip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
          {showZero && <ReferenceLine y={0} stroke="#424754" strokeDasharray="2 4"/>}
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} activeDot={{r:3,fill:color,strokeWidth:0}}/>
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}

// ── Stat tile ────────────────────────────────────────────
function StatTile({ label, value, unit, delta, desc, color='neutral' }: {
  label:string; value:string|number; unit?:string; delta?:number; desc?:string; color?:'bull'|'bear'|'neutral'|'warn'
}) {
  const colCls = { bull:'text-secondary', bear:'text-tertiary', neutral:'text-primary', warn:'text-warn' }[color]
  return (
    <div className="bg-surface-container border border-outline-variant p-3">
      <div className="font-mono text-label-xs text-outline uppercase tracking-wider mb-1">{label}</div>
      <div className={clsx('font-mono text-data-lg font-bold', colCls)}>
        {value}{unit && <span className="text-data-sm text-outline ml-1">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={clsx('font-mono text-[10px] mt-0.5', delta >= 0 ? 'text-secondary' : 'text-tertiary')}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)} MoM
        </div>
      )}
      {desc && <div className="font-sans text-[10px] text-on-surface-variant mt-1">{desc}</div>}
    </div>
  )
}

// ── USD Analysis section ─────────────────────────────────
function USDAnalysis({ fred }: { fred: FredDollarAnalysis }) {
  const latestFed   = fred.fedFunds.observations.filter(o=>o.value!==null).slice(-1)[0]?.value ?? 4.33
  const latestCPI   = fred.cpi.observations.filter(o=>o.value!==null).slice(-2)
  const cpiVal      = latestCPI[1]?.value ?? 315
  const cpiPrev     = latestCPI[0]?.value ?? 314
  const cpiMoM      = cpiVal && cpiPrev ? ((cpiVal - cpiPrev) / cpiPrev) * 100 : 0
  const latestT10   = fred.t10y.observations.filter(o=>o.value!==null).slice(-1)[0]?.value ?? 4.38
  const latestT2    = fred.t2y.observations.filter(o=>o.value!==null).slice(-1)[0]?.value ?? 3.82
  const spread      = fred.yield_spread.observations.filter(o=>o.value!==null).slice(-1)[0]?.value ?? 0.56
  const latestM2    = fred.m2.observations.filter(o=>o.value!==null).slice(-1)[0]?.value ?? 21200
  const latestUnemp = fred.unemployment.observations.filter(o=>o.value!==null).slice(-1)[0]?.value ?? 4.2
  const latestPCE   = fred.pce.observations.filter(o=>o.value!==null).slice(-2)
  const pceVal      = latestPCE[1]?.value ?? 126
  const pcePrev     = latestPCE[0]?.value ?? 125.8
  const pceMoM      = pceVal && pcePrev ? ((pceVal - pcePrev) / pcePrev) * 100 : 0

  const dxyColor = spread > 0 ? '#4edea3' : '#ff5451'

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatTile label="Fed Funds Rate" value={latestFed.toFixed(2)} unit="%" desc="FOMC: Hold — May 2026" color="neutral"/>
        <StatTile label="CPI MoM Change" value={cpiMoM.toFixed(3)} unit="%" delta={cpiMoM} desc="Monthly inflation pulse" color={cpiMoM > 0.4 ? 'bear' : 'bull'}/>
        <StatTile label="10Y-2Y Spread" value={spread.toFixed(3)} unit="%" desc={spread > 0 ? 'Normal curve — growth signal' : 'Inverted — recession risk'} color={spread > 0 ? 'bull' : 'bear'}/>
        <StatTile label="Unemployment" value={latestUnemp.toFixed(1)} unit="%" desc="Labor market health" color={latestUnemp < 4.5 ? 'bull' : 'bear'}/>
      </div>

      {/* 4 chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* DXY proxy */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-mono text-label-xs text-outline uppercase">USD Broad Index (FRED)</div>
              <div className="font-mono text-data-md text-on-surface-variant">{fred.dxy.id} · {fred.dxy.units}</div>
            </div>
            <span className="font-mono text-[9px] text-secondary border border-secondary/30 px-1.5 py-0.5">LIVE</span>
          </div>
          <FredChart series={fred.dxy} color={dxyColor} height={100}/>
          <div className="mt-2 font-sans text-[10px] text-on-surface-variant">
            Real broad dollar index. When DXY strengthens: commodities typically fall, EM currencies weaken. Current spread ({spread.toFixed(2)}%) {spread > 0 ? 'supports' : 'pressures'} USD.
          </div>
        </div>

        {/* CPI + Core CPI */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-mono text-label-xs text-outline uppercase">CPI vs Core CPI</div>
              <div className="font-mono text-data-md text-on-surface-variant">Inflation trend — 24M</div>
            </div>
            <div className="flex gap-2 font-mono text-[9px]">
              <span className="text-primary">CPI</span>
              <span className="text-warn">CORE</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart margin={{top:2,right:2,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="1 4" stroke="#1a1a1a" vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:8,fill:'#8c909f'}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{fontSize:8,fill:'#8c909f'}} tickLine={false} axisLine={false} width={40} domain={['auto','auto']}/>
              <Tooltip content={<FredTooltip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
              <Line data={fred.cpi.observations.filter(o=>o.value!==null).map(o=>({date:o.date.slice(0,7),value:o.value}))} type="monotone" dataKey="value" stroke="#adc6ff" strokeWidth={1.5} dot={false}/>
              <Line data={fred.coreCpi.observations.filter(o=>o.value!==null).map(o=>({date:o.date.slice(0,7),value:o.value}))} type="monotone" dataKey="value" stroke="#ffd166" strokeWidth={1.5} dot={false} strokeDasharray="3 2"/>
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 font-sans text-[10px] text-on-surface-variant">
            MoM change: <span className={cpiMoM > 0.3 ? 'text-tertiary' : 'text-secondary'}>{cpiMoM.toFixed(3)}%</span>. Fed target: 2% YoY. {cpiMoM > 0.4 ? 'Elevated — rate cut odds drop.' : 'Moderating — rate cut window opens.'}
          </div>
        </div>

        {/* Yield curve */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-mono text-label-xs text-outline uppercase">Yield Curve (10Y-2Y)</div>
              <div className="font-mono text-data-md text-on-surface-variant">Treasury spread — key USD driver</div>
            </div>
            <span className={clsx('font-mono text-[9px] border px-1.5 py-0.5', spread>0?'border-secondary/30 text-secondary':'border-tertiary/30 text-tertiary')}>
              {spread > 0 ? 'NORMAL' : 'INVERTED'}
            </span>
          </div>
          <FredChart series={fred.yield_spread} color={spread > 0 ? '#4edea3' : '#ff5451'} type="area" showZero height={100}/>
          <div className="mt-2 font-sans text-[10px] text-on-surface-variant">
            10Y: <span className="text-primary">{latestT10.toFixed(2)}%</span> · 2Y: <span className="text-primary">{latestT2.toFixed(2)}%</span> · Spread: <span className={spread>0?'text-secondary':'text-tertiary'}>{spread.toFixed(3)}%</span>. {spread < 0 ? 'Inverted yield curve historically precedes recession by 12-18 months.' : 'Positive spread signals growth expectations.'}
          </div>
        </div>

        {/* M2 Money Supply */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-mono text-label-xs text-outline uppercase">M2 Money Supply</div>
              <div className="font-mono text-data-md text-on-surface-variant">${(latestM2/1000).toFixed(1)}T — liquidity gauge</div>
            </div>
          </div>
          <FredChart series={fred.m2} color="#adc6ff" height={100}/>
          <div className="mt-2 font-sans text-[10px] text-on-surface-variant">
            M2 expansion dilutes USD purchasing power. Contraction is deflationary and supports real rates. Current trend: {fred.m2.observations.slice(-3).every((o,i,a) => i===0||((o.value??0)>=(a[i-1].value??0))) ? 'expanding — mild bearish USD pressure' : 'contracting — supportive for USD'}.
          </div>
        </div>
      </div>

      {/* PCE + GDP row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="bg-surface-container-lowest border border-outline-variant p-3">
          <div className="font-mono text-label-xs text-outline uppercase mb-2">PCE Price Index (Fed Preferred)</div>
          <FredChart series={fred.pce} color="#4edea3" height={80}/>
          <div className="mt-2 font-sans text-[10px] text-on-surface-variant">
            PCE MoM: <span className={pceMoM > 0.3 ? 'text-tertiary' : 'text-secondary'}>{pceMoM.toFixed(3)}%</span>. The Fed's preferred inflation gauge. Lower than CPI historically — focus for rate decisions.
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-3">
          <div className="font-mono text-label-xs text-outline uppercase mb-2">GDP (Quarterly)</div>
          <FredChart series={fred.gdp} color="#adc6ff" type="line" height={80}/>
          <div className="mt-2 font-sans text-[10px] text-on-surface-variant">
            Latest: <span className="text-primary">${((fred.gdp.observations.filter(o=>o.value!==null).slice(-1)[0]?.value??29800)/1000).toFixed(1)}T</span>. Strong GDP supports hawkish Fed stance and USD strength.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Fed Releases calendar ────────────────────────────────
function FredReleases({ fred }: { fred: FredDollarAnalysis }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant">
      <div className="px-3 py-2 border-b border-outline-variant">
        <span className="font-mono text-label-xs font-bold text-outline uppercase">FRED_RELEASES · Upcoming</span>
      </div>
      <div className="divide-y divide-outline-variant/30">
        {fred.releases.slice(0,8).map((r,i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 terminal-row">
            <span className="font-mono text-[9px] text-primary w-20 shrink-0">{r.date}</span>
            <span className="font-sans text-[11px] text-on-surface">{r.name}</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-tertiary shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── FRED View (main export) ──────────────────────────────
export function FredView({ fred, isMock }: { fred: FredDollarAnalysis | null; isMock: boolean }) {
  const [tab, setTab] = useState<'usd'|'releases'>('usd')

  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
          <div>
            <div className="font-sans font-bold text-headline-sm text-on-surface">FRED Macro Analysis</div>
            <div className="font-mono text-label-xs text-outline">Federal Reserve Economic Data · St. Louis Fed</div>
          </div>
          {isMock && <span className="font-mono text-[9px] text-warn border border-warn/30 px-1.5 py-0.5">DEMO — Add FRED_API_KEY</span>}
        </div>
        <div className="flex gap-1">
          {(['usd','releases'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={clsx(
              'font-mono text-label-xs uppercase px-2 py-1.5 border transition-colors',
              tab===t ? 'border-primary text-primary bg-primary/10' : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
            )}>{t === 'usd' ? 'USD Analysis' : 'Fed Releases'}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!fred ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="material-symbols-outlined text-[48px] text-outline mb-3">analytics</div>
              <div className="font-mono text-data-md text-on-surface-variant">Loading FRED data...</div>
            </div>
          </div>
        ) : tab === 'usd' ? (
          <USDAnalysis fred={fred}/>
        ) : (
          <FredReleases fred={fred}/>
        )}
      </div>
    </div>
  )
}
