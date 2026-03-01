import { useState } from 'react';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useGoalProgress, useSystems, useTags } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Target, Trophy, Pencil } from 'lucide-react';
import type { Goal } from '@/types';

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const { data: progress } = useGoalProgress(goal);
  const pct = Math.min(100, ((progress || 0) / goal.target_count) * 100);
  const met = (progress || 0) >= goal.target_count;

  return (
    <Card className={`p-4 ${met ? 'ring-2 ring-green-500/30' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {met ? <Trophy className="h-4 w-4 text-yellow-500" /> : <Target className="h-4 w-4 text-primary" />}
            <h3 className="font-medium text-foreground truncate">{goal.title}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary font-medium text-muted-foreground capitalize">
              {goal.goal_type}
            </span>
          </div>
          {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${met ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-medium">{progress || 0}/{goal.target_count}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const { data: systems } = useSystems();
  const { data: tags } = useTags();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<'weekly' | 'monthly'>('weekly');
  const [targetCount, setTargetCount] = useState('3');
  const [systemId, setSystemId] = useState<string>('');

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setGoalType('weekly');
    setTargetCount('3');
    setSystemId('');
    setShowDialog(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setTitle(g.title);
    setDescription(g.description);
    setGoalType(g.goal_type);
    setTargetCount(g.target_count.toString());
    setSystemId(g.system_id || '');
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    const payload = {
      title: title.trim(),
      description,
      goal_type: goalType,
      target_count: parseInt(targetCount),
      system_id: systemId || null,
      tag_id: null,
      is_active: true,
    };
    try {
      if (editing) {
        await updateGoal.mutateAsync({ id: editing.id, ...payload });
        toast.success('Goal updated');
      } else {
        await createGoal.mutateAsync(payload);
        toast.success('Goal created');
      }
      setShowDialog(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal.mutateAsync(id);
      toast.success('Goal deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const activeGoals = goals?.filter(g => g.is_active) || [];
  const archivedGoals = goals?.filter(g => !g.is_active) || [];
  const routineSystems = systems?.filter(s => s.system_type === 'routine' && s.is_active) || [];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Goals</h1>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Loading…</div>
      ) : activeGoals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Set goals tied to your systems. Track progress automatically.</p>
          <Button onClick={openNew}>Create your first goal</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map(g => (
            <GoalCard key={g.id} goal={g} onEdit={() => openEdit(g)} onDelete={() => handleDelete(g.id)} />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Goal' : 'New Goal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Goal</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Exercise 4 times" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Why this matters..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Select value={goalType} onValueChange={v => setGoalType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target</Label>
                <Input type="number" value={targetCount} onChange={e => setTargetCount(e.target.value)} min="1" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Linked System (optional)</Label>
              <Select value={systemId} onValueChange={setSystemId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {routineSystems.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Progress auto-tracks from completed events.</p>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
