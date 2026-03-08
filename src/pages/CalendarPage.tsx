import { useState } from 'react';
import { useAppContext } from '@/components/AppLayout';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import AgendaView from '@/components/calendar/AgendaView';
import EventDialog from '@/components/EventDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { addMonths, addWeeks, addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types';
export default function CalendarPage() {
  const { currentView, setCurrentView, currentDate, setCurrentDate } = useAppContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const isMobile = useIsMobile();

  const views: { value: ViewType; label: string }[] = [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
    { value: 'agenda', label: 'List' },
  ];

  const navigatePrev = () => {
    if (currentView === 'month') setCurrentDate(addMonths(currentDate, -1));
    else if (currentView === 'week') setCurrentDate(addWeeks(currentDate, -1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const navigateNext = () => {
    if (currentView === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (currentView === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const navigateToday = () => setCurrentDate(new Date());

  const getDateLabel = () => {
    if (currentView === 'month') return format(currentDate, 'MMMM yyyy');
    if (currentView === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return ws.getMonth() === we.getMonth()
        ? `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`
        : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Calendar header with navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 px-2" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-medium" onClick={navigateToday}>
            Today
          </Button>
          <span className="text-sm font-semibold text-foreground ml-1 whitespace-nowrap">
            {getDateLabel()}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {views.map(v => (
            <Button
              key={v.value}
              variant={currentView === v.value ? 'default' : 'ghost'}
              size="sm"
              className="text-xs h-7 px-3"
              onClick={() => setCurrentView(v.value)}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {currentView === 'month' && <MonthView />}
        {currentView === 'week' && <WeekView />}
        {currentView === 'day' && <DayView />}
        {currentView === 'agenda' && <AgendaView />}
      </div>

      <EventDialog />
    </div>
  );
}