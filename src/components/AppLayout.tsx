import { ReactNode, useState, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useCalendars, useTags } from '@/hooks/useData';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  CalendarDays, LayoutGrid, Settings, ListTodo, Plus, Search,
  ChevronLeft, ChevronRight, LogOut, Menu, Tag, Sparkles, Brain,
  Flame, Trophy, Target, Sun, FileText, BookOpen, Eye, X
} from 'lucide-react';
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

  const navItems = [
    { to: '/dashboard', icon: Brain, label: 'Dashboard' },
    { to: '/briefing', icon: Sun, label: 'Morning Briefing' },
    { to: '/habits', icon: Flame, label: 'Habits & Streaks' },
    { to: '/goals', icon: Target, label: 'Goals' },
    { to: '/templates', icon: FileText, label: 'Templates' },
    { to: '/analytics', icon: Trophy, label: 'Analytics' },
    { to: '/review', icon: Sparkles, label: 'Weekly Review' },
    { to: '/journal', icon: BookOpen, label: 'Journal' },
    { to: '/vision', icon: Eye, label: 'Vision Board' },
  ];

  return (
    <AppContext.Provider value={{
      currentDate, setCurrentDate, currentView, setCurrentView,
      searchQuery, setSearchQuery, showEventDialog, setShowEventDialog,
      selectedDate, setSelectedDate, editingEventId, setEditingEventId,
      selectedTagIds, setSelectedTagIds
    }}>
      {/* Animated mesh background */}
      <div className="app-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="h-screen flex flex-col overflow-hidden relative z-0">
        {/* ── Glass Header ─────────────────────────────────────────── */}
        <header className="glass-header h-14 flex items-center px-4 gap-3 shrink-0 relative z-10">
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mr-3 group">
            <div className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
            </div>
            {!isMobile && (
              <span className="font-semibold gradient-text text-sm tracking-tight">
                System Calendar
              </span>
            )}
          </Link>

          {/* Calendar nav controls */}
          {isCalendarPage && (
            <>
              <button
                onClick={goToday}
                className="px-3 h-7 text-xs rounded-md border border-white/10 bg-white/5 text-foreground hover:bg-white/10 transition-colors font-medium"
              >
                Today
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => navigateDate('prev')}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm font-medium text-foreground/80 truncate">{viewLabel()}</span>

              <div className="flex-1" />

              {/* View switcher */}
              {!isMobile && (
                <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
                  {views.map(v => (
                    <button
                      key={v.value}
                      onClick={() => setCurrentView(v.value)}
                      className={cn(
                        'px-3 h-6 text-xs rounded-md font-medium transition-all',
                        currentView === v.value
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="relative ml-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search…"
                  className="glass-input h-7 w-36 lg:w-48 pl-7 pr-2 text-xs rounded-lg text-foreground placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </>
          )}

          {!isCalendarPage && <div className="flex-1" />}

          {/* Sign out */}
          {!isMobile && (
            <button
              onClick={() => { signOut(); navigate('/login'); }}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Glass Sidebar ──────────────────────────────────────── */}
          {!isMobile && sidebarOpen && (
            <aside className="glass-sidebar w-56 shrink-0 flex flex-col overflow-y-auto scrollbar-thin fade-up">
              {/* New Event button */}
              <div className="p-3">
                <button
                  onClick={() => { setSelectedDate(new Date()); setEditingEventId(null); setShowEventDialog(true); }}
                  className="glass-button-primary w-full h-9 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  New Event
                </button>
              </div>

              {/* Calendars */}
              <div className="px-3 pb-3">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Calendars</h3>
                <div className="space-y-0.5">
                  {calendars?.map(cal => (
                    <label key={cal.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm cursor-pointer text-sidebar-foreground hover:bg-white/5 transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/20" style={{ backgroundColor: cal.color }} />
                      <span className="truncate">{cal.name}</span>
                    </label>
                  ))}
                </div>
                <Link to="/calendars" className="text-[10px] text-primary/70 hover:text-primary mt-1.5 block transition-colors">
                  Manage calendars →
                </Link>
              </div>

              <div className="mx-3 divider-gradient mb-3" />

              {/* Tags */}
              <div className="px-3 pb-3">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Tags</h3>
                <div className="space-y-0.5">
                  {tags?.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm cursor-pointer text-sidebar-foreground hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        className="rounded w-3 h-3 accent-primary"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => setSelectedTagIds(
                          selectedTagIds.includes(tag.id)
                            ? selectedTagIds.filter(id => id !== tag.id)
                            : [...selectedTagIds, tag.id]
                        )}
                      />
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      <span className="truncate">{tag.name}</span>
                    </label>
                  ))}
                  {(!tags || tags.length === 0) && (
                    <span className="text-xs text-muted-foreground px-2">No tags yet</span>
                  )}
                </div>
                {selectedTagIds.length > 0 && (
                  <button
                    className="text-[10px] text-primary/70 hover:text-primary mt-1.5 block transition-colors"
                    onClick={() => setSelectedTagIds([])}
                  >
                    Clear filter ×
                  </button>
                )}
              </div>

              <div className="mx-3 divider-gradient mb-3" />

              {/* Navigation */}
              <div className="px-3 pb-3">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Navigate</h3>
                <div className="stagger space-y-0.5">
                  {navItems.map(item => {
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          'flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm transition-all duration-200 group',
                          active
                            ? 'nav-active text-primary font-medium pulse-glow'
                            : 'text-sidebar-foreground hover:bg-white/5 hover:text-foreground'
                        )}
                      >
                        <item.icon className={cn('h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110', active && 'text-primary')} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Bottom settings */}
              <div className="mt-auto p-3 border-t border-white/5">
                <Link
                  to="/settings"
                  className={cn(
                    'flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm transition-colors',
                    location.pathname === '/settings'
                      ? 'nav-active text-primary font-medium'
                      : 'text-sidebar-foreground hover:bg-white/5 hover:text-foreground'
                  )}
                >
                  <Settings className="h-3.5 w-3.5 shrink-0" />
                  Settings
                </Link>
              </div>
            </aside>
          )}

          {/* ── Main content ──────────────────────────────────────── */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>

        {/* ── Mobile bottom nav ─────────────────────────────────── */}
        {isMobile && (
          <nav className="glass-header h-16 flex items-center justify-around shrink-0 border-t border-white/5">
            {[
              { to: '/', icon: CalendarDays, label: 'Calendar' },
              { to: '/dashboard', icon: Brain, label: 'Dashboard' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 text-[10px] font-medium transition-colors',
                  location.pathname === item.to ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}

            {/* FAB */}
            <button
              onClick={() => { setSelectedDate(new Date()); setEditingEventId(null); setShowEventDialog(true); }}
              className="flex flex-col items-center -mt-5"
            >
              <div className="glass-button-primary h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg">
                <Plus className="h-5 w-5 text-white" />
              </div>
            </button>

            {[
              { to: '/habits', icon: Flame, label: 'Habits' },
              { to: '/settings', icon: Settings, label: 'More' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 text-[10px] font-medium transition-colors',
                  location.pathname === item.to ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </AppContext.Provider>
  );
}
