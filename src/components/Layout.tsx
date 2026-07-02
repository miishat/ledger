import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { ThemeBackground } from './theme/ThemeBackground'
import { ThemeSelector } from './theme/ThemeSelector'
import { BackupControls } from './settings/BackupControls'
import { LayoutDashboard, Wallet, TrendingUp, PieChart, Calculator } from 'lucide-react'

export const Layout: React.FC = () => {
  const { theme } = useThemeStore()
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Budgeting', path: '/budget', icon: Wallet },
    { name: 'Investments', path: '/investments', icon: TrendingUp },
    { name: 'Projections', path: '/projections', icon: PieChart },
    { name: 'Compensation', path: '/compensation', icon: Calculator },
  ]

  return (
    <div className="flex h-screen bg-transparent text-text-primary overflow-hidden relative">
      {/* Dynamic Theme Background Decorators */}
      <ThemeBackground theme={theme} />

      {/* Sidebar Navigation */}
      <nav className="w-64 border-r border-border bg-bg-secondary/70 backdrop-blur-[var(--card-blur)] flex flex-col justify-between transition-all duration-300 z-10">
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
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
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
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-auto p-4 sm:p-8 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
