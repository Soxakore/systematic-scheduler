import { createContext, useContext, useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import PageTransition from './PageTransition';
import {
  CalendarDots, SquaresFour, SunHorizon, Eye,
  Target, ArrowsClockwise, CheckSquare, NotePencil,
  ChartLineUp, GearSix, List, X, Plus, Sun, Moon, Users,
} from '@phosphor-icons/react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useData';
import { format } from 'date-fns';

/* ── App-wide context ──────────────────────────────────────── */
interface AppContextValue {
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  currentView: string;
  setCurrentView: (v: string) => void;
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
export const AppContext = createContext<AppContextValue>({} as AppContextValue);
export const useAppContext = () => useContext(AppContext);

/* ── Nav items ─────────────────────────────────────────────── */
const NAV = [
  { to: '/',          icon: CalendarDots,    label: 'Calendar'  },
  { to: '/dashboard', icon: SquaresFour,     label: 'Dashboard' },
  { to: '/morning',   icon: SunHorizon,      label: 'Morning'   },
  { to: '/vision',    icon: Eye,             label: 'Vision'    },
  { to: '/goals',     icon: Target,          label: 'Goals'     },
  { to: '/systems',   icon: ArrowsClockwise, label: 'Systems'   },
  { to: '/habits',    icon: CheckSquare,     label: 'Habits'    },
  { to: '/journal',   icon: NotePencil,      label: 'Journal'   },
  { to: '/analytics', icon: ChartLineUp,     label: 'Analytics' },
  { to: '/settings',  icon: GearSix,         label: 'Settings'  },
];

/* ── Theme toggle ──────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" weight="bold" /> : <Moon className="h-4 w-4" weight="bold" />}
    </button>
  );
}

/* ── Sidebar ───────────────────────────────────────────────── */
function Sidebar({ onNewEvent, onClose }: { onNewEvent: () => void; onClose?: () => void }) {
  const location = useLocation();
  const { data: profile } = useProfile();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div className="app-sidebar flex flex-col h-full w-56 select-none">
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 shrink-0" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-primary flex items-center justify-center">
            <CalendarDots className="h-3.5 w-3.5 text-white" weight="bold" />
          </div>
          <span className="text-[15px] font-semibold text-foreground" style={{ letterSpacing: '-0.02em' }}>Scheduler</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New Event button */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button onClick={onNewEvent} className="btn-primary w-full h-9 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Event
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className={cn('nav-item', isActive(to) && 'nav-item-active')}
          >
            <Icon className="h-4 w-4 shrink-0" weight="bold" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate leading-tight" style={{ letterSpacing: '-0.01em' }}>
              {profile?.name || 'User'}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {format(new Date(), 'EEE, MMM d')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main layout ───────────────────────────────────────────── */
export default function AppLayout() {
  const [currentDate, setCurrentDate]         = useState(new Date());
  const [currentView, setCurrentView]         = useState('month');
  const [searchQuery, setSearchQuery]         = useState('');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate]       = useState<Date | null>(null);
  const [editingEventId, setEditingEventId]   = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds]   = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const location = useLocation();
  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  const handleNewEvent = () => {
    setSelectedDate(null);
    setEditingEventId(null);
    setShowEventDialog(true);
  };

  return (
    <AppContext.Provider value={{
      currentDate, setCurrentDate,
      currentView, setCurrentView,
      searchQuery, setSearchQuery,
      showEventDialog, setShowEventDialog,
      selectedDate, setSelectedDate,
      editingEventId, setEditingEventId,
      selectedTagIds, setSelectedTagIds,
    }}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">

        {/* Desktop sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar onNewEvent={handleNewEvent} />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-50 w-56 h-full animate-slide-in-right">
              <Sidebar onNewEvent={handleNewEvent} onClose={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Header — Apple-style frosted glass */}
          <header className="app-header h-12 flex items-center gap-3 px-4 shrink-0">
            <button
              className="md:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-md"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <List className="h-5 w-5" weight="bold" />
            </button>

            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 px-3 text-[13px] rounded-lg bg-input text-foreground placeholder:text-muted-foreground border border-transparent focus:border-primary/30 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>

            <div className="ml-auto flex items-center">
              <ThemeToggle />
            </div>
          </header>

          {/* Page */}
          <main className="flex-1 overflow-hidden">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden flex items-center justify-around px-1 h-14"
          style={{
            backgroundColor: 'hsl(var(--background) / 0.85)',
            backdropFilter: 'saturate(180%) blur(20px)',
            borderTop: '1px solid hsl(var(--border))',
          }}>
          {NAV.slice(0, 5).map(({ to, icon: Icon }) => {
            const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}>
                <Icon className="h-5 w-5" weight={active ? 'bold' : 'regular'} />
              </Link>
            );
          })}
          <button
            onClick={handleNewEvent}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white"
          >
            <Plus className="h-4 w-4" weight="bold" />
          </button>
        </nav>
      </div>
    </AppContext.Provider>
  );
}
