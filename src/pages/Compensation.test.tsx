import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Compensation } from './Compensation'
import { useCompensationStore } from '../store/useCompensationStore'
import { useMarketDataStore } from '../store/useMarketDataStore'
import { __setProviders, __resetProviders } from '../services/marketData/marketDataService'
import { __resetMinInterval } from '../services/marketData/throttle'

const initialCompState = useCompensationStore.getState()

beforeEach(() => {
  localStorage.clear()
  useCompensationStore.setState(initialCompState, true)
  useCompensationStore.setState({
    primaryPackage: {
      ...useCompensationStore.getState().primaryPackage,
      companyTicker: 'AAPL',
      baseSalary: 150000,
    },
  })
  useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
  __resetMinInterval()
  __setProviders({
    fetchQuote: async () => ({ ticker: 'AAPL', price: 150, currency: 'USD' as const, asOf: '2026-07-01T00:00:00Z' }),
    fetchFxRate: async () => ({ from: 'USD' as const, to: 'CAD' as const, rate: 1.35, date: '2026-07-01', asOf: '2026-07-01T00:00:00Z' }),
  })
})
afterEach(() => __resetProviders())

describe('Compensation page - live price + CAD toggle', () => {
  it('shows a Convert to CAD toggle that flips the store flag', async () => {
    render(<MemoryRouter><Compensation /></MemoryRouter>)
    const toggle = screen.getByRole('button', { name: /convert to cad/i })
    expect(useCompensationStore.getState().useCadConversion).toBe(false)
    fireEvent.click(toggle)
    await waitFor(() => expect(useCompensationStore.getState().useCadConversion).toBe(true))
  })

  it('shows a refresh price control', () => {
    render(<MemoryRouter><Compensation /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /refresh price/i })).toBeInTheDocument()
  })
})
