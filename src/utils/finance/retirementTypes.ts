import type { Province } from './canadaTax'

export type RetirementPlanKind = 'group-rrsp' | 'dc-rpp' | 'db-rpp' | 'rrsp-dpsp' | 'prpp' | 'vrsp'
export type WithdrawalRestriction = 'restricted' | 'withdrawable' | 'unknown'
export interface CapacityValue { state: 'unknown' | 'known' | 'legacy'; value?: number; sourceYear?: number }
export interface SharedTaxProfile { province: Province; rrspDeductionLimit: CapacityValue; rrspContributionRoom: CapacityValue }
export interface WorkplacePlan {
  id: string
  kind: RetirementPlanKind
  name?: string
  employeeContribution: number
  employerContribution: number | null
  withdrawalRestriction: WithdrawalRestriction
  administratorPa: number | null
  registeredPlanCompensation: number | null
  ordinaryAggregate?: boolean
  memberDirection: boolean
}
export interface RetirementScenario {
  cashEmploymentIncome: number
  workplacePlans: WorkplacePlan[]
  personalRrsp: number
  personalFhsa: number
  includePersonalDeductions: boolean
  taxYear: number
  provenance?: RetirementProvenance
}
export interface RetirementProvenance {
  source: 'salary-tax' | 'compensation'
  sourceTimeMode?: 'current-year' | 'next-one-year'
  transferredAt?: string
  editedAfterTransfer?: boolean
  assumptions: string[]
  sourceBreakdown?: { salary: number; cashBonus: number; realizedEquity: number; esppGain: number }
}
export type SalaryRetirementScenario = RetirementScenario
export interface MatchingTier { id?: string; lowerPercent: number; upperPercent: number; matchRatio: number }
export interface ContributionInput { mode: 'dollars' | 'percent'; value: number }
export interface MatchingContract {
  plan: WorkplacePlan
  employee: ContributionInput
  eligibleEarnings: 'base' | 'base-plus-bonus' | 'override'
  eligibleEarningsOverride: number | null
  tiers: MatchingTier[]
  unconditionalEmployer: ContributionInput
  employerAnnualCap: number | null
}
export interface RetirementIssue { code: string; message: string; planId?: string }
export function createWorkplacePlan(kind: RetirementPlanKind = 'group-rrsp', id = 'plan-1'): WorkplacePlan {
  return { id, kind, employeeContribution: 0, employerContribution: kind === 'db-rpp' ? null : 0,
    withdrawalRestriction: 'unknown', administratorPa: null, registeredPlanCompensation: null, memberDirection: false }
}
export function createSharedTaxProfile(province: Province = 'ON'): SharedTaxProfile {
  return { province, rrspDeductionLimit: { state: 'unknown' }, rrspContributionRoom: { state: 'unknown' } }
}
export function createRetirementScenario(): RetirementScenario {
  return { cashEmploymentIncome: 0, workplacePlans: [], personalRrsp: 0, personalFhsa: 0, includePersonalDeductions: true, taxYear: 2026 }
}
export function createMatchingContract(plan = createWorkplacePlan()): MatchingContract {
  return { plan, employee: { mode: 'dollars', value: 0 }, eligibleEarnings: 'base', eligibleEarningsOverride: null,
    tiers: [], unconditionalEmployer: { mode: 'dollars', value: 0 }, employerAnnualCap: null }
}
const validMoney = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0
export function validateWorkplacePlan(plan: WorkplacePlan): RetirementIssue[] {
  const issues: RetirementIssue[] = []
  const invalid = (message: string) => issues.push({ code: 'invalid-plan', message, planId: plan?.id })
  if (!plan || typeof plan !== 'object') { invalid('Retirement row needs review.'); return issues }
  if (typeof plan.id !== 'string' || !plan.id.trim()) invalid('Plan identifier needs review.')
  if (!['group-rrsp','dc-rpp','db-rpp','rrsp-dpsp','prpp','vrsp'].includes(plan.kind)) invalid('Plan type needs review.')
  if (!validMoney(plan.employeeContribution) || !(validMoney(plan.employerContribution) || (plan.kind === 'db-rpp' && plan.employerContribution === null))) invalid('Contribution amounts must be finite and nonnegative.')
  if (!['restricted','withdrawable','unknown'].includes(plan.withdrawalRestriction)) invalid('Withdrawal restrictions need review.')
  for (const value of [plan.administratorPa, plan.registeredPlanCompensation]) if (value !== null && !validMoney(value)) invalid('Administrator PA and registered compensation must be nonnegative finite dollars or unknown.')
  if (typeof plan.memberDirection !== 'boolean') invalid('Member direction needs review.')
  if (plan.ordinaryAggregate !== undefined && typeof plan.ordinaryAggregate !== 'boolean') invalid('Ordinary aggregate marker must be boolean when supplied.')
  return issues
}

