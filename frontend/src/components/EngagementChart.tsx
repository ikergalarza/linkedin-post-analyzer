import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Customized,
} from 'recharts';

interface TimelinePoint {
  published_at: string;
  engagement_score: number;
  is_outlier: boolean;
  content_type: string;
  hook_text: string | null;
  hook_type?: string;
  outlier_ratio?: number;
}

interface DailyEngagement {
  day: string;
  engagement: number;
}

interface Props {
  data: TimelinePoint[];
  dailyEngagement?: DailyEngagement[];
  avgEngagement: number;
}

function dayKey(ts: string): string {
  // YYYY-MM-DD in UTC — stable key for grouping timestamps by calendar day.
  return new Date(ts).toISOString().slice(0, 10);
}

function formatDayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Trailing MA over the last `window` calendar days. Each day now carries
// real engagement (measured from snapshots), so averaging raw days is the
// meaningful recent-trend signal.
function computeMovingAverage(entries: { engagement_score: number }[], window: number) {
  return entries.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = entries.slice(start, i + 1);
    if (slice.length === 0) return null;
    const sum = slice.reduce((s, e) => s + (e.engagement_score || 0), 0);
    return Math.round(sum / slice.length);
  });
}

function PencilLayer(props: any) {
  const { chartData, xAxisMap, offset } = props;
  if (!xAxisMap || !offset) return null;
  const xAxis: any = Object.values(xAxisMap)[0];
  const scale = xAxis?.scale;
  if (!scale) return null;

  const bandwidth = typeof scale.bandwidth === 'function' ? scale.bandwidth() : 0;
  // Drop the pencil below the x-axis tick labels.
  const pencilY = offset.top + offset.height + 30;

  return (
    <g pointerEvents="none">
      {chartData.map((d: any, i: number) => {
        if (!d.hasPost) return null;
        const cx = scale(d.day);
        if (!Number.isFinite(cx)) return null;
        const x = cx + bandwidth / 2;
        return (
          <g key={i} transform={`translate(${x}, ${pencilY})`}>
            {/* White pencil silhouette */}
            <path
              d="M-4.5,4 L-5.5,5 L-5,5.5 L-4,4.5 Z
                 M-4,3 L3,-4 L4.5,-2.5 L-2.5,4.5 Z
                 M3.5,-4.5 L4,-5 L5.5,-3.5 L5,-3 Z"
              fill="#ffffff"
              stroke="#ffffff"
              strokeWidth={0.4}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </g>
  );
}

export default function EngagementChart({ data, dailyEngagement, avgEngagement }: Props) {
  // Group posts by UTC day.
  const byDay = new Map<string, TimelinePoint[]>();
  for (const p of data) {
    if (!p.published_at) continue;
    const k = dayKey(p.published_at);
    const arr = byDay.get(k) || [];
    arr.push(p);
    byDay.set(k, arr);
  }

  // Snapshot-derived engagement per day (from post_snapshots deltas).
  // Only populated for posts within the 7-day monitoring window on managed accounts.
  const dailyFromSnapshots = new Map<string, number>();
  for (const d of dailyEngagement || []) {
    dailyFromSnapshots.set(d.day, d.engagement || 0);
  }

  // Build the full day range: first post day → today (UTC).
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const days: string[] = [];
  if (data.length > 0) {
    const firstKey = dayKey(data[0].published_at);
    const start = new Date(`${firstKey}T00:00:00Z`);
    for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
    }
  }

  const baseData = days.map((day) => {
    const posts = byDay.get(day) || [];
    const hasPost = posts.length > 0;
    const snapshotEngagement = dailyFromSnapshots.get(day);
    // Prefer measured daily engagement from snapshots. Fall back to the sum
    // of that day's posts' lifetime engagement so pre-snapshot days still
    // render something instead of a flat zero.
    const engagement =
      snapshotEngagement != null && snapshotEngagement > 0
        ? snapshotEngagement
        : hasPost
          ? posts.reduce((s, p) => s + (p.engagement_score || 0), 0)
          : 0;
    const isOutlier = posts.some((p) => p.is_outlier);
    const maxRatio = posts.reduce((m, p) => Math.max(m, p.outlier_ratio || 0), 0);
    return {
      day,
      date: formatDayLabel(day),
      engagement_score: engagement,
      is_outlier: isOutlier,
      outlier_ratio: maxRatio,
      hasPost,
      postCount: posts.length,
      // Flag so we can style residual-engagement bars differently.
      residualOnly: !hasPost && (snapshotEngagement || 0) > 0,
    };
  });

  const ma = computeMovingAverage(baseData, 10);
  const chartData = baseData.map((d, i) => ({ ...d, movingAvg: ma[i] }));

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Engagement Timeline</h3>
        <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#e8935a] inline-block" style={{ borderTop: '2px dashed #e8935a' }} /> Avg
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#67e8f9] inline-block" /> MA(10)
          </span>
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="-6 -6 12 12" aria-hidden="true">
              <path
                d="M-4.5,4 L-5.5,5 L-5,5.5 L-4,4.5 Z M-4,3 L3,-4 L4.5,-2.5 L-2.5,4.5 Z M3.5,-4.5 L4,-5 L5.5,-3.5 L5,-3 Z"
                fill="#ffffff"
              />
            </svg>
            Published
          </span>
        </div>
      </div>
      <div className="text-[11px] text-text-muted mb-4 space-y-0.5">
        <p><span className="text-text-secondary font-medium">Engagement</span>: likes + comments×2 + reposts×3 received each calendar day across every active post (measured from hourly snapshots, so old posts still receiving likes show up on non-posting days).</p>
        <p><span className="text-text-secondary font-medium">Avg</span>: creator's overall average engagement per post.</p>
        <p><span className="text-text-secondary font-medium">MA(10)</span>: moving average of the last 10 days — shows recent trend without daily noise.</p>
        <p><span className="text-text-secondary font-medium">Pencil</span>: day the creator published on their own profile. Days without a pencil are non-posting days (comments on other people's posts don't count).</p>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 40, left: 5 }}>
          <XAxis
            dataKey="day"
            tickFormatter={formatDayLabel}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2e3348' }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2e3348' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#222639',
              border: '1px solid #2e3348',
              borderRadius: '8px',
              color: '#e8eaf0',
              fontSize: '13px',
            }}
            formatter={(value: number | null, name: string) => {
              if (value == null) return ['—', name === 'movingAvg' ? 'MA(10)' : 'Engagement'];
              if (name === 'movingAvg') return [value.toLocaleString(), 'MA(10)'];
              return [value.toLocaleString(), 'Engagement'];
            }}
            labelFormatter={(label) => {
              const d = chartData.find((x) => x.day === label);
              const dateStr = d ? d.date : String(label);
              if (!d) return dateStr;
              if (d.hasPost) return `${dateStr} · ${d.postCount} post${d.postCount > 1 ? 's' : ''}`;
              if (d.residualOnly) return `${dateStr} · no post (older posts still active)`;
              return `${dateStr} · quiet day`;
            }}
            cursor={{ fill: 'rgba(232, 147, 90, 0.1)' }}
          />
          <ReferenceLine
            y={avgEngagement}
            stroke="#e8935a"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ value: 'Avg', fill: '#e8935a', fontSize: 11, position: 'right' }}
          />
          <Bar dataKey="engagement_score" radius={[3, 3, 0, 0]} maxBarSize={20}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.hasPost
                    ? (entry.outlier_ratio || 0) >= 10
                      ? '#67e8f9'
                      : entry.is_outlier
                        ? '#e8935a'
                        : '#3b3f54'
                    // Residual engagement days (no post published, but older posts
                    // still receiving likes/comments) get a subtler tone.
                    : (entry.residualOnly ? '#2a2f42' : '#1e2233')
                }
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="movingAvg"
            stroke="#67e8f9"
            strokeWidth={2}
            dot={false}
            strokeOpacity={0.7}
            connectNulls
          />
          <Customized component={<PencilLayer chartData={chartData} />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
