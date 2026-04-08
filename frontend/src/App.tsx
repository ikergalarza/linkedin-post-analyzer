import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CreatorDetail from './pages/CreatorDetail'
import OutlierExplorer from './pages/OutlierExplorer'

export default function App() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-accent">
            LinkedIn Outlier Analyzer
          </Link>
          <div className="flex gap-6 text-sm">
            <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors">Dashboard</Link>
            <Link to="/explore" className="text-text-secondary hover:text-text-primary transition-colors">Explorer</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/creator/:id" element={<CreatorDetail />} />
          <Route path="/explore" element={<OutlierExplorer />} />
        </Routes>
      </main>
    </div>
  )
}
