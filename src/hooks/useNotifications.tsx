import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bell, UserPlus, MessageSquare, CornerDownRight } from 'lucide-react';

interface NotificationContextValue {
  unreadCount: number;
  resetCount: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  resetCount: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenRef = useRef<string | null>(null);
  const isFirstPoll = useRef(true);

  const resetCount = useCallback(() => setUnreadCount(0), []);

  const poll = useCallback(async () => {
    if (!user) return;

    const { data, count } = await supabase
      .from('notifications')
      .select('id, type, created_at, actor:user_profiles!notifications_actor_id_fkey(username, display_name), thought:thoughts(title)', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    const total = count ?? 0;

    // On the very first poll, just record state — don't toast
    if (isFirstPoll.current) {
      isFirstPoll.current = false;
      setUnreadCount(total);
      if (data && data.length > 0) {
        lastSeenRef.current = (data[0] as Record<string, unknown>).id as string;
      }
      return;
    }

    setUnreadCount(total);

    if (!data || data.length === 0) return;

    const newest = data[0] as Record<string, unknown>;
    const newestId = newest.id as string;

    // Only toast if there's a genuinely new notification since last check
    if (newestId === lastSeenRef.current) return;
    lastSeenRef.current = newestId;

    const type = newest.type as string;
    const actor = (newest.actor as Record<string, unknown>) ?? {};
    const thought = (newest.thought as Record<string, unknown>) ?? {};
    const actorName = (actor.display_name as string) || (actor.username as string) || 'Someone';
    const thoughtTitle = (thought.title as string) ?? '';

    let message = '';
    let Icon = Bell;

    if (type === 'new_follower') {
      message = `${actorName} started following you`;
      Icon = UserPlus;
    } else if (type === 'reply') {
      message = `${actorName} replied to your comment`;
      Icon = CornerDownRight;
    } else {
      message = thoughtTitle
        ? `${actorName} commented on "${thoughtTitle.slice(0, 40)}${thoughtTitle.length > 40 ? '…' : ''}"`
        : `${actorName} commented on your point`;
      Icon = MessageSquare;
    }

    toast(message, {
      icon: <Icon className="w-4 h-4 text-[hsl(var(--accent-primary))]" />,
      action: {
        label: 'View',
        onClick: () => navigate('/notifications'),
      },
      duration: 5000,
    });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      isFirstPoll.current = true;
      lastSeenRef.current = null;
      return;
    }

    // Immediate poll on mount / user change
    poll();

    // Poll every 60 seconds
    const interval = setInterval(poll, 60_000);
    return () => clearInterval(interval);
  }, [user, poll]);

  return (
    <NotificationContext.Provider value={{ unreadCount, resetCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
