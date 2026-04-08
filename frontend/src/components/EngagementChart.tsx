import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

interface TimelinePoint {
  published_at: string;
  engagement_score: number;
  is_outlier: boolean;
  content_type: string;
  hook_text: string | null;
}

interface Props {
  data: TimelinePoint[];
  avgEngagement: number;
}

export default function EngagementChart({ data, avgEngagement }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="bg-bg-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Engagement Timeline</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
            formatter={(value: number) => [value.toLocaleString(), 'Engagement']}
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
              <Cell key={i} fill={entry.is_outlier ? '#e8935a' : '#3b3f54'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
