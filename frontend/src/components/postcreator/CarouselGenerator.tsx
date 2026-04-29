import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const BASE = import.meta.env.VITE_API_URL || '';

// ─── Types ──────────────────────────────────────────────────────────────────

type SlideKind = 'cover' | 'body' | 'cta';

interface Slide {
  kind: SlideKind;
  title: string;
  body: string;
  subtitle?: string;
}

type TemplateKey = 'neety_dark' | 'neety_light' | 'minimal';

interface Template {
  key: TemplateKey;
  label: string;
  bg: string;
  fg: string;
  accent: string;
  // tertiary surface used for the cover/CTA accent block (e.g. card behind title)
  surface: string;
  fontDisplay: string;
  fontBody: string;
}

const TEMPLATES: Record<TemplateKey, Template> = {
  neety_dark: {
    key: 'neety_dark',
    label: 'Neety Dark',
    bg: '#0c202e',
    fg: '#f9f3ef',
    accent: '#ee9363',
    surface: '#13344a',
    fontDisplay: '"Bricolage Grotesque", "Switzer", system-ui, sans-serif',
    fontBody: '"Switzer", system-ui, sans-serif',
  },
  neety_light: {
    key: 'neety_light',
    label: 'Neety Light',
    bg: '#f9f3ef',
    fg: '#0c202e',
    accent: '#ee9363',
    surface: '#ffffff',
    fontDisplay: '"Bricolage Grotesque", "Switzer", system-ui, sans-serif',
    fontBody: '"Switzer", system-ui, sans-serif',
  },
  minimal: {
    key: 'minimal',
    label: 'Minimal',
    bg: '#ffffff',
    fg: '#111111',
    accent: '#ee9363',
    surface: '#f5f5f5',
    fontDisplay: '"Bricolage Grotesque", system-ui, sans-serif',
    fontBody: '"Switzer", system-ui, sans-serif',
  },
};

// LinkedIn 4:5 — 1080×1350. The HTML slide is rendered at this exact size
// off-screen, html2canvas captures it as a PNG, jsPDF assembles all PNGs
// into a multi-page PDF the user can upload to LinkedIn as a document post.
const SLIDE_WIDTH = 1080;
const SLIDE_HEIGHT = 1350;

// On-screen preview scales down via CSS transform; capture happens at 1:1.
const PREVIEW_SCALE = 0.32; // 1080 × 0.32 ≈ 345 px wide on screen

const SLIDE_COUNT_OPTIONS = [5, 7, 10] as const;

// ─── Slide template renderer ────────────────────────────────────────────────

function SlideCanvas({
  slide,
  num,
  total,
  template,
}: {
  slide: Slide;
  num: number;
  total: number;
  template: Template;
}) {
  // Common shell: the actual content varies per slide kind
  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        background: template.bg,
        color: template.fg,
        fontFamily: template.fontBody,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative corner accent — small persian-orange wedge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          background: template.accent,
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          opacity: slide.kind === 'cover' ? 1 : 0.6,
        }}
      />

      {/* Brand mark — bottom-left on every slide */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          left: 80,
          fontFamily: template.fontDisplay,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: template.fg,
          opacity: 0.75,
        }}
      >
        Neety
      </div>

      {/* Slide number — bottom-right (skip on cover, signal the count instead) */}
      {slide.kind !== 'cover' && (
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            right: 80,
            fontFamily: template.fontBody,
            fontSize: 22,
            fontWeight: 500,
            color: template.fg,
            opacity: 0.5,
          }}
        >
          {num} / {total}
        </div>
      )}

      {/* Body — switches by kind */}
      {slide.kind === 'cover' && (
        <div
          style={{
            padding: '120px 80px 200px 80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            boxSizing: 'border-box',
            gap: 40,
          }}
        >
          <div
            style={{
              fontFamily: template.fontBody,
              fontSize: 26,
              fontWeight: 500,
              color: template.accent,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Carrusel
          </div>
          <h1
            style={{
              fontFamily: template.fontDisplay,
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: 0,
              color: template.fg,
            }}
          >
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p
              style={{
                fontFamily: template.fontBody,
                fontSize: 36,
                fontWeight: 400,
                lineHeight: 1.35,
                margin: 0,
                color: template.fg,
                opacity: 0.85,
                maxWidth: 880,
              }}
            >
              {slide.subtitle}
            </p>
          )}
          <div
            style={{
              fontFamily: template.fontBody,
              fontSize: 24,
              fontWeight: 500,
              color: template.fg,
              opacity: 0.6,
              marginTop: 'auto',
            }}
          >
            Desliza →
          </div>
        </div>
      )}

      {slide.kind === 'body' && (
        <div
          style={{
            padding: '160px 80px 200px 80px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box',
            gap: 48,
          }}
        >
          <div
            style={{
              fontFamily: template.fontBody,
              fontSize: 32,
              fontWeight: 600,
              color: template.accent,
              letterSpacing: '-0.01em',
            }}
          >
            {String(num - 1).padStart(2, '0')}
          </div>
          <h2
            style={{
              fontFamily: template.fontDisplay,
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: 0,
              color: template.fg,
            }}
          >
            {slide.title}
          </h2>
          <p
            style={{
              fontFamily: template.fontBody,
              fontSize: 34,
              fontWeight: 400,
              lineHeight: 1.45,
              margin: 0,
              color: template.fg,
              opacity: 0.9,
              whiteSpace: 'pre-wrap',
            }}
          >
            {slide.body}
          </p>
        </div>
      )}

      {slide.kind === 'cta' && (
        <div
          style={{
            padding: '160px 80px 200px 80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            boxSizing: 'border-box',
            gap: 48,
          }}
        >
          <div
            style={{
              fontFamily: template.fontBody,
              fontSize: 26,
              fontWeight: 500,
              color: template.accent,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            ¿Te ha servido?
          </div>
          <h2
            style={{
              fontFamily: template.fontDisplay,
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: 0,
              color: template.fg,
            }}
          >
            {slide.title}
          </h2>
          <p
            style={{
              fontFamily: template.fontBody,
              fontSize: 34,
              fontWeight: 400,
              lineHeight: 1.45,
              margin: 0,
              color: template.fg,
              opacity: 0.9,
              whiteSpace: 'pre-wrap',
            }}
          >
            {slide.body}
          </p>
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {['Sigue', 'Comenta', 'Comparte'].map((label) => (
              <span
                key={label}
                style={{
                  fontFamily: template.fontBody,
                  fontSize: 26,
                  fontWeight: 600,
                  padding: '14px 28px',
                  borderRadius: 999,
                  background: template.surface,
                  color: template.fg,
                  border: `2px solid ${template.accent}`,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function CarouselGenerator({ postContext }: { postContext?: string }) {
  const [open, setOpen] = useState(false);

  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [slideCount, setSlideCount] = useState<5 | 7 | 10>(7);
  const [templateKey, setTemplateKey] = useState<TemplateKey>('neety_dark');
  const [usePostAsBase, setUsePostAsBase] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);

  const slidesRef = useRef<HTMLDivElement>(null);

  const template = TEMPLATES[templateKey];

  const handleGenerate = async () => {
    const effectiveTopic = topic.trim();
    const effectivePostContext = usePostAsBase ? postContext?.trim() : undefined;

    if (!effectiveTopic && !effectivePostContext) {
      setError('Pon un topic o usa el post actual como base.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch(`${BASE}/api/post-creator/generate-carousel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: effectiveTopic,
          audience: audience.trim() || undefined,
          tone: tone.trim() || undefined,
          slides: slideCount,
          postContext: effectivePostContext,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `Error ${res.status}`);
        setGenerating(false);
        return;
      }
      setSlides(json.slides);
    } catch (e: any) {
      setError(e.message || 'Error generando el carrusel');
    }
    setGenerating(false);
  };

  const updateSlide = (idx: number, patch: Partial<Slide>) => {
    if (!slides) return;
    const next = slides.slice();
    next[idx] = { ...next[idx], ...patch };
    setSlides(next);
  };

  const handleExportPDF = async () => {
    if (!slides || !slidesRef.current) return;
    setExporting(true);
    setError(null);
    try {
      // Wait for fonts (Switzer / Bricolage) — html2canvas captures whatever
      // is currently rendered, so unloaded fonts produce fallback glyphs.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }

      const slideNodes = Array.from(
        slidesRef.current.querySelectorAll<HTMLElement>('[data-slide-capture]')
      );
      if (slideNodes.length === 0) throw new Error('No slides to export');

      // PDF page size in mm — keep the 4:5 aspect by setting custom format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [108, 135], // 4:5 ratio at 1 mm = 10 px → 1080×1350 px maps cleanly
      });

      for (let i = 0; i < slideNodes.length; i++) {
        const node = slideNodes[i];
        // scale=2 for crisp output (effective 2160×2700 captured), then we
        // shrink to fit the PDF page. backgroundColor: null preserves
        // transparency cleanly when needed.
        const canvas = await html2canvas(node, {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          scale: 2,
          backgroundColor: template.bg,
          useCORS: true,
          logging: false,
        });
        const dataUrl = canvas.toDataURL('image/png', 0.92);
        if (i > 0) pdf.addPage([108, 135], 'portrait');
        pdf.addImage(dataUrl, 'PNG', 0, 0, 108, 135);
      }

      pdf.save(`carrusel-linkedin-${Date.now()}.pdf`);
    } catch (e: any) {
      setError(e.message || 'Error exportando el PDF');
    }
    setExporting(false);
  };

  const fillFromPost = () => {
    if (!postContext?.trim()) return;
    setUsePostAsBase(true);
    if (!topic.trim()) {
      // Take the first ~80 chars as a rough topic seed
      setTopic(postContext.trim().slice(0, 80).replace(/\s+/g, ' '));
    }
  };

  // Reset slides when changing template — they re-render via React, no need
  // to reset; but if generating fresh, clear old.
  useEffect(() => {
    if (slides) setError(null);
  }, [slides]);

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3 hover:bg-bg-secondary transition-colors"
      >
        <span className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <span>🎠</span> Carrusel para LinkedIn
          {slides && <span className="text-[10px] text-green-400">✓ {slides.length} slides</span>}
        </span>
        <span className={`text-text-muted transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
      </button>

      {open && (
        <div className="p-3 border-t border-border space-y-3">
          {/* Topic + audience + tone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] text-text-muted font-medium">Tema del carrusel</label>
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
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: 5 errores que cometen los SDRs B2B en outbound"
              className="w-full bg-bg-primary border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
            />
          </div>

          {postContext && postContext.trim().length > 50 && (
            <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={usePostAsBase}
                onChange={(e) => setUsePostAsBase(e.target.checked)}
                className="accent-accent"
              />
              Usar el post actual como base (la IA lo trocea en {slideCount} slides)
            </label>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-text-muted font-medium mb-1">Audiencia</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="founders B2B…"
                className="w-full bg-bg-primary border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted font-medium mb-1">Tono</label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="directo, didáctico…"
                className="w-full bg-bg-primary border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          {/* Slide count + template */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-text-muted font-medium mb-1">Nº slides</label>
              <div className="flex gap-1">
                {SLIDE_COUNT_OPTIONS.map((c) => {
                  const active = slideCount === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSlideCount(c)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-text-muted font-medium mb-1">Plantilla</label>
              <div className="flex gap-1 flex-wrap">
                {(Object.values(TEMPLATES) as Template[]).map((t) => {
                  const active = templateKey === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTemplateKey(t.key)}
                      className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        active
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-bg-secondary text-text-muted hover:border-accent/30'
                      }`}
                    >
                      <span className="flex gap-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.bg }} />
                        <span className="w-2 h-2 rounded-full" style={{ background: t.fg }} />
                        <span className="w-2 h-2 rounded-full" style={{ background: t.accent }} />
                      </span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || (!topic.trim() && !(usePostAsBase && postContext?.trim()))}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-accent text-bg-primary hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generating
              ? '🎠 Generando contenido…'
              : slides
              ? '↻ Regenerar contenido'
              : '✨ Generar carrusel'}
          </button>

          {error && (
            <div className="text-xs rounded-lg px-2.5 py-1.5 bg-danger/10 border border-danger/30 text-danger">
              {error}
            </div>
          )}

          {/* Slide editor + preview */}
          {slides && (
            <>
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-text-muted">
                  <strong className="text-text-primary">{slides.length} slides generados</strong> · edita el texto, la plantilla cambia el look.
                </p>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="text-[11px] px-3 py-1.5 rounded-lg font-semibold bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? '📄 Exportando…' : '📄 Exportar PDF'}
                </button>
              </div>

              {/* Slide cards: preview (scaled) + editable text fields */}
              <div ref={slidesRef} className="space-y-3">
                {slides.map((slide, i) => (
                  <div
                    key={i}
                    className="bg-bg-secondary border border-border rounded-lg p-2 flex gap-3"
                  >
                    {/* Off-screen full-size canvas for html2canvas (display:block,
                        but visually scaled via transform). The data attribute
                        is what the export loop targets. */}
                    <div
                      style={{
                        width: SLIDE_WIDTH * PREVIEW_SCALE,
                        height: SLIDE_HEIGHT * PREVIEW_SCALE,
                        flexShrink: 0,
                        overflow: 'hidden',
                        borderRadius: 6,
                        background: template.bg,
                      }}
                    >
                      <div
                        data-slide-capture
                        style={{
                          width: SLIDE_WIDTH,
                          height: SLIDE_HEIGHT,
                          transform: `scale(${PREVIEW_SCALE})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <SlideCanvas
                          slide={slide}
                          num={i + 1}
                          total={slides.length}
                          template={template}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase tracking-wide text-text-muted font-semibold">
                          {slide.kind === 'cover' ? 'cover' : slide.kind === 'cta' ? 'cta' : `body ${i}`}
                        </span>
                        <span className="text-[9px] text-text-muted">slide {i + 1}/{slides.length}</span>
                      </div>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => updateSlide(i, { title: e.target.value })}
                        placeholder="Título"
                        className="w-full bg-bg-primary border border-border rounded px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
                      />
                      {slide.kind === 'cover' ? (
                        <input
                          type="text"
                          value={slide.subtitle || ''}
                          onChange={(e) => updateSlide(i, { subtitle: e.target.value })}
                          placeholder="Subtítulo"
                          className="w-full bg-bg-primary border border-border rounded px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
                        />
                      ) : (
                        <textarea
                          value={slide.body}
                          onChange={(e) => updateSlide(i, { body: e.target.value })}
                          rows={3}
                          placeholder="Body del slide"
                          className="w-full bg-bg-primary border border-border rounded px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-y leading-relaxed"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-text-muted leading-snug">
                El PDF se exporta a 1080×1350 px (proporción 4:5 LinkedIn). Súbelo en LinkedIn como "documento" y se mostrará como carrusel nativo.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
