import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PortfolioView } from './PortfolioView'
import { PortfolioRollupWidget } from '../dashboard/widgets/PortfolioRollupWidget'
import { usePortfolioStore } from '../../store/usePortfolioStore'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { installMatchMedia } from '../../test-utils/matchMedia'

const HOLDINGS = [
  { id: 'h1', ticker: 'VFV', quantity: 10, avgCost: 100, currency: 'CAD' as const, account: 'TFSA' },
  { id: 'h2', ticker: 'AAPL', quantity: 10, avgCost: 200, currency: 'USD' as const, account: 'TFSA' },
]

beforeEach(() => {
  installMatchMedia()
  usePortfolioStore.setState({ holdings: HOLDINGS, importedAt: new Date().toISOString(), currencyReviewPending: false })
  // No cached quotes and no overrides: the live-price path is unavailable,
  // which is the exact condition under which the two totals used to disagree.
  useMarketDataStore.setState({ quotes: {}, overrides: {} })
})

const moneyOnScreen = (): string[] =>
  screen.getAllByText(/^\$[\d,]+/).map((el) => el.textContent!.trim())

describe('portfolio totals parity', () => {
  it('reports the same holdings value on the dashboard and on the Investments tab', () => {
    const { unmount } = render(<MemoryRouter><PortfolioRollupWidget /></MemoryRouter>)
    const rollupValues = moneyOnScreen()
    unmount()

    render(<MemoryRouter><PortfolioView /></MemoryRouter>)
    const viewValues = moneyOnScreen()

    // The rollup's headline value must appear among the Investments totals.
    expect(viewValues).toEqual(expect.arrayContaining([rollupValues[0]]))
  })
})
