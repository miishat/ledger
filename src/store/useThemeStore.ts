import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'geometric' | 'tactical'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'geometric',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'geometric' ? 'tactical' : 'geometric' 
      })),
    }),
    {
      name: 'financial-dashboard-theme',
    }
  )
)
