import { lazy, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useThemeStore } from './store/useThemeStore'
import { Layout } from './components/Layout'

// Dashboard is the index route, so it stays in the entry chunk: lazy-loading it
// would only add a round trip before first paint. Every other page is a
// separate chunk, fetched when the user first navigates to it.
import { Dashboard } from './pages/Dashboard'

const Budgeting = lazy(() => import('./pages/Budgeting').then((m) => ({ default: m.Budgeting })))
const Investments = lazy(() => import('./pages/Investments').then((m) => ({ default: m.Investments })))
const Planner = lazy(() => import('./pages/Planner').then((m) => ({ default: m.Planner })))
const PlannerTool = lazy(() => import('./pages/PlannerTool').then((m) => ({ default: m.PlannerTool })))
const Compensation = lazy(() => import('./pages/Compensation').then((m) => ({ default: m.Compensation })))

function App() {
  const { theme } = useThemeStore()

  // Apply theme to html root element for Tailwind dark mode and global CSS variables
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    
    if (theme === 'geometric') {
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
    }
  }, [theme])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="budget" element={<Budgeting />} />
          <Route path="investments" element={<Investments />} />
          <Route path="planner" element={<Planner />} />
          <Route path="planner/income-tax" element={<Navigate to="/planner/salary-tax" replace />} />
          <Route path="planner/take-home-pay" element={<Navigate to="/planner/salary-tax" replace />} />
          <Route path="planner/:toolId" element={<PlannerTool />} />
          <Route path="projections" element={<Navigate to="/planner" replace />} />
          <Route path="compensation" element={<Compensation />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
