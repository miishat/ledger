import { beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCurrentPrice } from './useMarketData'
import { __setProviders, __resetProviders } from './marketDataService'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { __resetMinInterval } from './throttle'

beforeEach(() => {
  localStorage.clear()
  useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
  __resetMinInterval()
})
afterEach(() => __resetProviders())

describe('useCurrentPrice', () => {
  it('resolves a live price after mount', async () => {
    __setProviders({ fetchYahooQuote: async () => ({ ticker: 'AAPL', exchange: 'NASDAQ', price: 199, currency: 'USD', asOf: '2026-07-01T00:00:00Z' }) })
    const { result } = renderHook(() => useCurrentPrice('AAPL', 'NASDAQ'))
    await waitFor(() => expect(result.current.data?.value.price).toBe(199))
    expect(result.current.status).toBe('success')
  })

  it('setManual switches the source to override', async () => {
    __setProviders({ fetchYahooQuote: async () => ({ ticker: 'AAPL', exchange: 'NASDAQ', price: 199, currency: 'USD', asOf: '2026-07-01T00:00:00Z' }) })
    const { result } = renderHook(() => useCurrentPrice('AAPL', 'NASDAQ'))
    await waitFor(() => expect(result.current.data).toBeDefined())
    act(() => result.current.setManual(250))
    await waitFor(() => expect(result.current.data?.source).toBe('override'))
    expect(result.current.data?.value.price).toBe(250)
  })

  it('stays idle for an empty ticker', () => {
    const { result } = renderHook(() => useCurrentPrice(''))
    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
