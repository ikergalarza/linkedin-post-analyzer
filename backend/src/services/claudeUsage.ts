import pool from '../db';

// Per-million-token pricing for the Anthropic models we use, in USD.
// Source: https://www.anthropic.com/pricing — keep in sync if Anthropic
// adjusts. The fallback {0,0,0,0} means an unknown model logs tokens but
// reports cost 0 (so it shows up in audits without quietly inflating
// other numbers).
type Price = { in: number; out: number; cache_read: number; cache_write: number };
const PRICING: Record<string, Price> = {
  'claude-opus-4-8': { in: 15, out: 75, cache_read: 1.5, cache_write: 18.75 },
  'claude-opus-4-7': { in: 15, out: 75, cache_read: 1.5, cache_write: 18.75 },
  'claude-sonnet-4-6': { in: 3, out: 15, cache_read: 0.3, cache_write: 3.75 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5, cache_read: 0.1, cache_write: 1.25 },
  'claude-haiku-4-5': { in: 1, out: 5, cache_read: 0.1, cache_write: 1.25 },
};

export interface UsageInput {
  feature: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export function computeCost(u: UsageInput): number {
  const p = PRICING[u.model] || { in: 0, out: 0, cache_read: 0, cache_write: 0 };
  const M = 1_000_000;
  return (
    (u.input_tokens * p.in) / M +
    (u.output_tokens * p.out) / M +
    ((u.cache_read_input_tokens || 0) * p.cache_read) / M +
    ((u.cache_creation_input_tokens || 0) * p.cache_write) / M
  );
}

// Fire-and-forget log. Never throws back to the caller — we don't want a
// metrics-pipeline hiccup to break the actual generation. Errors land in
// the server log for triage.
export async function logUsage(u: UsageInput): Promise<void> {
  try {
    const cost = computeCost(u);
    await pool.query(
      `INSERT INTO claude_usage_logs
         (feature, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        u.feature,
        u.model,
        u.input_tokens || 0,
        u.output_tokens || 0,
        u.cache_read_input_tokens || 0,
        u.cache_creation_input_tokens || 0,
        cost,
      ]
    );
  } catch (err: any) {
    console.warn('[claudeUsage] log failed:', err?.message);
  }
}
