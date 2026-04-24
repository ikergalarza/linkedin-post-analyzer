import { useState, useMemo, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

type Mode = 'topic' | 'outliers' | 'conversation' | 'news';

interface GeneratedIdea {
  title: string;
  body: string;
  angle?: string;
  tone?: string;
}

const MODES: { key: Mode; icon: string; label: string; desc: string }[] = [
  { key: 'topic', icon: '🎯', label: 'Tema / nicho', desc: 'Ángulos de post a partir de un tema o nicho' },
  { key: 'outliers', icon: '🧠', label: 'Desde tus outliers', desc: 'Ideas nuevas derivadas del patrón de tus outliers' },
  { key: 'conversation', icon: '💬', label: 'Conversación', desc: 'Preguntas y hot takes para generar debate' },
  { key: 'news', icon: '📰', label: 'Noticia del sector', desc: 'Ángulos reaccionando a una noticia' },
];

function IdeaCard({ idea, mode, onSave }: {
  idea: GeneratedIdea;
  mode: Mode;
  onSave: (idea: GeneratedIdea) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(idea);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    }
    setSaving(false);
  };

  return (
    <div className={`bg-bg-card border rounded-xl p-4 transition-all ${saved ? 'border-green-400/30 opacity-70' : 'border-border hover:border-fuchsia-400/40'}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-base leading-none mt-0.5">💡</span>
        <p className="text-sm font-semibold text-text-primary leading-snug flex-1">{idea.title}</p>
      </div>

      <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap mb-3">
        {idea.body}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-400/10 text-fuchsia-400 font-medium">
          ✨ {MODES.find((m) => m.key === mode)?.label || mode}
        </span>
        {idea.angle && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-secondary text-text-muted">
            {idea.angle}
          </span>
        )}
        {idea.tone && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-secondary text-text-muted">
            {idea.tone}
          </span>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
          saved
            ? 'bg-green-500/15 text-green-400 cursor-default'
            : 'bg-fuchsia-500/80 text-white hover:bg-fuchsia-500 disabled:opacity-50'
        }`}
      >
        {saved ? '✓ Guardado en Ideas' : saving ? 'Guardando…' : '💾 Guardar en Ideas'}
      </button>
      {error && <p className="text-[10px] text-danger mt-2">{error}</p>}
    </div>
  );
}

interface OutlierTopicsData {
  outliers: { topic: string | null }[];
}

export default function GenerateTab() {
  const [mode, setMode] = useState<Mode>('topic');

  // Per-mode inputs
  const [topicInput, setTopicInput] = useState('');
  const [audienceInput, setAudienceInput] = useState('');
  const [outliersTopic, setOutliersTopic] = useState('');
  const [conversationInput, setConversationInput] = useState('');
  const [newsInput, setNewsInput] = useState('');

  // Per-mode results
  const [results, setResults] = useState<Record<Mode, GeneratedIdea[]>>({
    topic: [], outliers: [], conversation: [], news: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Outlier topics (for the "from outliers" mode) — fetched on demand
  const [topicsList, setTopicsList] = useState<string[] | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Load outlier topics the first time the user opens the "outliers" mode
  useEffect(() => {
    if (mode !== 'outliers' || topicsList !== null || topicsLoading) return;
    let cancelled = false;
    setTopicsLoading(true);
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/ideas/inspiration`);
        const data: OutlierTopicsData = await res.json();
        const set = new Set<string>();
        (data.outliers || []).forEach((p) => { if (p.topic) set.add(p.topic); });
        if (!cancelled) setTopicsList([...set].sort());
      } catch {
        if (!cancelled) setTopicsList([]);
      } finally {
        if (!cancelled) setTopicsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, topicsList, topicsLoading]);

  const canGenerate = useMemo(() => {
    if (loading) return false;
    switch (mode) {
      case 'topic': return topicInput.trim().length > 2;
      case 'outliers': return true;
      case 'conversation': return conversationInput.trim().length > 2;
      case 'news': return newsInput.trim().length > 10;
    }
  }, [mode, loading, topicInput, conversationInput, newsInput]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      let path = '';
      let body: any = {};
      switch (mode) {
        case 'topic':
          path = '/api/ideas/inspiration/generate/topic';
          body = { topic: topicInput.trim(), audience: audienceInput.trim() || undefined, count: 5 };
          break;
        case 'outliers':
          path = '/api/ideas/inspiration/generate/from-outliers';
          body = { topic: outliersTopic || undefined, count: 5 };
          break;
        case 'conversation':
          path = '/api/ideas/inspiration/generate/conversation';
          body = { context: conversationInput.trim(), count: 5 };
          break;
        case 'news':
          path = '/api/ideas/inspiration/generate/news';
          body = { news: newsInput.trim(), count: 3 };
          break;
      }
      const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Error ${res.status}`); setLoading(false); return; }
      setResults((prev) => ({ ...prev, [mode]: data.ideas || [] }));
    } catch (e: any) {
      setError(e.message || 'Error al generar ideas');
    }
    setLoading(false);
  };

  const handleSaveIdea = async (idea: GeneratedIdea) => {
    const raw_content = `${idea.title}\n\n${idea.body}`;
    const tags = ['generated', mode];
    if (idea.angle) tags.push(idea.angle);
    const res = await fetch(`${BASE}/api/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_content, source_type: 'generated', tags }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error ${res.status}`);
    }
  };

  const currentResults = results[mode];
  const activeMode = MODES.find((m) => m.key === mode)!;

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                mode === m.key
                  ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-400'
                  : 'border-border bg-bg-secondary text-text-muted hover:border-fuchsia-400/30'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">{activeMode.desc}</p>
      </div>

      {/* Inputs per mode */}
      <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
        {mode === 'topic' && (
          <>
            <div>
              <label className="block text-xs text-text-muted font-medium mb-1">Tema o nicho</label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder='Ej: "Cold outreach B2B para fundadores técnicos"'
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-fuchsia-400"
                onKeyDown={(e) => { if (e.key === 'Enter' && canGenerate) handleGenerate(); }}
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-medium mb-1">Audiencia (opcional)</label>
              <input
                type="text"
                value={audienceInput}
                onChange={(e) => setAudienceInput(e.target.value)}
                placeholder='Ej: "CEOs de SaaS early stage"'
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-fuchsia-400"
              />
            </div>
          </>
        )}

        {mode === 'outliers' && (
          <div>
            <label className="block text-xs text-text-muted font-medium mb-2">
              Filtrar por topic de tus outliers (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setOutliersTopic('')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  !outliersTopic
                    ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-400'
                    : 'border-border text-text-muted hover:border-fuchsia-400/30'
                }`}
              >
                Todos
              </button>
              {topicsLoading && <span className="text-xs text-text-muted">Cargando topics…</span>}
              {(topicsList || []).map((t) => (
                <button
                  key={t}
                  onClick={() => setOutliersTopic(outliersTopic === t ? '' : t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    outliersTopic === t
                      ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-400'
                      : 'border-border text-text-muted hover:border-fuchsia-400/30'
                  }`}
                >
                  {t}
                </button>
              ))}
              {topicsList && topicsList.length === 0 && !topicsLoading && (
                <span className="text-xs text-text-muted">No hay topics aún — clasifica tus outliers primero en la pestaña Steal.</span>
              )}
            </div>
          </div>
        )}

        {mode === 'conversation' && (
          <div>
            <label className="block text-xs text-text-muted font-medium mb-1">Tema o contexto</label>
            <textarea
              value={conversationInput}
              onChange={(e) => setConversationInput(e.target.value)}
              placeholder='Ej: "El fin del trabajo en oficina" o "IA reemplazando SDRs"'
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-fuchsia-400 resize-none"
              rows={3}
            />
          </div>
        )}

        {mode === 'news' && (
          <div>
            <label className="block text-xs text-text-muted font-medium mb-1">
              Titular + contexto de la noticia
            </label>
            <textarea
              value={newsInput}
              onChange={(e) => setNewsInput(e.target.value)}
              placeholder='Pega el titular y 2-3 líneas de contexto. Ej: "OpenAI lanza GPT-5 con razonamiento nativo. Disponible desde hoy para clientes enterprise…"'
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-fuchsia-400 resize-none"
              rows={5}
            />
            <p className="text-[10px] text-text-muted mt-1">
              Cuantos más datos concretos pegues (número, fecha, nombres), mejores serán los ángulos.
            </p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full py-2.5 bg-fuchsia-500/80 text-white rounded-lg text-sm font-medium hover:bg-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '✨ Generando ideas…' : `✨ Generar ideas`}
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-bg-secondary rounded w-3/4 mb-3" />
              <div className="h-3 bg-bg-secondary rounded w-full mb-2" />
              <div className="h-3 bg-bg-secondary rounded w-2/3 mb-4" />
              <div className="h-7 bg-bg-secondary rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && currentResults.length > 0 && (
        <>
          <p className="text-xs text-text-muted">
            {currentResults.length} idea{currentResults.length !== 1 ? 's' : ''} generada{currentResults.length !== 1 ? 's' : ''} — guarda las que te gusten y pásalas a <span className="text-fuchsia-400">Ideas</span> para generar variantes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentResults.map((idea, i) => (
              <IdeaCard
                key={`${mode}-${i}-${idea.title.slice(0, 20)}`}
                idea={idea}
                mode={mode}
                onSave={handleSaveIdea}
              />
            ))}
          </div>
        </>
      )}

      {!loading && currentResults.length === 0 && !error && (
        <div className="text-center py-10 text-text-muted text-sm">
          <p className="text-3xl mb-2">✨</p>
          <p>Rellena el input y pulsa "Generar ideas" para empezar a brainstormear.</p>
        </div>
      )}
    </div>
  );
}
