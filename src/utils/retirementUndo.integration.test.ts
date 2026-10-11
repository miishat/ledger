import { buildBackup, restoreBackup } from './backup'
import { usePlannerStore } from '../store/usePlannerStore'
import { useCompensationStore, defaultPrimaryPackage } from '../store/useCompensationStore'
import { useUndoStore } from '../store/useUndoStore'
import { createMatchingContract, createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from './finance/retirementTypes'

it('A21 existing Undo callback restores complete typed retirement backup through normal rehydrate boundaries', async () => {
 localStorage.clear()
 const contract = createMatchingContract(createWorkplacePlan('db-rpp'))
 contract.employee.value = 8655.32
 useCompensationStore.getState().setPrimaryPackage({ ...defaultPrimaryPackage, retirement: { schemaVersion: 1, contracts: [contract], review: { status: 'ready', issues: [] } } })
 useCompensationStore.getState().setComparePackage({ ...defaultPrimaryPackage, id: 'compare', retirement: undefined, rrspMatchPercent: 5, rrspMatchCap: 4000 })
 useCompensationStore.getState().setIncludePersonalDeductions(true)
 usePlannerStore.getState().setSharedTaxProfile({ ...createSharedTaxProfile('QC'), rrspDeductionLimit: { state: 'known', value: 0, sourceYear: 2026 }, rrspContributionRoom: { state: 'known', value: -123.456, sourceYear: 2025 } })
 usePlannerStore.getState().updateSalaryRetirementScenario({ ...createRetirementScenario(), cashEmploymentIncome: 50000.123, personalRrsp: 1111.123, workplacePlans: [contract.plan] })
 const snapshot = buildBackup()
 useUndoStore.getState().offerUndo('Restore saved retirement data', () => restoreBackup(snapshot))
 useCompensationStore.getState().resetOffer('primary')
 useCompensationStore.getState().resetOffer('compare')
 usePlannerStore.getState().resetSalaryRetirementScenario()
 usePlannerStore.getState().clearCraLimits()
 expect(buildBackup().data).not.toEqual(snapshot.data)
 useUndoStore.getState().runUndo()
 await useCompensationStore.persist.rehydrate(); await usePlannerStore.persist.rehydrate()
 expect(useUndoStore.getState().pending).toBeNull()
 expect(buildBackup().data).toEqual(snapshot.data)
 expect(useCompensationStore.getState().comparePackage?.retirement?.review.status).toBe('legacy')
 expect(useCompensationStore.getState().primaryPackage.retirement?.contracts[0].employee.value).toBe(8655.32)
 expect(usePlannerStore.getState().sharedTaxProfile.rrspContributionRoom).toEqual({ state: 'known', value: -123.456, sourceYear: 2025 })
 localStorage.clear()
})
