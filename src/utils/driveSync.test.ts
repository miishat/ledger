import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { findOrCreateFolder, listSnapshots, SYNC_FOLDER_NAME, SNAPSHOT_CAP } from './driveSync'

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)
}

describe('driveSync folder', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns the existing folder id when one is found', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ files: [{ id: 'folder-1', name: SYNC_FOLDER_NAME }] }))
    await expect(findOrCreateFolder('tok')).resolves.toBe('folder-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('creates the folder when none exists', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ files: [] }))
    fetchMock.mockReturnValueOnce(jsonResponse({ id: 'folder-new' }))
    await expect(findOrCreateFolder('tok')).resolves.toBe('folder-new')
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('https://www.googleapis.com/drive/v3/files')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({
      name: SYNC_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    })
  })

  it('sends the bearer token', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ files: [{ id: 'folder-1' }] }))
    await findOrCreateFolder('tok-abc')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-abc')
  })

  it('raises a friendly error when the token is rejected', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ error: { message: 'Invalid Credentials' } }, 401))
    await expect(findOrCreateFolder('tok')).rejects.toThrow(/Google Drive access expired/i)
  })

  it('raises a friendly error on other Drive failures', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ error: { message: 'Rate Limit Exceeded' } }, 429))
    await expect(findOrCreateFolder('tok')).rejects.toThrow(/Rate Limit Exceeded/)
  })
})

describe('driveSync listSnapshots', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  it('maps Drive files into snapshot metadata', async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({
        files: [
          {
            id: 'f1',
            name: 'ledger-2026-08-12T10-00-00Z-r2.json',
            createdTime: '2026-08-12T10:00:00.000Z',
            appProperties: { revision: '2', deviceId: 'dev-a', deviceName: 'Phone' },
          },
        ],
      })
    )
    const snaps = await listSnapshots('tok', 'folder-1')
    expect(snaps).toEqual([
      {
        fileId: 'f1',
        name: 'ledger-2026-08-12T10-00-00Z-r2.json',
        createdTime: '2026-08-12T10:00:00.000Z',
        revision: 2,
        deviceId: 'dev-a',
        deviceName: 'Phone',
      },
    ])
  })

  it('ignores files without ledger revision metadata', async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ files: [{ id: 'f1', name: 'notes.txt', createdTime: '2026-08-12T10:00:00.000Z' }] })
    )
    await expect(listSnapshots('tok', 'folder-1')).resolves.toEqual([])
  })

  it('falls back to a readable device name when metadata is partial', async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({
        files: [
          { id: 'f1', name: 'x.json', createdTime: '2026-08-12T10:00:00.000Z', appProperties: { revision: '3' } },
        ],
      })
    )
    const snaps = await listSnapshots('tok', 'folder-1')
    expect(snaps[0].deviceName).toBe('another device')
    expect(snaps[0].deviceId).toBe('')
  })

  it('caps retention at 100 snapshots', () => {
    expect(SNAPSHOT_CAP).toBe(100)
  })
})
