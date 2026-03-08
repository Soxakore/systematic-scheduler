import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import AppLayout from "@/components/AppLayout";
import CalendarPage from "@/pages/CalendarPage";
import SystemsPage from "@/pages/SystemsPage";
import CalendarsPage from "@/pages/CalendarsPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import ResetPasswordPage from "@/pages/ResetPassword";
import AgendaView from "@/components/calendar/AgendaView";
import WeeklyReviewPage from "@/pages/WeeklyReviewPage";
import DashboardPage from "@/pages/DashboardPage";
import HabitsPage from "@/pages/HabitsPage";
import TemplatesPage from "@/pages/TemplatesPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import GoalsPage from "@/pages/GoalsPage";
import MorningBriefingPage from "@/pages/MorningBriefingPage";
import JournalPage from "@/pages/JournalPage";
import VisionBoardPage from "@/pages/VisionBoardPage";
import SharingPage from "@/pages/SharingPage";
import EventDialog from "@/components/EventDialog";
import LandingPage from "@/pages/LandingPage";
import TermsPage from "@/pages/TermsPage";
import CookiePolicyPage from "@/pages/CookiePolicyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<CalendarPage />} />
        <Route path="systems" element={<SystemsPage />} />
        <Route path="calendars" element={<CalendarsPage />} />
        <Route path="agenda" element={<AgendaView />} />
        <Route path="review" element={<WeeklyReviewPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="morning" element={<MorningBriefingPage />} />
        <Route path="briefing" element={<Navigate to="/morning" replace />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="vision" element={<VisionBoardPage />} />
        <Route path="sharing" element={<SharingPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
