import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/features/ThemeProvider';
import lebehoIconDark from '@/assets/lebeho-icon-dark.png';
import lebehoIconLight from '@/assets/lebeho-icon-light.png';

interface AppShellProps {
  children: ReactNode;
  hideDefaultMobileHeader?: boolean;
}

export function AppShell({ children, hideDefaultMobileHeader }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] overflow-hidden">
      {/* Desktop sidebar: authenticated users only; guests see a blurred preview with sign-up CTA */}
      <div className="hidden lg:flex flex-shrink-0 relative">
        {user ? <Sidebar /> : (
          <div className="relative h-full w-64 overflow-hidden">
            <div className="pointer-events-none select-none blur-sm opacity-60">
              <Sidebar />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--sidebar-bg))]/70 px-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-semibold text-[hsl(var(--text-primary))]">Join LeBeHo to explore your space</p>
                <button onClick={() => navigate('/auth')} className="rounded-lg bg-[hsl(var(--accent-primary))] px-4 py-2 text-xs font-semibold text-[hsl(var(--accent-fg))] hover:bg-[hsl(var(--accent-hover))] transition-colors">Sign up</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar — hidden when page provides its own header */}
        {!hideDefaultMobileHeader && (
          <div className="lg:hidden flex items-center justify-between px-3 py-3 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--sidebar-bg))]">
            {/* Hamburger — far left */}
            <button
              onClick={() => user && setSidebarOpen(true)}
              className="p-2 rounded-lg text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))] transition-colors disabled:opacity-40"
              aria-label={user ? 'Open menu' : 'Menu unavailable for guests'}
              disabled={!user}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand — centered */}
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5" aria-label="Go to LeBeHo home">
              <img
                src={theme === 'dark' ? lebehoIconLight : lebehoIconDark}
                alt=""
                className={`w-6 h-6 object-contain flex-shrink-0${theme === 'dark' ? ' invert' : ''}`}
              />
              <div className="flex items-baseline gap-0.5">
                <span className="font-serif text-xl font-bold text-[hsl(var(--accent-primary))]">Le</span>
                <span className="font-serif text-xl font-bold text-[hsl(var(--text-primary))]">BeHo</span>
              </div>
            </button>

            {/* Sign out / Sign up — far right */}
            {user ? (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-[hsl(var(--text-muted))] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] text-xs font-semibold hover:bg-[hsl(var(--accent-hover))] transition-colors"
                aria-label="Sign up"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign up
              </button>
            )}
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
