import { useMemo } from 'react';
import { useEvents, useSystems, useGoals } from '@/hooks/useData';
import { Link } from 'react-router-dom';
import { Target, Clock, ArrowRight, Calendar, Zap, TrendingUp, Flame, Brain } from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

export default function DashboardPage() {
  const todayStart = startOfDay(new Date());
  const todayEnd   = endOfDay(new Date());
  const { data: todayEvents } = useEvents(todayStart, todayEnd);
  const { data: systems }     = useSystems();
  const { data: goals }       = useGoals();

  const systemEvents  = todayEvents?.filter(e => e.is_system_generated) || [];
  const totalEvents   = todayEvents?.length || 0;
  const activeGoals   = goals?.filter(g => g.status === 'active') || [];

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
    { icon: Calendar, value: totalEvents,       label: 'Events today',  color: 'text-primary'      },
    { icon: Zap,      value: systemEvents.length, label: 'System tasks', color: 'text-orange-400'   },
    { icon: Target,   value: activeGoals.length,  label: 'Active goals', color: 'text-emerald-400'  },
  ];

  const quickLinks = [
    { to: '/goals',     icon: Target,    label: 'Goals',     color: 'text-emerald-400' },
    { to: '/systems',   icon: Zap,       label: 'Systems',   color: 'text-orange-400'  },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics', color: 'text-blue-400'   },
    { to: '/habits',    icon: Flame,     label: 'Habits',    color: 'text-red-400'     },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Greeting */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{greeting()}</h1>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="surface p-4 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-2 ${s.color}`} />
              <p className="stat-number">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="section-label flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Coming Up
            </span>
            <Link
              to="/"
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              View calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="surface p-6 text-center">
              <p className="text-sm text-muted-foreground">No more events today</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map(e => (
                <div key={e.id} className="surface-interactive p-3 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground">{format(parseISO(e.start_time), 'h:mm a')}</p>
                  </div>
                  {e.is_system_generated && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-700/40 text-emerald-400 bg-emerald-900/20 font-semibold shrink-0 uppercase tracking-wide">
                      System
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <p className="section-label mb-3">Quick Access</p>
          <div className="grid grid-cols-4 gap-2">
            {quickLinks.map(item => (
              <Link key={item.to} to={item.to}>
                <div className="surface-interactive p-3 text-center">
                  <item.icon className={`h-4 w-4 mx-auto mb-1.5 ${item.color}`} />
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
