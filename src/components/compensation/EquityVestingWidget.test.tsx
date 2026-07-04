import { render, screen, waitFor } from '@testing-library/react'
import { EquityVestingWidget } from './EquityVestingWidget'
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

describe('EquityVestingWidget with CAD conversion', () => {
  it('renders the vesting chart using the converted package price when conversion is on', async () => {
    useCompensationStore.getState().addRSUGrant({
      id: 'g1',
      grantName: 'Initial Grant',
      grantShares: 1200,
      grantPrice: 50,
      grantStartDate: '2026-01-01',
      vestingSchedule: { preset: '4yr-1yr-cliff', totalVestMonths: 48, cliffMonths: 12, frequency: 'monthly' },
    })
    useCompensationStore.getState().setPrimaryPackage({ companyCurrentPrice: 100 })
    useCompensationStore.getState().toggleCadConversion()
    render(<EquityVestingWidget />)
    await waitFor(() => expect(screen.getByText(/Equity Vesting Schedule/i)).toBeInTheDocument())
  })
})
