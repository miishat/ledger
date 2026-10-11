import { fireEvent, render, screen } from '@testing-library/react'
import { SalaryTaxTool } from './SalaryTaxTool'
import { usePlannerStore } from '../../store/usePlannerStore'
import { createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from '../../utils/finance/retirementTypes'
import { estimateRetirement } from '../../utils/finance/retirementEstimate'
import { formatMoney } from './format'

const initial = usePlannerStore.getState()
beforeEach(() => { localStorage.clear(); usePlannerStore.setState(initial, true) })
const step = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
function seed() {
  const scenario = { ...createRetirementScenario(), cashEmploymentIncome: 50000 }
  usePlannerStore.getState().updateSalaryRetirementScenario(scenario)
  return scenario
}
describe('Salary retirement workspace', () => {
  it('leads with cash after contributions and five navigable steps', () => {
    seed(); render(<SalaryTaxTool />)
    expect(screen.getByRole('navigation', { name: 'Retirement setup steps' })).toBeInTheDocument()
    expect(screen.getByText('Cash After Contributions')).toBeInTheDocument()
    step('Workplace Plan'); expect(screen.getByRole('button', { name: 'Add Workplace Plan' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('Personal RRSP Contribution')).toBeInTheDocument()
  })
  it('adds exact annual contributions and removes a plan', () => {
    seed(); render(<SalaryTaxTool />); step('Workplace Plan')
    fireEvent.click(screen.getByRole('button', { name: 'Add Workplace Plan' }))
    fireEvent.change(screen.getByLabelText('Employee Annual Contribution'), { target: { value: '8655.32' } })
    expect(usePlannerStore.getState().salaryRetirementScenario?.workplacePlans[0].employeeContribution).toBe(8655.32)
    step('Employer Funding'); fireEvent.change(screen.getByLabelText('Employer Annual Contribution'), { target: { value: '2500.15' } })
    expect(usePlannerStore.getState().salaryRetirementScenario?.workplacePlans[0].employerContribution).toBe(2500.15)
    step('Workplace Plan'); fireEvent.click(screen.getByRole('button', { name: /Remove Plan/ }))
    expect(usePlannerStore.getState().salaryRetirementScenario?.workplacePlans).toEqual([])
  })
  it('supports all six destinations and unknown DB funding', () => {
    seed(); render(<SalaryTaxTool />); step('Workplace Plan'); fireEvent.click(screen.getByRole('button', { name: 'Add Workplace Plan' }))
    expect(screen.getByLabelText('Plan Type').querySelectorAll('option')).toHaveLength(6)
    fireEvent.change(screen.getByLabelText('Plan Type'), { target: { value: 'db-rpp' } }); step('Employer Funding')
    expect(screen.getAllByText('Pension Funding Not Entered').length).toBeGreaterThan(0)
    expect(usePlannerStore.getState().salaryRetirementScenario?.workplacePlans[0].employerContribution).toBeNull()
  })
  it('keeps excluded personal values visible and includes them explicitly', () => {
    usePlannerStore.getState().updateSalaryRetirementScenario({ ...seed(), personalRrsp: 1234.56, includePersonalDeductions: false })
    render(<SalaryTaxTool />)
    expect(screen.getByLabelText('Personal RRSP Contribution')).toHaveValue('1234.56')
    expect(screen.getByText('Excluded From This Scenario')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Include Personal Deductions'))
    expect(usePlannerStore.getState().salaryRetirementScenario?.includePersonalDeductions).toBe(true)
  })
  it('distinguishes confirmed zero from unknown and retains signed room and source year', () => {
    seed(); render(<SalaryTaxTool />); step('CRA Limits')
    fireEvent.change(screen.getByLabelText('Deduction Limit State'), { target: { value: 'known' } })
    expect(screen.getByLabelText('CRA RRSP Deduction Limit')).toHaveValue('0')
    fireEvent.change(screen.getByLabelText('Contribution Room State'), { target: { value: 'known' } })
    fireEvent.change(screen.getByLabelText('CRA Available Contribution Room'), { target: { value: '-123.45' } })
    fireEvent.change(screen.getByLabelText('Contribution Room Source Year'), { target: { value: '2025' } })
    expect(usePlannerStore.getState().sharedTaxProfile.rrspContributionRoom).toEqual({ state: 'known', value: -123.45, sourceYear: 2025 })
    fireEvent.click(screen.getByRole('button', { name: 'Clear CRA Limits' }))
    expect(usePlannerStore.getState().sharedTaxProfile.rrspDeductionLimit.state).toBe('unknown')
  })
  it('confirms preserved legacy capacity without inventing contribution room', () => {
    seed(); usePlannerStore.getState().setSharedTaxProfile({ rrspDeductionLimit: { state: 'legacy', value: 6000 } })
    render(<SalaryTaxTool />); step('CRA Limits')
    expect(screen.getByText('Unverified Legacy Limit')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Deduction Limit for 2026' }))
    expect(usePlannerStore.getState().sharedTaxProfile.rrspDeductionLimit).toEqual({ state: 'known', value: 6000, sourceYear: 2026 })
    expect(usePlannerStore.getState().sharedTaxProfile.rrspContributionRoom.state).toBe('unknown')
  })
  it('ranges every unknown row combination and withholds branch dependent graphics', () => {
    const scenario = { ...seed(), workplacePlans: [ { ...createWorkplacePlan('group-rrsp', 'a'), employerContribution: 2000 }, { ...createWorkplacePlan('group-rrsp', 'b'), employerContribution: 3000 } ] }
    usePlannerStore.getState().updateSalaryRetirementScenario(scenario); render(<SalaryTaxTool />); step('Review')
    const result = estimateRetirement(scenario, createSharedTaxProfile())
    const taxes = result.branches.map(b => b.tax.federal + b.tax.provincial)
    expect(screen.getByText('Total Income Tax').parentElement).toHaveTextContent(`${formatMoney(Math.min(...taxes))} to ${formatMoney(Math.max(...taxes))}`)
    expect(screen.getByText(/All 4 earnings combinations/)).toBeInTheDocument()
    expect(screen.getAllByText(/Earnings Treatment Needed/).length).toBeGreaterThan(0)
  })
  it('withholds precision for invalid input and recovers when corrected', () => {
    seed(); render(<SalaryTaxTool />)
    fireEvent.change(screen.getByLabelText('Gross Annual Income'), { target: { value: 'bad' } })
    expect(screen.getByLabelText('Gross Annual Income')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Cash After Contributions').parentElement).toHaveTextContent('Needs Review')
    fireEvent.change(screen.getByLabelText('Gross Annual Income'), { target: { value: '50000.15' } })
    expect(screen.getByText('Cash After Contributions').parentElement).not.toHaveTextContent('Needs Review')
  })
  it('resets the scenario and explains shared personal effect while preserving the profile', () => {
    seed(); usePlannerStore.getState().setSharedTaxProfile({ province: 'QC', rrspDeductionLimit: { state: 'known', value: 5000, sourceYear: 2026 } })
    render(<SalaryTaxTool />); step('Review'); fireEvent.click(screen.getByRole('button', { name: 'Reset Salary Scenario' }))
    expect(usePlannerStore.getState().salaryRetirementScenario?.cashEmploymentIncome).toBe(0)
    expect(usePlannerStore.getState().sharedTaxProfile.province).toBe('QC')
    expect(screen.getByText(/Personal RRSP and FHSA amounts also reset.*Compensation/)).toBeInTheDocument()
  })
  it('labels capacity-bounded advice and hypothetical efficiency separately', () => {
    usePlannerStore.getState().updateSalaryRetirementScenario({ ...seed(), cashEmploymentIncome: 100000, personalRrsp: 10000 })
    usePlannerStore.getState().setSharedTaxProfile({ rrspDeductionLimit: { state: 'known', value: 15000, sourceYear: 2026 }, rrspContributionRoom: { state: 'known', value: 11000, sourceYear: 2026 } })
    render(<SalaryTaxTool />); step('Review')
    expect(screen.getByText(/Additional New Contribution Capacity: \$1,000/)).toBeInTheDocument()
    expect(screen.getByText(/Hypothetical tax-saving bands/)).toBeInTheDocument()
  })
  it('clearing CRA limits retains unrelated invalid pay drafts', () => {
    seed(); render(<SalaryTaxTool />)
    fireEvent.change(screen.getByLabelText('Gross Annual Income'), { target: { value: 'not a salary' } })
    step('CRA Limits'); fireEvent.click(screen.getByRole('button', { name: 'Clear CRA Limits' }))
    step('Pay & Deductions')
    expect(screen.getByLabelText('Gross Annual Income')).toHaveValue('not a salary')
    expect(screen.getByText('Cash After Contributions').parentElement).toHaveTextContent('Needs Review')
  })
  it('rebuilds transferred gross and restrictions from canonical edits', () => {
    seed()
    usePlannerStore.getState().importSalaryRetirementScenario({ ...seed(), workplacePlans: [{ ...createWorkplacePlan('group-rrsp', 'a'), employerContribution: 2500, withdrawalRestriction: 'restricted' }], provenance: { source: 'compensation', assumptions: ['Equity assumed realized as cash.'], sourceBreakdown: { salary: 40000, cashBonus: 0, realizedEquity: 10000, esppGain: 0 } } })
    render(<SalaryTaxTool />)
    fireEvent.change(screen.getByLabelText('Gross Annual Income'), { target: { value: '60000.15' } })
    const edited = usePlannerStore.getState().salaryRetirementScenario!
    const result = estimateRetirement(edited, usePlannerStore.getState().sharedTaxProfile)
    expect(result.branches[0].employmentIncome).toBe(62500.15)
    expect(result.branches[0].context.eiEarnings).toBe(60000.15)
    expect(screen.getByText('Edited After Transfer')).toBeInTheDocument()
    step('Workplace Plan'); fireEvent.change(screen.getByLabelText('Withdrawal Restrictions'), { target: { value: 'withdrawable' } })
    const changed = estimateRetirement(usePlannerStore.getState().salaryRetirementScenario!, usePlannerStore.getState().sharedTaxProfile)
    expect(changed.branches[0].context.eiEarnings).toBe(62500.15)
    step('Review'); expect(screen.getByText('Employment Income').parentElement).toHaveTextContent('$62,500')
  })
  it('preserves and surfaces malformed saved rows for repair', () => {
    usePlannerStore.getState().updateSalaryRetirementScenario({ ...seed(), workplacePlans: [null] as unknown as ReturnType<typeof createWorkplacePlan>[] })
    render(<SalaryTaxTool />); step('Workplace Plan')
    expect(screen.getByRole('button', { name: 'Repair Plan 1' })).toBeInTheDocument()
    expect(screen.getByText('Cash After Contributions').parentElement).toHaveTextContent('Needs Review')
    fireEvent.click(screen.getByRole('button', { name: 'Repair Plan 1' }))
    expect(screen.getByLabelText('Employee Annual Contribution')).toHaveValue('0')
    expect(screen.getByText('Cash After Contributions').parentElement).not.toHaveTextContent('Needs Review')
  })
  it('renders recoverable malformed optional names and provenance without throwing', () => {
    usePlannerStore.getState().updateSalaryRetirementScenario({ ...seed(), workplacePlans: [{ ...createWorkplacePlan(), name: { bad: 'saved name' } } as unknown as ReturnType<typeof createWorkplacePlan>], provenance: { source: 'compensation', assumptions: 'bad saved assumptions' } as unknown as NonNullable<ReturnType<typeof createRetirementScenario>['provenance']> })
    render(<SalaryTaxTool />); step('Workplace Plan')
    expect(screen.getByLabelText('Plan Name')).toHaveValue('')
    step('Review')
    expect(screen.getByText(/Saved source assumptions need review/)).toBeInTheDocument()
  })
  it('retains a later annual plan draft and withheld cash after earlier row removal', () => {
    usePlannerStore.getState().updateSalaryRetirementScenario({ ...seed(), workplacePlans: [createWorkplacePlan('dc-rpp', 'a'), createWorkplacePlan('dc-rpp', 'b')] })
    render(<SalaryTaxTool />); step('Workplace Plan')
    fireEvent.change(screen.getAllByLabelText('Employee Annual Contribution')[1], { target: { value: 'bad annual amount' } })
    fireEvent.click(screen.getByRole('button', { name: 'Remove Plan 1' }))
    expect(screen.getByLabelText('Employee Annual Contribution')).toHaveValue('bad annual amount')
    expect(screen.getByText('Cash After Contributions').parentElement).toHaveTextContent('Needs Review')
    fireEvent.change(screen.getByLabelText('Employee Annual Contribution'), { target: { value: '456.78' } })
    expect(usePlannerStore.getState().salaryRetirementScenario?.workplacePlans[0].employeeContribution).toBe(456.78)
    expect(screen.getByText('Cash After Contributions').parentElement).not.toHaveTextContent('Needs Review')
  })
})

it('renders restored 17 unknown rows with unavailable tax precision and preserved funding', () => {
 const s = { ...seed(), workplacePlans: Array.from({ length: 17 }, (_, i) => ({ ...createWorkplacePlan('group-rrsp', `many-${i}`), employeeContribution: 10, employerContribution: 100 })) }
 usePlannerStore.getState().updateSalaryRetirementScenario(s)
 usePlannerStore.getState().setSharedTaxProfile({ province: 'QC' })
 render(<SalaryTaxTool />); step('Review')
 expect(screen.getByText('Total Income Tax').parentElement).toHaveTextContent('Earnings Treatment Needed')
 expect(screen.getByText('Marginal Rate', { exact: true }).parentElement).toHaveTextContent('Earnings Treatment Needed')
 expect(screen.getByText('Potential top-band rate:', { exact: false })).toHaveTextContent('Earnings Treatment Needed')
 expect(screen.getByText('Current Contribution-Room Usage').parentElement).toHaveTextContent('$1,870')
 expect(screen.getByText('QPIP', { exact: true }).parentElement).toHaveTextContent('Earnings Treatment Needed')
 expect(screen.getByText('CPP/QPP (Including Second Contribution)').parentElement).not.toHaveTextContent('Earnings Treatment Needed')
 expect(screen.queryByText(/All 0/)).not.toBeInTheDocument()
})
