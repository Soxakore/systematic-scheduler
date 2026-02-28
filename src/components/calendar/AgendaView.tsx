import { useMemo } from 'react';
import { useAppContext } from '@/components/AppLayout';
import { useEvents, useCalendars } from '@/hooks/useData';
import { format, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';

export default function AgendaView() {
  const { setShowEventDialog, setEditingEventId, searchQuery } = useAppContext();
  const { data: calendars } = useCalendars();

  const start = startOfDay(new Date());
  const end = addDays(start, 30);
  const { data: events } = useEvents(start, end);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let filtered = events;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [events, searchQuery]);

  const calMap = useMemo(() => {
    const m = new Map<string, { color: string; name: string }>();
    calendars?.forEach(c => m.set(c.id, { color: c.color, name: c.name }));
    return m;
  }, [calendars]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: Date; events: typeof filteredEvents }[] = [];
    let currentDate: string | null = null;

    for (const event of filteredEvents) {
      const d = format(new Date(event.start_time), 'yyyy-MM-dd');
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: new Date(event.start_time), events: [] });
      }
      groups[groups.length - 1].events.push(event);
    }

    return groups;
  }, [filteredEvents]);

  const dateLabel = (d: Date) => {
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEEE, MMMM d');
  };

  if (grouped.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No upcoming events
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      {grouped.map((group, i) => (
        <div key={i} className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2 sticky top-0 bg-background py-1">
            {dateLabel(group.date)}
            <span className="text-muted-foreground font-normal ml-2">{format(group.date, 'MMM d')}</span>
          </h3>
          <div className="space-y-2">
            {group.events.map(event => {
              const s = new Date(event.start_time);
              const e = new Date(event.end_time);
              const cal = calMap.get(event.calendar_id);

              return (
                <button
                  key={event.id}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    setEditingEventId(event.id);
                    setShowEventDialog(true);
                  }}
                >
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: cal?.color || '#3B82F6' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {event.is_system_generated && <span className="text-system-badge mr-1">⚙</span>}
                      {event.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {event.is_all_day ? 'All day' : `${format(s, 'h:mm a')} – ${format(e, 'h:mm a')}`}
                      {cal && <span className="ml-2">· {cal.name}</span>}
                    </div>
                    {event.location && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">📍 {event.location}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
