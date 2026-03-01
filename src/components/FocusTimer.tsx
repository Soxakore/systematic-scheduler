import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Timer } from 'lucide-react';
import { useActiveSession, useStartFocusSession, useEndFocusSession } from '@/hooks/useData';

const PRESETS = [15, 25, 45, 60];

export default function FocusTimer() {
  const { data: activeSession } = useActiveSession();
  const startSession = useStartFocusSession();
  const endSession = useEndFocusSession();
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [elapsed, setElapsed] = useState(0);

  const isRunning = !!activeSession;

  useEffect(() => {
    if (!activeSession) { setElapsed(0); return; }
    const start = new Date(activeSession.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [activeSession]);

  const totalSeconds = isRunning ? activeSession!.duration_minutes * 60 : selectedMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // Auto-complete when timer runs out
  useEffect(() => {
    if (isRunning && remaining <= 0) {
      endSession.mutate({ id: activeSession!.id, status: 'completed' });
    }
  }, [remaining, isRunning]);

  const handleStart = () => startSession.mutate({ duration_minutes: selectedMinutes });
  const handleStop = () => { if (activeSession) endSession.mutate({ id: activeSession.id, status: 'cancelled' }); };
  const handleComplete = () => { if (activeSession) endSession.mutate({ id: activeSession.id, status: 'completed' }); };

  return (
    <Card className="p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Timer className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Focus Timer</h2>
      </div>

      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-mono font-bold text-foreground">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
      </div>

      {!isRunning && (
        <div className="flex gap-2 justify-center mb-4">
          {PRESETS.map(m => (
            <Button key={m} variant={selectedMinutes === m ? 'default' : 'outline'} size="sm"
              onClick={() => setSelectedMinutes(m)}>{m}m</Button>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        {!isRunning ? (
          <Button onClick={handleStart} disabled={startSession.isPending} className="gap-2">
            <Play className="h-4 w-4" /> Start Focus
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleStop} className="gap-2">
              <Square className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleComplete} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Complete
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
