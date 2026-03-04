import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ChartBar, CalendarBlank, Clock, Target } from '@phosphor-icons/react';
import { useDailyScores, useFocusSessions, useEvents } from '@/hooks/useData';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function AnalyticsPage() {
  const last30 = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: scores } = useDailyScores(last30, today);
  const { data: sessions } = useFocusSessions(100);

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const { data: todayEvents } = useEvents(todayStart, todayEnd);

  const totalFocusMinutes = sessions?.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
  const totalEvents = todayEvents?.length || 0;

  const chartData = useMemo(() => {
    if (!scores) return [];
    return [...scores]
      .sort((a, b) => a.score_date.localeCompare(b.score_date))
      .slice(-14)
      .map(s => ({
        date: format(new Date(s.score_date + 'T00:00:00'), 'MMM d'),
        events: s.total_events,
        focus: s.focus_minutes,
        score: Number(s.score),
      }));
  }, [scores]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <ChartBar className="h-5 w-5 text-primary" /> Analytics
      </h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-3 text-center">
          <CalendarBlank className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{totalEvents}</p>
          <p className="text-xs text-muted-foreground">Today</p>
        </Card>
        <Card className="p-3 text-center">
          <Clock className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{Math.round(totalFocusMinutes / 60)}h</p>
          <p className="text-xs text-muted-foreground">Focus (all)</p>
        </Card>
        <Card className="p-3 text-center">
          <Target className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{scores?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Days tracked</p>
        </Card>
      </div>

      {chartData.length > 0 ? (
        <Card className="p-4 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Events (14-day)</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <ChartBar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No data yet. Analytics will populate as you use the app.</p>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Focus Minutes (14-day)</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="focus" fill="hsl(var(--system-badge))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
