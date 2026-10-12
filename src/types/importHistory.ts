import type { TriageTransaction } from './triage'

export interface ImportSource {
  id: string
  name: string
  bankKey?: string
}

export interface ImportRecord {
  id: string
  sourceId: string
  original: TriageTransaction
  decision: 'pending' | 'accepted' | 'ignored' | 'duplicate'
  matchedRecordId?: string
  matchedTransactionId?: string
}

export interface ImportDay {
  sourceId: string
  date: string
  signature: string
  recordIds: string[]
}

export interface ImportReport {
  addedIds: string[]
  skippedIds: string[]
  changedDays: Array<{ sourceId: string; date: string; missingCount: number }>
}
