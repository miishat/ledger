import { useTriageStore } from '../../store/useTriageStore'
import { useUndoStore } from '../../store/useUndoStore'

/** Capture before the action. Install the returned offer AFTER the store action
 * (store actions invalidate the previous offer). Only named IDs are restored.
 * New IDs can be supplied after save, so undo deletes newly created rules. */
export function captureTriageUndo(scope: { pendingIds?: string[]; recordIds?: string[]; ruleIds?: string[] }) {
  const state = useTriageStore.getState()
  const pending = Object.fromEntries((scope.pendingIds ?? []).map(id => [id, state.pendingTransactions[id]]))
  const records = Object.fromEntries((scope.recordIds ?? []).map(id => [id, state.importRecords[id]]))
  const rules = Object.fromEntries((scope.ruleIds ?? []).map(id => [id, state.exclusionRules[id]]))
  return (label: string, newRuleIds: string[] = []) => {
    useUndoStore.getState().offerUndo(label, () => useTriageStore.setState(current => {
      const pendingTransactions = { ...current.pendingTransactions }
      const importRecords = { ...current.importRecords }
      const exclusionRules = { ...current.exclusionRules }
      for (const [id, value] of Object.entries(pending)) { if (value) pendingTransactions[id] = value; else delete pendingTransactions[id] }
      for (const [id, value] of Object.entries(records)) { if (value) importRecords[id] = value; else delete importRecords[id] }
      for (const id of newRuleIds) delete exclusionRules[id]
      for (const [id, value] of Object.entries(rules)) { if (value) exclusionRules[id] = value; else delete exclusionRules[id] }
      return { pendingTransactions, importRecords, exclusionRules }
    }))
  }
}
