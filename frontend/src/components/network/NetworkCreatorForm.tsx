import { useState } from 'react';
import { apiPost } from '../../hooks/useApi';

interface Props {
  onCreated: () => void;
}

export default function NetworkCreatorForm({ onCreated }: Props) {
  const [url, setUrl] = useState('');
  const [tier, setTier] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    try {
      await apiPost('/api/network/creators', { linkedin_url: url.trim(), tier });
      setUrl('');
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-start">
      <div className="flex-1">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/username/"
          className="w-full px-4 py-3 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors text-sm"
        />
        {error && <p className="text-danger text-sm mt-1">{error}</p>}
      </div>
      <select
        value={tier}
        onChange={(e) => setTier(parseInt(e.target.value))}
        className="px-3 py-3 bg-bg-card border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
      >
        <option value={1}>Tier 1</option>
        <option value={2}>Tier 2</option>
        <option value={3}>Tier 3</option>
      </select>
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="px-6 py-3 bg-accent hover:bg-accent-light text-bg-primary font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap text-sm"
      >
        {loading ? 'Adding...' : 'Add Creator'}
      </button>
    </form>
  );
}
