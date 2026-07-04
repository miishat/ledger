import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DashboardLayoutState {
  /** Widget ids in display order; empty = default order. */
  order: string[]
  setOrder: (order: string[]) => void
  moveWidget: (id: string, beforeId: string | null) => void
}

export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set) => ({
      order: [],
      setOrder: (order) => set({ order }),
      moveWidget: (id, beforeId) =>
        set((state) => {
          const rest = state.order.filter((x) => x !== id)
          if (beforeId === null) return { order: [...rest, id] }
          const idx = rest.indexOf(beforeId)
          if (idx === -1) return { order: [...rest, id] }
          return { order: [...rest.slice(0, idx), id, ...rest.slice(idx)] }
        }),
    }),
    { name: 'ledger-dashboard-layout' },
  ),
)
