import { useMemo, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  text: string;
  onImproved?: (newText: string) => void;
}

type Category = 'hook' | 'structure' | 'emotion' | 'format' | 'cta' | 'topic';

interface ChecklistItem {
  id: string;
  category: Category;
  label: string;
  weight: number; // weight within its category (sum per category = 1)
  test: (ctx: TextCtx) => boolean;
  hint?: string;
}

interface TextCtx {
  text: string;
  lower: string;
  hook: string; // first line (or first 120 chars)
  hookLower: string;
  lines: string[];
  words: number;
  wordsHook: number;
  paragraphs: number;
}

const CATEGORY_META: Record<Category, { label: string; weight: number; color: string }> = {
  hook: { label: 'Hook', weight: 0.25, color: '#f59e0b' },
  structure: { label: 'Structure', weight: 0.20, color: '#10b981' },
  emotion: { label: 'Emotion', weight: 0.18, color: '#ef4444' },
  format: { label: 'Format', weight: 0.15, color: '#3b82f6' },
  cta: { label: 'CTA', weight: 0.12, color: '#a855f7' },
  topic: { label: 'Topic Fit', weight: 0.10, color: '#06b6d4' },
};

const CHECKLIST: ChecklistItem[] = [
  // ---------- HOOK (25%) ----------
  {
    id: 'hook-numeric',
    category: 'hook',
    label: 'Numeric contrast (concrete numbers in hook)',
    weight: 0.18,
    test: (c) => /\b\d+([.,]\d+)?(%|k|m|x|€|\$|€|h|hr|hrs|min|days?|años?|meses?|semanas?)?\b/i.test(c.hook),
    hint: 'Use a specific number: "$20K", "3x", "47%", "10 hours"',
  },
  {
    id: 'hook-contrarian',
    category: 'hook',
    label: 'Bold / contrarian statement',
    weight: 0.18,
    test: (c) => /\b(nobody|no one|nadie|stop|deja de|forget|olvida|wrong|mal|lie|mentira|truth|verdad|actually|en realidad|dead|muerto|killed|mató|obsolet)/i.test(c.hookLower),
    hint: 'Challenge an assumption: "Stop doing X", "Nobody talks about Y", "X is dead"',
  },
  {
    id: 'hook-curiosity-gap',
    category: 'hook',
    label: 'Curiosity gap / open loop',
    weight: 0.15,
    test: (c) => /\b(secret|secreto|nobody knows|nadie sabe|the real|la verdadera|what they don|lo que no|here.?s why|aquí está|the reason|la razón)/i.test(c.hookLower) || /[.!?]\s*$/.test(c.hook) === false,
    hint: 'Tease information without revealing it: "Here\'s why...", "The real reason..."',
  },
  {
    id: 'hook-not-x-but-y',
    category: 'hook',
    label: '"Not X, but Y" pattern',
    weight: 0.12,
    test: (c) => /\bnot\s+\w+.*\s+but\s+/i.test(c.hook) || /\bno es\s+\w+.*\s+sino\s+/i.test(c.hook),
    hint: 'Frame a reversal: "It\'s not about X, it\'s about Y"',
  },
  {
    id: 'hook-short',
    category: 'hook',
    label: 'Hook ≤ 18 words',
    weight: 0.15,
    test: (c) => c.wordsHook > 0 && c.wordsHook <= 18,
    hint: 'Tighten the first line to 18 words or fewer',
  },
  {
    id: 'hook-speed-claim',
    category: 'hook',
    label: 'Speed / time-saving claim (TikTok pattern)',
    weight: 0.12,
    test: (c) => /\b(in\s+\d+|en\s+\d+|60\s*seconds?|segundos?|minutes?|minutos?|hours?|horas?|saves?|ahorra|quick|rápido|instant|instantáneo)\b/i.test(c.hookLower),
    hint: '"In 60 seconds", "Saves 10 hours a week" — speed sells',
  },
  {
    id: 'hook-tension',
    category: 'hook',
    label: 'Creates tension (open loop worth resolving)',
    weight: 0.10,
    test: (c) => /(:|—|\.\.\.|👇|👉)$/.test(c.hook.trim()) || /\b(this is why|por eso|here is how|aquí está)/i.test(c.hookLower),
    hint: 'End the hook with a dangling promise: ":", "...", "Here\'s how 👇"',
  },

  // ---------- STRUCTURE (20%) ----------
  {
    id: 'struct-numbered',
    category: 'structure',
    label: 'Numbered steps / list',
    weight: 0.20,
    test: (c) => (c.text.match(/(^|\n)\s*\d+[.)]\s+/g) || []).length >= 3,
    hint: 'Use "1.", "2.", "3." — listicles outperform walls of text',
  },
  {
    id: 'struct-data',
    category: 'structure',
    label: 'Specific data / metrics in body',
    weight: 0.20,
    test: (c) => (c.text.match(/\b\d+([.,]\d+)?(%|k|m|x|€|\$)/gi) || []).length >= 2,
    hint: 'Include at least 2 concrete metrics in the body',
  },
  {
    id: 'struct-length',
    category: 'structure',
    label: 'Length 80–400 words (LinkedIn sweet spot)',
    weight: 0.20,
    test: (c) => c.words >= 80 && c.words <= 400,
    hint: 'Aim for 80–400 words. Too short = low value, too long = skipped',
  },
  {
    id: 'struct-open-loop',
    category: 'structure',
    label: 'Opens a loop before the payoff',
    weight: 0.15,
    test: (c) => /\b(here.?s what|esto es lo que|the result|el resultado|what happened|lo que pasó|then|entonces|but then|pero luego)\b/i.test(c.lower),
    hint: 'Tease the outcome before delivering it',
  },
  {
    id: 'struct-no-dense',
    category: 'structure',
    label: 'No dense blocks (≤ 3 lines per paragraph)',
    weight: 0.15,
    test: (c) => {
      const paras = c.text.split(/\n\s*\n/);
      return paras.every((p) => p.split('\n').length <= 3);
    },
    hint: 'Break paragraphs every 1–3 lines. Whitespace increases read-through',
  },
  {
    id: 'struct-framework',
    category: 'structure',
    label: 'Uses a clear framework (steps/before-after/story)',
    weight: 0.10,
    test: (c) => /\b(step\s+\d|paso\s+\d|before|después|antes|after|phase|fase|stage|framework|playbook)\b/i.test(c.lower),
    hint: 'Announce the structure: "The 3-step framework…", "Before → After"',
  },

  // ---------- EMOTION (18%) ----------
  {
    id: 'emo-fomo',
    category: 'emotion',
    label: 'FOMO / urgency trigger',
    weight: 0.22,
    test: (c) => /\b(before|antes|missed|perdido|too late|tarde|only|solo|last chance|última|everyone|todos)\b/i.test(c.lower),
    hint: '"Before everyone else", "Only 3 left", "Don\'t miss this"',
  },
  {
    id: 'emo-greed',
    category: 'emotion',
    label: 'Money / gain trigger',
    weight: 0.20,
    test: (c) => /(\$\d|\d+k|\d+\s*€|revenue|ingresos|profit|beneficio|mrr|arr|deals?|clients?|clientes?|sales|ventas)/i.test(c.lower),
    hint: 'Mention real money, deals, or revenue numbers',
  },
  {
    id: 'emo-controversy',
    category: 'emotion',
    label: 'Controversy / hot take',
    weight: 0.18,
    test: (c) => /\b(unpopular|controvers|hot take|hot-take|polémic|disagree|en desacuerdo|wrong|mal|overrated|sobrevalorado)\b/i.test(c.lower),
    hint: '"Unpopular opinion:", "Hot take:", "X is overrated"',
  },
  {
    id: 'emo-insider',
    category: 'emotion',
    label: 'Insider / behind-the-scenes knowledge',
    weight: 0.20,
    test: (c) => /\b(behind the scenes|detrás|insider|what they don.?t|lo que no te cuentan|the truth about|la verdad sobre)\b/i.test(c.lower),
    hint: 'Share what outsiders don\'t see: "Behind the scenes…", "What they don\'t tell you"',
  },
  {
    id: 'emo-personal-proof',
    category: 'emotion',
    label: 'Personal proof ("I tested/built/ran…")',
    weight: 0.20,
    test: (c) => /\b(i (built|tested|ran|tried|made|shipped|spent|lost|earned)|yo (he|construí|probé|hice|gané|perdí))/i.test(c.lower),
    hint: '"I tested…", "I built…", "I spent $X on…"',
  },

  // ---------- FORMAT (15%) ----------
  {
    id: 'fmt-no-links',
    category: 'format',
    label: 'No external links in post body (LinkedIn)',
    weight: 0.30,
    test: (c) => !/https?:\/\//i.test(c.text),
    hint: 'LinkedIn buries posts with external links. Put links in first comment',
  },
  {
    id: 'fmt-spacing',
    category: 'format',
    label: 'Has blank-line paragraph spacing',
    weight: 0.25,
    test: (c) => /\n\s*\n/.test(c.text),
    hint: 'Separate paragraphs with blank lines for scannability',
  },
  {
    id: 'fmt-emoji-markers',
    category: 'format',
    label: 'Uses visual markers (emoji / arrows / bullets)',
    weight: 0.20,
    test: (c) => /[→↳▶👉👇✅❌🔥💡•·▪▫]/.test(c.text) || /(^|\n)[-*]\s+/.test(c.text),
    hint: 'Add arrows (→), bullets, or a couple of emojis as visual anchors',
  },
  {
    id: 'fmt-first-line-hook',
    category: 'format',
    label: 'First line works as standalone hook',
    weight: 0.15,
    test: (c) => c.hook.length >= 20 && c.hook.length <= 140,
    hint: 'LinkedIn shows ~210 chars before "…see more". Make line 1 irresistible',
  },
  {
    id: 'fmt-coherent',
    category: 'format',
    label: 'No ALL-CAPS shouting / wall of emojis',
    weight: 0.10,
    test: (c) => {
      const allCapsWords = (c.text.match(/\b[A-Z]{5,}\b/g) || []).length;
      const emojiCount = (c.text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
      return allCapsWords <= 2 && emojiCount <= 8;
    },
    hint: 'Keep ALL-CAPS and emojis restrained — looks spammy otherwise',
  },

  // ---------- CTA (12%) ----------
  {
    id: 'cta-comment-gate',
    category: 'cta',
    label: 'Comment-gated CTA ("Comment X for…")',
    weight: 0.30,
    test: (c) => /\b(comment|comenta|reply|responde|drop|deja)\b[^.\n]{0,40}\b(below|abajo|get|receive|recibe|send|envío|dm)\b/i.test(c.lower),
    hint: '"Comment \'X\' below and I\'ll send you the template"',
  },
  {
    id: 'cta-at-end',
    category: 'cta',
    label: 'CTA placed near the end',
    weight: 0.25,
    test: (c) => {
      const last = c.text.slice(-200).toLowerCase();
      return /\b(comment|follow|share|save|what do you|qué opinas|your thoughts|tu opinión|let me know|dime)\b/.test(last);
    },
    hint: 'Put the ask in the last 1–2 lines',
  },
  {
    id: 'cta-question',
    category: 'cta',
    label: 'Opinion-forcing question',
    weight: 0.25,
    test: (c) => /\?\s*$/.test(c.text.trim()) || /\?(\s*\n){0,2}\s*$/.test(c.text),
    hint: 'End with a question that forces a side: "Agree or overrated?"',
  },
  {
    id: 'cta-no-link-cta',
    category: 'cta',
    label: 'No "click the link" style CTA',
    weight: 0.20,
    test: (c) => !/\b(click|haz clic|link in bio|enlace en bio|check out|visit)\b/i.test(c.lower),
    hint: 'LinkedIn CTAs should stay on-platform (comment/follow/share)',
  },

  // ---------- TOPIC FIT (10%) ----------
  {
    id: 'topic-sector',
    category: 'topic',
    label: 'On-niche topic keywords',
    weight: 0.35,
    test: (c) => /\b(ai|ia|llm|agent|sdr|outbound|lead gen|prospecting|revenue|sales|ventas|marketing|growth|startup|b2b|saas)\b/i.test(c.lower),
    hint: 'Anchor the post in a clear niche (AI, sales, SaaS, growth…)',
  },
  {
    id: 'topic-tools',
    category: 'topic',
    label: 'Names specific tools / brands',
    weight: 0.25,
    test: (c) => /\b(claude|gpt|openai|anthropic|clay|apollo|hubspot|salesforce|linkedin|notion|zapier|n8n|make)\b/i.test(c.lower),
    hint: 'Drop real tool names — specificity builds credibility',
  },
  {
    id: 'topic-fresh',
    category: 'topic',
    label: 'Fresh angle (not a recycled tip)',
    weight: 0.25,
    test: (c) => /\b(just|acabo|yesterday|ayer|this week|esta semana|new|nuevo|launched|lanzó|released|2025|2026)\b/i.test(c.lower),
    hint: 'Reference something recent: "This week…", "Just launched…"',
  },
  {
    id: 'topic-hashtags',
    category: 'topic',
    label: 'Minimal, relevant hashtags (0–3)',
    weight: 0.15,
    test: (c) => {
      const count = (c.text.match(/#\w+/g) || []).length;
      return count <= 3;
    },
    hint: '0–3 hashtags max. More looks desperate on LinkedIn',
  },
];

function buildCtx(text: string): TextCtx {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const lines = trimmed.split('\n');
  const hook = lines[0]?.trim() || trimmed.slice(0, 140);
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const wordsHook = hook.split(/\s+/).filter(Boolean).length;
  const paragraphs = trimmed.split(/\n\s*\n/).length;
  return { text: trimmed, lower, hook, hookLower: hook.toLowerCase(), lines, words, wordsHook, paragraphs };
}

export function scorePost(text: string) {
  const ctx = buildCtx(text);
  const byCategory: Record<Category, { items: { item: ChecklistItem; passed: boolean }[]; score: number }> = {
    hook: { items: [], score: 0 },
    structure: { items: [], score: 0 },
    emotion: { items: [], score: 0 },
    format: { items: [], score: 0 },
    cta: { items: [], score: 0 },
    topic: { items: [], score: 0 },
  };
  for (const item of CHECKLIST) {
    let passed = false;
    try {
      passed = item.test(ctx);
    } catch {
      passed = false;
    }
    byCategory[item.category].items.push({ item, passed });
    if (passed) byCategory[item.category].score += item.weight;
  }
  let total = 0;
  for (const cat of Object.keys(byCategory) as Category[]) {
    total += byCategory[cat].score * CATEGORY_META[cat].weight;
  }
  const overall = Math.round(total * 100);
  const failing = CHECKLIST.filter((item) =>
    !byCategory[item.category].items.find((i) => i.item.id === item.id)?.passed
  ).map((item) => ({ label: item.label, hint: item.hint || '' }));
  return { byCategory, overall, ctx, failing };
}

interface IterLog {
  iteration: number;
  score: number;
  delta: number;
  accepted: boolean;
  critique: string;
}

export default function PostChecklist({ text, onImproved }: Props) {
  const [improving, setImproving] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [iterLog, setIterLog] = useState<IterLog[]>([]);

  const result = useMemo(() => {
    if (!text || text.trim().length < 20) return null;
    return scorePost(text);
  }, [text]);

  const runAutoImprove = async () => {
    if (!text || !onImproved) return;
    setImproving(true);
    setImproveError(null);
    setIteration(0);
    setBestScore(null);
    setIterLog([]);

    // bestText always holds the highest-scoring version seen so far
    let bestText = text;
    let bestScoreVal = scorePost(text).overall;
    setBestScore(bestScoreVal);
    const originalText = text; // locked reference — AI must never change the core ideas

    // Full conversation history — includes both accepted and rejected iterations
    // so the AI learns what worked and what didn't
    const conversation: { role: 'user' | 'assistant'; content: string }[] = [];

    try {
      for (let i = 1; i <= 5; i++) {
        setIteration(i);
        if (bestScoreVal >= 80) break;

        const score = scorePost(bestText);
        const { failing } = score;

        // Also compute passing checks to tell the AI what NOT to break
        const passingLabels = CHECKLIST
          .filter((item) => score.byCategory[item.category].items.find((e) => e.item.id === item.id)?.passed)
          .map((item) => `- ${item.label}`)
          .join('\n');

        const failingList = failing
          .slice(0, 12)
          .map((f: { label: string; hint: string }) => `- ${f.label}${f.hint ? ' → ' + f.hint : ''}`)
          .join('\n');

        // Compose the user turn
        let userContent: string;
        if (i === 1) {
          userContent =
            `POST ORIGINAL (la idea, el tema y los datos NO pueden cambiar):\n${originalText}\n\n` +
            `VERSIÓN A MEJORAR (puntuación: ${score.overall}/100):\n${bestText}\n\n` +
            `CHECKS QUE PASAN ✓ — NO los rompas:\n${passingLabels}\n\n` +
            `CHECKS QUE FALLAN ✗ — mejora SOLO estructura, formato y mecánicas virales:\n${failingList}\n\n` +
            `Mejora únicamente la estructura y el formato. La idea, el tema y los datos del post original deben permanecer intactos. ` +
            `Devuelve CRITIQUE: + --- + post mejorado.`;
        } else {
          userContent =
            `MEJOR VERSIÓN HASTA AHORA (puntuación: ${score.overall}/100):\n${bestText}\n\n` +
            `CHECKS QUE PASAN ✓ — NO los rompas:\n${passingLabels}\n\n` +
            `CHECKS QUE SIGUEN FALLANDO ✗ — usa técnicas ESTRUCTURALES diferentes a las anteriores:\n${failingList}\n\n` +
            `Recuerda: misma idea, mismos datos del post original, solo mejora la forma. Lee tu CRITIQUE anterior y aplícalo. ` +
            `Devuelve CRITIQUE: + --- + post mejorado.`;
        }

        conversation.push({ role: 'user', content: userContent });

        const res = await fetch(`${BASE}/api/chat/improve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversation }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        const data = await res.json();
        const improved = (data.text || '').trim();
        const critique = (data.critique || '').trim();
        const raw = (data.raw || '').trim();
        if (!improved) throw new Error('Respuesta vacía del AI');

        const newScore = scorePost(improved).overall;
        const delta = newScore - bestScoreVal;
        const accepted = newScore > bestScoreVal;

        // Store FULL raw (critique + post) in conversation so next iteration
        // reads the AI's own reasoning and knows what techniques were tried
        // Also annotate rejected iterations so the AI knows not to repeat them
        const assistantEntry = raw || improved;
        const rejectionNote = accepted
          ? assistantEntry
          : `${assistantEntry}\n\n[SYSTEM NOTE: This rewrite scored ${newScore}/100 — lower than the current best of ${bestScoreVal}/100. It was rejected. Do NOT repeat the same changes.]`;

        conversation.push({ role: 'assistant', content: rejectionNote });

        if (accepted) {
          bestText = improved;
          bestScoreVal = newScore;
          setBestScore(bestScoreVal);
          onImproved(improved); // only update preview when we actually improve
        }

        setIterLog((prev) => [...prev, { iteration: i, score: newScore, delta, accepted, critique }]);

        if (bestScoreVal >= 80) break;
      }
    } catch (err: any) {
      setImproveError(err.message);
    } finally {
      setImproving(false);
    }
  };

  if (!result) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-4 text-xs text-text-muted">
        Checklist will appear once the post has at least 20 characters.
      </div>
    );
  }

  const { byCategory, overall } = result;
  const scoreColor = overall >= 75 ? '#10b981' : overall >= 50 ? '#f59e0b' : '#ef4444';
  const verdict = overall >= 75 ? 'Viral-ready' : overall >= 50 ? 'Decent — tighten below' : 'Needs work';

  // Circular progress ring
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - overall / 100);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg width="64" height="64" className="-rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#1f2937" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={scoreColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center text-sm font-bold"
            style={{ color: scoreColor }}
          >
            {overall}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Outlier Checklist</p>
          <p className="text-xs" style={{ color: scoreColor }}>
            {verdict}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {result.ctx.words} words · hook {result.ctx.wordsHook}w
          </p>
        </div>
        {onImproved && (
          <button
            onClick={runAutoImprove}
            disabled={improving || overall >= 80}
            title={overall >= 80 ? 'Already above 80 — you\'re good' : 'Iteratively rewrite with AI until score ≥ 80 (max 5 passes)'}
            className="px-3 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg text-[11px] font-medium hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {improving ? `Improving ${iteration}/5…` : '✨ Auto-improve'}
          </button>
        )}
      </div>

      {improving && (
        <div className="text-[10px] text-text-muted animate-pulse">
          Iteración {iteration}/5 · mejor puntuación: {bestScore ?? overall}…
        </div>
      )}

      {iterLog.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
            Historial de iteraciones
          </p>
          {iterLog.map((log) => (
            <div key={log.iteration} className="text-[10px] space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded ${log.accepted ? 'bg-green-900/40 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {log.accepted ? '✓ aceptada' : '✗ revertida'}
                </span>
                <span className="font-semibold text-text-primary">Iter {log.iteration}</span>
                <span
                  className="font-bold"
                  style={{ color: log.score >= 75 ? '#10b981' : log.score >= 50 ? '#f59e0b' : '#ef4444' }}
                >
                  {log.score}/100
                </span>
                <span className={`text-[9px] ${log.delta > 0 ? 'text-green-400' : log.delta < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                  {log.delta > 0 ? `+${log.delta}` : log.delta}
                </span>
              </div>
              {log.critique && (
                <p className="text-text-muted leading-tight italic pl-3 border-l border-border">
                  {log.critique}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {improveError && (
        <div className="text-[10px] text-danger">Error: {improveError}</div>
      )}

      {/* Category bars */}
      <div className="space-y-2">
        {(Object.keys(byCategory) as Category[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const pct = Math.round(byCategory[cat].score * 100);
          return (
            <div key={cat}>
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-text-secondary font-medium">
                  {meta.label} <span className="text-text-muted">· {Math.round(meta.weight * 100)}%</span>
                </span>
                <span style={{ color: meta.color }}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Failing items with hints */}
      <div className="border-t border-border pt-3">
        <p className="text-[10px] font-semibold text-text-secondary mb-2 uppercase tracking-wide">
          Suggestions
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {CHECKLIST.filter((item) => {
            const entry = byCategory[item.category].items.find((i) => i.item.id === item.id);
            return entry && !entry.passed;
          })
            .slice(0, 8)
            .map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-[11px]">
                <span className="text-danger mt-0.5">✗</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-secondary">{item.label}</p>
                  {item.hint && <p className="text-text-muted text-[10px] leading-tight">{item.hint}</p>}
                </div>
              </div>
            ))}
          {CHECKLIST.every((item) => {
            const entry = byCategory[item.category].items.find((i) => i.item.id === item.id);
            return entry?.passed;
          }) && <p className="text-[11px] text-green-400">All checks passed. Ship it.</p>}
        </div>
      </div>

      {/* Passing items collapsed count */}
      <div className="border-t border-border pt-2 flex items-center justify-between text-[10px] text-text-muted">
        <span>
          {CHECKLIST.filter((item) => byCategory[item.category].items.find((i) => i.item.id === item.id)?.passed).length}
          /{CHECKLIST.length} checks passing
        </span>
      </div>
    </div>
  );
}
