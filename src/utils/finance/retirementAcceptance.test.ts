import { estimateRetirement } from './retirementEstimate'
import { resolveMatchingPlan } from './retirementMatching'
import { createMatchingContract, createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from './retirementTypes'

const profile = { ...createSharedTaxProfile('QC'), rrspDeductionLimit: { state: 'known' as const, value: 15000, sourceYear: 2026 }, rrspContributionRoom: { state: 'known' as const, value: 11000, sourceYear: 2026 } }
it('A08 preserves Quebec public pension earnings while restricting employer RRSP EI and QPIP earnings', () => {
 const plan = { ...createWorkplacePlan(), employerContribution: 2500 }
 const result = estimateRetirement({ ...createRetirementScenario(), cashEmploymentIncome: 50000, workplacePlans: [plan] }, profile)
 expect(result.branches.map(b => b.context.pensionableEarnings)).toEqual([52500, 52500])
 expect(result.branches.map(b => b.context.eiEarnings)).toEqual([50000, 52500])
 expect(result.branches.map(b => b.context.qpipEarnings)).toEqual([50000, 52500])
})
it.each(['dc-rpp', 'db-rpp', 'rrsp-dpsp', 'prpp', 'vrsp'] as const)('A09 ordinary employer %s funding adds no Quebec taxable or statutory earnings', kind => {
 const result = estimateRetirement({ ...createRetirementScenario(), cashEmploymentIncome: 50000, workplacePlans: [{ ...createWorkplacePlan(kind), employerContribution: 5000 }] }, profile)
 expect(result.branches[0].context).toMatchObject({ employmentIncome: 50000, pensionableEarnings: 50000, eiEarnings: 50000, qpipEarnings: 50000 })
})
it('A11 and A12 distinguish zero deductible capacity, unknown room, and independently over-capacity new deposits', () => {
 const scenario = { ...createRetirementScenario(), cashEmploymentIncome: 100000, workplacePlans: [{ ...createWorkplacePlan(), employeeContribution: 7000, employerContribution: 5000, withdrawalRestriction: 'restricted' as const }] }
 const excess = estimateRetirement(scenario, profile)
 expect(excess.branches[0].rrspDeduction).toBe(12000)
 expect(excess.remainingContributionRoom).toBe(-1000)
 expect(excess.remainingDeductionCapacity).toBe(3000)
 const zero = estimateRetirement(scenario, { ...profile, rrspDeductionLimit: { state: 'known', value: 0, sourceYear: 2026 }, rrspContributionRoom: { state: 'unknown' } })
 expect(zero.branches[0].rrspDeduction).toBe(0)
 expect(zero.remainingContributionRoom).toBeNull()
 expect(zero.employeeCashOutflow).toBe(7000)
})
it.each([['dc-rpp', 9000, 0], ['rrsp-dpsp', 0, 9000]] as const)('A34 %s earnings credit bound is inclusive and independent of matching salary', (kind, employee, employer) => {
 const plan = { ...createWorkplacePlan(kind), registeredPlanCompensation: 50000, employeeContribution: employee, employerContribution: employer }
 const scenario = { ...createRetirementScenario(), cashEmploymentIncome: 100000, workplacePlans: [plan] }
 expect(estimateRetirement(scenario, profile).issues.some(i => i.code === 'plan-earnings-limit')).toBe(false)
 plan.employerContribution++
 expect(estimateRetirement(scenario, profile).issues.some(i => i.code === 'plan-earnings-limit')).toBe(true)
 scenario.cashEmploymentIncome = 200000
 expect(estimateRetirement(scenario, profile).issues.some(i => i.code === 'plan-earnings-limit')).toBe(true)
})
it('A36 member direction clears only its condition and preserves contribution-room warnings', () => {
 const scenario = { ...createRetirementScenario(), cashEmploymentIncome: 100000, workplacePlans: [{ ...createWorkplacePlan('prpp'), employerContribution: 33810 }] }
 expect(estimateRetirement(scenario, profile).issues.some(i => i.code === 'member-direction-needed')).toBe(false)
 scenario.workplacePlans[0].employerContribution = 33811
 expect(estimateRetirement(scenario, profile).issues.some(i => i.code === 'member-direction-needed')).toBe(true)
 scenario.workplacePlans[0].memberDirection = true
 const directed = estimateRetirement(scenario, profile)
 expect(directed.issues.some(i => i.code === 'member-direction-needed')).toBe(false)
 expect(directed.remainingContributionRoom).toBe(11000 - 33811)
 expect(directed.issues.some(i => i.code.includes('room'))).toBe(true)
})
it.each([[3000, 0], [4000, 500], [6000, 1500]])('A29 unmatched first three percent with employee %s yields %s', (employee, employer) => {
 const contract = createMatchingContract(); contract.employee.value = employee; contract.tiers = [{ lowerPercent: 3, upperPercent: 6, matchRatio: .5 }]
 expect(resolveMatchingPlan(contract, { baseSalary: 100000, cashBonus: 0 }).plan?.employerContribution).toBe(employer)
 expect(resolveMatchingPlan(contract, { baseSalary: 0, cashBonus: 0 }).plan?.employeeContribution).toBe(employee)
})
it('A07 zero participation retains unconditional funding without an employee deduction', () => {
 const contract = createMatchingContract(); contract.unconditionalEmployer.value = 2000
 expect(resolveMatchingPlan(contract, { baseSalary: 100000, cashBonus: 0 }).plan).toMatchObject({ employeeContribution: 0, employerContribution: 2000 })
})
