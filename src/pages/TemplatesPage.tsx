import { useState } from 'react';
import { useEventTemplates, useCreateEventTemplate, useDeleteEventTemplate, useIncrementTemplateUse, useCalendars, useCreateEvent } from '@/hooks/useData';
import { useAppContext } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, Star, Clock, Zap } from 'lucide-react';
import { addMinutes, format } from 'date-fns';
import type { EventTemplate } from '@/types';

export default function TemplatesPage() {
  const { data: templates, isLoading } = useEventTemplates();
  const { data: calendars } = useCalendars();
  const createTemplate = useCreateEventTemplate();
  const deleteTemplate = useDeleteEventTemplate();
  const incrementUse = useIncrementTemplateUse();
  const createEvent = useCreateEvent();
  const { setShowEventDialog } = useAppContext();

  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [calendarId, setCalendarId] = useState('');

  const openNew = () => {
    setName('');
    setTitle('');
    setDescription('');
    setDuration('30');
    setCalendarId(calendars?.[0]?.id || '');
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !title.trim()) { toast.error('Name and title required'); return; }
    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        title: title.trim(),
        description,
        location: '',
        duration_minutes: parseInt(duration),
        calendar_id: calendarId || null,
        tag_ids: [],
        is_favorite: false,
      });
      toast.success('Template created');
      setShowDialog(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleQuickCreate = async (tpl: EventTemplate) => {
    try {
      const now = new Date();
      // Round to next 15-min slot
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
      await createEvent.mutateAsync({
        calendar_id: tpl.calendar_id || calendars?.[0]?.id || '',
        system_id: null,
        title: tpl.title,
        description: tpl.description,
        location: tpl.location,
        start_time: now.toISOString(),
        end_time: addMinutes(now, tpl.duration_minutes).toISOString(),
        is_all_day: false,
        is_system_generated: false,
        is_customized: false,
        is_completed: false,
        completed_at: null,
        skipped: false,
        skip_reason: null,
        system_instance_date: null,
        reminder_minutes: null,
      });
      await incrementUse.mutateAsync(tpl.id);
      toast.success(`"${tpl.title}" scheduled for ${format(now, 'h:mm a')}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Template deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Event Templates</h1>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Loading…</div>
      ) : !templates || templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Save event templates for one-tap scheduling.</p>
          <Button onClick={openNew}>Create your first template</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(tpl => (
            <Card key={tpl.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{tpl.name}</h3>
                    {tpl.is_favorite && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    "{tpl.title}" · <Clock className="h-3 w-3 inline" /> {tpl.duration_minutes}min
                    {tpl.use_count > 0 && <> · Used {tpl.use_count}×</>}
                  </p>
                  {tpl.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{tpl.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="default" size="sm" className="gap-1" onClick={() => handleQuickCreate(tpl)}>
                    <Zap className="h-3.5 w-3.5" /> Schedule
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(tpl.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Template Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quick Standup" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Event Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Team Standup" />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Meeting agenda..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
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
            </div>
            <Button onClick={handleSave} className="w-full">Create Template</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
