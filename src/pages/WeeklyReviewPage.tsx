import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Calendar, Clock, Flame, Target, CheckCircle2 } from 'lucide-react';
import { useEvents, useSystems, useGoals, useFocusSessions } from '@/hooks/useData';
import { format, startOfWeek, endOfWeek, subWeeks, differenceInMinutes, parseISO } from 'date-fns';

export default function WeeklyReviewPage() {
  const now = new Date();
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const { data: events } = useEvents(lastWeekStart, lastWeekEnd);
  const { data: systems } = useSystems();
  const { data: goals } = useGoals();
  const { data: sessions } = useFocusSessions(100);

  const stats = useMemo(() => {
    const weekEvents = events || [];
    const systemEvents = weekEvents.filter(e => e.is_system_generated);
    const totalMinutes = weekEvents.reduce((sum, e) =>
      sum + differenceInMinutes(parseISO(e.end_time), parseISO(e.start_time)), 0);
    const weekSessions = (sessions || []).filter(s => {
      const d = new Date(s.started_at);
      return s.status === 'completed' && d >= lastWeekStart && d <= lastWeekEnd;
    });
    const focusMinutes = weekSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    return {
      totalEvents: weekEvents.length,
      systemEvents: systemEvents.length,
      totalMinutes,
      focusMinutes,
      activeSystems: systems?.filter(s => s.is_active).length || 0,
      activeGoals: goals?.filter(g => g.status === 'active').length || 0,
    };
  }, [events, systems, goals, sessions]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> Weekly Review
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {format(lastWeekStart, 'MMM d')} – {format(lastWeekEnd, 'MMM d, yyyy')}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4 text-center">
          <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.totalEvents}</p>
          <p className="text-xs text-muted-foreground">Events</p>
        </Card>
        <Card className="p-4 text-center">
          <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.systemEvents}</p>
          <p className="text-xs text-muted-foreground">System Events</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{Math.round(stats.totalMinutes / 60)}h</p>
          <p className="text-xs text-muted-foreground">Scheduled</p>
        </Card>
        <Card className="p-4 text-center">
          <Target className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{Math.round(stats.focusMinutes / 60)}h</p>
          <p className="text-xs text-muted-foreground">Focus Time</p>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-foreground">{stats.activeSystems} active systems running</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-foreground">{stats.activeGoals} active goals in progress</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Insights</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          {stats.systemEvents > 0 && stats.totalEvents > 0 && (
            <p>📊 {Math.round((stats.systemEvents / stats.totalEvents) * 100)}% of your events came from systems.</p>
          )}
          {stats.focusMinutes > 0 && (
            <p>🎯 You logged {stats.focusMinutes} minutes of focused work.</p>
          )}
          {stats.totalEvents === 0 && <p>📋 No events tracked last week. Try scheduling more activities!</p>}
        </div>
      </Card>
    </div>
  );
}
