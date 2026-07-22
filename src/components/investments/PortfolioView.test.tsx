import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { PortfolioView } from './PortfolioView'
import { usePortfolioStore, type Holding } from '../../store/usePortfolioStore'
import { __setProviders, __resetProviders } from '../../services/marketData/marketDataService'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { __resetMinInterval } from '../../services/marketData/throttle'

// Ticker -> quote override, consulted by the mocked useCurrentPrice below.
// Empty by default so every existing test keeps getting the idle/no-quote
// response; individual tests populate an entry to simulate a live quote
// coming back in a specific currency (the account-subtotal regression test
// below needs a quote whose currency differs from the holding's own).
const mockQuotes = vi.hoisted(() => new Map<string, { price: number; currency: string }>())

vi.mock('../../services/marketData', () => ({
  useCurrentPrice: (ticker: string) => {
    const q = mockQuotes.get(ticker)
    if (!q) return { data: undefined, status: 'idle', refresh: () => {}, setManual: () => {}, clearManual: () => {} }
    return {
      data: { value: { ticker, price: q.price, currency: q.currency, asOf: '2026-07-21T00:00:00.000Z' }, source: 'live', stale: false },
      status: 'success',
      refresh: () => {},
      setManual: () => {},
      clearManual: () => {},
    }
  },
  useFxRate: () => ({ data: undefined, status: 'idle', refresh: () => {} }),
}))

// CAD so useFxRates resolves without a network call (CAD-to-CAD is 1
// unconditionally); avoids these render-only tests making a real FX request.
function buildHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: 'h-1',
    ticker: 'AAPL',
    quantity: 10,
    avgCost: 100,
    currency: 'CAD',
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

describe('multi-currency totals', () => {
  it('flags holdings excluded from the CAD totals', async () => {
    usePortfolioStore.setState({
      holdings: [
        { id: '1', ticker: 'ENB', quantity: 10, avgCost: 50, currency: 'CAD', account: 'A' },
        { id: '2', ticker: 'XXX', quantity: 10, avgCost: 50, currency: null, account: 'A' },
      ],
      importedAt: '2026-07-21T00:00:00.000Z',
    })
    render(<PortfolioView />)
    expect(await screen.findByText(/1 holding excluded, no FX rate/)).toBeInTheDocument()
  })

  it('says nothing about exclusions when every currency resolves', async () => {
    usePortfolioStore.setState({
      holdings: [
        { id: '1', ticker: 'ENB', quantity: 10, avgCost: 50, currency: 'CAD', account: 'A' },
      ],
      importedAt: '2026-07-21T00:00:00.000Z',
    })
    render(<PortfolioView />)
    expect(await screen.findByText('Total Invested (CAD)')).toBeInTheDocument()
    expect(screen.queryByText(/excluded, no FX rate/)).not.toBeInTheDocument()
  })
})

describe('FX provenance footer', () => {
  beforeEach(() => {
    useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
    __resetMinInterval()
    __setProviders({
      fetchFxRate: async (from, to) => ({
        from, to, rate: 1.3712, date: '2026-07-21', asOf: '2026-07-21T00:00:00.000Z',
      }) as never,
    })
  })

  afterEach(() => {
    __resetProviders()
  })

  it('shows each resolved currency alongside its rate source', async () => {
    usePortfolioStore.setState({
      holdings: [
        { id: '1', ticker: 'AAPL', quantity: 10, avgCost: 50, currency: 'USD', account: 'A' },
      ],
      importedAt: '2026-07-21T00:00:00.000Z',
    })
    render(<PortfolioView />)
    expect(await screen.findByText(/USD 1\.3712 \(live\)/)).toBeInTheDocument()
  })
})

describe('holdings table polish', () => {
  beforeEach(() => {
    usePortfolioStore.setState({
      holdings: [
        { id: '1', ticker: 'ENB', quantity: 10, avgCost: 10, currency: 'CAD', account: 'RRSP' },
        { id: '2', ticker: 'BCE', quantity: 10, avgCost: 30, currency: 'CAD', account: 'RRSP' },
      ],
      importedAt: '2026-07-21T00:00:00.000Z',
      currencyReviewPending: false,
    })
  })

  it('shows a subtotal in the account header', async () => {
    render(<PortfolioView />)
    expect(await screen.findByText(/RRSP/)).toBeInTheDocument()
    expect(screen.getByTestId('account-subtotal-RRSP')).toHaveTextContent('$400')
  })

  it('sorts by value descending by default', async () => {
    render(<PortfolioView />)
    const tickers = (await screen.findAllByTestId('holding-ticker')).map((n) => n.textContent)
    expect(tickers).toEqual(['BCE', 'ENB'])
  })

  it('reverses the order when the value header is clicked', async () => {
    render(<PortfolioView />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sort by Value' }))
    const tickers = screen.getAllByTestId('holding-ticker').map((n) => n.textContent)
    expect(tickers).toEqual(['ENB', 'BCE'])
  })

  it('renders an allocation bar per row', async () => {
    render(<PortfolioView />)
    expect(await screen.findAllByTestId('allocation-bar')).toHaveLength(2)
  })
})

describe('account subtotal correctness', () => {
  beforeEach(() => {
    useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
    __resetMinInterval()
    // USD has no rate into CAD, so a quote that comes back in USD for a CAD
    // holding is unconvertible. CAD-to-CAD never reaches this provider (it
    // is short-circuited to 1), so throwing here only affects the trap.
    __setProviders({
      fetchFxRate: async () => { throw new Error('no rate available in test') },
    })
    mockQuotes.set('TRAP', { price: 200, currency: 'USD' })
  })

  afterEach(() => {
    __resetProviders()
    mockQuotes.clear()
  })

  it('excludes an unconvertible holding from the account subtotal instead of reading its raw quote currency as CAD', async () => {
    usePortfolioStore.setState({
      holdings: [
        { id: '1', ticker: 'ENB', quantity: 10, avgCost: 10, currency: 'CAD', account: 'RRSP' },
        // TRAP's own currency is CAD, but its live quote resolves in USD and
        // there is no USD rate, so its CAD value is unknown, not 2000.
        { id: '2', ticker: 'TRAP', quantity: 10, avgCost: 50, currency: 'CAD', account: 'RRSP' },
      ],
      importedAt: '2026-07-21T00:00:00.000Z',
      currencyReviewPending: false,
    })
    render(<PortfolioView />)
    await screen.findByText(/RRSP/)

    // TRAP's own row (table and mobile card) must still show a dash.
    const valueCells = await screen.findAllByTestId('value-cell')
    expect(valueCells.filter((c) => c.textContent === '-')).toHaveLength(2)
    expect(valueCells.filter((c) => c.textContent === '$100')).toHaveLength(2)

    // The subtotal must reflect only ENB's $100, not ENB plus TRAP's raw
    // USD price of 200 misread as 2000 CAD dollars ($100 + $1,500 P/L would
    // appear if the bug were present).
    const subtotal = screen.getByTestId('account-subtotal-RRSP')
    expect(subtotal).toHaveTextContent('$100')
    expect(subtotal).not.toHaveTextContent('$2,100')
    expect(subtotal).not.toHaveTextContent('$1,500')
  })
})
