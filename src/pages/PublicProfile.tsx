import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Thought } from '@/types';
import { getCategoryColor, formatRelativeTime, cn } from '@/lib/utils';
import {
  UserPlus, UserCheck, Calendar, Megaphone, RefreshCw,
  ThumbsUp, ThumbsDown, MessageSquare, Globe, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  joinedAt: string;
  followerCount: number;
  followingCount: number;
  pointCount: number;
}

function rowToThought(row: Record<string, unknown>): Thought {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    author: { username: '', displayName: '', avatar: '' },
    title: row.title as string,
    preview: ((row.body as string) ?? '').slice(0, 120),
    body: row.body as string,
    category: row.category as string,
    geo: {
      scope: (row.geo_scope as 'Global' | 'Country' | 'City') ?? 'Global',
      label: (row.geo_label as string) ?? 'Global',
    },
    imageUrl: (row.image_url as string) ?? undefined,
    publishedAt: row.published_at as string,
    agreeCount: (row.agree_count as number) ?? 0,
    disagreeCount: (row.disagree_count as number) ?? 0,
    discussionCount: (row.discussion_count as number) ?? 0,
    isRead: true,
    isSaved: false,
    isDraft: false,
    tags: [],
  };
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isSelf = currentUser?.id === userId;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [profileRes, followersRes, followingRes, thoughtsRes, followCheckRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, username, display_name, bio, avatar_url, joined_at')
        .eq('id', userId)
        .single(),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId),
      supabase
        .from('thoughts')
        .select('*')
        .eq('author_id', userId)
        .eq('is_draft', false)
        .order('published_at', { ascending: false }),
      currentUser && !isSelf
        ? supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (profileRes.data) {
      const p = profileRes.data;
      setProfile({
        id: p.id,
        username: p.username ?? 'unknown',
        displayName: p.display_name ?? '',
        bio: p.bio ?? '',
        avatarUrl: p.avatar_url ?? null,
        joinedAt: p.joined_at ?? '',
        followerCount: followersRes.count ?? 0,
        followingCount: followingRes.count ?? 0,
        pointCount: (thoughtsRes.data ?? []).length,
      });
    }

    setThoughts((thoughtsRes.data ?? []).map(r => rowToThought(r as Record<string, unknown>)));
    setIsFollowing(!!followCheckRes.data);
    setLoading(false);
  }, [userId, currentUser, isSelf]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFollow = async () => {
    if (!currentUser) { navigate('/auth'); return; }
    if (!userId || isSelf) return;
    setFollowLoading(true);
    const next = !isFollowing;
    setIsFollowing(next);
    setProfile(p => p ? { ...p, followerCount: p.followerCount + (next ? 1 : -1) } : p);
    if (next) {
      await supabase.from('user_follows').upsert({ follower_id: currentUser.id, following_id: userId });
      toast.success(`Following @${profile?.username}`);
    } else {
      await supabase.from('user_follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
      toast.success(`Unfollowed @${profile?.username}`);
    }
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-6 h-6 animate-spin text-[hsl(var(--text-muted))]" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6 text-center">
          <p className="font-serif text-lg text-[hsl(var(--text-secondary))]">User not found</p>
          <button onClick={() => navigate(-1)} className="text-sm text-[hsl(var(--accent-primary))] hover:underline flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Go back
          </button>
        </div>
      </AppShell>
    );
  }

  const joinedDisplay = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';

  return (
    <AppShell>
      <SEOHead
        title={`${profile.displayName || profile.username} (@${profile.username}) — LeBeHo`}
        description={profile.bio || `${profile.displayName || profile.username}'s profile on LeBeHo — ${profile.pointCount} points published.`}
        url={`/profile/${profile.id}`}
        type="profile"
      />

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 lg:py-10">

        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile card */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden mb-6">
          {/* Header band */}
          <div className="h-20 bg-gradient-to-br from-[hsl(var(--accent-primary))]/20 via-[hsl(var(--surface))] to-[hsl(var(--border-subtle))]/30" />

          <div className="px-6 pb-6 -mt-10">
            {/* Avatar + actions row */}
            <div className="flex items-end justify-between gap-4 mb-4">
              <div className="ring-4 ring-[hsl(var(--surface))] rounded-full flex-shrink-0">
                <AvatarBubble
                  username={profile.username}
                  displayName={profile.displayName}
                  avatarUrl={profile.avatarUrl}
                  size="xl"
                />
              </div>

              {!isSelf ? (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                    isFollowing
                      ? 'border-[hsl(var(--accent-primary))]/40 bg-[hsl(var(--accent-primary))]/10 text-[hsl(var(--accent-primary))] hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
                      : 'bg-[hsl(var(--accent-primary))] border-transparent text-[hsl(var(--accent-fg))] hover:bg-[hsl(var(--accent-hover))]'
                  )}
                >
                  {followLoading
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : isFollowing
                      ? <><UserCheck className="w-4 h-4" /> Following</>
                      : <><UserPlus className="w-4 h-4" /> Follow</>
                  }
                </button>
              ) : (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors"
                >
                  Edit profile
                </button>
              )}
            </div>

            {/* Name + handle */}
            <div className="mb-3">
              <h1 className="font-serif text-xl font-bold text-[hsl(var(--text-primary))] leading-tight">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-sm text-[hsl(var(--accent-primary))] font-medium mt-0.5">
                @{profile.username}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed mb-4">
                {profile.bio}
              </p>
            )}

            {/* Joined date */}
            {joinedDisplay && (
              <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] mb-5">
                <Calendar className="w-3.5 h-3.5" />
                Joined {joinedDisplay}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[hsl(var(--border-subtle))]">
              {[
                { label: 'Points', value: profile.pointCount },
                { label: 'Followers', value: profile.followerCount },
                { label: 'Following', value: profile.followingCount },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-lg font-bold text-[hsl(var(--text-primary))]">{value}</div>
                  <div className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Points list */}
        <div>
          <h2 className="font-serif text-base font-bold text-[hsl(var(--text-primary))] flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-[hsl(var(--accent-primary))]" />
            Points by {profile.displayName || '@' + profile.username}
          </h2>

          {thoughts.length === 0 ? (
            <div className="text-center py-14 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl">
              <Globe className="w-9 h-9 text-[hsl(var(--text-muted))] mx-auto mb-3" />
              <p className="text-sm text-[hsl(var(--text-muted))]">No points published yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden">
              {thoughts.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/thought/${t.id}`)}
                  className="w-full text-left group px-5 py-4 hover:bg-[hsl(var(--surface-hover))] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', getCategoryColor(t.category))}>
                      {t.category}
                    </span>
                    <span className="text-[11px] text-[hsl(var(--text-muted))]">{t.geo.label}</span>
                    <span className="ml-auto text-[11px] text-[hsl(var(--text-muted))]">
                      {formatRelativeTime(t.publishedAt)}
                    </span>
                  </div>
                  <h3 className="font-serif text-[14px] font-bold text-[hsl(var(--text-primary))] leading-snug mb-2 line-clamp-2 group-hover:text-[hsl(var(--accent-primary))] transition-colors">
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--text-muted))]">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />{t.agreeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" />{t.disagreeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{t.discussionCount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
