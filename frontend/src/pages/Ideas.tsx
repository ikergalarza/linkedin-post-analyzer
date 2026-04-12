import { useState, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { scorePost } from '../components/postcreator/PostChecklist';

const BASE = import.meta.env.VITE_API_URL || '';

interface ArchetypeVariant {
  archetype_key: string;
  archetype_label: string;
  archetype_desc: string;
  hook_type: string;
  post_structure: string;
  avg_ratio: number;
  text: string;
}

interface PostIdea {
  id: string;
  raw_content: string;
  source_type: 'manual' | 'book_quote' | 'demo_moment' | 'observation' | 'meeting';
  tags: string[];
  generated_post: string | null;
  generation_score: number | null;
  generated_variants: ArchetypeVariant[] | null;
  status: 'draft' | 'generating' | 'ready';
  created_at: string;
}

const SOURCE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  manual:      { icon: '💡', label: 'Idea',        color: 'text-accent bg-accent/10' },
  book_quote:  { icon: '📚', label: 'Book',        color: 'text-purple-400 bg-purple-400/10' },
  demo_moment: { icon: '🎯', label: 'Demo',        color: 'text-blue-400 bg-blue-400/10' },
  observation: { icon: '👁️', label: 'Observation', color: 'text-amber-400 bg-amber-400/10' },
  meeting:     { icon: '🤝', label: 'Meeting',     color: 'text-green-400 bg-green-400/10' },
};

const ARCHETYPE_COLORS = [
  { border: 'border-accent/30', bg: 'bg-accent/5', badge: 'bg-accent/15 text-accent', btn: 'bg-accent text-bg-primary hover:bg-accent-light' },
  { border: 'border-purple-400/30', bg: 'bg-purple-400/5', badge: 'bg-purple-400/15 text-purple-400', btn: 'bg-purple-500/80 text-white hover:bg-purple-500' },
  { border: 'border-blue-400/30', bg: 'bg-blue-400/5', badge: 'bg-blue-400/15 text-blue-400', btn: 'bg-blue-500/80 text-white hover:bg-blue-500' },
];

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-danger';
}

// ─── Voice capture ────────────────────────────────────────────────────────────
function useVoiceCapture(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Your browser does not support voice dictation. Use Chrome on mobile.'); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = navigator.language || 'es-ES';
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
      onResult(t);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const stop = () => { recognitionRef.current?.stop(); setListening(false); };
  return { listening, start, stop };
}

// ─── Post editor with auto-improve ───────────────────────────────────────────
function PostEditor({ ideaId, initialText, initialScore, onSave }: {
  ideaId: string;
  initialText: string;
  initialScore: number;
  onSave: (text: string, score: number) => void;
}) {
  const [postText, setPostText] = useState(initialText);
  const [score, setScore] = useState(initialScore);
  const [improving, setImproving] = useState(false);
  const [iterLog, setIterLog] = useState<{ iter: number; score: number; accepted: boolean }[]>([]);
  const [copied, setCopied] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleAutoImprove = async () => {
    setImproving(true);
    setIterLog([]);
    setErrMsg(null);

    const originalText = postText;
    let bestText = postText;
    let bestScore = scorePost(postText).overall;
    const conversation: { role: 'user' | 'assistant'; content: string }[] = [];

    try {
      for (let i = 1; i <= 5; i++) {
        if (bestScore >= 80) break;

        const score = scorePost(bestText);
        const { failing } = score;
        const passingLabels = Object.values(score.byCategory)
          .flatMap((cat: any) => cat.items.filter((c: any) => c.passed).map((c: any) => `- ${c.item.label}`))
          .join('\n');
        const failingList = (failing as any[])
          .slice(0, 12)
          .map((f: any) => `- ${f.label}${f.hint ? ' → ' + f.hint : ''}`)
          .join('\n');

        let userContent: string;
        if (i === 1) {
          userContent =
            `ORIGINAL POST (the idea, topic, and data CANNOT change):\n${originalText}\n\n` +
            `VERSION TO IMPROVE (score: ${score.overall}/100):\n${bestText}\n\n` +
            `PASSING CHECKS ✓ — DO NOT break these:\n${passingLabels || 'none'}\n\n` +
            `FAILING CHECKS ✗ — improve ONLY structure, formatting, and viral mechanics:\n${failingList}\n\n` +
            `Improve only structure and formatting. The idea, topic, and data from the original post must remain intact. ` +
            `Return CRITIQUE: + --- + improved post.`;
        } else {
          userContent =
            `BEST VERSION SO FAR (score: ${score.overall}/100):\n${bestText}\n\n` +
            `PASSING CHECKS ✓ — DO NOT break these:\n${passingLabels || 'none'}\n\n` +
            `STILL FAILING CHECKS ✗ — use DIFFERENT structural techniques than before:\n${failingList}\n\n` +
            `Remember: same idea, same data from the original post, only improve the form. Read your previous CRITIQUE and apply it. ` +
            `Return CRITIQUE: + --- + improved post.`;
        }

        conversation.push({ role: 'user', content: userContent });

        let newText = '';
        let rawForConversation = '';
        try {
          const resp = await fetch(`${BASE}/api/chat/improve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversation }),
          });
          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            setErrMsg(errData.error || `Server error: ${resp.status}`);
            break;
          }
          const data = await resp.json();
          newText = (data.text || '').trim();
          rawForConversation = (data.raw || '').trim();
        } catch (e: any) {
          setErrMsg(e.message); break;
        }

        if (!newText) { setErrMsg('AI returned empty response'); break; }

        const newScore = scorePost(newText).overall;

        if (newScore > bestScore) {
          bestText = newText;
          bestScore = newScore;
          conversation.push({ role: 'assistant', content: rawForConversation });
          setIterLog((prev) => [...prev, { iter: i, score: newScore, accepted: true }]);
        } else {
          conversation.push({
            role: 'assistant',
            content: `${rawForConversation}\n\n[SYSTEM NOTE: scored ${newScore}/100 — lower than best ${bestScore}/100. Rejected.]`,
          });
          setIterLog((prev) => [...prev, { iter: i, score: newScore, accepted: false }]);
        }

        setPostText(bestText);
        setScore(bestScore);
      }
    } finally {
      setImproving(false);
    }

    // Save final result
    try {
      await fetch(`${BASE}/api/ideas/${ideaId}/save-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_post: bestText, generation_score: bestScore }),
      });
      onSave(bestText, bestScore);
    } catch {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 mt-4">
      <textarea
        value={postText}
        onChange={(e) => {
          setPostText(e.target.value);
          setScore(scorePost(e.target.value).overall);
        }}
        className="w-full bg-bg-secondary border border-border rounded-lg p-3 text-sm text-text-primary resize-none focus:outline-none focus:border-accent"
        rows={12}
      />

      {/* Score bar */}
      <div className="flex items-center gap-3">
        <span className={`text-lg font-bold tabular-nums ${scoreColor(score)}`}>{score}/100</span>
        <div className="flex-1 bg-bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${score}%`,
              backgroundColor: score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171',
            }}
          />
        </div>
        {score >= 80 && <span className="text-green-400 text-xs font-medium">✓ Ready</span>}
      </div>

      {/* Iteration log */}
      {iterLog.length > 0 && (
        <div className="space-y-0.5 text-[11px]">
          {iterLog.map((log) => (
            <div key={log.iter} className="flex items-center gap-2">
              <span className={log.accepted ? 'text-green-400' : 'text-danger'}>{log.accepted ? '✓' : '✗'}</span>
              <span className="text-text-muted">
                Iter {log.iter}: {log.score}/100 {log.accepted ? '(accepted)' : '(rejected)'}
              </span>
            </div>
          ))}
        </div>
      )}

      {errMsg && <p className="text-danger text-xs">{errMsg}</p>}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleAutoImprove}
          disabled={improving || score >= 80}
          className="flex-1 py-2 bg-accent text-bg-primary rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-accent-light transition-colors"
        >
          {improving
            ? `Improving… (${iterLog.length}/5)`
            : score >= 80 ? '✓ Score ≥ 80' : '⚡ Auto-improve to 80 (5 iter.)'}
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-bg-secondary border border-border text-text-secondary rounded-lg text-xs hover:border-accent/40 hover:text-text-primary transition-colors"
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ─── Idea card ────────────────────────────────────────────────────────────────
function IdeaCard({ idea, onUpdate, onDelete }: {
  idea: PostIdea;
  onUpdate: (id: string, data: Partial<PostIdea>) => void;
  onDelete: (id: string) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<ArchetypeVariant[]>(idea.generated_variants || []);
  const [selectedVariant, setSelectedVariant] = useState<ArchetypeVariant | null>(
    idea.generated_post ? { archetype_key: 'saved', archetype_label: 'Saved', archetype_desc: '', hook_type: '', post_structure: '', avg_ratio: 0, text: idea.generated_post } : null
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [showVariants, setShowVariants] = useState(variants.length > 0 && !idea.generated_post);

  const cfg = SOURCE_CONFIG[idea.source_type] || SOURCE_CONFIG.manual;
  const hasVariants = variants.length > 0;
  const hasSelectedPost = selectedVariant !== null;

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    setSelectedVariant(null);
    try {
      const res = await fetch(`${BASE}/api/ideas/${idea.id}/generate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error || `Error ${res.status}`); return; }
      const v: ArchetypeVariant[] = data.variants || [];
      setVariants(v);
      setShowVariants(true);
      onUpdate(idea.id, { status: 'ready', generated_variants: v });
    } catch (e: any) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectVariant = (v: ArchetypeVariant) => {
    setSelectedVariant(v);
    setShowVariants(false);
    // Save selected post immediately
    fetch(`${BASE}/api/ideas/${idea.id}/save-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generated_post: v.text, generation_score: scorePost(v.text).overall }),
    }).catch(() => {});
    onUpdate(idea.id, { generated_post: v.text, generation_score: scorePost(v.text).overall });
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
          {idea.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-secondary text-text-muted border border-border">{tag}</span>
          ))}
          {idea.generation_score !== null && (
            <span className={`text-xs font-bold ${scoreColor(idea.generation_score)}`}>{idea.generation_score}/100</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-text-muted">{new Date(idea.created_at).toLocaleDateString()}</span>
          <button onClick={() => onDelete(idea.id)} className="text-text-muted hover:text-danger text-sm transition-colors">✕</button>
        </div>
      </div>

      {/* Raw content */}
      <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap mb-4">{idea.raw_content}</p>

      {/* Generate button */}
      {!hasSelectedPost && (
        <button
          onClick={hasVariants && !showVariants ? () => setShowVariants(true) : handleGenerate}
          disabled={generating}
          className="w-full py-2 bg-accent/15 text-accent rounded-lg text-xs font-medium hover:bg-accent/25 disabled:opacity-50 transition-colors mb-4"
        >
          {generating
            ? '✨ Generating 3 variants…'
            : hasVariants && !showVariants
              ? '✨ View 3 variants'
              : hasVariants
                ? '🔄 Regenerate 3 variants'
                : '✨ Generate 3 AI variants'}
        </button>
      )}

      {genError && <p className="text-danger text-xs mb-3">{genError}</p>}

      {/* Loading skeleton for variants */}
      {generating && (
        <div className="grid grid-cols-1 gap-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-bg-secondary rounded w-1/3 mb-2" />
              <div className="h-2 bg-bg-secondary rounded w-1/2 mb-3" />
              <div className="h-2 bg-bg-secondary rounded w-full mb-1" />
              <div className="h-2 bg-bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* 3 variant cards */}
      {!generating && showVariants && variants.length > 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-xs text-text-muted">Choose the archetype that fits best:</p>
          {variants.map((v, i) => {
            const colors = ARCHETYPE_COLORS[i % ARCHETYPE_COLORS.length];
            const previewScore = scorePost(v.text).overall;
            return (
              <div key={v.archetype_key} className={`border rounded-xl p-4 ${colors.border} ${colors.bg}`}>
                {/* Archetype badge + score */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${colors.badge}`}>
                      {v.archetype_label}
                    </span>
                    <span className="text-[10px] text-text-muted">{v.archetype_desc}</span>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${scoreColor(previewScore)}`}>{previewScore}/100</span>
                </div>

                {/* Post preview */}
                <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap mb-3 line-clamp-5">
                  {v.text}
                </p>

                {/* Select button */}
                <button
                  onClick={() => handleSelectVariant(v)}
                  className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${colors.btn}`}
                >
                  Choose this archetype →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected post editor */}
      {hasSelectedPost && selectedVariant && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">
              Archetype: <span className="text-text-secondary font-medium">{selectedVariant.archetype_label}</span>
            </span>
            {hasVariants && (
              <button
                onClick={() => { setShowVariants(true); setSelectedVariant(null); }}
                className="text-[11px] text-accent hover:text-accent-light transition-colors"
              >
                ← Change variant
              </button>
            )}
          </div>
          <PostEditor
            ideaId={idea.id}
            initialText={selectedVariant.text}
            initialScore={scorePost(selectedVariant.text).overall}
            onSave={(text, score) => onUpdate(idea.id, { generated_post: text, generation_score: score })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Capture form ────────────────────────────────────────────────────────────
function CaptureForm({ onCreated }: { onCreated: () => void }) {
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState<PostIdea['source_type']>('manual');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const { listening, start, stop } = useVoiceCapture((transcript) => {
    setContent((prev) => prev ? `${prev} ${transcript}` : transcript);
  });

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/api/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_content: content.trim(),
          source_type: sourceType,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      setContent('');
      setTags('');
      onCreated();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-text-primary">Capture an idea</h2>

      {/* Source type */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setSourceType(key as PostIdea['source_type'])}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              sourceType === key
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'
            }`}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>

      {/* Textarea + mic */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            sourceType === 'book_quote' ? '"The book quote…" — Author Name' :
            sourceType === 'demo_moment' ? 'The prospect said they had never seen…' :
            sourceType === 'meeting' ? 'In the meeting with X I discovered that…' :
            'Type your idea or press the mic to dictate…'
          }
          className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent resize-none pr-12"
          rows={4}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }}
        />
        <button
          onClick={listening ? stop : start}
          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
            listening ? 'bg-danger text-white animate-pulse' : 'bg-bg-hover text-text-muted hover:text-text-primary border border-border'
          }`}
          title={listening ? 'Stop dictation' : 'Voice dictation'}
        >
          🎤
        </button>
      </div>

      {listening && <p className="text-xs text-danger animate-pulse">● Listening… Speak now</p>}

      {/* Tags */}
      <input
        type="text"
        placeholder="Optional tags: cold email, storytelling… (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">⌘+Enter to save</span>
        <button
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="px-5 py-2 bg-accent text-bg-primary rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent-light transition-colors"
        >
          {saving ? 'Saving…' : 'Save idea'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Ideas() {
  const { data: ideas, loading, refetch } = useApi<PostIdea[]>('/api/ideas');
  const [localIdeas, setLocalIdeas] = useState<PostIdea[] | null>(null);
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const displayIdeas = localIdeas || ideas;

  const handleUpdate = (id: string, data: Partial<PostIdea>) => {
    setLocalIdeas((prev) => {
      const base = prev || ideas || [];
      return base.map((idea) => (idea.id === id ? { ...idea, ...data } : idea));
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this idea?')) return;
    await fetch(`${BASE}/api/ideas/${id}`, { method: 'DELETE' });
    refetch();
    setLocalIdeas(null);
  };

  const filtered = (displayIdeas || []).filter((idea) => {
    if (filterSource && idea.source_type !== filterSource) return false;
    if (filterStatus === 'draft' && idea.status !== 'draft') return false;
    if (filterStatus === 'ready' && idea.status !== 'ready') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Ideas</h1>
        <p className="text-text-secondary">Capture ideas on the spot. AI generates 3 viral variants to choose from.</p>
      </div>

      <CaptureForm onCreated={() => { refetch(); setLocalIdeas(null); }} />

      {displayIdeas && displayIdeas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-text-muted text-xs">Filter:</span>
          {[{ v: '', label: 'All' }, ...Object.entries(SOURCE_CONFIG).map(([k, c]) => ({ v: k, label: `${c.icon} ${c.label}` }))].map(({ v, label }) => (
            <button key={v} onClick={() => setFilterSource(v)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterSource === v ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'}`}>
              {label}
            </button>
          ))}
          <div className="ml-2 flex gap-1.5">
            {[{ v: '', label: 'All' }, { v: 'draft', label: 'No post' }, { v: 'ready', label: 'With post' }].map(({ v, label }) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterStatus === v ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-bg-secondary rounded w-1/4 mb-3" />
              <div className="h-4 bg-bg-secondary rounded w-full mb-2" />
              <div className="h-4 bg-bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!loading && displayIdeas && displayIdeas.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">💡</p>
          <p className="mb-1">No saved ideas yet.</p>
          <p className="text-sm">Use the form above to capture your first one.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-text-muted">{filtered.length} idea{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {!loading && displayIdeas && displayIdeas.length > 0 && filtered.length === 0 && (
        <p className="text-center text-text-muted py-8">No ideas match this filter.</p>
      )}
    </div>
  );
}
