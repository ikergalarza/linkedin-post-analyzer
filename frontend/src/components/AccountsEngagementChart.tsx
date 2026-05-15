import { useMemo, useRef, useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

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
}

interface HoverState {
  day: string;
  x: number;
  y: number;
}

type Range = '7d' | '30d' | '90d' | 'all';
const RANGE_DAYS: Record<Range, number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null };

// Same colour the Dashboard uses for outliers — keeps the whole app coherent.
const OUTLIER_COLOR = '#67e8f9';
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

export default function AccountsEngagementChart({ data, hasImpressions, xTickInterval }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [range, setRange] = useState<Range>('30d');
  const wrapperRef = useRef<HTMLDivElement>(null);
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

  // Chart-level range filter slices the already-loaded data client-side so
  // changing range is instant (no new API call). The page-level range still
  // controls how much data is fetched in total.
  const filteredData = useMemo(() => {
    const rangeDays = RANGE_DAYS[range];
    if (rangeDays == null) return data;
    return data.slice(-rangeDays);
  }, [data, range]);

  // Recompute tick interval when the range changes so the X axis stays readable.
  const effectiveTickInterval = useMemo(() => {
    if (range === 'all') return xTickInterval;
    return Math.max(0, Math.floor(filteredData.length / 8) - 1);
  }, [filteredData.length, range, xTickInterval]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Chart-level range filter — mirrors the Dashboard's engagement chart. */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <span className="text-xs text-text-muted mr-1">View:</span>
        {(['7d', '30d', '90d', 'all'] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              range === r
                ? 'bg-diamond/15 text-diamond border border-diamond/30'
                : 'bg-bg-secondary text-text-muted border border-border hover:border-diamond/30'
            }`}
          >
            {r === 'all' ? 'All' : r}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart
          data={filteredData}
          margin={CHART_MARGIN}
          onMouseMove={(state: any) => {
            if (state?.isTooltipActive && state.activeLabel && state.activeCoordinate) {
              cancelClear();
              setHover({
                day: state.activeLabel,
                x: state.activeCoordinate.x,
                y: state.activeCoordinate.y,
              });
            }
          }}
          onMouseLeave={scheduleClear}
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
            content={() => null}
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

      {/* Pencil strip — matches the Dashboard's Engagement Timeline pattern.
          Each publication day gets a pencil badge aligned exactly under the
          data point. Days with an outlier light up in diamond/cyan, matching
          the outlier colour used throughout the rest of the app. */}
      <div
        style={{
          position: 'relative',
          marginLeft: Y_AXIS_WIDTH + CHART_MARGIN.left,
          marginRight: (hasImpressions ? Y_AXIS_WIDTH : 0) + CHART_MARGIN.right,
          marginTop: 6,
          minHeight: 22,
        }}
        aria-label="Days with publications"
      >
        {filteredData.map((d, i) => {
          if (d.posts <= 0) return null;
          const isOut = (d.outliers || 0) > 0;
          const n = filteredData.length;
          const left = n > 1 ? (i / (n - 1)) * 100 : 50;
          return (
            <div
              key={`${d.day}-${i}`}
              onMouseEnter={(e) => {
                cancelClear();
                const pencilRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const wrapperRect = wrapperRef.current?.getBoundingClientRect();
                if (!wrapperRect) return;
                setHover({
                  day: d.day,
                  x: pencilRect.left + pencilRect.width / 2 - wrapperRect.left,
                  // Use the pencil's real top — paired with translateY(-100%)
                  // on the tooltip, it sits right above the pencil and grows
                  // up into the chart area without spilling below.
                  y: pencilRect.top - wrapperRect.top,
                });
              }}
              onMouseLeave={scheduleClear}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: 0,
                transform: 'translateX(-50%)',
                width: 18,
                height: 18,
                borderRadius: 4,
                background: isOut ? PENCIL_BG_OUTLIER : PENCIL_BG_NORMAL,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <PencilIcon size={14} color="#ffffff" />
            </div>
          );
        })}
      </div>

      {/* Sticky custom tooltip — rendered outside Recharts so it stays open
          while the cursor hovers the card and the "View on LinkedIn" button
          remains clickable. */}
      {hover && (() => {
        const d = filteredData.find((x) => x.day === hover.day);
        if (!d) return null;
        const heading = d.posts > 0
          ? `${fmtFullDay(d.day)} · ${d.posts} post${d.posts > 1 ? 's' : ''}`
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
              // Anchor the BOTTOM of the tooltip just above the hovered point
              // using translateY(-100%). The outer card has overflow-hidden;
              // growing the tooltip upward keeps it inside that clip region.
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
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{heading}</div>
            <div style={{ color: '#cbd5e1' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 2, background: '#e8935a', display: 'inline-block', borderRadius: 1 }} />
                Engagement (7d):
              </span>{' '}
              <span style={{ color: '#e8eaf0', fontWeight: 600 }}>
                {fmtNum(d.rolling)}
              </span>
              {d.raw > 0 && (
                <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 11 }}>
                  {' '}· {fmtNum(d.raw)} that day
                </span>
              )}
            </div>
            {hasImpressions && (
              <div style={{ color: '#7dd3fc', fontSize: 12, marginTop: 3 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 2, background: '#38bdf8', display: 'inline-block', borderRadius: 1 }} />
                  Impressions (7d):
                </span>{' '}
                <span style={{ color: '#bae6fd', fontWeight: 600 }}>
                  {fmtNum(d.rollingImpressions)}
                </span>
                {d.rawImpressions > 0 && (
                  <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 11 }}>
                    {' '}· {fmtNum(d.rawImpressions)} that day
                  </span>
                )}
              </div>
            )}
            {d.activePosts > 0 && (
              <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                {d.activePosts} post{d.activePosts > 1 ? 's' : ''} active in 7-day window
              </div>
            )}
            {d.posts > 0 && d.topPostOutlierRatio != null && d.topPostOutlierRatio > 0 && (
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #2e3348', fontSize: 12 }}>
                <span style={{ color: '#94a3b8' }}>Top post: </span>
                <span
                  style={{
                    color: d.topPostIsOutlier ? OUTLIER_COLOR : '#cbd5e1',
                    fontWeight: 600,
                  }}
                >
                  {d.topPostOutlierRatio.toFixed(1)}× creator avg
                </span>
                {d.topPostIsOutlier && (
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
            {d.posts > 0 && (d.topPostPreview || d.topPostUrl) && (
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
                {d.topPostPreview ? (
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
                    {d.topPostPreview}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}>
                    (no preview available)
                  </div>
                )}
                {d.topPostUrl && (
                  <a
                    href={d.topPostUrl}
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
