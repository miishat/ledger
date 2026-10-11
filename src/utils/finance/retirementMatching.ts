import type { MatchingContract, RetirementIssue, WorkplacePlan } from './retirementTypes'
import { validateWorkplacePlan } from './retirementTypes'

export function resolveMatchingPlan(contract: MatchingContract, earnings: { baseSalary: number; cashBonus: number }): {
  plan: WorkplacePlan | null; eligibleEarnings: number; issues: RetirementIssue[]; raw: MatchingContract
} {
  if (!contract || typeof contract !== 'object' || !contract.plan || !contract.employee || !contract.unconditionalEmployer || !Array.isArray(contract.tiers)) {
    return { plan: null, eligibleEarnings: 0, issues: [{ code: 'invalid-match', message: 'Retirement contract shape needs review.' }], raw: contract }
  }
  const issues: RetirementIssue[] = validateWorkplacePlan(contract.plan)
  const fail = (message: string) => issues.push({ code: 'invalid-match', message, planId: contract.plan.id })
  const valid = (n: number) => Number.isFinite(n) && n >= 0
  if (!['base', 'base-plus-bonus', 'override'].includes(contract.eligibleEarnings)) fail('Eligible earnings selection needs review.')
  const base = contract.eligibleEarnings === 'override' ? contract.eligibleEarningsOverride
    : earnings.baseSalary + (contract.eligibleEarnings === 'base-plus-bonus' ? earnings.cashBonus : 0)
  if (base === null || !valid(base)) fail('Eligible earnings must be finite and nonnegative.')
  for (const value of [contract.employee, contract.unconditionalEmployer]) {
    if (!['dollars', 'percent'].includes(value.mode) || !valid(value.value) || (value.mode === 'percent' && value.value > 100)) fail('Contribution must be a valid dollar amount or percentage from 0 to 100.')
  }
  if (contract.employerAnnualCap !== null && !valid(contract.employerAnnualCap)) fail('Employer cap must be finite and nonnegative.')
  let previousUpper = 0
  for (const tier of contract.tiers) {
    if (!tier || typeof tier !== 'object') { fail('Matching tier needs review.'); continue }
    if (!valid(tier.lowerPercent) || !valid(tier.upperPercent) || tier.lowerPercent < previousUpper || tier.lowerPercent >= tier.upperPercent || tier.upperPercent > 100 || !valid(tier.matchRatio)) fail('Matching tiers must be ordered, non-overlapping intervals from 0 to 100 with a nonnegative ratio.')
    previousUpper = tier.upperPercent
  }
  if (contract.plan.kind === 'db-rpp' && (contract.tiers.length || contract.employee.mode !== 'dollars' || contract.unconditionalEmployer.value !== 0 || contract.employerAnnualCap !== null)) fail('DB funding uses entered annual dollars, without automatic matching.')
  if (issues.length) return { plan: null, eligibleEarnings: base ?? 0, issues, raw: contract }
  const b = base as number
  const employee = contract.employee.mode === 'dollars' ? contract.employee.value : b * contract.employee.value / 100
  let employer = contract.unconditionalEmployer.mode === 'dollars' ? contract.unconditionalEmployer.value : b * contract.unconditionalEmployer.value / 100
  for (const tier of contract.tiers) employer += tier.matchRatio * Math.max(0, Math.min(employee, b * tier.upperPercent / 100) - b * tier.lowerPercent / 100)
  if (!valid(employee) || !valid(employer)) { fail('Computed funding is outside finite numeric limits.'); return { plan: null, eligibleEarnings: b, issues, raw: contract } }
  if (contract.employerAnnualCap !== null) employer = Math.min(employer, contract.employerAnnualCap)
  return { plan: { ...contract.plan, employeeContribution: employee, employerContribution: contract.plan.kind === 'db-rpp' ? contract.plan.employerContribution : employer }, eligibleEarnings: b, issues, raw: contract }
}
