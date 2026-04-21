import { useRef, useState } from 'react';
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

// Custom dot for the daily line — only renders on days with publications.
// Orange = at least one post; green = at least one outlier.
const PublicationDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.posts <= 0 || cx === undefined || cy === undefined) return null;
  const hasOutlier = payload.outliers > 0;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={hasOutlier ? '#34d399' : '#e8935a'}
        stroke="#1a1d2e"
        strokeWidth={2}
      />
      {payload.posts > 1 && (
        <text x={cx} y={cy + 3} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
          {payload.posts}
        </text>
      )}
    </g>
  );
};

export default function AccountsEngagementChart({ data, hasImpressions, xTickInterval }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null);
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
    // Short delay so the cursor has time to reach the tooltip itself.
    clearTimerRef.current = window.setTimeout(() => setHover(null), 150);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
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
            interval={xTickInterval}
          />
          <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2e3348' }} />
          {hasImpressions && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#7dd3fc', fontSize: 11 }}
              axisLine={{ stroke: '#2e3348' }}
              tickFormatter={(v) => fmtNum(Number(v))}
            />
          )}
          {/* Crosshair cursor only — tooltip itself is rendered outside so it
              can stay open while the mouse hovers the card and clicks the
              "View on LinkedIn" button. */}
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
            dot={<PublicationDot />}
            activeDot={{ r: 7, fill: '#e8935a', stroke: '#1a1d2e', strokeWidth: 2 }}
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
              activeDot={{ r: 6, fill: '#38bdf8', stroke: '#1a1d2e', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {/* Sticky custom tooltip — rendered as sibling of the chart so it stays
          open while the cursor hovers the card and the "View on LinkedIn"
          button remains clickable. */}
      {hover && (() => {
        const d = data.find((x) => x.day === hover.day);
        if (!d) return null;
        const heading = d.posts > 0
          ? `${fmtFullDay(d.day)} · ${d.posts} post${d.posts > 1 ? 's' : ''}`
          : `${fmtFullDay(d.day)} · no post`;
        const containerW = wrapperRef.current?.offsetWidth ?? 600;
        const tooltipW = 240;
        const gap = 28;
        const showLeft = hover.x + tooltipW + gap + 4 > containerW;
        const leftPx = showLeft ? hover.x - tooltipW - gap : hover.x + gap;
        const topPx = Math.max(0, hover.y - 140);
        return (
          <div
            onMouseEnter={cancelClear}
            onMouseLeave={() => setHover(null)}
            style={{
              position: 'absolute',
              left: Math.max(0, leftPx),
              top: topPx,
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
              Engagement (7d):{' '}
              <span style={{ color: '#e8eaf0', fontWeight: 600 }}>
                {fmtNum(d.rolling)}
              </span>
            </div>
            {d.rollingImpressions > 0 && (
              <div style={{ color: '#7dd3fc', fontSize: 12, marginTop: 2 }}>
                👁️ {fmtNum(d.rollingImpressions)}{' '}
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>impressions</span>
              </div>
            )}
            {d.activePosts > 0 && (
              <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                {d.activePosts} post{d.activePosts > 1 ? 's' : ''} active in 7-day window
              </div>
            )}
            {d.posts > 0 && d.topPostOutlierRatio != null && d.topPostOutlierRatio > 0 && (
              <div style={{ marginTop: 4, fontSize: 11 }}>
                <span style={{ color: '#94a3b8' }}>Top post: </span>
                <span
                  style={{
                    color: d.topPostIsOutlier ? '#34d399' : '#cbd5e1',
                    fontWeight: 600,
                  }}
                >
                  {d.topPostOutlierRatio.toFixed(1)}× creator avg
                </span>
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
                  <div
                    style={{ color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}
                  >
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
