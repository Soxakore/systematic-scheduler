import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';
import { List, X, Plus, CalendarDots, Sun, Moon, SignOut, Camera } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

/* ── 3D badge icon imports ─────────────────────────────────── */
import icoCalendar  from '@/assets/icons/icon-calendar.svg';
import icoDashboard from '@/assets/icons/icon-dashboard.svg';
import icoMorning   from '@/assets/icons/icon-morning.svg';
import icoVision    from '@/assets/icons/icon-vision.svg';
import icoGoals     from '@/assets/icons/icon-goals.svg';
import icoSystems   from '@/assets/icons/icon-systems.svg';
import icoHabits    from '@/assets/icons/icon-habits.svg';
import icoJournal   from '@/assets/icons/icon-journal.svg';
import icoAnalytics from '@/assets/icons/icon-analytics.svg';
import icoSettings  from '@/assets/icons/icon-settings.svg';

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

/* ── Nav items (3D badge icons) ─────────────────────────────── */
const NAV = [
  { to: '/',          badge: icoCalendar,  label: 'Calendar'  },
  { to: '/dashboard', badge: icoDashboard, label: 'Dashboard' },
  { to: '/morning',   badge: icoMorning,   label: 'Morning'   },
  { to: '/vision',    badge: icoVision,    label: 'Vision'    },
  { to: '/goals',     badge: icoGoals,     label: 'Goals'     },
  { to: '/systems',   badge: icoSystems,   label: 'Systems'   },
  { to: '/habits',    badge: icoHabits,    label: 'Habits'    },
  { to: '/journal',   badge: icoJournal,   label: 'Journal'   },
  { to: '/analytics', badge: icoAnalytics, label: 'Analytics' },
  { to: '/settings',  badge: icoSettings,  label: 'Settings'  },
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
function Sidebar({ onNewEvent, onClose, onSignOut }: { onNewEvent: () => void; onClose?: () => void; onSignOut: () => void }) {
  const location = useLocation();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload avatar');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl + '?t=' + Date.now() } as any)
      .eq('id', user.id);

    if (updateError) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile picture updated');
      refetchProfile();
    }
  };

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
        {NAV.map(({ to, badge, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={cn(
                'nav-item group relative',
                active && 'nav-item-active'
              )}
            >
              {/* 3D badge icon */}
              <span className={cn(
                'relative shrink-0 rounded-[8px] transition-all duration-200',
                active
                  ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-[hsl(var(--background))]'
                  : 'opacity-80 group-hover:opacity-100'
              )}>
                <img
                  src={badge}
                  alt={label}
                  width={22}
                  height={22}
                  className={cn(
                    'block rounded-[6px] transition-transform duration-200',
                    active ? 'scale-105' : 'group-hover:scale-105'
                  )}
                />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer with sign out */}
      <div className="px-3 pb-3 pt-2 shrink-0 space-y-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-2.5 px-1">
          {/* Avatar with upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group w-8 h-8 rounded-full shrink-0 overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[12px] font-semibold text-white">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-3.5 w-3.5 text-white" weight="bold" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-foreground truncate leading-tight" style={{ letterSpacing: '-0.01em' }}>
              {profile?.name || 'User'}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {format(new Date(), 'EEE, MMM d')}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <SignOut className="h-3.5 w-3.5" weight="bold" />
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ── Main layout ───────────────────────────────────────────── */
export default function AppLayout() {
  const { data: profile } = useProfile();
  const [currentDate, setCurrentDate]         = useState(new Date());
  const [currentView, setCurrentView]         = useState('month');
  const [searchQuery, setSearchQuery]         = useState('');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate]       = useState<Date | null>(null);
  const [editingEventId, setEditingEventId]   = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds]   = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  const handleNewEvent = () => {
    setSelectedDate(null);
    setEditingEventId(null);
    setShowEventDialog(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
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
        <div className={cn('hidden md:flex shrink-0 transition-all duration-300', sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-56')}>
          <Sidebar onNewEvent={handleNewEvent} onSignOut={handleSignOut} />
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative z-50 w-56 h-full"
              >
                <Sidebar onNewEvent={handleNewEvent} onClose={() => setMobileSidebarOpen(false)} onSignOut={handleSignOut} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
            <button
              className="hidden md:flex text-muted-foreground hover:text-foreground p-1.5 rounded-md"
              onClick={() => setSidebarCollapsed(prev => !prev)}
              aria-label="Toggle sidebar"
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
          {NAV.slice(0, 5).map(({ to, badge, label }) => {
            const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                active ? 'scale-105' : 'opacity-60 hover:opacity-90'
              )}>
                <img src={badge} alt={label} width={28} height={28} className={cn(
                  'rounded-[7px] transition-all duration-200',
                  active ? 'ring-2 ring-primary/60 ring-offset-1 ring-offset-black' : ''
                )}/>
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
