import { ReactNode, useState, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useCalendars, useTags } from '@/hooks/useData';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarDays, LayoutGrid, Settings, ListTodo, Plus, Search, ChevronLeft, ChevronRight, LogOut, Menu, Tag, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types';
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';

interface AppContextType {
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  currentView: ViewType;
  setCurrentView: (v: ViewType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showEventDialog: boolean;
  setShowEventDialog: (v: boolean) => void;
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  editingEventId: string | null;
  setEditingEventId: (id: string | null) => void;
  selectedTagIds: string[];
  setSelectedTagIds: (ids: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext outside provider');
  return ctx;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: calendars } = useCalendars();
  const { data: tags } = useTags();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>(profile?.default_view || 'week');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const navigateDate = (dir: 'prev' | 'next') => {
    const fn = dir === 'next'
      ? currentView === 'month' ? addMonths : currentView === 'week' ? addWeeks : addDays
      : currentView === 'month' ? subMonths : currentView === 'week' ? subWeeks : subDays;
    setCurrentDate(fn(currentDate, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const viewLabel = () => {
    if (currentView === 'month') return format(currentDate, 'MMMM yyyy');
    if (currentView === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      return `${format(start, 'MMM d')} – ${format(addDays(start, 6), 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  const views: { value: ViewType; label: string }[] = [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
    { value: 'agenda', label: 'Agenda' },
  ];

  const isCalendarPage = location.pathname === '/';

  return (
    <AppContext.Provider value={{ currentDate, setCurrentDate, currentView, setCurrentView, searchQuery, setSearchQuery, showEventDialog, setShowEventDialog, selectedDate, setSelectedDate, editingEventId, setEditingEventId, selectedTagIds, setSelectedTagIds }}>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b flex items-center px-3 gap-2 shrink-0">
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2 mr-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {!isMobile && <span className="font-semibold text-foreground">System Calendar</span>}
          </Link>

          {isCalendarPage && (
            <>
              <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground truncate">{viewLabel()}</span>
              <div className="flex-1" />
              {!isMobile && (
                <div className="flex items-center gap-1 border rounded-md p-0.5">
                  {views.map(v => (
                    <Button
                      key={v.value}
                      variant={currentView === v.value ? 'default' : 'ghost'}
                      size="sm"
                      className="text-xs h-7 px-3"
                      onClick={() => setCurrentView(v.value)}
                    >
                      {v.label}
                    </Button>
                  ))}
                </div>
              )}
              <div className="relative ml-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search…"
                  className="h-8 w-36 lg:w-48 pl-7 pr-2 text-sm rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex-1" />
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate('/login'); }} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop sidebar */}
          {!isMobile && sidebarOpen && (
            <aside className="w-56 border-r bg-sidebar shrink-0 flex flex-col overflow-y-auto scrollbar-thin">
              <div className="p-3">
                <Button className="w-full justify-start gap-2" onClick={() => { setSelectedDate(new Date()); setEditingEventId(null); setShowEventDialog(true); }}>
                  <Plus className="h-4 w-4" /> New Event
                </Button>
              </div>

              <div className="px-3 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Calendars</h3>
                {calendars?.map(cal => (
                  <label key={cal.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer text-sidebar-foreground">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: cal.color }} />
                    <span className="truncate">{cal.name}</span>
                  </label>
                ))}
                <Link to="/calendars" className="text-xs text-primary hover:underline mt-1 block">Manage calendars</Link>
              </div>

              <div className="px-3 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</h3>
                {tags?.map(tag => (
                  <label key={tag.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer text-sidebar-foreground">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => setSelectedTagIds(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                    />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="truncate">{tag.name}</span>
                  </label>
                ))}
                {(!tags || tags.length === 0) && <span className="text-xs text-muted-foreground">No tags yet</span>}
                {selectedTagIds.length > 0 && (
                  <button className="text-xs text-primary hover:underline mt-1 block" onClick={() => setSelectedTagIds([])}>Clear filter</button>
                )}
              </div>

              <div className="px-3 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Systems</h3>
                <Link to="/systems" className="text-xs text-primary hover:underline block">Manage systems</Link>
              </div>

              {/* Weekly Review entry point */}
              <div className="px-3 pb-2">
                <Link
                  to="/review"
                  className={cn(
                    "flex items-center gap-2 py-2 px-2 rounded-md text-sm transition-colors",
                    location.pathname === '/review'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-sidebar-foreground hover:bg-accent/50'
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Weekly Review
                </Link>
              </div>

              <div className="mt-auto p-3 border-t">
                <Link to="/settings" className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-foreground">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        {isMobile && (
          <nav className="h-14 border-t flex items-center justify-around bg-background shrink-0">
            <Link to="/" className={cn("flex flex-col items-center gap-0.5 text-xs", location.pathname === '/' ? 'text-primary' : 'text-muted-foreground')}>
              <CalendarDays className="h-5 w-5" />
              Calendar
            </Link>
            <Link to="/review" className={cn("flex flex-col items-center gap-0.5 text-xs", location.pathname === '/review' ? 'text-primary' : 'text-muted-foreground')}>
              <Sparkles className="h-5 w-5" />
              Review
            </Link>
            <button
              onClick={() => { setSelectedDate(new Date()); setEditingEventId(null); setShowEventDialog(true); }}
              className="flex flex-col items-center gap-0.5 text-xs text-primary"
            >
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center -mt-4">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
            </button>
            <Link to="/systems" className={cn("flex flex-col items-center gap-0.5 text-xs", location.pathname === '/systems' ? 'text-primary' : 'text-muted-foreground')}>
              <LayoutGrid className="h-5 w-5" />
              Systems
            </Link>
            <Link to="/settings" className={cn("flex flex-col items-center gap-0.5 text-xs", location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground')}>
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </nav>
        )}
      </div>
    </AppContext.Provider>
  );
}
