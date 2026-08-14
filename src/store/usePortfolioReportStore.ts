import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from './storageKeys'
import type { PAReport } from '../utils/investments/ibkrPortfolioAnalyst'

interface PortfolioReportState {
  report: PAReport | null
  uploadedAt: string | null
  setReport: (report: PAReport) => void
  clearReport: () => void
}

/** Latest uploaded PortfolioAnalyst report; replaced wholesale on upload. */
export const usePortfolioReportStore = create<PortfolioReportState>()(
  persist(
    (set) => ({
      report: null,
      uploadedAt: null,
      setReport: (report) => set({ report, uploadedAt: new Date().toISOString() }),
      clearReport: () => set({ report: null, uploadedAt: null }),
    }),
    { name: STORAGE_KEYS.portfolioReport },
  ),
)
