'use client'
import useSWR from 'swr'
import type { RadarEvent, VolatilityGauge, NasdaqSnapshot } from '@/lib/radar-types'

const fetcherWithKey = async (url: string) => {
  const groqKey = typeof window !== 'undefined' ? localStorage.getItem('gi_groq_key') || '' : ''
  const fhKey   = typeof window !== 'undefined' ? localStorage.getItem('gi_fh_key')   || '' : ''
  const headers: Record<string, string> = {}
  if (groqKey) headers['x-groq-key'] = groqKey
  if (fhKey)   headers['x-fh-key']   = fhKey
  const r = await fetch(url, { headers })
  return r.json()
}

export function useRadar(): {
  events:    RadarEvent[]
  isMock:    boolean
  mockReason?: string
  isLoading: boolean
  refresh:   () => void
  updatedAt: string | null
} {
  const { data, isLoading, mutate } = useSWR('/api/radar', fetcherWithKey, {
    refreshInterval:   60000,  // 1 min — AI classification is heavier
    revalidateOnFocus: true,
    dedupingInterval:  30000,
  })
  return {
    events:     (data?.data as RadarEvent[]) ?? [],
    isMock:     data?.mock ?? false,
    mockReason: data?.reason,
    isLoading,
    refresh:    mutate,
    updatedAt:  data?.updatedAt ?? null,
  }
}

export function useVolatility(): {
  gauge:     VolatilityGauge | null
  snapshot:  NasdaqSnapshot  | null
  isMock:    boolean
  isLoading: boolean
} {
  const { data, isLoading } = useSWR('/api/volatility', fetcherWithKey, {
    refreshInterval:  15000,
    dedupingInterval: 8000,
  })
  return {
    gauge:    (data?.gauge    as VolatilityGauge) ?? null,
    snapshot: (data?.snapshot as NasdaqSnapshot)  ?? null,
    isMock:   data?.mock ?? false,
    isLoading,
  }
}
