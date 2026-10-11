import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from './storageKeys'
import { persistNormalizedRetirementStorage, normalizePlannerState, reviewSalaryScenario, reviewTaxProfile, type PlannerRetirementData } from './retirementPersistence'
import { createRetirementScenario, createSharedTaxProfile } from '../utils/finance/retirementTypes'
import type { RetirementScenario, SharedTaxProfile } from '../utils/finance/retirementTypes'

export type PlannerInputValue = number | string | boolean
export type ToolInputs = Record<string, PlannerInputValue>

interface PlannerState extends PlannerRetirementData {
  setInput: (tool: string, field: string, value: PlannerInputValue) => void
  resetTool: (tool: string) => void
  setSharedTaxProfile: (updates: Partial<SharedTaxProfile>) => void
  updateSalaryRetirementScenario: (updates: Partial<RetirementScenario>) => void
  importSalaryRetirementScenario: (snapshot: RetirementScenario) => void
  resetSalaryRetirementScenario: () => void
  clearCraLimits: () => void
}
const calculationKey = (scenario: RetirementScenario) => JSON.stringify([scenario.cashEmploymentIncome, scenario.workplacePlans, scenario.personalRrsp, scenario.personalFhsa, scenario.includePersonalDeductions, scenario.taxYear])
function scenarioUpdate(state: PlannerState, scenario: RetirementScenario) {
  if (scenario.provenance?.source === 'compensation' && state.importedSalaryBaseline) scenario = { ...scenario, provenance: { ...scenario.provenance, editedAfterTransfer: calculationKey(scenario) !== calculationKey(state.importedSalaryBaseline) } }
  return { salaryRetirementScenario: scenario, salaryRetirementReview: reviewSalaryScenario(scenario), inputs: { ...state.inputs, 'salary-tax': { ...state.inputs['salary-tax'], income: scenario.cashEmploymentIncome, rrsp: scenario.personalRrsp, fhsa: scenario.personalFhsa, province: state.sharedTaxProfile.province } } }
}
export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      ...normalizePlannerState({ inputs: {} }),
      setSharedTaxProfile: updates => set(state => {
        const profile = { ...state.sharedTaxProfile, ...structuredClone(updates) }
        return { sharedTaxProfile: profile, sharedTaxReview: reviewTaxProfile(profile), inputs: { ...state.inputs, 'salary-tax': { ...state.inputs['salary-tax'], province: profile.province, rrspRoom: profile.rrspDeductionLimit.value ?? 0 } } }
      }),
      clearCraLimits: () => set(state => ({ sharedTaxProfile: createSharedTaxProfile(state.sharedTaxProfile.province), sharedTaxReview: reviewTaxProfile(createSharedTaxProfile(state.sharedTaxProfile.province)), inputs: { ...state.inputs, 'salary-tax': { ...state.inputs['salary-tax'], rrspRoom: 0 } } })),
      updateSalaryRetirementScenario: updates => set(state => scenarioUpdate(state, { ...(state.salaryRetirementScenario ?? createRetirementScenario()), ...structuredClone(updates) })),
      importSalaryRetirementScenario: snapshot => set(state => {
        const personal = state.salaryRetirementScenario
        const scenario = { ...structuredClone(snapshot), personalRrsp: personal?.personalRrsp ?? Number(state.inputs['salary-tax']?.rrsp ?? 0), personalFhsa: personal?.personalFhsa ?? Number(state.inputs['salary-tax']?.fhsa ?? 0) }
        if (scenario.provenance) scenario.provenance = { ...scenario.provenance, editedAfterTransfer: false }
        return { ...scenarioUpdate({ ...state, importedSalaryBaseline: null }, scenario), importedSalaryBaseline: structuredClone(scenario) }
      }),
      resetSalaryRetirementScenario: () => set(state => ({ ...scenarioUpdate({ ...state, importedSalaryBaseline: null }, createRetirementScenario()), importedSalaryBaseline: null })),
      setInput: (tool, field, value) => set(state => {
        const inputs = { ...state.inputs, [tool]: { ...state.inputs[tool], [field]: value } }
        if (tool !== 'salary-tax') return { inputs }
        const scenario = { ...(state.salaryRetirementScenario ?? { ...createRetirementScenario(), cashEmploymentIncome: Number(inputs[tool].income ?? 100000) }) }
        if (field === 'income') scenario.cashEmploymentIncome = value as number
        if (field === 'rrsp') scenario.personalRrsp = value as number
        if (field === 'fhsa') scenario.personalFhsa = value as number
        const profile = { ...state.sharedTaxProfile }
        if (field === 'province') profile.province = value as SharedTaxProfile['province']
        if (field === 'rrspRoom') profile.rrspDeductionLimit = typeof value === 'number' && value > 0 ? { state: 'legacy', value } : { state: 'unknown' }
        return { ...scenarioUpdate({ ...state, inputs, sharedTaxProfile: profile }, scenario), sharedTaxProfile: profile, sharedTaxReview: reviewTaxProfile(profile) }
      }),
      resetTool: tool => set(state => {
        const inputs = { ...state.inputs }
        delete inputs[tool]
        return tool === 'salary-tax' ? { inputs, salaryRetirementScenario: null, salaryRetirementReview: reviewSalaryScenario(null), importedSalaryBaseline: null } : { inputs }
      }),
    }),
    {
      name: STORAGE_KEYS.planner,
      version: 2,
      onRehydrateStorage: () => (_state, error) => { if (!error) persistNormalizedRetirementStorage(STORAGE_KEYS.planner) },
      migrate: persisted => normalizePlannerState(persisted),
      merge: (persisted, current) => ({ ...current, ...normalizePlannerState(persisted) }),
    }
  )
)
/** Saved inputs for a tool, merged over defaults. Components write via setInput. */
export function useToolInputs<T extends ToolInputs>(tool: string, defaults: T): T {
  const saved = usePlannerStore(s => s.inputs[tool])
  return { ...defaults, ...saved } as T
}
