import { useCompensationStore, defaultPrimaryPackage, calcAnnualRRSP } from './useCompensationStore'

const initialState = useCompensationStore.getState()

beforeEach(() => {
  localStorage.clear()
  useCompensationStore.setState(initialState, true)
})

describe('useCompensationStore CAD conversion toggle', () => {
  it('defaults useCadConversion to false', () => {
    expect(useCompensationStore.getState().useCadConversion).toBe(false)
  })

  it('toggleCadConversion flips the flag', () => {
    useCompensationStore.getState().toggleCadConversion()
    expect(useCompensationStore.getState().useCadConversion).toBe(true)
    useCompensationStore.getState().toggleCadConversion()
    expect(useCompensationStore.getState().useCadConversion).toBe(false)
  })

  it('persists to the existing ledger-compensation LocalStorage key', () => {
    useCompensationStore.getState().toggleCadConversion()
    const raw = localStorage.getItem('ledger-compensation')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string).state.useCadConversion).toBe(true)
  })
})

import { createMatchingContract, createWorkplacePlan } from '../utils/finance/retirementTypes'
describe('independent retirement offers', () => {
  it('saves independent contracts, toggle and resets one offer only', () => {
    const state = useCompensationStore.getState()
    state.setComparePackage({ ...state.primaryPackage, id: 'compare' })
    state.setRetirementContracts('primary', [createMatchingContract(createWorkplacePlan('dc-rpp', 'primary-row'))])
    state.setRetirementContracts('compare', [createMatchingContract(createWorkplacePlan('prpp', 'compare-row'))])
    state.setIncludePersonalDeductions(true)
    expect(useCompensationStore.getState().primaryPackage.retirement?.contracts[0].plan.id).toBe('primary-row')
    expect(useCompensationStore.getState().comparePackage?.retirement?.contracts[0].plan.id).toBe('compare-row')
    state.resetOffer('primary')
    expect(useCompensationStore.getState().primaryPackage.retirement?.contracts).toEqual([])
    expect(useCompensationStore.getState().comparePackage?.retirement?.contracts[0].plan.id).toBe('compare-row')
    expect(useCompensationStore.getState().includePersonalDeductions).toBe(true)
  })
})

it('starts a fresh device with the complete default compensation package', () => {
  expect(initialState.primaryPackage).toMatchObject(defaultPrimaryPackage)
  expect(initialState.primaryPackage.rsuGrants).toEqual([])
})


it('does not revive legacy funding for an invalid reviewed typed contract', () => {
  const contract = { ...createMatchingContract(), employee: { mode: 'percent' as const, value: 101 } }
  expect(calcAnnualRRSP({ ...defaultPrimaryPackage, baseSalary: 100000, rrspMatchPercent: 5, rrspMatchCap: 4000, retirement: { schemaVersion: 1, contracts: [contract], review: { status: 'ready', issues: [] } } })).toBe(0)
})
