import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BuyLot {
  id: string
  date: string // YYYY-MM-DD
  amountInvested: number
  price: number
}

export interface InvestmentAnalysis {
  id: string
  ticker: string
  exchange?: string
  thesis?: string
  plannedAmount: number
  analysisDate: string // YYYY-MM-DD
  startPrice: number
  startPriceSource: 'auto' | 'manual'
  acted: boolean
  lots: BuyLot[]
}

interface AnalysisState {
  analyses: InvestmentAnalysis[]
  addAnalysis: (a: InvestmentAnalysis) => void
  updateAnalysis: (id: string, updates: Partial<InvestmentAnalysis>) => void
  removeAnalysis: (id: string) => void
  addLot: (analysisId: string, lot: BuyLot) => void
  removeLot: (analysisId: string, lotId: string) => void
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      analyses: [],
      addAnalysis: (a) => set((state) => ({ analyses: [...state.analyses, a] })),
      updateAnalysis: (id, updates) =>
        set((state) => ({
          analyses: state.analyses.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      removeAnalysis: (id) =>
        set((state) => ({ analyses: state.analyses.filter((a) => a.id !== id) })),
      addLot: (analysisId, lot) =>
        set((state) => ({
          analyses: state.analyses.map((a) =>
            a.id === analysisId ? { ...a, acted: true, lots: [...a.lots, lot] } : a,
          ),
        })),
      removeLot: (analysisId, lotId) =>
        set((state) => ({
          analyses: state.analyses.map((a) =>
            a.id === analysisId ? { ...a, lots: a.lots.filter((l) => l.id !== lotId) } : a,
          ),
        })),
    }),
    { name: 'ledger-analyses' },
  ),
)
