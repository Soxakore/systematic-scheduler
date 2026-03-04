import { useSystems, useEvents } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Fire, CheckCircle } from '@phosphor-icons/react';
import { startOfDay, endOfDay } from 'date-fns';

export default function HabitsPage() {
  const { data: systems } = useSystems();
  const activeSystems = systems?.filter(s => s.is_active) || [];

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const { data: todayEvents } = useEvents(todayStart, todayEnd);
  const systemEvents = todayEvents?.filter(e => e.is_system_generated) || [];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6">Habits & Streaks</h1>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Today's Systems</p>
            <p className="text-2xl font-bold text-foreground">{systemEvents.length} events</p>
          </div>
        </div>
      </Card>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Systems</h2>
      {activeSystems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No active systems. Create a system to start tracking habits.</p>
      ) : (
        <div className="space-y-3">
          {activeSystems.map(s => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center gap-3">
                <Fire className="h-5 w-5 text-orange-500" />
                <div>
                  <h3 className="font-medium text-foreground text-sm">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {s.recurrence_type === 'daily' ? 'Daily' : `${s.recurrence_days.length} days/week`}
                    {' · '}{s.default_duration_minutes}min
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
