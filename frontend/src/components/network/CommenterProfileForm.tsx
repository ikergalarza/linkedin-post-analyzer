import { useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

interface CommenterProfile {
  headline: string;
  voice_style: string;
  worldview: string;
  signature_moves: string;
  avoid: string;
}

interface ProfileRow extends CommenterProfile {
  id?: string;
  name: string;
}

const EMPTY: CommenterProfile = {
  headline: '',
  voice_style: '',
  worldview: '',
  signature_moves: '',
  avoid: '',
};

const DEFAULT_PROFILES = ['Iker', 'Unai'];

export default function CommenterProfileForm() {
  const [profiles, setProfiles] = useState<Record<string, CommenterProfile>>({
    Iker: { ...EMPTY },
    Unai: { ...EMPTY },
  });
  const [activeName, setActiveName] = useState<string>('Iker');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/network/profiles`)
      .then((r) => r.json())
      .then((rows: ProfileRow[]) => {
        const next: Record<string, CommenterProfile> = { Iker: { ...EMPTY }, Unai: { ...EMPTY } };
        for (const row of rows || []) {
          if (!row || !row.name) continue;
          next[row.name] = {
            headline: row.headline || '',
            voice_style: row.voice_style || '',
            worldview: row.worldview || '',
            signature_moves: row.signature_moves || '',
            avoid: row.avoid || '',
          };
        }
        setProfiles(next);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = profiles[activeName] || EMPTY;

  const set = (k: keyof CommenterProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProfiles((prev) => ({
      ...prev,
      [activeName]: { ...(prev[activeName] || EMPTY), [k]: e.target.value },
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`${BASE}/api/network/profiles/${encodeURIComponent(activeName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(active),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-text-muted text-sm">Loading...</div>;

  const profileNames = Array.from(new Set([...DEFAULT_PROFILES, ...Object.keys(profiles)]));

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <p className="text-text-secondary text-sm">
        Define <strong className="text-text-primary">how you comment</strong>, not what about. AI will use your voice and
        worldview to generate comments that spark debate.
      </p>

      {/* Profile selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted font-medium">Editing profile:</span>
        {profileNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveName(name)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              activeName === name
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-border text-text-muted hover:border-accent/30'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Who you are <span className="text-text-muted font-normal">(shown in comments)</span>
        </label>
        <input
          type="text"
          value={active.headline}
          onChange={set('headline')}
          placeholder="ej. Founder @Neety · B2B Sales"
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
        />
      </div>

      {/* Voice style */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Your writing style
        </label>
        <textarea
          value={active.voice_style}
          onChange={set('voice_style')}
          rows={3}
          placeholder={`Describe how you write, not what about.\n\ne.g. "Direct and to the point. Short sentences. I prefer data over opinions. Always first person. Never condescending."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          Rhythm, tone, sentence structure, data vs. opinion, first/third person…
        </p>
      </div>

      {/* Worldview */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Your worldview <span className="text-text-muted font-normal">(the lens through which you see things)</span>
        </label>
        <textarea
          value={active.worldview}
          onChange={set('worldview')}
          rows={3}
          placeholder={`e.g. "I think most B2B sales advice is wrong because it ignores positioning. I believe SDRs aren't dying — they're evolving. I'm skeptical of AI hype but optimistic about real applications."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          The angle from which you analyze any topic — regardless of the specific post subject.
        </p>
      </div>

      {/* Signature moves */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Your signature commenting moves
        </label>
        <textarea
          value={active.signature_moves}
          onChange={set('signature_moves')}
          rows={3}
          placeholder={`e.g. "I usually cite a specific number from my experience. I like to flip the main argument. I end with a provocative open question. Sometimes I share what the post is missing."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          Patterns you repeat: how you open, how you close, what kind of value you add.
        </p>
      </div>

      {/* Avoid */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          What you never do
        </label>
        <textarea
          value={active.avoid}
          onChange={set('avoid')}
          rows={2}
          placeholder={`e.g. "I never say 'great post'. I never self-promote directly. I never ask basic questions. I avoid being condescending or using corporate jargon."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-bg-primary rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : `Save ${activeName}`}
        </button>
        {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
      </div>
    </form>
  );
}
