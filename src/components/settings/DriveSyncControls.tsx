import React, { useState } from 'react'
import { CloudUpload, CloudDownload, AlertTriangle } from 'lucide-react'
import { useSyncStore } from '../../store/useSyncStore'
import { requestAccessToken, getCachedToken, clearCachedToken } from '../../utils/driveAuth'
import { previewPush, previewPull, performPush, performPull } from '../../utils/syncService'
import type { SnapshotMeta } from '../../utils/syncDecision'

type Pending =
  | {
      kind: 'overwrite'
      remote: SnapshotMeta
      nextRevision: number
      baseRevision: number
    }
  | { kind: 'discard-local', remote: SnapshotMeta }
  | { kind: 'collision', remote: SnapshotMeta }

function whenText(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Compile-time exhaustiveness guard. If a decision handler reaches this with
 *  a variant it did not narrow away, TypeScript rejects the call site because
 *  `x` cannot be `never`, so a new decision variant is a build error instead
 *  of a silent fall-through into the data-mutating call. */
function assertNever(x: never): never {
  throw new Error(`Unhandled decision variant: ${JSON.stringify(x)}`)
}

function pendingHeading(kind: Pending['kind']): string {
  if (kind === 'overwrite') return 'Another device has newer data'
  if (kind === 'discard-local') return 'This will discard your local changes'
  return 'Two devices pushed the same revision'
}

export const DriveSyncControls: React.FC = () => {
  const clientId = useSyncStore((s) => s.clientId)
  const setClientId = useSyncStore((s) => s.setClientId)
  const disconnect = useSyncStore((s) => s.disconnect)
  const folderId = useSyncStore((s) => s.folderId)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)
  const lastSyncedRevision = useSyncStore((s) => s.lastSyncedRevision)
  const deviceName = useSyncStore((s) => s.deviceName)
  const setDeviceName = useSyncStore((s) => s.setDeviceName)

  const [nameDraft, setNameDraft] = useState(deviceName)
  const [clientIdDraft, setClientIdDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)

  const token = async (): Promise<string> => getCachedToken() ?? (await requestAccessToken(clientId!))

  const isExpiry = (err: unknown) => err instanceof Error && /access expired/i.test(err.message)

  /** Runs work with a token, and on an expiry failure reconnects once and retries. */
  const withToken = async <T,>(work: (accessToken: string) => Promise<T>): Promise<T> => {
    try {
      return await work(await token())
    } catch (err) {
      if (!isExpiry(err)) throw err
      clearCachedToken()
      return work(await token())
    }
  }

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      await work()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed.')
    } finally {
      setBusy(false)
    }
  }

  const handlePush = () =>
    run(async () => {
      const decision = await withToken((accessToken) => previewPush(accessToken))
      if (decision.kind === 'nothing-to-push') {
        setStatus('Drive is already up to date.')
        return
      }
      if (decision.kind === 'diverged') {
        setPending({
          kind: 'overwrite',
          remote: decision.remote,
          nextRevision: decision.nextRevision,
          baseRevision: decision.baseRevision,
        })
        return
      }
      if (decision.kind !== 'clean') {
        return assertNever(decision)
      }
      await performPush(await token(), useSyncStore.getState().folderId!, decision.nextRevision, decision.baseRevision)
      setStatus(`Pushed revision ${decision.nextRevision}.`)
    })

  const handlePull = () =>
    run(async () => {
      const decision = await withToken((accessToken) => previewPull(accessToken))
      if (decision.kind === 'nothing-remote') {
        setStatus('No snapshots in Drive yet. Push from one device first.')
        return
      }
      if (decision.kind === 'up-to-date') {
        setStatus('This device is already up to date.')
        return
      }
      if (decision.kind === 'would-lose-local') {
        setPending({ kind: 'discard-local', remote: decision.remote })
        return
      }
      if (decision.kind === 'collision') {
        setPending({ kind: 'collision', remote: decision.remote })
        return
      }
      if (decision.kind !== 'clean') {
        return assertNever(decision)
      }
      await performPull(await token(), decision.remote)
      setStatus(`Pulled revision ${decision.remote.revision}. Reloading.`)
      window.location.reload()
    })

  const handleDisconnect = () => {
    disconnect()
    clearCachedToken()
  }

  const confirmPending = () =>
    run(async () => {
      const current = pending!
      setPending(null)
      if (current.kind === 'overwrite') {
        await withToken((accessToken) => performPush(accessToken, folderId!, current.nextRevision, current.baseRevision))
        setStatus(`Pushed revision ${current.nextRevision}, overwriting the newer snapshot.`)
        return
      }
      await withToken((accessToken) => performPull(accessToken, current.remote))
      window.location.reload()
    })

  if (!clientId) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <p className="text-[12px] text-text-secondary">
          Sync through your own Google Drive. Create an OAuth client ID in Google Cloud Console, add this
          site to its authorised JavaScript origins, then paste the ID here.
        </p>
        <label className="flex flex-col gap-1 text-[12px] text-text-secondary">
          Google client ID
          <input
            value={clientIdDraft}
            onChange={(e) => setClientIdDraft(e.target.value)}
            placeholder="xxxxx.apps.googleusercontent.com"
            className="px-2 py-1.5 rounded-md border border-border bg-transparent text-[13px] text-text-primary"
          />
        </label>
        <button
          onClick={() => setClientId(clientIdDraft)}
          disabled={!clientIdDraft.trim()}
          className="px-3 py-2 rounded-md border border-border text-[13px] text-text-secondary hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
        >
          Save client ID
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <button
          onClick={handlePush}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-[13px] text-text-secondary hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
        >
          <CloudUpload className="w-4 h-4" /> Push to Drive
        </button>
        <button
          onClick={handlePull}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-[13px] text-text-secondary hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
        >
          <CloudDownload className="w-4 h-4" /> Pull from Drive
        </button>
      </div>

      <label className="flex items-center gap-2 text-[12px] text-text-secondary">
        This device
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => setDeviceName(nameDraft)}
          className="flex-1 px-2 py-1 rounded-md border border-border bg-transparent text-[12px] text-text-primary"
        />
      </label>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <p className="text-[11px] text-text-secondary/80">
          {lastSyncedAt
            ? `Last synced ${whenText(lastSyncedAt)} · revision ${lastSyncedRevision}`
            : 'Never synced on this device.'}
        </p>
        <button
          onClick={handleDisconnect}
          disabled={busy}
          className="text-[11px] text-text-secondary hover:text-accent underline underline-offset-2 decoration-text-secondary/40 hover:decoration-accent transition-colors disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
      <p className="text-[11px] text-text-secondary">
        Forgets the Drive link only. Nothing is deleted.
      </p>

      {status && <p className="text-[12px] text-text-secondary">{status}</p>}
      {error && <p className="text-xs text-error">{error}</p>}

      {pending && (
        <div role="dialog" aria-label="Sync conflict" className="border border-error/60 rounded-md p-3 flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-text-primary">
            <AlertTriangle className="w-4 h-4 text-error" aria-hidden="true" /> {pendingHeading(pending.kind)}
          </p>
          {pending.kind === 'overwrite' && (
            <p className="text-[12px] text-text-secondary">
              {pending.remote.deviceName} pushed revision {pending.remote.revision} on{' '}
              {whenText(pending.remote.createdTime)}, after this device last synced. Pushing now makes your
              copy the newest one. Nothing is deleted from Drive, but the other device's changes will not be
              in your data.
            </p>
          )}
          {pending.kind === 'discard-local' && (
            <p className="text-[12px] text-text-secondary">
              You have unpushed changes on this device. Pulling revision {pending.remote.revision} from{' '}
              {pending.remote.deviceName} replaces everything here, and those local changes are gone.
            </p>
          )}
          {pending.kind === 'collision' && (
            <p className="text-[12px] text-text-secondary">
              Two devices pushed revision {pending.remote.revision} at the same time, so Drive holds two
              different snapshots with that number. Pulling takes the one from {pending.remote.deviceName},
              saved {whenText(pending.remote.createdTime)}. The other snapshot stays in your Drive folder,
              but this app will not offer it again, so recover it by hand if you need it.
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={confirmPending}
              disabled={busy}
              className="flex-1 px-3 py-2 rounded-md border border-error text-[13px] text-error hover:bg-error/10 transition-colors disabled:opacity-50"
            >
              {pending.kind === 'overwrite' && 'Overwrite anyway'}
              {pending.kind === 'discard-local' && 'Discard local and pull'}
              {pending.kind === 'collision' && 'Pull this one'}
            </button>
            <button
              onClick={() => setPending(null)}
              className="flex-1 px-3 py-2 rounded-md border border-border text-[13px] text-text-secondary hover:text-accent hover:border-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
