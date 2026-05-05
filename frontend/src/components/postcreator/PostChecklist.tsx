import { useEffect, useMemo, useState, type ReactNode } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  text: string;
  onImproved?: (newText: string) => void;
}

type Category = 'hook' | 'structure' | 'format' | 'cta' | 'topic';
export type Pillar = 'curiosity' | 'fear' | 'desire';

interface ChecklistItem {
  id: string;
  category: Category;
  label: string;
  weight: number;
  test: (ctx: TextCtx) => boolean;
  hint?: string;
}

interface PillarTrigger {
  id: string;
  pillar: Pillar;
  label: string;
  weight: number;
  test: (ctx: TextCtx) => boolean;
  hint?: string;
}

interface TextCtx {
  text: string;
  lower: string;
  hook: string;
  hookLower: string;
  lines: string[];
  words: number;
  wordsHook: number;
  paragraphs: number;
}

// Category weights normalized to sum 1.0 (emotion category removed — moved to pillar layer)
const CATEGORY_META: Record<Category, { label: string; weight: number; color: string }> = {
  hook: { label: 'Hook', weight: 0.30, color: '#f59e0b' },
  structure: { label: 'Structure', weight: 0.25, color: '#10b981' },
  format: { label: 'Format', weight: 0.18, color: '#3b82f6' },
  cta: { label: 'CTA', weight: 0.15, color: '#a855f7' },
  topic: { label: 'Topic Fit', weight: 0.12, color: '#06b6d4' },
};

const PILLAR_META: Record<Pillar, { label: string; icon: string; color: string }> = {
  curiosity: { label: 'Curiosidad', icon: '🔍', color: '#a855f7' },
  fear: { label: 'Miedo', icon: '⚠️', color: '#ef4444' },
  desire: { label: 'Deseo', icon: '🎯', color: '#f59e0b' },
};

const CHECKLIST: ChecklistItem[] = [
  // ---------- HOOK (30%) ----------
  {
    id: 'hook-numeric',
    category: 'hook',
    label: 'Numeric contrast (concrete numbers in hook)',
    weight: 0.22,
    test: (c) => /\b\d+([.,]\d+)?(%|k|m|x|€|\$|€|h|hr|hrs|min|days?|años?|meses?|semanas?)?\b/i.test(c.hook),
    hint: 'Use a specific number: "$20K", "3x", "47%", "10 hours"',
  },
  {
    id: 'hook-short',
    category: 'hook',
    label: 'Hook ≤ 18 words',
    weight: 0.20,
    test: (c) => c.wordsHook > 0 && c.wordsHook <= 18,
    hint: 'Tighten the first line to 18 words or fewer',
  },
  {
    id: 'hook-tension',
    category: 'hook',
    label: 'Hook ends with an open loop (":" "…" "👇")',
    weight: 0.18,
    test: (c) => /(:|—|\.\.\.|👇|👉)$/.test(c.hook.trim()) || /\b(this is why|por eso|here is how|aquí está)/i.test(c.hookLower),
    hint: 'End the hook with a dangling promise: ":", "...", "Here\'s how 👇"',
  },
  {
    id: 'hook-first-line-length',
    category: 'hook',
    label: 'First line 20–140 chars (fits LinkedIn preview)',
    weight: 0.20,
    test: (c) => c.hook.length >= 20 && c.hook.length <= 140,
    hint: 'LinkedIn cuts at ~210 chars before "…see more". Keep line 1 between 20–140.',
  },
  {
    id: 'hook-specificity',
    category: 'hook',
    label: 'Hook names a specific subject (not generic)',
    weight: 0.20,
    test: (c) => /\b(claude|gpt|openai|anthropic|clay|apollo|hubspot|salesforce|linkedin|notion|zapier|n8n|ai|ia|llm|agent|sdr|outbound|saas|b2b)\b/i.test(c.hookLower) || /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/.test(c.hook),
    hint: 'Anclar el hook en algo específico: herramienta, industria, o nombre propio',
  },

  // ---------- STRUCTURE (25%) ----------
  {
    id: 'struct-numbered',
    category: 'structure',
    label: 'Numbered steps / list',
    weight: 0.22,
    test: (c) => (c.text.match(/(^|\n)\s*\d+[.)]\s+/g) || []).length >= 3,
    hint: 'Use "1.", "2.", "3." — listicles outperform walls of text',
  },
  {
    id: 'struct-data',
    category: 'structure',
    label: 'Specific data / metrics in body',
    weight: 0.22,
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
    weight: 0.18,
    test: (c) => /\b(here.?s what|esto es lo que|the result|el resultado|what happened|lo que pasó|then|entonces|but then|pero luego)\b/i.test(c.lower),
    hint: 'Tease the outcome before delivering it',
  },
  {
    id: 'struct-no-dense',
    category: 'structure',
    label: 'No dense blocks (≤ 3 lines per paragraph)',
    weight: 0.18,
    test: (c) => {
      const paras = c.text.split(/\n\s*\n/);
      return paras.every((p) => p.split('\n').length <= 3);
    },
    hint: 'Break paragraphs every 1–3 lines. Whitespace increases read-through',
  },

  // ---------- FORMAT (18%) ----------
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
    id: 'fmt-coherent',
    category: 'format',
    label: 'No ALL-CAPS shouting / wall of emojis',
    weight: 0.15,
    test: (c) => {
      const allCapsWords = (c.text.match(/\b[A-Z]{5,}\b/g) || []).length;
      const emojiCount = (c.text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
      return allCapsWords <= 2 && emojiCount <= 8;
    },
    hint: 'Keep ALL-CAPS and emojis restrained — looks spammy otherwise',
  },
  {
    id: 'fmt-scannable',
    category: 'format',
    label: 'Mixes short lines with body (scannable rhythm)',
    weight: 0.10,
    test: (c) => {
      const shortLines = c.lines.filter((l) => {
        const t = l.trim();
        return t.length > 0 && t.length <= 40;
      }).length;
      return shortLines >= 2;
    },
    hint: 'Add 2+ short, punchy lines (≤40 chars) to break rhythm',
  },

  // ---------- CTA (15%) ----------
  {
    id: 'cta-at-end',
    category: 'cta',
    label: 'CTA placed near the end',
    weight: 0.35,
    test: (c) => {
      const last = c.text.slice(-200).toLowerCase();
      return /\b(comment|follow|share|save|what do you|qué opinas|your thoughts|tu opinión|let me know|dime|agree|disagree|de acuerdo|opinas)\b/.test(last);
    },
    hint: 'Put the ask in the last 1–2 lines',
  },
  {
    id: 'cta-question',
    category: 'cta',
    label: 'Opinion-forcing question',
    weight: 0.30,
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
  {
    id: 'cta-natural',
    category: 'cta',
    label: 'CTA natural (no plantilla "Comenta X para el PDF")',
    weight: 0.15,
    test: (c) => {
      const last = c.text.slice(-300).toLowerCase();
      const templated = /\b(comenta|comment)\s+["'“”]?\w+["'“”]?\s+(abajo|below|y te|and i'?ll)/i.test(last);
      return !templated;
    },
    hint: 'Evita fórmulas repetidas tipo "Comenta \'GUÍA\' abajo y te la mando"',
  },

  // ---------- TOPIC FIT (12%) ----------
  {
    id: 'topic-sector',
    category: 'topic',
    label: 'On-niche topic keywords',
    weight: 0.40,
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
    weight: 0.20,
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

// ===== PILLAR TRIGGERS =====
// Each post should fire ONE pillar hard, not all three softly.
// Weights per trigger sum to ~1.0+ per pillar so a focused post can hit intensity 1.0.
const PILLAR_TRIGGERS: PillarTrigger[] = [
  // ---- CURIOSITY ----
  {
    id: 'cur-gap',
    pillar: 'curiosity',
    label: 'Curiosity gap ("nadie sabe / the real reason / lo que no te cuentan")',
    weight: 0.25,
    test: (c) => /\b(secret|secreto|nobody knows|nadie sabe|the real|la verdadera|what they don'?t|lo que no|here'?s why|aquí está|the reason|la razón|plot twist)\b/i.test(c.lower),
    hint: '"Nadie sabe que…", "la razón real es…", "lo que no te dicen sobre X"',
  },
  {
    id: 'cur-notxbuty',
    pillar: 'curiosity',
    label: '"Not X, but Y" reversal',
    weight: 0.20,
    test: (c) => /\bnot\s+\w+[^.\n]{0,60}\bbut\s+/i.test(c.text) || /\bno es\s+\w+[^.\n]{0,60}\bsino\s+/i.test(c.text),
    hint: 'Invierte la expectativa: "No es sobre X, es sobre Y"',
  },
  {
    id: 'cur-contrarian',
    pillar: 'curiosity',
    label: 'Contrarian hook (nadie / stop / wrong / truth)',
    weight: 0.20,
    test: (c) => /\b(nobody|no one|nadie|stop|deja de|forget|olvida|wrong|mal|lie|mentira|truth|verdad|actually|en realidad)\b/i.test(c.hookLower),
    hint: 'Rompe creencia en el hook: "Nadie te habla de X", "La verdad sobre Y"',
  },
  {
    id: 'cur-insider',
    pillar: 'curiosity',
    label: 'Insider view (behind the scenes / la verdad sobre)',
    weight: 0.18,
    test: (c) => /\b(behind the scenes|detrás de|insider|what they don'?t tell|lo que no te cuentan|the truth about|la verdad sobre)\b/i.test(c.lower),
    hint: '"Behind the scenes…", "lo que no te cuentan sobre…"',
  },
  {
    id: 'cur-controversy',
    pillar: 'curiosity',
    label: 'Hot take / unpopular opinion',
    weight: 0.15,
    test: (c) => /\b(unpopular|controvers|hot take|hot-take|polémic|disagree|en desacuerdo|overrated|sobrevalorado)\b/i.test(c.lower),
    hint: '"Unpopular opinion:", "X is overrated", "hot take:"',
  },
  {
    id: 'cur-tension',
    pillar: 'curiosity',
    label: 'Hook teases without revealing',
    weight: 0.12,
    test: (c) => /(:|—|\.\.\.|👇|👉)$/.test(c.hook.trim()),
    hint: 'Termina el hook con ":", "…", "👇" para dejar el loop abierto',
  },

  // ---- FEAR (FOMO + obsolescence + stakes) ----
  {
    id: 'fea-fomo',
    pillar: 'fear',
    label: 'FOMO (before / missed / only / last chance)',
    weight: 0.25,
    test: (c) => /\b(before|antes|missed|perdido|too late|tarde|only|solo|last chance|última|úultimo)\b/i.test(c.lower),
    hint: '"Antes de que sea tarde", "before everyone else", "solo esta semana"',
  },
  {
    id: 'fea-obsolete',
    pillar: 'fear',
    label: 'Obsolescence ("X is dead / killed / obsoleto")',
    weight: 0.25,
    test: (c) => /\b(dead|muerto|killed|mató|obsolet|dying|muriendo|replaced|reemplazado)\b/i.test(c.lower),
    hint: '"X ha muerto", "Y is dead", "es obsoleto ya"',
  },
  {
    id: 'fea-everyone',
    pillar: 'fear',
    label: 'Bandwagon ("everyone is doing / todos están")',
    weight: 0.18,
    test: (c) => /\b(everyone|todos|everybody)\b[^.\n]{0,60}\b(uses?|usan|usando|doing|haciendo|adopted|adoptar|have|tienen|moved|migrating|migrando)\b/i.test(c.lower),
    hint: '"Everyone is already using X", "todos están migrando a Y"',
  },
  {
    id: 'fea-leftbehind',
    pillar: 'fear',
    label: 'Risk of being left behind',
    weight: 0.15,
    test: (c) => /\b(left behind|quedarse (fuera|atrás)|fall behind|falling behind|get replaced|quedarte sin)\b/i.test(c.lower),
    hint: '"Don\'t get left behind", "no te quedes fuera", "te van a reemplazar"',
  },
  {
    id: 'fea-stakes',
    pillar: 'fear',
    label: 'Concrete stakes (cost of inaction)',
    weight: 0.15,
    test: (c) => /\b(you'?ll lose|perderás|it'?ll cost|te costará|big mistake|grave error|costly mistake|error caro)\b/i.test(c.lower),
    hint: '"You\'ll lose $X if…", "el error que más te cuesta"',
  },
  {
    id: 'fea-urgency',
    pillar: 'fear',
    label: 'Time urgency (now / today / esta semana)',
    weight: 0.10,
    test: (c) => /\b(right now|ahora mismo|today|hoy|this week|esta semana|this month|este mes)\b/i.test(c.lower),
    hint: '"Right now", "esta semana" — marca urgencia temporal',
  },

  // ---- DESIRE (aspirational outcome + gain) ----
  {
    id: 'des-money',
    pillar: 'desire',
    label: 'Money / revenue proof ($XK / ingresos / MRR)',
    weight: 0.25,
    test: (c) => /(\$\s?\d|\b\d+\s?k\b|\d+\s?€|revenue|ingresos|profit|beneficio|\bmrr\b|\barr\b|ventas|\bsales\b)/i.test(c.lower),
    hint: '"$20K MRR", "12k€ en ventas", "ingresos recurrentes"',
  },
  {
    id: 'des-personal',
    pillar: 'desire',
    label: 'Personal proof ("I built / I tested / lo construí")',
    weight: 0.20,
    test: (c) => /\b(i\s+(built|tested|ran|tried|made|shipped|spent|lost|earned|created|launched|scaled|grew)|yo\s+(he|construí|probé|hice|gané|perdí|creé|lancé|escalé))\b/i.test(c.lower),
    hint: '"I tested this for 30 days", "lo construí en un fin de semana"',
  },
  {
    id: 'des-speed',
    pillar: 'desire',
    label: 'Speed / time-saving ("in X min / ahorra Y horas")',
    weight: 0.15,
    test: (c) => /\b(in\s+\d+|en\s+\d+|saves?\b|ahorra|saved|ahorré|quick|rápido|instant|60\s?(seconds?|segundos?))\b/i.test(c.lower),
    hint: '"In 30 minutes", "ahorra 10 horas/semana", "saves 5h weekly"',
  },
  {
    id: 'des-howto',
    pillar: 'desire',
    label: 'How-to framing (result-oriented)',
    weight: 0.12,
    test: (c) => /\b(how\s+(to|i|we)|cómo\s+(yo|lo|hacer|hice|construir|conseguí)|the way to|la forma de)\b/i.test(c.lower),
    hint: '"How I got X", "cómo conseguí Y", "the way to Z"',
  },
  {
    id: 'des-numbered',
    pillar: 'desire',
    label: 'Numbered method ("5 ways / 3 pasos")',
    weight: 0.15,
    test: (c) => /\b(\d+\s+(steps?|pasos?|ways?|formas?|tips|trucos|reglas|rules)|the\s+\d+\s|los\s+\d+\s)/i.test(c.lower),
    hint: '"The 3 steps to…", "5 formas de…"',
  },
  {
    id: 'des-framework',
    pillar: 'desire',
    label: 'Named system (framework / playbook / método)',
    weight: 0.15,
    test: (c) => /\b(framework|playbook|blueprint|system|sistema|stack|método|method|formula|fórmula|proceso|process)\b/i.test(c.lower),
    hint: '"Mi playbook", "the 3-step framework", "el método que uso"',
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

export interface PillarsResult {
  curiosity: number;
  fear: number;
  desire: number;
  dominant: Pillar | null;
  intensity: number;
  triggersByPillar: Record<Pillar, { trigger: PillarTrigger; passed: boolean }[]>;
}

function detectPillars(ctx: TextCtx): PillarsResult {
  const sums: Record<Pillar, number> = { curiosity: 0, fear: 0, desire: 0 };
  const triggersByPillar: Record<Pillar, { trigger: PillarTrigger; passed: boolean }[]> = {
    curiosity: [], fear: [], desire: [],
  };
  for (const t of PILLAR_TRIGGERS) {
    let passed = false;
    try { passed = t.test(ctx); } catch { passed = false; }
    triggersByPillar[t.pillar].push({ trigger: t, passed });
    if (passed) sums[t.pillar] += t.weight;
  }
  const curiosity = Math.min(1, sums.curiosity);
  const fear = Math.min(1, sums.fear);
  const desire = Math.min(1, sums.desire);
  const ranked: { p: Pillar; v: number }[] = ([
    { p: 'curiosity' as Pillar, v: curiosity },
    { p: 'fear' as Pillar, v: fear },
    { p: 'desire' as Pillar, v: desire },
  ]).sort((a, b) => b.v - a.v);
  // Dominant only if clearly ahead and above threshold
  const dominant = ranked[0].v >= 0.20 && (ranked[0].v - ranked[1].v) >= 0.05 ? ranked[0].p : (ranked[0].v >= 0.35 ? ranked[0].p : null);
  const intensity = ranked[0].v;
  return { curiosity, fear, desire, dominant, intensity, triggersByPillar };
}

export interface ScoreResult {
  byCategory: Record<Category, { items: { item: ChecklistItem; passed: boolean }[]; score: number }>;
  overall: number;
  ctx: TextCtx;
  failing: { label: string; hint: string }[];
  pillars: PillarsResult;
  structural: number;
}

export function scorePost(text: string): ScoreResult {
  const ctx = buildCtx(text);

  // FIX: empty / trivial input must score 0 — previously default-true regex inflated score to ~12-17
  if (ctx.words < 10 || ctx.text.length === 0) {
    const byCategory: Record<Category, { items: { item: ChecklistItem; passed: boolean }[]; score: number }> = {
      hook: { items: [], score: 0 },
      structure: { items: [], score: 0 },
      format: { items: [], score: 0 },
      cta: { items: [], score: 0 },
      topic: { items: [], score: 0 },
    };
    for (const item of CHECKLIST) byCategory[item.category].items.push({ item, passed: false });
    return {
      byCategory,
      overall: 0,
      ctx,
      failing: CHECKLIST.map((i) => ({ label: i.label, hint: i.hint || '' })),
      pillars: {
        curiosity: 0, fear: 0, desire: 0, dominant: null, intensity: 0,
        triggersByPillar: {
          curiosity: PILLAR_TRIGGERS.filter((t) => t.pillar === 'curiosity').map((trigger) => ({ trigger, passed: false })),
          fear: PILLAR_TRIGGERS.filter((t) => t.pillar === 'fear').map((trigger) => ({ trigger, passed: false })),
          desire: PILLAR_TRIGGERS.filter((t) => t.pillar === 'desire').map((trigger) => ({ trigger, passed: false })),
        },
      },
      structural: 0,
    };
  }

  const byCategory: Record<Category, { items: { item: ChecklistItem; passed: boolean }[]; score: number }> = {
    hook: { items: [], score: 0 },
    structure: { items: [], score: 0 },
    format: { items: [], score: 0 },
    cta: { items: [], score: 0 },
    topic: { items: [], score: 0 },
  };
  for (const item of CHECKLIST) {
    let passed = false;
    try { passed = item.test(ctx); } catch { passed = false; }
    byCategory[item.category].items.push({ item, passed });
    if (passed) byCategory[item.category].score += item.weight;
  }

  let structural = 0;
  for (const cat of Object.keys(byCategory) as Category[]) {
    structural += byCategory[cat].score * CATEGORY_META[cat].weight;
  }

  const pillars = detectPillars(ctx);

  // Final score: 50% structural craft + 50% pillar intensity
  // Rewards posts that fire ONE pillar hard over posts that tick boxes everywhere
  const overall = Math.round((structural * 0.5 + pillars.intensity * 0.5) * 100);

  const failing = CHECKLIST.filter((item) =>
    !byCategory[item.category].items.find((i) => i.item.id === item.id)?.passed
  ).map((item) => ({ label: item.label, hint: item.hint || '' }));

  return { byCategory, overall, ctx, failing, pillars, structural };
}

// ─── Data-driven scoring layer ────────────────────────────────────────────────
// The structural CHECKLIST above is heuristic regex; this layer pulls actual
// outlier archetypes from the database (same data the Post Creator picks
// archetypes from) and grades how close the draft post's classified
// (hook_type, post_structure) pair sits to those proven combinations.

export interface ArchetypeEntry {
  hook_type: string;
  post_structure: string;
  avg_ratio: number;
  max_ratio: number;
  sample_count: number;
  example_hook: string | null;
  example_text: string | null;
  dominant_tone: string | null;
}

// Pick the archetype the improver should aim for given the post's current
// classification. If the post is already in the top-3 by avg_ratio we keep it
// (the right move is to intensify it, not switch). Otherwise we try to find a
// stronger archetype that shares either the hook_type or post_structure with
// the current — that's the closest possible move. Falls back to the top
// archetype overall if nothing partial-matches.
export function pickTargetArchetype(
  current: PostClassification | null,
  leaderboard: ArchetypeEntry[]
): ArchetypeEntry | null {
  if (leaderboard.length === 0) return null;
  if (current && current.hook_type !== 'other' && current.post_structure !== 'other') {
    const currentIdx = leaderboard.findIndex(
      (a) => a.hook_type === current.hook_type && a.post_structure === current.post_structure
    );
    // Already in top 3? Keep — intensify rather than switch shape.
    if (currentIdx >= 0 && currentIdx < 3) return leaderboard[currentIdx];

    const currentRatio = currentIdx >= 0 ? leaderboard[currentIdx].avg_ratio : 0;
    const partialMatch = leaderboard.find(
      (a) => a.avg_ratio > currentRatio &&
        (a.hook_type === current.hook_type || a.post_structure === current.post_structure)
    );
    if (partialMatch) return partialMatch;
  }
  return leaderboard[0];
}

export interface PostClassification {
  hook_type: string;
  post_structure: string;
  text_tone: string;
  hook_text: string | null;
}

// Map the leaderboard ratio onto a 0–1 score. We want a 5x archetype to feel
// strong (≈0.85), a 3x to feel decent (≈0.55), and a sub-2x to feel weak. The
// curve is gentle — small differences at the top shouldn't dominate.
function ratioToScore(avgRatio: number): number {
  if (avgRatio <= 0) return 0;
  // Saturating curve: score = ratio / (ratio + 4) gives 0.5 at 4x, 0.6 at 6x,
  // 0.71 at 10x. Then gently lifted so a 3x archetype still scores ~0.55.
  const base = avgRatio / (avgRatio + 4);
  return Math.min(1, base * 1.4);
}

// Compute the data-fit score for a classified post against the leaderboard.
// Returns 0 when classification is missing or the (hook, structure) pair isn't
// in the leaderboard at all — i.e. the post is fighting our outlier patterns.
export function computeDataFit(
  classification: PostClassification | null,
  leaderboard: ArchetypeEntry[]
): { score: number; matched: ArchetypeEntry | null; rank: number | null } {
  if (!classification || leaderboard.length === 0) return { score: 0, matched: null, rank: null };
  // 'other' classifications carry no information — treat as zero data fit.
  if (classification.hook_type === 'other' || classification.post_structure === 'other') {
    return { score: 0, matched: null, rank: null };
  }
  const idx = leaderboard.findIndex(
    (a) => a.hook_type === classification.hook_type && a.post_structure === classification.post_structure
  );
  if (idx === -1) return { score: 0, matched: null, rank: null };
  const matched = leaderboard[idx];
  let score = ratioToScore(matched.avg_ratio);
  // Tiny rank bonus so top-3 feel a touch better than mid-pack at the same ratio.
  if (idx < 3) score = Math.min(1, score + 0.05);
  return { score, matched, rank: idx + 1 };
}

// New blended overall: structural craft + pillar intensity + data fit.
// Reweighted so data fit pulls real weight (was 50/50 craft/pillar before).
export function blendedOverall(
  structural: number,
  pillarIntensity: number,
  dataFit: number
): number {
  return Math.round((structural * 0.35 + pillarIntensity * 0.35 + dataFit * 0.30) * 100);
}

interface IterLog {
  iteration: number;
  score: number;
  delta: number;
  accepted: boolean;
  critique: string;
}

type Section = 'pillars' | 'craft' | 'history';

export default function PostChecklist({ text, onImproved }: Props) {
  const [improving, setImproving] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [iterLog, setIterLog] = useState<IterLog[]>([]);
  // User-picked pillar takes precedence over the auto-detected dominant one:
  // the heuristic misfires often, and the right pillar is a creative decision
  // the human is best placed to make.
  const [selectedPillar, setSelectedPillar] = useState<Pillar | 'auto'>('auto');

  // Explicit lead-magnet flag. The improve prompt has a heuristic but it
  // sometimes mis-classifies and strips the "Comenta X y te lo mando" CTA
  // when the user actually wants it. With this flag ON, the rewrite MUST
  // keep / add the lead-magnet ask.
  const [isLeadMagnet, setIsLeadMagnet] = useState(false);

  // Collapsible detail sections — collapsed by default so the resting state
  // is just score + dominant pillar + suggestions + Auto-improve. Detail
  // expands on demand to avoid the "wall of bars" feeling.
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    pillars: false,
    craft: false,
    history: false,
  });
  const toggleSection = (s: Section) =>
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const result = useMemo(() => {
    if (!text || text.trim().length < 20) return null;
    return scorePost(text);
  }, [text]);

  // ─── Data-driven scoring layer ─────────────────────────────────────────
  // Fetch the archetype leaderboard once on mount — same query the Post
  // Creator uses to pick which archetypes to write into. Cached for the
  // session so live recomputes stay fast.
  const [leaderboard, setLeaderboard] = useState<ArchetypeEntry[]>([]);
  const [classification, setClassification] = useState<PostClassification | null>(null);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/api/analysis/archetype-leaderboard`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setLeaderboard(Array.isArray(d?.archetypes) ? d.archetypes : []);
      })
      .catch(() => {
        if (!cancelled) setLeaderboard([]);
      });
    return () => { cancelled = true; };
  }, []);

  // Debounced classify — runs on the backend (reuses enrichPost) so the
  // hook_type/post_structure detection matches scrape-time labels exactly.
  // 600ms debounce keeps it cheap while typing.
  useEffect(() => {
    if (!text || text.trim().length < 20) {
      setClassification(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setClassifying(true);
      try {
        const res = await fetch(`${BASE}/api/analysis/classify-post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;
        setClassification({
          hook_type: data.hook_type,
          post_structure: data.post_structure,
          text_tone: data.text_tone,
          hook_text: data.hook_text,
        });
      } catch {
        if (!cancelled) setClassification(null);
      } finally {
        if (!cancelled) setClassifying(false);
      }
    }, 600);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [text]);

  const dataFit = useMemo(
    () => computeDataFit(classification, leaderboard),
    [classification, leaderboard]
  );

  const runAutoImprove = async () => {
    if (!text || !onImproved) return;
    setImproving(true);
    setImproveError(null);
    setIteration(0);
    setBestScore(null);
    setIterLog([]);

    // Helper: classify a post via the backend (same enrichPost the scrape
    // pipeline uses) and return both the classification and the data-fit
    // number against the leaderboard we already loaded. Tolerant of failures.
    const classifyAndScore = async (
      txt: string
    ): Promise<{ classification: PostClassification | null; dataFit: number }> => {
      try {
        const res = await fetch(`${BASE}/api/analysis/classify-post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: txt }),
        });
        if (!res.ok) return { classification: null, dataFit: 0 };
        const data = await res.json();
        const cls: PostClassification = {
          hook_type: data.hook_type,
          post_structure: data.post_structure,
          text_tone: data.text_tone,
          hook_text: data.hook_text,
        };
        return { classification: cls, dataFit: computeDataFit(cls, leaderboard).score };
      } catch {
        return { classification: null, dataFit: 0 };
      }
    };

    let bestText = text;
    let best = scorePost(text);
    const initial = await classifyAndScore(text);
    let bestClassification = initial.classification;
    let bestDataFit = initial.dataFit;
    let bestScoreVal = blendedOverall(best.structural, best.pillars.intensity, bestDataFit);
    setBestScore(bestScoreVal);
    const originalText = text;
    // If the user manually picked a pillar, that wins. Otherwise fall back to
    // whatever the heuristic detected (may be null → prompt tells the model to
    // pick one based on the post's message).
    const originalPillar: Pillar | null =
      selectedPillar !== 'auto' ? selectedPillar : best.pillars.dominant;
    const originalIntensity = best.pillars.intensity;

    const conversation: { role: 'user' | 'assistant'; content: string }[] = [];

    try {
      for (let i = 1; i <= 5; i++) {
        setIteration(i);

        const score = scorePost(bestText);
        const { failing, pillars } = score;
        const blendedCurrent = blendedOverall(score.structural, pillars.intensity, bestDataFit);

        const passingLabels = CHECKLIST
          .filter((item) => score.byCategory[item.category].items.find((e) => e.item.id === item.id)?.passed)
          .map((item) => `- ${item.label}`)
          .join('\n');

        const failingList = failing
          .slice(0, 10)
          .map((f) => `- ${f.label}${f.hint ? ' → ' + f.hint : ''}`)
          .join('\n');

        // Target pillar = the one we should intensify (prefer original dominant if any, else current)
        const targetPillar: Pillar | null = originalPillar || pillars.dominant;
        const pillarDetail = targetPillar
          ? `DOMINANT PILLAR: ${targetPillar.toUpperCase()} (current intensity: ${Math.round(pillars[targetPillar] * 100)}%)\n` +
            `This is the ONLY pillar to intensify. DO NOT add triggers for the other two pillars.\n` +
            `Missing ${targetPillar} triggers (intensify these):\n` +
            pillars.triggersByPillar[targetPillar]
              .filter((t) => !t.passed)
              .slice(0, 4)
              .map((t) => `  - ${t.trigger.label}${t.trigger.hint ? ' → ' + t.trigger.hint : ''}`)
              .join('\n')
          : `NO DOMINANT PILLAR YET. Curiosity ${Math.round(pillars.curiosity * 100)}% / Fear ${Math.round(pillars.fear * 100)}% / Desire ${Math.round(pillars.desire * 100)}%.\n` +
            `Pick the one most aligned with the post's MESSAGE and intensify ONLY that one.`;

        let userContent: string;
        if (i === 1) {
          userContent =
            `ORIGINAL POST (idea, topic and data CANNOT change):\n${originalText}\n\n` +
            `CURRENT SCORE: ${blendedCurrent}/100 (structural ${Math.round(score.structural * 100)}% + pillar intensity ${Math.round(pillars.intensity * 100)}% + data fit ${Math.round(bestDataFit * 100)}%)\n\n` +
            `${pillarDetail}\n\n` +
            `PASSING STRUCTURAL CHECKS ✓ — do not break:\n${passingLabels}\n\n` +
            `FAILING STRUCTURAL CHECKS ✗:\n${failingList}\n\n` +
            `Improve structure + intensify the dominant pillar + nudge the post toward one of the proven outlier archetypes (see ARCHETYPE LEADERBOARD in system). Keep the core idea and specific data intact. ` +
            `Return CRITIQUE: + --- + improved post.`;
        } else {
          userContent =
            `BEST VERSION SO FAR (score: ${blendedCurrent}/100, data fit ${Math.round(bestDataFit * 100)}%):\n${bestText}\n\n` +
            `${pillarDetail}\n\n` +
            `PASSING STRUCTURAL CHECKS ✓ — do not break:\n${passingLabels}\n\n` +
            `STILL FAILING ✗ — use DIFFERENT techniques than last iteration:\n${failingList}\n\n` +
            `Same idea, same data. Intensify the pillar. Move the post closer to a top archetype from the leaderboard. Read your previous CRITIQUE and build on it. ` +
            `Return CRITIQUE: + --- + improved post.`;
        }

        conversation.push({ role: 'user', content: userContent });

        // Pick the archetype the rewriter should push toward this iteration.
        // Re-evaluated each pass so once an iteration lands in a top-3 slot
        // we shift to "intensify" mode instead of "switch shape" mode.
        const targetArch = pickTargetArchetype(bestClassification, leaderboard);
        const currentArchEntry = bestClassification && leaderboard.find(
          (a) => a.hook_type === bestClassification!.hook_type && a.post_structure === bestClassification!.post_structure
        ) || null;

        const res = await fetch(`${BASE}/api/chat/improve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversation,
            pillar: targetPillar,
            pillarIntensity: originalIntensity,
            // Hard-locks the lead-magnet CTA in the rewrite when the user
            // has flagged this post as offering a deliverable.
            leadMagnet: isLeadMagnet,
            // Archetype-aware payload — feeds the rewriter the same
            // (hook_type, post_structure) targeting + example post that the
            // Post Creator gets, so the Improver isn't choosing blind.
            currentArchetype: bestClassification ? {
              hook_type: bestClassification.hook_type,
              post_structure: bestClassification.post_structure,
              avg_ratio: currentArchEntry?.avg_ratio ?? null,
            } : null,
            targetArchetype: targetArch ? {
              hook_type: targetArch.hook_type,
              post_structure: targetArch.post_structure,
              avg_ratio: targetArch.avg_ratio,
              example_hook: targetArch.example_hook,
              example_text: targetArch.example_text,
            } : null,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        const data = await res.json();
        const improved = (data.text || '').trim();
        const critique = (data.critique || '').trim();
        const raw = (data.raw || '').trim();
        if (!improved) throw new Error('Empty AI response');

        const newScoreParts = scorePost(improved);
        const newClassified = await classifyAndScore(improved);
        const newDataFit = newClassified.dataFit;
        const newScore = blendedOverall(
          newScoreParts.structural,
          newScoreParts.pillars.intensity,
          newDataFit
        );
        const delta = newScore - bestScoreVal;
        const accepted = newScore > bestScoreVal;

        const assistantEntry = raw || improved;
        const rejectionNote = accepted
          ? assistantEntry
          : `${assistantEntry}\n\n[SYSTEM NOTE: Rewrite scored ${newScore}/100 — below current best of ${bestScoreVal}/100. Rejected. Do NOT repeat the same changes.]`;

        conversation.push({ role: 'assistant', content: rejectionNote });

        if (accepted) {
          bestText = improved;
          bestScoreVal = newScore;
          bestDataFit = newDataFit;
          bestClassification = newClassified.classification;
          setBestScore(bestScoreVal);
          onImproved(improved);
        }

        setIterLog((prev) => [...prev, { iteration: i, score: newScore, delta, accepted, critique }]);
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

  const { byCategory, pillars, structural } = result;
  // Blend structural craft + pillar intensity + data fit. The score the user
  // sees is the same number the auto-improve loop uses to accept/reject
  // rewrites, so they stay in sync.
  const overall = blendedOverall(structural, pillars.intensity, dataFit.score);
  const scoreColor = overall >= 75 ? '#10b981' : overall >= 50 ? '#f59e0b' : '#ef4444';
  const verdict = overall >= 75 ? 'Viral-ready' : overall >= 50 ? 'Decent — tighten' : 'Needs work';

  // Score ring is now 80×80 (was 64×64). The number is the most important
  // signal in the panel and was previously dwarfed by surrounding chrome.
  const RING_SIZE = 80;
  const RING_RADIUS = 35;
  const circumference = 2 * Math.PI * RING_RADIUS;
  const dashOffset = circumference * (1 - overall / 100);

  // Suggestions: prefer failing triggers of dominant pillar (to intensify it) + failing structural checks
  const domPillar = pillars.dominant;
  const pillarSuggestions = domPillar
    ? pillars.triggersByPillar[domPillar].filter((t) => !t.passed).slice(0, 3)
    : [];
  const structuralSuggestions = CHECKLIST
    .filter((item) => !byCategory[item.category].items.find((i) => i.item.id === item.id)?.passed)
    .slice(0, 5);

  const totalCraftPassed = CHECKLIST.filter((item) =>
    byCategory[item.category].items.find((i) => i.item.id === item.id)?.passed
  ).length;
  const totalPillarPassed = PILLAR_TRIGGERS.filter((t) => {
    const entry = pillars.triggersByPillar[t.pillar].find((e) => e.trigger.id === t.id);
    return entry?.passed;
  }).length;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
      {/* HEADER ROW — the resting-state summary.
          Bigger score ring (80×80, number 28px) so the metric reads first;
          dominant pillar lives in the subtitle row as a coloured chip. */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="#1f2937" strokeWidth="6" />
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none"
              stroke={scoreColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums" style={{ color: scoreColor }}>
            {overall}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text-primary">Outlier Checklist</p>
            {domPillar && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  color: PILLAR_META[domPillar].color,
                  backgroundColor: `${PILLAR_META[domPillar].color}1A`,
                }}
              >
                {PILLAR_META[domPillar].icon} {PILLAR_META[domPillar].label} · {Math.round(pillars.intensity * 100)}%
              </span>
            )}
            {/* Data-fit chip — surfaces the (hook_type, post_structure) pair
                the post classifies as, and how that pair has performed in our
                actual outlier data. This is the part the regex checklist
                can't see. */}
            {classifying && !classification && (
              <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-secondary border border-border">
                Matching archetype…
              </span>
            )}
            {classification && dataFit.matched && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-diamond/15 text-diamond"
                title={`Top ${dataFit.rank} of ${leaderboard.length} archetypes in your outlier data — peak ${dataFit.matched.max_ratio}x`}
              >
                📊 {classification.hook_type} + {classification.post_structure} · {dataFit.matched.avg_ratio}x avg
              </span>
            )}
            {classification && !dataFit.matched && (classification.hook_type === 'other' || classification.post_structure === 'other') && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30"
                title="The classifier returned 'other' — the post doesn't fit any clear hook or structure pattern. Sharper hook + clearer structure will lift the score."
              >
                ⚠ Archetype unclear
              </span>
            )}
            {classification && !dataFit.matched && classification.hook_type !== 'other' && classification.post_structure !== 'other' && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted border border-border"
                title="This (hook, structure) pair isn't in your outlier leaderboard — no proven track record yet."
              >
                {classification.hook_type} + {classification.post_structure} · no outlier match
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: scoreColor }}>{verdict}</p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {result.ctx.words} words · hook {result.ctx.wordsHook}w · craft {Math.round(structural * 100)}% · pillar {Math.round(pillars.intensity * 100)}% · data {Math.round(dataFit.score * 100)}%
          </p>
        </div>

        {onImproved && (
          <button
            onClick={runAutoImprove}
            disabled={improving}
            title="Run 5 AI rewrite passes — keeps going even if the post already scores 80+, in case there's still room to improve"
            className="px-3 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg text-[11px] font-medium hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap self-center"
          >
            {improving ? `Improving ${iteration}/5…` : '✨ Auto-improve'}
          </button>
        )}
      </div>

      {/* PILLAR PICKER — pills + helper text on its OWN line below.
          Previously the helper sat inline at the right and wrapped awkwardly
          when the column was narrow (which it always is). */}
      {onImproved && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="text-text-muted">Pilar:</span>
            {(['auto', 'curiosity', 'fear', 'desire'] as const).map((p) => {
              const active = selectedPillar === p;
              const label = p === 'auto' ? 'Auto' : `${PILLAR_META[p].icon} ${PILLAR_META[p].label}`;
              const activeColor = p === 'auto' ? '#94a3b8' : PILLAR_META[p].color;
              return (
                <button
                  key={p}
                  type="button"
                  disabled={improving}
                  onClick={() => setSelectedPillar(p)}
                  className="px-2 py-1 rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: active ? activeColor : '#2e3348',
                    background: active ? `${activeColor}22` : 'transparent',
                    color: active ? activeColor : '#94a3b8',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-text-muted leading-snug">
            {selectedPillar === 'auto'
              ? 'Auto-improve usa el pilar detectado (o deja que el modelo escoja si no hay).'
              : `Auto-improve forzará intensificar ${PILLAR_META[selectedPillar].label.toLowerCase()}.`}
          </p>

          {/* Lead-magnet override. With this on, the improve prompt locks
              the "Comenta X y te lo mando" CTA — the model can't strip it
              when it (sometimes wrongly) decides the post isn't actually
              offering a deliverable. */}
          <label
            className={`mt-1 flex items-start gap-2 px-2 py-1.5 rounded-md border cursor-pointer select-none transition-colors text-[11px] ${
              isLeadMagnet
                ? 'border-accent/40 bg-accent/5 text-text-primary'
                : 'border-border bg-bg-secondary/40 text-text-secondary hover:border-accent/30'
            }`}
          >
            <input
              type="checkbox"
              checked={isLeadMagnet}
              onChange={(e) => setIsLeadMagnet(e.target.checked)}
              disabled={improving}
              className="accent-accent mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium leading-tight">🧲 Es lead magnet</div>
              <p className="text-[10px] text-text-muted leading-snug mt-0.5">
                {isLeadMagnet
                  ? 'Auto-improve mantiene / añade el CTA "Comenta X y te lo mando" obligatorio.'
                  : 'Marca esto si el post regala un recurso (PDF, plantilla, guía…) — evita que el improve te quite el CTA del lead magnet.'}
              </p>
            </div>
          </label>
        </div>
      )}

      {improving && (
        <div className="text-[10px] text-text-muted animate-pulse">
          Iteration {iteration}/5 · best score: {bestScore ?? overall}…
        </div>
      )}

      {improveError && (
        <div className="text-[10px] text-danger">Error: {improveError}</div>
      )}

      {/* SUGGESTIONS — the actionable bit. Always visible (no inner scroll).
          The previous max-h-56 created a nested scrollbar inside an already
          scrolling column, which was a usability landmine. */}
      <div className="border-t border-border pt-3">
        <p className="text-[10px] font-semibold text-text-secondary mb-2 uppercase tracking-wide">
          Sugerencias
        </p>
        <div className="space-y-1.5">
          {domPillar && pillarSuggestions.length > 0 && (
            <>
              <p className="text-[9px] uppercase tracking-wide" style={{ color: PILLAR_META[domPillar].color }}>
                Intensifica {PILLAR_META[domPillar].label}
              </p>
              {pillarSuggestions.map((t) => (
                <div key={t.trigger.id} className="flex items-start gap-2 text-[11px]">
                  <span className="mt-0.5" style={{ color: PILLAR_META[domPillar].color }}>◆</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary">{t.trigger.label}</p>
                    {t.trigger.hint && <p className="text-text-muted text-[10px] leading-tight">{t.trigger.hint}</p>}
                  </div>
                </div>
              ))}
            </>
          )}
          {structuralSuggestions.length > 0 && (
            <>
              {domPillar && pillarSuggestions.length > 0 && (
                <p className="text-[9px] uppercase tracking-wide text-text-muted pt-1">Craft</p>
              )}
              {structuralSuggestions.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-[11px]">
                  <span className="text-danger mt-0.5">✗</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary">{item.label}</p>
                    {item.hint && <p className="text-text-muted text-[10px] leading-tight">{item.hint}</p>}
                  </div>
                </div>
              ))}
            </>
          )}
          {structuralSuggestions.length === 0 && pillarSuggestions.length === 0 && (
            <p className="text-[11px] text-green-400">All checks passed. Ship it.</p>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE DETAIL — pillar bars, craft bars, history.
          Hidden by default to keep the panel scannable. The summary in the
          header already shows totals, so the bars are reference-only. */}
      <div className="border-t border-border pt-2 -mx-1 -mb-1">
        <CollapsibleSection
          label="Pilar breakdown"
          open={openSections.pillars}
          onToggle={() => toggleSection('pillars')}
        >
          <div className="space-y-2 pt-1">
            {(['curiosity', 'fear', 'desire'] as Pillar[]).map((p) => {
              const val = pillars[p];
              const isDom = domPillar === p;
              const meta = PILLAR_META[p];
              return (
                <div key={p}>
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className={`font-medium ${isDom ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span style={{ color: meta.color, opacity: isDom ? 1 : 0.6 }}>
                      {Math.round(val * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${val * 100}%`, backgroundColor: meta.color, opacity: isDom ? 1 : 0.45 }}
                    />
                  </div>
                </div>
              );
            })}
            {!domPillar && (
              <p className="text-[10px] text-text-muted italic pt-1">
                Ningún pilar disparado. Elige UNO e intensifícalo — no mezcles.
              </p>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          label="Craft estructural"
          open={openSections.craft}
          onToggle={() => toggleSection('craft')}
        >
          <div className="space-y-2 pt-1">
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
        </CollapsibleSection>

        {iterLog.length > 0 && (
          <CollapsibleSection
            label={`Iteration history (${iterLog.length})`}
            // Force open while improving so the user sees deltas land in
            // real time. Once the run finishes, falls back to user choice.
            open={improving || openSections.history}
            onToggle={() => toggleSection('history')}
          >
            <div className="space-y-2 pt-1">
              {iterLog.map((log) => (
                <div key={log.iteration} className="text-[10px] space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded ${log.accepted ? 'bg-green-900/40 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {log.accepted ? '✓ aceptada' : '✗ revertida'}
                    </span>
                    <span className="font-semibold text-text-primary">Iter {log.iteration}</span>
                    <span className="font-bold" style={{ color: log.score >= 75 ? '#10b981' : log.score >= 50 ? '#f59e0b' : '#ef4444' }}>
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
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

/**
 * Lightweight accordion row. Used for "Pilar breakdown", "Craft estructural"
 * and "Iteration history" — all three are reference detail that the user
 * rarely needs in their flow, so we keep them collapsed by default.
 */
function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="px-1">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wide hover:text-text-primary transition-colors"
      >
        <span>{label}</span>
        <span className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
          ▸
        </span>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}
