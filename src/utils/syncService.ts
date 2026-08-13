import { buildBackup, parseBackupText, restoreBackup } from './backup'
import { currentBackupHash, hasLocalData, hashBackupData } from './syncHash'
import { useSyncStore } from '../store/useSyncStore'
import { decidePull, decidePush, type LocalSyncFacts, type PullDecision, type PushDecision, type SnapshotMeta } from './syncDecision'
import { downloadSnapshot, findOrCreateFolder, listSnapshots, pruneSnapshots, uploadSnapshot } from './driveSync'

export function collectFacts(): LocalSyncFacts {
  const { lastSyncedRevision, lastSyncedHash } = useSyncStore.getState()
  return {
    lastSyncedRevision,
    lastSyncedHash,
    currentHash: currentBackupHash(),
    hasLocalData: hasLocalData(),
  }
}

/** Resolves the sync folder and its snapshots, caching the folder id. */
export async function prepare(token: string): Promise<{ folderId: string; snapshots: SnapshotMeta[] }> {
  const folderId = await findOrCreateFolder(token)
  useSyncStore.getState().setFolderId(folderId)
  const snapshots = await listSnapshots(token, folderId)
  return { folderId, snapshots }
}

export async function previewPush(token: string): Promise<PushDecision> {
  const { snapshots } = await prepare(token)
  return decidePush(collectFacts(), snapshots)
}

export async function previewPull(token: string): Promise<PullDecision> {
  const { snapshots } = await prepare(token)
  return decidePull(collectFacts(), snapshots)
}

export async function performPush(
  token: string,
  folderId: string,
  nextRevision: number,
  baseRevision: number
): Promise<SnapshotMeta> {
  const { deviceId, deviceName } = useSyncStore.getState()
  const envelope = buildBackup({ deviceId, deviceName, revision: nextRevision, baseRevision })
  const uploadedHash = hashBackupData(envelope.data)
  const uploaded = await uploadSnapshot(token, folderId, envelope)

  // Bookmark the payload Drive actually holds, not whatever localStorage says
  // now. Local data can change during the upload round trip, and hashing it
  // afterwards would mark those edits as already synced and hide them from
  // every future push.
  useSyncStore.getState().recordSync(nextRevision, uploadedHash)

  // Pruning is best-effort housekeeping and must never fail the push.
  try {
    const snapshots = await listSnapshots(token, folderId)
    await pruneSnapshots(token, snapshots)
  } catch {
    // Ignore: the snapshot is safely uploaded.
  }
  return uploaded
}

export async function performPull(token: string, remote: SnapshotMeta): Promise<void> {
  const text = await downloadSnapshot(token, remote.fileId)
  // Parse and validate before any write, so a corrupt file cannot damage local data.
  const envelope = parseBackupText(text)
  restoreBackup(envelope)
  useSyncStore.getState().recordSync(remote.revision, currentBackupHash())
}
