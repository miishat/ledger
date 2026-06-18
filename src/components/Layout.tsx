import { Outlet, Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { LayoutDashboard, Wallet, TrendingUp, PieChart, Calculator, Moon, Sun } from 'lucide-react'

export const Layout = () => {
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Budgeting', path: '/budget', icon: Wallet },
    { name: 'Investments', path: '/investments', icon: TrendingUp },
    { name: 'Projections', path: '/projections', icon: PieChart },
    { name: 'Compensation', path: '/compensation', icon: Calculator },
  ]

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden transition-colors duration-300">
      {/* Sidebar Navigation */}
      <nav className="w-64 border-r border-border bg-bg-secondary flex flex-col justify-between transition-colors duration-300">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tighter text-accent">Ledger</h1>
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
                      ? 'bg-accent/10 text-accent' 
                      : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-border">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between px-4 py-3 rounded-lg bg-bg-primary hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
          >
            <span className="font-medium text-sm">
              {theme === 'tactical' ? 'Tactical Mode' : 'Geometric Mode'}
            </span>
            {theme === 'tactical' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-8 relative">
        <Outlet />
      </main>
    </div>
  )
}
