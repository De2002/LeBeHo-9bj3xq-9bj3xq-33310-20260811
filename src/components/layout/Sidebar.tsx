import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { useTheme } from '@/components/features/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Inbox, Globe, Users, Star, Megaphone, FileText, PenSquare,
  Settings, Sun, Moon, LogOut, Bell
} from 'lucide-react';
import { toast } from 'sonner';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

interface NavItemDef {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const username    = user?.username    ?? 'you';
  const displayName = user?.displayName ?? user?.username ?? 'You';
  const avatarUrl   = user?.avatarUrl   ?? null;

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
    toast.success('Signed out');
  };

  const NAV_ITEMS: NavItemDef[] = [
    { to: '/inbox',         label: 'Inbox',        icon: Inbox },
    { to: '/explore',       label: 'Explore',      icon: Globe },
    { to: '/notifications', label: 'Activity',     icon: Bell, badge: unreadCount },
    { to: '/following',     label: 'Following',    icon: Users },
    { to: '/saved',         label: 'Saved',        icon: Star },
    { to: '/my-thoughts',   label: 'My Points',    icon: PenSquare },
    { to: '/drafts',        label: 'Drafts',       icon: FileText },
    { to: '/settings',      label: 'Settings',     icon: Settings },
  ];

  return (
    <aside className="flex flex-col h-full w-64 bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--border-subtle))] select-none">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[hsl(var(--border-subtle))]">
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-2xl font-bold text-[hsl(var(--accent-primary))]">Le</span>
          <span className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))]">BeHo</span>
        </div>
        <p className="text-[10px] text-[hsl(var(--text-muted))] tracking-widest uppercase mt-0.5">
          Let's Be Honest.
        </p>
      </div>

      {/* Make a Point button */}
      <div className="px-4 py-4">
        <button
          onClick={() => navigate('/compose')}
          className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-fg))] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors duration-150"
        >
          <Megaphone className="w-4 h-4" />
          Make a Point
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-[hsl(var(--nav-active-bg))] text-[hsl(var(--nav-active-fg))]'
                : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))] hover:text-[hsl(var(--text-primary))]'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
            {badge !== undefined && <Badge count={badge} />}
          </NavLink>
        ))}
      </nav>

      {/* User profile footer */}
      <div className="border-t border-[hsl(var(--border-subtle))] px-3 py-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2.5 cursor-pointer hover:bg-[hsl(var(--nav-hover-bg))] rounded-lg px-2 py-2 transition-colors min-w-0" onClick={() => navigate('/profile')}>
          <AvatarBubble username={username} displayName={displayName} avatarUrl={avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[hsl(var(--text-primary))] truncate">{displayName}</div>
            <div className="text-xs text-[hsl(var(--text-muted))] truncate">@{username}</div>
          </div>
        </div>
        <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--nav-hover-bg))] transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={handleLogout} title="Sign out" className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[hsl(var(--text-muted))] hover:text-red-400 hover:bg-red-400/10 transition-colors"><LogOut className="w-4 h-4" /></button>
      </div>
    </aside>
  );
}
