export const BACKUP_VERSION = 2

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
  'ledger-analyses',
  'ledger-portfolio',
  'ledger-dashboard-layout',
  'ledger-wheel',
]

export interface BackupMeta {
  deviceId: string
  deviceName: string
  revision: number
  baseRevision: number
}

export interface BackupEnvelope {
  version: number
  exportedAt: string
  app: 'ledger'
  data: Record<string, unknown>
  // v2 sync metadata. Absent on manually exported files and on v1 backups.
  deviceId?: string
  deviceName?: string
  revision?: number
  baseRevision?: number
}

function assertValidEnvelope(env: BackupEnvelope | null | undefined): asserts env is BackupEnvelope {
  if (!env || env.app !== 'ledger' || typeof env.version !== 'number' || env.version > BACKUP_VERSION) {
    throw new Error('Invalid Ledger backup file')
  }
}

export function buildBackup(meta?: BackupMeta): BackupEnvelope {
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
  const env: BackupEnvelope = { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), app: 'ledger', data }
  if (meta) {
    env.deviceId = meta.deviceId
    env.deviceName = meta.deviceName
    env.revision = meta.revision
    env.baseRevision = meta.baseRevision
  }
  return env
}

export function restoreBackup(envelope: BackupEnvelope): void {
  assertValidEnvelope(envelope)
  // Serialise every value before touching localStorage so a bad value cannot
  // leave storage half-written.
  const writes: Array<[string, string]> = Object.entries(envelope.data ?? {})
    .map(([key, value]) => [key, JSON.stringify(value)] as [string, string])
  for (const [key, serialised] of writes) {
    localStorage.setItem(key, serialised)
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
