import { describe, expect, it, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { PortfolioView } from './PortfolioView'
import { usePortfolioStore, type Holding } from '../../store/usePortfolioStore'

vi.mock('../../services/marketData', () => ({
  useCurrentPrice: () => ({ data: undefined, status: 'idle', refresh: () => {}, setManual: () => {}, clearManual: () => {} }),
  useFxRate: () => ({ data: undefined, status: 'idle', refresh: () => {} }),
}))

function buildHolding(): Holding {
  return {
    id: 'h-1',
    ticker: 'AAPL',
    quantity: 10,
    avgCost: 100,
    currency: 'USD',
    account: 'Default',
  }
}

describe('PortfolioView', () => {
  beforeEach(() => {
    usePortfolioStore.setState({ holdings: [buildHolding()], importedAt: '2026-01-01T00:00:00Z' })
  })

  it('renders a mobile card list alongside the desktop table with matching values', () => {
    const { container } = render(<PortfolioView />)

    const cards = container.querySelector('[data-testid="portfolio-cards"]')
    expect(cards).not.toBeNull()
    expect(cards?.textContent).toContain('AAPL')
    expect(cards?.textContent).toContain('$1,000')

    const table = container.querySelector('table')
    expect(table).not.toBeNull()
    expect(table?.textContent).toContain('AAPL')
  })
})
