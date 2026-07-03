import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useThemeStore } from './store/useThemeStore'
import { Layout } from './components/Layout'

import { Dashboard } from './pages/Dashboard'
import { Budgeting } from './pages/Budgeting'
import { Investments } from './pages/Investments'
import { Planner } from './pages/Planner'
import { PlannerTool } from './pages/PlannerTool'
import { Compensation } from './pages/Compensation'

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
          <Route path="planner/:toolId" element={<PlannerTool />} />
          <Route path="projections" element={<Navigate to="/planner" replace />} />
          <Route path="compensation" element={<Compensation />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
