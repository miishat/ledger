import type { Currency, FetchStatus, FxRate, HistoricalPrice, Quote } from './types'
import { fetchAlphaVantageHistorical, fetchAlphaVantageQuote } from './providers/alphaVantage'
import { fetchFxRate } from './providers/frankfurter'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { SingleFlight, minInterval } from './throttle'
import { fxKey, historicalKey, quoteKey } from './cacheKey'
import { toDateKey, todayKey } from './dateKey'

export const MIN_FETCH_INTERVAL_MS = 60_000
export const STALE_AFTER_MS = 15 * 60_000
export const QUOTE_FRESH_MS = 4 * 60 * 60 * 1000

export interface Resolved<T> {
  value: T
  source: 'override' | 'live' | 'cache'
  status: FetchStatus
  asOf: string
  stale: boolean
}

// Provider indirection for testability.
interface Providers {
  fetchQuote: typeof fetchAlphaVantageQuote
  fetchHistorical: typeof fetchAlphaVantageHistorical
  fetchFxRate: typeof fetchFxRate
}
const defaultProviders: Providers = {
  fetchQuote: fetchAlphaVantageQuote,
  fetchHistorical: fetchAlphaVantageHistorical,
  fetchFxRate,
}
let providers: Providers = { ...defaultProviders }
export function __setProviders(p: Partial<Providers>): void { providers = { ...defaultProviders, ...p } }
export function __resetProviders(): void { providers = { ...defaultProviders } }

const flight = new SingleFlight()

function isStale(fetchedAt: string): boolean {
  return Date.now() - new Date(fetchedAt).getTime() > STALE_AFTER_MS
}

/** A quote fetched within the last QUOTE_FRESH_MS is considered fresh. See R9. */
export function isQuoteFresh(fetchedAt: string): boolean {
  return Date.now() - new Date(fetchedAt).getTime() < QUOTE_FRESH_MS
}

export async function getCurrentPrice(
  ticker: string,
  exchange?: string,
  opts?: { force?: boolean },
): Promise<Resolved<Quote>> {
  const store = useMarketDataStore.getState()
  const key = quoteKey(ticker, exchange)

  const override = store.getOverride(key)
  if (override !== undefined) {
    const asOf = new Date().toISOString()
    return {
      value: { ticker: ticker.trim(), exchange, price: override, currency: 'USD', asOf },
      source: 'override', status: 'success', asOf, stale: false,
    }
  }

  const cached = store.quotes[key]
  if (!opts?.force && cached && isQuoteFresh(cached.fetchedAt)) {
    return { value: cached.value, source: 'cache', status: 'success', asOf: cached.fetchedAt, stale: false }
  }

  const allowed = opts?.force || minInterval(key, MIN_FETCH_INTERVAL_MS)
  if (allowed) {
    try {
      const quote = await flight.run(key, () => providers.fetchQuote(ticker, exchange))
      useMarketDataStore.getState().setQuote(quote)
      return { value: quote, source: 'live', status: 'success', asOf: quote.asOf, stale: false }
    } catch {
      return fromQuoteCache(key, 'error')
    }
  }
  return fromQuoteCache(key, 'stale')
}

function fromQuoteCache(key: string, status: FetchStatus): Resolved<Quote> {
  const cached = useMarketDataStore.getState().quotes[key]
  if (!cached) throw new Error('No market data available')
  return { value: cached.value, source: 'cache', status, asOf: cached.fetchedAt, stale: !isQuoteFresh(cached.fetchedAt) }
}

export async function getHistoricalPrice(
  ticker: string,
  exchange: string | undefined,
  date: string,
): Promise<Resolved<HistoricalPrice>> {
  const dateKey = toDateKey(date)
  const key = historicalKey(ticker, exchange, dateKey)

  const allowed = minInterval(key, MIN_FETCH_INTERVAL_MS)
  if (allowed) {
    try {
      const hist = await flight.run(key, () => providers.fetchHistorical(ticker, exchange, dateKey))
      useMarketDataStore.getState().setHistorical(hist)
      return { value: hist, source: 'live', status: 'success', asOf: hist.asOf, stale: false }
    } catch {
      return fromHistoricalCache(key, 'error')
    }
  }
  return fromHistoricalCache(key, 'stale')
}

function fromHistoricalCache(key: string, status: FetchStatus): Resolved<HistoricalPrice> {
  const cached = useMarketDataStore.getState().historical[key]
  if (!cached) throw new Error('No market data available')
  return { value: cached.value, source: 'cache', status, asOf: cached.fetchedAt, stale: isStale(cached.fetchedAt) }
}

export async function getFxRate(
  from: Currency,
  to: Currency,
  date?: string,
): Promise<Resolved<FxRate>> {
  const dateKey = date ? toDateKey(date) : todayKey()
  const key = fxKey(from, to, dateKey)

  const override = useMarketDataStore.getState().getOverride(key)
  if (override !== undefined) {
    const asOf = new Date().toISOString()
    return { value: { from, to, rate: override, date: dateKey, asOf }, source: 'override', status: 'success', asOf, stale: false }
  }

  if (from === to) {
    const asOf = new Date().toISOString()
    return { value: { from, to, rate: 1, date: dateKey, asOf }, source: 'live', status: 'success', asOf, stale: false }
  }

  const allowed = minInterval(key, MIN_FETCH_INTERVAL_MS)
  if (allowed) {
    try {
      const rate = await flight.run(key, () => providers.fetchFxRate(from, to, date))
      useMarketDataStore.getState().setFx(rate)
      return { value: rate, source: 'live', status: 'success', asOf: rate.asOf, stale: false }
    } catch {
      return fromFxCache(key, 'error')
    }
  }
  return fromFxCache(key, 'stale')
}

function fromFxCache(key: string, status: FetchStatus): Resolved<FxRate> {
  const cached = useMarketDataStore.getState().fx[key]
  if (!cached) throw new Error('No market data available')
  return { value: cached.value, source: 'cache', status, asOf: cached.fetchedAt, stale: isStale(cached.fetchedAt) }
}
