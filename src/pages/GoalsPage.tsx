import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Trash, CheckCircle, Archive } from '@phosphor-icons/react';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { format, parseISO } from 'date-fns';
import type { Goal } from '@/types';

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const activeGoals = goals?.filter(g => g.status === 'active') || [];
  const completedGoals = goals?.filter(g => g.status === 'completed') || [];

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createGoal.mutateAsync({ title: title.trim(), description, target_date: targetDate || null });
    setTitle(''); setDescription(''); setTargetDate('');
    setOpen(false);
  };

  const handleProgress = (goal: Goal, value: number[]) => {
    const progress = value[0];
    updateGoal.mutate({ id: goal.id, progress, status: progress >= 100 ? 'completed' : 'active' });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-primary" weight="duotone" />
          </div>
          Goals
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Goal title" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
              <Button onClick={handleCreate} disabled={!title.trim() || createGoal.isPending} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <Target className="h-7 w-7 text-primary" weight="duotone" />
          </div>
          <p className="text-muted-foreground">No goals yet. Create your first goal to get started.</p>
        </Card>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active</h2>
              <div className="space-y-3">
                {activeGoals.map(g => (
                  <Card key={g.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm">{g.title}</h3>
                        {g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}
                        {g.target_date && <p className="text-xs text-muted-foreground mt-1">Target: {format(parseISO(g.target_date), 'MMM d, yyyy')}</p>}
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateGoal.mutate({ id: g.id, status: 'completed', progress: 100 })}>
                          <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteGoal.mutate(g.id)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Slider value={[g.progress]} max={100} step={5} className="flex-1" onValueCommit={(v) => handleProgress(g, v)} />
                      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{g.progress}%</span>
                    </div>
                    <Progress value={g.progress} className="mt-2 h-1.5" />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed</h2>
              <div className="space-y-2">
                {completedGoals.map(g => (
                  <Card key={g.id} className="p-3 opacity-70">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm text-foreground flex-1 truncate">{g.title}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateGoal.mutate({ id: g.id, status: 'active', progress: 50 })}>
                        <Archive className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteGoal.mutate(g.id)}>
                        <Trash className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
