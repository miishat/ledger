import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { ThemeBackground } from './theme/ThemeBackground'
import { SettingsSheet } from './settings/SettingsSheet'
import { PageTransition } from './ui/PageTransition'
import { UpdateToast } from './ui/UpdateToast'
import { WhatsNewModal } from './ui/WhatsNewModal'
import { CommandPalette } from './CommandPalette'
import { ErrorBoundary } from './ErrorBoundary'
import { LayoutDashboard, Wallet, TrendingUp, Briefcase, Calculator, Settings, Search } from 'lucide-react'
import { LedgerMark } from './ui/LedgerMark'
import { shouldShowWhatsNew, LAST_SEEN_VERSION_KEY } from '../utils/whatsNew'
import { useSWUpdate } from '../hooks/useSWUpdate'
import { DisclaimerModal } from './ui/DisclaimerModal'
import { DISCLAIMER_ACK_KEY } from '../utils/disclaimer'

export const Layout: React.FC = () => {
  const { theme } = useThemeStore()
  const location = useLocation()
  const swUpdate = useSWUpdate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Captured once at mount: the last-seen-version effect below overwrites the key.
  const [shouldShowNews] = useState(() =>
    shouldShowWhatsNew(localStorage.getItem(LAST_SEEN_VERSION_KEY), __APP_VERSION__)
  )
  const [disclaimerAcked, setDisclaimerAcked] = useState(() => localStorage.getItem(DISCLAIMER_ACK_KEY) !== null)
  const [disclaimerOpen, setDisclaimerOpen] = useState(!disclaimerAcked)
  // What's New waits until the disclaimer has been acknowledged.
  const [whatsNewOpen, setWhatsNewOpen] = useState(shouldShowNews && disclaimerAcked)

  const closeDisclaimer = () => {
    setDisclaimerOpen(false)
    if (!disclaimerAcked) {
      localStorage.setItem(DISCLAIMER_ACK_KEY, new Date().toISOString())
      setDisclaimerAcked(true)
      if (shouldShowNews) setWhatsNewOpen(true)
    }
  }

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

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Budgeting', path: '/budget', icon: Wallet },
    { name: 'Investments', path: '/investments', icon: TrendingUp },
    { name: 'Planner', path: '/planner', icon: Calculator },
    { name: 'Compensation', path: '/compensation', icon: Briefcase },
  ]

  return (
    <div className="flex h-dvh bg-transparent text-text-primary overflow-hidden relative">
      {/* Dynamic Theme Background Decorators */}
      <ThemeBackground theme={theme} />

      {/* Sidebar Navigation */}
      <nav className="hidden md:flex w-64 border-r border-border bg-bg-secondary/70 backdrop-blur-[var(--card-blur)] flex-col justify-between transition-all duration-300 z-10">
        <div>
          <div className="p-6 pb-3 flex items-center gap-2.5">
            <LedgerMark size={26} className="text-accent shrink-0" />
            <h1 className="text-2xl font-bold tracking-tighter text-accent font-display">Ledger</h1>
          </div>

          <div className="px-4">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Search className="w-4 h-4" /> Search
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-border text-text-secondary/80">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
            </button>
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
                      ? 'bg-accent/10 text-accent font-semibold border-l-2 border-accent rounded-l-none'
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

        {/* Settings Dock */}
        <div className="p-4 border-t border-border bg-bg-primary/20 flex items-center justify-between">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary/50 transition-colors"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            onClick={() => setWhatsNewOpen(true)}
            title="What's New"
            aria-label={`Version ${__APP_VERSION__}. Open What's New`}
            className="text-[11px] text-text-secondary/70 hover:text-accent transition-colors pr-2"
          >
            v{__APP_VERSION__}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-auto overflow-x-hidden px-4 pt-4 sm:px-8 sm:pt-8 relative z-10 pb-[calc(52px+env(safe-area-inset-bottom)+16px)] md:pb-8">
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
              className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-[52px] text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="max-w-full truncate px-0.5">{item.name}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-[52px] text-[10px] font-medium text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <Settings className="w-5 h-5" />
          <span className="max-w-full truncate px-0.5">Settings</span>
        </button>
      </nav>

      <UpdateToast needRefresh={swUpdate.needRefresh} onRefresh={swUpdate.refresh} />
      <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} onOpenDisclaimer={() => setDisclaimerOpen(true)} swUpdate={swUpdate} />
      <DisclaimerModal isOpen={disclaimerOpen} requireAck={!disclaimerAcked} onClose={closeDisclaimer} />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenWhatsNew={() => setWhatsNewOpen(true)}
        onOpenDisclaimer={() => setDisclaimerOpen(true)}
      />
    </div>
  )
}
