import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime, cn } from '@/lib/utils';
import { Bell, MessageSquare, UserPlus, CornerDownRight, RefreshCw, Inbox } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface Notification {
  id: string;
  type: 'new_comment' | 'new_follower' | 'reply';
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  thought: {
    id: string;
    title: string;
  } | null;
  comment: {
    id: string;
    body: string;
  } | null;
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  if (type === 'new_follower') return <UserPlus className="w-4 h-4 text-blue-400" />;
  if (type === 'reply') return <CornerDownRight className="w-4 h-4 text-violet-400" />;
  return <MessageSquare className="w-4 h-4 text-emerald-400" />;
}

function notifText(n: Notification): string {
  const name = n.actor?.display_name || n.actor?.username || 'Someone';
  if (n.type === 'new_follower') return `${name} started following you`;
  if (n.type === 'reply') return `${name} replied to your comment`;
  return `${name} commented on your point`;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { resetCount } = useNotifications();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndMarkRead = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('notifications')
      .select(`
        id, type, is_read, created_at,
        actor:user_profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url),
        thought:thoughts(id, title),
        comment:comments(id, body)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(60);

    setNotifs((data ?? []) as unknown as Notification[]);
    setLoading(false);
    resetCount();

    // Mark all as read
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }, [user]);

  useEffect(() => { fetchAndMarkRead(); }, [fetchAndMarkRead]);

  const handleClick = (n: Notification) => {
    if (n.type === 'new_follower' && n.actor) {
      navigate(`/profile/${n.actor.id}`);
    } else if (n.thought) {
      navigate(`/thought/${n.thought.id}`);
    }
  };

  return (
    <AppShell>
      <SEOHead title="Notifications" noIndex />
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
          <h1 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))]">Activity</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin text-[hsl(var(--text-muted))]" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl">
            <Inbox className="w-10 h-10 text-[hsl(var(--text-muted))] mx-auto mb-3" />
            <p className="font-semibold text-[hsl(var(--text-primary))] mb-1">All quiet here</p>
            <p className="text-sm text-[hsl(var(--text-muted))]">New followers, comments, and replies will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden">
            {notifs.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  'w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-[hsl(var(--surface-hover))] transition-colors',
                  !n.is_read && 'bg-[hsl(var(--accent-primary))]/5'
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {n.actor ? (
                    <AvatarBubble
                      username={n.actor.username}
                      displayName={n.actor.display_name ?? ''}
                      avatarUrl={n.actor.avatar_url}
                      size="md"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[hsl(var(--border-subtle))]" />
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[hsl(var(--background))] flex items-center justify-center">
                    <NotificationIcon type={n.type} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[hsl(var(--text-primary))] leading-snug">
                    <span className="font-semibold">{notifText(n)}</span>
                    {n.thought && (
                      <span className="text-[hsl(var(--text-muted))] font-normal">
                        {' · '}<span className="italic line-clamp-1">{n.thought.title}</span>
                      </span>
                    )}
                  </p>
                  {n.comment && (
                    <p className="text-xs text-[hsl(var(--text-muted))] mt-1 line-clamp-1 italic">
                      "{n.comment.body}"
                    </p>
                  )}
                  <p className="text-[11px] text-[hsl(var(--text-muted))]/70 mt-1">
                    {formatRelativeTime(n.created_at)}
                  </p>
                </div>

                {!n.is_read && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[hsl(var(--accent-primary))] mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
