import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react'
import { CompareView } from './CompareView'
import { useCompensationStore, defaultPrimaryPackage } from '../../store/useCompensationStore'
import { usePlannerStore } from '../../store/usePlannerStore'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { createMatchingContract, createSharedTaxProfile, createWorkplacePlan } from '../../utils/finance/retirementTypes'
import { __resetMinInterval } from '../../services/marketData/throttle'
import { __setProviders, __resetProviders } from '../../services/marketData/marketDataService'
const ready = { schemaVersion: 1 as const, contracts: [], review: { status: 'ready' as const, issues: [] } }
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-11T12:00:00Z'))
  __resetMinInterval()
  useCompensationStore.setState({ primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100000, rsuGrants: [], retirement: ready }, comparePackage: null, showAfterTax: false, includePersonalDeductions: false })
  usePlannerStore.setState({ inputs: {}, salaryRetirementScenario: null, sharedTaxProfile: createSharedTaxProfile() })
  useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
  __setProviders({ fetchFxRate: async () => { throw new Error('offline') } })
})
afterEach(() => { __resetProviders(); vi.useRealTimers() })
it('initializes and saves every persisted offer field and independent retirement terms', async () => {
  const contract = createMatchingContract(createWorkplacePlan('dc-rpp', 'compare-plan'))
  contract.employee.value = 8655.32
  const offer = { ...defaultPrimaryPackage, id: 'compare', name: 'Saved Company', baseSalary: 130000.25, companyTicker: 'OTHER', companyCurrentPrice: 87.125, cashBonusMonth: 3, pastSalaryChanges: [{ id: 'past', changeMonth: 1, salary: 125000 }], retirement: { ...ready, contracts: [contract] } }
  useCompensationStore.getState().setComparePackage(offer)
  await act(async () => { render(<CompareView />) })
  expect(screen.getByLabelText('Base Salary ($)')).toHaveValue('130000.25')
  fireEvent.click(screen.getByRole('button', { name: 'Calculate Comparison' }))
  expect(useCompensationStore.getState().comparePackage).toEqual(offer)
  expect(useCompensationStore.getState().primaryPackage.retirement?.contracts).toEqual([])
})
it('shows separate gross funding and employee deltas, keeping unknown DB funding unknown', async () => {
  const contract = createMatchingContract(createWorkplacePlan('db-rpp'))
  contract.employee.value = 8655.32
  useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 130000, retirement: { ...ready, contracts: [contract] } })
  await act(async () => { render(<CompareView />) })
  expect(screen.getByText('Employer Retirement Funding Delta').parentElement).toHaveTextContent('Unknown')
  expect(screen.getByText('Employee Cash Outflow Delta').parentElement).toHaveTextContent('$8,655')
  expect(screen.getByText('Known Compensation Delta').parentElement).toHaveTextContent('$30,000 more')
})
it('does not save invalid live cash drafts or show stale precise deltas', async () => {
  useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 130000, retirement: ready })
  await act(async () => { render(<CompareView />) })
  fireEvent.change(screen.getByLabelText('Base Salary ($)'), { target: { value: '-1' } })
  expect(screen.getByRole('button', { name: 'Calculate Comparison' })).toBeDisabled()
  expect(screen.getByText('Known Compensation Delta').parentElement).toHaveTextContent('Needs Review')
})
it('shares the persisted personal selection and profile without changing saved personal values', async () => {
  usePlannerStore.getState().setInput('salary-tax', 'rrsp', 4321.23)
  useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 120000, retirement: ready })
  await act(async () => { render(<CompareView />) })
  fireEvent.click(screen.getByRole('checkbox', { name: 'Include Personal Deductions' }))
  expect(useCompensationStore.getState().includePersonalDeductions).toBe(true)
  expect(usePlannerStore.getState().salaryRetirementScenario?.personalRrsp).toBe(4321.23)
  fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
  expect(screen.getByText('Cash After Contributions Delta')).toBeInTheDocument()
})
it('keeps legacy funding labeled and blocks cash precision pending review', async () => {
  useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 100000, rrspMatchPercent: 5, rrspMatchCap: 4000, retirement: undefined })
  await act(async () => { render(<CompareView />) })
  expect(screen.getByText(/Legacy RRSP Estimate/)).toHaveTextContent('$4,000')
  fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
  expect(within(screen.getByText('Cash After Contributions Delta').parentElement!).getByText('Benefits Need Review')).toBeInTheDocument()
})

it('values both offers once at shared CAD FX with independent stock prices across display toggles', async () => {
 __setProviders({ fetchFxRate: async () => ({ from: 'USD', to: 'CAD', rate: 1.35, date: new Date().toISOString().slice(0, 10), asOf: new Date().toISOString() }) })
 useMarketDataStore.getState().setOverride('PRIMARY', 30)
 const grant = { id: 'grant', grantName: 'Annual', grantShares: 12, grantPrice: 10, grantStartDate: `${new Date().getFullYear() - 1}-12-01T12:00:00`, vestingSchedule: { preset: 'custom' as const, totalVestMonths: 12, cliffMonths: 0, frequency: 'monthly' as const } }
 useCompensationStore.getState().setPrimaryPackage({ companyTicker: 'PRIMARY', companyCurrentPrice: 10, rsuGrants: [grant] })
 useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 100000, companyTicker: 'OTHER', companyCurrentPrice: 20, rsuGrants: [grant], retirement: ready })
 await act(async () => { render(<CompareView />) })
 await waitFor(() => expect(screen.getByText('Known Compensation Delta').parentElement).toHaveTextContent('-$162 less'))
 act(() => useCompensationStore.getState().toggleCadConversion())
 expect(screen.getByText('Known Compensation Delta').parentElement).toHaveTextContent('-$162 less')
 expect(screen.getByLabelText('Company Stock Price ($)')).toHaveValue('20')
})
it.each(['missing-fx', 'legacy'])('blocks fallback values during invalid live draft with %s', async state => {
 useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 100000, esppContributionPercent: state === 'missing-fx' ? 10 : 0, esppLockedInPrice: 85, companyCurrentPrice: 100, rrspMatchPercent: state === 'legacy' ? 5 : 0, rrspMatchCap: state === 'legacy' ? 4000 : 0, retirement: state === 'legacy' ? undefined : ready })
 await act(async () => { render(<CompareView />) })
 fireEvent.change(screen.getByLabelText('Base Salary ($)'), { target: { value: '-5' } })
 const summary = document.querySelector('.retirement-summary-card')!
 expect(summary).not.toHaveTextContent('$100,000')
 expect(summary).not.toHaveTextContent('$4,000')
 expect(screen.getByText('Known Compensation Delta').parentElement).toHaveTextContent('Needs Review')
})
it('saves edited contract rows only through Calculate Comparison and reopens persisted rows', async () => {
 useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 100000, retirement: ready })
 const view = await act(async () => render(<CompareView />))
 fireEvent.click(screen.getByRole('button', { name: /2Workplace Plan/ }))
 fireEvent.click(screen.getByRole('button', { name: 'Add Workplace Plan' }))
 expect(useCompensationStore.getState().comparePackage?.retirement?.contracts).toEqual([])
 fireEvent.change(screen.getByLabelText('Employee Annual Contribution'), { target: { value: '3000.12345' } })
 fireEvent.click(screen.getByRole('button', { name: 'Calculate Comparison' }))
 expect(useCompensationStore.getState().comparePackage?.retirement?.contracts[0].employee.value).toBe(3000.12345)
 expect(useCompensationStore.getState().primaryPackage.retirement?.contracts).toEqual([])
 view.unmount(); await act(async () => { render(<CompareView />) })
 fireEvent.click(screen.getByRole('button', { name: /2Workplace Plan/ }))
 expect(screen.getByLabelText('Employee Annual Contribution')).toHaveValue('3000.12345')
})
it('shows every unknown earnings branch in after-tax cash ranges', async () => {
 const contracts = [1, 2].map(i => { const c = createMatchingContract(createWorkplacePlan('group-rrsp', `plan-${i}`)); c.unconditionalEmployer.value = 1250.25; return c })
 useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 50000, retirement: { ...ready, contracts } })
 await act(async () => { render(<CompareView />) })
 fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
 expect(screen.getByText('Cash After Contributions Delta').parentElement).toHaveTextContent(' to ')
 expect(screen.getByText(/All earnings combinations/)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button', { name: /5Review/ }))
 expect(screen.getByText(/All 4 comparison earnings/)).toBeInTheDocument()
})

it('shows both offers actual CAD and cash ranges alongside their deltas', async () => {
 useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, baseSalary: 120000, retirement: ready })
 await act(async () => { render(<CompareView />) })
 const resultArea = screen.getByRole('region', { name: 'Offer Comparison Results' })
 expect(within(resultArea).getByText('Current Offer')).toBeInTheDocument()
 expect(within(resultArea).getByText('Compare Offer')).toBeInTheDocument()
 expect(resultArea).toHaveTextContent('$100,000')
 expect(resultArea).toHaveTextContent('$120,000')
 fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
 expect(within(resultArea).getAllByText('Cash After Contributions')).toHaveLength(2)
})
it('names all comparison equity controls for keyboard and screen-reader users', async () => {
 await act(async () => { render(<CompareView />) })
 for (const label of ['Grant Name', 'Number of Shares', 'Grant Price ($)', 'Grant Start Date', 'Vesting', 'Frequency']) expect(screen.getByLabelText(label)).toBeInTheDocument()
 fireEvent.click(screen.getByLabelText('Vesting'))
 fireEvent.click(screen.getByRole('option', { name: 'Custom' }))
 expect(screen.getByLabelText('Total Vest (months)')).toBeInTheDocument()
 expect(screen.getByLabelText('Cliff (months)')).toBeInTheDocument()
})
