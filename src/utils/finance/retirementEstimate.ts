import { annualClassifiedTax, marginalSlices, PROVINCES, TAX_YEAR } from './canadaTax'
import type { AnnualSalaryTax, ClassifiedTaxContext, MarginalBreakdown, MarginalSlice } from './canadaTax'
import { validateWorkplacePlan } from './retirementTypes'
export { validateWorkplacePlan } from './retirementTypes'
import type { CapacityValue, RetirementIssue, RetirementScenario, SharedTaxProfile, WorkplacePlan } from './retirementTypes'

const validMoney = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0
export const REGISTERED_PLAN_LIMITS = { 2026: { rrsp: 33810, moneyPurchase: 35390, dpsp: 17695 } } as const
export interface DeductionAllocation { planId: string; employerRrsp: number; employee: number }
export interface RetirementBranch {
  restriction: 'restricted' | 'withdrawable'
  withdrawalTreatments: Record<string, 'restricted' | 'withdrawable'>
  context: ClassifiedTaxContext
  employmentIncome: number
  incomeBeforeStatutoryDeductions: number
  rrspDeduction: number
  rppDeduction: number
  fhsaDeduction: number
  tax: AnnualSalaryTax
  baselineTax: AnnualSalaryTax
  taxSavings: number
  cashAfterContributions: number
}
export interface RetirementEstimate {
  status: 'valid' | 'uncertain' | 'invalid'
  scenario: RetirementScenario
  issues: RetirementIssue[]
  branches: RetirementBranch[]
  employeeCashOutflow: number | null
  knownEmployerFunding: number
  employerFunding: number | null
  totalRetirementFunding: number | null
  currentRoomUsage: number | null
  followingYearPa: number | null
  memberDeductionCapacity: number | null
  remainingDeductionCapacity: number | null
  remainingContributionRoom: number | null
  additionalContributionCapacity: number | null
  deductionAllocation: DeductionAllocation[]
  personalRrspDeduction: number
}
function capacity(value: CapacityValue, year: number, deduction: boolean, issues: RetirementIssue[]): number | null {
  if (!value || !['known','unknown','legacy'].includes(value.state)) { issues.push({ code: 'invalid-capacity', message: 'Capacity state needs review.' }); return null }
  if (value.state === 'unknown') return null
  if (!Number.isFinite(value.value) || (deduction && (value.value as number) < 0) || (value.sourceYear !== undefined && !Number.isInteger(value.sourceYear))) {
    issues.push({ code: 'invalid-capacity', message: 'CRA capacity must be finite; deduction limits must be nonnegative.' }); return null
  }
  if (value.sourceYear !== undefined && value.sourceYear !== year) { issues.push({ code: 'stale-capacity', message: 'Supplied CRA capacity is for a different year.' }); return null }
  if (value.state === 'legacy' || value.sourceYear === undefined) {
    issues.push({ code: 'unverified-legacy-limit', message: 'Unverified Legacy Limit. Source Year Unknown.' })
    return deduction && (value.value as number) > 0 ? value.value as number : null
  }
  return value.value as number
}
export function estimateRetirement(scenario: RetirementScenario, profile: SharedTaxProfile): RetirementEstimate {
  const issues: RetirementIssue[] = []
  const result: RetirementEstimate = { status: 'valid', scenario, issues, branches: [], employeeCashOutflow: null, knownEmployerFunding: 0,
    employerFunding: null, totalRetirementFunding: null, currentRoomUsage: null, followingYearPa: null, memberDeductionCapacity: null,
    remainingDeductionCapacity: null, remainingContributionRoom: null, additionalContributionCapacity: null, deductionAllocation: [], personalRrspDeduction: 0 }
  if (![scenario.cashEmploymentIncome, scenario.personalRrsp, scenario.personalFhsa].every(validMoney) || !Array.isArray(scenario.workplacePlans)
    || !PROVINCES.some(p => p.code === profile.province) || typeof scenario.includePersonalDeductions !== 'boolean' || scenario.taxYear !== TAX_YEAR) {
    issues.push({ code: 'invalid-scenario', message: 'Scenario requires valid amounts, province and the supported 2026 tax year.' })
  }
  for (const plan of Array.isArray(scenario.workplacePlans) ? scenario.workplacePlans : []) issues.push(...validateWorkplacePlan(plan))
  if (Array.isArray(scenario.workplacePlans) && !issues.some(i => i.code.startsWith('invalid'))) {
    if (new Set(scenario.workplacePlans.map(p => p.id)).size !== scenario.workplacePlans.length) issues.push({ code: 'invalid-plan', message: 'Plan identifiers must be unique.' })
    const aggregate = scenario.workplacePlans.reduce((n,p) => n+p.employeeContribution+(p.employerContribution ?? 0)+(p.administratorPa ?? 0), scenario.cashEmploymentIncome+scenario.personalRrsp+scenario.personalFhsa)
    if (!Number.isFinite(aggregate)) issues.push({ code: 'invalid-scenario', message: 'Aggregate amounts exceed finite numeric limits.' })
  }
  const limit = capacity(profile.rrspDeductionLimit, scenario.taxYear, true, issues)
  const room = capacity(profile.rrspContributionRoom, scenario.taxYear, false, issues)
  if (issues.some(i => i.code.startsWith('invalid'))) { result.status = 'invalid'; return result }
  const plans = scenario.workplacePlans
  const sum = (filter: (p: WorkplacePlan) => boolean, field: 'employeeContribution' | 'employerContribution') => plans.filter(filter).reduce((n,p) => n + (p[field] ?? 0),0)
  const rrspEmployer = sum(p => p.kind === 'group-rrsp', 'employerContribution')
  const prppEmployer = sum(p => p.kind === 'prpp' || p.kind === 'vrsp', 'employerContribution')
  const rppEmployee = sum(p => p.kind === 'dc-rpp' || p.kind === 'db-rpp', 'employeeContribution')
  const memberEmployee = sum(p => !['dc-rpp','db-rpp'].includes(p.kind), 'employeeContribution')
  const personal = scenario.includePersonalDeductions ? scenario.personalRrsp : 0
  const fhsa = scenario.includePersonalDeductions ? scenario.personalFhsa : 0
  const eligible = rrspEmployer + memberEmployee + personal
  result.memberDeductionCapacity = limit === null ? null : Math.max(0, limit - prppEmployer)
  let available = result.memberDeductionCapacity ?? eligible
  if (limit === null && eligible + prppEmployer > 0) issues.push({ code: 'deductibility-assumed', message: 'Current-year deductibility assumed. Contribution room is not established.' })
  const take = (amount: number) => { const allowed = Math.min(amount, available); available -= allowed; return allowed }
  for (const plan of plans) result.deductionAllocation.push({ planId: plan.id, employerRrsp: plan.kind === 'group-rrsp' ? take(plan.employerContribution ?? 0) : 0, employee: 0 })
  for (let i = 0; i < plans.length; i++) if (!['dc-rpp','db-rpp'].includes(plans[i].kind)) result.deductionAllocation[i].employee = take(plans[i].employeeContribution)
  result.personalRrspDeduction = take(personal)
  const rrspDeduction = result.deductionAllocation.reduce((n,a) => n+a.employerRrsp+a.employee,0)+result.personalRrspDeduction
  const employerDeduction = result.deductionAllocation.reduce((n,a) => n+a.employerRrsp,0)
  result.remainingDeductionCapacity = limit === null ? null : available
  result.currentRoomUsage = eligible + prppEmployer
  result.remainingContributionRoom = room === null ? null : room - result.currentRoomUsage
  result.additionalContributionCapacity = result.remainingDeductionCapacity === null || result.remainingContributionRoom === null ? null : Math.max(0, Math.min(result.remainingDeductionCapacity,result.remainingContributionRoom))
  if (result.remainingContributionRoom !== null && result.remainingContributionRoom < 0) issues.push({ code: 'contribution-room-excess', message: `Modeled contribution-room excess: $${-result.remainingContributionRoom}.` })
  if (rrspDeduction < eligible) issues.push({ code: 'nondeductible-contributions', message: `Modeled nondeductible receipts: $${eligible-rrspDeduction}. Actual funding retained.` })
  result.employeeCashOutflow = sum(() => true,'employeeContribution') + personal + fhsa
  result.knownEmployerFunding = sum(() => true,'employerContribution')
  result.employerFunding = plans.some(p => p.employerContribution === null) ? null : result.knownEmployerFunding
  result.totalRetirementFunding = result.employerFunding === null ? null : result.employeeCashOutflow - fhsa + result.employerFunding
  if (result.employerFunding === null) issues.push({ code: 'pension-funding-unknown', message: 'Pension Funding Not Entered. Pension Value Not Estimated.' })
  let pa = 0; let paUnknown = false
  const ordinary: { plan: WorkplacePlan; credit: number }[] = []
  for (const plan of plans) {
    const credit = plan.kind === 'dc-rpp' ? plan.employeeContribution + (plan.employerContribution ?? 0) : plan.kind === 'rrsp-dpsp' ? plan.employerContribution ?? 0 : 0
    if (['dc-rpp','db-rpp','rrsp-dpsp'].includes(plan.kind)) {
      if (plan.administratorPa !== null) pa += plan.administratorPa
      else if (plan.kind === 'db-rpp') paUnknown = true
      else pa += credit
    }
    if (plan.kind === 'dc-rpp' || plan.kind === 'rrsp-dpsp') {
      const dollar = plan.kind === 'dc-rpp' ? 35390 : 17695
      if (credit > dollar) issues.push({ code: 'plan-dollar-limit', planId: plan.id, message: `Ordinary credit exceeds the 2026 $${dollar} ceiling. Administrator confirmation needed.` })
      if (plan.registeredPlanCompensation === null || plan.ordinaryAggregate === false) issues.push({ code: 'earnings-limit-unverified', planId: plan.id, message: 'Earnings Limit Not Verified.' })
      else if (credit > .18 * plan.registeredPlanCompensation) issues.push({ code: 'plan-earnings-limit', planId: plan.id, message: 'Ordinary credit exceeds 18% of confirmed registered-plan compensation. Administrator confirmation needed.' })
      ordinary.push({ plan, credit })
    }
    if ((plan.kind === 'prpp' || plan.kind === 'vrsp') && (plan.employerContribution ?? 0) > 33810 && !plan.memberDirection) issues.push({ code: 'member-direction-needed', planId: plan.id, message: 'Member Direction Needed for employer funding above the 2026 RRSP dollar limit.' })
  }
  result.followingYearPa = paUnknown ? null : pa
  if (paUnknown) issues.push({ code: 'pa-unknown', message: 'Administrator PA Not Entered. Following-year effect unknown.' })
  if (ordinary.length) {
    const aggregate = ordinary.reduce((n,p) => n+p.credit,0)
    const supported = !plans.some(p => p.kind === 'db-rpp' || p.ordinaryAggregate === false)
    if (supported && aggregate > 35390) issues.push({ code: 'aggregate-dollar-limit', message: 'Combined ordinary DC/DPSP credits exceed $35,390.' })
    const bases = ordinary.map(p => p.plan.registeredPlanCompensation)
    if (!supported || bases.some(b => b === null) || new Set(bases).size > 1) issues.push({ code: 'aggregate-limit-unverified', message: 'Combined legal earnings/aggregate check unverified. Administrator confirmation needed.' })
    else if (aggregate > .18 * (bases[0] as number)) issues.push({ code: 'aggregate-earnings-limit', message: 'Combined ordinary credits exceed 18% of confirmed compensation.' })
  }
  const unknown = plans.some(p => p.kind === 'group-rrsp' && p.withdrawalRestriction === 'unknown' && (p.employerContribution ?? 0) > 0)
  const insuranceKnown = sum(p => p.kind === 'group-rrsp' && p.withdrawalRestriction === 'withdrawable','employerContribution')
  if (unknown) { result.status = 'uncertain'; issues.push({ code: 'earnings-treatment-needed', message: 'Earnings Treatment Needed. Restricted and withdrawable branches shown.' }) }
  let possibilities: { extra: number; treatments: Record<string, 'restricted' | 'withdrawable'> }[] = [{ extra: 0, treatments: {} }]
  for (const plan of plans.filter(p => p.kind === 'group-rrsp' && p.withdrawalRestriction === 'unknown' && (p.employerContribution ?? 0) > 0)) {
    possibilities = possibilities.flatMap(branch => [
      { extra: branch.extra, treatments: { ...branch.treatments, [plan.id]: 'restricted' as const } },
      { extra: branch.extra + (plan.employerContribution ?? 0), treatments: { ...branch.treatments, [plan.id]: 'withdrawable' as const } },
    ])
  }
  possibilities.sort((a,b) => a.extra-b.extra)
  for (const possibility of possibilities) {
    const restriction = possibility.extra === 0 ? 'restricted' : 'withdrawable'
    const employmentIncome = scenario.cashEmploymentIncome + rrspEmployer
    const insurance = scenario.cashEmploymentIncome + insuranceKnown + possibility.extra
    const context: ClassifiedTaxContext = { cashEmploymentIncome: scenario.cashEmploymentIncome, employmentIncome, pensionableEarnings: employmentIncome,
      eiEarnings: insurance, qpipEarnings: insurance, employmentCreditIncome: employmentIncome, workerDeductionIncome: employmentIncome,
      deduction: rrspDeduction + rppEmployee + fhsa }
    const tax = annualClassifiedTax(context,profile.province)
    const baselineTax = annualClassifiedTax({ ...context, deduction: employerDeduction },profile.province)
    result.branches.push({ restriction, withdrawalTreatments: possibility.treatments, context, employmentIncome, incomeBeforeStatutoryDeductions: employmentIncome-context.deduction,
      rrspDeduction, rppDeduction: rppEmployee, fhsaDeduction: fhsa, tax, baselineTax,
      taxSavings: (baselineTax.federal-tax.federal)+(baselineTax.provincial-tax.provincial), cashAfterContributions: tax.net-result.employeeCashOutflow })
  }
  return result
}
export function retirementMarginalBreakdown(scenario: RetirementScenario, profile: SharedTaxProfile): { status: RetirementEstimate['status']; branches: MarginalBreakdown[]; issues: RetirementIssue[] } {
  const current = estimateRetirement(scenario,profile)
  const next = estimateRetirement({ ...scenario, cashEmploymentIncome: scenario.cashEmploymentIncome+100 },profile)
  return { status: current.status, issues: current.issues, branches: current.branches.map((b,i) => {
    const n = next.branches[i].tax; const t = b.tax
    const federal = n.federal-t.federal; const provincialBase = n.provincialBase-t.provincialBase; const surtax = n.surtax-t.surtax; const adjustments = n.provincialAdjustments-t.provincialAdjustments
    return { federal, provincialBase, surtax, adjustments, total: federal+provincialBase+surtax+adjustments }
  }) }
}
export function retirementEfficiencySlices(scenario: RetirementScenario, profile: SharedTaxProfile): { status: RetirementEstimate['status']; branches: MarginalSlice[][]; additionalContributionCapacity: number | null; hypothetical: true; issues: RetirementIssue[] } {
  const result = estimateRetirement(scenario,profile)
  return { status: result.status, branches: result.branches.map(b => marginalSlices(scenario.cashEmploymentIncome,profile.province,0,0,b.context)),
    additionalContributionCapacity: result.additionalContributionCapacity, hypothetical: true, issues: result.issues }
}

