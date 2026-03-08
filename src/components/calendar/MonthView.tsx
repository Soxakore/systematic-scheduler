import { useMemo } from 'react';
import { useAppContext } from '@/components/AppLayout';
import { useEvents, useCalendars, useAllEventTags } from '@/hooks/useData';
import { usePartnerEvents, hexToRgba } from '@/hooks/usePartnerEvents';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Plus, GearSix, Users } from '@phosphor-icons/react';

export default function MonthView() {
  const { currentDate, setCurrentDate, setCurrentView, setShowEventDialog, setSelectedDate, setEditingEventId, searchQuery, selectedTagIds } = useAppContext();
  const { data: calendars } = useCalendars();
  const { data: eventTagsMap } = useAllEventTags();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const { data: events } = useEvents(calendarStart, calendarEnd);
  const partnerEvents = usePartnerEvents(calendarStart, calendarEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let filtered = events;
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
    const m = new Map<string, { color: string }>();
    calendars?.forEach(c => m.set(c.id, { color: c.color }));
    return m;
  }, [calendars]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map(day => {
          const dayEvents = filteredEvents.filter(e => {
            const s = new Date(e.start_time);
            return isSameDay(s, day);
          });
          const dayPartnerEvents = partnerEvents.filter(e => {
            const s = new Date(e.start_time);
            return isSameDay(s, day);
          });
          const allDayEvents = [...dayEvents, ...dayPartnerEvents];

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'border-b border-r p-1 min-h-[80px] cursor-pointer transition-colors cal-hover-bg overflow-hidden',
                !isSameMonth(day, currentDate) && 'opacity-40',
                isToday(day) && 'cal-today-bg',
              )}
              onClick={() => {
                setSelectedDate(day);
                setCurrentDate(day);
                setCurrentView('day');
              }}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-xs w-6 h-6 flex items-center justify-center rounded-full',
                  isToday(day) && 'bg-primary text-primary-foreground font-bold',
                )}>
                  {format(day, 'd')}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  onClick={e => {
                    e.stopPropagation();
                    const d = new Date(day);
                    d.setHours(9, 0, 0, 0);
                    setSelectedDate(d);
                    setEditingEventId(null);
                    setShowEventDialog(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {allDayEvents.slice(0, 3).map(event => {
                  const isPartner = 'isPartner' in event && event.isPartner;
                  const baseColor = calMap.get(event.calendar_id)?.color || '#3B82F6';
                  return (
                    <button
                      key={event.id}
                      className={cn(
                        'w-full text-left text-[11px] leading-tight px-1 py-0.5 rounded truncate',
                        isPartner
                          ? 'border border-dashed text-foreground/80'
                          : 'text-primary-foreground'
                      )}
                      style={{
                        backgroundColor: isPartner ? hexToRgba(baseColor, 0.15) : baseColor,
                        borderColor: isPartner ? hexToRgba(baseColor, 0.5) : undefined,
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        if (!isPartner) {
                          setEditingEventId(event.id);
                          setShowEventDialog(true);
                        }
                      }}
                    >
                      {isPartner && <Users className="inline h-2 w-2 mr-0.5 opacity-60 shrink-0" weight="bold" />}
                      {event.is_system_generated && <GearSix className="inline h-2 w-2 mr-0.5 opacity-70 shrink-0" weight="bold" />}{event.title}
                    </button>
                  );
                })}
                {allDayEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1">+{allDayEvents.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
