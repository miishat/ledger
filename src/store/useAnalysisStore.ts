import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BuyLot {
  id: string
  date: string // YYYY-MM-DD
  amountInvested: number
  price: number
}

export interface Position {
  id: string
  ticker: string
  exchange?: string
  plannedAmount: number
  startPrice: number
  startPriceSource: 'auto' | 'manual'
  acted: boolean
  lots: BuyLot[]
}

export interface InvestmentAnalysis {
  id: string
  name: string
  thesis?: string
  analysisDate: string // YYYY-MM-DD
  positions: Position[]
}

interface AnalysisState {
  analyses: InvestmentAnalysis[]
  addAnalysis: (a: InvestmentAnalysis) => void
  updateAnalysis: (id: string, updates: Partial<InvestmentAnalysis>) => void
  removeAnalysis: (id: string) => void
  addPosition: (analysisId: string, position: Position) => void
  removePosition: (analysisId: string, positionId: string) => void
  updatePosition: (analysisId: string, positionId: string, updates: Partial<Position>) => void
  addLot: (analysisId: string, positionId: string, lot: BuyLot) => void
  removeLot: (analysisId: string, positionId: string, lotId: string) => void
}

function mapAnalysis(
  analyses: InvestmentAnalysis[],
  analysisId: string,
  fn: (a: InvestmentAnalysis) => InvestmentAnalysis,
): InvestmentAnalysis[] {
  return analyses.map((a) => (a.id === analysisId ? fn(a) : a))
}

function mapPosition(
  analyses: InvestmentAnalysis[],
  analysisId: string,
  positionId: string,
  fn: (p: Position) => Position,
): InvestmentAnalysis[] {
  return mapAnalysis(analyses, analysisId, (a) => ({
    ...a,
    positions: a.positions.map((p) => (p.id === positionId ? fn(p) : p)),
  }))
}

/** Shape persisted before positions existed (store version 0). */
interface LegacyAnalysis {
  id: string
  ticker: string
  exchange?: string
  thesis?: string
  plannedAmount: number
  analysisDate: string
  startPrice: number
  startPriceSource: 'auto' | 'manual'
  acted: boolean
  lots: BuyLot[]
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      analyses: [],
      addAnalysis: (a) => set((state) => ({ analyses: [...state.analyses, a] })),
      updateAnalysis: (id, updates) =>
        set((state) => ({ analyses: mapAnalysis(state.analyses, id, (a) => ({ ...a, ...updates })) })),
      removeAnalysis: (id) =>
        set((state) => ({ analyses: state.analyses.filter((a) => a.id !== id) })),
      addPosition: (analysisId, position) =>
        set((state) => ({
          analyses: mapAnalysis(state.analyses, analysisId, (a) => ({
            ...a,
            positions: [...a.positions, position],
          })),
        })),
      removePosition: (analysisId, positionId) =>
        set((state) => ({
          analyses: mapAnalysis(state.analyses, analysisId, (a) => ({
            ...a,
            positions: a.positions.filter((p) => p.id !== positionId),
          })),
        })),
      updatePosition: (analysisId, positionId, updates) =>
        set((state) => ({
          analyses: mapPosition(state.analyses, analysisId, positionId, (p) => ({ ...p, ...updates })),
        })),
      addLot: (analysisId, positionId, lot) =>
        set((state) => ({
          analyses: mapPosition(state.analyses, analysisId, positionId, (p) => ({
            ...p,
            acted: true,
            lots: [...p.lots, lot],
          })),
        })),
      removeLot: (analysisId, positionId, lotId) =>
        set((state) => ({
          analyses: mapPosition(state.analyses, analysisId, positionId, (p) => ({
            ...p,
            lots: p.lots.filter((l) => l.id !== lotId),
          })),
        })),
    }),
    {
      name: 'ledger-analyses',
      version: 1,
      // v0: one flat ticker per analysis → wrap it as the single position.
      migrate: (persisted, version) => {
        if (version >= 1) return persisted
        const state = persisted as { analyses?: LegacyAnalysis[] }
        if (!Array.isArray(state.analyses)) return persisted
        const analyses: InvestmentAnalysis[] = state.analyses.map((old) => ({
          id: old.id,
          name: old.ticker,
          thesis: old.thesis,
          analysisDate: old.analysisDate,
          positions: [
            {
              id: `${old.id}-p1`,
              ticker: old.ticker,
              exchange: old.exchange,
              plannedAmount: old.plannedAmount,
              startPrice: old.startPrice,
              startPriceSource: old.startPriceSource,
              acted: old.acted,
              lots: old.lots ?? [],
            },
          ],
        }))
        return { ...state, analyses } as unknown
      },
    },
  ),
)
