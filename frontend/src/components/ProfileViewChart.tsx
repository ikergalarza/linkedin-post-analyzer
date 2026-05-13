import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const BASE = import.meta.env.VITE_API_URL || '';

interface Point {
  day: string;
  views: number;
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

// Sum the last `n` daily points (most-recent-first). Returns 0 if the
// series is shorter than n — caller decides whether that's enough signal
// to display a delta.
function sumLastN(points: Point[], n: number): number {
  let total = 0;
  for (let i = Math.max(0, points.length - n); i < points.length; i++) {
    total += points[i].views || 0;
  }
  return total;
}

// Sum points [end-n*2, end-n) — i.e. the window of size n immediately
// before the most-recent window of size n. Used for rolling delta math.
function sumPrevN(points: Point[], n: number): number | null {
  if (points.length < n * 2) return null;
  const start = points.length - n * 2;
  let total = 0;
  for (let i = start; i < start + n; i++) total += points[i].views || 0;
  return total;
}

// Compact delta chip — value + colour + sign. Used for 24h / 7d / range.
function DeltaChip({
  label,
  abs,
  pct,
}: {
  label: string;
  abs: number | null;
  pct: number | null;
}) {
  if (abs === null) {
    return (
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-wide text-text-muted">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-text-muted">—</span>
      </div>
    );
  }
  const colour =
    abs > 0 ? 'text-accent' : abs < 0 ? 'text-red-400' : 'text-text-secondary';
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wide text-text-muted">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${colour}`}>
        {abs > 0 ? '+' : ''}
        {fmtNum(abs)}
        {pct !== null && (
          <span className="text-text-muted font-normal ml-1">
            ({abs > 0 ? '+' : ''}
            {pct.toFixed(1)}%)
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * ProfileViewChart — daily count of LinkedIn "Who Viewed My Profile"
 * viewers, fetched via Unipile's raw passthrough during scrape.
 *
 * Shape mirrors FollowerGrowthChart (same recharts setup, same fetch
 * pattern, same colour grammar in the theme) BUT surfaces three explicit
 * deltas — last 24h, last 7d, and the full range — because viewer counts
 * fluctuate more than follower counts and the day/week trend is what
 * actually matters.
 */
export default function ProfileViewChart({ creatorId, days }: Props) {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (creatorId) params.set('creator_id', creatorId);
    fetch(`${BASE}/api/accounts/profile-view-history?${params.toString()}`)
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
    return () => {
      cancelled = true;
    };
  }, [creatorId, days]);

  const chartData = useMemo(
    () => (points || []).map((p) => ({ ...p, label: fmtDay(p.day) })),
    [points]
  );

  const xTickInterval = Math.max(0, Math.floor(chartData.length / 8) - 1);

  // Deltas in the new model = window-sums vs. previous window-sums (rolling).
  // "vs ayer" still compares two single days (today vs. yesterday). The 7d
  // and Nd chips compare "last N days summed" against "prior N days summed",
  // which is how LinkedIn's own analytics surface presents the trend.
  const deltas = useMemo(() => {
    if (!points || points.length === 0) {
      return { d1: null, d7: null, range: null, totalRange: 0 };
    }
    const calcWindow = (n: number) => {
      const cur = sumLastN(points, n);
      const prev = sumPrevN(points, n);
      if (prev === null) return null;
      const abs = cur - prev;
      const pct = prev > 0 ? (abs / prev) * 100 : null;
      return { abs, pct };
    };
    const d1 = (() => {
      if (points.length < 2) return null;
      const today = points[points.length - 1].views;
      const yesterday = points[points.length - 2].views;
      const abs = today - yesterday;
      const pct = yesterday > 0 ? (abs / yesterday) * 100 : null;
      return { abs, pct };
    })();
    return {
      d1,
      d7: calcWindow(7),
      range: calcWindow(Math.floor(days / 2)), // current half vs prior half
      totalRange: sumLastN(points, days),
    };
  }, [points, days]);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Profile views</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {creatorId
              ? `Visitas nuevas al perfil por día (últimos ${days}d · ${fmtNum(deltas.totalRange)} total)`
              : `Visitas nuevas al perfil por día — todas las cuentas managed (últimos ${days}d · ${fmtNum(deltas.totalRange)} total)`}
          </p>
        </div>
        <div className="flex items-start gap-5 flex-wrap">
          {deltas.d1 && (
            <DeltaChip
              label="vs ayer"
              abs={deltas.d1.abs}
              pct={deltas.d1.pct}
            />
          )}
          {deltas.d7 && (
            <DeltaChip
              label="últimos 7d vs prev. 7d"
              abs={deltas.d7.abs}
              pct={deltas.d7.pct}
            />
          )}
          {deltas.range && (
            <DeltaChip
              label={`últ. ${Math.floor(days / 2)}d vs prev. ${Math.floor(days / 2)}d`}
              abs={deltas.range.abs}
              pct={deltas.range.pct}
            />
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-text-muted text-sm py-12">Cargando…</p>
      ) : chartData.length === 0 || deltas.totalRange === 0 ? (
        <p className="text-center text-text-muted text-sm py-12">
          Aún no hay datos de visitas — corre un refresh para capturar los
          timestamps de viewers desde el feed de LinkedIn.
          (Requiere LinkedIn Premium / Sales Navigator activo en la cuenta.)
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
              formatter={(v: any) => [fmtNum(Number(v)) + ' viewers nuevos', '']}
              labelFormatter={(label: string) => label}
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#e8935a"
              strokeWidth={2}
              dot={{ r: 2, fill: '#e8935a' }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
