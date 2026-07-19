import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
    { name: 'ledger-portfolio-report' },
  ),
)
