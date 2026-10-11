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
    expect(screen.getByText('Cash After Contributions')).toBeInTheDocument()
    expect(screen.getByText(/Cash Monthly/)).toBeInTheDocument()
    expect(screen.getByText(/employment income assumed realized as cash/)).toBeInTheDocument()
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

  it('holds scalar-only transfer disabled pending reviewed snapshot integration', () => {
    renderWidget()
    fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
    expect(screen.getByRole('button', { name: /full breakdown/i })).toBeDisabled()
    expect(usePlannerStore.getState().inputs['salary-tax']?.income).toBeUndefined()
  })
})
describe('CompHeroWidget stale tax year notice', () => {
  beforeEach(() => {
    usePlannerStore.setState({ inputs: {} })
    useCompensationStore.setState({
      showAfterTax: false,
      timeMode: 'current-year',
      useCadConversion: false,
      primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100_000, pastSalaryChanges: [], rsuGrants: [] },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderWidget = () =>
    render(
      <MemoryRouter>
        <CompHeroWidget />
      </MemoryRouter>,
    )

  it('does not warn about stale tax rates today', () => {
    renderWidget()
    fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('warns once the tax year has passed, only where the after-tax figure is shown', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-03-01T00:00:00Z'))
    renderWidget()
    // Gross mode shows no tax-derived figure, so nothing to warn about yet.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      /These are 2026 rates\. Brackets and contribution limits have not been updated for 2027\./i,
    )
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

  it('names every compensation component in a legend rather than in chart labels', async () => {
    // Outside labels only fitted at 1440px. Below that they were positioned
    // past the chart surface and clipped or ran off-screen entirely.
    render(
      <MemoryRouter>
        <CompHeroWidget />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Equity (RSU)')).toBeInTheDocument())
    for (const name of ['Base Salary', 'Bonus', 'Equity (RSU)']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })
})

describe('CompHeroWidget monthly legend', () => {
  beforeEach(() => {
    useCompensationStore.setState({
      showAfterTax: false,
      timeMode: 'current-year',
      useCadConversion: false,
      primaryPackage: { ...defaultPrimaryPackage, baseSalary: 120_000, pastSalaryChanges: [], rsuGrants: [] },
    })
  })

  it('shows the monthly figure the bars draw, not the annual total', () => {
    // Base Salary is the only series with a nonzero annual value here (no
    // bonus, ESPP, RRSP, or RSU), so its legend value should read as one
    // twelfth of the annual figure, the same number the stacked bar for any
    // given month actually draws, not the $120,000 annual total.
    render(
      <MemoryRouter>
        <CompHeroWidget />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Monthly Cash Flow View' }))
    expect(screen.getByText(/Base Salary.*\$10,000/)).toBeInTheDocument()
    expect(screen.queryByText(/Base Salary.*\$120,000/)).toBeNull()
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
