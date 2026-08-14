import { describe, it, expect, beforeEach } from 'vitest'
import { buildBackup, restoreBackup, BACKUP_VERSION, type BackupEnvelope, backupToBlob, backupFilename, parseBackupText, BACKUP_KEYS } from './backup'
import { STORAGE_KEYS } from '../store/storageKeys'

describe('backup', () => {
  beforeEach(() => localStorage.clear())

  it('builds an envelope from present keys and skips absent ones', () => {
    localStorage.setItem('ledger-compensation', JSON.stringify({ a: 1 }))
    const env = buildBackup()
    expect(env.app).toBe('ledger')
    expect(env.version).toBe(BACKUP_VERSION)
    expect(env.data['ledger-compensation']).toEqual({ a: 1 })
    expect('ledger-budget' in env.data).toBe(false)
  })

  it('registers the market-data store key', () => {
    expect(BACKUP_KEYS).toContain('ledger-market-data')
  })

  it('registers the planner store key', () => {
    expect(BACKUP_KEYS).toContain('ledger-planner')
  })

  it('registers the analyses store key', () => {
    expect(BACKUP_KEYS).toContain('ledger-analyses')
  })

  it('registers the portfolio store key', () => {
    expect(BACKUP_KEYS).toContain('ledger-portfolio')
  })

  it('registers the dashboard layout key', () => {
    expect(BACKUP_KEYS).toContain('ledger-dashboard-layout')
  })

  it('registers the wheel store key', () => {
    expect(BACKUP_KEYS).toContain('ledger-wheel')
  })

  it('round-trips: restore writes values back as JSON strings', () => {
    const env: BackupEnvelope = {
      version: BACKUP_VERSION, exportedAt: '2026-07-02T00:00:00Z', app: 'ledger',
      data: { 'ledger-budget': { x: 2 } },
    }
    restoreBackup(env)
    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ x: 2 })
  })

  it('rejects a non-Ledger or future-version envelope', () => {
    expect(() => restoreBackup({ app: 'other' } as unknown as BackupEnvelope))
      .toThrow('Invalid Ledger backup file')
    expect(() => restoreBackup({ app: 'ledger', version: BACKUP_VERSION + 1, exportedAt: '', data: {} }))
      .toThrow('Invalid Ledger backup file')
  })
})

describe('backup file io', () => {
  beforeEach(() => localStorage.clear())

  it('backupToBlob produces JSON blob', async () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ x: 2 }))
    const blob = backupToBlob()
    expect(blob.type).toBe('application/json')
    const parsed = JSON.parse(await blob.text())
    expect(parsed.data['ledger-budget']).toEqual({ x: 2 })
  })

  it('backupFilename is date-stamped', () => {
    expect(backupFilename()).toMatch(/^ledger-backup-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('parseBackupText validates and returns the envelope', () => {
    const good = JSON.stringify({ app: 'ledger', version: 1, exportedAt: '', data: {} })
    expect(parseBackupText(good).app).toBe('ledger')
    expect(() => parseBackupText('{not json')).toThrow('Invalid Ledger backup file')
    expect(() => parseBackupText(JSON.stringify({ app: 'nope' }))).toThrow('Invalid Ledger backup file')
  })
})

describe('backup v2 envelope', () => {
  beforeEach(() => localStorage.clear())

  it('is version 2', () => {
    expect(BACKUP_VERSION).toBe(2)
  })

  it('omits sync metadata when no meta is supplied', () => {
    const env = buildBackup()
    expect(env.deviceId).toBeUndefined()
    expect(env.revision).toBeUndefined()
  })

  it('carries sync metadata when meta is supplied', () => {
    const env = buildBackup({ deviceId: 'dev-1', deviceName: 'Desktop', revision: 7, baseRevision: 6 })
    expect(env.deviceId).toBe('dev-1')
    expect(env.deviceName).toBe('Desktop')
    expect(env.revision).toBe(7)
    expect(env.baseRevision).toBe(6)
  })

  it('still accepts a version 1 envelope', () => {
    const v1 = JSON.stringify({ app: 'ledger', version: 1, exportedAt: '', data: { 'ledger-budget': { x: 1 } } })
    const env = parseBackupText(v1)
    expect(env.version).toBe(1)
    restoreBackup(env)
    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ x: 1 })
  })

  it('writes nothing when the envelope is invalid', () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ keep: true }))
    expect(() => restoreBackup({ app: 'ledger', version: 99, exportedAt: '', data: { 'ledger-budget': { x: 9 } } }))
      .toThrow('Invalid Ledger backup file')
    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ keep: true })
  })

  it('rejects a string data field and writes nothing', () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ keep: true }))
    expect(() => restoreBackup({ app: 'ledger', version: BACKUP_VERSION, exportedAt: '', data: 'not an object' as unknown as Record<string, unknown> }))
      .toThrow('Invalid Ledger backup file')
    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ keep: true })
  })

  it('rejects an array data field and writes nothing', () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ keep: true }))
    expect(() => restoreBackup({ app: 'ledger', version: BACKUP_VERSION, exportedAt: '', data: [1, 2, 3] as unknown as Record<string, unknown> }))
      .toThrow('Invalid Ledger backup file')
    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ keep: true })
  })

  it('rejects a null data field and writes nothing', () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ keep: true }))
    expect(() => restoreBackup({ app: 'ledger', version: BACKUP_VERSION, exportedAt: '', data: null as unknown as Record<string, unknown> }))
      .toThrow('Invalid Ledger backup file')
    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ keep: true })
  })

  it('writes only registered keys, leaving unregistered ones untouched', () => {
    // Snapshot files sit in a hand-editable Drive folder and the same code
    // path backs manual Import. A crafted data blob naming ledger-sync
    // must not be able to overwrite this device's sync bookmark.
    localStorage.setItem('ledger-sync', JSON.stringify({ deviceId: 'this-device', lastSyncedRevision: 3 }))
    localStorage.setItem('some-random-key', JSON.stringify({ mine: true }))
    restoreBackup({
      app: 'ledger', version: BACKUP_VERSION, exportedAt: '',
      data: {
        'ledger-budget': { x: 1 },
        'ledger-sync': { deviceId: 'attacker', lastSyncedRevision: 999 },
        'some-random-key': { evil: true },
      },
    })
    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ x: 1 })
    expect(JSON.parse(localStorage.getItem('ledger-sync')!)).toEqual({ deviceId: 'this-device', lastSyncedRevision: 3 })
    expect(JSON.parse(localStorage.getItem('some-random-key')!)).toEqual({ mine: true })
  })
})

describe('backup key coverage', () => {
  it('backs up the PortfolioAnalyst report store', () => {
    expect(BACKUP_KEYS).toContain('ledger-portfolio-report')
  })

  it('leaves per-device sync bookkeeping out of the backup', () => {
    expect(BACKUP_KEYS).not.toContain('ledger-sync')
  })

  it('covers every registered store except the declared exclusions', () => {
    const expected = Object.values(STORAGE_KEYS).filter((k) => k !== STORAGE_KEYS.sync)
    expect([...BACKUP_KEYS].sort()).toEqual([...expected].sort())
  })

  it('round-trips the PortfolioAnalyst report through a backup', () => {
    localStorage.setItem('ledger-portfolio-report', JSON.stringify({ state: { report: { id: 'r1' } } }))
    const env = buildBackup()
    localStorage.clear()
    restoreBackup(env)
    expect(JSON.parse(localStorage.getItem('ledger-portfolio-report') as string)).toEqual({
      state: { report: { id: 'r1' } },
    })
  })
})
