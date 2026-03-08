import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAppContext } from '@/components/AppLayout';
import { useEvents, useCalendars, useUpdateEvent, useAllEventTags } from '@/hooks/useData';
import { startOfWeek, endOfWeek, addDays, format, isSameDay, isToday, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { GearSix } from '@phosphor-icons/react';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SNAP_MINUTES = 15;

function snapToGrid(minutes: number) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export default function WeekView() {
  const { currentDate, setShowEventDialog, setSelectedDate, setSelectedEndDate, setEditingEventId, searchQuery, selectedTagIds } = useAppContext();
  const { data: calendars } = useCalendars();
  const updateEvent = useUpdateEvent();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: eventTagsMap } = useAllEventTags();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const { data: events } = useEvents(weekStart, weekEnd);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
    }
  }, []);

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
    const m = new Map<string, string>();
    calendars?.forEach(c => m.set(c.id, c.color));
    return m;
  }, [calendars]);

  const handleCellClick = (day: Date, hour: number) => {
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    setSelectedDate(d);
    setSelectedEndDate(null);
    setEditingEventId(null);
    setShowEventDialog(true);
  };
    setEditingEventId(null);
    setShowEventDialog(true);
  };

  // ── Drag-to-create state ──
  const [dragCreate, setDragCreate] = useState<{
    dayIndex: number;
    startMinutes: number;
    currentMinutes: number;
  } | null>(null);
  const dragCreateRef = useRef(dragCreate);
  dragCreateRef.current = dragCreate;

  const getMinutesFromY = useCallback((clientY: number) => {
    if (!scrollRef.current) return 0;
    const rect = scrollRef.current.getBoundingClientRect();
    const y = clientY - rect.top + scrollRef.current.scrollTop;
    const minutes = (y / HOUR_HEIGHT) * 60;
    return Math.max(0, Math.min(24 * 60, snapToGrid(minutes)));
  }, []);

  const handleGridMouseDown = useCallback((e: React.MouseEvent, dayIndex: number) => {
    // Only left-click on empty area
    if (e.button !== 0) return;
    const minutes = getMinutesFromY(e.clientY);
    setDragCreate({ dayIndex, startMinutes: minutes, currentMinutes: minutes });

    const handleMove = (me: MouseEvent) => {
      const cur = getMinutesFromY(me.clientY);
      setDragCreate(prev => prev ? { ...prev, currentMinutes: cur } : null);
    };

    const handleUp = (ue: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      const state = dragCreateRef.current;
      if (!state) return;

      const minMin = Math.min(state.startMinutes, state.currentMinutes);
      const maxMin = Math.max(state.startMinutes, state.currentMinutes);

      // If drag distance is tiny, treat as click (handled by hour cell onClick)
      if (maxMin - minMin < SNAP_MINUTES) {
        setDragCreate(null);
        return;
      }

      const day = days[state.dayIndex];
      const startDate = new Date(day);
      startDate.setHours(0, minMin, 0, 0);
      const endDate = new Date(day);
      endDate.setHours(0, maxMin, 0, 0);

      setSelectedDate(startDate);
      setSelectedEndDate(endDate);
      setEditingEventId(null);
      setShowEventDialog(true);
      setDragCreate(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [days, getMinutesFromY, setSelectedDate, setEditingEventId, setShowEventDialog]);

  // ── Event drag (reposition) ──
  const dragRef = useRef<{ eventId: string; startY: number; startTop: number; dayIndex: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent, eventId: string, dayIndex: number, top: number) => {
    e.stopPropagation();
    dragRef.current = { eventId, startY: e.clientY, startTop: top, dayIndex };

    const handleMove = (_me: MouseEvent) => {};

    const handleUp = async (ue: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      if (!dragRef.current || !scrollRef.current) return;

      const rect = scrollRef.current.getBoundingClientRect();
      const scrollTop = scrollRef.current.scrollTop;
      const y = ue.clientY - rect.top + scrollTop;
      const dayWidth = (rect.width - 56) / 7;
      const x = ue.clientX - rect.left - 56;
      const newDayIndex = Math.min(6, Math.max(0, Math.floor(x / dayWidth)));

      const minutesFromTop = (y / HOUR_HEIGHT) * 60;
      const snappedMinutes = Math.round(minutesFromTop / 15) * 15;

      const ev = filteredEvents.find(e => e.id === dragRef.current!.eventId);
      if (!ev) return;

      const oldStart = new Date(ev.start_time);
      const duration = differenceInMinutes(new Date(ev.end_time), oldStart);

      const newDay = days[newDayIndex];
      const newStart = new Date(newDay);
      newStart.setHours(0, snappedMinutes, 0, 0);
      const newEnd = new Date(newStart);
      newEnd.setMinutes(newEnd.getMinutes() + duration);

      try {
        await updateEvent.mutateAsync({
          id: ev.id,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
          ...(ev.is_system_generated ? { is_customized: true } : {}),
        });
      } catch {}

      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Current time indicator
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="flex border-b shrink-0">
        <div className="w-14 shrink-0" />
        {days.map(day => (
          <div key={day.toISOString()} className={cn(
            'flex-1 text-center py-2 border-l',
            isToday(day) && 'cal-today-bg'
          )}>
            <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
            <div className={cn(
              'text-sm font-medium w-7 h-7 mx-auto flex items-center justify-center rounded-full',
              isToday(day) && 'bg-primary text-primary-foreground'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin relative">
        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="w-14 shrink-0 relative">
            {HOURS.map(h => (
              <div key={h} className="absolute right-2 text-[10px] text-muted-foreground" style={{ top: h * HOUR_HEIGHT - 6 }}>
                {h === 0 ? '' : format(new Date(0, 0, 0, h), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const dayEvents = filteredEvents.filter(e => {
              const s = new Date(e.start_time);
              return isSameDay(s, day) && !e.is_all_day;
            });

            // Drag-to-create preview for this column
            const dragPreview = dragCreate && dragCreate.dayIndex === dayIndex
              ? (() => {
                  const minMin = Math.min(dragCreate.startMinutes, dragCreate.currentMinutes);
                  const maxMin = Math.max(dragCreate.startMinutes, dragCreate.currentMinutes);
                  if (maxMin - minMin < SNAP_MINUTES) return null;
                  const top = (minMin / 60) * HOUR_HEIGHT;
                  const height = ((maxMin - minMin) / 60) * HOUR_HEIGHT;
                  return { top, height, startMin: minMin, endMin: maxMin };
                })()
              : null;

            return (
              <div
                key={day.toISOString()}
                className="flex-1 relative border-l"
                onMouseDown={e => handleGridMouseDown(e, dayIndex)}
              >
                {/* Hour grid lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t cal-grid-line cursor-crosshair"
                    style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => {
                      if (!dragCreate) handleCellClick(day, h);
                    }}
                  />
                ))}

                {/* Drag-to-create preview */}
                {dragPreview && (
                  <div
                    className="absolute left-0.5 right-1 rounded border-2 border-primary bg-primary/15 z-20 pointer-events-none flex items-start px-1.5 py-0.5"
                    style={{ top: dragPreview.top, height: dragPreview.height }}
                  >
                    <span className="text-[10px] font-medium text-primary">
                      {format(new Date(0, 0, 0, 0, dragPreview.startMin), 'h:mm a')} – {format(new Date(0, 0, 0, 0, dragPreview.endMin), 'h:mm a')}
                    </span>
                  </div>
                )}

                {/* Current time line */}
                {isToday(day) && (
                  <div className="absolute w-full z-20 pointer-events-none" style={{ top: nowTop }}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-cal-current-time -ml-1" />
                      <div className="flex-1 h-0.5 bg-cal-current-time" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {dayEvents.map(event => {
                  const s = new Date(event.start_time);
                  const e = new Date(event.end_time);
                  const startMin = s.getHours() * 60 + s.getMinutes();
                  const duration = differenceInMinutes(e, s);
                  const top = (startMin / 60) * HOUR_HEIGHT;
                  const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);

                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-1 rounded px-1.5 py-0.5 text-[11px] leading-tight overflow-hidden cursor-grab z-10 shadow-sm text-primary-foreground"
                      style={{
                        top,
                        height,
                        backgroundColor: calMap.get(event.calendar_id) || '#3B82F6',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setEditingEventId(event.id);
                        setShowEventDialog(true);
                      }}
                      onMouseDown={e => handleDragStart(e, event.id, dayIndex, top)}
                    >
                      <div className="font-medium truncate">
                        {event.is_system_generated && <GearSix className="inline h-2.5 w-2.5 mr-0.5 opacity-70 shrink-0" weight="bold" />}{event.title}
                      </div>
                      {height > 30 && (
                        <div className="opacity-80 truncate">
                          {format(s, 'h:mm a')} – {format(e, 'h:mm a')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
