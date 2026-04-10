import { useState, useEffect } from 'react';
import { apiPost, apiPut } from '../../hooks/useApi';

const BASE = import.meta.env.VITE_API_URL || '';

interface MyPost {
  content_text: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  post_url: string | null;
}

interface CreatorProfile {
  id?: string;
  linkedin_url: string | null;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
  company: string | null;
  product: string | null;
  positioning: string | null;
  tone_style: string | null;
  my_posts: MyPost[];
  last_fetched_at: string | null;
}

interface Props {
  onSaved?: (profile: CreatorProfile) => void;
}

export default function CreatorProfileForm({ onSaved }: Props) {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkUrl, setLinkUrl] = useState('');
  const [linking, setLinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    company: '',
    product: '',
    positioning: '',
    tone_style: '',
  });

  useEffect(() => {
    fetch(`${BASE}/api/post-creator/profile`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setProfile(data);
          setForm({
            company: data.company || '',
            product: data.product || '',
            positioning: data.positioning || '',
            tone_style: data.tone_style || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    setLinking(true);
    setError('');
    try {
      const result = await apiPost<CreatorProfile>('/api/post-creator/profile/link', {
        linkedin_url: linkUrl.trim(),
      });
      setProfile(result);
      setLinkUrl('');
      onSaved?.(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      const result = await apiPost<CreatorProfile>('/api/post-creator/profile/refresh', {});
      setProfile(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const result = await apiPut<CreatorProfile>('/api/post-creator/profile', form);
      setProfile(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.(result);
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
    <div className="max-w-2xl space-y-6">
      <p className="text-text-secondary text-sm">
        Link your LinkedIn profile so the AI writes posts in your authentic voice. It will fetch your top posts
        and use them — along with your company/product/positioning — to craft content that sounds like you.
      </p>

      {/* LinkedIn link section */}
      {!profile || !profile.linkedin_id ? (
        <form onSubmit={handleLink} className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Link your LinkedIn</h3>
          <div className="flex gap-3 items-start">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/your-username/"
              className="flex-1 px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent text-sm"
            />
            <button
              type="submit"
              disabled={linking || !linkUrl.trim()}
              className="px-5 py-2.5 bg-accent text-bg-primary rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              {linking ? 'Fetching...' : 'Link Profile'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-bg-primary flex items-center justify-center text-text-muted">
                {(profile.name || '?')[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{profile.name || 'Unknown'}</p>
              <p className="text-xs text-text-muted truncate">{profile.headline || '—'}</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {profile.followers_count.toLocaleString()} followers · {profile.my_posts.length} posts loaded
                {profile.last_fetched_at && (
                  <> · updated {new Date(profile.last_fetched_at).toLocaleDateString()}</>
                )}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Posts'}
            </button>
          </div>
        </div>
      )}

      {/* Brand/positioning form */}
      <form onSubmit={handleSave} className="space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Brand & Positioning</h3>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Company</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="e.g. Acme Corp — B2B SaaS for finance teams"
            className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Product</label>
          <textarea
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
            placeholder="What you sell, who it's for, what problem it solves..."
            rows={3}
            className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Positioning</label>
          <textarea
            value={form.positioning}
            onChange={(e) => setForm({ ...form, positioning: e.target.value })}
            placeholder="What do you want people to think of you? What's your unique angle or point of view?"
            rows={3}
            className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Tone & Style</label>
          <textarea
            value={form.tone_style}
            onChange={(e) => setForm({ ...form, tone_style: e.target.value })}
            placeholder="e.g. Direct, data-driven, uses short sentences and line breaks. No jargon. Sometimes sarcastic."
            rows={2}
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
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <span className="text-green-400 text-sm">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
