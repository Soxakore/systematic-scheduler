import { useState, useEffect, useMemo } from 'react';
import { format, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, eachDayOfInterval, isSameMonth } from 'date-fns';
import { useJournalEntry, useJournalEntriesRange, useUpsertJournalEntry } from '@/hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CaretLeft, CaretRight, Plus, X, Smiley, SmileySad, SmileyMelting, SmileyMeh, SmileyWink, Star, Heart, Trophy, Lightbulb } from '@phosphor-icons/react';
import icoJournal from '@/assets/icons/icon-journal.svg';
import icoLightning from '@/assets/icons/icon-lightning.svg';
import icoStar from '@/assets/icons/icon-star.svg';
import icoHeart from '@/assets/icons/icon-heart.svg';
import icoTrophy from '@/assets/icons/icon-trophy.svg';
import icoLightbulb from '@/assets/icons/icon-lightbulb.svg';
import icoBook from '@/assets/icons/icon-book.svg';

const MOODS = [
  { value: 1, icon: SmileySad,     color: 'text-red-400',    label: 'Rough' },
  { value: 2, icon: SmileyMelting, color: 'text-orange-400', label: 'Low' },
  { value: 3, icon: SmileyMeh,     color: 'text-yellow-400', label: 'Okay' },
  { value: 4, icon: Smiley,        color: 'text-green-400',  label: 'Good' },
  { value: 5, icon: SmileyWink,    color: 'text-primary',    label: 'Great' },
];

const ENERGY_LEVELS = [
  { value: 1, label: 'Drained', color: 'bg-red-500' },
  { value: 2, label: 'Low', color: 'bg-orange-500' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-500' },
  { value: 4, label: 'High', color: 'bg-lime-500' },
  { value: 5, label: 'Peak', color: 'bg-green-500' },
];

type ViewMode = 'week' | 'month' | 'year';

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

function JournalHistory({ onSelectDate }: { onSelectDate: (date: Date) => void }) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [viewDate, setViewDate] = useState(new Date());

  const range = useMemo(() => {
    if (viewMode === 'week') {
      return { start: startOfWeek(viewDate, { weekStartsOn: 1 }), end: endOfWeek(viewDate, { weekStartsOn: 1 }) };
    } else if (viewMode === 'month') {
      return { start: startOfMonth(viewDate), end: endOfMonth(viewDate) };
    } else {
      return { start: startOfYear(viewDate), end: endOfYear(viewDate) };
    }
  }, [viewMode, viewDate]);

  const startStr = format(range.start, 'yyyy-MM-dd');
  const endStr = format(range.end, 'yyyy-MM-dd');
  const { data: entries } = useJournalEntriesRange(startStr, endStr);

  const entriesMap = useMemo(() => {
    const map = new Map<string, typeof entries extends (infer T)[] | undefined ? T : never>();
    entries?.forEach(e => map.set(e.date, e));
    return map;
  }, [entries]);

  const navigate = (dir: -1 | 1) => {
    if (viewMode === 'week') setViewDate(dir === 1 ? addWeeks(viewDate, 1) : subWeeks(viewDate, 1));
    else if (viewMode === 'month') setViewDate(dir === 1 ? addMonths(viewDate, 1) : subMonths(viewDate, 1));
    else setViewDate(dir === 1 ? addYears(viewDate, 1) : subYears(viewDate, 1));
  };

  const rangeLabel = viewMode === 'week'
    ? `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d, yyyy')}`
    : viewMode === 'month'
    ? format(viewDate, 'MMMM yyyy')
    : format(viewDate, 'yyyy');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Entry History</CardTitle>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {(['week', 'month', 'year'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}>
            <CaretLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">{rangeLabel}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}>
            <CaretRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {viewMode === 'year' ? (
          <YearGrid viewDate={viewDate} entriesMap={entriesMap} onSelectDate={onSelectDate} />
        ) : (
          <DayList
            start={range.start}
            end={range.end}
            entriesMap={entriesMap}
            onSelectDate={onSelectDate}
            compact={viewMode === 'month'}
          />
        )}

        {entries && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} in this period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DayList({ start, end, entriesMap, onSelectDate, compact }: {
  start: Date; end: Date;
  entriesMap: Map<string, any>;
  onSelectDate: (d: Date) => void;
  compact?: boolean;
}) {
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto">
      {days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = entriesMap.get(dateStr);
        const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
        const moodInfo = entry ? MOODS.find(m => m.value === entry.mood) : null;

        return (
          <button
            key={dateStr}
            onClick={() => onSelectDate(new Date(dateStr + 'T12:00:00'))}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${
              entry ? 'hover:bg-primary/10' : 'hover:bg-muted opacity-50'
            } ${isToday ? 'ring-1 ring-primary/30' : ''}`}
          >
            {moodInfo ? (
              <moodInfo.icon className={`h-4 w-4 shrink-0 ${moodInfo.color}`} weight="fill" />
            ) : (
              <div className="h-4 w-4 shrink-0 rounded-full border border-dashed border-muted-foreground/30" />
            )}
            <span className="font-medium min-w-[70px]">
              {compact ? format(day, 'MMM d') : format(day, 'EEE, MMM d')}
            </span>
            {entry && (
              <div className="flex-1 flex items-center gap-2 justify-end">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-1 h-2.5 rounded-sm ${i < (entry.energy || 0) ? 'bg-green-500' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function YearGrid({ viewDate, entriesMap, onSelectDate }: {
  viewDate: Date;
  entriesMap: Map<string, any>;
  onSelectDate: (d: Date) => void;
}) {
  const yearStart = startOfYear(viewDate);
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(yearStart.getFullYear(), i, 1);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return { month: monthStart, days };
  });

  return (
    <div className="grid grid-cols-3 gap-3">
      {months.map(({ month, days }) => (
        <div key={month.toISOString()} className="space-y-1">
          <div className="text-[10px] font-medium text-muted-foreground">{format(month, 'MMM')}</div>
          <div className="grid grid-cols-7 gap-[2px]">
            {Array.from({ length: new Date(month.getFullYear(), month.getMonth(), 1).getDay() || 7 }).slice(1).map((_, i) => (
              <div key={`pad-${i}`} className="w-2.5 h-2.5" />
            ))}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const entry = entriesMap.get(dateStr);
              const moodColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-primary'];
              return (
                <button
                  key={dateStr}
                  onClick={() => onSelectDate(new Date(dateStr + 'T12:00:00'))}
                  className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${
                    entry ? (moodColors[entry.mood || 0] || 'bg-muted-foreground/40') : 'bg-muted'
                  } hover:ring-1 hover:ring-primary/50`}
                  title={`${format(day, 'MMM d')}${entry ? ` – ${MOODS.find(m => m.value === entry.mood)?.label || ''}` : ''}`}
                />
              );
            })}
          </div>
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

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2.5">
            <img src={icoJournal} alt="" width={32} height={32} className="rounded-xl shrink-0" />
            Daily Journal
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <CaretLeft className="h-4 w-4" />
            </Button>
            <Button variant={isToday ? 'default' : 'outline'} size="sm" onClick={() => setSelectedDate(new Date())}>
              {isToday ? 'Today' : format(selectedDate, 'MMM d')}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <CaretRight className="h-4 w-4" />
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
                  <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Smiley className="h-4 w-4 text-amber-500" weight="duotone" />
                  </div> How are you feeling?
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
                      <m.icon className={`h-6 w-6 ${m.color}`} weight={mood === m.value ? 'fill' : 'duotone'} />
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <img src={icoLightning} alt="" width={28} height={28} className="rounded-lg shrink-0" />
                  Energy Level
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
                  <img src={icoStar} alt="" width={28} height={28} className="rounded-lg shrink-0" />
                  Intentions for Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListEditor items={intentions} onChange={setIntentions} placeholder="What do you want to focus on?" icon={Star} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <img src={icoHeart} alt="" width={28} height={28} className="rounded-lg shrink-0" />
                  Gratitude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListEditor items={gratitude} onChange={setGratitude} placeholder="What are you grateful for?" icon={Heart} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <img src={icoTrophy} alt="" width={28} height={28} className="rounded-lg shrink-0" />
                  Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListEditor items={wins} onChange={setWins} placeholder="What went well?" icon={Trophy} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <img src={icoLightbulb} alt="" width={28} height={28} className="rounded-lg shrink-0" />
                  Lessons &amp; Reflections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListEditor items={lessons} onChange={setLessons} placeholder="What did you learn?" icon={Lightbulb} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <img src={icoBook} alt="" width={28} height={28} className="rounded-lg shrink-0" />
                  Free Write
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

            <JournalHistory onSelectDate={setSelectedDate} />
          </>
        )}
      </div>
    </div>
  );
}
