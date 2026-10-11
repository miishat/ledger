import { describe, expect, it } from 'vitest'
import { normalizePlannerState, normalizeCompensationState } from './retirementPersistence'
import { createMatchingContract } from '../utils/finance/retirementTypes'

 describe('retirement persistence normalization', () => {
  it('seeds legacy calculators preserving exact personal amounts and unrelated tools', () => {
    const raw = { inputs: { 'income-tax': { income: 92345.67, province: 'QC', rrsp: 1234.567, fhsa: 234.567, rrspRoom: 6000 }, other: { principal: 123 } } }
    const result = normalizePlannerState(raw)
    expect(result.salaryRetirementScenario).toMatchObject({ cashEmploymentIncome: 92345.67, personalRrsp: 1234.567, personalFhsa: 234.567 })
    expect(result.sharedTaxProfile).toEqual({ province: 'QC', rrspDeductionLimit: { state: 'legacy', value: 6000 }, rrspContributionRoom: { state: 'unknown' } })
    expect(result.inputs.other).toEqual({ principal: 123 })
    expect(result.inputs['income-tax']).toEqual(raw.inputs['income-tax'])
    expect(normalizePlannerState(result)).toEqual(result)
  })
  it('seeds take-home-pay gross and distinguishes no saved scenario from invalid saved rows', () => {
    expect(normalizePlannerState({ inputs: {} }).salaryRetirementScenario).toBeNull()
    expect(normalizePlannerState({ inputs: { 'take-home-pay': { gross: 50000 } } }).salaryRetirementScenario?.cashEmploymentIncome).toBe(50000)
    const raw = { cashEmploymentIncome: 80000, workplacePlans: [{ id: 'bad', employeeContribution: -1 }], personalRrsp: 0, personalFhsa: 0, includePersonalDeductions: true, taxYear: 2026 }
    const result = normalizePlannerState({ inputs: {}, salaryRetirementScenario: raw, retirementSchemaVersion: 1 })
    expect(result.salaryRetirementScenario).toEqual(raw)
    expect(result.salaryRetirementReview.status).toBe('invalid')
    expect(result.salaryRetirementReview.raw).toEqual(raw)
  })
  it('preserves signed room, known zero, source years and malformed raw capacities', () => {
    const profile = { province: 'ON', rrspDeductionLimit: { state: 'known', value: 0, sourceYear: 2026 }, rrspContributionRoom: { state: 'known', value: -100, sourceYear: 2025 } }
    expect(normalizePlannerState({ inputs: {}, sharedTaxProfile: profile }).sharedTaxProfile).toEqual(profile)
    expect(normalizePlannerState({ inputs: {}, sharedTaxProfile: { ...profile, rrspDeductionLimit: { state: 'known', value: -1 } } }).sharedTaxReview.status).toBe('invalid')
  })
  it('marks all nonzero legacy fields unresolved without guessing a contract', () => {
    for (const [percent, cap] of [[5, 4000], [5, 0], [0, 4000], [-1, 4000]]) {
      const primaryPackage = { baseSalary: 100000, rrspMatchPercent: percent, rrspMatchCap: cap, pastSalaryChanges: [{ salary: 80000, changeMonth: 7 }], rsuGrants: [{ id: 'g' }] }
      const result = normalizeCompensationState({ primaryPackage, comparePackage: null })
      expect(result.primaryPackage.retirement.review.status).toBe(percent < 0 ? 'invalid' : 'legacy')
      expect(result.primaryPackage.retirement.contracts).toEqual([])
      expect(result.primaryPackage.pastSalaryChanges).toEqual(primaryPackage.pastSalaryChanges)
      expect(result.primaryPackage.rsuGrants).toEqual(primaryPackage.rsuGrants)
      expect(normalizeCompensationState(result)).toEqual(result)
    }
  })
  it('keeps zero legacy offers ready and reviewed typed contracts authoritative', () => {
    const contract = createMatchingContract()
    const raw = { primaryPackage: { rrspMatchPercent: 5, rrspMatchCap: 4000, retirement: { schemaVersion: 1, contracts: [contract], review: { status: 'ready', issues: [] } } }, comparePackage: { rrspMatchPercent: 0, rrspMatchCap: 0 }, includePersonalDeductions: true }
    const result = normalizeCompensationState(raw)
    expect(result.primaryPackage.retirement.review.status).toBe('ready')
    expect(result.comparePackage?.retirement.review.status).toBe('ready')
    expect(result.includePersonalDeductions).toBe(true)
    expect(normalizeCompensationState(result)).toEqual(result)
  })
  it('retains malformed contracts and reports affected rows', () => {
    const contract = { ...createMatchingContract(), employee: { mode: 'percent', value: 101 } }
    const result = normalizeCompensationState({ primaryPackage: { retirement: { schemaVersion: 1, contracts: [contract], review: { status: 'ready', issues: [] } } } })
    expect(result.primaryPackage.retirement.contracts).toEqual([contract])
    expect(result.primaryPackage.retirement.review.status).toBe('invalid')
    expect(result.primaryPackage.retirement.review.issues[0].planId).toBe('plan-1')
  })
})

it('preserves supplied retirement blocks with a malformed discriminator for review', () => {
  const retirement = { schemaVersion: 9, contracts: [{ bad: 'recover me' }] }
  const result = normalizeCompensationState({ primaryPackage: { rrspMatchPercent: 0, rrspMatchCap: 0, retirement } })
  expect(result.primaryPackage.retirement.review.status).toBe('invalid')
  expect(result.primaryPackage.retirement.review.raw).toEqual(retirement)
  expect(result.primaryPackage.retirement.contracts).toEqual(retirement.contracts)
  expect(normalizeCompensationState(result)).toEqual(result)
})
