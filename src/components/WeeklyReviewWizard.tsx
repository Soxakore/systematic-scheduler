import { useState } from 'react';
import { useCalendars, useCreateSystem, useGenerateSystemEvents } from '@/hooks/useData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, ChevronRight, CalendarDays, Clock, ListChecks, Sparkles } from 'lucide-react';
import { WEEKLY_REVIEW_DEFAULT_CHECKLIST } from '@/types';
import type { ChecklistItem, System } from '@/types';

const DAY_OPTIONS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete?: () => void;
}

export default function WeeklyReviewWizard({ open, onOpenChange, onComplete }: Props) {
  const { data: calendars } = useCalendars();
  const createSystem = useCreateSystem();
  const generateEvents = useGenerateSystemEvents();

  const [step, setStep] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState('0'); // Sunday
  const [startTime, setStartTime] = useState('18:00'); // evening
  const [duration, setDuration] = useState('45');
  const [calendarId, setCalendarId] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    WEEKLY_REVIEW_DEFAULT_CHECKLIST.map(item => ({ ...item }))
  );
  const [newItemText, setNewItemText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Set default calendar when loaded
  if (!calendarId && calendars?.length) {
    setCalendarId(calendars[0].id);
  }

  const updateItem = (id: string, text: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, text } : item));
  };

  const removeItem = (id: string) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    setChecklistItems(prev => [
      ...prev,
      { id: `wr-custom-${Date.now()}`, text: newItemText.trim(), completed: false },
    ]);
    setNewItemText('');
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const systemPayload: Omit<System, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        name: 'Weekly Review',
        system_type: 'weekly_review',
        calendar_id: calendarId,
        default_duration_minutes: parseInt(duration),
        default_start_time: startTime,
        recurrence_type: 'weekly',
        recurrence_days: [parseInt(dayOfWeek)],
        is_active: true,
        checklist_items: checklistItems,
        time_window: 'evening',
        generation_horizon_days: 84, // ~12 weeks
      };

      const created = await createSystem.mutateAsync(systemPayload);

      // Generate events using the created system
      const fullSystem: System = {
        ...(created as any),
        system_type: 'weekly_review',
        checklist_items: checklistItems,
        recurrence_days: [parseInt(dayOfWeek)],
      };
      await generateEvents.mutateAsync(fullSystem);

      toast.success('Weekly Review set up! Events generated for the next 12 weeks.');
      onOpenChange(false);
      onComplete?.();
      // Reset wizard
      setStep(1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create weekly review');
    } finally {
      setIsCreating(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            step >= s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          }`}>
            {step > s ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Set Up Weekly Review
          </DialogTitle>
        </DialogHeader>

        {stepIndicator}

        {/* Step 1: Day & Time */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose when you want to do your weekly review. Most people prefer Sunday evening.
            </p>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Day of week
              </Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Start time
                </Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Calendar */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Which calendar should your weekly review events appear in?
            </p>
            <div className="space-y-2">
              {calendars?.map(cal => (
                <Card
                  key={cal.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    calendarId === cal.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setCalendarId(cal.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: cal.color }} />
                    <span className="font-medium text-sm">{cal.name}</span>
                    {calendarId === cal.id && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Checklist */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Customize your review checklist. You can always edit this later.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checklistItems.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-2.5 w-4 text-right shrink-0">{idx + 1}.</span>
                  <Input
                    value={item.text}
                    onChange={e => updateItem(item.id, e.target.value)}
                    className="text-sm h-9"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                placeholder="Add a checklist item…"
                className="text-sm h-9"
                onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
              />
              <Button size="sm" className="h-9" onClick={addItem} disabled={!newItemText.trim()}>Add</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={isCreating || checklistItems.length === 0}
              >
                {isCreating ? 'Setting up…' : 'Activate Weekly Review'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
