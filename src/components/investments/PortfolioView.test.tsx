import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { PortfolioView } from './PortfolioView'
import { usePortfolioStore, type Holding } from '../../store/usePortfolioStore'

vi.mock('../../services/marketData', () => ({
  useCurrentPrice: () => ({ data: undefined, status: 'idle', refresh: () => {}, setManual: () => {}, clearManual: () => {} }),
  useFxRate: () => ({ data: undefined, status: 'idle', refresh: () => {} }),
}))

function buildHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: 'h-1',
    ticker: 'AAPL',
    quantity: 10,
    avgCost: 100,
    currency: 'USD',
    account: 'Default',
    ...overrides,
  }
}

const initialPortfolioState = usePortfolioStore.getState()

describe('PortfolioView', () => {
  beforeEach(() => {
    usePortfolioStore.setState({ holdings: [buildHolding()], importedAt: '2026-01-01T00:00:00Z' })
  })

  afterEach(() => {
    usePortfolioStore.setState(initialPortfolioState, true)
  })

  it('renders a mobile card list alongside the desktop table with matching values', () => {
    const { container } = render(<PortfolioView />)

    const cards = container.querySelector('[data-testid="portfolio-cards-Default"]')
    expect(cards).not.toBeNull()
    expect(cards?.textContent).toContain('AAPL')
    expect(cards?.textContent).toContain('$1,000')

    const table = container.querySelector('table')
    expect(table).not.toBeNull()
    expect(table?.textContent).toContain('AAPL')
  })

  it('gives each account its own uniquely queryable mobile card list', () => {
    usePortfolioStore.setState({
      holdings: [
        buildHolding({ id: 'h-1', ticker: 'AAPL', account: 'acc1' }),
        buildHolding({ id: 'h-2', ticker: 'VFV', account: 'acc2', currency: 'CAD' }),
      ],
      importedAt: '2026-01-01T00:00:00Z',
    })

    const { getByTestId } = render(<PortfolioView />)

    const acc1Cards = getByTestId('portfolio-cards-acc1')
    const acc2Cards = getByTestId('portfolio-cards-acc2')

    expect(acc1Cards.textContent).toContain('AAPL')
    expect(acc1Cards.textContent).not.toContain('VFV')

    expect(acc2Cards.textContent).toContain('VFV')
    expect(acc2Cards.textContent).not.toContain('AAPL')
  })
})
