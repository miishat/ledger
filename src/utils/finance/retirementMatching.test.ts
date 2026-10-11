import { createMatchingContract } from './retirementTypes'
import type { MatchingContract } from './retirementTypes'
import { resolveMatchingPlan } from './retirementMatching'

describe('annual matching', () => {
  const contract = () => ({ ...createMatchingContract(), tiers: [{ lowerPercent: 0, upperPercent: 6, matchRatio: 0.5 }] })
  it.each([[0, 0], [3000, 1500], [6000, 3000], [8000, 3000]])('matches %s employee dollars to %s', (employee, employer) => {
    const c = contract(); c.employee.value = employee
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan?.employerContribution).toBe(employer)
  })
  it('counts tiers once and caps combined unconditional funding', () => {
    const c = contract(); c.employee.value = 6000; c.unconditionalEmployer.value = 2000; c.employerAnnualCap = 4000
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan?.employerContribution).toBe(4000)
    c.employerAnnualCap = 0
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan?.employerContribution).toBe(0)
    c.employerAnnualCap = null; c.unconditionalEmployer.value = 0
    c.tiers = [{ lowerPercent: 0, upperPercent: 3, matchRatio: 1 }, { lowerPercent: 3, upperPercent: 6, matchRatio: .5 }]
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan?.employerContribution).toBe(4500)
  })
  it('retains dollars at zero earnings and allows unmatched gaps', () => {
    const c = contract(); c.employee.value = 4000; c.tiers[0].lowerPercent = 3
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan?.employerContribution).toBe(500)
    c.unconditionalEmployer.value = 2000
    expect(resolveMatchingPlan(c, { baseSalary: 0, cashBonus: 0 }).plan).toMatchObject({ employeeContribution: 4000, employerContribution: 2000 })
  })
  it('withholds invalid rows without dropping their raw contract', () => {
    const c = contract(); c.tiers.push({ lowerPercent: 5, upperPercent: 7, matchRatio: 1 })
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan).toBeNull()
    c.tiers = []; c.employee.value = NaN
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).issues.length).toBeGreaterThan(0)
  })
  it('withholds invalid destinations and DB automatic terms', () => {
    const c = contract(); Object.assign(c.plan, { kind: 'unregistered' })
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan).toBeNull()
    c.plan.kind = 'db-rpp'
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan).toBeNull()
  })
  it('uses explicit bonus/override bases and percentages while keeping dollars exact', () => {
    const c = contract(); c.employee = { mode: 'percent', value: 6 }; c.eligibleEarnings = 'base-plus-bonus'
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 10000 }).plan).toMatchObject({ employeeContribution: 6600, employerContribution: 3300 })
    c.eligibleEarnings = 'override'; c.eligibleEarningsOverride = 10000.5
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 10000 }).plan?.employeeContribution).toBeCloseTo(600.03, 10)
  })
  it.each([null, {}, { plan: null }, { ...createMatchingContract(), tiers: null }, { ...createMatchingContract(), employee: null }])('rejects malformed contract shape %j without throwing', raw => {
    const r = resolveMatchingPlan(raw as unknown as MatchingContract, { baseSalary: 100000, cashBonus: 0 })
    expect(r.plan).toBeNull(); expect(r.raw).toBe(raw); expect(r.issues.length).toBeGreaterThan(0)
  })
  it('rejects invalid enums and numeric overflow instead of producing infinite funding', () => {
    const c = contract(); Object.assign(c, { eligibleEarnings: 'equity' })
    expect(resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 0 }).plan).toBeNull()
    c.eligibleEarnings = 'base'; c.employee.value = Number.MAX_VALUE; c.tiers[0].matchRatio = Number.MAX_VALUE
    expect(resolveMatchingPlan(c, { baseSalary: Number.MAX_VALUE, cashBonus: 0 }).plan).toBeNull()
  })
})
