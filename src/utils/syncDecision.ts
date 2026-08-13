export interface SnapshotMeta {
  fileId: string
  name: string
  createdTime: string
  revision: number
  deviceId: string
  deviceName: string
}

export interface LocalSyncFacts {
  lastSyncedRevision: number
  lastSyncedHash: string
  currentHash: string
  hasLocalData: boolean
}

export type PushDecision =
  | { kind: 'nothing-to-push' }
  | { kind: 'clean'; nextRevision: number; baseRevision: number }
  | { kind: 'diverged'; remote: SnapshotMeta; nextRevision: number; baseRevision: number }

export type PullDecision =
  | { kind: 'nothing-remote' }
  | { kind: 'up-to-date' }
  | { kind: 'clean'; remote: SnapshotMeta }
  | { kind: 'would-lose-local'; remote: SnapshotMeta }

/** Highest revision wins; a tie is broken by the newer createdTime. */
export function latestSnapshot(snapshots: SnapshotMeta[]): SnapshotMeta | undefined {
  return snapshots.reduce<SnapshotMeta | undefined>((best, s) => {
    if (!best) return s
    if (s.revision !== best.revision) return s.revision > best.revision ? s : best
    return s.createdTime > best.createdTime ? s : best
  }, undefined)
}

function isDirty(facts: LocalSyncFacts): boolean {
  return facts.currentHash !== facts.lastSyncedHash
}

export function decidePush(facts: LocalSyncFacts, snapshots: SnapshotMeta[]): PushDecision {
  const remote = latestSnapshot(snapshots)
  const remoteRevision = remote?.revision ?? 0
  const baseRevision = facts.lastSyncedRevision
  const nextRevision = remoteRevision + 1

  if (remoteRevision > baseRevision) {
    return { kind: 'diverged', remote: remote!, nextRevision, baseRevision }
  }
  if (!isDirty(facts)) return { kind: 'nothing-to-push' }
  return { kind: 'clean', nextRevision, baseRevision }
}

export function decidePull(facts: LocalSyncFacts, snapshots: SnapshotMeta[]): PullDecision {
  const remote = latestSnapshot(snapshots)
  if (!remote) return { kind: 'nothing-remote' }
  if (remote.revision <= facts.lastSyncedRevision) return { kind: 'up-to-date' }
  if (facts.hasLocalData && isDirty(facts)) return { kind: 'would-lose-local', remote }
  return { kind: 'clean', remote }
}
