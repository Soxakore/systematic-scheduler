import { useMemo, useState } from 'react';
import { useTagAnalytics, useDailyScores, useCompletionHeatmap } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, Clock, Tag, TrendingUp, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const { data: tagData } = useTagAnalytics(period);
  const { data: scores } = useDailyScores(period);

  // Tag time breakdown
  const tagEntries = useMemo(() => {
    if (!tagData?.byTag) return [];
    return Array.from(tagData.byTag.entries())
      .map(([id, data]) => ({ id, ...data, hours: Math.round(data.minutes / 60 * 10) / 10 }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [tagData]);

  const totalMinutes = tagEntries.reduce((s, t) => s + t.minutes, 0);

  // Score trend
  const avgScore = useMemo(() => {
    if (!scores || scores.length === 0) return 0;
    return Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length);
  }, [scores]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
        <div className="flex items-center gap-1 border rounded-md p-0.5">
          {[7, 30, 90].map(d => (
            <Button
              key={d}
              variant={period === d ? 'default' : 'ghost'}
              size="sm"
              className="text-xs h-7 px-3"
              onClick={() => setPeriod(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Score overview */}
      {scores && scores.length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Daily Score Trend
          </h3>
          <div className="flex items-end gap-1 h-32">
            {scores.slice(-Math.min(scores.length, period)).map((s, i) => (
              <div
                key={s.date}
                className="flex-1 flex flex-col items-center justify-end"
                title={`${s.date}: ${s.score}`}
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    s.score >= 80 ? 'bg-green-500' : s.score >= 50 ? 'bg-yellow-500' : 'bg-red-400'
                  }`}
                  style={{ height: `${Math.max(4, s.score)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Avg: {avgScore}/100</span>
            <span className="text-xs text-muted-foreground">{period} days</span>
          </div>
        </Card>
      )}

      {/* Tag time breakdown */}
      <Card className="p-4 mb-4">
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Time by Tag
        </h3>
        {tagEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tagged events in this period.</p>
        ) : (
          <div className="space-y-3">
            {tagEntries.map(tag => {
              const pct = totalMinutes > 0 ? (tag.minutes / totalMinutes) * 100 : 0;
              return (
                <div key={tag.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{tag.hours}h ({tag.count} events)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: tag.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Simple pie visualization */}
        {tagEntries.length > 0 && (
          <div className="flex items-center justify-center mt-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0;
                  return tagEntries.map(tag => {
                    const pct = totalMinutes > 0 ? (tag.minutes / totalMinutes) * 100 : 0;
                    const dash = `${pct * 2.51327} ${251.327 - pct * 2.51327}`;
                    const el = (
                      <circle
                        key={tag.id}
                        cx="50" cy="50" r="40" fill="none" strokeWidth="18"
                        stroke={tag.color}
                        strokeDasharray={dash}
                        strokeDashoffset={-offset * 2.51327}
                      />
                    );
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{Math.round(totalMinutes / 60)}h</span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Completion stats */}
      {scores && scores.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Completion Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {scores.reduce((s, d) => s + d.events_completed, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Events completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {scores.reduce((s, d) => s + d.systems_completed, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Systems completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {scores.reduce((s, d) => s + d.focus_minutes, 0)}m
              </p>
              <p className="text-xs text-muted-foreground">Focus time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {scores.reduce((s, d) => s + d.goals_met, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Goals met</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
