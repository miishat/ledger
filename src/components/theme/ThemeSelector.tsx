import React from 'react'
import { useThemeStore, type AppTheme } from '../../store/useThemeStore'
import { LayoutGrid, Terminal, Gem, Sparkles, Layers } from 'lucide-react'

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

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-inner transition-all duration-300">
      {THEMES.map((t) => {
        const isActive = t === theme
        const config = themeConfig[t]
        
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`
              relative group flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
              ${isActive ? 'bg-white dark:bg-white/10 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}
            `}
            aria-label={config.name}
            title={config.name}
          >
            <div className={`
              transition-colors duration-300
              ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}
            `}>
              {config.icon}
            </div>
            
            {/* Active Indicator dot */}
            {isActive && (
              <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${config.color} shadow-[0_0_8px_rgba(var(--color-accent),0.5)]`} />
            )}
            
            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
              <div className="bg-gray-900 dark:bg-black text-white text-xs font-medium py-1 px-2 rounded whitespace-nowrap shadow-xl border border-white/10">
                {config.name}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
