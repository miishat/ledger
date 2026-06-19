import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppTheme = 'geometric' | 'tactical' | 'luxury' | 'aurora' | 'glass'

interface ThemeState {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  cycleTheme: () => void
}

const THEME_CYCLE: AppTheme[] = ['geometric', 'tactical', 'luxury', 'aurora', 'glass']

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'luxury', // Set default theme to luxury dark
      setTheme: (theme) => set({ theme }),
      cycleTheme: () => set((state) => {
        const nextIndex = (THEME_CYCLE.indexOf(state.theme) + 1) % THEME_CYCLE.length
        return { theme: THEME_CYCLE[nextIndex] }
      }),
    }),
    {
      name: 'financial-dashboard-theme',
    }
  )
)
