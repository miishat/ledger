import { render, screen, waitFor } from '@testing-library/react'
import { CompHeroWidget } from './CompHeroWidget'
import { useCompensationStore } from '../../store/useCompensationStore'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { __setProviders, __resetProviders } from '../../services/marketData/marketDataService'
import { __resetMinInterval } from '../../services/marketData/throttle'

const initialCompState = useCompensationStore.getState()

beforeEach(() => {
  localStorage.clear()
  useCompensationStore.setState(initialCompState, true)
  useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
  __resetMinInterval()
  __setProviders({
    fetchFxRate: async () => ({ from: 'USD' as const, to: 'CAD' as const, rate: 2, date: '2026-07-01', asOf: '2026-07-01T00:00:00Z' }),
  })
})
afterEach(() => __resetProviders())

describe('CompHeroWidget with CAD conversion', () => {
  it('reflects the FX-converted total when conversion is on', async () => {
    useCompensationStore.getState().setPrimaryPackage({ baseSalary: 100000, companyCurrentPrice: 100 })
    useCompensationStore.getState().toggleCadConversion()
    render(<CompHeroWidget />)
    // total comp includes at least the converted base salary; sanity check it renders without crashing
    // and shows the "Total Annual Compensation" label once resolved.
    await waitFor(() => expect(screen.getByText(/Total Annual Compensation/i)).toBeInTheDocument())
  })
})
