import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface TimelinePoint {
  published_at: string;
  engagement_score: number;
  is_outlier: boolean;
  content_type: string;
  hook_text: string | null;
  hook_type?: string;
  outlier_ratio?: number;
  post_url?: string | null;
  content_text?: string | null;
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

type Range = '7d' | '30d' | '90d' | 'all';

const RANGE_DAYS: Record<Range, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

function dayKey(ts: string): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function formatDayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Fixed chart margins so the pencil strip below can align with the plot area
// using plain HTML (no fiddling with Recharts internals).
const CHART_MARGIN = { top: 10, right: 10, bottom: 8, left: 5 };
const Y_AXIS_WIDTH = 50;
const X_AXIS_HEIGHT = 28;
const CHART_HEIGHT = 300;

export default function EngagementChart({ data, dailyEngagement }: Props) {
  const [range, setRange] = useState<Range>('30d');

  const { chartData, displayedAvg, postDaysInRange } = useMemo(() => {
    // Group posts by UTC day.
    const byDay = new Map<string, TimelinePoint[]>();
    for (const p of data) {
      if (!p.published_at) continue;
      const k = dayKey(p.published_at);
      const arr = byDay.get(k) || [];
      arr.push(p);
      byDay.set(k, arr);
    }

    const dailyFromSnapshots = new Map<string, number>();
    for (const d of dailyEngagement || []) {
      dailyFromSnapshots.set(d.day, d.engagement || 0);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // For short ranges, always span the last N days ending today (even if the
    // creator didn't post at the start of the window). For "all", start at
    // their first post.
    const rangeDays = RANGE_DAYS[range];
    const days: string[] = [];
    if (rangeDays != null) {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - (rangeDays - 1));
      for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
        days.push(d.toISOString().slice(0, 10));
      }
    } else if (data.length > 0) {
      const firstKey = dayKey(data[0].published_at);
      const start = new Date(`${firstKey}T00:00:00Z`);
      for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
        days.push(d.toISOString().slice(0, 10));
      }
    }

    const rows = days.map((day) => {
      const posts = byDay.get(day) || [];
      const hasPost = posts.length > 0;
      const snap = dailyFromSnapshots.get(day);
      // Prefer measured daily engagement from snapshots; fall back to that
      // day's posts' lifetime totals when the post predates the snapshot
      // window so the chart has something to render on older post days.
      const engagement =
        snap != null && snap > 0
          ? snap
          : hasPost
            ? posts.reduce((s, p) => s + (p.engagement_score || 0), 0)
            : 0;
      const isOutlier = posts.some((p) => p.is_outlier);
      const maxRatio = posts.reduce((m, p) => Math.max(m, p.outlier_ratio || 0), 0);
      const topPost = hasPost
        ? posts.reduce((best, p) => ((p.engagement_score || 0) > (best.engagement_score || 0) ? p : best), posts[0])
        : null;
      return {
        day,
        date: formatDayLabel(day),
        engagement_score: engagement,
        is_outlier: isOutlier,
        outlier_ratio: maxRatio,
        hasPost,
        postCount: posts.length,
        topPost,
      };
    });

    const postDays = rows.filter((r) => r.hasPost).length;
    const total = rows.reduce((s, r) => s + r.engagement_score, 0);
    const avg = rows.length > 0 ? total / rows.length : 0;

    return { chartData: rows, displayedAvg: avg, postDaysInRange: postDays };
  }, [data, dailyEngagement, range]);

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Engagement Timeline</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Range filter */}
          <div
            style={{
              display: 'flex',
              background: '#1e293b',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            {(['7d', '30d', '90d', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: range === r ? '#3b82f6' : 'transparent',
                  color: range === r ? '#fff' : '#94a3b8',
                  transition: 'all 0.15s',
                }}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap pl-2">
            <span className="flex items-center gap-1">
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: '#2a2f42',
                  border: '1px solid #3b3f54',
                }}
              />
              Post
            </span>
            <span className="flex items-center gap-1">
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: '#e8935a',
                }}
              />
              Outlier
            </span>
            <span className="flex items-center gap-1">
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: '#67e8f9',
                }}
              />
              10x+
            </span>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-text-muted mb-3 space-y-0.5">
        <p>
          <span className="text-text-secondary font-medium">Engagement</span>: likes + comments×2 + reposts×3
          received each day across every active post. The curve tracks how the creator's audience is reacting
          over time, not just on publish days — an old post still gathering likes counts toward the day those
          likes arrived.
        </p>
        <p>
          <span className="text-text-secondary font-medium">Pencil</span>: day the creator published on their
          own profile. Color matches the post's outlier status (orange = 3×+ their average, cyan = 10×+).
        </p>
        <p className="text-text-muted/80 italic">
          Measured from hourly snapshots for 7 days after each post publishes. Days with no active post in
          that window show zero — a capture limit, not a flat metric.
        </p>
      </div>
      <div className="flex items-center gap-4 mb-3 text-xs text-text-muted">
        <span>
          <span className="text-text-secondary font-medium">{postDaysInRange}</span> day
          {postDaysInRange === 1 ? '' : 's'} with a post in the last{' '}
          {range === 'all' ? 'window' : range}
        </span>
        <span>
          avg engagement / day:{' '}
          <span className="text-text-secondary font-medium">{Math.round(displayedAvg).toLocaleString()}</span>
        </span>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={chartData} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickFormatter={formatDayLabel}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#2e3348' }}
              interval="preserveStartEnd"
              minTickGap={32}
              height={X_AXIS_HEIGHT}
            />
            <YAxis
              width={Y_AXIS_WIDTH}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#2e3348' }}
            />
            <Tooltip
              wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
              cursor={{ stroke: '#67e8f9', strokeOpacity: 0.3, strokeWidth: 1 }}
              content={({ active, label }) => {
                if (!active) return null;
                const d = chartData.find((x) => x.day === label);
                if (!d) return null;
                const heading = d.hasPost
                  ? `${d.date} · ${d.postCount} post${d.postCount > 1 ? 's' : ''}`
                  : `${d.date} · no post`;
                const preview =
                  d.topPost?.content_text || d.topPost?.hook_text || '';
                return (
                  <div
                    style={{
                      background: '#222639',
                      border: '1px solid #2e3348',
                      borderRadius: 8,
                      color: '#e8eaf0',
                      fontSize: 13,
                      padding: 10,
                      maxWidth: 300,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{heading}</div>
                    <div style={{ color: '#cbd5e1' }}>
                      Engagement: <span style={{ color: '#e8eaf0', fontWeight: 600 }}>
                        {d.engagement_score.toLocaleString()}
                      </span>
                    </div>
                    {d.hasPost && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          background: '#1a1d2b',
                          border: '1px solid #2e3348',
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      >
                        {preview ? (
                          <div
                            style={{
                              color: '#cbd5e1',
                              whiteSpace: 'pre-wrap',
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              marginBottom: 8,
                              lineHeight: 1.35,
                            }}
                          >
                            {preview}
                          </div>
                        ) : (
                          <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}>
                            (no preview available)
                          </div>
                        )}
                        {d.topPost?.post_url && (
                          <a
                            href={d.topPost.post_url}
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
              }}
            />
            {displayedAvg > 0 && (
              <ReferenceLine
                y={displayedAvg}
                stroke="#e8935a"
                strokeDasharray="4 4"
                strokeWidth={1}
                strokeOpacity={0.7}
                label={{ value: 'Daily avg', fill: '#e8935a', fontSize: 10, position: 'right' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="engagement_score"
              stroke="#67e8f9"
              strokeWidth={2}
              fill="url(#engagementFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
        {/* Pencil strip — absolutely positioned so each badge lands directly
            under the curve's data point. Recharts AreaChart with category
            XAxis anchors the first point at the left edge of the plot area
            and the last at the right edge, so the i-th point sits at
            i / (n-1) of the plot width. */}
        <div
          style={{
            position: 'relative',
            marginLeft: Y_AXIS_WIDTH + CHART_MARGIN.left,
            marginRight: CHART_MARGIN.right,
            marginTop: 6,
            minHeight: 22,
          }}
          aria-label="Days with publications"
        >
          {chartData.map((d, i) => {
            if (!d.hasPost) return null;
            const isHyper = (d.outlier_ratio || 0) >= 10;
            const bg = isHyper ? '#67e8f9' : d.is_outlier ? '#e8935a' : '#ffffff';
            const n = chartData.length;
            const left = n > 1 ? (i / (n - 1)) * 100 : 50;
            return (
              <div
                key={i}
                title={`${d.date} · ${d.postCount} post${d.postCount > 1 ? 's' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: 0,
                  transform: 'translateX(-50%)',
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: bg,
                  border: '1px solid #3b3f54',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  lineHeight: 1,
                }}
              >
                ✏️
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
