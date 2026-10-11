import { describe, expect, it } from 'vitest'
import { resolveForecasterCompTax } from './compTax'
import { resolveCompensationRetirement } from './compensationRetirement'
import { retirementMarginalBreakdown } from './retirementEstimate'
import { createMatchingContract, createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from './retirementTypes'
import type { CompensationPackage } from '../../store/useCompensationStore'

const pkg: CompensationPackage = { id: 'p', name: 'Primary', companyCurrentPrice: 100, baseSalary: 150000, pastSalaryChanges: [], cashBonusPercent: 10, cashBonusMonth: 12, esppContributionPercent: 0, esppDiscountPercent: 15, esppLockedInPrice: 0, rrspMatchPercent: 0, rrspMatchCap: 0, rsuGrants: [], retirement: { schemaVersion: 1, contracts: [], review: { status: 'ready', issues: [] } } }
const profile = { ...createSharedTaxProfile(), rrspDeductionLimit: { state: 'known' as const, value: 30000, sourceYear: 2026 } }
const options = { timeMode: 'next-1-year' as const, fx: { stockCurrency: 'USD' as const, cadPerStockUnit: 1.4 }, profile, personalRrsp: 25000, personalFhsa: 8000, includePersonalDeductions: true }
const config = { enabled: true, auto: true, manualPct: 41, savedScenario: null, primaryPackage: pkg, options }

describe('complete Forecaster tax baseline', () => {
  it('uses all saved salary rows and its personal choice without borrowing primary income', () => {
    const saved = { ...createRetirementScenario(), cashEmploymentIncome: 90000, personalRrsp: 14000, workplacePlans: [{ ...createWorkplacePlan('dc-rpp'), employeeContribution: 5000, employerContribution: 9000 }] }
    const result = resolveForecasterCompTax({ ...config, savedScenario: saved })
    expect(result.source).toBe('Saved Salary & Tax')
    expect(result.rate).toBeCloseTo(retirementMarginalBreakdown(saved, profile).branches[0].total / 100, 10)
  })
  it('resolves primary percentage contributions once and forces personal deductions off', () => {
    const contract = { ...createMatchingContract(createWorkplacePlan('dc-rpp')), employee: { mode: 'percent' as const, value: 10 }, unconditionalEmployer: { mode: 'percent' as const, value: 5 } }
    const primaryPackage = { ...pkg, retirement: { ...pkg.retirement!, contracts: [contract] } }
    const expected = resolveCompensationRetirement(primaryPackage, { ...options, includePersonalDeductions: false }).scenario!
    const result = resolveForecasterCompTax({ ...config, primaryPackage })
    expect(result.source).toBe('Primary Compensation')
    expect(result.rate).toBeCloseTo(retirementMarginalBreakdown(expected, profile).branches[0].total / 100, 10)
    expect(result.assumptions.join(' ')).toContain('Personal deductions off')
  })
  it('invalid saved scenario blocks fallback while manual and disabled rates remain authoritative', () => {
    const savedScenario = { ...createRetirementScenario(), cashEmploymentIncome: -1 }
    expect(resolveForecasterCompTax({ ...config, savedScenario }).rate).toBeNull()
    expect(resolveForecasterCompTax({ ...config, savedScenario }).source).toBe('Saved Salary & Tax')
    expect(resolveForecasterCompTax({ ...config, savedScenario, auto: false }).rate).toBe(.41)
    expect(resolveForecasterCompTax({ ...config, savedScenario, enabled: false }).rate).toBe(0)
  })
  it('withholds unknown earnings branches and exposes their marginal range', () => {
    const savedScenario = { ...createRetirementScenario(), cashEmploymentIncome: 45000, workplacePlans: [{ ...createWorkplacePlan(), employerContribution: 4000 }] }
    const result = resolveForecasterCompTax({ ...config, savedScenario })
    expect(result.rate).toBeNull()
    expect(result.rangePct).toHaveLength(2)
    expect(result.notices.join(' ')).toContain('Earnings Treatment Needed')
  })
  it('legacy primary rows stay unavailable rather than assuming no retirement funding', () => {
    const primaryPackage = { ...pkg, retirement: undefined, rrspMatchPercent: 5, rrspMatchCap: 6000 }
    expect(resolveForecasterCompTax({ ...config, primaryPackage }).rate).toBeNull()
  })
})
