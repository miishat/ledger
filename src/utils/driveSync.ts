import type { SnapshotMeta } from './syncDecision'

export const SYNC_FOLDER_NAME = 'Ledger'
export const SNAPSHOT_CAP = 100

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files'

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

/** Turns a Drive error response into a message worth showing a human. */
async function driveError(response: Response): Promise<Error> {
  if (response.status === 401 || response.status === 403) {
    return new Error('Google Drive access expired. Connect again and retry.')
  }
  let detail = `Drive request failed (${response.status})`
  try {
    const body = (await response.json()) as { error?: { message?: string } }
    if (body?.error?.message) detail = body.error.message
  } catch {
    // Keep the status-based message.
  }
  return new Error(detail)
}

async function driveFetch(url: string, token: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { ...authHeaders(token), ...(init.headers as Record<string, string> | undefined) },
  })
  if (!response.ok) throw await driveError(response)
  return response
}

export async function findOrCreateFolder(token: string): Promise<string> {
  const query = `name='${SYNC_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const listUrl = `${DRIVE_FILES}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent('files(id,name)')}`
  const listed = (await (await driveFetch(listUrl, token)).json()) as { files?: Array<{ id: string }> }
  const existing = listed.files?.[0]
  if (existing) return existing.id

  const created = (await (
    await driveFetch(DRIVE_FILES, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: SYNC_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
    })
  ).json()) as { id: string }
  return created.id
}

export async function listSnapshots(token: string, folderId: string): Promise<SnapshotMeta[]> {
  const query = `'${folderId}' in parents and trashed=false`
  const fields = 'files(id,name,createdTime,appProperties)'
  const url =
    `${DRIVE_FILES}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}` +
    `&orderBy=createdTime%20desc&pageSize=200`
  const body = (await (await driveFetch(url, token)).json()) as {
    files?: Array<{
      id: string
      name: string
      createdTime: string
      appProperties?: Record<string, string>
    }>
  }
  return (body.files ?? [])
    .filter((file) => file.appProperties?.revision !== undefined)
    .map((file) => ({
      fileId: file.id,
      name: file.name,
      createdTime: file.createdTime,
      revision: Number(file.appProperties!.revision),
      deviceId: file.appProperties!.deviceId ?? '',
      deviceName: file.appProperties!.deviceName ?? 'another device',
    }))
    .filter((snapshot) => Number.isFinite(snapshot.revision))
}
