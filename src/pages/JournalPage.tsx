import { useState, useEffect } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { useJournalEntry, useJournalEntries, useUpsertJournalEntry } from '@/hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, BookOpen, Plus, X, Smile, Zap, Trophy, Lightbulb, Star, Heart } from 'lucide-react';

const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
];

const ENERGY_LEVELS = [
  { value: 1, label: 'Drained', color: 'bg-red-500' },
  { value: 2, label: 'Low', color: 'bg-orange-500' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-500' },
  { value: 4, label: 'High', color: 'bg-lime-500' },
  { value: 5, label: 'Peak', color: 'bg-green-500' },
];

function ListEditor({ items, onChange, placeholder, icon: Icon }: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  icon: any;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed) {
      onChange([...items, trimmed]);
      setInput('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder={placeholder}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button size="sm" variant="outline" onClick={add} className="h-9 px-2">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm bg-muted/50 rounded-md px-3 py-2">
          <span className="flex-1">{item}</span>
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  const { data: entry, isLoading } = useJournalEntry(dateStr);
  const { data: recentEntries } = useJournalEntries(30);
  const upsert = useUpsertJournalEntry();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState<string[]>([]);
  const [wins, setWins] = useState<string[]>([]);
  const [lessons, setLessons] = useState<string[]>([]);
  const [intentions, setIntentions] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');

  useEffect(() => {
    if (entry) {
      setMood(entry.mood);
      setEnergy(entry.energy);
      setGratitude(entry.gratitude || []);
      setWins(entry.wins || []);
      setLessons(entry.lessons || []);
      setIntentions(entry.intentions || []);
      setFreeText(entry.free_text || '');
    } else {
      setMood(null);
      setEnergy(null);
      setGratitude([]);
      setWins([]);
      setLessons([]);
      setIntentions([]);
      setFreeText('');
    }
  }, [entry, dateStr]);

  const save = async () => {
    await upsert.mutateAsync({
      date: dateStr,
      mood,
      energy,
      gratitude,
      wins,
      lessons,
      intentions,
      free_text: freeText,
    });
    toast.success('Journal saved');
  };

  const journalStreak = (() => {
    if (!recentEntries || recentEntries.length === 0) return 0;
    let streak = 0;
    let check = new Date();
    for (let i = 0; i < 90; i++) {
      const d = format(check, 'yyyy-MM-dd');
      if (recentEntries.some(e => e.date === d)) {
        streak++;
      } else if (i > 0) break;
      check = subDays(check, 1);
    }
    return streak;
  })();

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Daily Journal
            </h1>
            {journalStreak > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {journalStreak} day streak
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant={isToday ? 'default' : 'outline'} size="sm" onClick={() => setSelectedDate(new Date())}>
              {isToday ? 'Today' : format(selectedDate, 'MMM d')}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          {isToday
            ? `Good ${timeOfDay}! How's your day going?`
            : format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </p>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Smile className="h-4 w-4 text-amber-500" /> How are you feeling?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 justify-center">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMood(mood === m.value ? null : m.value)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        mood === m.value
                          ? 'bg-primary/10 ring-2 ring-primary scale-110'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" /> Energy Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 justify-center">
                  {ENERGY_LEVELS.map(e => (
                    <button
                      key={e.value}
                      onClick={() => setEnergy(energy === e.value ? null : e.value)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                        energy === e.value ? 'ring-2 ring-primary scale-110' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`w-2 h-4 rounded-sm ${i < e.value ? e.color : 'bg-muted'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{e.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-blue-500" /> Intentions for Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListEditor items={intentions} onChange={setIntentions} placeholder="What do you want to focus on?" icon={Star} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" /> Gratitude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListEditor items={gratitude} onChange={setGratitude} placeholder="What are you grateful for?" icon={Heart} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-500" /> Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListEditor items={wins} onChange={setWins} placeholder="What went well?" icon={Trophy} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-orange-500" /> Lessons & Reflections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListEditor items={lessons} onChange={setLessons} placeholder="What did you learn?" icon={Lightbulb} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Free Write
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder="Write freely... thoughts, ideas, anything on your mind."
                  className="min-h-[120px] resize-y"
                />
              </CardContent>
            </Card>

            <Button onClick={save} className="w-full" disabled={upsert.isPending}>
              {upsert.isPending ? 'Saving...' : entry ? 'Update Entry' : 'Save Entry'}
            </Button>

            {recentEntries && recentEntries.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Recent Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentEntries.slice(0, 7).map(e => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedDate(new Date(e.date + 'T12:00:00'))}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                          e.date === dateStr ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <span className="text-lg">{MOODS.find(m => m.value === e.mood)?.emoji || ''}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{format(new Date(e.date + 'T12:00:00'), 'EEE, MMM d')}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {e.wins.length > 0 ? `${e.wins.length} win${e.wins.length > 1 ? 's' : ''}` : ''}
                            {e.gratitude.length > 0 ? ` · ${e.gratitude.length} grateful` : ''}
                            {e.free_text ? ' · notes' : ''}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`w-1.5 h-3 rounded-sm ${i < (e.energy || 0) ? 'bg-green-500' : 'bg-muted'}`} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
