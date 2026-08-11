import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/features/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/hooks/useNotifications";
import { ProtectedRoute } from "@/components/features/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Inbox from "./pages/Inbox";
import Explore from "./pages/Explore";
import Following from "./pages/Following";
import Saved from "./pages/Saved";
import MyThoughts from "./pages/MyThoughts";
import Drafts from "./pages/Drafts";
import ThoughtDetail from "./pages/ThoughtDetail";
import Compose from "./pages/Compose";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import Guidelines from "./pages/Guidelines";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import { useState, useEffect, useRef } from 'react';

// Paths excluded from route-transition loader
const LOADER_EXCLUDED = new Set(['/', '/welcome', '/auth', '/onboarding']);

function NavigationLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (LOADER_EXCLUDED.has(location.pathname)) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-[hsl(var(--background))] flex flex-col items-center justify-center gap-6 pointer-events-none">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-baseline gap-0.5">
          <span className="font-serif text-4xl font-bold text-[hsl(var(--accent-primary))]">Le</span>
          <span className="font-serif text-4xl font-bold text-[hsl(var(--text-primary))]">BeHo</span>
        </div>
        <p className="text-xs text-[hsl(var(--text-muted))] tracking-widest uppercase">Let's Be Honest.</p>
        <div className="mt-3 w-48 h-0.5 bg-[hsl(var(--border-subtle))] rounded-full overflow-hidden">
          <div className="h-full bg-[hsl(var(--accent-primary))] rounded-full" style={{ animation: 'navLoadBar 1.1s ease-in-out infinite' }} />
        </div>
      </div>
      <style>{`@keyframes navLoadBar{0%{width:0%;margin-left:0%}50%{width:55%;margin-left:22%}100%{width:0%;margin-left:100%}}`}</style>
    </div>
  );
}

// Redirect authenticated users away from welcome/auth pages
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/inbox" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NotificationProvider>
              <NavigationLoader />
              <Routes>
                {/* Public — no auth required */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthRedirect><AuthPage /></AuthRedirect>} />
                <Route path="/welcome" element={<AuthRedirect><Welcome /></AuthRedirect>} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/guidelines" element={<Guidelines />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />

                {/* Semi-public — accessible without auth (guest mode) */}
                <Route path="/explore" element={<Explore />} />
                <Route path="/thought/:id" element={<ThoughtDetail />} />
                <Route path="/profile/:userId" element={<PublicProfile />} />

                {/* Protected — require auth */}
                <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                <Route path="/following" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
                <Route path="/my-thoughts" element={<ProtectedRoute><MyThoughts /></ProtectedRoute>} />
                <Route path="/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
                <Route path="/compose" element={<ProtectedRoute><Compose /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
