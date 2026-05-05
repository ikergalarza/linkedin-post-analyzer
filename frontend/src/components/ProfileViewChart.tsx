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

// Helper that returns the last point on or before "today minus daysBack",
// so we can compute deltas robustly even when snapshots have gaps.
function findPointBefore(points: Point[], daysBack: number): Point | null {
  if (!points.length) return null;
  const target = new Date();
  target.setDate(target.getDate() - daysBack);
  const targetTs = target.getTime();
  // Walk backwards: the last point whose date is ≤ target
  for (let i = points.length - 1; i >= 0; i--) {
    if (new Date(points[i].day).getTime() <= targetTs) return points[i];
  }
  return points[0];
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
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [creatorId, days, reloadKey]);

  const handleBackfill = async () => {
    setBackfilling(true);
    setBackfillMessage(null);
    try {
      const params = new URLSearchParams();
      if (creatorId) params.set('creator_id', creatorId);
      const res = await fetch(
        `${BASE}/api/accounts/profile-view-history/backfill?${params.toString()}`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok) {
        setBackfillMessage(`Error: ${json.error || res.status}`);
      } else {
        setBackfillMessage(json.message || `Backfilled ${json.inserted} day(s).`);
        setReloadKey((k) => k + 1);
      }
    } catch (e: any) {
      setBackfillMessage(`Error: ${e.message}`);
    }
    setBackfilling(false);
  };

  const chartData = useMemo(
    () => (points || []).map((p) => ({ ...p, label: fmtDay(p.day) })),
    [points]
  );

  const xTickInterval = Math.max(0, Math.floor(chartData.length / 8) - 1);

  const deltas = useMemo(() => {
    if (!points || points.length === 0) {
      return { d1: null, d7: null, range: null };
    }
    const last = points[points.length - 1].views;
    const calc = (basePoint: Point | null) => {
      if (!basePoint) return null;
      const abs = last - basePoint.views;
      const pct = basePoint.views > 0 ? (abs / basePoint.views) * 100 : null;
      return { abs, pct };
    };
    return {
      // 24h: penultimate point if it exists; null if we only have 1 snapshot
      d1: points.length >= 2 ? calc(points[points.length - 2]) : null,
      d7: calc(findPointBefore(points, 7)),
      range: calc(points[0]),
    };
  }, [points]);

  // Show the backfill button when the chart is sparse (≤2 days) — once
  // we have a real history there's nothing to reconstruct.
  const showBackfillCTA = !loading && (points?.length ?? 0) <= 2;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Profile views</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {creatorId
              ? 'Visitas al perfil (snapshot diario, ventana ~90 días LinkedIn Premium)'
              : 'Suma de visitas al perfil de todas las cuentas managed (snapshot diario)'}
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
              label="vs hace 7d"
              abs={deltas.d7.abs}
              pct={deltas.d7.pct}
            />
          )}
          {deltas.range && (
            <DeltaChip
              label={`vs hace ${days}d`}
              abs={deltas.range.abs}
              pct={deltas.range.pct}
            />
          )}
        </div>
      </div>

      {/* Backfill control — visible when there's barely any history. The
          server reads viewedAt from the cached WVMP raw_response and
          synthesises one cumulative-count point per day from the earliest
          viewer to today. Existing real snapshots are never overwritten. */}
      {showBackfillCTA && (
        <div className="mb-3 flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-accent/30 bg-accent/5">
          <p className="text-[11px] text-text-secondary">
            ¿Quieres rellenar el histórico desde el último snapshot? Reconstruye una curva acumulada usando los timestamps de cada viewer.
          </p>
          <button
            onClick={handleBackfill}
            disabled={backfilling}
            className="text-[11px] px-2.5 py-1 rounded-md border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {backfilling ? 'Rellenando…' : '↺ Rellenar histórico'}
          </button>
        </div>
      )}
      {backfillMessage && (
        <div className="mb-3 text-[11px] text-text-muted px-3">
          {backfillMessage}
        </div>
      )}

      {loading ? (
        <p className="text-center text-text-muted text-sm py-12">Cargando…</p>
      ) : chartData.length === 0 ? (
        <p className="text-center text-text-muted text-sm py-12">
          Aún no hay snapshots — corre un scrape para empezar a trackear visitas.
          (Requiere LinkedIn Premium / Sales Navigator activo en la cuenta.)
        </p>
      ) : chartData.length === 1 ? (
        <p className="text-center text-text-muted text-sm py-12">
          Solo un snapshot por ahora ({fmtNum(chartData[0].views)} viewers el {chartData[0].label}).
          La curva se rellena según se capturan más días.
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
              formatter={(v: any) => [fmtNum(Number(v)) + ' viewers', '']}
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
