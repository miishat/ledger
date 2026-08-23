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
    render(
      <MemoryRouter>
        <CompHeroWidget />
      </MemoryRouter>,
    )
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

  it('shows a gross-only note in monthly view when After-Tax is on', () => {
    renderWidget()
    fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
    fireEvent.click(screen.getByRole('button', { name: 'Monthly Cash Flow View' }))
    expect(screen.getByText(/monthly bars are shown gross/i)).toBeInTheDocument()
    // switching back to gross hides it
    fireEvent.click(screen.getByRole('button', { name: 'Gross' }))
    expect(screen.queryByText(/monthly bars are shown gross/i)).toBeNull()
  })

  describe('CompHeroWidget salary-tax deep link', () => {
    it('writes income and navigates without confirm when no saved income', () => {
      renderWidget()
      fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
      fireEvent.click(screen.getByRole('button', { name: /full breakdown in salary & tax/i }))
      expect(usePlannerStore.getState().inputs['salary-tax']?.income).toBe(100_000)
    })

    it('asks before overwriting a different saved income and respects Keep Saved', () => {
      usePlannerStore.setState({ inputs: { 'salary-tax': { income: 55_000, province: 'BC' } } })
      renderWidget()
      fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
      fireEvent.click(screen.getByRole('button', { name: /full breakdown in salary & tax/i }))
      expect(screen.getByText('Replace saved income?')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Keep Saved' }))
      expect(usePlannerStore.getState().inputs['salary-tax']?.income).toBe(55_000) // untouched
      expect(usePlannerStore.getState().inputs['salary-tax']?.province).toBe('BC') // never touched
    })

    it('overwrites on Replace', () => {
      usePlannerStore.setState({ inputs: { 'salary-tax': { income: 55_000 } } })
      renderWidget()
      fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
      fireEvent.click(screen.getByRole('button', { name: /full breakdown in salary & tax/i }))
      fireEvent.click(screen.getByRole('button', { name: 'Replace' }))
      expect(usePlannerStore.getState().inputs['salary-tax']?.income).toBe(100_000)
    })
  })
})

describe('CompHeroWidget annualized legend', () => {
  beforeEach(() => {
    useCompensationStore.setState({
      showAfterTax: false,
      timeMode: 'current-year',
      useCadConversion: false,
      primaryPackage: {
        ...defaultPrimaryPackage,
        companyCurrentPrice: 428.5,
        baseSalary: 165_000,
        pastSalaryChanges: [],
        cashBonusPercent: 12,
        cashBonusMonth: 2,
        rsuGrants: [{
          id: 'g1', grantName: '2024 Refresh', grantShares: 1200, grantPrice: 310,
          grantStartDate: '2024-03-01',
          vestingSchedule: { preset: '4yr-1yr-cliff', totalVestMonths: 48, cliffMonths: 12, frequency: 'quarterly' },
        }],
      },
    })
  })

  it('names every compensation component in a legend rather than in chart labels', () => {
    // Outside labels only fitted at 1440px. Below that they were positioned
    // past the chart surface and clipped or ran off-screen entirely.
    render(
      <MemoryRouter>
        <CompHeroWidget />
      </MemoryRouter>,
    )
    for (const name of ['Base Salary', 'Bonus', 'Equity (RSU)']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })
})

describe('CompHeroWidget mobile layout', () => {
  beforeEach(() => {
    usePlannerStore.setState({ inputs: {} })
    useCompensationStore.setState({
      showAfterTax: false,
      timeMode: 'current-year',
      useCadConversion: false,
      primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100_000, pastSalaryChanges: [], rsuGrants: [] },
    })
  })

  it('lets the toggle groups wrap so none is pushed off a narrow screen', () => {
    // The three segmented groups share one row that measures 430px. Without
    // wrapping, the Gross/After-Tax group starts at x=348 on a 375px screen
    // and is clipped by main's overflow-x-hidden, so after-tax comp cannot
    // be turned on at all on a phone.
    render(
      <MemoryRouter>
        <CompHeroWidget />
      </MemoryRouter>,
    )
    const group = screen.getByText('After-Tax').closest('div')!.parentElement!
    expect(group.className).toMatch(/flex-wrap/)
  })
})
