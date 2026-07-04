import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Currency } from '../services/marketData'

export interface Holding {
  id: string
  ticker: string
  name?: string
  exchange?: string
  quantity: number
  /** Per-share cost basis in the holding's own currency. */
  avgCost: number
  currency: Currency
}

interface PortfolioState {
  holdings: Holding[]
  importedAt: string | null
  setHoldings: (holdings: Holding[]) => void
  clearHoldings: () => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      importedAt: null,
      setHoldings: (holdings) => set({ holdings, importedAt: new Date().toISOString() }),
      clearHoldings: () => set({ holdings: [], importedAt: null }),
    }),
    { name: 'ledger-portfolio' },
  ),
)
