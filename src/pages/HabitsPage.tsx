import { useMemo } from 'react';
import { useSystems, useEvents } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Fire, CheckCircle, Lightning, CalendarDots } from '@phosphor-icons/react';
import { startOfDay, endOfDay, subDays, format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { HabitsSkeleton } from '@/components/PageSkeleton';

export default function HabitsPage() {
  const { data: systems, isLoading: loadingSystems } = useSystems();
  const activeSystems = systems?.filter(s => s.is_active) || [];

  // Fetch events for the last 14 days for streak calculation
  const today = new Date();
  const fourteenDaysAgo = subDays(today, 13);
  const { data: recentEvents, isLoading: loadingEvents } = useEvents(startOfDay(fourteenDaysAgo), endOfDay(today));

  if (loadingSystems || loadingEvents) return <HabitsSkeleton />;
  const todayEvents = recentEvents?.filter(e => isSameDay(new Date(e.start_time), today)) || [];
  const systemEvents = todayEvents.filter(e => e.is_system_generated);

  // Calculate streak for each system
  const systemStats = useMemo(() => {
    if (!activeSystems.length || !recentEvents) return [];

    return activeSystems.map(system => {
      const systemEvts = recentEvents.filter(e => e.system_id === system.id);

      // Calculate streak: consecutive days backward from today
      let streak = 0;
      for (let i = 0; i < 14; i++) {
        const day = subDays(today, i);
        const hasEvent = systemEvts.some(e => isSameDay(new Date(e.start_time), day));
        if (hasEvent) streak++;
        else if (i > 0) break; // allow today to be missing (not yet done)
        else break;
      }

      // Last 7 days completion grid
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const day = subDays(today, 6 - i);
        const completed = systemEvts.some(e => isSameDay(new Date(e.start_time), day));
        return { day, completed, isToday: isSameDay(day, today) };
      });

      const todayDone = systemEvts.some(e => isSameDay(new Date(e.start_time), today));
      const completionRate = last7.filter(d => d.completed).length;

      return { system, streak, last7, todayDone, completionRate };
    });
  }, [activeSystems, recentEvents]);

  const totalToday = systemEvents.length;
  const totalActive = activeSystems.length;
  const completedToday = systemStats.filter(s => s.todayDone).length;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="h-8 w-8 rounded-xl bg-orange-400/15 flex items-center justify-center shrink-0">
          <Fire className="h-4 w-4 text-orange-400" weight="duotone" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Habits &amp; Streaks</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{completedToday}/{totalActive}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Done today</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalToday}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Events today</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {systemStats.length > 0 ? Math.max(...systemStats.map(s => s.streak)) : 0}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Best streak</p>
        </Card>
      </div>

      {/* Today's progress */}
      {totalActive > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today's Progress</h2>
            <span className="text-xs text-muted-foreground">{Math.round((completedToday / totalActive) * 100)}%</span>
          </div>
          <Progress value={(completedToday / totalActive) * 100} className="h-2" />
        </div>
      )}

      {/* System cards with streaks */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Systems</h2>
      {activeSystems.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-orange-400/15 flex items-center justify-center mx-auto mb-3">
            <Fire className="h-7 w-7 text-orange-400" weight="duotone" />
          </div>
          <p className="text-muted-foreground">No active systems. Create a system to start tracking habits.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {systemStats.map(({ system, streak, last7, todayDone, completionRate }) => (
            <Card key={system.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  todayDone ? 'bg-green-500/15' : 'bg-orange-400/15'
                )}>
                  {todayDone ? (
                    <CheckCircle className="h-5 w-5 text-green-500" weight="fill" />
                  ) : (
                    <Fire className="h-5 w-5 text-orange-400" weight="duotone" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm">{system.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {system.recurrence_type === 'daily' ? 'Daily' : `${system.recurrence_days?.length || 0} days/week`}
                    {' · '}{system.default_duration_minutes}min
                  </p>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-400/10 shrink-0">
                    <Lightning className="h-3.5 w-3.5 text-orange-400" weight="fill" />
                    <span className="text-xs font-bold text-orange-400">{streak}d</span>
                  </div>
                )}
              </div>

              {/* 7-day completion grid */}
              <div className="flex items-center gap-1.5">
                {last7.map(({ day, completed, isToday: isT }, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className={cn(
                      'w-full aspect-square rounded-lg flex items-center justify-center transition-colors',
                      completed
                        ? 'bg-green-500/20'
                        : isT
                          ? 'bg-muted border border-dashed border-muted-foreground/30'
                          : 'bg-muted/50'
                    )}>
                      {completed && <CheckCircle className="h-3.5 w-3.5 text-green-500" weight="fill" />}
                    </div>
                    <span className={cn(
                      'text-[9px]',
                      isT ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    )}>
                      {format(day, 'EEE').charAt(0)}
                    </span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-1 ml-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{completionRate}/7</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
