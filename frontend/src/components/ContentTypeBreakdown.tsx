import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TypeCount {
  content_type: string;
  count: string;
}

interface Props {
  all: TypeCount[];
  outliers: TypeCount[];
}

const COLORS = ['#e8935a', '#6366f1', '#34d399', '#f87171', '#a78bfa', '#fbbf24', '#38bdf8'];

const typeLabels: Record<string, string> = {
  text_only: 'Text',
  image: 'Image',
  carousel: 'Carousel',
  video: 'Video',
  poll: 'Poll',
  article: 'Article',
  document: 'Document',
};

export default function ContentTypeBreakdown({ all, outliers }: Props) {
  const allData = all.map((d) => ({ name: typeLabels[d.content_type] || d.content_type, value: parseInt(d.count, 10) }));
  const outlierData = outliers.map((d) => ({ name: typeLabels[d.content_type] || d.content_type, value: parseInt(d.count, 10) }));

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Content Type Distribution</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-text-secondary text-sm mb-2 text-center">All Posts</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={allData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {allData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#222639', border: '1px solid #2e3348', borderRadius: '8px', color: '#e8eaf0', fontSize: '13px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-text-secondary text-sm mb-2 text-center">Outliers Only</p>
          {outlierData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={outlierData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {outlierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#222639', border: '1px solid #2e3348', borderRadius: '8px', color: '#e8eaf0', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">No outliers yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
