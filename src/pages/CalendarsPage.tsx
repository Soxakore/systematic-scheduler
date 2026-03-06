import { useState } from 'react';
import { useCalendars, useCreateCalendar, useUpdateCalendar, useDeleteCalendar } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, PencilSimple, Trash, CalendarBlank } from '@phosphor-icons/react';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'];

export default function CalendarsPage() {
  const { data: calendars } = useCalendars();
  const createCalendar = useCreateCalendar();
  const updateCalendar = useUpdateCalendar();
  const deleteCalendar = useDeleteCalendar();

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const openNew = () => { setEditingId(null); setName(''); setColor(COLORS[0]); setShowDialog(true); };
  const openEdit = (cal: { id: string; name: string; color: string }) => {
    setEditingId(cal.id); setName(cal.name); setColor(cal.color); setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    try {
      if (editingId) {
        await updateCalendar.mutateAsync({ id: editingId, name: name.trim(), color });
        toast.success('Calendar updated');
      } else {
        await createCalendar.mutateAsync({ name: name.trim(), color });
        toast.success('Calendar created');
      }
      setShowDialog(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <CalendarBlank className="h-4 w-4 text-primary" weight="duotone" />
          </div>
          Calendars
        </h1>
        <Button onClick={openNew} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
      </div>
      <div className="space-y-2">
        {calendars?.map(cal => (
          <Card key={cal.id} className="p-3 flex items-center gap-3">
            <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: cal.color }} />
            <span className="flex-1 text-sm font-medium text-foreground">{cal.name}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cal)}>
              <PencilSimple className="h-3.5 w-3.5" weight="bold" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
              if ((calendars?.length || 0) <= 1) { toast.error("Can't delete last calendar"); return; }
              await deleteCalendar.mutateAsync(cal.id);
              toast.success('Deleted');
            }}>
              <Trash className="h-3.5 w-3.5" weight="bold" />
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Calendar' : 'New Calendar'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Work" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
            <div className="flex gap-2 items-center flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
                <label
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${!COLORS.includes(color) ? 'border-foreground scale-110' : 'border-muted-foreground/30'}`}
                  style={{ background: !COLORS.includes(color) ? color : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                  title="Pick custom color"
                >
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">{editingId ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
