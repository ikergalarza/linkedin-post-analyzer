import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const BASE = import.meta.env.VITE_API_URL || '';

interface Point {
  day: string;
  organic: number;     // new pure-follow followers that day (they followed first)
  connection: number;  // new followers that entered via a connection
  total: number;
}

interface Props {
  creatorId: string | null;
  days: number;
  reloadSignal?: number;
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TOOLTIP_STYLE = {
  backgroundColor: '#222639',
  border: '1px solid #2e3348',
  borderRadius: '8px',
  color: '#e8eaf0',
  fontSize: '12px',
};

/**
 * OrganicFollowersChart — new followers per day split into:
 *  - "Orgánicos" (pure_follow): they hit Follow without connecting — they
 *    chose you because of your content. The metric that matters.
 *  - "Por conexión": entered via a connection (inbound or outbound).
 *
 * Data starts the day the follower-sync baseline ran (pre-existing followers
 * can't be dated, so they're excluded). Until then the chart is empty.
 */
export default function OrganicFollowersChart({ creatorId, days, reloadSignal }: Props) {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (creatorId) params.set('creator_id', creatorId);
    fetch(`${BASE}/api/accounts/followers/organic-history?${params.toString()}`)
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
  }, [creatorId, days, reloadSignal]);

  const chartData = useMemo(
    () => (points || []).map((p) => ({ ...p, label: fmtDay(p.day) })),
    [points]
  );

  const totals = useMemo(() => {
    const organic = (points || []).reduce((s, p) => s + (p.organic || 0), 0);
    const connection = (points || []).reduce((s, p) => s + (p.connection || 0), 0);
    return { organic, connection };
  }, [points]);

  const xTickInterval = Math.max(0, Math.floor(chartData.length / 8) - 1);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Seguidores orgánicos</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Gente que te empezó a seguir por tu contenido (no porque tú la buscaras).
            Arranca el día del primer sync; el histórico previo no se puede fechar.
          </p>
        </div>
        <div className="flex items-start gap-5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wide text-text-muted">Orgánicos</span>
            <span className="text-sm font-semibold tabular-nums text-accent">
              {totals.organic > 0 ? '+' : ''}{totals.organic.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wide text-text-muted">Por conexión</span>
            <span className="text-sm font-semibold tabular-nums text-text-secondary">
              {totals.connection.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-text-muted text-sm py-12">Cargando…</p>
      ) : chartData.length === 0 ? (
        <p className="text-center text-text-muted text-sm py-12">
          Aún no hay datos. El primer sync captura la base de seguidores; a partir
          de ahí cada día nuevo se desglosa en orgánicos vs conexión.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
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
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: '#2e334855' }}
              formatter={(v: any, name: any) => [v, name === 'organic' ? 'Orgánicos' : 'Por conexión']}
              labelFormatter={(label: string) => label}
            />
            <Legend
              formatter={(value) => (value === 'organic' ? 'Orgánicos' : 'Por conexión')}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="organic" stackId="f" fill="#e8935a" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="connection" stackId="f" fill="#4b5168" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
