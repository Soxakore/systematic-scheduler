import { useMemo } from 'react';
import { useSystems, useEvents, useCompletionHeatmap, useSystemStreak } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Flame, TrendingUp, CheckCircle2, Calendar } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

function StreakCard({ systemId, name }: { systemId: string; name: string }) {
  const { data: streak } = useSystemStreak(systemId);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground text-sm truncate">{name}</h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold text-foreground">{streak?.current || 0}</span>
              <span className="text-xs text-muted-foreground">current</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold text-muted-foreground">{streak?.longest || 0}</span>
              <span className="text-xs text-muted-foreground">best</span>
            </div>
          </div>
        </div>
        <div className="text-4xl">
          {(streak?.current || 0) >= 7 ? '🔥' : (streak?.current || 0) >= 3 ? '⚡' : '💪'}
        </div>
      </div>
    </Card>
  );
}

function HeatmapGrid() {
  const { data: heatmap } = useCompletionHeatmap();

  const days = useMemo(() => {
    const result: { date: string; level: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const entry = heatmap?.[d];
      let level = 0;
      if (entry) {
        const ratio = entry.completed / entry.total;
        if (ratio >= 0.8) level = 4;
        else if (ratio >= 0.6) level = 3;
        else if (ratio >= 0.3) level = 2;
        else if (ratio > 0) level = 1;
      }
      result.push({ date: d, level });
    }
    return result;
  }, [heatmap]);

  const colors = ['bg-secondary', 'bg-green-200 dark:bg-green-900', 'bg-green-300 dark:bg-green-700', 'bg-green-500 dark:bg-green-500', 'bg-green-700 dark:bg-green-400'];

  // Group into weeks (columns of 7)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <Card className="p-4">
      <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Completion Heatmap (90 days)
      </h3>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(day => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${colors[day.level]}`}
                title={`${day.date}: Level ${day.level}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        {colors.map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}

export default function HabitsPage() {
  const { data: systems } = useSystems();
  const activeSystems = systems?.filter(s => s.is_active && s.system_type === 'routine') || [];

  // Today's events for completion
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const { data: todayEvents } = useEvents(todayStart, todayEnd);
  const systemEvents = todayEvents?.filter(e => e.is_system_generated) || [];
  const completedToday = systemEvents.filter(e => e.is_completed).length;
  const totalToday = systemEvents.length;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Habits & Streaks</h1>
      </div>

      {/* Today's summary */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Today's Progress</p>
            <p className="text-2xl font-bold text-foreground">{completedToday}/{totalToday}</p>
          </div>
          <div className="flex-1" />
          <div className="w-24 h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: totalToday ? `${(completedToday / totalToday) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </Card>

      {/* Heatmap */}
      <div className="mb-4">
        <HeatmapGrid />
      </div>

      {/* System streaks */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Streaks</h2>
      {activeSystems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No active systems. Create a system to start tracking habits.</p>
      ) : (
        <div className="space-y-3">
          {activeSystems.map(s => (
            <StreakCard key={s.id} systemId={s.id} name={s.name} />
          ))}
        </div>
      )}
    </div>
  );
}
