import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from './storageKeys'

export type AppTheme = 'geometric' | 'tactical' | 'luxury' | 'aurora' | 'glass'

interface ThemeState {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  cycleTheme: () => void
}

const THEME_CYCLE: AppTheme[] = ['geometric', 'tactical', 'luxury', 'aurora', 'glass']

// Mirrors each theme's --bg-primary in src/index.css. jsdom's
// getComputedStyle does not resolve CSS custom properties from stylesheets,
// so the theme-color meta sync in App.tsx reads this record instead of the
// computed style, keeping the test environment and the real browser in
// agreement without depending on jsdom's CSS support.
export const THEME_BACKGROUNDS: Record<AppTheme, string> = {
  geometric: '#ffffff',
  tactical: '#0a0a0a',
  luxury: '#000000',
  aurora: '#090d16',
  glass: '#0b0910',
}

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
      name: STORAGE_KEYS.theme,
    }
  )
)
