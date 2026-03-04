import { useMemo } from 'react';
import { useEvents } from '@/hooks/useData';
import { Link } from 'react-router-dom';
import { SunHorizon, Fire, Clock, Brain, CalendarBlank } from '@phosphor-icons/react';
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
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <SunHorizon className="h-5 w-5 text-orange-400" weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>Morning Briefing</h1>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="surface p-5 text-center">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
              <CalendarBlank className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <p className="stat-number">{sortedEvents.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">Events</p>
          </div>
          <div className="surface p-5 text-center">
            <div className="h-10 w-10 rounded-xl bg-orange-400/15 flex items-center justify-center mx-auto mb-3">
              <Fire className="h-5 w-5 text-orange-400" weight="duotone" />
            </div>
            <p className="stat-number">{systemEvents.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">Systems</p>
          </div>
          <div className="surface p-5 text-center">
            <div className="h-10 w-10 rounded-xl bg-emerald-400/15 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-5 w-5 text-emerald-400" weight="duotone" />
            </div>
            <p className="stat-number">{Math.max(0, Math.round(freeMinutes / 60))}h</p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">Free</p>
          </div>
        </div>

        {/* Next event */}
        {nextEvent && (
          <div className="surface p-4 border-l-2 border-l-primary">
            <p className="text-[11px] text-muted-foreground mb-1">
              Next up{timeUntilNext !== null && ` in ${timeUntilNext} min`}
            </p>
            <p className="text-[15px] font-medium text-foreground" style={{ letterSpacing: '-0.01em' }}>{nextEvent.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(parseISO(nextEvent.start_time), 'h:mm a')} – {format(parseISO(nextEvent.end_time), 'h:mm a')}
            </p>
          </div>
        )}

        {/* Today's Schedule */}
        <div>
          <p className="section-label flex items-center gap-1.5 mb-3">
            <Clock className="h-3.5 w-3.5" weight="duotone" /> Today's Schedule
          </p>
          {sortedEvents.length === 0 ? (
            <div className="surface p-8 text-center">
              <p className="text-sm text-muted-foreground">No events scheduled today.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEvents.map(event => {
                const isPast = new Date(event.end_time) < now;
                return (
                  <div key={event.id} className={`surface-interactive p-3.5 flex items-center gap-3 ${isPast ? 'opacity-40' : ''}`}>
                    <span className="text-xs text-muted-foreground w-16 shrink-0 font-medium">
                      {format(parseISO(event.start_time), 'h:mm a')}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      event.is_system_generated ? 'bg-primary' : 'bg-muted-foreground/50'
                    }`} />
                    <span className="text-[13px] flex-1 truncate text-foreground">{event.title}</span>
                    <span className="text-[11px] text-muted-foreground">
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
          <Link to="/" className="surface-interactive p-4 flex items-center justify-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground">
            <CalendarBlank className="h-4 w-4" weight="duotone" /> Open Calendar
          </Link>
          <Link to="/dashboard" className="surface-interactive p-4 flex items-center justify-center gap-2 text-[13px] font-medium text-primary">
            <Brain className="h-4 w-4" weight="duotone" /> Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
