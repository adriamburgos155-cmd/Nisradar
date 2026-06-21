'use client'
import useSWR from 'swr'
import type { FredDollarAnalysis } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useFred(): {
  fred:      FredDollarAnalysis | null
  isMock:    boolean
  isLoading: boolean
  refresh:   () => void
} {
  const { data, isLoading, mutate } = useSWR('/api/fred', fetcher, {
    refreshInterval:   3600000,
    revalidateOnFocus: false,
  })
  return {
    fred:     (data?.data as FredDollarAnalysis) ?? null,
    isMock:   data?.mock ?? false,
    isLoading,
    refresh:  mutate,
  }
}
