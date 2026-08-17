import React from 'react'
import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useSyncStore } from '../../store/useSyncStore'
import { syncStatus } from '../../utils/syncStatus'

interface SyncStatusChipProps {
  onOpenSettings: () => void
}

/** Header indicator for Drive sync freshness. Read only: it reports state and
 *  routes to Settings, it never triggers a sync itself. */
export const SyncStatusChip: React.FC<SyncStatusChipProps> = ({ onOpenSettings }) => {
  const clientId = useSyncStore((s) => s.clientId)
  const folderId = useSyncStore((s) => s.folderId)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)

  const state = syncStatus({ clientId, folderId, lastSyncedAt, now: new Date() })
  if (state === 'disconnected') return null

  const copy = {
    never: { label: 'Sync: never', Icon: CloudOff, tone: 'text-text-secondary' },
    fresh: { label: 'Sync: up to date', Icon: Cloud, tone: 'text-accent' },
    stale: { label: 'Sync: stale', Icon: RefreshCw, tone: 'text-error' },
  }[state]

  const { Icon } = copy

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      aria-label={copy.label}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border border-border ${copy.tone} hover:border-accent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {copy.label}
    </button>
  )
}
