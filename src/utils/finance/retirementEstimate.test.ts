import { annualSalaryTax, PROVINCES } from './canadaTax'
import { createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from './retirementTypes'
import type { RetirementScenario, SharedTaxProfile } from './retirementTypes'
import { estimateRetirement, retirementMarginalBreakdown, retirementEfficiencySlices } from './retirementEstimate'

const scenario = (kind: Parameters<typeof createWorkplacePlan>[0] = 'group-rrsp'): RetirementScenario => ({ ...createRetirementScenario(), cashEmploymentIncome: 100000,
  workplacePlans: [{ ...createWorkplacePlan(kind), employeeContribution: 5000, employerContribution: 5000, withdrawalRestriction: 'restricted' as const }] })
const profile = (): SharedTaxProfile => ({ ...createSharedTaxProfile(), rrspDeductionLimit: { state: 'known' as const, value: 20000, sourceYear: 2026 } })
describe('retirement annual estimate', () => {
  it('separates RRSP benefit, deduction, funding and cash', () => {
    const r = estimateRetirement(scenario(), profile()); const b = r.branches[0]
    expect(b.employmentIncome).toBe(105000); expect(b.rrspDeduction).toBe(10000)
    expect(b.incomeBeforeStatutoryDeductions).toBe(95000); expect(r.employeeCashOutflow).toBe(5000)
    expect(r.totalRetirementFunding).toBe(10000); expect(b.cashAfterContributions).toBe(b.tax.net - 5000)
  })
  it('keeps DC deduction independent of known zero room and PA following-year', () => {
    const p = profile(); p.rrspDeductionLimit.value = 0
    const r = estimateRetirement(scenario('dc-rpp'), p)
    expect(r.branches[0].rppDeduction).toBe(5000); expect(r.currentRoomUsage).toBe(0); expect(r.followingYearPa).toBe(10000)
  })
  it('keeps DPSP separate from RRSP and PRPP reduces deduction capacity', () => {
    const d = estimateRetirement(scenario('rrsp-dpsp'), profile())
    expect(d.currentRoomUsage).toBe(5000); expect(d.followingYearPa).toBe(5000); expect(d.branches[0].employmentIncome).toBe(100000)
    const p = profile(); p.rrspDeductionLimit.value = 12000
    const r = estimateRetirement(scenario('prpp'), p)
    expect(r.memberDeductionCapacity).toBe(7000); expect(r.currentRoomUsage).toBe(10000); expect(r.branches[0].rrspDeduction).toBe(5000)
  })
  it('allocates employer RRSP first and preserves nondeductible actual cash', () => {
    const s = scenario(); s.workplacePlans[0].employeeContribution = 7000; s.workplacePlans[0].employerContribution = 3000
    const p = profile(); p.rrspDeductionLimit.value = 6000
    const r = estimateRetirement(s, p)
    expect(r.deductionAllocation).toEqual([{ planId: 'plan-1', employerRrsp: 3000, employee: 3000 }])
    expect(r.employeeCashOutflow).toBe(7000); expect(r.branches[0].rrspDeduction).toBe(6000)
  })
  it('retains DB unknown funding/PA and exact current-service decimals', () => {
    const s = scenario('db-rpp'); s.workplacePlans[0].employerContribution = null; s.workplacePlans[0].employeeContribution = 8655.32
    const r = estimateRetirement(s, profile())
    expect(r.employerFunding).toBeNull(); expect(r.followingYearPa).toBeNull(); expect(r.employeeCashOutflow).toBe(8655.32)
    expect(r.branches[0].rppDeduction).toBe(8655.32)
  })
  it('retains unknown restricted branches through cash, tax and helper results', () => {
    const s = scenario(); s.cashEmploymentIncome = 50000; s.workplacePlans[0].withdrawalRestriction = 'unknown'
    const p = { ...profile(), province: 'QC' as const }
    const r = estimateRetirement(s, p)
    expect(r.status).toBe('uncertain'); expect(r.branches).toHaveLength(2)
    expect(r.branches.map(b => b.tax.ei)).toEqual([650, 715]); expect(r.branches.map(b => b.tax.qpip)).toEqual([215, 236.5])
    expect(r.branches[0].tax.federal).not.toBe(r.branches[1].tax.federal)
    expect(retirementMarginalBreakdown(s, p).branches).toHaveLength(2)
    expect(retirementEfficiencySlices(s, p).branches).toHaveLength(2)
  })
  it.each(PROVINCES.map(p => [p.code]))('preserves existing tax and statutory earnings in %s', province => {
    for (const cash of [1000, 50000, 200000]) {
      const s = { ...createRetirementScenario(), cashEmploymentIncome: cash, includePersonalDeductions: false }
      const p = createSharedTaxProfile(province)
      expect(estimateRetirement(s, p).branches[0].tax).toEqual(annualSalaryTax(cash, province))
      s.workplacePlans = [{ ...createWorkplacePlan('dc-rpp'), employeeContribution: 500 }]
      expect(estimateRetirement(s, p).branches[0].tax.pension).toBe(annualSalaryTax(cash, province).pension)
    }
  })
  it('distinguishes zero, legacy, stale and signed contribution room', () => {
    const s = scenario(); const p = profile()
    p.rrspDeductionLimit = { state: 'legacy', value: 6000 }
    expect(estimateRetirement(s, p).branches[0].rrspDeduction).toBe(6000)
    p.rrspDeductionLimit = { state: 'known', value: 0, sourceYear: 2026 }
    expect(estimateRetirement(s, p).branches[0].rrspDeduction).toBe(0)
    p.rrspDeductionLimit = { state: 'known', value: 6000, sourceYear: 2025 }
    p.rrspContributionRoom = { state: 'known', value: -1000, sourceYear: 2026 }
    const r = estimateRetirement(s, p)
    expect(r.branches[0].rrspDeduction).toBe(10000); expect(r.remainingContributionRoom).toBe(-11000)
    expect(r.issues.some(i => i.code === 'deductibility-assumed')).toBe(true)
  })
  it('bounds actionable new deposits by both remaining capacities', () => {
    const p = profile(); p.rrspDeductionLimit.value = 15000; p.rrspContributionRoom = { state: 'known', value: 11000, sourceYear: 2026 }
    expect(estimateRetirement(scenario(), p).additionalContributionCapacity).toBe(1000)
    p.rrspContributionRoom = { state: 'unknown' }
    expect(estimateRetirement(scenario(), p).additionalContributionCapacity).toBeNull()
  })
  it.each(['legacy', 'known'] as const)('uses a %s source-year-unknown cap provisionally without actionable additional room', state => {
    const s = scenario(); s.workplacePlans[0].employeeContribution = 1000; s.workplacePlans[0].employerContribution = 0
    const p = profile(); p.rrspDeductionLimit = { state, value: 6000 }
    p.rrspContributionRoom = { state: 'known', value: 11000, sourceYear: 2026 }
    const r = estimateRetirement(s, p)
    expect(r.branches[0].rrspDeduction).toBe(1000); expect(r.remainingDeductionCapacity).toBe(5000)
    expect(r.additionalContributionCapacity).toBeNull()
  })
  it('rejects a supplied nonboolean ordinary aggregate marker', () => {
    const s = scenario('dc-rpp'); Object.assign(s.workplacePlans[0], { ordinaryAggregate: 'false' })
    expect(estimateRetirement(s, profile()).status).toBe('invalid')
  })
  it('checks ordinary dollar, earnings and combined limits preserving amounts', () => {
    const s = scenario('dc-rpp'); s.workplacePlans[0].registeredPlanCompensation = 50000
    s.workplacePlans[0].employeeContribution = 4000; s.workplacePlans[0].employerContribution = 5000
    expect(estimateRetirement(s, profile()).issues.some(i => i.code === 'plan-earnings-limit')).toBe(false)
    s.workplacePlans[0].employeeContribution = 4001
    expect(estimateRetirement(s, profile()).issues.some(i => i.code === 'plan-earnings-limit')).toBe(true)
    s.workplacePlans = [{ ...createWorkplacePlan('dc-rpp'), employeeContribution: 20000 }, { ...createWorkplacePlan('rrsp-dpsp','two'), employerContribution: 16000 }]
    const r = estimateRetirement(s, profile())
    expect(r.issues.some(i => i.code === 'aggregate-dollar-limit')).toBe(true)
    expect(r.issues.some(i => i.code === 'earnings-limit-unverified')).toBe(true)
    expect(r.employeeCashOutflow).toBe(20000)
  })
  it('separates PRPP member direction from room warnings', () => {
    const s = scenario('prpp'); s.workplacePlans[0].employerContribution = 33811
    expect(estimateRetirement(s, profile()).issues.some(i => i.code === 'member-direction-needed')).toBe(true)
    s.workplacePlans[0].memberDirection = true
    expect(estimateRetirement(s, profile()).issues.some(i => i.code === 'member-direction-needed')).toBe(false)
  })
  it('keeps dollar warnings but withholds unsupported mixed-provision earnings checks', () => {
    const s = scenario('dc-rpp'); s.workplacePlans[0].ordinaryAggregate = false
    s.workplacePlans[0].registeredPlanCompensation = 1000; s.workplacePlans[0].employerContribution = 40000
    const r = estimateRetirement(s, profile())
    expect(r.issues.some(i => i.code === 'plan-dollar-limit')).toBe(true)
    expect(r.issues.some(i => i.code === 'plan-earnings-limit')).toBe(false)
    expect(r.issues.some(i => i.code === 'earnings-limit-unverified')).toBe(true)
  })
  it('withholds invalid dependent results retaining raw rows', () => {
    const s = scenario(); s.workplacePlans[0].employeeContribution = Infinity
    const r = estimateRetirement(s, profile())
    expect(r.status).toBe('invalid'); expect(r.branches).toEqual([]); expect(r.scenario).toBe(s)
  })
  it('withholds malformed row collections instead of throwing', () => {
    const s = scenario(); Object.assign(s, { workplacePlans: { broken: true } })
    expect(estimateRetirement(s, profile()).status).toBe('invalid')
  })
  it('rejects duplicate plan identifiers and overflowing aggregate amounts', () => {
    const s = scenario(); s.workplacePlans.push({ ...s.workplacePlans[0] })
    expect(estimateRetirement(s, profile()).status).toBe('invalid')
    s.workplacePlans = [{ ...createWorkplacePlan('dc-rpp'), employeeContribution: Number.MAX_VALUE, employerContribution: Number.MAX_VALUE }]
    expect(estimateRetirement(s, profile()).status).toBe('invalid')
  })
  it('retains employer deduction and PRPP capacity in employee savings baseline', () => {
    const s = scenario(); const r = estimateRetirement(s, profile()); const b = r.branches[0]
    expect(b.baselineTax.taxableIncome).toBe(98873)
    expect(b.taxSavings).toBeCloseTo(b.baselineTax.federal + b.baselineTax.provincial - b.tax.federal - b.tax.provincial, 8)
  })
  it.each([['dc-rpp', 35390], ['rrsp-dpsp', 17695]] as const)('accepts the %s dollar ceiling and warns one dollar above', (kind, ceiling) => {
    const s = scenario(kind); s.workplacePlans[0].employeeContribution = 0; s.workplacePlans[0].employerContribution = ceiling
    s.workplacePlans[0].registeredPlanCompensation = 1000000
    expect(estimateRetirement(s, profile()).issues.some(i => i.code === 'plan-dollar-limit')).toBe(false)
    s.workplacePlans[0].employerContribution++
    expect(estimateRetirement(s, profile()).issues.some(i => i.code === 'plan-dollar-limit')).toBe(true)
  })
  it('uses actual PA without using it as current-year deduction or room', () => {
    const s = scenario('dc-rpp'); s.workplacePlans[0].administratorPa = 1234.56
    const r = estimateRetirement(s, profile())
    expect(r.followingYearPa).toBe(1234.56); expect(r.branches[0].rppDeduction).toBe(5000); expect(r.currentRoomUsage).toBe(0)
  })
  it('holds employer and employee dollars fixed for the $100 contextual marginal', () => {
    const s = scenario('dc-rpp'); s.cashEmploymentIncome = 100000
    const m = retirementMarginalBreakdown(s, profile()).branches[0]
    // Both statutory contributions are saturated. $95,000 before enhanced pension deductions is in 20.5% federal and 9.15% ON brackets, below surtax.
    expect(m.total).toBeCloseTo(29.65, 8)
    const b = estimateRetirement(s, profile()).branches[0]
    const slices = retirementEfficiencySlices(s, profile()).branches[0]
    expect(slices.reduce((n,x) => n+x.taxSaved, 0)).toBeCloseTo(b.tax.federal+b.tax.provincial, 7)
  })
  it('keeps unknown withdrawal treatment even when statutory maxima collapse branches', () => {
    const s = scenario(); s.cashEmploymentIncome = 200000; s.workplacePlans[0].withdrawalRestriction = 'unknown'
    const r = estimateRetirement(s, profile())
    expect(r.status).toBe('uncertain'); expect(r.branches[0].tax).toEqual(r.branches[1].tax)
  })
  it('preserves independent withdrawal possibilities for multiple unknown plans', () => {
    const s = scenario(); s.cashEmploymentIncome = 50000; s.workplacePlans[0].withdrawalRestriction = 'unknown'
    s.workplacePlans.push({ ...createWorkplacePlan('group-rrsp','two'), employerContribution: 2000 })
    expect(estimateRetirement(s, profile()).branches.map(b => b.context.eiEarnings)).toEqual([50000, 52000, 55000, 57000])
  })
  it('retains employer PRPP reduction when constructing employee savings baseline', () => {
    const s = scenario(); s.workplacePlans.push({ ...createWorkplacePlan('prpp','prpp'), employerContribution: 5000 })
    const p = profile(); p.rrspDeductionLimit.value = 6000
    const b = estimateRetirement(s, p).branches[0]
    expect(b.rrspDeduction).toBe(1000); expect(b.baselineTax.taxableIncome).toBe(102873); expect(b.taxSavings).toBe(0)
  })
})


describe('bounded unknown earnings', () => {
  const many = (count: number) => ({ ...createRetirementScenario(), cashEmploymentIncome: 50000, workplacePlans: Array.from({ length: count }, (_, i) => ({ ...createWorkplacePlan('group-rrsp', `unknown-${i}`), employeeContribution: 10, employerContribution: 100 })) })
  it('withholds 17-row dependent precision while preserving every known amount', () => {
    const s = many(17); const r = estimateRetirement(s, profile())
    expect(r.branches).toHaveLength(0)
    expect(r.status).toBe('uncertain'); expect(r.scenario.workplacePlans).toEqual(s.workplacePlans)
    expect(r.employeeCashOutflow).toBe(170); expect(r.employerFunding).toBe(1700)
    expect(r.totalRetirementFunding).toBe(1870); expect(r.currentRoomUsage).toBe(1870)
    expect(r.deductionAllocation).toHaveLength(17)
    expect(r.issues.some(i => i.message.includes('dependent results unavailable'))).toBe(true)
    expect(retirementMarginalBreakdown(s, profile()).branches).toEqual([])
    expect(retirementEfficiencySlices(s, profile()).branches).toEqual([])
  })
  it('retains every independent combination at the 512-branch budget and withholds above it', () => {
    const r = estimateRetirement(many(9), profile())
    expect(r.branches).toHaveLength(512)
    expect(new Set(r.branches.map(b => JSON.stringify(b.withdrawalTreatments))).size).toBe(512)
    expect(estimateRetirement(many(10), profile()).branches).toEqual([])
  })
})
