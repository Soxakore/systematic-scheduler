import { useMemo } from 'react';
import { useEvents, useSystems, useGoals } from '@/hooks/useData';
import { Link } from 'react-router-dom';
import { Flame, Brain, Target, Clock, ArrowRight, Calendar, Timer, Zap, TrendingUp } from 'lucide-react';
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
    return (todayEvents || []).filter(e => new Date(e.start_time) > now).slice(0, 4);
  }, [todayEvents]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    {
      icon: Calendar,
      value: totalEvents,
      label: 'Events today',
      color: 'text-primary',
      glow: 'rgba(139,92,246,0.3)',
      bg: 'rgba(139,92,246,0.1)',
    },
    {
      icon: Zap,
      value: systemEvents.length,
      label: 'System tasks',
      color: 'text-orange-400',
      glow: 'rgba(251,146,60,0.3)',
      bg: 'rgba(251,146,60,0.1)',
    },
    {
      icon: Target,
      value: activeGoals.length,
      label: 'Active goals',
      color: 'text-emerald-400',
      glow: 'rgba(34,197,94,0.3)',
      bg: 'rgba(34,197,94,0.1)',
    },
  ];

  const quickLinks = [
    { to: '/goals', icon: Target, label: 'Goals', color: 'text-emerald-400', bg: 'rgba(34,197,94,0.1)' },
    { to: '/systems', icon: Zap, label: 'Systems', color: 'text-orange-400', bg: 'rgba(251,146,60,0.1)' },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics', color: 'text-blue-400', bg: 'rgba(59,130,246,0.1)' },
    { to: '/habits', icon: Flame, label: 'Habits', color: 'text-red-400', bg: 'rgba(239,68,68,0.1)' },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Greeting header */}
        <div className="fade-up">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{greeting()} 👋</h1>
              <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 stagger">
          {stats.map((s, i) => (
            <div
              key={i}
              className="glass-card p-4 text-center glass-hover"
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: s.bg }}
              >
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Focus Timer */}
        <div className="glass-card p-4 fade-up">
          <FocusTimer />
        </div>

        {/* Upcoming events */}
        <div className="fade-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Coming Up
            </h2>
            <Link
              to="/"
              className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
            >
              View calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-sm text-muted-foreground">No more events today</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Great job!</p>
            </div>
          ) : (
            <div className="space-y-2 stagger">
              {upcoming.map(e => (
                <div key={e.id} className="glass-card p-3 flex items-center gap-3 glass-hover">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground">{format(parseISO(e.start_time), 'h:mm a')}</p>
                  </div>
                  {e.is_system_generated && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-semibold shrink-0">
                      SYSTEM
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="fade-up">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Access</h2>
          <div className="grid grid-cols-4 gap-2 stagger">
            {quickLinks.map(item => (
              <Link key={item.to} to={item.to}>
                <div className="glass-card p-3 text-center glass-hover cursor-pointer">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: item.bg }}
                  >
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <p className="text-xs font-medium text-foreground/80">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
