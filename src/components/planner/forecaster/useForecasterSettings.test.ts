import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { useForecasterSettings } from './useForecasterSettings'
import { usePlannerStore } from '../../../store/usePlannerStore'
import { createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from '../../../utils/finance/retirementTypes'
import { retirementMarginalBreakdown } from '../../../utils/finance/retirementEstimate'
import { useCompensationStore } from '../../../store/useCompensationStore'

vi.mock('../../../hooks/useCompensationDisplay', () => ({ useCompensationDisplay: () => ({ rawPkg: useCompensationStore.getState().primaryPackage, retirementOptions: { timeMode: 'next-1-year', fx: { stockCurrency: 'USD', cadPerStockUnit: null }, profile: usePlannerStore.getState().sharedTaxProfile, personalRrsp: 30000, personalFhsa: 8000, includePersonalDeductions: true } }) }))
const original = useCompensationStore.getState().primaryPackage
const plannerOriginal = usePlannerStore.getState()
afterEach(() => { cleanup(); usePlannerStore.setState(plannerOriginal); useCompensationStore.setState({ primaryPackage: original }) })

describe('Forecaster complete baseline integration', () => {
  it('uses the typed saved baseline and leaves manual savings and events unchanged', () => {
    const scenario = { ...createRetirementScenario(), cashEmploymentIncome: 90000, personalRrsp: 25000 }
    const profile = createSharedTaxProfile()
    usePlannerStore.setState({ salaryRetirementScenario: scenario, sharedTaxProfile: profile, inputs: { forecaster: { autoSavings: false, manualSavings: 777, eventsJson: '[{"id":"x","label":"Gift","yearsFromNow":1,"amount":1000}]' }, 'salary-tax': { income: 200000 } } })
    const { result } = renderHook(() => useForecasterSettings())
    expect(result.current.compTax.ratePct).toBeCloseTo(retirementMarginalBreakdown(scenario, profile).branches[0].total)
    expect(result.current.compTax.source).toBe('Saved Salary & Tax')
    expect(result.current.resolved.monthlySavings).toBe(777)
    expect(result.current.events[0].amount).toBe(1000)
  })
  it('withholds automatic events with an invalid baseline, then restores manually taxed CAD bonus', () => {
    useCompensationStore.setState({ primaryPackage: { ...original, baseSalary: 120000, cashBonusPercent: 10, rsuGrants: [] } })
    usePlannerStore.setState({ salaryRetirementScenario: { ...createRetirementScenario(), cashEmploymentIncome: -1 }, inputs: {} })
    const auto = renderHook(() => useForecasterSettings())
    expect(auto.result.current.compTax.ratePct).toBeNull()
    expect(auto.result.current.autoFeed.compLumps).toEqual([])
    auto.unmount()
    usePlannerStore.getState().setInput('forecaster', 'compTaxAuto', false)
    const manual = renderHook(() => useForecasterSettings())
    expect(manual.result.current.autoFeed.compLumps.find(lump => lump.label === 'Bonus')?.amount).toBe(6000)
  })
})


it('withholds above-budget automatic compensation events then honors manual and tax-off rates', () => {
 useCompensationStore.setState({ primaryPackage: { ...original, baseSalary: 120000, cashBonusPercent: 10, rsuGrants: [] } })
 const savedScenario = { ...createRetirementScenario(), cashEmploymentIncome: 50000, workplacePlans: Array.from({ length: 17 }, (_, i) => ({ ...createWorkplacePlan('group-rrsp', `many-${i}`), employerContribution: 100 })) }
 usePlannerStore.setState({ salaryRetirementScenario: savedScenario, inputs: { forecaster: { autoSavings: false, manualSavings: 777 } } })
 const auto = renderHook(() => useForecasterSettings())
 expect(auto.result.current.compTax.ratePct).toBeNull()
 expect(auto.result.current.autoFeed.compLumps).toEqual([])
 expect(auto.result.current.resolved.monthlySavings).toBe(777)
 auto.unmount()
 usePlannerStore.getState().setInput('forecaster', 'compTaxAuto', false)
 const manual = renderHook(() => useForecasterSettings())
 expect(manual.result.current.autoFeed.compLumps.find(l => l.label === 'Bonus')?.amount).toBe(6000)
 manual.unmount()
 usePlannerStore.getState().setInput('forecaster', 'compTaxEnabled', false)
 const taxOff = renderHook(() => useForecasterSettings())
 expect(taxOff.result.current.autoFeed.compLumps.find(l => l.label === 'Bonus')?.amount).toBe(12000)
 expect(taxOff.result.current.autoFeed.compLumps.some(l => /retirement|RRSP|pension/i.test(l.label ?? ''))).toBe(false)
})
