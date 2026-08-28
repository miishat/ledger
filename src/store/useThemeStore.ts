import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from './storageKeys'

export type AppTheme = 'geometric' | 'tactical' | 'luxury' | 'aurora' | 'glass' | 'nouveau'

interface ThemeState {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  cycleTheme: () => void
}

const THEME_CYCLE: AppTheme[] = ['geometric', 'tactical', 'luxury', 'aurora', 'glass', 'nouveau']

/** Themes whose --bg-primary is light. App.tsx drives Tailwind's `dark`
 *  class off this set. A new light theme left out of it renders every
 *  dark-mode utility in the app over a cream background, and nothing else
 *  in the codebase would catch that. */
export const LIGHT_THEMES: ReadonlySet<AppTheme> = new Set<AppTheme>(['geometric', 'nouveau'])

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
  nouveau: '#FDF6EA',
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
      version: 1,
      // Existing installs wrote version 0 with this exact shape, so v0 to v1
      // is an identity migration. It exists so the next schema change has a
      // hook instead of a silent reinterpretation of whatever is on disk.
      migrate: (persisted: unknown) => persisted,
    }
  )
)
