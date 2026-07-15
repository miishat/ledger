import React, { useRef, useState } from 'react'
import { useThemeStore, type AppTheme } from '../../store/useThemeStore'
import { LayoutGrid, Terminal, Gem, Sparkles, Layers } from 'lucide-react'
import { Sheet } from '../ui/Sheet'

const themeConfig: Record<AppTheme, { name: string; icon: React.ReactNode; color: string }> = {
  geometric: { name: 'Geometric Light', icon: <LayoutGrid size={16} />, color: 'bg-blue-500' },
  tactical: { name: 'Tactical Dark', icon: <Terminal size={16} />, color: 'bg-emerald-500' },
  luxury: { name: 'Luxury Dark', icon: <Gem size={16} />, color: 'bg-amber-500' },
  aurora: { name: 'Aurora Gradient', icon: <Sparkles size={16} />, color: 'bg-emerald-400' },
  glass: { name: 'Glassmorphism', icon: <Layers size={16} />, color: 'bg-cyan-400' },
}

const THEMES: AppTheme[] = ['geometric', 'tactical', 'luxury', 'aurora', 'glass']

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useThemeStore()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const current = themeConfig[theme]

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Theme: ${current.name}`}
        title="Theme"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary/70 border border-border backdrop-blur-md shadow-inner text-text-secondary hover:text-accent transition-colors"
      >
        {current.icon}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        desktop="popover"
        anchorRef={btnRef}
        ariaLabel="Choose theme"
        panelClassName="w-56 max-w-[calc(100vw-1rem)] themed-menu rounded-lg shadow-xl p-2 flex flex-col gap-1"
      >
        <div role="menu" className="flex flex-col gap-1">
          {THEMES.map((t) => {
            const isActive = t === theme
            const config = themeConfig[t]
            return (
              <button
                key={t}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(t)
                  setOpen(false)
                }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-[14px] transition-colors ${
                  isActive ? 'bg-accent/10 text-accent font-medium' : 'text-text-primary hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <span className={isActive ? 'text-accent' : 'text-text-secondary'}>{config.icon}</span>
                {config.name}
                {isActive && <span className={`ml-auto w-1.5 h-1.5 rounded-full ${config.color}`} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </Sheet>
    </div>
  )
}
