import { useRef, useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export interface DayPost {
  id: string;
  preview: string | null;
  url: string | null;
  outlierRatio: number | null;
  isOutlier: boolean;
  creatorId: string;
  creatorName: string;
}

export interface DailyPoint {
  day: string;
  label: string;
  rolling: number;
  raw: number;
  posts: number;
  outliers: number;
  rollingImpressions: number;
  rawImpressions: number;
  activePosts: number;
  // All posts published this day, ordered by engagement DESC. Each one
  // gets its own pencil badge in the strip below the chart, grouped by
  // creator into stable horizontal rows (alphabetical by creator name)
  // so the same person always sits on the same row when Iker+Unai both
  // publish.
  dayPosts: DayPost[];
  // Derived from dayPosts[0] for the legacy single-post tooltip path —
  // kept so any other consumer of DailyPoint doesn't break.
  topPostId: string | null;
  topPostPreview: string | null;
  topPostUrl: string | null;
  topPostOutlierRatio: number | null;
  topPostIsOutlier: boolean | null;
}

interface Props {
  data: DailyPoint[];
  hasImpressions: boolean;
  xTickInterval: number;
  // Managed-account creator ids in the canonical display order (by onboarding
  // date), so the pencil rows read Iker → Unai → Asier instead of alphabetical.
  // Creators not in the list fall back to alphabetical, after the ordered ones.
  creatorOrder?: string[];
}

interface HoverState {
  day: string;
  // For pencil hovers: the id of the specific post being hovered, so
  // the tooltip can show THAT post's preview/ratio/link (not just the
  // top-engagement post of the whole day). undefined for point hovers.
  postId?: string;
  // x / y are ALWAYS relative to the wrapper div, so the absolutely-
  // positioned tooltip lines up regardless of the filter-buttons row
  // that sits between the wrapper top and the chart's SVG.
  x: number;
  y: number;
  // 'pencil' = hovering a publish-day badge (rich tooltip with that
  // post's preview). 'point' = hovering the line/area itself (compact
  // values-only tooltip, positioned so it never clips off the top of
  // the card).
  source: 'pencil' | 'point';
  // For point hovers: was the point in the top half of the plot? If so
  // the tooltip drops below the cursor; otherwise it grows above.
  flipBelow?: boolean;
}

// Note: the chart-internal range selector (7d/30d/90d/all) was removed.
// The Accounts page now owns the only date range filter and feeds the
// already-windowed data straight to this chart.

// Same colour the Dashboard uses for outliers — keeps the whole app coherent.
const OUTLIER_COLOR = '#67e8f9';

// The tooltip + pencil title only need the first name. Full creator
// names ("Iker Galarza Rodríguez") visually overcrowded the small
// tooltip card; first names are unambiguous in this product (the only
// managed accounts are Iker and Unai).
function firstName(name: string): string {
  return (name || '').trim().split(/\s+/)[0] || name;
}
const PENCIL_BG_NORMAL = '#6b7280';
const PENCIL_BG_OUTLIER = OUTLIER_COLOR;

// Fixed margins so the pencil strip below can align 1:1 with the plot area.
const CHART_MARGIN = { top: 10, right: 10, bottom: 8, left: 5 };
const Y_AXIS_WIDTH = 50;
const CHART_HEIGHT = 300;

function PencilIcon({ size = 14, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
      <path d="M20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function fmtFullDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

// In-chart tooltip for hovering the line/area. Rendered THROUGH Recharts
// (content prop) so Recharts owns its positioning and keeps it on-screen
// — the previous onMouseMove-driven DOM tooltip never reliably fired for
// line hovers. Values only (no top-post preview / link): the rich
// pencil-driven tooltip still covers that.
function PointTooltip({ active, payload, hasImpressions }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const heading = d.posts > 0
    ? `${fmtFullDay(d.day)} · ${d.posts} post${d.posts > 1 ? 's' : ''}`
    : `${fmtFullDay(d.day)} · no post`;
  return (
    <div
      style={{
        background: '#222639',
        border: '1px solid #3a4566',
        borderRadius: 8,
        color: '#e8eaf0',
        fontSize: 13,
        padding: 10,
        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
        maxWidth: 240,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{heading}</div>

      <MetricRow
        swatch="#e8935a"
        label="Engagement (7d)"
        value={fmtNum(d.rolling)}
        valueColor="#e8eaf0"
        sub={d.raw > 0 ? `${fmtNum(d.raw)} that day` : null}
      />

      {hasImpressions && (
        <div style={{ marginTop: 6 }}>
          <MetricRow
            swatch="#38bdf8"
            label="Impressions (7d)"
            value={fmtNum(d.rollingImpressions)}
            valueColor="#bae6fd"
            sub={d.rawImpressions > 0 ? `${fmtNum(d.rawImpressions)} that day` : null}
          />
        </div>
      )}

      {d.activePosts > 0 && (
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 6 }}>
          {d.activePosts} post{d.activePosts > 1 ? 's' : ''} active in 7-day window
        </div>
      )}
    </div>
  );
}

// One metric line: label + big number baseline-aligned on row 1, the
// "X that day" qualifier alone on row 2 (so it never wraps mid-phrase
// and the big number doesn't look like it's floating).
function MetricRow({
  swatch, label, value, valueColor, sub,
}: { swatch: string; label: string; value: string; valueColor: string; sub: string | null }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ width: 9, height: 2, background: swatch, display: 'inline-block', borderRadius: 1, alignSelf: 'center' }} />
        <span style={{ color: '#cbd5e1', fontSize: 13 }}>{label}:</span>
        <span style={{ color: valueColor, fontWeight: 700, fontSize: 15 }}>{value}</span>
      </div>
      {sub && (
        <div style={{ color: '#94a3b8', fontSize: 11, marginLeft: 15, marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function AccountsEngagementChart({ data, hasImpressions, xTickInterval, creatorOrder }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chartBoxRef = useRef<HTMLDivElement>(null);
  const clearTimerRef = useRef<number | null>(null);

  const cancelClear = () => {
    if (clearTimerRef.current != null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  };
  const scheduleClear = () => {
    cancelClear();
    clearTimerRef.current = window.setTimeout(() => setHover(null), 150);
  };

  const filteredData = data;
  const effectiveTickInterval = xTickInterval;

  // Compute the stable ordering of creators that have at least one post
  // in the visible range. Primary order = the canonical onboarding order
  // passed in `creatorOrder` (Iker → Unai → Asier); creators not in that
  // list fall back to alphabetical after the ordered ones. This keeps each
  // person on the same row across renders. If only one creator is visible
  // (single-account filter, or only one published in the range) the strip
  // collapses to one row.
  const creatorRowOrder = (() => {
    const map = new Map<string, string>(); // id → name
    for (const d of filteredData) {
      for (const p of d.dayPosts) {
        if (!map.has(p.creatorId)) map.set(p.creatorId, p.creatorName);
      }
    }
    const orderIndex = new Map((creatorOrder || []).map((id, i) => [id, i] as const));
    const rank = (id: string) => (orderIndex.has(id) ? orderIndex.get(id)! : Number.MAX_SAFE_INTEGER);
    return [...map.entries()]
      .sort((a, b) => {
        const ra = rank(a[0]);
        const rb = rank(b[0]);
        if (ra !== rb) return ra - rb;
        return a[1].localeCompare(b[1], undefined, { sensitivity: 'base' });
      })
      .map(([id]) => id);
  })();
  const creatorRowIndex = new Map(creatorRowOrder.map((id, i) => [id, i] as const));
  const ROW_HEIGHT = 22; // px per pencil row
  const stripHeight = Math.max(22, creatorRowOrder.length * ROW_HEIGHT);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div ref={chartBoxRef}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart
          data={filteredData}
          margin={CHART_MARGIN}
        >
          <defs>
            <linearGradient id="rollingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8935a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#e8935a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="impressionsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#2e3348' }}
            interval={effectiveTickInterval}
          />
          <YAxis
            yAxisId="left"
            width={Y_AXIS_WIDTH}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#2e3348' }}
          />
          {hasImpressions && (
            <YAxis
              yAxisId="right"
              orientation="right"
              width={Y_AXIS_WIDTH}
              tick={{ fill: '#7dd3fc', fontSize: 11 }}
              axisLine={{ stroke: '#2e3348' }}
              tickFormatter={(v) => fmtNum(Number(v))}
            />
          )}
          <Tooltip
            cursor={{ stroke: '#e8935a', strokeOpacity: 0.3, strokeWidth: 1 }}
            content={<PointTooltip hasImpressions={hasImpressions} />}
            wrapperStyle={{ zIndex: 60, outline: 'none' }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="rolling"
            stroke="none"
            fill="url(#rollingFill)"
            isAnimationActive={false}
          />
          {hasImpressions && (
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="rollingImpressions"
              stroke="none"
              fill="url(#impressionsFill)"
              isAnimationActive={false}
            />
          )}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rolling"
            name="Engagement (7d rolling)"
            stroke="#e8935a"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: '#e8935a', stroke: '#1a1d2e', strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {hasImpressions && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rollingImpressions"
              name="Impressions (7d rolling)"
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#1a1d2e', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>

      {/* Pencil strip — one pencil per published post. When the global
          filter is "all managed accounts" and two creators published on
          the same day, the pencils stack on different rows (alphabetical
          by creator) instead of fighting for the same slot. Same-creator
          double-publish days get a small horizontal offset so both
          badges remain clickable. */}
      <div
        style={{
          position: 'relative',
          marginLeft: Y_AXIS_WIDTH + CHART_MARGIN.left,
          marginRight: (hasImpressions ? Y_AXIS_WIDTH : 0) + CHART_MARGIN.right,
          marginTop: 6,
          minHeight: stripHeight,
        }}
        aria-label="Posts published in range"
      >
        {filteredData.flatMap((d, i) => {
          if (!d.dayPosts || d.dayPosts.length === 0) return [];
          const n = filteredData.length;
          const leftPct = n > 1 ? (i / (n - 1)) * 100 : 50;
          // Group day posts by creator so multiple-of-same-creator on a
          // single day end up side by side on the SAME row instead of
          // wandering across rows.
          const byCreator = new Map<string, typeof d.dayPosts>();
          for (const p of d.dayPosts) {
            const list = byCreator.get(p.creatorId);
            if (list) list.push(p);
            else byCreator.set(p.creatorId, [p]);
          }
          const nodes: React.ReactNode[] = [];
          for (const [creatorId, posts] of byCreator.entries()) {
            const rowIdx = creatorRowIndex.get(creatorId) ?? 0;
            posts.forEach((p, postIdxInRow) => {
              // Horizontal nudge when the SAME creator has >1 post on
              // one day. Keeps both pencils on the row but not stacked.
              const nudgePx = (postIdxInRow - (posts.length - 1) / 2) * 22;
              nodes.push(
                <div
                  key={`${d.day}-${p.id}`}
                  onMouseEnter={(e) => {
                    cancelClear();
                    const pencilRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
                    if (!wrapperRect) return;
                    setHover({
                      day: d.day,
                      postId: p.id,
                      x: pencilRect.left + pencilRect.width / 2 - wrapperRect.left,
                      y: pencilRect.top - wrapperRect.top,
                      source: 'pencil',
                    });
                  }}
                  onMouseLeave={scheduleClear}
                  style={{
                    position: 'absolute',
                    left: `calc(${leftPct}% + ${nudgePx}px)`,
                    top: rowIdx * ROW_HEIGHT,
                    transform: 'translateX(-50%)',
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background: p.isOutlier ? PENCIL_BG_OUTLIER : PENCIL_BG_NORMAL,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title={`${firstName(p.creatorName)} · ${d.day}`}
                >
                  <PencilIcon size={14} color="#ffffff" />
                </div>
              );
            });
          }
          return nodes;
        })}
      </div>

      {/* Pencil-driven sticky tooltip — rendered outside Recharts so it
          stays open while the cursor hovers it and the "View on LinkedIn"
          button stays clickable. Pencils sit at the bottom, so it always
          grows upward and stays inside the clipped card. */}
      {hover && (() => {
        const d = filteredData.find((x) => x.day === hover.day);
        if (!d) return null;
        // For pencil hovers we always have a postId — show THAT post.
        // Fallback to dayPosts[0] for safety (and for point hovers,
        // though those use Recharts' own tooltip, not this one).
        const hoveredPost = hover.postId
          ? d.dayPosts.find((p) => p.id === hover.postId) ?? d.dayPosts[0] ?? null
          : d.dayPosts[0] ?? null;
        const heading = hoveredPost
          ? `${fmtFullDay(d.day)} · ${firstName(hoveredPost.creatorName)}`
          : `${fmtFullDay(d.day)} · no post`;
        const containerW = wrapperRef.current?.offsetWidth ?? 600;
        const tooltipW = 240;
        const gap = 12;
        const showLeft = hover.x + tooltipW + gap + 4 > containerW;
        const leftPx = showLeft ? hover.x - tooltipW - gap : hover.x + gap;
        return (
          <div
            onMouseEnter={cancelClear}
            onMouseLeave={() => setHover(null)}
            style={{
              position: 'absolute',
              left: Math.max(0, leftPx),
              top: Math.max(0, hover.y) - 8,
              transform: 'translateY(-100%)',
              width: tooltipW,
              background: '#222639',
              border: '1px solid #2e3348',
              borderRadius: 8,
              color: '#e8eaf0',
              fontSize: 13,
              padding: 10,
              boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
              zIndex: 50,
              pointerEvents: 'auto',
            }}
          >
            {/* Pencil tooltip shows the SPECIFIC post the user is
                hovering — not just the top of the day — so when two
                creators publish on the same date, hovering each pencil
                surfaces that author's post and link. */}
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{heading}</div>
            {hoveredPost && hoveredPost.outlierRatio != null && hoveredPost.outlierRatio > 0 && (
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #2e3348', fontSize: 12 }}>
                <span style={{ color: '#94a3b8' }}>This post: </span>
                <span
                  style={{
                    color: hoveredPost.isOutlier ? OUTLIER_COLOR : '#cbd5e1',
                    fontWeight: 600,
                  }}
                >
                  {hoveredPost.outlierRatio.toFixed(1)}× creator avg
                </span>
                {hoveredPost.isOutlier && (
                  <span
                    style={{
                      marginLeft: 6,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: 'rgba(103,232,249,0.15)',
                      color: OUTLIER_COLOR,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 0.3,
                    }}
                  >
                    OUTLIER
                  </span>
                )}
              </div>
            )}
            {hoveredPost && (hoveredPost.preview || hoveredPost.url) && (
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
                {hoveredPost.preview ? (
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
                    {hoveredPost.preview}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}>
                    (no preview available)
                  </div>
                )}
                {hoveredPost.url && (
                  <a
                    href={hoveredPost.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      background: '#e8935a',
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
      })()}
    </div>
  );
}
