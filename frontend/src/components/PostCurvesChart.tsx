import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';

export interface PostCurve {
  id: string;
  hook_text: string | null;
  content_text: string | null;
  post_url: string | null;
  published_at: string;
  is_outlier: boolean;
  outlier_ratio: number;
  engagement_score: number;
  points: { t: number | string; e: number | string }[];
}

interface Props {
  posts: PostCurve[];
}

const MAX_HOURS = 168; // 7 days
const HIGHLIGHT_COLOR = '#67e8f9';
const MEDIAN_COLOR = '#e8935a';
const FAINT_COLOR = '#64748b';

function formatHourLabel(hour: number): string {
  if (hour < 24) return `${hour}h`;
  const days = hour / 24;
  return Number.isInteger(days) ? `${days}d` : `${days.toFixed(1)}d`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Resample a post's raw {t, e} points onto integer hour buckets [0..MAX_HOURS].
// Carry forward the last snapshot value; return null past the post's age so the
// median/line stops drawing where the post hasn't aged into yet.
function bucketPost(points: { t: number | string; e: number | string }[], maxHours = MAX_HOURS): (number | null)[] {
  const sorted = points
    .map((p) => ({ t: Number(p.t), e: Number(p.e) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.e) && p.t >= 0)
    .sort((a, b) => a.t - b.t);

  const out: (number | null)[] = new Array(maxHours + 1).fill(null);
  if (sorted.length === 0) return out;

  // Age the post has reached in hours since publish. We use the latest snapshot
  // time as the upper bound for carry-forward so we don't paint flat lines
  // into the future for young posts.
  const maxAge = Math.min(sorted[sorted.length - 1].t, maxHours);
  let idx = 0;
  let lastE: number | null = null;
  for (let h = 0; h <= maxHours; h++) {
    while (idx < sorted.length && sorted[idx].t <= h) {
      lastE = sorted[idx].e;
      idx++;
    }
    // Stop drawing once we pass the post's actual age. The line ends there.
    if (h > maxAge) {
      out[h] = null;
    } else {
      out[h] = lastE;
    }
  }
  return out;
}

export default function PostCurvesChart({ posts }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    posts.length > 0 ? posts[0].id : null
  );
  const [dismissed, setDismissed] = useState(false);

  const { chartData, medianFinal, selectedPost, yMax } = useMemo(() => {
    const buckets = new Map<string, (number | null)[]>();
    for (const p of posts) {
      buckets.set(p.id, bucketPost(p.points));
    }

    const rows: any[] = [];
    let peak = 0;
    for (let h = 0; h <= MAX_HOURS; h++) {
      const row: any = { hour: h };
      const vals: number[] = [];
      for (const p of posts) {
        const series = buckets.get(p.id)!;
        const v = series[h];
        row[p.id] = v;
        if (v != null) {
          vals.push(v);
          if (v > peak) peak = v;
        }
      }
      // Median across posts that have reached this hour
      if (vals.length > 0) {
        const sorted = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        row._median =
          sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
      } else {
        row._median = null;
      }
      rows.push(row);
    }

    const selected = posts.find((p) => p.id === selectedId) || null;
    const medianLast = rows[rows.length - 1]?._median ?? null;
    return {
      chartData: rows,
      medianFinal: medianLast,
      selectedPost: selected,
      yMax: peak || 1,
    };
  }, [posts, selectedId]);

  if (dismissed) return null;

  if (posts.length === 0) {
    return (
      <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between mb-2 gap-4">
          <h3 className="text-lg font-semibold">Post Engagement Curves</h3>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Cerrar"
            title="Cerrar"
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: '1px solid #2e3348',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
        <div className="text-sm text-text-muted" style={{ lineHeight: 1.5 }}>
          <p>
            Aún no hay datos suficientes para dibujar las curvas. Este gráfico se rellena a partir de
            snapshots horarios durante los 7 días posteriores a cada publicación, así que solo funciona
            para cuentas conectadas (gestionadas vía Unipile) con posts recientes.
          </p>
          <p className="mt-2 text-text-muted/80 italic">
            Vuelve a abrirlo cuando el creador tenga al menos una publicación dentro de la ventana de
            captura de 7 días.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Post Engagement Curves</h3>
        <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
          <span className="flex items-center gap-1">
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 2,
                background: HIGHLIGHT_COLOR,
                borderRadius: 2,
              }}
            />
            Selected post
          </span>
          <span className="flex items-center gap-1">
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 2,
                background: MEDIAN_COLOR,
                borderRadius: 2,
                borderTop: `2px dashed ${MEDIAN_COLOR}`,
              }}
            />
            Median
          </span>
          <span className="flex items-center gap-1">
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 1.5,
                background: FAINT_COLOR,
                opacity: 0.5,
                borderRadius: 2,
              }}
            />
            Other posts
          </span>
        </div>
      </div>

      <div className="text-[11px] text-text-muted mb-3 space-y-0.5">
        <p>
          Compara cómo cada publicación acumula engagement durante sus primeros 7 días. La curva cyan gruesa
          es el post seleccionado; la naranja discontinua es la mediana de las últimas {posts.length}{' '}
          publicaciones — tu "curva típica" de referencia. Haz clic en una publicación para resaltar su curva.
        </p>
        <p className="text-text-muted/80 italic">
          Solo se incluyen posts que tienen snapshots horarios. Cada curva se detiene en la edad real del post —
          un post de 36 h no llega a 168 h.
        </p>
      </div>

      <div className="mb-3">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 8, left: 5 }}>
            <CartesianGrid stroke="#2e3348" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="hour"
              type="number"
              domain={[0, MAX_HOURS]}
              ticks={[0, 24, 48, 72, 96, 120, 144, 168]}
              tickFormatter={formatHourLabel}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#2e3348' }}
              height={28}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#2e3348' }}
              width={50}
              domain={[0, Math.ceil(yMax * 1.05)]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#222639',
                border: '1px solid #2e3348',
                borderRadius: 8,
                color: '#e8eaf0',
                fontSize: 12,
              }}
              labelFormatter={(hour) => `${formatHourLabel(Number(hour))} tras publicar`}
              formatter={(value: any, name: any) => {
                if (value == null) return ['—', name];
                if (name === '_median') return [Math.round(Number(value)).toLocaleString(), 'Median'];
                const p = posts.find((x) => x.id === name);
                const label = p ? shortDate(p.published_at) : String(name);
                return [Math.round(Number(value)).toLocaleString(), label];
              }}
              itemSorter={(item) => -Number(item.value ?? 0)}
            />
            {medianFinal != null && (
              <ReferenceLine
                y={medianFinal}
                stroke={MEDIAN_COLOR}
                strokeDasharray="2 4"
                strokeOpacity={0.35}
              />
            )}
            {/* Other posts — thin faint lines, rendered first so the selected
                post sits on top. */}
            {posts.map((p) => {
              if (p.id === selectedId) return null;
              return (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.id}
                  stroke={FAINT_COLOR}
                  strokeWidth={1}
                  strokeOpacity={0.35}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                  onClick={() => setSelectedId(p.id)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
            {/* Median of the pool — dashed orange, drawn above the faint
                lines so it reads as the reference. */}
            <Line
              type="monotone"
              dataKey="_median"
              stroke={MEDIAN_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            {/* Selected post last so it paints on top. */}
            {selectedPost && (
              <Line
                type="monotone"
                dataKey={selectedPost.id}
                stroke={HIGHLIGHT_COLOR}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: HIGHLIGHT_COLOR }}
                isAnimationActive={false}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Post picker — list of recent posts; clicking swaps the highlighted curve. */}
      <div className="flex flex-wrap gap-2">
        {posts.map((p) => {
          const isSelected = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              title={p.hook_text || p.content_text || ''}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                border: `1px solid ${isSelected ? HIGHLIGHT_COLOR : '#2e3348'}`,
                background: isSelected ? 'rgba(103, 232, 249, 0.12)' : 'transparent',
                color: isSelected ? HIGHLIGHT_COLOR : '#94a3b8',
                cursor: 'pointer',
                maxWidth: 220,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ opacity: 0.75, marginRight: 6 }}>{shortDate(p.published_at)}</span>
              {p.is_outlier && <span style={{ marginRight: 4 }}>★</span>}
              {p.hook_text || p.content_text?.slice(0, 40) || '(sin texto)'}
            </button>
          );
        })}
      </div>

      {/* Selected post card with preview + LinkedIn link. */}
      {selectedPost && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: '#1a1d2b',
            border: '1px solid #2e3348',
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
              gap: 10,
            }}
          >
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
              {shortDate(selectedPost.published_at)}
              {selectedPost.is_outlier && (
                <span style={{ marginLeft: 8, color: HIGHLIGHT_COLOR }}>
                  ★ Outlier ({selectedPost.outlier_ratio.toFixed(1)}×)
                </span>
              )}
            </span>
            <span style={{ color: '#cbd5e1' }}>
              Total engagement:{' '}
              <span style={{ color: '#e8eaf0', fontWeight: 600 }}>
                {Math.round(selectedPost.engagement_score).toLocaleString()}
              </span>
            </span>
          </div>
          {(selectedPost.content_text || selectedPost.hook_text) && (
            <div
              style={{
                color: '#cbd5e1',
                whiteSpace: 'pre-wrap',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 8,
                lineHeight: 1.4,
              }}
            >
              {selectedPost.content_text || selectedPost.hook_text}
            </div>
          )}
          {selectedPost.post_url && (
            <a
              href={selectedPost.post_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: 4,
                textDecoration: 'none',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              View on LinkedIn →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
