import { calcAnnualBaseSalary, calcAnnualBonus, calcAnnualESPP, calcAnnualRSU, type CompensationPackage, type TimeMode } from '../../store/useCompensationStore'
import { convertPackageToCad } from '../../store/compensationFx'
import { normalizeOfferRetirement, reviewTaxProfile, type RetirementReview } from '../../store/retirementPersistence'
import { resolveMatchingPlan } from './retirementMatching'
import { estimateRetirement } from './retirementEstimate'
import type { RetirementScenario, SharedTaxProfile } from './retirementTypes'
import type { ClassifiedTaxContext } from './canadaTax'

/** A single valuation context must be supplied to both offers, independent of display toggles. */
export interface CompensationCadContext { stockCurrency: 'CAD' | 'USD'; cadPerStockUnit: number | null }
export interface CompensationRetirementOptions {
  timeMode: TimeMode
  fx: CompensationCadContext
  profile: SharedTaxProfile
  personalRrsp: number
  personalFhsa: number
  includePersonalDeductions: boolean
}
export interface CompensationRetirementResult {
  status: 'ready' | 'conversion-needed' | 'review-needed'
  review: RetirementReview
  breakdown: { salary: number; cashBonus: number; rsuNative: number; realizedEquity: number | null; esppGain: number }
  scenario: RetirementScenario | null
  estimate: ReturnType<typeof estimateRetirement> | null
  knownCompensation: number | null
  totalCompensation: number | null
  knownEmployerFunding: number | null
  employerFunding: number | null
  legacyEmployerEstimate: number | null
  assumptions: string[]
  fx: CompensationCadContext
  profile: SharedTaxProfile
}
export interface SalaryRetirementSnapshot extends RetirementScenario {
  /** Historical review metadata only. Calculators always rebuild from the canonical scenario. */
  transferDetails: {
    employerTaxableBenefits: number
    classifiedBranches: Array<{ withdrawalTreatments: Record<string, string>; context: ClassifiedTaxContext }>
    profileAtTransfer: SharedTaxProfile
    fx: CompensationCadContext
  }
}
export function resolveCompensationRetirement(pkg: CompensationPackage, options: CompensationRetirementOptions): CompensationRetirementResult {
  const normalized = normalizeOfferRetirement(pkg)
  const salary = calcAnnualBaseSalary(pkg, options.timeMode)
  const cashBonus = calcAnnualBonus(pkg, options.timeMode)
  const rsuNative = calcAnnualRSU(pkg, options.timeMode)
  // ESPP uses a CAD salary contribution and a native price ratio; the gain is already CAD.
  const esppGain = calcAnnualESPP(pkg, options.timeMode)
  const stockPresent = rsuNative !== 0 || esppGain !== 0
  const conversionReady = options.fx.stockCurrency === 'CAD' || (options.fx.stockCurrency === 'USD' && typeof options.fx.cadPerStockUnit === 'number' && Number.isFinite(options.fx.cadPerStockUnit) && options.fx.cadPerStockUnit > 0) || !stockPresent
  const cadPackage = options.fx.stockCurrency === 'USD' && conversionReady && stockPresent ? convertPackageToCad(pkg, options.fx.cadPerStockUnit!, true) : pkg
  const realizedEquity = conversionReady ? calcAnnualRSU(cadPackage, options.timeMode) : null
  const assumptions = [
    'RSU vest value and ESPP gain are employment income assumed realized as cash through sale; shares are sold.',
    'Annual aggregate retirement terms apply for the whole selected period; annual dollar inputs are not prorated.',
    ...(options.timeMode === 'next-1-year' ? ['Annualized Using 2026 Rules; supplied 2026 opening capacity applies to this hypothetical annual scenario.'] : ['Current-year annual estimate using 2026 rules.']),
  ]
  const result: CompensationRetirementResult = { status: 'ready', review: normalized.retirement.review, breakdown: { salary, cashBonus, rsuNative, realizedEquity, esppGain }, scenario: null, estimate: null, knownCompensation: null, totalCompensation: null, knownEmployerFunding: null, employerFunding: null, legacyEmployerEstimate: null, assumptions, fx: { ...options.fx }, profile: structuredClone(options.profile) }
  if (normalized.retirement.review.status === 'legacy') {
    const legacy = Math.min(salary * pkg.rrspMatchPercent / 100, pkg.rrspMatchCap)
    if (Number.isFinite(legacy) && legacy >= 0) result.legacyEmployerEstimate = legacy
  }
  if (!conversionReady) return { ...result, status: 'conversion-needed' }
  const cashEmploymentIncome = salary + cashBonus + realizedEquity! + esppGain
  if (normalized.retirement.review.status !== 'ready') {
    if (normalized.retirement.review.status === 'legacy') {
      if (result.legacyEmployerEstimate !== null && Number.isFinite(cashEmploymentIncome)) result.knownCompensation = cashEmploymentIncome + result.legacyEmployerEstimate
    }
    return { ...result, status: 'review-needed' }
  }
  const resolved = normalized.retirement.contracts.map(contract => resolveMatchingPlan(contract, { baseSalary: salary, cashBonus }))
  const issues = resolved.flatMap(row => row.issues)
  if (issues.length) return { ...result, status: 'review-needed', review: { status: 'invalid', issues, raw: normalized.retirement.contracts } }
  const scenario: RetirementScenario = {
    cashEmploymentIncome, workplacePlans: resolved.map(row => row.plan!), personalRrsp: options.personalRrsp, personalFhsa: options.personalFhsa, includePersonalDeductions: options.includePersonalDeductions, taxYear: 2026,
    provenance: { source: 'compensation', sourceTimeMode: options.timeMode === 'next-1-year' ? 'next-one-year' : 'current-year', assumptions, sourceBreakdown: { salary, cashBonus, realizedEquity: realizedEquity!, esppGain } },
  }
  const profileReview = reviewTaxProfile(options.profile)
  if (profileReview.status === 'invalid') return { ...result, status: 'review-needed', scenario, review: profileReview }
  const estimate = estimateRetirement(scenario, options.profile)
  if (estimate.status === 'invalid') return { ...result, status: 'review-needed', scenario, review: { status: 'invalid', issues: estimate.issues, raw: scenario } }
  return { ...result, scenario, estimate, knownEmployerFunding: estimate.knownEmployerFunding, employerFunding: estimate.employerFunding, knownCompensation: cashEmploymentIncome + estimate.knownEmployerFunding!, totalCompensation: estimate.employerFunding === null ? null : cashEmploymentIncome + estimate.employerFunding }
}
export function resolveCompensationOffers(primary: CompensationPackage, compare: CompensationPackage | null, options: CompensationRetirementOptions) {
  return { primary: resolveCompensationRetirement(primary, options), compare: compare ? resolveCompensationRetirement(compare, options) : null }
}
export function buildSalaryRetirementSnapshot(result: CompensationRetirementResult, transferredAt = new Date().toISOString()): SalaryRetirementSnapshot | null {
  if (result.status !== 'ready' || !result.scenario || !result.estimate) return null
  return structuredClone({ ...result.scenario, provenance: { ...result.scenario.provenance!, transferredAt, editedAfterTransfer: false }, transferDetails: {
    employerTaxableBenefits: result.scenario.workplacePlans.filter(plan => plan.kind === 'group-rrsp').reduce((sum, plan) => sum + (plan.employerContribution ?? 0), 0),
    classifiedBranches: result.estimate.branches.map(branch => ({ withdrawalTreatments: branch.withdrawalTreatments, context: branch.context })),
    profileAtTransfer: result.profile, fx: result.fx,
  } })
}
