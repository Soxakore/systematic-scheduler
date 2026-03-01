import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function WeeklyReviewPage() {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Weekly Review
      </h1>
      <Card className="p-8 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Weekly Review feature coming soon.</p>
      </Card>
    </div>
  );
}
