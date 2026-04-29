import { useRef, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

type Size = '1024x1024' | '1024x1536' | '1536x1024';

const SIZE_OPTIONS: { key: Size; label: string; aspect: string }[] = [
  { key: '1024x1024', label: 'Cuadrada',  aspect: '1:1'  },
  { key: '1536x1024', label: 'Apaisada',  aspect: '3:2'  },
  { key: '1024x1536', label: 'Vertical',  aspect: '2:3'  },
];

// Curated style presets — small enough to be scannable, broad enough to cover
// most LinkedIn imagery. The user can always type something custom in the
// textarea to override the picker.
const STYLE_PRESETS: { key: string; label: string; value: string }[] = [
  // The Neety brand preset goes first so it's the obvious default for this
  // user. It bakes in the brand book rules: dark feel by default; switch to
  // alabaster when text is the main element; typography references Switzer
  // and Bricolage Grotesque (the model uses these as visual cues even if it
  // can't render exact letterforms — we forbid literal text elsewhere).
  { key: 'neety_brand', label: 'Neety brand',     value: 'Neety brand aesthetic: dark navy #0c202e dominant background giving a serious, dark, premium sensation; persian-orange #ee9363 reserved for accents and focal subjects; warm alabaster #f9f3ef only when text or empty negative space is the main element; clean editorial composition with confident geometry; visual language inspired by sans-serif geometric type (Switzer + Bricolage Grotesque-like proportions), warm vs cool contrast, no glossy gradients, no busy patterns' },
  { key: 'minimal_3d',  label: '3D minimal',     value: 'minimalist 3D illustration, soft shadows, clean isometric composition, premium B2B SaaS aesthetic' },
  { key: 'editorial',   label: 'Editorial',       value: 'editorial photography, natural lighting, shallow depth of field, magazine quality, candid composition' },
  { key: 'flat_vector', label: 'Flat vector',     value: 'flat vector illustration, geometric shapes, bold lines, limited palette, modern startup aesthetic' },
  { key: 'paper_cut',   label: 'Paper cut',       value: 'paper cut craft style, layered cutouts, tactile texture, soft directional lighting' },
  { key: 'data_viz',    label: 'Data viz',        value: 'abstract data visualization, isometric chart elements, glowing accents, dark navy background' },
  { key: 'humans_real', label: 'Personas reales', value: 'documentary photography of people working, natural diverse setting, no stock-photo smiles, focused intent' },
];

// Common B2B-friendly palettes. The user can always override with a custom
// hex string in the input below.
const PALETTE_PRESETS: { key: string; label: string; value: string; preview: string[] }[] = [
  // Official Neety brand palette: dark blue (formality) + persian orange
  // (warmth/closeness) + alabaster (calm space). The order in the prompt
  // matches the brand book proportions — navy dominates, orange accents,
  // alabaster for breathing room.
  { key: 'neety',        label: 'Neety oficial',  value: 'Neety brand palette: dark blue #0c202e as the dominant background (formality, serious mood); persian orange #ee9363 for warm accents and focal points; warm alabaster #f9f3ef for negative space and high-contrast surfaces. Navy should occupy ~60–70% of the image, orange ~15–25%, alabaster ~15–25%', preview: ['#0c202e', '#ee9363', '#f9f3ef'] },
  { key: 'navy_coral',   label: 'Navy + coral',   value: 'deep navy #0F1E3D and warm coral #FF6B5B with cream highlights', preview: ['#0F1E3D', '#FF6B5B', '#FAF3E0'] },
  { key: 'mint_charcoal',label: 'Mint + charcoal',value: 'mint green #6EE7B7 over charcoal #1F2937 with off-white accents',  preview: ['#1F2937', '#6EE7B7', '#F3F4F6'] },
  { key: 'amber_slate',  label: 'Amber + slate',  value: 'amber #F59E0B and slate #475569 with white space',                 preview: ['#475569', '#F59E0B', '#FFFFFF'] },
  { key: 'fuchsia_dark', label: 'Fuchsia oscuro', value: 'electric fuchsia #C026D3 on near-black #0A0A0A, neon accents',     preview: ['#0A0A0A', '#C026D3', '#F0ABFC'] },
];

interface Result {
  b64_json: string;
  model: string;
  size: string;
  prompt: string;
  allowText?: boolean;
  textIntentAuto?: boolean;
}

// Mirror of the backend heuristic. Used to give the user a visual hint that
// auto-detection has spotted text intent in their prompt, so they understand
// why the toggle is going to flip.
function detectTextIntent(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return /\b(tweet|tuit|screenshot|captura\s+de|poster|cartel|letrero|sign|quote|cita|frase|mensaje|caption|subt[íi]tulo|t[íi]tulo|titular|headline|que\s+diga|that\s+says|with\s+the\s+text|con\s+el\s+texto|texto\s+que\s+diga|texto:|writes?\s+that|escribe\s+que|reads?\s+that)\b/.test(p);
}

// Read a File as a data URL (kept inline so the component is self-contained).
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export default function ImageGenerator({
  postContext,
  defaultOpen = false,
  onResult,
}: {
  postContext?: string;
  // When the parent already provides disclosure (e.g. a tab), we render
  // the form expanded and skip the internal collapse header.
  defaultOpen?: boolean;
  // Fired the first time a generation succeeds, so the parent can light up
  // a "✓ generada" indicator without polling state.
  onResult?: (result: Result) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [prompt, setPrompt] = useState('');
  const [styleText, setStyleText] = useState('');
  const [palette, setPalette] = useState('');
  const [size, setSize] = useState<Size>('1024x1024');
  // Tri-state text policy:
  //   'auto' (default) → backend decides from the prompt
  //   'on'  → force text in image (overrides auto)
  //   'off' → forbid text in image (overrides auto)
  const [textPolicy, setTextPolicy] = useState<'auto' | 'on' | 'off'>('auto');

  const [logoFile, setLogoFile] = useState<{ file: File; dataUrl: string } | null>(null);
  const [referenceFile, setReferenceFile] = useState<{ file: File; dataUrl: string } | null>(null);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: typeof setLogoFile
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Imagen demasiado grande (>8MB).');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setter({ file, dataUrl });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error leyendo archivo');
    }
  };

  const fillFromPost = () => {
    if (!postContext?.trim()) return;
    // Take the first 240 chars as a prompt seed — enough to give the AI
    // direction without copying the whole post.
    const seed = postContext.trim().slice(0, 240).replace(/\s+/g, ' ');
    setPrompt(
      `Imagen ilustrativa para acompañar este post de LinkedIn. Idea principal: ${seed}`
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Escribe un prompt primero.');
      return;
    }
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${BASE}/api/post-creator/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: styleText.trim() || undefined,
          palette: palette.trim() || undefined,
          size,
          logoDataUrl: logoFile?.dataUrl,
          referenceDataUrl: referenceFile?.dataUrl,
          postContext: postContext?.trim() || undefined,
          // Send `allowText` only when the user has explicitly chosen on/off.
          // Leaving it undefined lets the backend auto-detect, which keeps
          // the no-text default for the common case.
          allowText:
            textPolicy === 'auto' ? undefined : textPolicy === 'on',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `Error ${res.status}`);
        setGenerating(false);
        return;
      }
      setResult(json);
      onResult?.(json);
    } catch (e: any) {
      setError(e.message || 'Error al generar la imagen');
    }
    setGenerating(false);
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.b64_json}`;
    link.download = `linkedin-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = async () => {
    if (!result) return;
    try {
      const blob = await (await fetch(`data:image/png;base64,${result.b64_json}`)).blob();
      // ClipboardItem isn't typed in older TS lib targets; cast to any to
      // avoid a build error on environments without the DOM lib bump.
      await (navigator.clipboard as any).write([
        new (window as any).ClipboardItem({ 'image/png': blob }),
      ]);
      setError('✓ Imagen copiada al portapapeles');
      setTimeout(() => setError(null), 2000);
    } catch {
      setError('Tu navegador no soporta copiar imágenes — usa Descargar.');
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Internal collapse header — only shown when the parent doesn't
          provide disclosure (i.e. when this component is used standalone).
          Inside the Post Creator preview tab the tab bar already serves as
          the disclosure so we skip this header. */}
      {!defaultOpen && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between p-3 hover:bg-bg-secondary transition-colors"
        >
          <span className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <span>🎨</span> Generar imagen para el post
            {result && <span className="text-[10px] text-green-400">✓ generada</span>}
          </span>
          <span className={`text-text-muted transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
        </button>
      )}

      {open && (
        <div className={`${defaultOpen ? 'p-3' : 'p-3 border-t border-border'} space-y-3`}>
          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] text-text-muted font-medium">Prompt — qué quieres que dibuje</label>
              {postContext && postContext.trim().length > 30 && (
                <button
                  type="button"
                  onClick={fillFromPost}
                  className="text-[10px] text-accent hover:text-accent-light"
                >
                  ✨ Sugerir desde el post
                </button>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ej: Una abstracción isométrica de una abeja sobre un panal con líneas de datos fluyendo, simbolizando un sistema B2B colaborativo."
              className="w-full bg-bg-primary border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-y leading-relaxed"
            />
          </div>

          {/* Style presets + free text */}
          <div>
            <label className="block text-[11px] text-text-muted font-medium mb-1">Estilo</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {STYLE_PRESETS.map((p) => {
                const active = styleText === p.value;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setStyleText(active ? '' : p.value)}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                      active
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={styleText}
              onChange={(e) => setStyleText(e.target.value)}
              placeholder="O describe tu propio estilo (override del preset)…"
              className="w-full bg-bg-primary border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
            />
          </div>

          {/* Palette presets + free text */}
          <div>
            <label className="block text-[11px] text-text-muted font-medium mb-1">Paleta de colores</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {PALETTE_PRESETS.map((p) => {
                const active = palette === p.value;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPalette(active ? '' : p.value)}
                    className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-colors ${
                      active
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'
                    }`}
                  >
                    <span className="flex gap-0.5">
                      {p.preview.map((c) => (
                        <span key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />
                      ))}
                    </span>
                    {p.label}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
              placeholder="O paleta libre: '#0F1E3D, #FF6B5B, cream'…"
              className="w-full bg-bg-primary border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-[11px] text-text-muted font-medium mb-1">Tamaño</label>
            <div className="flex gap-1">
              {SIZE_OPTIONS.map((s) => {
                const active = size === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSize(s.key)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'
                    }`}
                  >
                    {s.label} <span className="text-text-muted">· {s.aspect}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text-in-image policy. Defaults to "auto" (backend reads the
              prompt). Use "Sí" when asking for tweets, posters, quotes, etc.
              to force the model to render the literal text. Use "No" when
              you want a clean illustrative image. */}
          <div>
            <label className="block text-[11px] text-text-muted font-medium mb-1">
              ¿Texto en la imagen?
              {textPolicy === 'auto' && detectTextIntent(prompt) && (
                <span className="ml-1.5 text-[10px] text-accent">✨ detectado en el prompt</span>
              )}
            </label>
            <div className="flex gap-1">
              {([
                ['auto', 'Auto', 'Decide según el prompt'],
                ['on',   'Sí',   'Forzar texto (tweets, citas, posters…)'],
                ['off',  'No',   'Imagen ilustrativa, sin letras'],
              ] as const).map(([key, label, hint]) => {
                const active = textPolicy === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTextPolicy(key)}
                    title={hint}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {textPolicy === 'on' && (
              <p className="text-[10px] text-text-muted mt-1 leading-snug">
                Mete entre comillas el texto exacto que quieres ver.
                Ej: <em>un tweet que diga "Si haces outbound como hace 5 años, estás quemando dinero"</em>.
              </p>
            )}
          </div>

          {/* Optional uploads */}
          <div className="grid grid-cols-2 gap-2">
            <FileUpload
              label="Logo (opcional)"
              file={logoFile}
              inputRef={logoInputRef}
              onPick={(e) => handleFileChange(e, setLogoFile)}
              onClear={() => setLogoFile(null)}
              hint="Se colocará abajo a la derecha"
            />
            <FileUpload
              label="Referencia (opcional)"
              file={referenceFile}
              inputRef={referenceInputRef}
              onPick={(e) => handleFileChange(e, setReferenceFile)}
              onClear={() => setReferenceFile(null)}
              hint="Guía de estilo / composición"
            />
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-accent text-bg-primary hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? '🎨 Generando…' : '✨ Generar imagen'}
          </button>

          {error && (
            <div className={`text-xs rounded-lg px-2.5 py-1.5 ${
              error.startsWith('✓')
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-danger/10 border border-danger/30 text-danger'
            }`}>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
                <img
                  src={`data:image/png;base64,${result.b64_json}`}
                  alt="Imagen generada"
                  className="w-full h-auto block"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-bg-secondary border border-border text-text-primary hover:border-accent/40 transition-colors"
                >
                  ⬇️ Descargar
                </button>
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-bg-secondary border border-border text-text-primary hover:border-accent/40 transition-colors"
                >
                  📋 Copiar
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-bg-secondary border border-border text-text-primary hover:border-accent/40 transition-colors"
                >
                  ↻ Regenerar
                </button>
              </div>
              <details className="text-[10px] text-text-muted">
                <summary className="cursor-pointer hover:text-text-secondary">Ver prompt final usado ({result.model})</summary>
                <pre className="mt-1.5 bg-bg-primary border border-border rounded px-2 py-1.5 whitespace-pre-wrap leading-snug">
                  {result.prompt}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── File upload sub-component ──────────────────────────────────────────────

function FileUpload({
  label,
  file,
  inputRef,
  onPick,
  onClear,
  hint,
}: {
  label: string;
  file: { file: File; dataUrl: string } | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-text-muted font-medium mb-1">{label}</label>
      {file ? (
        <div className="flex items-center gap-2 bg-bg-primary border border-border rounded-lg p-1.5">
          <img
            src={file.dataUrl}
            alt=""
            className="w-10 h-10 object-cover rounded border border-border flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-text-primary truncate" title={file.file.name}>
              {file.file.name}
            </p>
            <p className="text-[9px] text-text-muted">
              {(file.file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-text-muted hover:text-danger px-1"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full py-2 rounded-lg text-[11px] border border-dashed border-border bg-bg-secondary text-text-muted hover:border-accent/30 transition-colors"
          >
            + Subir
          </button>
          {hint && <p className="text-[9px] text-text-muted mt-0.5 leading-tight">{hint}</p>}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
