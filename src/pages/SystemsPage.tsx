import { useState } from 'react';
import { useSystems, useCalendars, useCreateSystem, useUpdateSystem, useDeleteSystem, useGenerateSystemEvents, useDeleteFutureSystemEvents } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, PencilSimple, Trash, Lightning, ProhibitInset, Sparkle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { System } from '@/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SystemsPage() {
  const { data: systems, isLoading } = useSystems();
  const { data: calendars } = useCalendars();
  const createSystem = useCreateSystem();
  const updateSystem = useUpdateSystem();
  const deleteSystem = useDeleteSystem();
  const generateEvents = useGenerateSystemEvents();
  const deleteFutureEvents = useDeleteFutureSystemEvents();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<System | null>(null);
  const [name, setName] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [duration, setDuration] = useState('30');
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('09:00');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState<string | null>(null);

  const routineSystems = systems;
  const hasWeeklyReview = false;

  const openNew = () => {
    setEditing(null);
    setName('');
    setCalendarId(calendars?.[0]?.id || '');
    setDuration('30');
    setRecurrenceType('daily');
    setRecurrenceDays([1, 2, 3, 4, 5]);
    setStartTime('09:00');
    setShowDialog(true);
  };

  const openEdit = (s: System) => {
    setEditing(s);
    setName(s.name);
    setCalendarId(s.calendar_id);
    setDuration(s.default_duration_minutes.toString());
    setRecurrenceType(s.recurrence_type);
    setRecurrenceDays(s.recurrence_days || []);
    setStartTime(s.default_start_time || '09:00');
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    const payload: any = {
      name: name.trim(),
      calendar_id: calendarId,
      default_duration_minutes: parseInt(duration),
      recurrence_type: recurrenceType,
      recurrence_days: recurrenceType === 'daily' ? [] : recurrenceDays,
      default_start_time: startTime,
      checklist_items: editing?.checklist_items || [],
      is_active: editing?.is_active || false,
      time_window: 'morning',
      generation_horizon_days: 14,
    };

    try {
      if (editing) {
        await updateSystem.mutateAsync({ id: editing.id, ...payload });
        toast.success('System updated');
      } else {
        await createSystem.mutateAsync(payload);
        toast.success('System created');
      }
      setShowDialog(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (system: System) => {
    if (system.is_active) {
      setShowDeactivateDialog(system.id);
      return;
    }
    try {
      await updateSystem.mutateAsync({ id: system.id, is_active: true } as any);
      await generateEvents.mutateAsync({ ...system, is_active: true });
      toast.success('System activated & events generated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeactivate = async (removeFuture: boolean) => {
    if (!showDeactivateDialog) return;
    try {
      await updateSystem.mutateAsync({ id: showDeactivateDialog, is_active: false } as any);
      if (removeFuture) {
        await deleteFutureEvents.mutateAsync(showDeactivateDialog);
      }
      toast.success('System deactivated');
    } catch (err: any) {
      toast.error(err.message);
    }
    setShowDeactivateDialog(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSystem.mutateAsync(id);
      toast.success('System deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleDay = (day: number) => {
    setRecurrenceDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Systems</h1>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New System
        </Button>
      </div>

      {/* Weekly Review link */}
      {hasWeeklyReview && (
        <Link to="/review" className="block mb-4">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">Weekly Review</h3>
                <p className="text-xs text-muted-foreground">Managed on the Review page</p>
              </div>
            </div>
          </Card>
        </Link>
      )}

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Loading…</div>
      ) : routineSystems?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No systems yet. Create a recurring routine to auto-populate your calendar.</p>
          <Button onClick={openNew}>Create your first system</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {routineSystems?.map(system => (
            <Card key={system.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{system.name}</h3>
                    {system.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-system-badge text-system-badge-foreground font-medium">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {system.recurrence_type === 'daily' ? 'Daily' : `${system.recurrence_days.map(d => DAY_NAMES[d]).join(', ')}`}
                    {' · '}{system.default_duration_minutes}min
                    {' · '}{system.default_start_time}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(system)}>
                    {system.is_active ? <ProhibitInset className="h-4 w-4" /> : <Lightning className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(system)}>
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(system.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit System' : 'New System'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Planning" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Calendar</Label>
              <Select value={calendarId} onValueChange={setCalendarId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {calendars?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Recurrence</Label>
              <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (select days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recurrenceType !== 'daily' && (
              <div className="flex gap-1.5">
                {DAY_NAMES.map((d, i) => (
                  <button
                    key={i}
                    className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
                      recurrenceDays.includes(i) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}
                    onClick={() => toggleDay(i)}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>
            )}
            <Button onClick={handleSave} className="w-full">
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate dialog */}
      <Dialog open={!!showDeactivateDialog} onOpenChange={() => setShowDeactivateDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deactivate System</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            What should happen to future generated events?
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => handleDeactivate(false)}>
              Keep future events
            </Button>
            <Button variant="destructive" onClick={() => handleDeactivate(true)}>
              Remove future generated events
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
