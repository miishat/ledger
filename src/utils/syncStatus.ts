export type SyncState = 'disconnected' | 'never' | 'fresh' | 'stale'

const DEFAULT_STALE_AFTER_HOURS = 24

/** Derives what the header chip should say from persisted sync bookkeeping.
 *  Pure so the staleness boundary can be tested without faking timers. */
export function syncStatus(input: {
  clientId?: string
  folderId?: string
  lastSyncedAt?: string
  now: Date
  staleAfterHours?: number
}): SyncState {
  const { clientId, folderId, lastSyncedAt, now } = input
  if (!clientId || !folderId) return 'disconnected'
  if (!lastSyncedAt) return 'never'

  const then = new Date(lastSyncedAt).getTime()
  if (Number.isNaN(then)) return 'never'

  const hours = (now.getTime() - then) / 3_600_000
  return hours <= (input.staleAfterHours ?? DEFAULT_STALE_AFTER_HOURS) ? 'fresh' : 'stale'
}
