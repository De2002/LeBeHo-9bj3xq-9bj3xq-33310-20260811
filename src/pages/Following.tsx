import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Users, UserMinus, MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

interface FollowedUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  thoughtCount: number;
  latestThought: string | null;
  joinedAt: string;
}

export default function Following() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowConfirm, setUnfollowConfirm] = useState<string | null>(null);

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id, profile:user_profiles!user_follows_following_id_fkey(id, username, display_name, bio, avatar_url, joined_at)')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Following fetch error:', error.message);
      setLoading(false);
      return;
    }

    const profileIds = (data ?? []).map(r => (r.profile as Record<string, unknown>)?.id as string).filter(Boolean);

    // Fetch thought counts and latest thought for each followed user
    const enriched: FollowedUser[] = await Promise.all(
      (data ?? []).map(async (row) => {
        const p = (row.profile as Record<string, unknown>) ?? {};
        const uid = p.id as string;

        const { count } = await supabase
          .from('thoughts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', uid)
          .eq('is_draft', false);

        const { data: latest } = await supabase
          .from('thoughts')
          .select('title')
          .eq('author_id', uid)
          .eq('is_draft', false)
          .order('published_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: uid,
          username: (p.username as string) ?? 'unknown',
          displayName: (p.display_name as string) ?? '',
          bio: (p.bio as string) ?? '',
          avatarUrl: (p.avatar_url as string) ?? null,
          thoughtCount: count ?? 0,
          latestThought: latest?.title ?? null,
          joinedAt: (p.joined_at as string) ?? '',
        };
      })
    );

    setFollowedUsers(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFollowing(); }, [fetchFollowing]);

  const handleUnfollow = async (fu: FollowedUser) => {
    if (!user) return;
    if (unfollowConfirm !== fu.id) {
      setUnfollowConfirm(fu.id);
      setTimeout(() => setUnfollowConfirm(prev => prev === fu.id ? null : prev), 3000);
      return;
    }
    setFollowedUsers(prev => prev.filter(u => u.id !== fu.id));
    setUnfollowConfirm(null);
    await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', fu.id);
    toast.success(`Unfollowed @${fu.username}`);
  };

  return (
    <AppShell>
      <SEOHead title="Following" noIndex />
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[hsl(var(--background))]">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h1 className="font-serif text-lg font-bold text-[hsl(var(--text-primary))]">Following</h1>
              <p className="text-xs text-[hsl(var(--text-muted))]">
                {loading ? '…' : `${followedUsers.length} ${followedUsers.length === 1 ? 'person' : 'people'} you follow`}
              </p>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] border border-[hsl(var(--border-subtle))] px-3 py-1.5 rounded-full transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Discover people
            </button>
          </div>
          <div className="h-px bg-[hsl(var(--border-subtle))]" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-6 h-6 text-[hsl(var(--text-muted))] animate-spin" />
            <p className="text-sm text-[hsl(var(--text-muted))]">Loading…</p>
          </div>
        ) : followedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] flex items-center justify-center mb-5">
              <Users className="w-7 h-7 text-[hsl(var(--text-muted))]" />
            </div>
            <p className="font-serif text-lg text-[hsl(var(--text-primary))] mb-1">No one followed yet</p>
            <p className="text-sm text-[hsl(var(--text-muted))] mb-6">
              Explore thoughts and follow thinkers whose honesty you respect.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="flex items-center gap-2 bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors hover:bg-[hsl(var(--accent-hover))]"
            >
              <ExternalLink className="w-4 h-4" />
              Explore thoughts
            </button>
          </div>
        ) : (
          <div>
            {followedUsers.map(fu => (
              <div
                key={fu.id}
                className="group flex items-start gap-4 px-5 py-5 border-b border-[hsl(var(--row-border))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
              >
                <AvatarBubble
                  username={fu.username}
                  displayName={fu.displayName}
                  avatarUrl={fu.avatarUrl}
                  size="lg"
                  className="flex-shrink-0 mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[15px] font-semibold text-[hsl(var(--text-primary))] leading-snug">
                          {fu.displayName || fu.username}
                        </span>
                        <span className="text-sm text-[hsl(var(--text-muted))]">@{fu.username}</span>
                      </div>
                      {fu.joinedAt && (
                        <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                          Joined {new Date(fu.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleUnfollow(fu)}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
                        unfollowConfirm === fu.id
                          ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                          : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:border-red-500/40 hover:text-red-400 opacity-0 group-hover:opacity-100'
                      )}
                    >
                      <UserMinus className="w-3 h-3" />
                      {unfollowConfirm === fu.id ? 'Tap to confirm' : 'Unfollow'}
                    </button>
                  </div>

                  {fu.bio && (
                    <p className="text-sm text-[hsl(var(--text-secondary))] mt-2 leading-relaxed line-clamp-2">
                      {fu.bio}
                    </p>
                  )}

                  {fu.latestThought && (
                    <div className="mt-3 pl-3 border-l-2 border-[hsl(var(--border-subtle))]">
                      <p className="text-xs text-[hsl(var(--text-muted))] italic line-clamp-1">
                        "{fu.latestThought}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="flex items-center gap-1 text-xs text-[hsl(var(--text-muted))]">
                      <MessageSquare className="w-3 h-3" />
                      {fu.thoughtCount} {fu.thoughtCount === 1 ? 'thought' : 'thoughts'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="px-5 py-4 text-center">
              <p className="text-xs text-[hsl(var(--text-muted))]">
                {followedUsers.length} {followedUsers.length === 1 ? 'person' : 'people'} followed
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
