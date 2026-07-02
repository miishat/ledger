import { useCallback, useEffect, useState } from 'react'
import type { Currency, FetchStatus, FxRate, HistoricalPrice, Quote } from './types'
import { getCurrentPrice, getFxRate, getHistoricalPrice, type Resolved } from './marketDataService'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { quoteKey } from './cacheKey'

export function useCurrentPrice(ticker: string, exchange?: string) {
  const [data, setData] = useState<Resolved<Quote>>()
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [error, setError] = useState<string>()

  const refresh = useCallback((force?: boolean) => {
    if (!ticker.trim()) { setStatus('idle'); return }
    setStatus('loading')
    getCurrentPrice(ticker, exchange, { force })
      .then((r) => { setData(r); setStatus(r.status); setError(undefined) })
      .catch((e) => { setStatus('error'); setError(e instanceof Error ? e.message : 'error') })
  }, [ticker, exchange])

  useEffect(() => { let active = true; if (active) refresh(); return () => { active = false } }, [refresh])

  const setManual = useCallback((price: number) => {
    useMarketDataStore.getState().setOverride(quoteKey(ticker, exchange), price)
    refresh(true)
  }, [ticker, exchange, refresh])

  const clearManual = useCallback(() => {
    useMarketDataStore.getState().clearOverride(quoteKey(ticker, exchange))
    refresh(true)
  }, [ticker, exchange, refresh])

  return { data, status, error, refresh, setManual, clearManual }
}

export function useFxRate(from: Currency, to: Currency, date?: string) {
  const [data, setData] = useState<Resolved<FxRate>>()
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [error, setError] = useState<string>()

  const refresh = useCallback(() => {
    setStatus('loading')
    getFxRate(from, to, date)
      .then((r) => { setData(r); setStatus(r.status); setError(undefined) })
      .catch((e) => { setStatus('error'); setError(e instanceof Error ? e.message : 'error') })
  }, [from, to, date])

  useEffect(() => { refresh() }, [refresh])
  return { data, status, error, refresh }
}

export function useHistoricalPrice(ticker: string, exchange: string | undefined, date: string) {
  const [data, setData] = useState<Resolved<HistoricalPrice>>()
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    if (!ticker.trim() || !date) { setStatus('idle'); return }
    setStatus('loading')
    getHistoricalPrice(ticker, exchange, date)
      .then((r) => { if (active) { setData(r); setStatus(r.status); setError(undefined) } })
      .catch((e) => { if (active) { setStatus('error'); setError(e instanceof Error ? e.message : 'error') } })
    return () => { active = false }
  }, [ticker, exchange, date])

  return { data, status, error }
}
