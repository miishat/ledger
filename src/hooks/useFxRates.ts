import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getFxRate } from '../services/marketData/marketDataService'
import type { Currency, FetchStatus } from '../services/marketData/types'
import type { FxRates } from '../utils/investments/portfolioMetrics'

/** Sorted, deduplicated, null-free key for a currency list, so callers may
 *  pass a freshly built array every render without retriggering the effect. */
export function ratesKey(currencies: (Currency | null)[]): string {
  return Array.from(new Set(currencies.filter((c): c is Currency => c !== null))).sort().join(',')
}

/** Resolves a CAD rate for every distinct non-null currency in `currencies`.
 *  The list is normalized to a sorted deduplicated key, so callers may pass a
 *  freshly built array on every render without triggering a refetch. */
export function useFxRates(currencies: (Currency | null)[]) {
  const key = useMemo(() => ratesKey(currencies), [currencies])

  const [rates, setRates] = useState<FxRates>({})
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [stale, setStale] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const resolve = useCallback((active: () => boolean) => {
    const list = key ? (key.split(',') as Currency[]) : []
    if (list.length === 0) {
      Promise.resolve().then(() => {
        if (active()) { setRates({}); setStatus('idle'); setStale(false) }
      })
      return
    }
    Promise.resolve().then(() => { if (active()) setStatus('loading') })
    Promise.all(
      list.map((c) =>
        getFxRate(c, 'CAD')
          .then((r) => [c, r] as const)
          .catch(() => [c, null] as const),
      ),
    ).then((entries) => {
      if (!active()) return
      const next: FxRates = {}
      let anyStale = false
      let anyResolved = false
      for (const [c, r] of entries) {
        if (!r) continue
        next[c] = r.value.rate
        anyResolved = true
        if (r.stale) anyStale = true
      }
      setRates(next)
      setStale(anyStale)
      setStatus(anyResolved ? 'success' : 'error')
    })
  }, [key])

  useEffect(() => {
    let active = true
    resolve(() => active)
    return () => { active = false }
  }, [resolve])

  useEffect(() => {
    const onOnline = () => resolve(() => mountedRef.current)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [resolve])

  const refresh = useCallback(() => resolve(() => mountedRef.current), [resolve])

  const missing = useMemo(() => {
    const list = key ? (key.split(',') as Currency[]) : []
    return list.filter((c) => c !== 'CAD' && rates[c] === undefined)
  }, [key, rates])

  return { rates, missing, status, stale, refresh }
}
