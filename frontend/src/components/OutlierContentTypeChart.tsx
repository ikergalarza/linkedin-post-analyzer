import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OutlierPost {
  content_type: string;
  likes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  outlier_ratio?: number;
}

interface Props {
  outliers: OutlierPost[];
}

const TYPE_LABELS: Record<string, string> = {
  text_only: 'Text',
  image: 'Image',
  carousel: 'Carousel',
  video: 'Video',
  poll: 'Poll',
  article: 'Article',
  document: 'Document',
};

const TYPE_COLORS: Record<string, string> = {
  text_only: '#e8935a',
  image: '#6366f1',
  carousel: '#34d399',
  video: '#f87171',
  poll: '#a78bfa',
  article: '#fbbf24',
  document: '#38bdf8',
};

interface Row {
  type: string;
  label: string;
  count: number;
  pct: number;
  avgRatio: number;
  color: string;
}

export default function OutlierContentTypeChart({ outliers }: Props) {
  const rows = useMemo<Row[]>(() => {
    if (!outliers || outliers.length === 0) return [];
    const buckets: Record<string, { count: number; ratioSum: number }> = {};
    for (const p of outliers) {
      const t = p.content_type || 'text_only';
      if (!buckets[t]) buckets[t] = { count: 0, ratioSum: 0 };
      buckets[t].count += 1;
      buckets[t].ratioSum += p.outlier_ratio || 0;
    }
    const total = outliers.length;
    return Object.entries(buckets)
      .map(([type, b]) => ({
        type,
        label: TYPE_LABELS[type] || type,
        count: b.count,
        pct: +((b.count / total) * 100).toFixed(1),
        avgRatio: b.count > 0 ? +(b.ratioSum / b.count).toFixed(1) : 0,
        color: TYPE_COLORS[type] || '#6b7280',
      }))
      .sort((a, b) => b.count - a.count);
  }, [outliers]);

  if (rows.length === 0) return null;

  const top = rows[0];

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Outlier Visual Distribution</h3>
          <p className="text-xs text-text-muted mt-0.5">
            How the {outliers.length} outliers break down by post format
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-text-muted">Dominant format</div>
          <div className="text-sm font-semibold" style={{ color: top.color }}>
            {top.label} · {top.pct}%
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 44)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#2e3348' }}
            tickLine={false}
            width={80}
          />
          <Tooltip
            cursor={{ fill: 'rgba(232,147,90,0.05)' }}
            contentStyle={{
              backgroundColor: '#222639',
              border: '1px solid #2e3348',
              borderRadius: '8px',
              color: '#e8eaf0',
              fontSize: '12px',
            }}
            formatter={(_v: any, _n: any, entry: any) => {
              const row = entry?.payload as Row;
              return [
                `${row.count} posts (${row.pct}%) · avg ${row.avgRatio}x ratio`,
                row.label,
              ];
            }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#9ca3af', fontSize: 11, formatter: (v: any) => `${v}` }}>
            {rows.map((r) => (
              <Cell key={r.type} fill={r.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border text-[11px]">
        {rows.map((r) => (
          <div key={r.type} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: r.color }} />
            <span className="text-text-secondary">{r.label}</span>
            <span className="text-text-muted">· avg {r.avgRatio}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}
