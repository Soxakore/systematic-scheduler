import { useAppContext } from '@/components/AppLayout';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import AgendaView from '@/components/calendar/AgendaView';
import EventDialog from '@/components/EventDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ViewType } from '@/types';

export default function CalendarPage() {
  const { currentView, setCurrentView } = useAppContext();
  const isMobile = useIsMobile();

  const views: { value: ViewType; label: string }[] = [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
    { value: 'agenda', label: 'List' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Desktop view switcher */}
      {!isMobile && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-border">
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
      )}

      {/* Mobile view switcher */}
      {isMobile && (
        <div className="flex items-center gap-1 p-2 border-b overflow-x-auto">
          {views.map(v => (
            <Button
              key={v.value}
              variant={currentView === v.value ? 'default' : 'ghost'}
              size="sm"
              className="text-xs h-7 px-3 shrink-0"
              onClick={() => setCurrentView(v.value)}
            >
              {v.label}
            </Button>
          ))}
        </div>
      )}

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
