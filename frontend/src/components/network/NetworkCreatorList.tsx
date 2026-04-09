import { apiPatch, apiDelete } from '../../hooks/useApi';

interface NetworkCreator {
  id: string;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  tier: number;
  followers_count: number;
  last_fetched_at: string | null;
}

const TIER_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', label: 'Tier 1 — Always' },
  2: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', label: 'Tier 2 — Regular' },
  3: { bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-400', label: 'Tier 3 — Selective' },
};

interface Props {
  creators: NetworkCreator[];
  onUpdate: () => void;
}

export default function NetworkCreatorList({ creators, onUpdate }: Props) {
  const handleTierChange = async (id: string, newTier: number) => {
    try {
      await apiPatch(`/api/network/creators/${id}`, { tier: newTier });
      onUpdate();
    } catch (err: any) {
      console.error('Failed to update tier:', err);
    }
  };

  const handleDelete = async (id: string, name: string | null) => {
    if (!confirm(`Remove ${name || 'this creator'} from your network?`)) return;
    try {
      await apiDelete(`/api/network/creators/${id}`);
      onUpdate();
    } catch (err: any) {
      console.error('Failed to delete:', err);
    }
  };

  if (creators.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        No strategic creators yet. Add LinkedIn profiles above to start building your network.
      </div>
    );
  }

  // Group by tier
  const grouped = [1, 2, 3].map((tier) => ({
    tier,
    style: TIER_STYLES[tier],
    items: creators.filter((c) => c.tier === tier),
  }));

  return (
    <div className="space-y-6">
      {grouped
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <div key={group.tier}>
            <h3 className={`text-sm font-medium mb-3 ${group.style.text}`}>
              {group.style.label} ({group.items.length})
            </h3>
            <div className="grid gap-2">
              {group.items.map((creator) => (
                <div
                  key={creator.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${group.style.bg}`}
                >
                  {creator.profile_image_url ? (
                    <img
                      src={creator.profile_image_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-bg-card flex items-center justify-center text-text-muted text-sm flex-shrink-0">
                      {(creator.name || '?')[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {creator.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {creator.headline || '—'}
                      {creator.followers_count > 0 && (
                        <span className="ml-2">{creator.followers_count.toLocaleString()} followers</span>
                      )}
                    </p>
                  </div>

                  <select
                    value={creator.tier}
                    onChange={(e) => handleTierChange(creator.id, parseInt(e.target.value))}
                    className="px-2 py-1 bg-bg-primary border border-border rounded text-xs text-text-secondary focus:outline-none"
                  >
                    <option value={1}>Tier 1</option>
                    <option value={2}>Tier 2</option>
                    <option value={3}>Tier 3</option>
                  </select>

                  <button
                    onClick={() => handleDelete(creator.id, creator.name)}
                    className="text-text-muted hover:text-danger transition-colors text-xs px-2"
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
