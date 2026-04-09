import { useState, useEffect } from 'react';
import { apiPut } from '../../hooks/useApi';

const BASE = import.meta.env.VITE_API_URL || '';

interface CommenterProfile {
  headline: string;
  niche: string;
  expertise: string;
  tone: string;
  objectives: string;
  topics: string[];
}

export default function CommenterProfileForm() {
  const [form, setForm] = useState<CommenterProfile>({
    headline: '',
    niche: '',
    expertise: '',
    tone: 'direct',
    objectives: '',
    topics: [],
  });
  const [topicsInput, setTopicsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/network/profile`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setForm({
            headline: data.headline || '',
            niche: data.niche || '',
            expertise: data.expertise || '',
            tone: data.tone || 'direct',
            objectives: data.objectives || '',
            topics: data.topics || [],
          });
          setTopicsInput((data.topics || []).join(', '));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const topics = topicsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await apiPut('/api/network/profile', { ...form, topics });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-text-muted text-sm">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-5">
      <div>
        <p className="text-text-secondary text-sm mb-6">
          Define your commenter identity. This profile is used by the AI to generate comments that
          sound like you and position you as an expert in your field.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Headline</label>
        <input
          type="text"
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          placeholder="e.g. CEO @ MyStartup | Helping B2B companies scale"
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Niche</label>
        <input
          type="text"
          value={form.niche}
          onChange={(e) => setForm({ ...form, niche: e.target.value })}
          placeholder="e.g. B2B SaaS Growth, Leadership, AI in Marketing"
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Expertise</label>
        <textarea
          value={form.expertise}
          onChange={(e) => setForm({ ...form, expertise: e.target.value })}
          placeholder="Describe your background and what makes your perspective unique..."
          rows={3}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Tone preference</label>
        <div className="flex gap-3 flex-wrap">
          {(['direct', 'provocative', 'empathetic', 'technical'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, tone: t })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors capitalize ${
                form.tone === t
                  ? 'border-accent bg-accent/10 text-accent font-medium'
                  : 'border-border bg-bg-card text-text-secondary hover:border-accent/30'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Objectives</label>
        <textarea
          value={form.objectives}
          onChange={(e) => setForm({ ...form, objectives: e.target.value })}
          placeholder="What do you want people to think of you when they read your comments?"
          rows={2}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Topics you dominate</label>
        <input
          type="text"
          value={topicsInput}
          onChange={(e) => setTopicsInput(e.target.value)}
          placeholder="Comma-separated: Growth hacking, Cold outreach, AI automation"
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
        />
        <p className="text-[11px] text-text-muted mt-1">Separate topics with commas</p>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-bg-primary rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {saved && <span className="text-green-400 text-sm">Saved!</span>}
      </div>
    </form>
  );
}
