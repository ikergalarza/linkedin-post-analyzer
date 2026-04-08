import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StructureData {
  structure: string;
  count: number;
  avg_engagement: number;
}

interface Props {
  data: StructureData[];
}

const structureLabels: Record<string, string> = {
  list: 'List/Framework',
  problem_solution: 'Problem > Solution',
  story_lesson: 'Story > Lesson',
  short_punchy: 'Short & Punchy',
  long_form: 'Long-form',
  other: 'Other',
};

const COLORS = ['#34d399', '#e8935a', '#67e8f9', '#a78bfa', '#fbbf24', '#4b5563'];

export default function StructureChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.count >= 1)
    .map((d, i) => ({
      name: structureLabels[d.structure] || d.structure,
      count: d.count,
      avg_engagement: d.avg_engagement,
      color: COLORS[i % COLORS.length],
    }));

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold mb-1">Post Structure Performance</h3>
      <p className="text-text-muted text-xs mb-4">Average engagement by content structure</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 100 }}>
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#2e3348' }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2e3348' }}
            width={100}
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
              if (name === 'avg_engagement') return [value.toLocaleString(), 'Avg Engagement'];
              return [value, name];
            }}
          />
          <Bar dataKey="avg_engagement" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2">
        {chartData.map((d) => (
          <span key={d.name} className="text-[10px] text-text-muted">
            {d.name}: {d.count} posts
          </span>
        ))}
      </div>
    </div>
  );
}
