import React from 'react'
import { Check } from 'lucide-react'
import { useThemeStore, type AppTheme } from '../../store/useThemeStore'
import { SWATCHES } from './themeSwatches'

const THEMES = Object.keys(SWATCHES) as AppTheme[]

/** Always-visible theme picker: each tile is a tiny caricature of the app
 *  (logo chip, header bar, sparkline) drawn in that theme's own colors. */
export const ThemeSwatchGrid: React.FC = () => {
  const { theme, setTheme } = useThemeStore()
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {THEMES.map((t) => {
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
              <polyline points={s.spark} fill="none" stroke={s.accent} strokeWidth="1.5" />
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
