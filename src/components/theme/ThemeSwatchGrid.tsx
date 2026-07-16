import React from 'react'
import { Check } from 'lucide-react'
import { useThemeStore, type AppTheme } from '../../store/useThemeStore'

// Swatch colors mirror each theme's --bg-primary / --accent in index.css.
const SWATCHES: Record<AppTheme, { name: string; bg: string; accent: string; light?: boolean }> = {
  geometric: { name: 'Geometric Light', bg: '#ffffff', accent: '#3b82f6', light: true },
  tactical: { name: 'Tactical Dark', bg: '#0a0a0a', accent: '#10b981' },
  luxury: { name: 'Luxury Dark', bg: '#000000', accent: '#d4a853' },
  aurora: { name: 'Aurora Gradient', bg: '#090d16', accent: '#34d399' },
  glass: { name: 'Glassmorphism', bg: '#0b0910', accent: '#22d3ee' },
}

const THEMES = Object.keys(SWATCHES) as AppTheme[]

/** Always-visible theme picker: one preview card per theme. */
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
            <span className="block h-1.5 rounded-full mb-2" style={{ backgroundColor: s.accent }} aria-hidden="true" />
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
