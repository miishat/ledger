import { usePortfolioStore, type Holding } from './usePortfolioStore'

const initialState = usePortfolioStore.getState()
beforeEach(() => {
  localStorage.clear()
  usePortfolioStore.setState(initialState, true)
})

const holdings: Holding[] = [
  { id: 'h1', ticker: 'VFV', quantity: 100, avgCost: 120, currency: 'CAD' },
  { id: 'h2', ticker: 'AAPL', quantity: 10, avgCost: 180, currency: 'USD' },
]

describe('usePortfolioStore', () => {
  it('replaces holdings on import and stamps importedAt', () => {
    usePortfolioStore.getState().setHoldings(holdings)
    const s = usePortfolioStore.getState()
    expect(s.holdings).toHaveLength(2)
    expect(s.importedAt).not.toBeNull()
    usePortfolioStore.getState().setHoldings([holdings[0]])
    expect(usePortfolioStore.getState().holdings).toHaveLength(1)
  })

  it('clears holdings', () => {
    usePortfolioStore.getState().setHoldings(holdings)
    usePortfolioStore.getState().clearHoldings()
    expect(usePortfolioStore.getState().holdings).toHaveLength(0)
    expect(usePortfolioStore.getState().importedAt).toBeNull()
  })

  it('persists under the ledger-portfolio key', () => {
    usePortfolioStore.getState().setHoldings(holdings)
    expect(localStorage.getItem('ledger-portfolio')).toContain('"VFV"')
  })
})
