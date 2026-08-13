import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime, cn } from '@/lib/utils';
import { Bell, MessageSquare, UserPlus, CornerDownRight, RefreshCw, Inbox, CheckCheck, ArrowUpRight } from 'lucide-react';
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
  thought: { id: string; title: string } | null;
  comment: { id: string; body: string } | null;
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  if (type === 'new_follower') return <UserPlus className="h-4 w-4" />;
  if (type === 'reply') return <CornerDownRight className="h-4 w-4" />;
  return <MessageSquare className="h-4 w-4" />;
}

function activityLabel(type: Notification['type']) {
  if (type === 'new_follower') return 'New follower';
  if (type === 'reply') return 'Reply';
  return 'Comment';
}

function notifText(n: Notification): string {
  const name = n.actor?.display_name || n.actor?.username || 'Someone';
  if (n.type === 'new_follower') return `${name} started following you`;
  if (n.type === 'reply') return `${name} replied to your comment`;
  return `${name} commented on your point`;
}

function ActivityItem({ notification, onClick }: { notification: Notification; onClick: () => void }) {
  const { actor, thought, comment } = notification;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-start gap-4 px-4 py-5 text-left transition-colors sm:px-6',
        'hover:bg-[hsl(var(--surface-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--accent-primary))]',
        !notification.is_read && 'bg-[hsl(var(--accent-primary))]/[0.045]'
      )}
    >
      <div className="relative shrink-0">
        {actor ? (
          <AvatarBubble username={actor.username} displayName={actor.display_name ?? ''} avatarUrl={actor.avatar_url} size="md" />
        ) : (
          <div className="h-11 w-11 rounded-full bg-[hsl(var(--border-subtle))]" />
        )}
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[hsl(var(--surface))] bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))]">
          <NotificationIcon type={notification.type} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[15px] leading-6 text-[hsl(var(--text-primary))]">
            <span className="font-semibold">{notifText(notification)}</span>
          </p>
          <span className="shrink-0 pt-0.5 text-xs text-[hsl(var(--text-muted))]">{formatRelativeTime(notification.created_at)}</span>
        </div>
        <span className="mt-1 inline-flex items-center rounded-full bg-[hsl(var(--input-bg))] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--text-muted))]">
          {activityLabel(notification.type)}
        </span>
        {thought && (
          <p className="mt-3 line-clamp-1 text-sm italic text-[hsl(var(--text-secondary))]">{thought.title}</p>
        )}
        {comment && (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[hsl(var(--text-muted))]">&quot;{comment.body}&quot;</p>
        )}
      </div>
      <ArrowUpRight className="mt-1 hidden h-4 w-4 shrink-0 text-[hsl(var(--text-muted))] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
      {!notification.is_read && <span className="absolute left-1 top-7 h-2 w-2 rounded-full bg-[hsl(var(--accent-primary))] sm:left-2" aria-label="Unread" />}
    </button>
  );
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
      .select(`id, type, is_read, created_at, actor:user_profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url), thought:thoughts(id, title), comment:comments(id, body)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(60);
    setNotifs((data ?? []) as unknown as Notification[]);
    setLoading(false);
    resetCount();
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  }, [user, resetCount]);

  useEffect(() => { fetchAndMarkRead(); }, [fetchAndMarkRead]);

  const handleClick = (n: Notification) => {
    if (n.type === 'new_follower' && n.actor) navigate(`/profile/${n.actor.id}`);
    else if (n.thought) navigate(`/thought/${n.thought.id}`);
  };

  const comments = notifs.filter(n => n.type !== 'new_follower');
  const follows = notifs.filter(n => n.type === 'new_follower');

  return (
    <AppShell>
      <SEOHead title="Activity" noIndex />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <header className="mb-7 flex items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--text-muted))]">Your updates</p>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[hsl(var(--text-primary))]">Activity</h1>
            </div>
          </div>
          {notifs.length > 0 && <span className="hidden items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] sm:flex"><CheckCheck className="h-4 w-4" /> All caught up</span>}
        </header>

        {loading ? (
          <div className="flex justify-center rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] py-20"><RefreshCw className="h-5 w-5 animate-spin text-[hsl(var(--text-muted))]" /></div>
        ) : notifs.length === 0 ? (
          <div className="rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] px-6 py-20 text-center">
            <Inbox className="mx-auto mb-4 h-10 w-10 text-[hsl(var(--text-muted))]" />
            <p className="font-semibold text-[hsl(var(--text-primary))]">All quiet here</p>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-[hsl(var(--text-muted))]">New followers, comments, and replies will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.length > 0 && (
              <section aria-labelledby="conversation-heading">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 id="conversation-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--text-muted))]">Conversations</h2>
                  <span className="text-xs text-[hsl(var(--text-muted))]">{comments.length}</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] shadow-sm">
                  {comments.map(n => <ActivityItem key={n.id} notification={n} onClick={() => handleClick(n)} />)}
                </div>
              </section>
            )}
            {follows.length > 0 && (
              <section aria-labelledby="people-heading">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 id="people-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--text-muted))]">People</h2>
                  <span className="text-xs text-[hsl(var(--text-muted))]">{follows.length}</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] shadow-sm">
                  {follows.map(n => <ActivityItem key={n.id} notification={n} onClick={() => handleClick(n)} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
