import { describe, it, expect, beforeEach } from 'vitest'
import { useSyncStore } from './useSyncStore'
import { BACKUP_KEYS } from '../utils/backup'

describe('useSyncStore', () => {
  beforeEach(() => {
    useSyncStore.setState({ lastSyncedRevision: 0, lastSyncedHash: '', lastSyncedAt: undefined })
  })

  it('generates a non-empty device id', () => {
    expect(useSyncStore.getState().deviceId.length).toBeGreaterThan(0)
  })

  it('starts unsynced', () => {
    expect(useSyncStore.getState().lastSyncedRevision).toBe(0)
    expect(useSyncStore.getState().lastSyncedHash).toBe('')
  })

  it('recordSync stores revision, hash and a timestamp', () => {
    useSyncStore.getState().recordSync(4, 'abc12345')
    const state = useSyncStore.getState()
    expect(state.lastSyncedRevision).toBe(4)
    expect(state.lastSyncedHash).toBe('abc12345')
    expect(state.lastSyncedAt).toBeTruthy()
  })

  it('trims and clears the client id', () => {
    useSyncStore.getState().setClientId('  abc.apps.googleusercontent.com  ')
    expect(useSyncStore.getState().clientId).toBe('abc.apps.googleusercontent.com')
    useSyncStore.getState().clearClientId()
    expect(useSyncStore.getState().clientId).toBeUndefined()
  })

  it('is excluded from backups so a pull cannot overwrite device identity', () => {
    expect(BACKUP_KEYS).not.toContain('ledger-sync')
  })
})
