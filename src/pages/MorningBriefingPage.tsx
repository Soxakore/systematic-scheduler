import { useMemo } from 'react';
import { useEvents, useSystems } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sun className="h-6 w-6 text-yellow-500" />
          <h1 className="text-xl font-semibold text-foreground">Morning Briefing</h1>
        </div>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <Card className="p-4 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">At a Glance</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{sortedEvents.length}</p>
            <p className="text-xs text-muted-foreground">Events</p>
          </div>
          <div>
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{systemEvents.length}</p>
            <p className="text-xs text-muted-foreground">Systems</p>
          </div>
          <div>
            <Clock className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{Math.max(0, Math.round(freeMinutes / 60))}h</p>
            <p className="text-xs text-muted-foreground">Free</p>
          </div>
        </div>
      </Card>

      {nextEvent && (
        <Card className="p-4 mb-4 border-l-4 border-l-primary">
          <p className="text-xs text-muted-foreground mb-1">Next up {timeUntilNext !== null && `in ${timeUntilNext} min`}</p>
          <h3 className="font-medium text-foreground">{nextEvent.title}</h3>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(nextEvent.start_time), 'h:mm a')} – {format(parseISO(nextEvent.end_time), 'h:mm a')}
          </p>
        </Card>
      )}

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today's Schedule</h2>
        {sortedEvents.length === 0 ? (
          <Card className="p-4 text-center text-sm text-muted-foreground">No events scheduled today.</Card>
        ) : (
          <div className="space-y-1">
            {sortedEvents.map(event => {
              const isPast = new Date(event.end_time) < now;
              return (
                <div key={event.id} className={`flex items-center gap-3 py-2 px-3 rounded-md ${isPast ? 'opacity-50' : ''}`}>
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {format(parseISO(event.start_time), 'h:mm a')}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    event.is_system_generated ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                  <span className="text-sm flex-1 truncate">{event.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {differenceInMinutes(parseISO(event.end_time), parseISO(event.start_time))}m
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <Link to="/" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Calendar className="h-4 w-4" /> Open Calendar
          </Button>
        </Link>
        <Link to="/dashboard" className="flex-1">
          <Button className="w-full gap-2">
            <Brain className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
