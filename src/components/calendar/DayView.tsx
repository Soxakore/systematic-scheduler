import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAppContext } from '@/components/AppLayout';
import { useEvents, useCalendars, useUpdateEvent, useAllEventTags } from '@/hooks/useData';
import { startOfDay, endOfDay, format, isToday, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { GearSix } from '@phosphor-icons/react';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SNAP_MINUTES = 15;

function snapToGrid(minutes: number) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export default function DayView() {
  const { currentDate, setShowEventDialog, setSelectedDate, setSelectedEndDate, setEditingEventId, searchQuery, selectedTagIds } = useAppContext();
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

  // ── Drag-to-create state ──
  const [dragCreate, setDragCreate] = useState<{
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

  const handleGridMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const minutes = getMinutesFromY(e.clientY);
    setDragCreate({ startMinutes: minutes, currentMinutes: minutes });

    const handleMove = (me: MouseEvent) => {
      const cur = getMinutesFromY(me.clientY);
      setDragCreate(prev => prev ? { ...prev, currentMinutes: cur } : null);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      const state = dragCreateRef.current;
      if (!state) return;

      const minMin = Math.min(state.startMinutes, state.currentMinutes);
      const maxMin = Math.max(state.startMinutes, state.currentMinutes);

      if (maxMin - minMin < SNAP_MINUTES) {
        setDragCreate(null);
        return;
      }

      const startDate = new Date(currentDate);
      startDate.setHours(0, minMin, 0, 0);
      const endDate = new Date(currentDate);
      endDate.setHours(0, maxMin, 0, 0);

      setSelectedDate(startDate);
      setEditingEventId(null);
      setShowEventDialog(true);
      setDragCreate(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [currentDate, getMinutesFromY, setSelectedDate, setEditingEventId, setShowEventDialog]);

  // Drag preview calculation
  const dragPreview = dragCreate
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
          <div
            className="flex-1 relative border-l"
            onMouseDown={handleGridMouseDown}
          >
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full border-t cal-grid-line cursor-crosshair"
                style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                onClick={() => {
                  if (!dragCreate) {
                    const d = new Date(currentDate);
                    d.setHours(h, 0, 0, 0);
                    setSelectedDate(d);
                    setEditingEventId(null);
                    setShowEventDialog(true);
                  }
                }}
              />
            ))}

            {/* Drag-to-create preview */}
            {dragPreview && (
              <div
                className="absolute left-1 right-4 rounded-md border-2 border-primary bg-primary/15 z-20 pointer-events-none flex items-start px-2 py-0.5"
                style={{ top: dragPreview.top, height: dragPreview.height }}
              >
                <span className="text-xs font-medium text-primary">
                  {format(new Date(0, 0, 0, 0, dragPreview.startMin), 'h:mm a')} – {format(new Date(0, 0, 0, 0, dragPreview.endMin), 'h:mm a')}
                </span>
              </div>
            )}

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
                  onMouseDown={e => e.stopPropagation()}
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
