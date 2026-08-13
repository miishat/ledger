import { describe, it, expect, beforeEach, vi } from 'vitest'
import { collectFacts, performPush, performPull } from './syncService'
import { useSyncStore } from '../store/useSyncStore'
import { BACKUP_VERSION, type BackupEnvelope } from './backup'
import { hashBackupData } from './syncHash'
import type { SnapshotMeta } from './syncDecision'

vi.mock('./driveSync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./driveSync')>()
  return {
    ...actual,
    uploadSnapshot: vi.fn(),
    downloadSnapshot: vi.fn(),
    listSnapshots: vi.fn(),
    pruneSnapshots: vi.fn(() => Promise.resolve(0)),
  }
})

const drive = await import('./driveSync')

function remoteMeta(revision: number): SnapshotMeta {
  return {
    fileId: `f-${revision}`, name: `r${revision}.json`, createdTime: '2026-08-12T10:00:00.000Z',
    revision, deviceId: 'dev-b', deviceName: 'Phone',
  }
}

describe('syncService', () => {
  beforeEach(() => {
    localStorage.removeItem('ledger-budget')
    useSyncStore.setState({ lastSyncedRevision: 0, lastSyncedHash: '', lastSyncedAt: undefined })
    vi.mocked(drive.uploadSnapshot).mockReset()
    vi.mocked(drive.downloadSnapshot).mockReset()
    vi.mocked(drive.pruneSnapshots).mockReset().mockResolvedValue(0)
  })

  it('collectFacts reports a fresh device', () => {
    const facts = collectFacts()
    expect(facts.lastSyncedRevision).toBe(0)
    expect(facts.hasLocalData).toBe(false)
  })

  it('collectFacts reports local data once a key exists', () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ x: 1 }))
    expect(collectFacts().hasLocalData).toBe(true)
  })

  it('performPush uploads an envelope stamped with device and revision', async () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ x: 1 }))
    useSyncStore.setState({ deviceId: 'dev-a', deviceName: 'Desktop' })
    vi.mocked(drive.uploadSnapshot).mockResolvedValue(remoteMeta(4))

    await performPush('tok', 'folder-1', 4, 3)

    const envelope = vi.mocked(drive.uploadSnapshot).mock.calls[0][2]
    expect(envelope.revision).toBe(4)
    expect(envelope.baseRevision).toBe(3)
    expect(envelope.deviceId).toBe('dev-a')
    expect(envelope.deviceName).toBe('Desktop')
    expect(envelope.data['ledger-budget']).toEqual({ x: 1 })
  })

  it('performPush records the sync bookmark only after a successful upload', async () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ x: 1 }))
    vi.mocked(drive.uploadSnapshot).mockRejectedValue(new Error('network down'))

    await expect(performPush('tok', 'folder-1', 4, 3)).rejects.toThrow('network down')
    expect(useSyncStore.getState().lastSyncedRevision).toBe(0)

    vi.mocked(drive.uploadSnapshot).mockResolvedValue(remoteMeta(4))
    await performPush('tok', 'folder-1', 4, 3)
    expect(useSyncStore.getState().lastSyncedRevision).toBe(4)
    expect(useSyncStore.getState().lastSyncedHash).not.toBe('')
  })

  it('bookmarks the uploaded payload\'s hash, not localStorage after the upload', async () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ x: 1 }))
    const originalHash = hashBackupData({ 'ledger-budget': { x: 1 } })

    vi.mocked(drive.uploadSnapshot).mockImplementation(async () => {
      // Simulate a local edit landing during the network round trip.
      localStorage.setItem('ledger-budget', JSON.stringify({ x: 2 }))
      return remoteMeta(4)
    })

    await performPush('tok', 'folder-1', 4, 3)

    expect(useSyncStore.getState().lastSyncedHash).toBe(originalHash)
    expect(useSyncStore.getState().lastSyncedHash).not.toBe(hashBackupData({ 'ledger-budget': { x: 2 } }))

    const facts = collectFacts()
    expect(facts.currentHash).not.toBe(facts.lastSyncedHash)
  })

  it('performPull restores the downloaded snapshot', async () => {
    const envelope: BackupEnvelope = {
      version: BACKUP_VERSION, exportedAt: '', app: 'ledger',
      data: { 'ledger-budget': { pulled: true } }, revision: 5,
    }
    vi.mocked(drive.downloadSnapshot).mockResolvedValue(JSON.stringify(envelope))

    await performPull('tok', remoteMeta(5))

    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ pulled: true })
    expect(useSyncStore.getState().lastSyncedRevision).toBe(5)
  })

  it('performPull leaves local data untouched when the remote file is corrupt', async () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ keep: true }))
    vi.mocked(drive.downloadSnapshot).mockResolvedValue('{not json')

    await expect(performPull('tok', remoteMeta(5))).rejects.toThrow('Invalid Ledger backup file')
    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ keep: true })
    expect(useSyncStore.getState().lastSyncedRevision).toBe(0)
  })

  it('performPull removes a registered key the snapshot does not carry, and reports clean afterwards', async () => {
    // Device has portfolio data the remote snapshot never had (it was pushed
    // from a device that never used Investments).
    localStorage.setItem('ledger-portfolio', JSON.stringify({ holdings: [1, 2, 3] }))
    const envelope: BackupEnvelope = {
      version: BACKUP_VERSION, exportedAt: '', app: 'ledger',
      data: { 'ledger-budget': { pulled: true } }, revision: 5,
    }
    vi.mocked(drive.downloadSnapshot).mockResolvedValue(JSON.stringify(envelope))

    await performPull('tok', remoteMeta(5))

    expect(localStorage.getItem('ledger-portfolio')).toBeNull()
    const facts = collectFacts()
    expect(facts.currentHash).toBe(facts.lastSyncedHash)
  })

  it('performPull overwrites a key present in both local storage and the snapshot', async () => {
    localStorage.setItem('ledger-budget', JSON.stringify({ old: true }))
    const envelope: BackupEnvelope = {
      version: BACKUP_VERSION, exportedAt: '', app: 'ledger',
      data: { 'ledger-budget': { fresh: true } }, revision: 5,
    }
    vi.mocked(drive.downloadSnapshot).mockResolvedValue(JSON.stringify(envelope))

    await performPull('tok', remoteMeta(5))

    expect(JSON.parse(localStorage.getItem('ledger-budget')!)).toEqual({ fresh: true })
  })
})
