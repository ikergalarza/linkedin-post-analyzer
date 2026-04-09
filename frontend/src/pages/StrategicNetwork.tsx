import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import WeeklyFeed from '../components/network/WeeklyFeed';
import NetworkCreatorForm from '../components/network/NetworkCreatorForm';
import NetworkCreatorList from '../components/network/NetworkCreatorList';
import CommenterProfileForm from '../components/network/CommenterProfileForm';

type Tab = 'feed' | 'creators' | 'profile';

export default function StrategicNetwork() {
  const [tab, setTab] = useState<Tab>('feed');
  const { data: creators, refetch: refetchCreators } = useApi<any[]>('/api/network/creators');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'feed', label: 'Weekly Feed' },
    { key: 'creators', label: `Creators${creators ? ` (${creators.length})` : ''}` },
    { key: 'profile', label: 'My Profile' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Strategic Network</h1>
        <p className="text-text-secondary text-sm">
          Track key LinkedIn creators, get AI-generated comments designed to make you visible,
          and systematically build your presence in their conversations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'feed' && <WeeklyFeed />}

      {tab === 'creators' && (
        <div className="space-y-6">
          <NetworkCreatorForm onCreated={refetchCreators} />
          <NetworkCreatorList creators={creators || []} onUpdate={refetchCreators} />
        </div>
      )}

      {tab === 'profile' && <CommenterProfileForm />}
    </div>
  );
}
