import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CreatorDetail from './pages/CreatorDetail'
import OutlierExplorer from './pages/OutlierExplorer'
import PostCreator from './pages/PostCreator'
import StrategicNetwork from './pages/StrategicNetwork'
import Discover from './pages/Discover'
import Ideas from './pages/Ideas'
import Inspiration from './pages/Inspiration'

export default function App() {
  const location = useLocation();
  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-2 py-1 rounded-md transition-colors text-xs whitespace-nowrap ${active ? 'text-accent font-medium bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}
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
          <div className="flex items-center gap-1 text-sm">
            {/* Analyze */}
            <div className="flex gap-1 px-2 py-1 rounded-lg bg-bg-secondary/50">
              {navLink('/', '📊 Dashboard')}
              {navLink('/explore', '🔍 Explorer')}
              {navLink('/discover', '🧭 Discover')}
            </div>
            <span className="text-border mx-1">|</span>
            {/* Create */}
            <div className="flex gap-1 px-2 py-1 rounded-lg bg-bg-secondary/50">
              {navLink('/ideas', '💡 Ideas')}
              {navLink('/inspiration', '✨ Inspiration')}
              {navLink('/create', '✍️ Post Creator')}
            </div>
            <span className="text-border mx-1">|</span>
            {/* Engage */}
            <div className="flex gap-1 px-2 py-1 rounded-lg bg-bg-secondary/50">
              {navLink('/network', '🤝 Network')}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/creator/:id" element={<CreatorDetail />} />
          <Route path="/explore" element={<OutlierExplorer />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/inspiration" element={<Inspiration />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/network" element={<StrategicNetwork />} />
          <Route path="/create" element={<PostCreator />} />
        </Routes>
      </main>
    </div>
  )
}
