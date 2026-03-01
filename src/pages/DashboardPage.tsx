import { useMemo } from 'react';
import { useEvents, useSystems, useGoals } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Flame, Brain, Target, Clock, ArrowRight, Calendar, Timer } from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import FocusTimer from '@/components/FocusTimer';

export default function DashboardPage() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const { data: todayEvents } = useEvents(todayStart, todayEnd);
  const { data: systems } = useSystems();
  const { data: goals } = useGoals();

  const systemEvents = todayEvents?.filter(e => e.is_system_generated) || [];
  const totalEvents = todayEvents?.length || 0;
  const activeGoals = goals?.filter(g => g.status === 'active') || [];

  const upcoming = useMemo(() => {
    const now = new Date();
    return (todayEvents || []).filter(e => new Date(e.start_time) > now).slice(0, 3);
  }, [todayEvents]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{greeting()} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-3 text-center">
          <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{totalEvents}</p>
          <p className="text-xs text-muted-foreground">Events</p>
        </Card>
        <Card className="p-3 text-center">
          <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{systemEvents.length}</p>
          <p className="text-xs text-muted-foreground">Systems</p>
        </Card>
        <Card className="p-3 text-center">
          <Target className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{activeGoals.length}</p>
          <p className="text-xs text-muted-foreground">Goals</p>
        </Card>
      </div>

      <FocusTimer />

      <div className="mt-6 mb-6">
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">System</span>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link to="/goals">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer text-center">
            <Target className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Goals</p>
          </Card>
        </Link>
        <Link to="/systems">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer text-center">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Systems</p>
          </Card>
        </Link>
        <Link to="/analytics">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer text-center">
            <Brain className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Analytics</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
