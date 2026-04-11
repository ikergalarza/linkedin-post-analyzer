import { useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

interface IdeaItem {
  angle: string;
  prompt: string;
}

interface Cluster {
  cluster: string;
  theme: string;
  ideas: IdeaItem[];
}

interface InspiractionResult {
  clusters: Cluster[];
  outliers_analyzed: number;
}

const CLUSTER_COLORS = [
  'border-accent/30 bg-accent/5',
  'border-purple-400/30 bg-purple-400/5',
  'border-blue-400/30 bg-blue-400/5',
  'border-amber-400/30 bg-amber-400/5',
  'border-green-400/30 bg-green-400/5',
  'border-red-400/30 bg-red-400/5',
];

const CLUSTER_BADGE_COLORS = [
  'text-accent bg-accent/10',
  'text-purple-400 bg-purple-400/10',
  'text-blue-400 bg-blue-400/10',
  'text-amber-400 bg-amber-400/10',
  'text-green-400 bg-green-400/10',
  'text-red-400 bg-red-400/10',
];

function IdeaItemCard({ idea, clusterColor, onSave }: {
  idea: IdeaItem;
  clusterColor: string;
  onSave: (angle: string, prompt: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(idea.angle, idea.prompt);
      setSaved(true);
    } catch {}
    setSaving(false);
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${saved ? 'border-green-400/30 bg-green-400/5 opacity-70' : 'border-border bg-bg-primary hover:border-accent/30'}`}>
      <p className="text-text-primary text-sm font-medium leading-snug mb-2">
        {idea.angle}
      </p>
      <p className="text-text-muted text-xs leading-relaxed mb-3">
        {idea.prompt}
      </p>
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
          saved
            ? 'bg-green-500/15 text-green-400 cursor-default'
            : `${clusterColor} hover:opacity-80 disabled:opacity-50`
        }`}
      >
        {saved ? '✓ Guardada en Ideas' : saving ? 'Guardando…' : '+ Guardar como idea'}
      </button>
    </div>
  );
}

export default function Inspiration() {
  const [result, setResult] = useState<InspiractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${BASE}/api/ideas/inspiration`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al generar inspiración');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIdea = async (angle: string, prompt: string) => {
    await fetch(`${BASE}/api/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_content: `${angle}\n\n${prompt}`,
        source_type: 'observation',
        tags: ['inspiración', 'outlier'],
      }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Inspiración</h1>
        <p className="text-text-secondary">
          La IA analiza tus posts más virales, los agrupa por tema y genera ideas de posts que puedes escribir desde tu propia experiencia.
        </p>
      </div>

      {/* Generate button */}
      <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-4xl mb-3">🧠</p>
        <p className="text-text-secondary text-sm mb-5">
          Analiza tus outliers, detecta patrones temáticos y genera ideas accionables para tu próximo post.
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-8 py-3 bg-accent text-bg-primary rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-accent-light transition-colors"
        >
          {loading ? '🔍 Analizando outliers…' : result ? '🔄 Regenerar ideas' : '✨ Generar inspiración'}
        </button>
        {result && (
          <p className="text-xs text-text-muted mt-3">
            Basado en {result.outliers_analyzed} posts outliers · {result.clusters.length} clusters detectados
          </p>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-bg-secondary rounded w-1/3 mb-2" />
              <div className="h-3 bg-bg-secondary rounded w-2/3 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-20 bg-bg-secondary rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {result.clusters.map((cluster, clusterIdx) => {
            const borderColor = CLUSTER_COLORS[clusterIdx % CLUSTER_COLORS.length];
            const badgeColor = CLUSTER_BADGE_COLORS[clusterIdx % CLUSTER_BADGE_COLORS.length];

            return (
              <div key={clusterIdx} className={`bg-bg-card border rounded-xl p-6 ${borderColor}`}>
                {/* Cluster header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${badgeColor}`}>
                      {cluster.cluster}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed">{cluster.theme}</p>
                </div>

                {/* Ideas grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cluster.ideas.map((idea, ideaIdx) => (
                    <IdeaItemCard
                      key={ideaIdx}
                      idea={idea}
                      clusterColor={badgeColor}
                      onSave={handleSaveIdea}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state (no outliers) */}
      {!loading && !result && !error && (
        <div className="text-center py-8 text-text-muted text-sm">
          <p>Necesitas tener outliers analizados para generar inspiración.</p>
          <p className="mt-1">Ve al Dashboard → añade creadores → refresca sus posts.</p>
        </div>
      )}
    </div>
  );
}
