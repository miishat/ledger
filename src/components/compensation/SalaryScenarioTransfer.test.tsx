import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SalaryTaxTool } from '../planner/SalaryTaxTool'
import { SalaryScenarioTransfer } from './SalaryScenarioTransfer'
import { usePlannerStore } from '../../store/usePlannerStore'
import { createMatchingContract, createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from '../../utils/finance/retirementTypes'
import { resolveCompensationRetirement, buildSalaryRetirementSnapshot } from '../../utils/finance/compensationRetirement'
import { defaultPrimaryPackage } from '../../store/useCompensationStore'
import { estimateRetirement } from '../../utils/finance/retirementEstimate'
const profile = { ...createSharedTaxProfile('QC'), rrspDeductionLimit: { state: 'known' as const, value: 15000.25, sourceYear: 2026 }, rrspContributionRoom: { state: 'known' as const, value: 11000.75, sourceYear: 2026 } }
const contract = createMatchingContract(createWorkplacePlan('group-rrsp', 'new'))
contract.employee.value = 3000.15
contract.unconditionalEmployer.value = 2500.25
function result(includePersonalDeductions = false) {
 return resolveCompensationRetirement({ ...defaultPrimaryPackage, baseSalary: 50000.25, cashBonusPercent: 10, esppContributionPercent: 10, esppDiscountPercent: 15, esppLockedInPrice: 85, companyCurrentPrice: 100.125, rsuGrants: [{ id: 'grant', grantName: 'Shares', grantShares: 12, grantPrice: 100, grantStartDate: '2025-12-01T12:00:00', vestingSchedule: { preset: 'custom', totalVestMonths: 12, cliffMonths: 0, frequency: 'monthly' } }], retirement: { schemaVersion: 1, contracts: [contract], review: { status: 'ready', issues: [] } } }, { timeMode: 'current-year', fx: { stockCurrency: 'USD', cadPerStockUnit: 1.35 }, profile, personalRrsp: 4321.23, personalFhsa: 1234.56, includePersonalDeductions })
}
function Destination() { const location = useLocation(); return <p>Salary destination {JSON.stringify(location.state)}</p> }
function show(r = result(), blocked = false) { return render(<MemoryRouter><Routes><Route path="/" element={<SalaryScenarioTransfer result={r} blocked={blocked} />} /><Route path="/planner/salary-tax" element={<Destination />} /></Routes></MemoryRouter>) }
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));  usePlannerStore.setState({ inputs: { unrelated: { value: 91 } }, sharedTaxProfile: profile, salaryRetirementScenario: { ...createRetirementScenario(), cashEmploymentIncome: 80000.15, personalRrsp: 4321.23, personalFhsa: 1234.56, workplacePlans: [{ ...createWorkplacePlan('dc-rpp', 'old'), employeeContribution: 8655.32 }] }, importedSalaryBaseline: null }) })
afterEach(() => vi.useRealTimers())
it('reviews changed cash, destinations, classifications and source assumptions before replacement', () => {
 show(); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }))
 expect(screen.getByRole('dialog')).toHaveTextContent('Replace Salary & Tax Scenario')
 expect(screen.getByRole('dialog')).toHaveTextContent('Defined-Contribution Pension')
 expect(screen.getByRole('dialog')).toHaveTextContent('Group RRSP')
 expect(screen.getByRole('dialog')).toHaveTextContent('2026')
 expect(screen.getByRole('dialog')).toHaveTextContent('Employer Taxable RRSP Benefit')
 expect(screen.getByRole('dialog')).toHaveTextContent('Registered-Plan Compensation')
 expect(screen.getByRole('dialog')).toHaveTextContent('Member Direction')
 expect(screen.getByRole('dialog')).toHaveTextContent('EI Earnings')
 expect(screen.getByRole('dialog')).toHaveTextContent('shares are sold')
})
it('cancel preserves the whole persisted planner state, including excluded nonzero personal amounts', () => {
 const before = JSON.stringify(usePlannerStore.getState())
 const storageBefore = localStorage.getItem('ledger-planner')
 show(); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ })); fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
 expect(JSON.stringify(usePlannerStore.getState())).toBe(before)
 expect(localStorage.getItem('ledger-planner')).toBe(storageBefore)
 expect(screen.queryByText(/Salary destination/)).not.toBeInTheDocument()
})
it.each([false, true])('atomically transfers exact cash once with personal selection %s and retains live shared limits', include => {
 const r = result(include); show(r)
 fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }))
 const states: unknown[] = []; const unsubscribe = usePlannerStore.subscribe(s => states.push(s.salaryRetirementScenario))
 fireEvent.click(screen.getByRole('button', { name: 'Replace Scenario' })); unsubscribe()
 expect(states).toHaveLength(1)
 const saved = usePlannerStore.getState().salaryRetirementScenario!
 const independentCash = 50000.25 + 5000.025 + 12 * 100.125 * 1.35 + 5000.025 * (100.125 / 85 - 1)
 expect(saved.cashEmploymentIncome).toBeCloseTo(independentCash, 8)
 expect(saved.cashEmploymentIncome).toBe(r.scenario!.cashEmploymentIncome)
 expect(saved.workplacePlans).toHaveLength(1)
 expect(saved.workplacePlans[0].employeeContribution).toBe(3000.15)
 expect(saved.workplacePlans[0].employerContribution).toBe(2500.25)
 expect(saved.includePersonalDeductions).toBe(include)
 expect(saved.personalRrsp).toBe(4321.23)
 expect(saved.personalFhsa).toBe(1234.56)
 expect(estimateRetirement(saved, profile).branches).toEqual(r.estimate!.branches)
 const newProfile = { ...profile, rrspDeductionLimit: { state: 'known' as const, value: 0, sourceYear: 2026 } }
 usePlannerStore.getState().setSharedTaxProfile(newProfile)
 expect(estimateRetirement(saved, usePlannerStore.getState().sharedTaxProfile).branches[0].rrspDeduction).toBe(0)
 expect(usePlannerStore.getState().inputs.unrelated).toEqual({ value: 91 })
})
it('Keep Existing opens with a clear difference notice and does not mutate persisted values', () => {
 const before = JSON.stringify(usePlannerStore.getState())
 show(); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ })); fireEvent.click(screen.getByRole('button', { name: 'Keep Existing' }))
 expect(JSON.stringify(usePlannerStore.getState())).toBe(before)
 expect(screen.getByText(/Salary destination/)).toHaveTextContent('differs from the Compensation package')
})
it('opens unchanged canonical inputs directly without rewriting provenance or transfer time', () => {
 const snapshot = buildSalaryRetirementSnapshot(result(), '2026-09-01T12:00:00Z')!
 usePlannerStore.getState().importSalaryRetirementScenario(snapshot)
 const before = JSON.stringify(usePlannerStore.getState())
 show(); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }))
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
 expect(screen.getByText(/Salary destination/)).toBeInTheDocument()
 expect(JSON.stringify(usePlannerStore.getState())).toBe(before)
})
it('transfers directly when absent, preserving unknown restriction branches and later edit rebuilding', () => {
 usePlannerStore.setState({ salaryRetirementScenario: null, inputs: { 'salary-tax': { rrsp: 4321.23, fhsa: 1234.56 } } })
 show(); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }))
 const state = usePlannerStore.getState(); const saved = state.salaryRetirementScenario!
 expect(saved.workplacePlans[0].withdrawalRestriction).toBe('unknown')
 expect(estimateRetirement(saved, profile).branches).toHaveLength(2)
 state.updateSalaryRetirementScenario({ cashEmploymentIncome: 40000.125, workplacePlans: [{ ...saved.workplacePlans[0], employerContribution: 2000.15, withdrawalRestriction: 'withdrawable' }] })
 const edited = usePlannerStore.getState().salaryRetirementScenario!
 const estimate = estimateRetirement(edited, profile)
 expect(estimate.branches[0].employmentIncome).toBe(42000.275)
 expect(estimate.branches[0].context.eiEarnings).toBe(42000.275)
 expect(edited.provenance?.editedAfterTransfer).toBe(true)
})
it.each(['blocked', 'conversion', 'review'])('blocks transfer for %s', state => {
 const r = result(); if (state === 'conversion') r.status = 'conversion-needed'; if (state === 'review') r.status = 'review-needed'
 show(r, state === 'blocked'); expect(screen.getByRole('button', { name: /Full breakdown/ })).toBeDisabled()
})

it('renders the retained-scenario difference notice on the actual Salary & Tax route', () => {
 render(<MemoryRouter><Routes><Route path="/" element={<SalaryScenarioTransfer result={result()} />} /><Route path="/planner/salary-tax" element={<SalaryTaxTool />} /></Routes></MemoryRouter>)
 fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ })); fireEvent.click(screen.getByRole('button', { name: 'Keep Existing' }))
 expect(screen.getByRole('status')).toHaveTextContent('differs from the Compensation package')
})
it('reviews invalid saved scenario data safely before an explicit replacement', () => {
 usePlannerStore.setState({ salaryRetirementScenario: { ...createRetirementScenario(), workplacePlans: [null] } as never })
 show(); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }))
 expect(screen.getByRole('dialog')).toHaveTextContent('Saved Scenario Needs Review')
 fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
 expect(usePlannerStore.getState().salaryRetirementScenario!.workplacePlans).toEqual([null])
})

it('requires review for differences smaller than displayed rounding and for personal inclusion', () => {
 const snapshot = buildSalaryRetirementSnapshot(result())!
 usePlannerStore.getState().importSalaryRetirementScenario(snapshot)
 usePlannerStore.getState().updateSalaryRetirementScenario({ cashEmploymentIncome: snapshot.cashEmploymentIncome + 0.00001 })
 show(); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }))
 expect(screen.getByRole('dialog')).toBeInTheDocument()
})
it('opens equivalent typed inputs despite reordered object keys and historical metadata', () => {
 const snapshot = buildSalaryRetirementSnapshot(result())!
 snapshot.workplacePlans = snapshot.workplacePlans.map(p => Object.fromEntries(Object.entries(p).reverse()) as typeof p)
 usePlannerStore.getState().importSalaryRetirementScenario(snapshot)
 const before = JSON.stringify(usePlannerStore.getState())
 show(); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }))
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
 expect(JSON.stringify(usePlannerStore.getState())).toBe(before)
})
it('allows unknown DB employer funding without replacing it with zero', () => {
 const r = result(); const db = createMatchingContract(createWorkplacePlan('db-rpp'))
 const next = resolveCompensationRetirement({ ...defaultPrimaryPackage, baseSalary: 50000, retirement: { schemaVersion: 1, contracts: [db], review: { status: 'ready', issues: [] } } }, { timeMode: 'current-year', fx: r.fx, profile, personalRrsp: 4321.23, personalFhsa: 1234.56, includePersonalDeductions: false })
 show(next); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ })); fireEvent.click(screen.getByRole('button', { name: 'Replace Scenario' }))
 expect(usePlannerStore.getState().salaryRetirementScenario!.workplacePlans[0].employerContribution).toBeNull()
})

it('retains above-budget uncertainty in snapshot, review and replacement', () => {
 const contracts = Array.from({ length: 17 }, (_, i) => { const c = createMatchingContract(createWorkplacePlan('group-rrsp', `many-${i}`)); c.unconditionalEmployer.value = 100; return c })
 const r = resolveCompensationRetirement({ ...defaultPrimaryPackage, baseSalary: 50000, rsuGrants: [], retirement: { schemaVersion: 1, contracts, review: { status: 'ready', issues: [] } } }, { timeMode: 'current-year', fx: { stockCurrency: 'CAD', cadPerStockUnit: 1 }, profile, personalRrsp: 0, personalFhsa: 0, includePersonalDeductions: false })
 const snapshot = buildSalaryRetirementSnapshot(r)!
 expect(snapshot.transferDetails).toHaveProperty('branchStatus', 'unavailable')
 expect(snapshot.workplacePlans).toHaveLength(17)
 show(r); fireEvent.click(screen.getByRole('button', { name: /Full breakdown/ }))
 expect(screen.getByRole('dialog')).toHaveTextContent('Classification unavailable. Earnings Treatment Needed')
 expect(screen.getByRole('dialog')).not.toHaveTextContent('All 0')
 fireEvent.click(screen.getByRole('button', { name: 'Replace Scenario' }))
 const saved = usePlannerStore.getState().salaryRetirementScenario!
 expect(saved.workplacePlans).toHaveLength(17)
 expect(saved.workplacePlans.every(p => p.withdrawalRestriction === 'unknown')).toBe(true)
 expect(estimateRetirement(saved, profile).branches).toHaveLength(0)
})
