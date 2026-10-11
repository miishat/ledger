import { usePlannerStore } from './usePlannerStore'

const initialState = usePlannerStore.getState()
beforeEach(() => {
  localStorage.clear()
  usePlannerStore.setState(initialState, true)
})

describe('usePlannerStore', () => {
  it('setInput stores a value namespaced by tool id', () => {
    usePlannerStore.getState().setInput('compound-interest', 'principal', 5000)
    expect(usePlannerStore.getState().inputs['compound-interest'].principal).toBe(5000)
  })

  it('setInput preserves sibling fields and other tools', () => {
    const { setInput } = usePlannerStore.getState()
    setInput('compound-interest', 'principal', 5000)
    setInput('compound-interest', 'years', 10)
    setInput('savings-goal', 'target', 100000)
    const { inputs } = usePlannerStore.getState()
    expect(inputs['compound-interest']).toEqual({ principal: 5000, years: 10 })
    expect(inputs['savings-goal']).toEqual({ target: 100000 })
  })

  it('resetTool clears only that tool', () => {
    const { setInput, resetTool } = usePlannerStore.getState()
    setInput('compound-interest', 'principal', 5000)
    setInput('savings-goal', 'target', 100000)
    resetTool('compound-interest')
    const { inputs } = usePlannerStore.getState()
    expect(inputs['compound-interest']).toBeUndefined()
    expect(inputs['savings-goal']).toEqual({ target: 100000 })
  })

  it('persists under the ledger-planner key', () => {
    usePlannerStore.getState().setInput('compound-interest', 'principal', 5000)
    expect(localStorage.getItem('ledger-planner')).toContain('"principal":5000')
  })
})

import { createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from '../utils/finance/retirementTypes'
describe('typed planner scenario actions', () => {
  it('imports atomically without merging rows, changing personal amounts or limits', () => {
    const state = usePlannerStore.getState()
    state.setInput('salary-tax', 'rrsp', 1234.567)
    state.setInput('salary-tax', 'fhsa', 234.567)
    state.setSharedTaxProfile({ ...createSharedTaxProfile('QC'), rrspContributionRoom: { state: 'known', value: -100, sourceYear: 2026 } })
    state.updateSalaryRetirementScenario({ workplacePlans: [createWorkplacePlan('dc-rpp', 'old')] })
    let changes = 0
    const unsubscribe = usePlannerStore.subscribe(() => changes++)
    state.importSalaryRetirementScenario({ ...createRetirementScenario(), cashEmploymentIncome: 125678.987, workplacePlans: [createWorkplacePlan('group-rrsp', 'new')], includePersonalDeductions: false, provenance: { source: 'compensation', assumptions: ['Equity sold'], sourceBreakdown: { salary: 100000, cashBonus: 10000, realizedEquity: 15000, esppGain: 678.987 } } })
    unsubscribe()
    expect(changes).toBe(1)
    const result = usePlannerStore.getState()
    expect(result.salaryRetirementScenario).toMatchObject({ cashEmploymentIncome: 125678.987, personalRrsp: 1234.567, personalFhsa: 234.567, includePersonalDeductions: false })
    expect(result.salaryRetirementScenario?.workplacePlans.map(row => row.id)).toEqual(['new'])
    expect(result.sharedTaxProfile.province).toBe('QC')
    expect(result.sharedTaxProfile.rrspContributionRoom.value).toBe(-100)
    expect(result.inputs['salary-tax'].income).toBe(125678.987)
  })
  it('marks calculation edits after transfer and clears the flag when reverted', () => {
    const state = usePlannerStore.getState()
    state.importSalaryRetirementScenario({ ...createRetirementScenario(), cashEmploymentIncome: 100000, provenance: { source: 'compensation', assumptions: [] } })
    state.updateSalaryRetirementScenario({ cashEmploymentIncome: 80000 })
    expect(usePlannerStore.getState().salaryRetirementScenario?.provenance?.editedAfterTransfer).toBe(true)
    state.updateSalaryRetirementScenario({ cashEmploymentIncome: 100000 })
    expect(usePlannerStore.getState().salaryRetirementScenario?.provenance?.editedAfterTransfer).toBe(false)
  })
  it('reset retains shared settings and other tools while clear limits is explicit', () => {
    const state = usePlannerStore.getState()
    state.setSharedTaxProfile({ ...createSharedTaxProfile('BC'), rrspDeductionLimit: { state: 'known', value: 0, sourceYear: 2026 } })
    state.setInput('other', 'a', 12)
    state.setInput('salary-tax', 'rrsp', 123)
    state.resetSalaryRetirementScenario()
    expect(usePlannerStore.getState().salaryRetirementScenario).toMatchObject({ personalRrsp: 0, personalFhsa: 0, workplacePlans: [] })
    expect(usePlannerStore.getState().sharedTaxProfile.rrspDeductionLimit.state).toBe('known')
    expect(usePlannerStore.getState().inputs.other.a).toBe(12)
    state.clearCraLimits()
    expect(usePlannerStore.getState().sharedTaxProfile).toEqual(createSharedTaxProfile('BC'))
  })
})

it('normalizes same-version ordinary hydration on disk without losing review state', async () => {
  localStorage.setItem('ledger-planner', JSON.stringify({ version: 2, state: { inputs: { 'salary-tax': { income: 99000, rrsp: 123.456, rrspRoom: 10000 } } } }))
  await usePlannerStore.persist.rehydrate()
  const stored = JSON.parse(localStorage.getItem('ledger-planner')!).state
  expect(stored.retirementSchemaVersion).toBe(1)
  expect(stored.salaryRetirementScenario.personalRrsp).toBe(123.456)
  expect(stored.sharedTaxProfile.rrspDeductionLimit.state).toBe('legacy')
})
