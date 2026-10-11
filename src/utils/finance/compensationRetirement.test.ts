import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { resolveCompensationRetirement, resolveCompensationOffers, buildSalaryRetirementSnapshot } from './compensationRetirement'
import { defaultPrimaryPackage, calcAnnualRRSP } from '../../store/useCompensationStore'
import { createMatchingContract, createWorkplacePlan, createSharedTaxProfile } from './retirementTypes'
import { estimateRetirement } from './retirementEstimate'
import { usePlannerStore } from '../../store/usePlannerStore'
const profile = createSharedTaxProfile('QC')
const context = { stockCurrency: 'USD' as const, cadPerStockUnit: 1.35 }
const contract = { ...createMatchingContract(createWorkplacePlan('group-rrsp', 'work')), employee: { mode: 'percent' as const, value: 6 }, tiers: [{ lowerPercent: 0, upperPercent: 6, matchRatio: .5 }] }
const pkg = { ...defaultPrimaryPackage, baseSalary: 100000, cashBonusPercent: 10, retirement: { schemaVersion: 1 as const, contracts: [contract], review: { status: 'ready' as const, issues: [] } }, rsuGrants: [{ id: 'rsu', grantName: 'Shares', grantShares: 120, grantPrice: 100, grantStartDate: '2025-12-01T12:00:00Z', vestingSchedule: { preset: 'custom' as const, totalVestMonths: 12, cliffMonths: 0, frequency: 'monthly' as const } }] }
const options = { timeMode: 'current-year' as const, fx: context, profile, personalRrsp: 1234.567, personalFhsa: 234.567, includePersonalDeductions: false }
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-04-01T12:00:00Z')) })
afterEach(() => vi.useRealTimers())
describe('CAD compensation retirement adapter', () => {
  it('uses one CAD stock context for both offers without converting salary/retirement', () => {
    const offers = resolveCompensationOffers(pkg, { ...pkg, id: 'compare', baseSalary: 120000 }, options)
    expect(offers.primary.scenario?.cashEmploymentIncome).toBe(126200)
    expect(offers.primary.scenario?.workplacePlans[0]).toMatchObject({ employeeContribution: 6000, employerContribution: 3000 })
    expect(offers.primary.knownCompensation).toBe(129200)
    expect(offers.compare?.scenario?.cashEmploymentIncome).toBe(148200)
    expect(offers.compare?.scenario?.workplacePlans[0].employerContribution).toBe(3600)
    expect(offers.primary.estimate?.branches).toHaveLength(2)
  })
  it('uses historical current-year salary and annualized next-year basis without prorating dollars', () => {
    const historical = { ...pkg, pastSalaryChanges: [{ id: 'old', salary: 80000, changeMonth: 7 }] }
    const current = resolveCompensationRetirement(historical, options)
    const next = resolveCompensationRetirement(historical, { ...options, timeMode: 'next-1-year' })
    expect(current.breakdown.salary).toBe(90000)
    expect(current.breakdown.cashBonus).toBe(9000)
    expect(current.scenario?.workplacePlans[0].employeeContribution).toBe(5400)
    expect(next.breakdown.salary).toBe(100000)
    expect(next.scenario?.taxYear).toBe(2026)
    expect(next.assumptions.join(' ')).toContain('Annualized Using 2026 Rules')
  })
  it('blocks combined totals, cash tax and snapshot when conversion is missing', () => {
    const result = resolveCompensationRetirement(pkg, { ...options, fx: { stockCurrency: 'USD', cadPerStockUnit: null } })
    expect(result.status).toBe('conversion-needed')
    expect(result.knownCompensation).toBeNull()
    expect(result.estimate).toBeNull()
    expect(result.breakdown.salary).toBe(100000)
    expect(result.breakdown.rsuNative).toBe(12000)
    expect(buildSalaryRetirementSnapshot(result)).toBeNull()
  })
  it('keeps unresolved legacy gross estimate but withholds precise cash and transfer', () => {
    const legacy = { ...pkg, retirement: undefined, rrspMatchPercent: 5, rrspMatchCap: 4000 }
    const result = resolveCompensationRetirement(legacy, options)
    expect(result.legacyEmployerEstimate).toBe(4000)
    expect(result.knownCompensation).toBe(130200)
    expect(result.status).toBe('review-needed')
    expect(result.estimate).toBeNull()
    expect(buildSalaryRetirementSnapshot(result)).toBeNull()
    expect(calcAnnualRRSP(pkg)).toBe(3000)
  })
  it('keeps DB unknown funding unknown and iterates every uncertain restriction branch', () => {
    const db = createMatchingContract(createWorkplacePlan('db-rpp', 'db'))
    const second = { ...contract, plan: { ...contract.plan, id: 'second' } }
    const result = resolveCompensationRetirement({ ...pkg, retirement: { schemaVersion: 1, contracts: [contract, second, db], review: { status: 'ready', issues: [] } } }, options)
    expect(result.employerFunding).toBeNull()
    expect(result.knownEmployerFunding).toBe(6000)
    expect(result.estimate?.branches).toHaveLength(4)
    const snapshot = buildSalaryRetirementSnapshot(result)!
    expect(snapshot.transferDetails.classifiedBranches).toHaveLength(4)
    expect(snapshot.transferDetails.employerTaxableBenefits).toBe(6000)
  })
  it.each([true, false])('rich snapshot reconciles personal inclusion %s and rebuilds edited pay without equity duplication', includePersonalDeductions => {
    const result = resolveCompensationRetirement(pkg, { ...options, includePersonalDeductions })
    const snapshot = buildSalaryRetirementSnapshot(result)!
    expect(snapshot.provenance?.sourceBreakdown?.realizedEquity).toBe(16200)
    expect(snapshot.provenance?.assumptions.join(' ')).toContain('sold')
    usePlannerStore.getState().resetSalaryRetirementScenario()
    usePlannerStore.getState().setSharedTaxProfile(profile)
    usePlannerStore.getState().updateSalaryRetirementScenario({ personalRrsp: options.personalRrsp, personalFhsa: options.personalFhsa })
    usePlannerStore.getState().importSalaryRetirementScenario(snapshot)
    const imported = usePlannerStore.getState().salaryRetirementScenario!
    const importedEstimate = estimateRetirement(imported, profile)
    expect(importedEstimate.branches).toEqual(result.estimate?.branches)
    expect(importedEstimate.employeeCashOutflow).toEqual(result.estimate?.employeeCashOutflow)
    expect(importedEstimate.employerFunding).toEqual(result.estimate?.employerFunding)
    usePlannerStore.getState().updateSalaryRetirementScenario({ cashEmploymentIncome: 80000 })
    const edited = usePlannerStore.getState().salaryRetirementScenario!
    expect(edited.cashEmploymentIncome).toBe(80000)
    expect(estimateRetirement(edited, profile).branches[0].employmentIncome).toBe(83000)
    expect(edited.provenance?.editedAfterTransfer).toBe(true)
  })
  it('invalid contracts preserve raw values and block dependent totals rather than dropping rows', () => {
    const bad = { ...contract, employee: { mode: 'percent' as const, value: 101 } }
    const result = resolveCompensationRetirement({ ...pkg, retirement: { schemaVersion: 1, contracts: [bad], review: { status: 'ready', issues: [] } } }, options)
    expect(result.status).toBe('review-needed')
    expect(result.employerFunding).toBeNull()
    expect(result.knownCompensation).toBeNull()
    expect(result.estimate).toBeNull()
    expect(result.review.raw).toEqual([bad])
  })
})

it('keeps the legacy retirement estimate visible even while stock conversion is unavailable', () => {
  const result = resolveCompensationRetirement({ ...pkg, retirement: undefined, rrspMatchPercent: 5, rrspMatchCap: 4000 }, { ...options, fx: { stockCurrency: 'USD', cadPerStockUnit: null } })
  expect(result.legacyEmployerEstimate).toBe(4000)
  expect(result.status).toBe('conversion-needed')
  expect(result.estimate).toBeNull()
})

it('counts CAD ESPP gain once, excludes equity from ordinary match earnings, and rebuilds edited classification', () => {
  const mixedContract = { ...contract, eligibleEarnings: 'base-plus-bonus' as const }
  const mixed = { ...pkg, esppContributionPercent: 10, esppDiscountPercent: 20, esppLockedInPrice: 0, retirement: { schemaVersion: 1 as const, contracts: [mixedContract], review: { status: 'ready' as const, issues: [] } } }
  const result = resolveCompensationRetirement(mixed, options)
  expect(result.breakdown.esppGain).toBe(2500)
  expect(result.scenario?.cashEmploymentIncome).toBe(128700)
  expect(result.scenario?.workplacePlans[0]).toMatchObject({ employeeContribution: 6600, employerContribution: 3300 })
  expect(result.knownCompensation).toBe(132000)
  const snapshot = buildSalaryRetirementSnapshot(result)!
  usePlannerStore.getState().resetSalaryRetirementScenario()
  usePlannerStore.getState().importSalaryRetirementScenario(snapshot)
  usePlannerStore.getState().updateSalaryRetirementScenario({ cashEmploymentIncome: 80000, workplacePlans: [{ ...snapshot.workplacePlans[0], employerContribution: 10000, withdrawalRestriction: 'restricted' }] })
  const edited = usePlannerStore.getState().salaryRetirementScenario!
  const estimated = estimateRetirement(edited, profile)
  expect(estimated.branches).toHaveLength(1)
  expect(estimated.branches[0].context).toMatchObject({ employmentIncome: 90000, pensionableEarnings: 90000, eiEarnings: 80000, qpipEarnings: 80000, employmentCreditIncome: 90000, workerDeductionIncome: 90000 })
  expect(snapshot.workplacePlans[0].employerContribution).toBe(3300)
  expect(edited.provenance?.editedAfterTransfer).toBe(true)
})
