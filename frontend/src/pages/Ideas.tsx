import { useState, useRef } from 'react';
import { useApi, apiPost } from '../hooks/useApi';
import { scorePost } from '../components/postcreator/PostChecklist';

const BASE = import.meta.env.VITE_API_URL || '';

interface PostIdea {
  id: string;
  raw_content: string;
  source_type: 'manual' | 'book_quote' | 'demo_moment' | 'observation' | 'meeting';
  tags: string[];
  generated_post: string | null;
  generation_score: number | null;
  status: 'draft' | 'generating' | 'ready';
  created_at: string;
}

const SOURCE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  manual:       { icon: '💡', label: 'Idea',        color: 'text-accent bg-accent/10' },
  book_quote:   { icon: '📚', label: 'Libro',       color: 'text-purple-400 bg-purple-400/10' },
  demo_moment:  { icon: '🎯', label: 'Demo',        color: 'text-blue-400 bg-blue-400/10' },
  observation:  { icon: '👁️', label: 'Observación', color: 'text-amber-400 bg-amber-400/10' },
  meeting:      { icon: '🤝', label: 'Reunión',     color: 'text-green-400 bg-green-400/10' },
};

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-danger';
}

// ─── Voice recording hook ─────────────────────────────────────────────────────
function useVoiceCapture(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const start = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado por voz. Usa Chrome en móvil.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = navigator.language || 'es-ES';
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ');
      onResult(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { listening, start, stop };
}

// ─── Idea card with inline generate+improve ───────────────────────────────────
function IdeaCard({ idea, onUpdate, onDelete }: {
  idea: PostIdea;
  onUpdate: (id: string, data: Partial<PostIdea>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [postText, setPostText] = useState(idea.generated_post || '');
  const [score, setScore] = useState<number | null>(idea.generation_score);
  const [iterLog, setIterLog] = useState<{ iter: number; score: number; accepted: boolean }[]>([]);
  const [copied, setCopied] = useState(false);

  const cfg = SOURCE_CONFIG[idea.source_type] || SOURCE_CONFIG.manual;

  const handleGenerate = async () => {
    setGenerating(true);
    setExpanded(true);
    setIterLog([]);
    try {
      const res = await apiPost<{ text: string }>(`/api/ideas/${idea.id}/generate`, {});
      setPostText(res.text);
      const s = scorePost(res.text).overall;
      setScore(s);
      onUpdate(idea.id, { status: 'ready', generated_post: res.text, generation_score: s });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoImprove = async () => {
    if (!postText) return;
    setImproving(true);
    setIterLog([]);

    let bestText = postText;
    let bestScore = scorePost(postText).overall;
    const conversation: { role: 'user' | 'assistant'; content: string }[] = [];
    const MAX_ITERS = 5;

    for (let i = 0; i < MAX_ITERS; i++) {
      if (bestScore >= 80) break;

      const { byCategory, failing } = scorePost(bestText);
      const passingLabels = Object.entries(byCategory)
        .flatMap(([, checks]) => checks.filter((c: any) => c.passed).map((c: any) => c.label));
      const failingList = failing.map((c: any) => `- ${c.label}: ${c.description}`).join('\n');

      const userMsg = i === 0
        ? `ORIGINAL POST — LOCKED REFERENCE (do not change the core idea or topic):\n\`\`\`\n${bestText}\n\`\`\`\n\nAlready passing (DO NOT break these): ${passingLabels.join(', ') || 'none'}\n\nNeed to fix:\n${failingList}`
        : `Already passing: ${passingLabels.join(', ') || 'none'}\n\nStill need to fix:\n${failingList}`;

      conversation.push({ role: 'user', content: userMsg });

      let raw = '';
      try {
        const res = await apiPost<{ text: string; raw: string }>('/api/chat/improve', { messages: conversation });
        raw = res.raw || res.text;
      } catch {
        break;
      }

      const newText = raw.includes('---') ? raw.split('---').slice(1).join('---').trim() : raw.trim();
      const newScore = scorePost(newText).overall;

      if (newScore > bestScore) {
        bestText = newText;
        bestScore = newScore;
        conversation.push({ role: 'assistant', content: raw });
        setIterLog((prev) => [...prev, { iter: i + 1, score: newScore, accepted: true }]);
      } else {
        conversation.push({
          role: 'assistant',
          content: `${raw}\n\n[SYSTEM NOTE: scored ${newScore}/100 — lower than best ${bestScore}/100. Rejected. Do NOT repeat this approach.]`,
        });
        setIterLog((prev) => [...prev, { iter: i + 1, score: newScore, accepted: false }]);
      }

      setPostText(bestText);
      setScore(bestScore);
    }

    // Save final result
    await fetch(`${BASE}/api/ideas/${idea.id}/save-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generated_post: bestText, generation_score: bestScore }),
    }).catch(() => {});

    onUpdate(idea.id, { generated_post: bestText, generation_score: bestScore, status: 'ready' });
    setImproving(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-secondary text-text-muted border border-border">
              {tag}
            </span>
          ))}
          {score !== null && (
            <span className={`text-xs font-bold ${scoreColor(score)}`}>{score}/100</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-text-muted">
            {new Date(idea.created_at).toLocaleDateString()}
          </span>
          <button
            onClick={() => onDelete(idea.id)}
            className="text-text-muted hover:text-danger text-sm transition-colors"
          >✕</button>
        </div>
      </div>

      {/* Raw content */}
      <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap mb-4">
        {idea.raw_content}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        {!idea.generated_post ? (
          <button
            onClick={handleGenerate}
            disabled={generating || idea.status === 'generating'}
            className="flex-1 py-2 bg-accent/15 text-accent rounded-lg text-xs font-medium hover:bg-accent/25 disabled:opacity-50 transition-colors"
          >
            {generating ? '✨ Generando…' : '✨ Generar post con IA'}
          </button>
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-2 bg-bg-secondary text-text-secondary rounded-lg text-xs hover:text-text-primary transition-colors border border-border"
          >
            {expanded ? '▲ Ocultar post' : `▼ Ver post${score !== null ? ` (${score}/100)` : ''}`}
          </button>
        )}
      </div>

      {/* Expanded post panel */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Post textarea */}
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
          {score !== null && (
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${scoreColor(score)}`}>{score}/100</span>
              <div className="flex-1 bg-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${score}%`,
                    backgroundColor: score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171',
                  }}
                />
              </div>
              {score >= 80 && <span className="text-green-400 text-xs font-medium">✓ Listo</span>}
            </div>
          )}

          {/* Iteration log */}
          {iterLog.length > 0 && (
            <div className="space-y-1">
              {iterLog.map((log) => (
                <div key={log.iter} className="flex items-center gap-2 text-[11px]">
                  <span className={log.accepted ? 'text-green-400' : 'text-danger'}>
                    {log.accepted ? '✓' : '✗'}
                  </span>
                  <span className="text-text-muted">
                    Iter {log.iter}: {log.score}/100 {log.accepted ? '(aceptado)' : '(rechazado)'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAutoImprove}
              disabled={improving || score === null || score >= 80}
              className="flex-1 py-2 bg-accent text-bg-primary rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-accent-light transition-colors"
            >
              {improving ? 'Mejorando…' : score !== null && score >= 80 ? '✓ Score ≥ 80' : '⚡ Auto-improve (hasta 80)'}
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-bg-secondary border border-border text-text-secondary rounded-lg text-xs hover:border-accent/40 hover:text-text-primary transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Capture form ─────────────────────────────────────────────────────────────
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
      <h2 className="text-sm font-semibold text-text-primary">Captura una idea</h2>

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
            sourceType === 'book_quote' ? '"La cita del libro tal…" — Nombre Autor' :
            sourceType === 'demo_moment' ? 'El prospect dijo que nunca había visto…' :
            sourceType === 'meeting' ? 'En la reunión con X descubrí que…' :
            'Escribe tu idea o pulsa el micrófono para dictar…'
          }
          className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent resize-none pr-12"
          rows={4}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
          }}
        />
        <button
          onClick={listening ? stop : start}
          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
            listening
              ? 'bg-danger text-white animate-pulse'
              : 'bg-bg-hover text-text-muted hover:text-text-primary border border-border'
          }`}
          title={listening ? 'Parar dictado' : 'Dictar por voz'}
        >
          🎤
        </button>
      </div>

      {listening && (
        <p className="text-xs text-danger animate-pulse">● Escuchando… Habla ahora</p>
      )}

      {/* Tags */}
      <input
        type="text"
        placeholder="Tags opcionales: cold email, storytelling, producto… (separados por coma)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">⌘+Enter para guardar</span>
        <button
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="px-5 py-2 bg-accent text-bg-primary rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent-light transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar idea'}
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
    if (!confirm('¿Eliminar esta idea?')) return;
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Ideas</h1>
        <p className="text-text-secondary">Captura ideas en el momento. La IA las convierte en posts virales.</p>
      </div>

      {/* Capture form */}
      <CaptureForm onCreated={() => { refetch(); setLocalIdeas(null); }} />

      {/* Filters */}
      {displayIdeas && displayIdeas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-text-muted text-xs">Filtrar:</span>
          <button
            onClick={() => setFilterSource('')}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!filterSource ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'}`}
          >
            Todas
          </button>
          {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterSource(filterSource === key ? '' : key)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterSource === key ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'}`}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
          <div className="ml-2 flex gap-1.5">
            {[{ v: '', label: 'Estado: todos' }, { v: 'draft', label: 'Sin generar' }, { v: 'ready', label: 'Con post' }].map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setFilterStatus(v)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterStatus === v ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
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

      {/* Empty state */}
      {!loading && displayIdeas && displayIdeas.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">💡</p>
          <p className="mb-1">Todavía no hay ideas guardadas.</p>
          <p className="text-sm">Usa el formulario para capturar la primera.</p>
        </div>
      )}

      {/* Ideas list */}
      {filtered.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-text-muted">{filtered.length} idea{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!loading && displayIdeas && displayIdeas.length > 0 && filtered.length === 0 && (
        <p className="text-center text-text-muted py-8">No hay ideas con ese filtro.</p>
      )}
    </div>
  );
}
