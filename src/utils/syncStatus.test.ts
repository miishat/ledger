import { describe, expect, it } from 'vitest'
import { syncStatus } from './syncStatus'

const now = new Date('2026-08-16T12:00:00Z')

describe('syncStatus', () => {
  it('is disconnected without a client id', () => {
    expect(syncStatus({ folderId: 'f', now })).toBe('disconnected')
  })

  it('is disconnected without a folder id', () => {
    expect(syncStatus({ clientId: 'c', now })).toBe('disconnected')
  })

  it('is never when connected but never synced', () => {
    expect(syncStatus({ clientId: 'c', folderId: 'f', now })).toBe('never')
  })

  it('is fresh inside the staleness window', () => {
    expect(
      syncStatus({ clientId: 'c', folderId: 'f', lastSyncedAt: '2026-08-16T06:00:00Z', now }),
    ).toBe('fresh')
  })

  it('is stale past the staleness window', () => {
    expect(
      syncStatus({ clientId: 'c', folderId: 'f', lastSyncedAt: '2026-08-14T06:00:00Z', now }),
    ).toBe('stale')
  })

  it('treats an unparseable timestamp as never synced', () => {
    expect(syncStatus({ clientId: 'c', folderId: 'f', lastSyncedAt: 'nonsense', now })).toBe('never')
  })
})
