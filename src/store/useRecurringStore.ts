import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from './storageKeys'

interface RecurringState {
  /** RecurringItem.key values ("expense:NETFLIX") the user has dismissed. */
  ignoredKeys: string[]
  ignore: (key: string) => void
  unignore: (key: string) => void
}

/** Detection is derived from transactions on every render, so the only thing
 *  worth persisting is the user's judgement about it. */
export const useRecurringStore = create<RecurringState>()(
  persist(
    (set) => ({
      ignoredKeys: [],
      ignore: (key) =>
        set((s) => (s.ignoredKeys.includes(key) ? s : { ignoredKeys: [...s.ignoredKeys, key] })),
      unignore: (key) => set((s) => ({ ignoredKeys: s.ignoredKeys.filter((k) => k !== key) })),
    }),
    {
      name: STORAGE_KEYS.recurring,
      version: 1,
      // Existing installs wrote version 0 with this exact shape, so v0 to v1
      // is an identity migration. It exists so the next schema change has a
      // hook instead of a silent reinterpretation of whatever is on disk.
      migrate: (persisted: unknown) => persisted,
    },
  ),
)
