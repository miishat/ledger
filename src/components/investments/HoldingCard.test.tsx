import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { HoldingCard } from './HoldingCard'
import type { Holding } from '../../store/usePortfolioStore'

const { useCurrentPriceMock } = vi.hoisted(() => ({ useCurrentPriceMock: vi.fn() }))

vi.mock('../../services/marketData', () => ({
  useCurrentPrice: useCurrentPriceMock,
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

describe('HoldingCard', () => {
  it('shows a loading skeleton for the current price instead of avgCost while the live quote is loading', () => {
    useCurrentPriceMock.mockReturnValue({
      data: undefined,
      status: 'loading',
      refresh: () => {},
      setManual: () => {},
      clearManual: () => {},
    })

    const { container } = render(
      <HoldingCard holding={buildHolding()} rates={{ USD: 1 }} totalValueCad={1000} onPrice={() => {}} />,
    )

    // avgCost (100.00) must not appear as the rendered "current price" — it still
    // appears once for the Avg Cost field itself, so assert on skeleton presence.
    const skeletons = container.querySelectorAll('[aria-hidden="true"].animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders the live price once loaded, with no skeletons', () => {
    useCurrentPriceMock.mockReturnValue({
      data: { value: { price: 150 }, source: 'test', stale: false },
      status: 'success',
      refresh: () => {},
      setManual: () => {},
      clearManual: () => {},
    })

    const { container } = render(
      <HoldingCard holding={buildHolding()} rates={{ USD: 1 }} totalValueCad={1000} onPrice={() => {}} />,
    )

    expect(container.textContent).toContain('150.00')
    const skeletons = container.querySelectorAll('[aria-hidden="true"].animate-pulse')
    expect(skeletons.length).toBe(0)
  })

  it('shows no allocation rather than 0% when the holding cannot be converted', () => {
    useCurrentPriceMock.mockReturnValue({
      data: undefined,
      status: 'idle',
      refresh: () => {},
      setManual: () => {},
      clearManual: () => {},
    })

    const { getByTestId, getByText } = render(
      <HoldingCard
        holding={buildHolding({ currency: null })}
        rates={{}}
        totalValueCad={1000}
        onPrice={() => {}}
      />,
    )

    expect(getByTestId('allocation-cell')).toHaveTextContent('-')
    expect(getByTestId('allocation-cell')).not.toHaveTextContent('0.0%')
    expect(getByText('Set currency')).toBeInTheDocument()
  })
})
