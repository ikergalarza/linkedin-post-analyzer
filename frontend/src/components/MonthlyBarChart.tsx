import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts';

const BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  // API path WITHOUT query string, e.g. '/api/accounts/follower-monthly'
  endpoint: string;
  // Field on each returned point that holds the numeric value to plot.
  valueKey: string;
  creatorId: string | null;
  months?: number;
  title: string;
  subtitle: string;
  // Tooltip/legend noun, e.g. 'seguidores' or 'impresiones'
  unit: string;
  color?: string;
  // If true, negative values render red (growth charts). Impressions never
  // go negative so it's off by default.
  signed?: boolean;
}

function fmtMonth(ym: string): string {
  // ym = 'YYYY-MM' → 'mmm yy'
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${Math.round(n / 1_000)}K`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Big-number tooltip — same language as FollowerGrowthChart's daily
// tooltip: a large value in the chart's own colour with a soft glow,
// so monthly followers / impressions read at a glance.
function BigValueTooltip({
  active, payload, label, color, unit, signed,
}: any) {
  if (!active || !payload || !payload.length) return null;
  const n = Number(payload[0]?.value ?? 0);
  const colour = signed
    ? (n > 0 ? '#34d399' : n < 0 ? '#f87171' : '#9ca3af')
    : color;
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
        {signed && n > 0 ? '+' : ''}{fmtNum(n)}
        <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500, marginLeft: 6 }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

/**
 * Generic "value per month" bar chart. Fetches `${endpoint}?months=&creator_id=`
 * and plots point[valueKey] per month. Used for monthly followers-gained
 * and monthly impressions so both share one render path and look identical.
 */
export default function MonthlyBarChart({
  endpoint,
  valueKey,
  creatorId,
  months = 12,
  title,
  subtitle,
  unit,
  color = '#34d399',
  signed = false,
}: Props) {
  const [points, setPoints] = useState<Record<string, any>[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ months: String(months) });
    if (creatorId) params.set('creator_id', creatorId);
    fetch(`${BASE}${endpoint}?${params.toString()}`)
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
  }, [endpoint, creatorId, months]);

  const chartData = useMemo(
    () => (points || []).map((p) => ({ ...p, label: fmtMonth(p.month), _v: Number(p[valueKey]) || 0 })),
    [points, valueKey]
  );

  const total = useMemo(
    () => chartData.reduce((s, p) => s + p._v, 0),
    [chartData]
  );

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        </div>
        {chartData.length > 0 && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-text-muted">Total · {chartData.length}m</div>
            <div className={`text-sm font-semibold tabular-nums ${signed && total < 0 ? 'text-red-400' : 'text-text-secondary'}`}>
              {signed && total > 0 ? '+' : ''}{fmtNum(total)}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-text-muted text-sm py-12">Loading…</p>
      ) : chartData.length === 0 ? (
        <p className="text-center text-text-muted text-sm py-12">
          Not enough monthly data yet — this fills in as each month is captured.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#2e3348' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#2e3348' }}
              tickFormatter={fmtNum}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              content={(p: any) => (
                <BigValueTooltip {...p} color={color} unit={unit} signed={signed} />
              )}
            />
            {signed && <ReferenceLine y={0} stroke="#2e3348" />}
            <Bar dataKey="_v" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {chartData.map((p, i) => (
                <Cell key={i} fill={signed && p._v < 0 ? '#f87171' : color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
