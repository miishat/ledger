import { describe, it, expect } from 'vitest'
import { decidePush, decidePull, latestSnapshot, type SnapshotMeta, type LocalSyncFacts } from './syncDecision'

function snap(revision: number, over: Partial<SnapshotMeta> = {}): SnapshotMeta {
  return {
    fileId: `file-${revision}`,
    name: `ledger-r${revision}.json`,
    createdTime: `2026-08-1${revision}T00:00:00.000Z`,
    revision,
    deviceId: 'other-device',
    deviceName: 'Phone',
    ...over,
  }
}

const synced: LocalSyncFacts = {
  lastSyncedRevision: 3,
  lastSyncedHash: 'hash-3',
  currentHash: 'hash-3',
  hasLocalData: true,
}

describe('latestSnapshot', () => {
  it('returns undefined for an empty list', () => {
    expect(latestSnapshot([])).toBeUndefined()
  })

  it('picks the highest revision regardless of order', () => {
    expect(latestSnapshot([snap(2), snap(5), snap(3)])!.revision).toBe(5)
  })

  it('breaks a revision tie with the newer createdTime', () => {
    const older = snap(5, { fileId: 'older', createdTime: '2026-08-01T00:00:00.000Z' })
    const newer = snap(5, { fileId: 'newer', createdTime: '2026-08-02T00:00:00.000Z' })
    expect(latestSnapshot([older, newer])!.fileId).toBe('newer')
  })
})

describe('decidePush', () => {
  it('has nothing to push when local is unchanged and remote has not moved', () => {
    expect(decidePush(synced, [snap(3)]).kind).toBe('nothing-to-push')
  })

  it('pushes cleanly when local changed and remote has not moved', () => {
    const d = decidePush({ ...synced, currentHash: 'hash-4' }, [snap(3)])
    expect(d).toEqual({ kind: 'clean', nextRevision: 4, baseRevision: 3 })
  })

  it('pushes cleanly as revision 1 when Drive is empty', () => {
    const facts = { lastSyncedRevision: 0, lastSyncedHash: '', currentHash: 'hash-1', hasLocalData: true }
    expect(decidePush(facts, [])).toEqual({ kind: 'clean', nextRevision: 1, baseRevision: 0 })
  })

  it('reports divergence when the other device pushed since our last sync', () => {
    const d = decidePush({ ...synced, currentHash: 'hash-4' }, [snap(3), snap(5)])
    expect(d.kind).toBe('diverged')
    if (d.kind === 'diverged') {
      expect(d.remote.deviceName).toBe('Phone')
      expect(d.nextRevision).toBe(6)
      expect(d.baseRevision).toBe(3)
    }
  })

  it('reports divergence even when local is unchanged but remote moved', () => {
    expect(decidePush(synced, [snap(5)]).kind).toBe('diverged')
  })
})

describe('decidePull', () => {
  it('reports nothing to pull when Drive is empty', () => {
    expect(decidePull(synced, []).kind).toBe('nothing-remote')
  })

  it('is up to date when the newest snapshot is the one we synced with', () => {
    expect(decidePull(synced, [snap(3)]).kind).toBe('up-to-date')
  })

  it('pulls cleanly when remote is newer and local is unchanged', () => {
    const d = decidePull(synced, [snap(5)])
    expect(d.kind).toBe('clean')
  })

  it('warns when remote is newer and local has unpushed edits', () => {
    const d = decidePull({ ...synced, currentHash: 'hash-9' }, [snap(5)])
    expect(d.kind).toBe('would-lose-local')
  })

  it('pulls cleanly onto a fresh device with no local data', () => {
    const fresh = { lastSyncedRevision: 0, lastSyncedHash: '', currentHash: 'hash-empty', hasLocalData: false }
    expect(decidePull(fresh, [snap(5)]).kind).toBe('clean')
  })

  it('warns on a device that has data but has never synced', () => {
    const never = { lastSyncedRevision: 0, lastSyncedHash: '', currentHash: 'hash-x', hasLocalData: true }
    expect(decidePull(never, [snap(5)]).kind).toBe('would-lose-local')
  })
})
