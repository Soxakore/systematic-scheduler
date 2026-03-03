import { useMemo } from 'react';
import { useEvents } from '@/hooks/useData';
import { Link } from 'react-router-dom';
import { Sun, Flame, Clock, Brain, Calendar } from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO, differenceInMinutes } from 'date-fns';

export default function MorningBriefingPage() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const { data: todayEvents } = useEvents(todayStart, todayEnd);

  const sortedEvents = useMemo(() => {
    return [...(todayEvents || [])].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [todayEvents]);

  const systemEvents = sortedEvents.filter(e => e.is_system_generated);
  const scheduledMinutes = sortedEvents.reduce((sum, e) => sum + differenceInMinutes(parseISO(e.end_time), parseISO(e.start_time)), 0);
  const freeMinutes = 8 * 60 - scheduledMinutes;

  const now = new Date();
  const nextEvent = sortedEvents.find(e => new Date(e.start_time) > now);
  const timeUntilNext = nextEvent ? differenceInMinutes(parseISO(nextEvent.start_time), now) : null;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Sun className="h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Morning Briefing</h1>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="surface p-4 text-center">
            <Calendar className="h-4 w-4 text-primary mx-auto mb-2" />
            <p className="stat-number">{sortedEvents.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">Events</p>
          </div>
          <div className="surface p-4 text-center">
            <Flame className="h-4 w-4 text-orange-400 mx-auto mb-2" />
            <p className="stat-number">{systemEvents.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">Systems</p>
          </div>
          <div className="surface p-4 text-center">
            <Clock className="h-4 w-4 text-emerald-400 mx-auto mb-2" />
            <p className="stat-number">{Math.max(0, Math.round(freeMinutes / 60))}h</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">Free</p>
          </div>
        </div>

        {/* Next event */}
        {nextEvent && (
          <div className="surface p-4 border-l-2 border-l-primary">
            <p className="text-[11px] text-muted-foreground mb-1">
              Next up{timeUntilNext !== null && ` in ${timeUntilNext} min`}
            </p>
            <p className="text-sm font-medium text-foreground">{nextEvent.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(parseISO(nextEvent.start_time), 'h:mm a')} – {format(parseISO(nextEvent.end_time), 'h:mm a')}
            </p>
          </div>
        )}

        {/* Today's Schedule */}
        <div>
          <p className="section-label flex items-center gap-1.5 mb-3">
            <Clock className="h-3.5 w-3.5" /> Today's Schedule
          </p>
          {sortedEvents.length === 0 ? (
            <div className="surface p-6 text-center">
              <p className="text-sm text-muted-foreground">No events scheduled today.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sortedEvents.map(event => {
                const isPast = new Date(event.end_time) < now;
                return (
                  <div key={event.id} className={`surface-interactive p-3 flex items-center gap-3 ${isPast ? 'opacity-50' : ''}`}>
                    <span className="text-xs text-muted-foreground w-16 shrink-0">
                      {format(parseISO(event.start_time), 'h:mm a')}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      event.is_system_generated ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                    <span className="text-sm flex-1 truncate text-foreground">{event.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {differenceInMinutes(parseISO(event.end_time), parseISO(event.start_time))}m
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/" className="surface-interactive p-3 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Calendar className="h-4 w-4" /> Open Calendar
          </Link>
          <Link to="/dashboard" className="surface-interactive p-3 flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Brain className="h-4 w-4" /> Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
