import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from './storageKeys'

interface DashboardLayoutState {
  /** Widget ids in display order; empty = default order. */
  order: string[]
  /** Widget ids the user has switched off. */
  hidden: string[]
  setOrder: (order: string[]) => void
  moveWidget: (id: string, beforeId: string | null) => void
  toggleHidden: (id: string) => void
  /** Move one place earlier (-1) or later (+1). Takes the currently displayed
   *  order so the first move materialises the default instead of starting from
   *  an empty stored order. This is the touch path: dragging is desktop only. */
  moveBy: (id: string, delta: number, currentOrder: string[]) => void
}

export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set) => ({
      order: [],
      hidden: [],
      setOrder: (order) => set({ order }),
      moveWidget: (id, beforeId) =>
        set((state) => {
          const rest = state.order.filter((x) => x !== id)
          if (beforeId === null) return { order: [...rest, id] }
          const idx = rest.indexOf(beforeId)
          if (idx === -1) return { order: [...rest, id] }
          return { order: [...rest.slice(0, idx), id, ...rest.slice(idx)] }
        }),
      toggleHidden: (id) =>
        set((state) => ({
          hidden: state.hidden.includes(id)
            ? state.hidden.filter((x) => x !== id)
            : [...state.hidden, id],
        })),
      moveBy: (id, delta, currentOrder) =>
        set(() => {
          const from = currentOrder.indexOf(id)
          const to = from + delta
          if (from === -1 || to < 0 || to >= currentOrder.length) return { order: currentOrder }
          const next = [...currentOrder]
          next.splice(from, 1)
          next.splice(to, 0, id)
          return { order: next }
        }),
    }),
    { name: STORAGE_KEYS.dashboardLayout },
  ),
)
