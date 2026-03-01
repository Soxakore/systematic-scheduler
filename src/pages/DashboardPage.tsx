import { useMemo } from 'react';
import { useEvents, useSystems, useGoals, useGoalProgress, useDailyScores, useTodayFocusMinutes, useCompletionHeatmap } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trophy, Flame, Brain, Target, TrendingUp, CheckCircle2, Clock, Sparkles, ArrowRight, Sun, Calendar } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, isToday, isTomorrow, parseISO } from 'date-fns';

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const color = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-400';
  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="40" fill="none" strokeWidth="6" className="stroke-secondary" />
        <circle
          cx="48" cy="48" r="40" fill="none" strokeWidth="6"
          className={color}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference * (1 - score / 100),
            strokeLinecap: 'round',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: any }) {
  const { data: progress } = useGoalProgress(goal);
  const pct = Math.min(100, ((progress || 0) / goal.target_count) * 100);
  return (
    <div className="flex items-center gap-3 py-2">
      <Target className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{goal.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{progress || 0}/{goal.target_count}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const { data: todayEvents } = useEvents(todayStart, todayEnd);
  const { data: systems } = useSystems();
  const { data: goals } = useGoals();
  const focusMinutes = useTodayFocusMinutes();
  const { data: scores } = useDailyScores(7);

  const systemEvents = todayEvents?.filter(e => e.is_system_generated) || [];
  const completedSystems = systemEvents.filter(e => e.is_completed).length;
  const totalEvents = todayEvents?.length || 0;
  const completedEvents = todayEvents?.filter(e => e.is_completed).length || 0;

  // Calculate today's score
  const todayScore = useMemo(() => {
    if (totalEvents === 0) return 0;
    const completionRate = completedEvents / totalEvents;
    const systemRate = systemEvents.length > 0 ? completedSystems / systemEvents.length : 0;
    const focusBonus = Math.min(focusMinutes / 120, 1); // max bonus at 2 hours
    const activeGoals = goals?.filter(g => g.is_active) || [];
    const goalRate = activeGoals.length > 0 ? 0.5 : 0; // simplified

    return Math.round((completionRate * 40 + systemRate * 30 + focusBonus * 20 + goalRate * 10));
  }, [totalEvents, completedEvents, completedSystems, systemEvents.length, focusMinutes, goals]);

  // Upcoming events (next 3)
  const upcoming = useMemo(() => {
    const now = new Date();
    return (todayEvents || [])
      .filter(e => new Date(e.start_time) > now && !e.is_completed && !e.skipped)
      .slice(0, 3);
  }, [todayEvents]);

  // Weekly trend
  const weekTrend = useMemo(() => {
    if (!scores || scores.length < 2) return 0;
    const recent = scores.slice(-3);
    const avg = recent.reduce((s, d) => s + d.score, 0) / recent.length;
    const older = scores.slice(0, Math.max(1, scores.length - 3));
    const oldAvg = older.reduce((s, d) => s + d.score, 0) / older.length;
    return Math.round(avg - oldAvg);
  }, [scores]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      {/* Greeting + Score */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">{greeting()} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <ScoreRing score={todayScore} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="p-3 text-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{completedEvents}/{totalEvents}</p>
          <p className="text-xs text-muted-foreground">Events</p>
        </Card>
        <Card className="p-3 text-center">
          <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{completedSystems}/{systemEvents.length}</p>
          <p className="text-xs text-muted-foreground">Systems</p>
        </Card>
        <Card className="p-3 text-center">
          <Brain className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{focusMinutes}m</p>
          <p className="text-xs text-muted-foreground">Focus</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${weekTrend >= 0 ? 'text-green-500' : 'text-red-400'}`} />
          <p className="text-2xl font-bold">{weekTrend >= 0 ? '+' : ''}{weekTrend}</p>
          <p className="text-xs text-muted-foreground">Trend</p>
        </Card>
      </div>

      {/* Upcoming events */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Coming Up</h2>
          <Link to="/" className="text-xs text-primary hover:underline flex items-center gap-1">
            Calendar <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <Card className="p-4 text-center text-sm text-muted-foreground">
            No more events today. Great job! 🎉
          </Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map(e => (
              <Card key={e.id} className="p-3 flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(e.start_time), 'h:mm a')}</p>
                </div>
                {e.is_system_generated && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-system-badge text-system-badge-foreground font-medium">System</span>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Goals */}
      {goals && goals.filter(g => g.is_active).length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Goals</h2>
            <Link to="/goals" className="text-xs text-primary hover:underline flex items-center gap-1">
              All goals <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="p-4">
            {goals.filter(g => g.is_active).slice(0, 3).map(g => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/habits">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer text-center">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Habits</p>
          </Card>
        </Link>
        <Link to="/analytics">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer text-center">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Analytics</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
