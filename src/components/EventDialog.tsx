import { useState, useEffect } from 'react';
import { useAppContext } from '@/components/AppLayout';
import { useCalendars, useCreateEvent, useUpdateEvent, useDeleteEvent, useEvents, useTags, useCreateTag, useEventTags, useSetEventTags } from '@/hooks/useData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Trash, Tag, Plus, X } from '@phosphor-icons/react';
import type { CalendarEvent } from '@/types';

const TAG_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export default function EventDialog() {
  const { showEventDialog, setShowEventDialog, selectedDate, selectedEndDate, setSelectedEndDate, editingEventId, setEditingEventId } = useAppContext();
  const { data: calendars } = useCalendars();
  const { data: allEvents } = useEvents();
  const { data: tags } = useTags();
  const { data: existingTagIds } = useEventTags(editingEventId);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createTag = useCreateTag();
  const setEventTags = useSetEventTags();

  const [title, setTitle] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const editingEvent = editingEventId ? allEvents?.find(e => e.id === editingEventId) : null;

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setCalendarId(editingEvent.calendar_id);
      const s = new Date(editingEvent.start_time);
      const e = new Date(editingEvent.end_time);
      setStartDate(s.toISOString().split('T')[0]);
      setStartTime(s.toTimeString().slice(0, 5));
      setEndDate(e.toISOString().split('T')[0]);
      setEndTime(e.toTimeString().slice(0, 5));
      setIsAllDay(editingEvent.is_all_day);
      setLocation(editingEvent.location || '');
      setDescription(editingEvent.description || '');
      setReminderMinutes(editingEvent.reminder_minutes?.toString() || '');
    } else if (selectedDate) {
      setTitle('');
      setCalendarId(calendars?.[0]?.id || '');
      const d = selectedDate;
      setStartDate(d.toISOString().split('T')[0]);
      setStartTime(d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'));
      const end = selectedEndDate || new Date(d.getTime() + 60 * 60 * 1000);
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.getHours().toString().padStart(2, '0') + ':' + end.getMinutes().toString().padStart(2, '0'));
      setIsAllDay(false);
      setLocation('');
      setDescription('');
      setReminderMinutes('');
      setSelectedTagIds([]);
    }
  }, [editingEvent, selectedDate, selectedEndDate, calendars]);

  // Sync existing tag ids when loaded
  useEffect(() => {
    if (existingTagIds) setSelectedTagIds(existingTagIds);
  }, [existingTagIds]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
      setSelectedTagIds(prev => [...prev, tag.id]);
      setNewTagName('');
      setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!calendarId) { toast.error('Select a calendar'); return; }

    const start = isAllDay
      ? new Date(startDate + 'T00:00:00')
      : new Date(startDate + 'T' + startTime);
    const end = isAllDay
      ? new Date(endDate + 'T23:59:59')
      : new Date(endDate + 'T' + endTime);

    if (end < start) { toast.error('End must be after start'); return; }

    const payload: any = {
      title: title.trim(),
      calendar_id: calendarId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      is_all_day: isAllDay,
      location,
      description,
      reminder_minutes: reminderMinutes ? parseInt(reminderMinutes) : null,
    };

    try {
      if (editingEventId) {
        if (editingEvent?.is_system_generated) {
          payload.is_customized = true;
        }
        await updateEvent.mutateAsync({ id: editingEventId, ...payload });
        await setEventTags.mutateAsync({ eventId: editingEventId, tagIds: selectedTagIds });
        toast.success('Event updated');
      } else {
        payload.system_id = null;
        payload.is_system_generated = false;
        payload.is_customized = false;
        payload.system_instance_date = null;
        const created = await createEvent.mutateAsync(payload);
        await setEventTags.mutateAsync({ eventId: created.id, tagIds: selectedTagIds });
        toast.success('Event created');
      }
      handleClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!editingEventId) return;
    try {
      await deleteEvent.mutateAsync(editingEventId);
      toast.success('Event deleted');
      handleClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClose = () => {
    setShowEventDialog(false);
    setEditingEventId(null);
    setSelectedTagIds([]);
  };

  return (
    <Dialog open={showEventDialog} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEventId ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {editingEvent?.is_system_generated && (
            <div className="text-xs px-2 py-1 rounded bg-system-badge/10 text-system-badge border border-system-badge/20">
              Generated by system · {editingEvent.is_customized ? 'Customized' : 'Original'}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Calendar</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger><SelectValue placeholder="Select calendar" /></SelectTrigger>
              <SelectContent>
                {calendars?.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isAllDay} onCheckedChange={setIsAllDay} id="allday" />
            <Label htmlFor="allday">All day</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            {!isAllDay && (
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            {!isAllDay && (
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" rows={3} />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {selectedTagIds.map(id => {
                const tag = tags?.find(t => t.id === id);
                if (!tag) return null;
                return (
                  <Badge key={id} variant="secondary" className="gap-1 text-xs" style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}>
                    {tag.name}
                    <button onClick={() => toggleTag(id)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                  </Badge>
                );
              })}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-xs gap-1 px-2">
                    <Tag className="h-3 w-3" /> Add tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  {tags && tags.length > 0 && (
                    <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          className="w-full text-left flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-accent/50"
                          onClick={() => { toggleTag(tag.id); }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                          <span className="truncate flex-1">{tag.name}</span>
                          {selectedTagIds.includes(tag.id) && <span className="text-primary text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="border-t pt-2 flex gap-1.5">
                    <div className="flex gap-1 items-center">
                      {TAG_COLORS.map(c => (
                        <button
                          key={c}
                          className="w-4 h-4 rounded-full border-2 shrink-0"
                          style={{ backgroundColor: c, borderColor: newTagColor === c ? 'hsl(var(--foreground))' : 'transparent' }}
                          onClick={() => setNewTagColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <Input
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      placeholder="New tag"
                      className="h-7 text-xs"
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateTag(); }}
                    />
                    <Button size="sm" className="h-7 px-2" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reminder (minutes before)</Label>
            <Input type="number" value={reminderMinutes} onChange={e => setReminderMinutes(e.target.value)} placeholder="e.g. 10" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1" disabled={createEvent.isPending || updateEvent.isPending}>
              {editingEventId ? 'Update' : 'Create'}
            </Button>
            {editingEventId && (
              <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleteEvent.isPending}>
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
