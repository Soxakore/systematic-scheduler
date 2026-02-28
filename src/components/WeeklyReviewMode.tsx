import { useState } from 'react';
import { useEventChecklistItems, useToggleChecklistItem, useSystems } from '@/hooks/useData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight,
  CalendarDays, Trophy, Sparkles
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import type { CalendarEvent } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: CalendarEvent | null;
  onNavigateToWeek?: (date: Date) => void;
}

export default function WeeklyReviewMode({ open, onOpenChange, event, onNavigateToWeek }: Props) {
  const { data: checklistItems, isLoading } = useEventChecklistItems(event?.id || null);
  const toggleItem = useToggleChecklistItem();
  const { data: systems } = useSystems();
  const weeklyReviewSystem = systems?.find(s => s.system_type === 'weekly_review');

  if (!event) return null;

  const eventDate = new Date(event.start_time);
  const reviewedWeekStart = startOfWeek(subWeeks(eventDate, 1));
  const reviewedWeekEnd = endOfWeek(subWeeks(eventDate, 1));
  const upcomingWeekStart = startOfWeek(eventDate);
  const upcomingWeekEnd = endOfWeek(eventDate);

  const completedCount = checklistItems?.filter(i => i.is_completed).length || 0;
  const totalCount = checklistItems?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;

  const handleToggle = (id: string, currentState: boolean) => {
    toggleItem.mutate({ id, is_completed: !currentState });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Weekly Review
          </DialogTitle>
        </DialogHeader>

        {/* Date context */}
        <div className="text-sm text-muted-foreground mb-1">
          {format(eventDate, 'EEEE, MMMM d, yyyy')} · {format(eventDate, 'h:mm a')}
        </div>

        {/* Week navigation cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
            onClick={() => onNavigateToWeek?.(reviewedWeekStart)}
          >
            <div className="flex items-center gap-2 mb-1">
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Week</span>
            </div>
            <p className="text-sm font-medium">
              {format(reviewedWeekStart, 'MMM d')} – {format(reviewedWeekEnd, 'MMM d')}
            </p>
          </button>
          <button
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
            onClick={() => onNavigateToWeek?.(upcomingWeekStart)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Week</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {format(upcomingWeekStart, 'MMM d')} – {format(upcomingWeekEnd, 'MMM d')}
            </p>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium">
              {completedCount}/{totalCount} {allDone && '🎉'}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Checklist */}
        <div className="space-y-1 mt-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-6">Loading checklist…</div>
          ) : checklistItems?.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">No checklist items for this review.</div>
          ) : (
            checklistItems?.map(item => (
              <button
                key={item.id}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                onClick={() => handleToggle(item.id, item.is_completed)}
              >
                <div className="mt-0.5 shrink-0">
                  {item.is_completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary/60" />
                  )}
                </div>
                <span className={`text-sm leading-relaxed ${
                  item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}>
                  {item.text}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Completion celebration */}
        {allDone && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Review Complete!</p>
            <p className="text-xs text-muted-foreground mt-1">Great job reflecting on your week. See you next time.</p>
          </div>
        )}

        <div className="mt-4">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
