import { fetchYahooQuote, fetchYahooHistorical } from './yahoo'

const originalFetch = globalThis.fetch

afterEach(() => { globalThis.fetch = originalFetch })

function mockFetchOnce(json: unknown, ok = true) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(json),
  }) as unknown as typeof fetch
}

describe('fetchYahooQuote', () => {
  it('reads regularMarketPrice and currency from the chart meta', async () => {
    mockFetchOnce({
      chart: { result: [{ meta: { regularMarketPrice: 123.45, currency: 'USD', regularMarketTime: 1767225600 } }] },
    })
    const q = await fetchYahooQuote('AAPL', 'NASDAQ')
    expect(q.price).toBe(123.45)
    expect(q.currency).toBe('USD')
    expect(q.ticker).toBe('AAPL')
    expect(q.exchange).toBe('NASDAQ')
  })

  it('throws when the price is missing', async () => {
    mockFetchOnce({ chart: { result: [{ meta: {} }] } })
    await expect(fetchYahooQuote('AAPL')).rejects.toThrow()
  })

  it('throws on a non-ok response', async () => {
    mockFetchOnce({}, false)
    await expect(fetchYahooQuote('AAPL')).rejects.toThrow()
  })
})

describe('fetchYahooHistorical', () => {
  it('returns the close on/nearest-before the requested date', async () => {
    // 2026-01-02 = 1767312000, 2026-01-05 = 1767571200 (UTC midnights)
    mockFetchOnce({
      chart: {
        result: [{
          meta: { currency: 'USD' },
          timestamp: [1767312000, 1767571200],
          indicators: { quote: [{ close: [10, 20] }] },
        }],
      },
    })
    const h = await fetchYahooHistorical('AAPL', undefined, '2026-01-03')
    expect(h.close).toBe(10) // 01-02 is the nearest on/before 01-03
    expect(h.date).toBe('2026-01-03')
    expect(h.currency).toBe('USD')
  })

  it('skips null closes when picking the nearest', async () => {
    mockFetchOnce({
      chart: {
        result: [{
          meta: { currency: 'USD' },
          timestamp: [1767312000, 1767571200],
          indicators: { quote: [{ close: [15, null] }] },
        }],
      },
    })
    const h = await fetchYahooHistorical('AAPL', undefined, '2026-01-06')
    expect(h.close).toBe(15)
  })
})
