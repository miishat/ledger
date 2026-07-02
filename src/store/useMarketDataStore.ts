import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cached, FxRate, HistoricalPrice, Quote } from '../services/marketData/types'
import { fxKey, historicalKey, quoteKey } from '../services/marketData/cacheKey'

interface MarketDataState {
  quotes: Record<string, Cached<Quote>>
  historical: Record<string, Cached<HistoricalPrice>>
  fx: Record<string, Cached<FxRate>>
  overrides: Record<string, number>

  setQuote: (q: Quote) => void
  setHistorical: (h: HistoricalPrice) => void
  setFx: (r: FxRate) => void
  getQuote: (ticker: string, exchange?: string) => Cached<Quote> | undefined
  getHistorical: (ticker: string, exchange: string | undefined, dateKey: string) => Cached<HistoricalPrice> | undefined
  getFx: (from: string, to: string, dateKey: string) => Cached<FxRate> | undefined
  setOverride: (key: string, price: number) => void
  clearOverride: (key: string) => void
  getOverride: (key: string) => number | undefined
}

const now = () => new Date().toISOString()

export const useMarketDataStore = create<MarketDataState>()(
  persist(
    (set, get) => ({
      quotes: {},
      historical: {},
      fx: {},
      overrides: {},

      setQuote: (q) =>
        set((state) => ({
          quotes: { ...state.quotes, [quoteKey(q.ticker, q.exchange)]: { value: q, fetchedAt: now() } },
        })),
      setHistorical: (h) =>
        set((state) => ({
          historical: {
            ...state.historical,
            [historicalKey(h.ticker, h.exchange, h.date)]: { value: h, fetchedAt: now() },
          },
        })),
      setFx: (r) =>
        set((state) => ({
          fx: { ...state.fx, [fxKey(r.from, r.to, r.date)]: { value: r, fetchedAt: now() } },
        })),

      getQuote: (ticker, exchange) => get().quotes[quoteKey(ticker, exchange)],
      getHistorical: (ticker, exchange, dateKey) => get().historical[historicalKey(ticker, exchange, dateKey)],
      getFx: (from, to, dateKey) => get().fx[fxKey(from, to, dateKey)],

      setOverride: (key, price) => set((state) => ({ overrides: { ...state.overrides, [key]: price } })),
      clearOverride: (key) =>
        set((state) => {
          const next = { ...state.overrides }
          delete next[key]
          return { overrides: next }
        }),
      getOverride: (key) => get().overrides[key],
    }),
    { name: 'ledger-market-data' },
  ),
)
