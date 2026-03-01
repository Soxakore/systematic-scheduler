import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6">Event Templates</h1>
      <Card className="p-8 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Templates feature coming soon.</p>
      </Card>
    </div>
  );
}
