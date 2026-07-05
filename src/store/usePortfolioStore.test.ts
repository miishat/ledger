import { accountNames, usePortfolioStore, type Holding } from './usePortfolioStore'

const initialState = usePortfolioStore.getState()
beforeEach(() => {
  localStorage.clear()
  usePortfolioStore.setState(initialState, true)
})

const rows: Omit<Holding, 'id' | 'account'>[] = [
  { ticker: 'VFV', quantity: 100, avgCost: 120, currency: 'CAD' },
  { ticker: 'AAPL', quantity: 10, avgCost: 180, currency: 'USD' },
]

describe('usePortfolioStore', () => {
  it('replace mode only clobbers the named account', () => {
    const s = usePortfolioStore.getState()
    s.importHoldings('IBKR', 'replace', rows)
    s.importHoldings('Wealthsimple', 'replace', [rows[0]])
    expect(usePortfolioStore.getState().holdings).toHaveLength(3)
    s.importHoldings('IBKR', 'replace', [rows[1]])
    const after = usePortfolioStore.getState().holdings
    expect(after).toHaveLength(2)
    expect(after.filter((h) => h.account === 'Wealthsimple')).toHaveLength(1)
    expect(after.filter((h) => h.account === 'IBKR').map((h) => h.ticker)).toEqual(['AAPL'])
  })

  it('update mode upserts by ticker within the account', () => {
    const s = usePortfolioStore.getState()
    s.importHoldings('IBKR', 'replace', rows)
    s.importHoldings('IBKR', 'update', [{ ticker: 'VFV', quantity: 150, avgCost: 125, currency: 'CAD' }])
    const ibkr = usePortfolioStore.getState().holdings.filter((h) => h.account === 'IBKR')
    expect(ibkr).toHaveLength(2)
    expect(ibkr.find((h) => h.ticker === 'VFV')?.quantity).toBe(150)
    expect(ibkr.find((h) => h.ticker === 'AAPL')?.quantity).toBe(10)
  })

  it('add mode appends without touching existing rows', () => {
    const s = usePortfolioStore.getState()
    s.importHoldings('IBKR', 'replace', rows)
    s.importHoldings('RRSP', 'add', [rows[0]])
    expect(usePortfolioStore.getState().holdings).toHaveLength(3)
    expect(accountNames(usePortfolioStore.getState().holdings)).toEqual(['IBKR', 'RRSP'])
  })

  it('stamps importedAt and clears everything', () => {
    const s = usePortfolioStore.getState()
    s.importHoldings('IBKR', 'replace', rows)
    expect(usePortfolioStore.getState().importedAt).not.toBeNull()
    usePortfolioStore.getState().clearHoldings()
    expect(usePortfolioStore.getState().holdings).toHaveLength(0)
    expect(usePortfolioStore.getState().importedAt).toBeNull()
  })

  it('migrates v0 persisted holdings into the Default account', async () => {
    localStorage.setItem(
      'ledger-portfolio',
      JSON.stringify({
        state: {
          holdings: [{ id: 'h1', ticker: 'VFV', quantity: 100, avgCost: 120, currency: 'CAD' }],
          importedAt: '2026-01-01T00:00:00.000Z',
        },
        version: 0,
      }),
    )
    await usePortfolioStore.persist.rehydrate()
    const s = usePortfolioStore.getState()
    expect(s.holdings).toHaveLength(1)
    expect(s.holdings[0].account).toBe('Default')
    expect(s.holdings[0].ticker).toBe('VFV')
  })
})
