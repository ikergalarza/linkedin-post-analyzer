import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CreatorDetail from './pages/CreatorDetail'
import OutlierExplorer from './pages/OutlierExplorer'
import PostCreator from './pages/PostCreator'
import StrategicNetwork from './pages/StrategicNetwork'
import Discover from './pages/Discover'

export default function App() {
  const location = useLocation();
  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`transition-colors ${active ? 'text-accent font-medium' : 'text-text-secondary hover:text-text-primary'}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-accent">
            LinkedIn Outlier Analyzer
          </Link>
          <div className="flex gap-6 text-sm">
            {navLink('/', 'Dashboard')}
            {navLink('/explore', 'Explorer')}
            {navLink('/discover', 'Discover')}
            {navLink('/network', 'Network')}
            {navLink('/create', 'Post Creator')}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/creator/:id" element={<CreatorDetail />} />
          <Route path="/explore" element={<OutlierExplorer />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/network" element={<StrategicNetwork />} />
          <Route path="/create" element={<PostCreator />} />
        </Routes>
      </main>
    </div>
  )
}
