import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { reviewSalaryScenario } from '../../store/retirementPersistence'
import { usePlannerStore } from '../../store/usePlannerStore'
import { buildSalaryRetirementSnapshot, type CompensationRetirementResult, type SalaryRetirementSnapshot } from '../../utils/finance/compensationRetirement'
import type { CapacityValue, RetirementScenario } from '../../utils/finance/retirementTypes'
import { PLAN_NAMES, retirementRange } from '../retirement/retirementPresentation'
import { Sheet } from '../ui/Sheet'
import { TaxYearNotice } from '../ui/TaxYearNotice'

const exactMoney = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 8 }).format(n)
function capacityLabel(value: CapacityValue) {
  if (value.state === 'unknown') return 'Unknown'
  return `${exactMoney(value.value ?? 0)}; ${value.sourceYear === undefined ? 'Source Year Unknown' : `Source Year ${value.sourceYear}`}${value.state === 'legacy' ? '; Unverified Legacy Limit' : ''}`
}
// Explicit calculation fields ignore historical metadata and object-key order.
function calculationInputs(s: RetirementScenario) {
  return JSON.stringify([s.cashEmploymentIncome, s.taxYear, s.personalRrsp, s.personalFhsa, s.includePersonalDeductions,
    s.workplacePlans.map(p => [p.id, p.kind, p.name, p.employeeContribution, p.employerContribution, p.withdrawalRestriction,
      p.administratorPa, p.registeredPlanCompensation, p.ordinaryAggregate, p.memberDirection])])
}
function ScenarioDetails({ title, scenario }: { title: string; scenario: RetirementScenario }) {
  if (reviewSalaryScenario(scenario).status === 'invalid') return <section className="retirement-group"><h3>{title}</h3><p>Saved Scenario Needs Review</p><pre className="retirement-raw">{JSON.stringify(scenario)}</pre></section>
  return <section className="retirement-group">
    <h3>{title}</h3>
    <p>Modeled Cash Pay: {exactMoney(scenario.cashEmploymentIncome)}</p>
    <p>Tax Year: {scenario.taxYear}</p>
    <p>Personal Deductions: {scenario.includePersonalDeductions ? 'Included' : 'Excluded From This Scenario'}</p>
    <p>Personal RRSP: {exactMoney(scenario.personalRrsp)}; Personal FHSA: {exactMoney(scenario.personalFhsa)}. Saved amounts are retained.</p>
    {scenario.workplacePlans.length === 0 && <p>No workplace plans.</p>}
    {scenario.workplacePlans.map((p, i) => <div key={i} className="retirement-plan-card">
      <h4>{(typeof p.name === 'string' && p.name) || PLAN_NAMES[p.kind]}</h4>
      <p>{PLAN_NAMES[p.kind]}: Employee {exactMoney(p.employeeContribution)}; Employer {p.employerContribution === null ? 'Funding Unknown' : exactMoney(p.employerContribution)}</p>
      {p.kind === 'group-rrsp' && <p>Withdrawal Restrictions: {p.withdrawalRestriction}</p>}
      <p>Administrator PA: {p.administratorPa === null ? 'Unknown' : exactMoney(p.administratorPa)}</p>
      <p>Registered-Plan Compensation: {p.registeredPlanCompensation === null ? 'Unknown' : exactMoney(p.registeredPlanCompensation)}</p>
      <p>Ordinary Aggregate Treatment: {p.ordinaryAggregate === false ? 'Unverified' : 'Ordinary Contribution Estimate'}</p>
      <p>Member Direction: {p.memberDirection ? 'Confirmed' : 'Not Confirmed'}</p>
    </div>)}
  </section>
}
export function SalaryScenarioTransfer({ result, blocked = false }: { result: CompensationRetirementResult; blocked?: boolean }) {
  const navigate = useNavigate()
  const { salaryRetirementScenario, importSalaryRetirementScenario } = usePlannerStore()
  const [review, setReview] = useState<SalaryRetirementSnapshot | null>(null)
  const disabled = blocked || result.status !== 'ready' || !result.scenario || !result.estimate || result.estimate.status === 'invalid'
  const openSalary = (notice?: string) => navigate('/planner/salary-tax', { state: notice ? { compensationDifferenceNotice: notice } : null })
  const transfer = () => {
    if (disabled) return
    const snapshot = buildSalaryRetirementSnapshot(result)
    if (!snapshot) return
    const state = usePlannerStore.getState()
    // Import preserves current personal values, including scalar-only saved values.
    snapshot.personalRrsp = state.salaryRetirementScenario?.personalRrsp ?? Number(state.inputs['salary-tax']?.rrsp ?? 0)
    snapshot.personalFhsa = state.salaryRetirementScenario?.personalFhsa ?? Number(state.inputs['salary-tax']?.fhsa ?? 0)
    if (!state.salaryRetirementScenario) {
      importSalaryRetirementScenario(snapshot)
      openSalary()
      return
    }
    try {
      if (calculationInputs(state.salaryRetirementScenario) === calculationInputs(snapshot)) {
        openSalary()
        return
      }
    } catch {
      // Invalid saved rows are reviewed explicitly before replacement.
    }
    setReview(snapshot)
  }
  const reviewRange = (field: 'employmentIncome' | 'pensionableEarnings' | 'eiEarnings' | 'qpipEarnings' | 'employmentCreditIncome' | 'workerDeductionIncome') => retirementRange(review?.transferDetails.classifiedBranches.map(b => b.context[field]) ?? [], exactMoney, 'Earnings Treatment Needed')
  return <>
    <button type="button" disabled={disabled} onClick={transfer} className="self-start flex items-center gap-1 text-[13px] text-[var(--color-text-secondary)]"><ExternalLink size={14} />Full breakdown in Salary &amp; Tax</button>
    <Sheet open={review !== null} onClose={() => setReview(null)} ariaLabel="Replace Salary & Tax Scenario" title="Replace Salary & Tax Scenario" panelClassName="w-[48rem] max-w-[calc(100vw-1rem)] themed-card rounded-lg p-4" contentClassName="flex flex-col gap-3">
      {review && <>
        <h2>Replace Salary &amp; Tax Scenario</h2>
        <p>Cash pay, workplace plans, tax year and personal inclusion will change together. Personal contribution amounts and current shared tax settings are retained.</p>
        {salaryRetirementScenario && <ScenarioDetails title="Existing Salary & Tax" scenario={salaryRetirementScenario} />}
        <ScenarioDetails title="From Compensation" scenario={review} />
        <section className="retirement-group">
          <h3>Source And Tax Classification</h3>
          <p>Snapshot Time: {review.provenance?.transferredAt}</p>
          <p>Source: Compensation, {review.provenance?.sourceTimeMode === 'next-one-year' ? 'Next 1 Year' : 'Current Year'}</p>
          <p>Salary: {exactMoney(review.provenance?.sourceBreakdown?.salary ?? 0)}; Bonus: {exactMoney(review.provenance?.sourceBreakdown?.cashBonus ?? 0)}; Realized RSU Cash: {exactMoney(review.provenance?.sourceBreakdown?.realizedEquity ?? 0)}; ESPP Gain: {exactMoney(review.provenance?.sourceBreakdown?.esppGain ?? 0)}</p>
          <p>Employer Taxable RRSP Benefit: {exactMoney(review.transferDetails.employerTaxableBenefits)}. Employer funding is separate from cash pay.</p>
          <p>Employment Income: {reviewRange('employmentIncome')}</p>
          <p>CPP/QPP Earnings: {reviewRange('pensionableEarnings')}</p>
          <p>EI Earnings: {reviewRange('eiEarnings')}</p>
          <p>QPIP Earnings: {reviewRange('qpipEarnings')}</p>
          <p>Employment Credit Base: {reviewRange('employmentCreditIncome')}</p>
          <p>Quebec Worker Deduction Base: {reviewRange('workerDeductionIncome')}</p>
          <p>{review.transferDetails.branchStatus === 'unavailable' ? 'Classification unavailable. Earnings Treatment Needed. All canonical plan rows and unknown restrictions are retained.' : `All ${review.transferDetails.classifiedBranches.length} withdrawal-treatment combinations are retained.`}</p>
          <p>CAD Per USD Stock Unit: {review.transferDetails.fx.cadPerStockUnit ?? 'Unavailable'}. Salary and retirement dollars are CAD.</p>
          {review.provenance?.assumptions.map((a, i) => <p key={i}>{a}</p>)}
          <TaxYearNotice />
        </section>
        <section className="retirement-group"><h3>Shared Tax Settings Remain Live</h3><p>Province: {review.transferDetails.profileAtTransfer.province}</p>
          <p>CRA RRSP Deduction Limit: {capacityLabel(review.transferDetails.profileAtTransfer.rrspDeductionLimit)}</p>
          <p>CRA Available Contribution Room: {capacityLabel(review.transferDetails.profileAtTransfer.rrspContributionRoom)}</p>
        </section>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="retirement-button retirement-primary" disabled={disabled} onClick={() => { if (!disabled) { importSalaryRetirementScenario(review); setReview(null); openSalary() } }}>Replace Scenario</button>
          <button type="button" className="retirement-button" onClick={() => { setReview(null); openSalary('The saved Salary & Tax scenario differs from the Compensation package. Existing inputs were kept.') }}>Keep Existing</button>
          <button type="button" className="retirement-button" onClick={() => setReview(null)}>Cancel</button>
        </div>
      </>}
    </Sheet>
  </>
}
