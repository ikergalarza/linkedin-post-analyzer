import { useState, useEffect, useMemo } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

type VoiceChoice = 'Iker' | 'Unai';

interface Comments {
  reinforce: string;
  contrarian_data: string;
  contrarian_premise: string;
  contrarian_survivorship: string;
  reframe: string;
  add_missing: string;
  steal_phrase: string;
  warm_supportive: string;
  better_question: string;
}

interface PreviewData {
  post: {
    id: string;
    url: string | null;
    hook: string | null;
    content: string | null;
    creator_name: string | null;
  };
  owner: 'Iker' | 'Unai' | 'unknown';
  voice_used: VoiceChoice;
  comments: Comments;
  webhook_configured: boolean;
}

const ANGLE_KEYS: (keyof Comments)[] = [
  'reinforce', 'contrarian_data', 'contrarian_premise', 'contrarian_survivorship',
  'reframe', 'add_missing', 'steal_phrase', 'warm_supportive', 'better_question',
];

const ANGLE_META: Record<keyof Comments, { emoji: string; label: string }> = {
  reinforce: { emoji: '💪', label: 'Reinforce' },
  contrarian_data: { emoji: '📊', label: 'Contrarian · data' },
  contrarian_premise: { emoji: '🧱', label: 'Contrarian · premise' },
  contrarian_survivorship: { emoji: '🎯', label: 'Contrarian · survivorship' },
  reframe: { emoji: '🔄', label: 'Reframe' },
  add_missing: { emoji: '➕', label: 'Add missing' },
  steal_phrase: { emoji: '🪝', label: 'Steal phrase' },
  warm_supportive: { emoji: '🤝', label: 'Warm & supportive' },
  better_question: { emoji: '❓', label: 'Better question' },
};

function buildHeader(owner: 'Iker' | 'Unai' | 'unknown', creatorName: string | null, url: string | null): string {
  const label = owner === 'unknown'
    ? `NUEVO POST ${(creatorName || 'ACCOUNT').toUpperCase()}`
    : `NUEVO POST ${owner.toUpperCase()}`;
  return `🐝 ${label}:\n${url || '(sin URL)'}`;
}

function buildMessage(header: string, comments: Comments): string {
  const parts = [header, '', '💬 Comentarios sugeridos (copia y pega):'];
  ANGLE_KEYS.forEach((key, i) => {
    const text = (comments[key] || '').trim();
    if (!text) return;
    const meta = ANGLE_META[key];
    parts.push('', `${i + 1}. ${meta.emoji} ${meta.label}`, text);
  });
  return parts.join('\n');
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
  const [voice, setVoice] = useState<VoiceChoice>('Iker');
  const [comments, setComments] = useState<Comments | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadPreview = async (profileName?: VoiceChoice) => {
    setLoading(true);
    setError(null);
    try {
      const qs = profileName ? `?profile_name=${encodeURIComponent(profileName)}` : '';
      const res = await fetch(`${BASE}/api/accounts/posts/${postId}/google-chat-preview${qs}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || `Error ${res.status}`); setLoading(false); return; }
      setData(json);
      setComments(json.comments);
      setVoice(json.voice_used);
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
    if (!data || !comments) return '';
    return buildMessage(buildHeader(data.owner, data.post.creator_name, data.post.url), comments);
  }, [data, comments]);

  const handleRegenerate = async (newVoice: VoiceChoice) => {
    if (newVoice === voice) return;
    await loadPreview(newVoice);
  };

  const handleCopy = async (key: keyof Comments | 'all') => {
    const text = key === 'all' ? message : (comments?.[key] || '');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {}
  };

  const handleSend = async () => {
    if (!message) return;
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
      setTimeout(onClose, 1200);
    } catch (e: any) {
      setError(e.message || 'Error al enviar');
    }
    setSending(false);
  };

  const updateComment = (key: keyof Comments, value: string) => {
    if (!comments) return;
    setComments({ ...comments, [key]: value });
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
                {data.owner !== 'unknown' && <> · detectado como <span className="text-accent">{data.owner}</span></>}
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
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-bg-secondary rounded animate-pulse" />)}
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-danger text-sm">
              {error}
            </div>
          )}

          {!loading && data && comments && (
            <>
              {/* Voice picker */}
              <div>
                <label className="block text-xs text-text-muted font-medium mb-1.5">Voz para los comentarios</label>
                <div className="flex gap-2">
                  {(['Iker', 'Unai'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => handleRegenerate(v)}
                      disabled={loading}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        voice === v
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  <span className="text-[10px] text-text-muted self-center">
                    Cambiar voz regenera los comentarios.
                  </span>
                </div>
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
                <p className="text-[10px] text-text-muted mt-1">
                  {message.length} / 3800 caracteres
                </p>
              </div>

              {/* Individual editable comments */}
              <div className="space-y-2">
                <p className="text-xs text-text-muted font-medium">Comentarios (editables antes de enviar)</p>
                {ANGLE_KEYS.map((key) => {
                  const meta = ANGLE_META[key];
                  const value = comments[key] || '';
                  return (
                    <div key={key} className="bg-bg-secondary border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-text-primary">
                          {meta.emoji} {meta.label}
                        </span>
                        <button
                          onClick={() => handleCopy(key)}
                          className="text-[10px] text-accent hover:text-accent-light"
                        >
                          {copiedKey === key ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                      <textarea
                        value={value}
                        onChange={(e) => updateComment(key, e.target.value)}
                        rows={Math.max(2, Math.min(6, Math.ceil(value.length / 80)))}
                        className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent resize-y"
                      />
                    </div>
                  );
                })}
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
              disabled={!data.webhook_configured || sending || sent || !message}
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
