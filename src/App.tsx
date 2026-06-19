import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useThemeStore } from './store/useThemeStore'
import { Layout } from './components/Layout'

import { Dashboard } from './pages/Dashboard'
import { Budgeting } from './pages/Budgeting'
import { Investments } from './pages/Investments'
import { Projections } from './pages/Projections'
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="budget" element={<Budgeting />} />
          <Route path="investments" element={<Investments />} />
          <Route path="projections" element={<Projections />} />
          <Route path="compensation" element={<Compensation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
