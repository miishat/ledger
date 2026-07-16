import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Holding {
  id: string
  ticker: string
  name?: string
  exchange?: string
  quantity: number
  /** Per-share cost basis in the holding's own currency. */
  avgCost: number
  currency: 'USD' | 'CAD'
  /** Broker account this row belongs to (user-supplied at import). */
  account: string
}

export type ImportMode = 'replace' | 'update' | 'add'

export const DEFAULT_ACCOUNT = 'Default'

/** Unique account names in first-seen order. */
export function accountNames(holdings: Holding[]): string[] {
  const seen: string[] = []
  for (const h of holdings) {
    if (!seen.includes(h.account)) seen.push(h.account)
  }
  return seen
}

interface PortfolioState {
  holdings: Holding[]
  importedAt: string | null
  importHoldings: (account: string, mode: ImportMode, rows: Omit<Holding, 'id' | 'account'>[]) => void
  clearHoldings: () => void
}

let importSeq = 0
function stamp(account: string, rows: Omit<Holding, 'id' | 'account'>[]): Holding[] {
  importSeq += 1
  return rows.map((r, i) => ({ ...r, account, id: `h-${importSeq}-${i}-${Date.now()}` }))
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      importedAt: null,
      importHoldings: (account, mode, rows) =>
        set((state) => {
          const incoming = stamp(account, rows)
          let holdings: Holding[]
          if (mode === 'replace') {
            // Replace only this account's rows; other accounts untouched.
            holdings = [...state.holdings.filter((h) => h.account !== account), ...incoming]
          } else if (mode === 'update') {
            // Upsert by ticker within the account.
            const kept = state.holdings.filter(
              (h) => h.account !== account || !incoming.some((n) => n.ticker === h.ticker),
            )
            holdings = [...kept, ...incoming]
          } else {
            // 'add': append as-is (new account, or extra rows in an existing one).
            holdings = [...state.holdings, ...incoming]
          }
          return { holdings, importedAt: new Date().toISOString() }
        }),
      clearHoldings: () => set({ holdings: [], importedAt: null }),
    }),
    {
      name: 'ledger-portfolio',
      version: 1,
      // v0 holdings predate accounts - adopt them into the Default account.
      migrate: (persisted, version) => {
        const state = persisted as { holdings?: Array<Record<string, unknown>>; importedAt?: string | null }
        if (version < 1 && Array.isArray(state.holdings)) {
          return {
            ...state,
            holdings: state.holdings.map((h) => ({ account: DEFAULT_ACCOUNT, ...h })),
          } as unknown
        }
        return persisted
      },
    },
  ),
)
