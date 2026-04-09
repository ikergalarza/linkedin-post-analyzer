import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HookTypeData {
  type: string;
  count: number;
  avg_engagement: number;
}

interface Props {
  data: HookTypeData[];
}

const hookLabels: Record<string, string> = {
  pattern_interrupt: 'Pattern Interrupt',
  belief_breaker: 'Belief Breaker',
  curiosity_gap: 'Curiosity Gap',
  data_shock: 'Data Shock',
  hot_take: 'Hot Take',
  personal_confession: 'Confession',
  story_opener: 'Story Opener',
  hypothetical_question: 'Hypothetical Q',
  why_question: 'Why Question',
  how_question: 'How Question',
  direct_question: 'Direct Question',
  open_question: 'Open Question',
  rhetorical_question: 'Rhetorical Q',
  list_promise: 'List Promise',
  prediction: 'Prediction',
  how_to_framework: 'How-To',
  bold_claim: 'Bold Claim',
  common_mistake: 'Common Mistake',
  direct_callout: 'Direct Callout',
  announcement: 'Announcement',
  social_proof_opener: 'Social Proof',
  analogy: 'Analogy',
  contrarian_take: 'Contrarian',
  relatable_moment: 'Relatable',
  motivational: 'Motivational',
  observation: 'Observation',
  challenge: 'Challenge',
  other: 'Other',
};

const COLORS = ['#e8935a', '#67e8f9', '#34d399', '#a78bfa', '#f87171', '#fbbf24', '#6366f1', '#38bdf8', '#f472b6', '#fb923c', '#4ade80', '#818cf8', '#22d3ee', '#facc15', '#c084fc', '#f87171', '#94a3b8', '#2dd4bf', '#e879f9', '#4b5563'];

export default function HookTypeChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.count >= 1)
    .map((d, i) => ({
      name: hookLabels[d.type] || d.type,
      count: d.count,
      avg_engagement: d.avg_engagement,
      color: COLORS[i % COLORS.length],
    }));

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold mb-1">Hook Type Performance</h3>
      <p className="text-text-muted text-xs mb-4">Average engagement by hook opening style</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 80 }}>
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#2e3348' }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2e3348' }}
            width={80}
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
