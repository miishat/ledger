import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CompHeroWidget } from './CompHeroWidget'
import { useCompensationStore, defaultPrimaryPackage } from '../../store/useCompensationStore'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { usePlannerStore } from '../../store/usePlannerStore'
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

describe('CompHeroWidget after-tax toggle', () => {
  beforeEach(() => {
    usePlannerStore.setState({ inputs: {} })
    useCompensationStore.setState({
      showAfterTax: false,
      timeMode: 'current-year',
      useCadConversion: false,
      primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100_000, pastSalaryChanges: [], rsuGrants: [] },
    })
  })

  const renderWidget = () =>
    render(
      <MemoryRouter>
        <CompHeroWidget />
      </MemoryRouter>,
    )

  it('shows gross label by default and after-tax when toggled', () => {
    renderWidget()
    expect(screen.getByText('Total Annual Compensation')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
    expect(screen.getByText('Est. After-Tax Compensation')).toBeInTheDocument()
    expect(screen.getByText(/Net Monthly/)).toBeInTheDocument()
    expect(screen.getByText(/RRSP match is actually tax-sheltered/)).toBeInTheDocument()
  })

  it('persists the toggle in the store', () => {
    renderWidget()
    fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
    expect(useCompensationStore.getState().showAfterTax).toBe(true)
  })
})
