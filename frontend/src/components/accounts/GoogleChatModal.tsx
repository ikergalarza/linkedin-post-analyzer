import { useState, useEffect, useMemo } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

interface PreviewData {
  post: {
    id: string;
    url: string | null;
    hook: string | null;
    content: string | null;
    creator_name: string | null;
  };
  owner: 'Iker' | 'Unai' | 'unknown';
  // Flat array of supportive comments (3-5). No voice selection — these
  // are neutral network-support comments, not anyone's personal voice.
  comments: string[];
  webhook_configured: boolean;
}

// Google Chat caps messages at 4096 chars. With ≤200 chars × 5 comments +
// header (~150 chars) we stay comfortably below, so the modal never has
// to split into multiple messages. Kept as a safety check though.
const MAX_LEN = 3800;

function buildHeader(owner: 'Iker' | 'Unai' | 'unknown', creatorName: string | null, url: string | null): string {
  const label = owner === 'unknown'
    ? `NUEVO POST ${(creatorName || 'ACCOUNT').toUpperCase()}`
    : `NUEVO POST ${owner.toUpperCase()}`;
  return `🐝 ${label}:\n${url || '(sin URL)'}`;
}

// Single-line reminder between the header and the comments — the 1st-hour
// signal is what the algorithm uses, and Like/Compartir/Comentario/Guardar
// are the highest-impact teammate actions.
const REMINDER_LINE =
  '⚠️ RECORDATORIO: si podéis LIKE + COMPARTIR + COMENTARIO + GUARDAR (pulsando 3 puntos del post) nos vamos VIRALES 🔥';

function buildMessage(header: string, comments: string[]): string {
  const cleaned = comments.map((c) => c.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return [header, '', REMINDER_LINE].join('\n');
  }
  const subtitle = `💬 ${cleaned.length} COMENTARIOS de APOYO (copia y pega):`;
  // No numbering in front of each comment — teammates copy the one they
  // want as-is, faster, with nothing to strip.
  const body = cleaned.join('\n\n');
  return [header, '', REMINDER_LINE, '', subtitle, '', body].join('\n');
}

export default function GoogleChatModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/accounts/posts/${postId}/google-chat-preview`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || `Error ${res.status}`); setLoading(false); return; }
      setData(json);
      setComments(Array.isArray(json.comments) ? json.comments : []);
    } catch (e: any) {
      setError(e.message || 'Error al cargar preview');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const message = useMemo(() => {
    if (!data) return '';
    return buildMessage(buildHeader(data.owner, data.post.creator_name, data.post.url), comments);
  }, [data, comments]);

  const overLimit = message.length > MAX_LEN;

  // Re-roll — fetch a fresh batch (count varies 3-5 for variety).
  const handleReRoll = async () => {
    await loadPreview();
  };

  const handleCopy = async (key: 'all' | number) => {
    const text = key === 'all' ? message : (comments[key] || '');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(String(key));
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {}
  };

  const handleSend = async () => {
    if (!message) return;
    if (overLimit) {
      setError(`El mensaje pasa ${MAX_LEN} chars. Acorta alguno manualmente.`);
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/accounts/posts/${postId}/send-to-google-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || `Error ${res.status}`); setSending(false); return; }
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e.message || 'Error al enviar');
    }
    setSending(false);
  };

  const updateComment = (idx: number, value: string) => {
    const next = [...comments];
    next[idx] = value;
    setComments(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <span>🐝</span> Enviar a Google Chat
            </h2>
            {data && (
              <p className="text-xs text-text-muted mt-0.5">
                Post de <span className="text-text-secondary font-medium">{data.post.creator_name || '—'}</span>
                {' '}· <span className="text-text-secondary">{comments.length} comentarios de apoyo</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none px-2"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="space-y-3">
              <div className="h-4 bg-bg-secondary rounded w-1/2 animate-pulse" />
              <div className="h-20 bg-bg-secondary rounded animate-pulse" />
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-bg-secondary rounded animate-pulse" />)}
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-danger text-sm">
              {error}
            </div>
          )}

          {!loading && data && (
            <>
              {/* Re-roll */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-text-muted">
                  Comentarios de apoyo para la red de compañeros — neutrales, listos para copiar y pegar.
                </p>
                <button
                  onClick={handleReRoll}
                  className="text-[11px] text-accent hover:text-accent-light border border-border px-3 py-1.5 rounded-full"
                  title="Regenerar (la cantidad varía 3-5 para evitar fatiga)"
                >
                  🎲 Regenerar
                </button>
              </div>

              {/* Message preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-text-muted font-medium">Mensaje completo (lo que se enviará al Chat)</label>
                  <button
                    onClick={() => handleCopy('all')}
                    className="text-[11px] text-accent hover:text-accent-light"
                  >
                    {copiedKey === 'all' ? '✓ Copiado' : '📋 Copiar todo'}
                  </button>
                </div>
                <pre className="bg-bg-secondary border border-border rounded-lg p-3 text-[11px] text-text-secondary whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                  {message}
                </pre>
                <p className={`text-[10px] mt-1 ${overLimit ? 'text-amber-400' : 'text-text-muted'}`}>
                  {message.length} / {MAX_LEN} chars · todos de apoyo (reinforce + warm), sin numerar, pensados para que cualquier compañero los pegue sin riesgo de imagen.
                </p>
              </div>

              {/* Individual editable comments */}
              <div className="space-y-2">
                <p className="text-xs text-text-muted font-medium">Comentarios (editables antes de enviar)</p>
                {comments.map((value, idx) => (
                  <div key={idx} className="bg-bg-secondary border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-text-primary">💪 Comentario de apoyo</span>
                      <button
                        onClick={() => handleCopy(idx)}
                        className="text-[10px] text-accent hover:text-accent-light"
                      >
                        {copiedKey === String(idx) ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    <textarea
                      value={value}
                      onChange={(e) => updateComment(idx, e.target.value)}
                      rows={Math.max(2, Math.min(4, Math.ceil(value.length / 80)))}
                      className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent resize-y"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && data && (
          <div className="p-4 border-t border-border flex items-center gap-3">
            {!data.webhook_configured && (
              <p className="text-[11px] text-amber-400 flex-1">
                ⚠️ GOOGLE_CHAT_WEBHOOK_URL no configurado. Puedes copiar el mensaje manualmente.
              </p>
            )}
            {data.webhook_configured && (
              <p className="text-[11px] text-text-muted flex-1">
                El mensaje se enviará al espacio configurado en el backend.
              </p>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={!data.webhook_configured || sending || sent || !message || overLimit}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                sent
                  ? 'bg-green-500/15 text-green-400 cursor-default'
                  : 'bg-accent text-bg-primary hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {sent ? '✓ Enviado' : sending ? 'Enviando…' : '📤 Enviar al Chat'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
