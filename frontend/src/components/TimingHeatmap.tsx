interface TimingSlot {
  day: number;
  hour: number;
  count: number;
  avg_engagement: number;
  outliers: number;
  outlier_rate: number;
}

interface BestSlot {
  day: number;
  hour: number;
  count: number;
  avg_engagement: number;
  outliers: number;
  outlier_rate: number;
}

interface Props {
  heatmap: TimingSlot[];
  bestSlots: BestSlot[];
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLabelsFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatHour(h: number): string {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

export default function TimingHeatmap({ heatmap, bestSlots }: Props) {
  // Build a lookup: day-hour → slot
  const lookup: Record<string, TimingSlot> = {};
  for (const s of heatmap) {
    lookup[`${s.day}-${s.hour}`] = s;
  }

  // Find max for color scaling
  const maxEng = Math.max(1, ...heatmap.map((s) => s.avg_engagement));
  const maxCount = Math.max(1, ...heatmap.map((s) => s.count));

  // Show hours 6-23 (most relevant for LinkedIn)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  function getCellColor(slot: TimingSlot | undefined): string {
    if (!slot || slot.count === 0) return '#1a1d27';
    const intensity = slot.avg_engagement / maxEng;
    if (slot.outlier_rate > 0) {
      // Has outliers — orange spectrum
      if (intensity > 0.7) return '#e8935a';
      if (intensity > 0.4) return '#b86d3a';
      return '#5a3d2a';
    }
    // Normal — blue/green spectrum
    if (intensity > 0.7) return '#34d399';
    if (intensity > 0.4) return '#1a7a5a';
    return '#0f3d2e';
  }

  function getCellBorder(slot: TimingSlot | undefined): string {
    if (!slot) return 'transparent';
    if (slot.outlier_rate >= 50) return '#67e8f9';
    return 'transparent';
  }

  // Compute best day and best hour overall
  const dayStats: Record<number, { count: number; totalEng: number; outliers: number }> = {};
  const hourStats: Record<number, { count: number; totalEng: number; outliers: number }> = {};
  for (const s of heatmap) {
    if (!dayStats[s.day]) dayStats[s.day] = { count: 0, totalEng: 0, outliers: 0 };
    dayStats[s.day].count += s.count;
    dayStats[s.day].totalEng += s.avg_engagement * s.count;
    dayStats[s.day].outliers += s.outliers;

    if (!hourStats[s.hour]) hourStats[s.hour] = { count: 0, totalEng: 0, outliers: 0 };
    hourStats[s.hour].count += s.count;
    hourStats[s.hour].totalEng += s.avg_engagement * s.count;
    hourStats[s.hour].outliers += s.outliers;
  }

  const bestDay = Object.entries(dayStats)
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => (b[1].totalEng / b[1].count) - (a[1].totalEng / a[1].count))[0];

  const bestHour = Object.entries(hourStats)
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => (b[1].totalEng / b[1].count) - (a[1].totalEng / a[1].count))[0];

  const bestDayOutlier = Object.entries(dayStats)
    .filter(([, v]) => v.outliers > 0)
    .sort((a, b) => b[1].outliers - a[1].outliers)[0];

  const bestHourOutlier = Object.entries(hourStats)
    .filter(([, v]) => v.outliers > 0)
    .sort((a, b) => b[1].outliers - a[1].outliers)[0];

  return (
    <div className="bg-bg-card rounded-xl p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold mb-1">Optimal Posting Time</h3>
      <p className="text-text-muted text-xs mb-4">
        Day x Hour heatmap (UTC). Orange = has outliers. Green = normal posts only. Brighter = higher engagement.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <p className="text-text-muted text-[10px]">Best Day (Avg Eng)</p>
          <p className="text-text-primary font-bold">
            {bestDay ? dayLabelsFull[parseInt(bestDay[0])] : '--'}
          </p>
          {bestDay && (
            <p className="text-text-muted text-[10px]">
              {Math.round(bestDay[1].totalEng / bestDay[1].count).toLocaleString()} avg
            </p>
          )}
        </div>
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <p className="text-text-muted text-[10px]">Best Hour (Avg Eng)</p>
          <p className="text-text-primary font-bold">
            {bestHour ? formatHour(parseInt(bestHour[0])) : '--'}
          </p>
          {bestHour && (
            <p className="text-text-muted text-[10px]">
              {Math.round(bestHour[1].totalEng / bestHour[1].count).toLocaleString()} avg
            </p>
          )}
        </div>
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <p className="text-accent text-[10px]">Best Day (Outliers)</p>
          <p className="text-accent font-bold">
            {bestDayOutlier ? dayLabelsFull[parseInt(bestDayOutlier[0])] : '--'}
          </p>
          {bestDayOutlier && (
            <p className="text-text-muted text-[10px]">
              {bestDayOutlier[1].outliers} outliers
            </p>
          )}
        </div>
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <p className="text-accent text-[10px]">Best Hour (Outliers)</p>
          <p className="text-accent font-bold">
            {bestHourOutlier ? formatHour(parseInt(bestHourOutlier[0])) : '--'}
          </p>
          {bestHourOutlier && (
            <p className="text-text-muted text-[10px]">
              {bestHourOutlier[1].outliers} outliers
            </p>
          )}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {hours.map((h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-text-muted">
                {h % 3 === 0 ? formatHour(h) : ''}
              </div>
            ))}
          </div>

          {/* Rows by day */}
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <div key={day} className="flex items-center mb-[3px]">
              <div className="w-10 text-[10px] text-text-muted text-right pr-2 shrink-0">
                {dayLabels[day]}
              </div>
              <div className="flex flex-1 gap-[2px]">
                {hours.map((hour) => {
                  const slot = lookup[`${day}-${hour}`];
                  return (
                    <div
                      key={hour}
                      className="flex-1 aspect-square rounded-[3px] transition-colors cursor-default"
                      style={{
                        backgroundColor: getCellColor(slot),
                        boxShadow: getCellBorder(slot) !== 'transparent' ? `inset 0 0 0 1.5px ${getCellBorder(slot)}` : 'none',
                        minHeight: '18px',
                      }}
                      title={
                        slot && slot.count > 0
                          ? `${dayLabelsFull[day]} ${formatHour(hour)}: ${slot.count} posts, ${slot.avg_engagement.toLocaleString()} avg eng, ${slot.outliers} outliers`
                          : `${dayLabelsFull[day]} ${formatHour(hour)}: no posts`
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#0f3d2e' }} />
          <span>Normal (low)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#34d399' }} />
          <span>Normal (high)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#5a3d2a' }} />
          <span>Has outliers (low)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#e8935a' }} />
          <span>Has outliers (high)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: '#1a1d27', border: '1.5px solid #67e8f9' }} />
          <span>50%+ outlier rate</span>
        </div>
      </div>

      {/* Best slots table */}
      {bestSlots.length > 0 && (
        <div className="mt-5">
          <p className="text-text-secondary text-sm font-medium mb-2">Top 5 Time Slots (by avg engagement)</p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {bestSlots.map((s, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-center border ${
                  s.outliers > 0
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-bg-secondary border-border/50'
                }`}
              >
                <p className="font-bold text-text-primary text-sm">
                  {dayLabels[s.day]} {formatHour(s.hour)}
                </p>
                <p className="text-text-muted text-[10px]">
                  {s.avg_engagement.toLocaleString()} avg · {s.count} posts
                </p>
                {s.outliers > 0 && (
                  <p className="text-accent text-[10px] font-medium">{s.outliers} outliers</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
