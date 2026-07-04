import { useAnalysisStore, type InvestmentAnalysis } from './useAnalysisStore'

const initialState = useAnalysisStore.getState()
beforeEach(() => {
  localStorage.clear()
  useAnalysisStore.setState(initialState, true)
})

const analysis: InvestmentAnalysis = {
  id: 'a1', ticker: 'AAPL', plannedAmount: 10_000, analysisDate: '2026-01-15',
  startPrice: 200, startPriceSource: 'auto', acted: false, lots: [],
}

describe('useAnalysisStore', () => {
  it('adds, updates and removes analyses', () => {
    const s = useAnalysisStore.getState()
    s.addAnalysis(analysis)
    expect(useAnalysisStore.getState().analyses).toHaveLength(1)
    s.updateAnalysis('a1', { acted: true, startPrice: 210, startPriceSource: 'manual' })
    expect(useAnalysisStore.getState().analyses[0]).toMatchObject({ acted: true, startPrice: 210 })
    s.removeAnalysis('a1')
    expect(useAnalysisStore.getState().analyses).toHaveLength(0)
  })

  it('manages lots per analysis and marks acted', () => {
    const s = useAnalysisStore.getState()
    s.addAnalysis(analysis)
    s.addLot('a1', { id: 'l1', date: '2026-01-20', amountInvested: 5_000, price: 205 })
    s.addLot('a1', { id: 'l2', date: '2026-02-20', amountInvested: 3_500, price: 190 })
    const a = useAnalysisStore.getState().analyses[0]
    expect(a.lots).toHaveLength(2)
    expect(a.acted).toBe(true) // adding a lot implies acted
    s.removeLot('a1', 'l1')
    expect(useAnalysisStore.getState().analyses[0].lots.map((l) => l.id)).toEqual(['l2'])
  })

  it('persists under the ledger-analyses key', () => {
    useAnalysisStore.getState().addAnalysis(analysis)
    expect(localStorage.getItem('ledger-analyses')).toContain('"AAPL"')
  })
})
