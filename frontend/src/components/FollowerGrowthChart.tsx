import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const BASE = import.meta.env.VITE_API_URL || '';

interface Point {
  day: string;
  followers: number;
}

interface Props {
  creatorId: string | null;
  days: number;
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const TOOLTIP_STYLE = {
  backgroundColor: '#222639',
  border: '1px solid #2e3348',
  borderRadius: '8px',
  color: '#e8eaf0',
  fontSize: '12px',
};

export default function FollowerGrowthChart({ creatorId, days }: Props) {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
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
  }, [creatorId, days]);

  const chartData = useMemo(
    () => (points || []).map((p) => ({ ...p, label: fmtDay(p.day) })),
    [points]
  );

  const xTickInterval = Math.max(0, Math.floor(chartData.length / 8) - 1);

  const delta = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    const first = chartData[0].followers;
    const last = chartData[chartData.length - 1].followers;
    const abs = last - first;
    const pct = first > 0 ? (abs / first) * 100 : 0;
    return { abs, pct, first, last };
  }, [chartData]);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Follower growth</h3>
          <p className="text-xs text-text-muted">
            {creatorId ? 'Daily followers count for this account' : 'Sum of followers across all managed accounts'}
            {' '}· captured once per day on each scrape
          </p>
        </div>
        {delta && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-text-muted">Change in range</div>
            <div className={`text-sm font-semibold tabular-nums ${delta.abs > 0 ? 'text-green-400' : delta.abs < 0 ? 'text-red-400' : 'text-text-secondary'}`}>
              {delta.abs > 0 ? '+' : ''}{fmtNum(delta.abs)}
              {delta.first > 0 && (
                <span className="text-text-muted font-normal ml-1">
                  ({delta.abs > 0 ? '+' : ''}{delta.pct.toFixed(1)}%)
                </span>
              )}
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
      ) : chartData.length === 1 ? (
        <p className="text-center text-text-muted text-sm py-12">
          Only one snapshot so far ({fmtNum(chartData[0].followers)} followers on {chartData[0].label}).
          The curve will fill in as more days are captured.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
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
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ stroke: '#2e3348', strokeWidth: 1 }}
              formatter={(v: any) => [fmtNum(Number(v)) + ' followers', '']}
              labelFormatter={(label: string) => label}
            />
            <Line
              type="monotone"
              dataKey="followers"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 2, fill: '#34d399' }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
