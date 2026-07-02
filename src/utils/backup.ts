export const BACKUP_VERSION = 1

// Registry of every persisted LocalStorage key. Append new keys here when
// later phases add persisted stores (Investments, Projections/Planner, etc.).
export const BACKUP_KEYS: string[] = [
  'accounts-storage',
  'ledger-budget',
  'ledger-compensation',
  'financial-dashboard-theme',
  'ledger-triage',
  'ledger-market-data',
  'ledger-planner',
]

export interface BackupEnvelope {
  version: number
  exportedAt: string
  app: 'ledger'
  data: Record<string, unknown>
}

function assertValidEnvelope(env: BackupEnvelope | null | undefined): asserts env is BackupEnvelope {
  if (!env || env.app !== 'ledger' || typeof env.version !== 'number' || env.version > BACKUP_VERSION) {
    throw new Error('Invalid Ledger backup file')
  }
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
  assertValidEnvelope(envelope)
  for (const [key, value] of Object.entries(envelope.data ?? {})) {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export function backupToBlob(): Blob {
  return new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' })
}

export function backupFilename(): string {
  return `ledger-backup-${new Date().toISOString().slice(0, 10)}.json`
}

export function parseBackupText(text: string): BackupEnvelope {
  let obj: unknown
  try {
    obj = JSON.parse(text)
  } catch {
    throw new Error('Invalid Ledger backup file')
  }
  const env = obj as BackupEnvelope
  assertValidEnvelope(env)
  return env
}
