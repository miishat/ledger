import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useForecasterSettings } from './useForecasterSettings'
import { useCompensationStore, defaultPrimaryPackage } from '../../../store/useCompensationStore'
import { usePlannerStore } from '../../../store/usePlannerStore'
import { useMarketDataStore } from '../../../store/useMarketDataStore'
import { __setProviders, __resetProviders } from '../../../services/marketData/marketDataService'
import { __resetMinInterval } from '../../../services/marketData/throttle'
import { createSharedTaxProfile, createMatchingContract, createWorkplacePlan } from '../../../utils/finance/retirementTypes'

afterEach(() => { cleanup(); __resetProviders(); vi.useRealTimers() })
it('keeps real CAD forecast cash events unchanged by display toggles and employer retirement funding', async () => {
 vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-11T12:00:00Z')); __resetMinInterval()
 __setProviders({ fetchFxRate: async () => ({ from: 'USD', to: 'CAD', rate: 1.35, date: '2026-10-11', asOf: '2026-10-11T12:00:00Z' }) })
 useMarketDataStore.setState({ quotes: {}, historical: {}, fx: {}, overrides: {} })
 const contract = createMatchingContract(createWorkplacePlan('dc-rpp')); contract.employee.value = 5000; contract.unconditionalEmployer.value = 9000
 useCompensationStore.setState({ primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100000, cashBonusPercent: 10, rsuGrants: [{ id: 'g', grantName: 'Annual', grantShares: 120, grantPrice: 100, grantStartDate: '2026-01-01', vestingSchedule: { preset: 'custom', totalVestMonths: 12, cliffMonths: 0, frequency: 'monthly' } }], retirement: { schemaVersion: 1, contracts: [contract], review: { status: 'ready', issues: [] } } }, useCadConversion: false, showAfterTax: false, includePersonalDeductions: false, timeMode: 'current-year', comparePackage: null })
 usePlannerStore.setState({ inputs: { forecaster: { compTaxAuto: false, compTaxManualPct: 25 } }, salaryRetirementScenario: null, sharedTaxProfile: createSharedTaxProfile() })
 const { result } = renderHook(() => useForecasterSettings())
 await waitFor(() => expect(result.current.autoFeed.compLumps.some(l => l.label?.startsWith('RSU'))).toBe(true))
 const events = structuredClone(result.current.autoFeed.compLumps)
 expect(events.find(l => l.label === 'Bonus')?.amount).toBe(7500)
 expect(events.some(l => /retirement|rrsp|rpp/i.test(l.label ?? ''))).toBe(false)
 act(() => { useCompensationStore.getState().toggleCadConversion(); useCompensationStore.getState().toggleAfterTax() })
 expect(result.current.autoFeed.compLumps).toEqual(events)
 act(() => useCompensationStore.getState().setPrimaryPackage({ retirement: { schemaVersion: 1, contracts: [{ ...contract, unconditionalEmployer: { mode: 'dollars', value: 19000 } }], review: { status: 'ready', issues: [] } } }))
 expect(result.current.autoFeed.compLumps).toEqual(events)
})

