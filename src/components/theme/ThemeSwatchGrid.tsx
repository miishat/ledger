import React from 'react'
import { Check } from 'lucide-react'
import { useThemeStore, type AppTheme } from '../../store/useThemeStore'

// Swatch colors mirror each theme's --bg-primary / --accent in index.css.
// headerBg is a neutral "app header" tone one step off the theme bg.
const SWATCHES: Record<AppTheme, { name: string; bg: string; accent: string; headerBg: string; light?: boolean }> = {
  geometric: { name: 'Geometric Light', bg: '#ffffff', accent: '#3b82f6', headerBg: '#f3f4f6', light: true },
  tactical: { name: 'Tactical Dark', bg: '#0a0a0a', accent: '#10b981', headerBg: '#1a1a1a' },
  luxury: { name: 'Luxury Dark', bg: '#000000', accent: '#d4a853', headerBg: '#151515' },
  aurora: { name: 'Aurora Gradient', bg: '#090d16', accent: '#34d399', headerBg: '#111827' },
  glass: { name: 'Glassmorphism', bg: '#0b0910', accent: '#22d3ee', headerBg: '#17141f' },
}

const THEMES = Object.keys(SWATCHES) as AppTheme[]

// One sparkline shape per slot so adjacent tiles don't look copy-pasted.
const SPARKLINES = [
  '0,14 12,10 24,12 36,6 48,8 60,2',
  '0,12 12,14 24,8 36,10 48,4 60,6',
  '0,10 12,6 24,12 36,4 48,10 60,3',
  '0,13 12,9 24,11 36,5 48,9 60,4',
  '0,12 12,8 24,13 36,6 48,9 60,3',
]

/** Always-visible theme picker: each tile is a tiny caricature of the app
 *  (logo chip, header bar, sparkline) drawn in that theme's own colors. */
export const ThemeSwatchGrid: React.FC = () => {
  const { theme, setTheme } = useThemeStore()
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {THEMES.map((t, i) => {
        const s = SWATCHES[t]
        const isActive = t === theme
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(t)}
            className={`rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              isActive ? 'border-accent' : 'border-border hover:border-accent/50'
            }`}
            style={{ backgroundColor: s.bg }}
          >
            <span className="flex items-center gap-1 mb-1.5" aria-hidden="true">
              <span
                className="w-3.5 h-3.5 rounded-[3px] border shrink-0"
                style={{ backgroundColor: `${s.accent}22`, borderColor: s.accent }}
              />
              <span className="flex-1 h-3.5 rounded-[3px]" style={{ backgroundColor: s.headerBg }} />
            </span>
            <svg viewBox="0 0 60 16" preserveAspectRatio="none" className="w-full h-4 mb-1.5" aria-hidden="true">
              <polyline points={SPARKLINES[i]} fill="none" stroke={s.accent} strokeWidth="1.5" />
            </svg>
            <span
              className="flex items-center justify-between gap-1 text-[12px] font-medium"
              style={{ color: s.light ? '#1f2937' : '#e5e7eb' }}
            >
              {s.name}
              {isActive && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: s.accent }} aria-hidden="true" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
