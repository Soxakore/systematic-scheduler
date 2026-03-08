import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash, Clock } from '@phosphor-icons/react';
import icoFileText from '@/assets/icons/icon-file-text.svg';
import { useEventTemplates, useCreateEventTemplate, useDeleteEventTemplate, useCalendars } from '@/hooks/useData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function TemplatesPage() {
  const { data: templates, isLoading } = useEventTemplates();
  const { data: calendars } = useCalendars();
  const createTemplate = useCreateEventTemplate();
  const deleteTemplate = useDeleteEventTemplate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [isAllDay, setIsAllDay] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createTemplate.mutateAsync({
      name: name.trim(), title: title.trim() || name.trim(), description, duration_minutes: duration,
      location, calendar_id: calendarId, is_all_day: isAllDay,
    });
    setName(''); setTitle(''); setDescription(''); setDuration(60); setLocation(''); setCalendarId(null); setIsAllDay(false);
    setOpen(false);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
          <img src={icoFileText} alt="" width={32} height={32} className="rounded-xl shrink-0" />
          Event Templates
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Template name" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                  <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={5} />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Calendar</Label>
                  <Select value={calendarId || ''} onValueChange={v => setCalendarId(v || null)}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      {calendars?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
              <div className="flex items-center gap-2">
                <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
                <Label className="text-sm">All-day event</Label>
              </div>
              <Button onClick={handleCreate} disabled={!name.trim() || createTemplate.isPending} className="w-full">
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : !templates?.length ? (
        <Card className="p-8 text-center">
          <img src={icoFileText} alt="" width={56} height={56} className="rounded-2xl mx-auto mb-3" />
          <p className="text-muted-foreground">No templates yet. Create one to quickly add recurring event types.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" weight="duotone" />
                    <span>{t.duration_minutes}min</span>
                    {t.is_all_day && <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">All day</span>}
                    {t.location && <span>· {t.location}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTemplate.mutate(t.id)}>
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
