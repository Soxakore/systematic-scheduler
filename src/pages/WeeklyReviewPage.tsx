import { useState } from 'react';
import { useSystems, useNextWeeklyReviewEvent, useEvents } from '@/hooks/useData';
import { useAppContext } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import WeeklyReviewWizard from '@/components/WeeklyReviewWizard';
import WeeklyReviewMode from '@/components/WeeklyReviewMode';
import { Sparkles, CalendarDays, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import type { CalendarEvent } from '@/types';
import { useNavigate } from 'react-router-dom';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WeeklyReviewPage() {
  const { data: systems } = useSystems();
  const { data: nextReview } = useNextWeeklyReviewEvent();
  const { data: allEvents } = useEvents();
  const { setCurrentDate, setCurrentView } = useAppContext();
  const navigate = useNavigate();

  const weeklyReviewSystem = systems?.find(s => s.system_type === 'weekly_review');

  const [showWizard, setShowWizard] = useState(false);
  const [reviewEvent, setReviewEvent] = useState<CalendarEvent | null>(null);

  // Find past review events too
  const pastReviews = allEvents
    ?.filter(e => e.system_id === weeklyReviewSystem?.id && e.is_system_generated)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, 8) || [];

  const handleNavigateToWeek = (date: Date) => {
    setCurrentDate(date);
    setCurrentView('week');
    setReviewEvent(null);
    navigate('/');
  };

  // No weekly review system exists — show setup CTA
  if (!weeklyReviewSystem) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Weekly Review</h1>
          <p className="text-muted-foreground max-w-sm mb-6">
            Reflect on your week, celebrate wins, and plan ahead.
            Set up a recurring weekly review in just 3 steps.
          </p>
          <Button onClick={() => setShowWizard(true)} className="gap-2">
            <Sparkles className="h-4 w-4" /> Set Up Weekly Review
          </Button>
          <WeeklyReviewWizard open={showWizard} onOpenChange={setShowWizard} />
        </div>
      </div>
    );
  }

  // Weekly review exists — show dashboard
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Weekly Review
        </h1>
        <Badge variant="secondary" className="text-xs">
          {weeklyReviewSystem.is_active ? 'Active' : 'Paused'}
        </Badge>
      </div>

      {/* Schedule info */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Every {DAY_NAMES[weeklyReviewSystem.recurrence_days[0]] || 'Sunday'}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {weeklyReviewSystem.default_start_time} · {weeklyReviewSystem.default_duration_minutes} min
            </p>
          </div>
        </div>
      </Card>

      {/* Next review */}
      {nextReview && (
        <Card
          className="p-4 mb-6 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setReviewEvent(nextReview)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Next Review</p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(nextReview.start_time), 'EEEE, MMMM d')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(nextReview.start_time), 'h:mm a')}
              </p>
            </div>
            <Button size="sm" className="gap-1">
              Open <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Past reviews */}
      {pastReviews.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Reviews
          </h2>
          <div className="space-y-2">
            {pastReviews.map(event => {
              const isPast = new Date(event.start_time) < new Date();
              return (
                <Card
                  key={event.id}
                  className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setReviewEvent(event)}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${isPast ? 'text-muted-foreground' : 'text-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {format(new Date(event.start_time), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.start_time), 'EEEE · h:mm a')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Review mode dialog */}
      <WeeklyReviewMode
        open={!!reviewEvent}
        onOpenChange={(v) => { if (!v) setReviewEvent(null); }}
        event={reviewEvent}
        onNavigateToWeek={handleNavigateToWeek}
      />
    </div>
  );
}
