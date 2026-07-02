import { describe, it, expect, beforeEach } from 'vitest'
import { buildBackup, restoreBackup, BACKUP_VERSION, type BackupEnvelope } from './backup'

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
