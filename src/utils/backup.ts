export const BACKUP_VERSION = 1

// Registry of every persisted LocalStorage key. Append new keys here when
// later phases add persisted stores (Investments, Projections/Planner, etc.).
export const BACKUP_KEYS: string[] = [
  'accounts-storage',
  'ledger-budget',
  'ledger-compensation',
  'financial-dashboard-theme',
  'ledger-triage',
]

export interface BackupEnvelope {
  version: number
  exportedAt: string
  app: 'ledger'
  data: Record<string, unknown>
}

export function buildBackup(): BackupEnvelope {
  const data: Record<string, unknown> = {}
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw === null) continue
    try {
      data[key] = JSON.parse(raw)
    } catch {
      data[key] = raw
    }
  }
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), app: 'ledger', data }
}

export function restoreBackup(envelope: BackupEnvelope): void {
  if (!envelope || envelope.app !== 'ledger' || typeof envelope.version !== 'number' || envelope.version > BACKUP_VERSION) {
    throw new Error('Invalid Ledger backup file')
  }
  for (const [key, value] of Object.entries(envelope.data ?? {})) {
    localStorage.setItem(key, JSON.stringify(value))
  }
}
