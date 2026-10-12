import type { Transaction } from '../../types/budget'
import type { ImportDay, ImportRecord, ImportReport } from '../../types/importHistory'
import type { TriageTransaction } from '../../types/triage'

// Preserve punctuation and non-Latin names. Identity is based on bank originals,
// never on an editable budget description or the user's shared-bill amount.
const descriptionKey = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase()
const amountKey = (amount: number) => Math.round(amount * 100)
export const importRowKey = (tx: TriageTransaction): string => JSON.stringify([
  tx.date, amountKey(tx.amount), tx.type, descriptionKey(tx.description),
])

const sameAmount = (a: TriageTransaction, b: TriageTransaction) =>
  amountKey(a.amount) === amountKey(b.amount) && a.type === b.type

function possibleMatch(a: TriageTransaction, b: TriageTransaction): boolean {
  if (!sameAmount(a, b)) return false
  if (a.date === b.date) return true
  const distance = Math.abs(Date.parse(a.date) - Date.parse(b.date))
  return distance <= 3 * 86_400_000 && descriptionKey(a.description) === descriptionKey(b.description)
}

export function matchImport(
  incoming: TriageTransaction[],
  sourceId: string,
  existingRecords: Record<string, ImportRecord>,
  existingDays: ImportDay[],
  legacy: Transaction[],
): { pending: TriageTransaction[]; records: Record<string, ImportRecord>; days: ImportDay[]; report: ImportReport } {
  const records = { ...existingRecords }
  const days = [...existingDays]
  const pending: TriageTransaction[] = []
  const report: ImportReport = { addedIds: [], skippedIds: [], changedDays: [] }
  const known = Object.values(existingRecords).filter(r => r.sourceId === sourceId && r.decision !== 'duplicate')
  const grouped = new Map<string, TriageTransaction[]>()
  for (const tx of incoming) {
    const group = grouped.get(tx.date) ?? []
    group.push(tx)
    grouped.set(tx.date, group)
  }

  for (const [date, group] of grouped) {
    const sorted = [...group].sort((a, b) => importRowKey(a).localeCompare(importRowKey(b)))
    const signature = JSON.stringify(sorted.map(importRowKey))
    const snapshot = days.find(d => d.sourceId === sourceId && d.date === date && d.signature === signature &&
      d.recordIds.every(id => records[id]))
    if (snapshot) {
      report.skippedIds.push(...snapshot.recordIds)
      continue
    }

    const sameDay = known.filter(r => r.original.date === date)
    const available = new Map<string, ImportRecord[]>()
    for (const record of sameDay) {
      const key = importRowKey(record.original)
      available.set(key, [...(available.get(key) ?? []), record])
    }
    const recordIds: string[] = []
    for (const tx of sorted) {
      const match = available.get(importRowKey(tx))?.shift()
      if (match) {
        recordIds.push(match.id)
        report.skippedIds.push(match.id)
        continue
      }
      const possible = known.find(r => possibleMatch(tx, r.original))
      const old = !possible ? legacy.find(t => possibleMatch(tx, { ...t, amount: t.shared?.totalAmount ?? t.amount })) : undefined
      const original: TriageTransaction = {
        id: tx.id, date: tx.date, amount: tx.amount, description: tx.description, type: tx.type,
        categoryId: tx.categoryId, flag: tx.flag, bankSource: tx.bankSource,
        originalRowData: tx.originalRowData ? { ...tx.originalRowData } : undefined,
      }
      records[tx.id] = { id: tx.id, sourceId, original, decision: 'pending' }
      pending.push({ ...tx, importRecordId: tx.id, importSourceId: sourceId, duplicate: possible || old ? 'possible' : undefined,
        duplicateRecordId: possible?.id, duplicateTransactionId: old?.id })
      recordIds.push(tx.id)
      report.addedIds.push(tx.id)
    }
    const missingCount = [...available.values()].reduce((sum, rows) => sum + rows.length, 0)
    if (missingCount) report.changedDays.push({ sourceId, date, missingCount })
    days.push({ sourceId, date, signature, recordIds })
  }
  return { pending, records, days, report }
}
