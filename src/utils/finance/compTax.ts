// Tax haircut for auto-fed comp event lump sums (RSU, bonus, ESPP). Comp
// lumps stack on top of salary, so the marginal rate (not effective rate)
// is the right approximation. Manual life events are never taxed.

import { salaryMarginalRate, type Province } from './canadaTax'
import type { LumpSum } from './forecast'
import type { CompensationPackage } from '../../store/useCompensationStore'
import { reviewSalaryScenario, reviewTaxProfile } from '../../store/retirementPersistence'
import { resolveCompensationRetirement, type CompensationRetirementOptions } from './compensationRetirement'
import { retirementMarginalBreakdown } from './retirementEstimate'
import type { RetirementScenario } from './retirementTypes'

export function applyLumpTax(lumps: LumpSum[], rate: number): LumpSum[] {
  if (rate <= 0) return lumps
  const r = Math.min(rate, 1)
  return lumps.map((l) => ({ ...l, amount: l.amount * (1 - r) }))
}

export interface CompTaxConfig {
  enabled: boolean
  auto: boolean
  manualPct: number
  income: number
  province: Province
}

/** Fraction (0..1) to withhold from comp lumps. */
export function resolveCompTaxRate(cfg: CompTaxConfig): number {
  if (!cfg.enabled) return 0
  if (cfg.auto) return salaryMarginalRate(cfg.income, cfg.province) / 100
  return Math.min(Math.max(cfg.manualPct, 0), 100) / 100
}

/** Resolve one complete annual baseline. Contribution dollars are fixed for the $100 tax difference. */
export function resolveForecasterCompTax(cfg: {
  enabled: boolean; auto: boolean; manualPct: number
  savedScenario: RetirementScenario | null
  primaryPackage: CompensationPackage
  options: CompensationRetirementOptions
}) {
  const source = cfg.savedScenario !== null ? 'Saved Salary & Tax' : 'Primary Compensation'
  const assumptions = ['2026 tax tables; annual approximation with resolved contribution dollars held fixed.']
  const notices: string[] = []
  let rangePct: [number, number] | null = null
  let automaticRate: number | null = null
  let scenario = cfg.savedScenario
  if (scenario === null) {
    const primary = resolveCompensationRetirement(cfg.primaryPackage, { ...cfg.options, includePersonalDeductions: false })
    assumptions.push('Personal deductions off for the primary Compensation baseline.', ...primary.assumptions)
    scenario = primary.status === 'ready' ? primary.scenario : null
    if (!scenario) notices.push(primary.status === 'conversion-needed' ? 'Conversion Needed for the primary Compensation tax baseline.' : 'Primary Compensation retirement terms need review.')
  } else if (Array.isArray(scenario.provenance?.assumptions)) assumptions.push(...scenario.provenance.assumptions)
  if (scenario && reviewSalaryScenario(scenario).status === 'ready' && reviewTaxProfile(cfg.options.profile).status === 'ready') {
    const marginal = retirementMarginalBreakdown(scenario, cfg.options.profile)
    notices.push(...marginal.issues.map(issue => issue.message))
    if (marginal.branches.length) {
      const rates = marginal.branches.map(branch => branch.total)
      rangePct = rates.reduce<[number, number]>((bounds, rate) => [Math.min(bounds[0], rate), Math.max(bounds[1], rate)], [Infinity, -Infinity])
      if (marginal.status === 'valid' && rates.every(Number.isFinite)) automaticRate = rates[0] / 100
    }
  } else if (scenario) notices.push('Tax baseline needs review. Automatic rate unavailable.')
  const rate = !cfg.enabled ? 0 : !cfg.auto ? Math.min(Math.max(cfg.manualPct, 0), 100) / 100 : automaticRate
  return { rate, ratePct: rate === null ? null : rate * 100, source, province: cfg.options.profile.province, rangePct, assumptions, notices }
}
