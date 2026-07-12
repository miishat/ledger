import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { ThemeBackground } from './theme/ThemeBackground'
import { ThemeSelector } from './theme/ThemeSelector'
import { BackupControls } from './settings/BackupControls'
import { PageTransition } from './ui/PageTransition'
import { UpdateToast } from './ui/UpdateToast'
import { WhatsNewModal } from './ui/WhatsNewModal'
import { CommandPalette } from './CommandPalette'
import { ErrorBoundary } from './ErrorBoundary'
import { LayoutDashboard, Wallet, TrendingUp, PieChart, Calculator } from 'lucide-react'
import { shouldShowWhatsNew, LAST_SEEN_VERSION_KEY } from '../utils/whatsNew'
import { useSWUpdate } from '../hooks/useSWUpdate'

export const Layout: React.FC = () => {
  const { theme } = useThemeStore()
  const location = useLocation()
  const swUpdate = useSWUpdate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(() =>
    shouldShowWhatsNew(localStorage.getItem(LAST_SEEN_VERSION_KEY), __APP_VERSION__)
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, __APP_VERSION__)
  }, [])

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Budgeting', path: '/budget', icon: Wallet },
    { name: 'Investments', path: '/investments', icon: TrendingUp },
    { name: 'Planner', path: '/planner', icon: PieChart },
    { name: 'Compensation', path: '/compensation', icon: Calculator },
  ]

  return (
    <div className="flex h-screen bg-transparent text-text-primary overflow-hidden relative">
      {/* Dynamic Theme Background Decorators */}
      <ThemeBackground theme={theme} />

      {/* Sidebar Navigation */}
      <nav className="hidden md:flex w-64 border-r border-border bg-bg-secondary/70 backdrop-blur-[var(--card-blur)] flex-col justify-between transition-all duration-300 z-10">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tighter text-accent font-display">Ledger</h1>
            <p className="text-sm text-text-secondary mt-1 font-medium">Command Center</p>
          </div>
          
          <div className="px-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                    isActive
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Backup + Theme Dock */}
        <div className="p-4 border-t border-border bg-bg-primary/20 flex flex-col items-center gap-3 pb-6">
          <BackupControls />
          <ThemeSelector />
          <button onClick={() => setWhatsNewOpen(true)} className="text-[11px] text-text-secondary hover:text-accent transition-colors">
            v{__APP_VERSION__} · What's New
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-auto p-4 sm:p-8 pb-20 md:pb-8 relative z-10">
        {/* Mobile Backup + Theme row */}
        <div className="md:hidden flex items-center justify-center flex-wrap gap-3 mb-4">
          <BackupControls />
          <ThemeSelector />
          <button onClick={() => setWhatsNewOpen(true)} className="text-[11px] text-text-secondary hover:text-accent transition-colors">
            v{__APP_VERSION__} · What's New
          </button>
        </div>
        <ErrorBoundary key={location.pathname}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </ErrorBoundary>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-border flex"
        style={{ backgroundColor: 'var(--dropdown-bg)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <UpdateToast needRefresh={swUpdate.needRefresh} onRefresh={swUpdate.refresh} />
      <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
