import { describe, it, expect, beforeEach } from 'vitest'
import { buildBackup, restoreBackup, BACKUP_VERSION, type BackupEnvelope, backupToBlob, backupFilename, parseBackupText, BACKUP_KEYS } from './backup'

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
