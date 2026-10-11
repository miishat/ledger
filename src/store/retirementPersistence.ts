import type { CompensationPackage } from './useCompensationStore'
import type { ToolInputs } from './usePlannerStore'
import type { MatchingContract, RetirementIssue, RetirementScenario, SharedTaxProfile } from '../utils/finance/retirementTypes'
import { createRetirementScenario, createSharedTaxProfile, validateWorkplacePlan } from '../utils/finance/retirementTypes'
import { resolveMatchingPlan } from '../utils/finance/retirementMatching'
import { STORAGE_KEYS } from './storageKeys'

export interface RetirementReview { status: 'ready' | 'legacy' | 'invalid'; issues: RetirementIssue[]; raw?: unknown }
export interface OfferRetirement { schemaVersion: 1; contracts: MatchingContract[]; review: RetirementReview }
export interface PlannerRetirementData {
  inputs: Record<string, ToolInputs>
  retirementSchemaVersion: 1
  sharedTaxProfile: SharedTaxProfile
  sharedTaxReview: RetirementReview
  salaryRetirementScenario: RetirementScenario | null
  salaryRetirementReview: RetirementReview
  importedSalaryBaseline: RetirementScenario | null
}
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const money = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0
const issue = (message: string): RetirementIssue => ({ code: 'invalid-saved-retirement', message })
const ready = (): RetirementReview => ({ status: 'ready', issues: [] })
export function reviewSalaryScenario(value: unknown): RetirementReview {
  if (value === null) return ready()
  const raw = record(value)
  const issues: RetirementIssue[] = []
  if (!money(raw.cashEmploymentIncome) || !money(raw.personalRrsp) || !money(raw.personalFhsa) || raw.taxYear !== 2026 || typeof raw.includePersonalDeductions !== 'boolean') issues.push(issue('Saved salary and personal contribution inputs need review.'))
  if (!Array.isArray(raw.workplacePlans)) issues.push(issue('Saved workplace rows need review.'))
  else {
    const ids = new Set<string>()
    for (const plan of raw.workplacePlans) {
      issues.push(...validateWorkplacePlan(plan))
      const id = record(plan).id as string
      if (ids.has(id)) issues.push({ ...issue('Duplicate retirement row identifier.'), planId: id })
      ids.add(id)
    }
  }
  return issues.length ? { status: 'invalid', issues, raw: value } : ready()
}
export function reviewTaxProfile(value: unknown): RetirementReview {
  const raw = record(value)
  const issues: RetirementIssue[] = []
  if (!['ON','QC','BC','AB','MB','SK','NB','NS','PE','NL','YT','NT','NU'].includes(raw.province as string)) issues.push(issue('Province needs review.'))
  for (const field of ['rrspDeductionLimit', 'rrspContributionRoom']) {
    const capacity = record(raw[field])
    if (!['unknown','known','legacy'].includes(capacity.state as string) || (capacity.state !== 'unknown' && (typeof capacity.value !== 'number' || !Number.isFinite(capacity.value) || (field === 'rrspDeductionLimit' && capacity.value < 0))) || (capacity.sourceYear !== undefined && (!Number.isInteger(capacity.sourceYear) || Number(capacity.sourceYear) < 1900))) issues.push(issue(`${field} needs review.`))
  }
  return issues.length ? { status: 'invalid', issues, raw: value } : ready()
}
export function normalizePlannerState(value: unknown): PlannerRetirementData {
  const raw = record(value)
  const inputs = { ...record(raw.inputs) } as Record<string, ToolInputs>
  const legacy = inputs['salary-tax'] ?? inputs['income-tax'] ?? inputs['take-home-pay']
  if (!inputs['salary-tax'] && legacy) inputs['salary-tax'] = { ...legacy, income: legacy.income ?? legacy.gross ?? 100000 }
  const saved = inputs['salary-tax']
  const profile = (raw.sharedTaxProfile ?? { ...createSharedTaxProfile(), province: saved?.province ?? 'ON', rrspDeductionLimit: typeof saved?.rrspRoom === 'number' && saved.rrspRoom > 0 ? { state: 'legacy', value: saved.rrspRoom } : { state: 'unknown' } }) as SharedTaxProfile
  const scenario = (raw.retirementSchemaVersion === 1 || raw.salaryRetirementScenario !== undefined
    ? raw.salaryRetirementScenario ?? null
    : saved ? { ...createRetirementScenario(), cashEmploymentIncome: saved.income ?? 100000, personalRrsp: saved.rrsp ?? 0, personalFhsa: saved.fhsa ?? 0 } : null) as RetirementScenario | null
  return { ...raw, inputs, retirementSchemaVersion: 1, sharedTaxProfile: profile, sharedTaxReview: reviewTaxProfile(profile), salaryRetirementScenario: scenario, salaryRetirementReview: reviewSalaryScenario(scenario), importedSalaryBaseline: (raw.importedSalaryBaseline ?? null) as RetirementScenario | null }
}
export function normalizeOfferRetirement(pkg: unknown): CompensationPackage & { retirement: OfferRetirement } {
  const raw = record(pkg)
  const typed = record(raw.retirement)
  let retirement: OfferRetirement
  if (typed.schemaVersion === 1) {
    const savedReview = record(typed.review)
    const metadataValid = ['ready', 'legacy', 'invalid'].includes(savedReview.status as string)
      && Array.isArray(savedReview.issues)
      && savedReview.issues.every(entry => {
        const savedIssue = record(entry)
        return typeof savedIssue.code === 'string' && savedIssue.code.length > 0
          && typeof savedIssue.message === 'string'
          && (savedIssue.planId === undefined || typeof savedIssue.planId === 'string')
      })
    const markers = metadataValid ? (savedReview.issues as RetirementIssue[]).filter(entry =>
      ['legacy-retirement', 'invalid-retirement-schema', 'invalid-retirement-review'].includes(entry.code)) : []
    const issues: RetirementIssue[] = [...markers]
    if (!metadataValid) issues.push({ code: 'invalid-retirement-review', message: 'Saved retirement review metadata needs review.' })
    if (!Array.isArray(typed.contracts)) issues.push(issue('Retirement contracts need review.'))
    else {
      const ids = new Set<string>()
      for (const contract of typed.contracts) {
        issues.push(...resolveMatchingPlan(contract, { baseSalary: 0, cashBonus: 0 }).issues)
        const id = record(record(contract).plan).id as string
        if (ids.has(id)) issues.push({ ...issue('Duplicate retirement contract identifier.'), planId: id })
        ids.add(id)
      }
    }
    // Saved reports never certify valid contracts. Only well-shaped unresolved
    // legacy metadata remains legacy; every other retained review marker blocks precision.
    const legacy = metadataValid && savedReview.status === 'legacy'
      && issues.every(entry => entry.code === 'legacy-retirement')
    if (legacy && !issues.length) issues.push({ code: 'legacy-retirement', message: 'Retirement Details Need Review.' })
    const status = legacy ? 'legacy' : issues.length ? 'invalid' : 'ready'
    retirement = { ...typed, schemaVersion: 1, contracts: typed.contracts as MatchingContract[],
      review: status === 'ready' ? ready() : { status, issues,
        raw: savedReview.raw ?? (!metadataValid ? typed.review ?? typed : typed.contracts ?? typed) } }
  } else if (raw.retirement !== undefined) {
    retirement = normalizeOfferRetirement({ ...raw, retirement: { schemaVersion: 1, contracts: typed.contracts, review: { status: 'invalid', issues: [{ code: 'invalid-retirement-schema', message: 'Saved retirement schema needs review.' }], raw: raw.retirement } } }).retirement
  } else if ((raw.rrspMatchPercent ?? 0) !== 0 || (raw.rrspMatchCap ?? 0) !== 0) {
    const valid = money(raw.rrspMatchPercent ?? 0) && Number(raw.rrspMatchPercent ?? 0) <= 100 && money(raw.rrspMatchCap ?? 0)
    retirement = { schemaVersion: 1, contracts: [], review: { status: valid ? 'legacy' : 'invalid', issues: [{ code: 'legacy-retirement', message: 'Retirement Details Need Review.' }], raw: { rrspMatchPercent: raw.rrspMatchPercent, rrspMatchCap: raw.rrspMatchCap } } }
  } else retirement = { schemaVersion: 1, contracts: [], review: ready() }
  return { ...raw, retirement } as CompensationPackage & { retirement: OfferRetirement }
}
export function normalizeCompensationState(value: unknown) {
  const raw = record(value)
  return { ...raw, primaryPackage: normalizeOfferRetirement(raw.primaryPackage), comparePackage: raw.comparePackage == null ? null : normalizeOfferRetirement(raw.comparePackage), includePersonalDeductions: raw.includePersonalDeductions === true }
}
/** Shared by file restore, undo and Drive pull. No calculator engine is imported. */
export function normalizeRetirementStorage(key: string, value: unknown): unknown {
  const raw = record(value)
  if (!raw.state || (key !== STORAGE_KEYS.planner && key !== STORAGE_KEYS.compensation)) return value
  return { ...raw, version: 2, state: key === STORAGE_KEYS.planner ? normalizePlannerState(raw.state) : normalizeCompensationState(raw.state) }
}


/** Rewrite normalized ordinary hydration too, including entries already marked version 2. */
export function persistNormalizedRetirementStorage(key: string): void {
  const saved = localStorage.getItem(key)
  if (!saved) return
  const normalized = JSON.stringify(normalizeRetirementStorage(key, JSON.parse(saved)))
  if (normalized !== saved) localStorage.setItem(key, normalized)
}
