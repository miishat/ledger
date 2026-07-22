import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HoldingRow } from './HoldingRow'
import { __setProviders, __resetProviders } from '../../services/marketData/marketDataService'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { __resetMinInterval } from '../../services/marketData/throttle'

beforeEach(() => {
  useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
  __resetMinInterval()
})

afterEach(() => {
  __resetProviders()
})

describe('quote currency', () => {
  it('converts a USD quote into the holding currency before computing P/L', async () => {
    __setProviders({
      fetchQuote: async () => ({
        ticker: 'ASML', price: 100, currency: 'USD', asOf: '2026-07-21T00:00:00.000Z',
      }) as never,
    })
    const holding = {
      id: '1', ticker: 'ASML', quantity: 1, avgCost: 50,
      currency: 'EUR' as const, account: 'A',
    }
    render(
      <table><tbody>
        <HoldingRow holding={holding} rates={{ USD: 1.37, EUR: 1.47 }} totalValueCad={1000} onPrice={() => {}} />
      </tbody></table>,
    )
    // 100 USD -> 137 CAD -> 93.20 EUR against a 50 EUR cost basis.
    expect(await screen.findByText('93.20')).toBeInTheDocument()
  })

  it('falls back to the native price and flags when the cross rate is missing', async () => {
    __setProviders({
      fetchQuote: async () => ({
        ticker: 'ASML', price: 100, currency: 'USD', asOf: '2026-07-21T00:00:00.000Z',
      }) as never,
    })
    const holding = {
      id: '1', ticker: 'ASML', quantity: 1, avgCost: 50,
      currency: 'EUR' as const, account: 'A',
    }
    render(
      <table><tbody>
        <HoldingRow holding={holding} rates={{}} totalValueCad={1000} onPrice={() => {}} />
      </tbody></table>,
    )
    expect(await screen.findByTitle(/quoted in USD/)).toBeInTheDocument()
  })

  it('renders a currency badge, and a prompt when the currency is unknown', () => {
    const holding = {
      id: '1', ticker: 'XXX', quantity: 1, avgCost: 50,
      currency: null, account: 'A',
    }
    render(
      <table><tbody>
        <HoldingRow holding={holding} rates={{}} totalValueCad={1000} onPrice={() => {}} />
      </tbody></table>,
    )
    expect(screen.getByText('Set currency')).toBeInTheDocument()
  })

  it('shows no allocation rather than 0% when the holding cannot be converted', () => {
    const holding = {
      id: '1', ticker: 'XXX', quantity: 1, avgCost: 50,
      currency: null, account: 'A',
    }
    render(
      <table><tbody>
        <HoldingRow holding={holding} rates={{}} totalValueCad={1000} onPrice={() => {}} />
      </tbody></table>,
    )
    expect(screen.getByTestId('allocation-cell')).toHaveTextContent('-')
    expect(screen.getByTestId('allocation-cell')).not.toHaveTextContent('0.0%')
  })

  it('shows no value, P/L, or allocation when the holding currency has a rate but the quote currency does not', async () => {
    __setProviders({
      fetchQuote: async () => ({
        ticker: 'ASML', price: 100, currency: 'USD', asOf: '2026-07-21T00:00:00.000Z',
      }) as never,
    })
    const holding = {
      id: '1', ticker: 'ASML', quantity: 1, avgCost: 50,
      currency: 'EUR' as const, account: 'A',
    }
    render(
      <table><tbody>
        {/* EUR has a rate; USD (the quote's currency) does not, so the
            cross rate is unavailable even though the holding's own
            currency converts fine. */}
        <HoldingRow holding={holding} rates={{ EUR: 1.47 }} totalValueCad={1000} onPrice={() => {}} />
      </tbody></table>,
    )
    await screen.findByTitle(/quoted in USD/)
    expect(screen.getByTestId('value-cell')).toHaveTextContent('-')
    expect(screen.getByTestId('pl-cell')).toHaveTextContent('-')
    expect(screen.getByTestId('allocation-cell')).toHaveTextContent('-')
    expect(screen.getByTestId('allocation-cell')).not.toHaveTextContent('0.0%')
  })
})
