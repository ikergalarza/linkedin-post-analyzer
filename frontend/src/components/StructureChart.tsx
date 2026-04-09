import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StructureData {
  structure: string;
  count: number;
  avg_ratio: number;
  avg_engagement: number;
}

interface Props {
  data: StructureData[];
}

const structureLabels: Record<string, string> = {
  hook_list_cta: 'Hook>List>CTA',
  hook_story_lesson_cta: 'Hook>Story>Lesson>CTA',
  problem_agitate_solve: 'Problem>Agitate>Solve',
  contrarian_proof_reframe: 'Contrarian>Proof>Reframe',
  confession_insight_takeaway: 'Confession>Insight>Takeaway',
  list_framework: 'List / Framework',
  problem_solution: 'Problem > Solution',
  story_lesson: 'Story > Lesson',
  before_after: 'Before / After',
  step_by_step: 'Step-by-Step',
  myth_busting: 'Myth Busting',
  question_answer: 'Question > Answer',
  observation_insight: 'Observation > Insight',
  prediction_vision: 'Prediction / Vision',
  motivational_manifesto: 'Motivational',
  authority_framework: 'Authority > Framework',
  comparison: 'Comparison',
  short_punchy: 'Short & Punchy',
  long_form_essay: 'Long-form Essay',
  narrative_arc: 'Narrative Arc',
  content_with_cta: 'Content + CTA',
  data_driven: 'Data-Driven',
  other: 'Other',
};

const COLORS = ['#34d399', '#e8935a', '#67e8f9', '#a78bfa', '#fbbf24', '#f87171', '#6366f1', '#38bdf8', '#f472b6', '#fb923c', '#4ade80', '#818cf8', '#22d3ee', '#facc15', '#c084fc', '#94a3b8', '#2dd4bf', '#e879f9', '#4b5563'];

export default function StructureChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.count >= 1)
    .map((d, i) => ({
      name: structureLabels[d.structure] || d.structure,
      count: d.count,
      avg_ratio: d.avg_ratio,
      avg_engagement: d.avg_engagement,
      color: COLORS[i % COLORS.length],
    }));

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold mb-1">Post Structure Performance</h3>
      <p className="text-text-muted text-xs mb-4">Average outlier ratio (Xx) by content structure</p>
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
              if (name === 'avg_ratio') return [`${value}x`, 'Avg Ratio'];
              if (name === 'avg_engagement') return [value.toLocaleString(), 'Avg Engagement'];
              return [value, name];
            }}
          />
          <Bar dataKey="avg_ratio" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2">
        {chartData.map((d) => (
          <span key={d.name} className="text-[10px] text-text-muted">
            {d.name}: {d.count} posts ({d.avg_engagement.toLocaleString()} eng)
          </span>
        ))}
      </div>
    </div>
  );
}
