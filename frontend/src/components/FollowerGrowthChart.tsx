import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts';

const BASE = import.meta.env.VITE_API_URL || '';

interface Point {
  day: string;
  followers: number; // cumulative total that day (for tooltip context)
  gained: number;    // net new followers that day
}

interface Props {
  creatorId: string | null;
  // New range model: pass start_date + end_date (YYYY-MM-DD). The
  // backend will serve the corresponding window. We still derive a
  // numeric `days` from the range for the "Gained · Nd" label.
  startDate: string;
  endDate: string;
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${Math.round(n / 1_000)}K`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Custom tooltip — shows ONLY that day's net new followers, big and
// colour-coded (green up / red down) so the signal pops at a glance.
// The cumulative total is intentionally dropped: per-day delta is the
// point of this chart.
function GainedTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const g = Number(payload[0]?.value ?? 0);
  const colour = g > 0 ? '#34d399' : g < 0 ? '#f87171' : '#9ca3af';
  return (
    <div
      style={{
        backgroundColor: '#222639',
        border: `1px solid ${colour}55`,
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: `0 0 14px ${colour}33`,
      }}
    >
      <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ color: colour, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
        {g > 0 ? '+' : ''}{fmtNum(g)}
        <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500, marginLeft: 6 }}>
          new {Math.abs(g) === 1 ? 'follower' : 'followers'}
        </span>
      </div>
    </div>
  );
}

/**
 * FollowerGrowth — net new followers per day (bars), derived from the
 * daily total snapshots in our DB. Positive = green, negative = red.
 * The cumulative total still rides along in the tooltip so you don't
 * lose the "where are we now" context. Works for a single account or
 * the summed managed view (creatorId null).
 */
export default function FollowerGrowthChart({ creatorId, startDate, endDate }: Props) {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => {
    const a = new Date(`${startDate}T00:00:00`);
    const b = new Date(`${endDate}T00:00:00`);
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
  }, [startDate, endDate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (creatorId) params.set('creator_id', creatorId);
    fetch(`${BASE}/api/accounts/follower-history?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setPoints(Array.isArray(data?.points) ? data.points : []);
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [creatorId, startDate, endDate]);

  const chartData = useMemo(
    () => (points || []).map((p) => ({ ...p, label: fmtDay(p.day) })),
    [points]
  );

  const xTickInterval = Math.max(0, Math.floor(chartData.length / 8) - 1);

  const summary = useMemo(() => {
    if (!points || points.length === 0) return null;
    const totalGained = points.reduce((s, p) => s + (p.gained || 0), 0);
    const currentTotal = points[points.length - 1].followers;
    const bestDay = points.reduce((b, p) => (p.gained > (b?.gained ?? -Infinity) ? p : b), points[0]);
    return { totalGained, currentTotal, bestDay };
  }, [points]);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">New followers per day</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {creatorId
              ? 'Net new followers per day (this account)'
              : 'Net new followers per day — all managed accounts'}
          </p>
        </div>
        {summary && (
          <div className="flex items-start gap-5 flex-wrap text-right">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Gained · {days}d</div>
              <div className={`text-sm font-semibold tabular-nums ${summary.totalGained > 0 ? 'text-green-400' : summary.totalGained < 0 ? 'text-red-400' : 'text-text-secondary'}`}>
                {summary.totalGained > 0 ? '+' : ''}{fmtNum(summary.totalGained)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Current total</div>
              <div className="text-sm font-semibold tabular-nums text-text-secondary">
                {fmtNum(summary.currentTotal)}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-text-muted text-sm py-12">Loading…</p>
      ) : chartData.length === 0 ? (
        <p className="text-center text-text-muted text-sm py-12">
          No snapshots captured yet — run a scrape to start tracking growth.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#2e3348' }}
              interval={xTickInterval}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#2e3348' }}
              tickFormatter={fmtNum}
              allowDecimals={false}
            />
            <Tooltip
              content={<GainedTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <ReferenceLine y={0} stroke="#2e3348" />
            <Bar dataKey="gained" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {chartData.map((p, i) => (
                <Cell key={i} fill={p.gained >= 0 ? '#34d399' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
