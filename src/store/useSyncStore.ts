import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

/** A readable default label so the conflict dialog can name the other device. */
function defaultDeviceName(): string {
  if (typeof navigator === 'undefined') return 'This device';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android device';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS device';
  if (/Mac OS X/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  return 'This device';
}

interface SyncState {
  deviceId: string;
  deviceName: string;
  clientId?: string;
  folderId?: string;
  lastSyncedRevision: number;
  lastSyncedAt?: string;
  lastSyncedHash: string;

  setDeviceName: (name: string) => void;
  setClientId: (id: string) => void;
  clearClientId: () => void;
  setFolderId: (id: string) => void;
  recordSync: (revision: number, hash: string) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      deviceId: uuidv4(),
      deviceName: defaultDeviceName(),
      clientId: undefined,
      folderId: undefined,
      lastSyncedRevision: 0,
      lastSyncedAt: undefined,
      lastSyncedHash: '',

      setDeviceName: (name) => set({ deviceName: name.trim() || defaultDeviceName() }),
      setClientId: (id) => set({ clientId: id.trim() || undefined }),
      clearClientId: () => set({ clientId: undefined }),
      setFolderId: (id) => set({ folderId: id }),
      recordSync: (revision, hash) =>
        set({ lastSyncedRevision: revision, lastSyncedHash: hash, lastSyncedAt: new Date().toISOString() }),
    }),
    {
      // Intentionally absent from BACKUP_KEYS: this metadata is per-device and
      // must not travel inside a snapshot.
      name: 'ledger-sync',
    }
  )
);
