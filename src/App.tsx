import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useThemeStore } from './store/useThemeStore'
import { Layout } from './components/Layout'

// Placeholder components for future phases
const Dashboard = () => (
  <div className="flex h-full items-center justify-center border-2 border-dashed border-border rounded-xl">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-2">Master Dashboard</h2>
      <p className="text-text-secondary">Phase 2: Bento Grid Layout coming soon</p>
    </div>
  </div>
)

const Budgeting = () => <div className="p-4"><h2 className="text-2xl font-bold">Budgeting Module</h2></div>
const Investments = () => <div className="p-4"><h2 className="text-2xl font-bold">Investment Tracker</h2></div>
const Projections = () => <div className="p-4"><h2 className="text-2xl font-bold">Future Projections</h2></div>
const Compensation = () => <div className="p-4"><h2 className="text-2xl font-bold">Total Compensation</h2></div>

function App() {
  const { theme } = useThemeStore()

  // Apply theme to html root element for Tailwind dark mode and global CSS variables
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'tactical') {
      root.setAttribute('data-theme', 'tactical')
      root.classList.add('dark')
    } else {
      root.removeAttribute('data-theme')
      root.classList.remove('dark')
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
