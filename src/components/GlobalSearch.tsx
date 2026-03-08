import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, CalendarDots, Target, GearSix, X } from '@phosphor-icons/react';
import { useEvents, useGoals, useSystems } from '@/hooks/useData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppContext } from './AppLayout';

interface SearchResult {
  id: string;
  type: 'event' | 'goal' | 'system';
  title: string;
  subtitle: string;
  route: string;
  onClick?: () => void;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setCurrentDate, setCurrentView, setEditingEventId, setShowEventDialog } = useAppContext();

  const { data: events } = useEvents();
  const { data: goals } = useGoals();
  const { data: systems } = useSystems();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const items: SearchResult[] = [];

    // Search events
    events?.forEach(event => {
      if (event.title.toLowerCase().includes(q) || event.description?.toLowerCase().includes(q)) {
        items.push({
          id: event.id,
          type: 'event',
          title: event.title,
          subtitle: format(new Date(event.start_time), 'MMM d, yyyy · h:mm a'),
          route: '/',
          onClick: () => {
            setCurrentDate(new Date(event.start_time));
            setCurrentView('day');
            setEditingEventId(event.id);
            setShowEventDialog(true);
            navigate('/');
          },
        });
      }
    });

    // Search goals
    goals?.forEach(goal => {
      if (goal.title.toLowerCase().includes(q) || goal.description?.toLowerCase().includes(q)) {
        items.push({
          id: goal.id,
          type: 'goal',
          title: goal.title,
          subtitle: `${goal.progress}% · ${goal.status}`,
          route: '/goals',
        });
      }
    });

    // Search systems
    systems?.forEach(system => {
      if (system.name.toLowerCase().includes(q)) {
        items.push({
          id: system.id,
          type: 'system',
          title: system.name,
          subtitle: `${system.recurrence_type} · ${system.is_active ? 'Active' : 'Paused'}`,
          route: '/systems',
        });
      }
    });

    return items.slice(0, 12);
  }, [query, events, goals, systems]);

  const handleSelect = (result: SearchResult) => {
    if (result.onClick) {
      result.onClick();
    } else {
      navigate(result.route);
    }
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const typeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'event': return <CalendarDots className="h-3.5 w-3.5 text-primary" weight="bold" />;
      case 'goal': return <Target className="h-3.5 w-3.5 text-amber-500" weight="bold" />;
      case 'system': return <GearSix className="h-3.5 w-3.5 text-emerald-500" weight="bold" />;
    }
  };

  const typeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'event': return 'Event';
      case 'goal': return 'Goal';
      case 'system': return 'System';
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm">
      <div className="relative">
        <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" weight="bold" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search… ⌘K"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query) setOpen(true); }}
          className="w-full h-8 pl-8 pr-8 text-[13px] rounded-lg bg-input text-foreground placeholder:text-muted-foreground border border-transparent focus:border-primary/30 focus:outline-none focus:ring-0 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for "{query}"
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto py-1.5">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left',
                    'hover:bg-accent/50 transition-colors'
                  )}
                >
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    {typeIcon(result.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate">{result.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                    {typeLabel(result.type)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
