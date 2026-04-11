import { useState, useEffect } from 'react';
import { apiPut } from '../../hooks/useApi';

const BASE = import.meta.env.VITE_API_URL || '';

interface CommenterProfile {
  headline: string;
  voice_style: string;
  worldview: string;
  signature_moves: string;
  avoid: string;
}

const EMPTY: CommenterProfile = {
  headline: '',
  voice_style: '',
  worldview: '',
  signature_moves: '',
  avoid: '',
};

export default function CommenterProfileForm() {
  const [form, setForm] = useState<CommenterProfile>(EMPTY);
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
            voice_style: data.voice_style || '',
            worldview: data.worldview || '',
            signature_moves: data.signature_moves || '',
            avoid: data.avoid || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof CommenterProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await apiPut('/api/network/profile', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-text-muted text-sm">Loading...</div>;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <p className="text-text-secondary text-sm">
        Define <strong className="text-text-primary">cómo comentas</strong>, no sobre qué. El AI usará tu voz y tu
        forma de ver el mundo para generar comentarios que abran debate.
      </p>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Quién eres <span className="text-text-muted font-normal">(se muestra en los comentarios)</span>
        </label>
        <input
          type="text"
          value={form.headline}
          onChange={set('headline')}
          placeholder="ej. Founder @Neety · B2B Sales"
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
        />
      </div>

      {/* Voice style */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Tu estilo de escritura
        </label>
        <textarea
          value={form.voice_style}
          onChange={set('voice_style')}
          rows={3}
          placeholder={`Describe cómo escribes, no sobre qué.\n\nEj: "Directo y sin rodeos. Frases cortas. Me gusta ir al dato concreto antes que a la opinión. Uso la primera persona siempre. Nunca soy condescendiente."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          Ritmo, tono, estructura de frases, uso de datos vs. opinión, primera/tercera persona…
        </p>
      </div>

      {/* Worldview */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Tu visión del mundo <span className="text-text-muted font-normal">(el lente con el que ves las cosas)</span>
        </label>
        <textarea
          value={form.worldview}
          onChange={set('worldview')}
          rows={3}
          placeholder={`Ej: "Creo que la mayoría del advice de ventas B2B está mal porque ignora el posicionamiento. Pienso que los SDRs no están muriendo — están evolucionando. Tengo una visión escéptica del hype de IA pero optimista de sus aplicaciones reales."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          Este es el ángulo desde el que analizas cualquier tema — independientemente del tema concreto del post.
        </p>
      </div>

      {/* Signature moves */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Tus movimientos habituales al comentar
        </label>
        <textarea
          value={form.signature_moves}
          onChange={set('signature_moves')}
          rows={3}
          placeholder={`Ej: "Suelo citar un número concreto de mi experiencia. Me gusta dar la vuelta al argumento principal. Termino con una pregunta abierta que incomoda. A veces comparto lo que le falta al post."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          Patrones que repites: cómo abres, cómo cierras, qué tipo de valor añades.
        </p>
      </div>

      {/* Avoid */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Lo que nunca haces
        </label>
        <textarea
          value={form.avoid}
          onChange={set('avoid')}
          rows={2}
          placeholder={`Ej: "Nunca digo 'gran post'. Nunca me autopromociono directamente. Nunca hago preguntas básicas. Evito ser condescendiente o usar jerga corporativa."`}
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
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
        {saved && <span className="text-green-400 text-sm">✓ Guardado</span>}
      </div>
    </form>
  );
}
