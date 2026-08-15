import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { STORAGE_KEYS } from './storageKeys'
import type { Trade } from '../types/trades'

interface TradesState {
  trades: Trade[]
  addTrade: (trade: Omit<Trade, 'id'>) => void
  removeTrade: (id: string) => void
  clearTrades: () => void
}

/** The trade log is deliberately independent of `usePortfolioStore`, which
 *  holds an imported snapshot of current positions. Holdings answer "what do I
 *  own now"; trades answer "what did I do and what did I realise". Task 17's
 *  reconciliation view is where the two are compared. */
export const useTradesStore = create<TradesState>()(
  persist(
    (set) => ({
      trades: [],
      addTrade: (trade) =>
        set((state) => ({
          trades: [...state.trades, { ...trade, ticker: trade.ticker.trim().toUpperCase(), id: uuidv4() }],
        })),
      removeTrade: (id) => set((state) => ({ trades: state.trades.filter((t) => t.id !== id) })),
      clearTrades: () => set({ trades: [] }),
    }),
    { name: STORAGE_KEYS.trades },
  ),
)
