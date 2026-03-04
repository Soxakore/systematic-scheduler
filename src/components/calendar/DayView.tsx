import { useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '@/components/AppLayout';
import { useEvents, useCalendars, useUpdateEvent, useAllEventTags } from '@/hooks/useData';
import { startOfDay, endOfDay, format, isToday, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { GearSix } from '@phosphor-icons/react';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DayView() {
  const { currentDate, setShowEventDialog, setSelectedDate, setEditingEventId, searchQuery, selectedTagIds } = useAppContext();
  const { data: calendars } = useCalendars();
  const updateEvent = useUpdateEvent();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: eventTagsMap } = useAllEventTags();

  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);
  const { data: events } = useEvents(dayStart, dayEnd);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
  }, []);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let filtered = events.filter(e => !e.is_all_day);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }
    if (selectedTagIds.length > 0 && eventTagsMap) {
      filtered = filtered.filter(e => {
        const eTags = eventTagsMap.get(e.id) || [];
        return selectedTagIds.some(tid => eTags.includes(tid));
      });
    }
    return filtered;
  }, [events, searchQuery, selectedTagIds, eventTagsMap]);

  const calMap = useMemo(() => {
    const m = new Map<string, string>();
    calendars?.forEach(c => m.set(c.id, c.color));
    return m;
  }, [calendars]);

  const now = new Date();
  const nowTop = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_HEIGHT;

  return (
    <div className="h-full flex flex-col">
      <div className="py-3 px-4 border-b text-center shrink-0">
        <div className={cn(
          'inline-flex items-center gap-2 text-lg font-medium',
          isToday(currentDate) && 'text-primary'
        )}>
          {format(currentDate, 'EEEE, MMMM d')}
          {isToday(currentDate) && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Today</span>}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="w-16 shrink-0 relative">
            {HOURS.map(h => (
              <div key={h} className="absolute right-3 text-xs text-muted-foreground" style={{ top: h * HOUR_HEIGHT - 6 }}>
                {h === 0 ? '' : format(new Date(0, 0, 0, h), 'h a')}
              </div>
            ))}
          </div>
          <div className="flex-1 relative border-l">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full border-t cal-grid-line cursor-pointer"
                style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setHours(h, 0, 0, 0);
                  setSelectedDate(d);
                  setEditingEventId(null);
                  setShowEventDialog(true);
                }}
              />
            ))}

            {isToday(currentDate) && (
              <div className="absolute w-full z-20 pointer-events-none" style={{ top: nowTop }}>
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-cal-current-time -ml-1" />
                  <div className="flex-1 h-0.5 bg-cal-current-time" />
                </div>
              </div>
            )}

            {filteredEvents.map(event => {
              const s = new Date(event.start_time);
              const e = new Date(event.end_time);
              const startMin = s.getHours() * 60 + s.getMinutes();
              const duration = differenceInMinutes(e, s);
              const top = (startMin / 60) * HOUR_HEIGHT;
              const height = Math.max((duration / 60) * HOUR_HEIGHT, 24);

              return (
                <div
                  key={event.id}
                  className="absolute left-1 right-4 rounded-md px-2 py-1 text-sm overflow-hidden cursor-pointer z-10 shadow-sm text-primary-foreground"
                  style={{ top, height, backgroundColor: calMap.get(event.calendar_id) || '#3B82F6' }}
                  onClick={e => {
                    e.stopPropagation();
                    setEditingEventId(event.id);
                    setShowEventDialog(true);
                  }}
                >
                  <div className="font-medium truncate">
                    {event.is_system_generated && <GearSix className="inline h-2.5 w-2.5 mr-0.5 opacity-70 shrink-0" weight="bold" />}{event.title}
                  </div>
                  {height > 36 && (
                    <div className="text-xs opacity-80">
                      {format(s, 'h:mm a')} – {format(e, 'h:mm a')}
                    </div>
                  )}
                  {height > 54 && event.location && (
                    <div className="text-xs opacity-70 truncate">{event.location}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
