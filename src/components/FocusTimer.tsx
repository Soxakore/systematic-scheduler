import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateFocusSession, useCompleteFocusSession } from '@/hooks/useData';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface FocusTimerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string | null;
  eventTitle?: string;
}

export default function FocusTimer({ open, onOpenChange, eventId, eventTitle }: FocusTimerProps) {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const startTimeRef = useRef<Date | null>(null);

  const createSession = useCreateFocusSession();
  const completeSession = useCompleteFocusSession();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / (duration * 60);
  const circumference = 2 * Math.PI * 120;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = async () => {
    if (!sessionId) {
      try {
        const session = await createSession.mutateAsync({
          event_id: eventId || undefined,
          planned_minutes: duration,
          session_type: sessionType,
        });
        setSessionId(session.id);
        startTimeRef.current = new Date();
      } catch { return; }
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    if (sessionId && startTimeRef.current) {
      const actual = Math.round((Date.now() - startTimeRef.current.getTime()) / 60000);
      await completeSession.mutateAsync({ id: sessionId, actual_minutes: actual });
      if (sessionType === 'focus') {
        setCompletedPomodoros(p => p + 1);
        toast.success('Focus session complete!');
      } else {
        toast.success('Break complete! Ready to focus.');
      }
    }
    setSessionId(null);
    startTimeRef.current = null;

    // Auto-suggest next session
    if (sessionType === 'focus') {
      const nextType = (completedPomodoros + 1) % 4 === 0 ? 'long_break' : 'short_break';
      setSessionType(nextType);
      setDuration(nextType === 'long_break' ? 15 : 5);
      setTimeLeft((nextType === 'long_break' ? 15 : 5) * 60);
    } else {
      setSessionType('focus');
      setDuration(25);
      setTimeLeft(25 * 60);
    }
  }, [sessionId, sessionType, completedPomodoros]);

  const handleReset = () => {
    setIsRunning(false);
    setSessionId(null);
    startTimeRef.current = null;
    setTimeLeft(duration * 60);
  };

  const switchMode = (type: 'focus' | 'short_break' | 'long_break') => {
    if (isRunning) return;
    setSessionType(type);
    const mins = type === 'focus' ? 25 : type === 'short_break' ? 5 : 15;
    setDuration(mins);
    setTimeLeft(mins * 60);
    setSessionId(null);
  };

  const ringColor = sessionType === 'focus' ? 'text-primary' : sessionType === 'short_break' ? 'text-green-500' : 'text-blue-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Focus Timer
          </DialogTitle>
        </DialogHeader>

        {eventTitle && (
          <p className="text-sm text-muted-foreground text-center truncate">Working on: {eventTitle}</p>
        )}

        {/* Mode tabs */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {[
            { type: 'focus' as const, label: 'Focus', icon: Brain },
            { type: 'short_break' as const, label: 'Short Break', icon: Coffee },
            { type: 'long_break' as const, label: 'Long Break', icon: Coffee },
          ].map(m => (
            <button
              key={m.type}
              onClick={() => switchMode(m.type)}
              disabled={isRunning}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                sessionType === m.type ? 'bg-background shadow-sm' : 'text-muted-foreground'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Timer ring */}
        <div className="flex items-center justify-center py-4">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
              <circle cx="128" cy="128" r="120" fill="none" strokeWidth="6" className="stroke-secondary" />
              <circle
                cx="128" cy="128" r="120" fill="none" strokeWidth="6"
                className={ringColor}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference * (1 - progress),
                  strokeLinecap: 'round',
                  transition: 'stroke-dashoffset 1s linear',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold text-foreground">{formatTime(timeLeft)}</span>
              <span className="text-xs text-muted-foreground mt-1 capitalize">{sessionType.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Pomodoro dots */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < completedPomodoros % 4 ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{completedPomodoros} completed</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" onClick={handleReset} disabled={!sessionId && timeLeft === duration * 60}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          {isRunning ? (
            <Button size="lg" onClick={handlePause} className="w-24">
              <Pause className="h-5 w-5 mr-1" /> Pause
            </Button>
          ) : (
            <Button size="lg" onClick={handleStart} className="w-24">
              <Play className="h-5 w-5 mr-1" /> {sessionId ? 'Resume' : 'Start'}
            </Button>
          )}
        </div>

        {/* Custom duration */}
        {!isRunning && !sessionId && sessionType === 'focus' && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Duration:</span>
            <Select value={duration.toString()} onValueChange={v => { setDuration(Number(v)); setTimeLeft(Number(v) * 60); }}>
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 20, 25, 30, 45, 60].map(m => (
                  <SelectItem key={m} value={m.toString()}>{m} min</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
