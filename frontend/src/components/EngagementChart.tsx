import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
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

interface Props {
  data: TimelinePoint[];
  avgEngagement: number;
}

function computeMovingAverage(data: { engagement_score: number }[], window: number) {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((s, d) => s + d.engagement_score, 0) / slice.length;
    return Math.round(avg);
  });
}

export default function EngagementChart({ data, avgEngagement }: Props) {
  const movingAvg = computeMovingAverage(data, 10);

  const chartData = data.map((d, i) => ({
    ...d,
    date: new Date(d.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    movingAvg: movingAvg[i],
  }));

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Engagement Timeline</h3>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#e8935a] inline-block" style={{ borderTop: '2px dashed #e8935a' }} /> Avg
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#67e8f9] inline-block" /> MA(10)
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2e3348' }}
            interval="preserveStartEnd"
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
            formatter={(value: number, name: string) => {
              if (name === 'movingAvg') return [value.toLocaleString(), 'MA(10)'];
              return [value.toLocaleString(), 'Engagement'];
            }}
            labelFormatter={(label) => label}
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
                  (entry.outlier_ratio || 0) >= 10
                    ? '#67e8f9'
                    : entry.is_outlier
                      ? '#e8935a'
                      : '#3b3f54'
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
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
