import { beforeEach, afterEach } from 'vitest'
import {
  getCurrentPrice, getFxRate, getHistoricalPrice,
  __setProviders, __resetProviders,
} from './marketDataService'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { __resetMinInterval } from './throttle'
import { quoteKey } from './cacheKey'

beforeEach(() => {
  localStorage.clear()
  useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
  __resetMinInterval()
})
afterEach(() => __resetProviders())

const quote = { ticker: 'AAPL', exchange: 'NASDAQ', price: 100, currency: 'USD' as const, asOf: '2026-07-01T00:00:00Z' }

describe('getCurrentPrice', () => {
  it('fetches live, caches, and reports source=live', async () => {
    __setProviders({ fetchYahooQuote: async () => quote })
    const r = await getCurrentPrice('AAPL', 'NASDAQ')
    expect(r.value.price).toBe(100)
    expect(r.source).toBe('live')
    expect(useMarketDataStore.getState().getQuote('AAPL', 'NASDAQ')?.value.price).toBe(100)
  })

  it('prefers a manual override without fetching', async () => {
    let called = false
    __setProviders({ fetchYahooQuote: async () => { called = true; return quote } })
    useMarketDataStore.getState().setOverride(quoteKey('AAPL', 'NASDAQ'), 250)
    const r = await getCurrentPrice('AAPL', 'NASDAQ')
    expect(r.value.price).toBe(250)
    expect(r.source).toBe('override')
    expect(called).toBe(false)
  })

  it('falls back to cache when the live fetch fails', async () => {
    useMarketDataStore.getState().setQuote(quote)
    __setProviders({ fetchYahooQuote: async () => { throw new Error('network down') } })
    const r = await getCurrentPrice('AAPL', 'NASDAQ', { force: true })
    expect(r.value.price).toBe(100)
    expect(r.source).toBe('cache')
    expect(r.status).toBe('error')
  })

  it('throws only when there is no override, no live value, and no cache', async () => {
    __setProviders({ fetchYahooQuote: async () => { throw new Error('network down') } })
    await expect(getCurrentPrice('ZZZ', undefined, { force: true })).rejects.toThrow('No market data available')
  })
})

describe('getFxRate', () => {
  it('returns 1 for same-currency without touching providers', async () => {
    __setProviders({ fetchFxRate: async () => { throw new Error('should not be called') } })
    const r = await getFxRate('CAD', 'CAD')
    expect(r.value.rate).toBe(1)
  })

  it('fetches and caches a USD->CAD rate', async () => {
    __setProviders({ fetchFxRate: async () => ({ from: 'USD' as const, to: 'CAD' as const, rate: 1.36, date: '2026-07-01', asOf: '2026-07-01T00:00:00Z' }) })
    const r = await getFxRate('USD', 'CAD')
    expect(r.value.rate).toBe(1.36)
    expect(r.source).toBe('live')
  })
})

describe('getHistoricalPrice', () => {
  it('returns cache when present without refetching in-window', async () => {
    __setProviders({
      fetchYahooHistorical: async () => ({ ticker: 'AAPL', exchange: undefined, date: '2026-01-02', close: 42, currency: 'USD' as const, asOf: '2026-01-02T00:00:00Z' }),
    })
    const first = await getHistoricalPrice('AAPL', undefined, '2026-01-02')
    expect(first.value.close).toBe(42)
    expect(first.source).toBe('live')
    // second call is throttled → served from cache
    const second = await getHistoricalPrice('AAPL', undefined, '2026-01-02')
    expect(second.source).toBe('cache')
  })
})
