import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Thought } from '@/types';
import { getCategoryColor, formatRelativeTime, cn } from '@/lib/utils';
import {
  PenLine, Calendar, Megaphone, Camera, RefreshCw, Save, X,
  ThumbsUp, ThumbsDown, MessageSquare, Settings, Globe,
} from 'lucide-react';
import { toast } from 'sonner';

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
    isDraft: (row.is_draft as boolean) ?? false,
    tags: [],
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loadingThoughts, setLoadingThoughts] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const username    = user?.username    ?? '';
  const displayName = user?.displayName ?? username;
  const avatarUrl   = user?.avatarUrl   ?? null;
  const joinedAt    = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';

  const fetchThoughts = useCallback(async () => {
    if (!user) return;
    setLoadingThoughts(true);
    const { data } = await supabase
      .from('thoughts')
      .select('*')
      .eq('author_id', user.id)
      .eq('is_draft', false)
      .order('published_at', { ascending: false });
    setThoughts((data ?? []).map(r => rowToThought(r as Record<string, unknown>)));
    setLoadingThoughts(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
    ]);
    setFollowerCount(followers ?? 0);
    setFollowingCount(following ?? 0);
  }, [user]);

  useEffect(() => {
    fetchThoughts();
    fetchStats();
  }, [fetchThoughts, fetchStats]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }

    setUploadingAvatar(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { setUploadingAvatar(false); toast.error('Upload failed. Please try again.'); return; }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: dbError } = await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    if (dbError) { setUploadingAvatar(false); toast.error('Could not save avatar'); return; }

    await refreshProfile();
    setUploadingAvatar(false);
    toast.success('Profile photo updated');
  };

  const handleSaveBio = async () => {
    if (!user) return;
    setSavingBio(true);
    const { error } = await supabase.from('user_profiles').update({ bio: bio.trim() }).eq('id', user.id);
    setSavingBio(false);
    if (error) { toast.error('Failed to save bio'); return; }
    await refreshProfile();
    setEditingBio(false);
    toast.success('Bio updated');
  };

  const totalAgree = thoughts.reduce((s, t) => s + t.agreeCount, 0);
  const totalDisagree = thoughts.reduce((s, t) => s + t.disagreeCount, 0);
  const totalComments = thoughts.reduce((s, t) => s + t.discussionCount, 0);

  return (
    <AppShell>
      <SEOHead title="My Profile" noIndex />
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 lg:py-10">

        {/* Profile hero card */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden mb-5">
          {/* Gradient header band */}
          <div className="h-24 bg-gradient-to-br from-[hsl(var(--accent-primary))]/25 via-[hsl(var(--surface))] to-[hsl(var(--border-subtle))]/20 relative">
            <button
              onClick={() => navigate('/settings')}
              className="absolute top-3 right-3 p-2 rounded-xl bg-[hsl(var(--background))]/60 backdrop-blur-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 sm:px-6 pb-6 -mt-12">
            {/* Avatar row */}
            <div className="flex items-end justify-between gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <div className="ring-4 ring-[hsl(var(--surface))] rounded-full">
                  <AvatarBubble username={username} displayName={displayName} avatarUrl={avatarUrl} size="xl" />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] flex items-center justify-center shadow-md hover:bg-[hsl(var(--accent-hover))] transition-colors border-2 border-[hsl(var(--surface))]"
                  title="Change photo"
                >
                  {uploadingAvatar ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <button
                onClick={() => navigate('/compose')}
                className="flex items-center gap-1.5 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-fg))] text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <Megaphone className="w-3.5 h-3.5" /> Make a Point
              </button>
            </div>

            {/* Name + handle */}
            <div className="mb-2">
              <h1 className="font-serif text-xl font-bold text-[hsl(var(--text-primary))] leading-tight">{displayName}</h1>
              <p className="text-sm text-[hsl(var(--accent-primary))] font-medium">@{username}</p>
            </div>

            {/* Bio */}
            {editingBio ? (
              <div className="mb-4">
                <textarea
                  className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--text-primary))] outline-none focus:border-[hsl(var(--accent-primary))]/50 resize-none transition-colors"
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 160))}
                  rows={2}
                  autoFocus
                  maxLength={160}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-[hsl(var(--text-muted))]">{bio.length}/160</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingBio(false); setBio(user?.bio ?? ''); }} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button onClick={handleSaveBio} disabled={savingBio} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] font-semibold hover:bg-[hsl(var(--accent-hover))] disabled:opacity-60 transition-colors">
                      {savingBio ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                {user?.bio ? (
                  <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{user.bio}</p>
                ) : (
                  <p className="text-sm text-[hsl(var(--text-muted))] italic">No bio yet.</p>
                )}
                <button onClick={() => { setBio(user?.bio ?? ''); setEditingBio(true); }} className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent-primary))] transition-colors mt-1.5 inline-flex items-center gap-1">
                  <PenLine className="w-3 h-3" /> Edit bio
                </button>
              </div>
            )}

            {/* Joined date */}
            {joinedAt && (
              <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] mb-5">
                <Calendar className="w-3.5 h-3.5" /> Joined {joinedAt}
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[hsl(var(--border-subtle))]">
              {[
                { label: 'Points', value: loadingThoughts ? '…' : thoughts.length },
                { label: 'Followers', value: followerCount },
                { label: 'Following', value: followingCount },
              ].map(({ label, value }) => (
                <div key={label} className="text-center py-2 rounded-xl hover:bg-[hsl(var(--nav-hover-bg))] transition-colors cursor-default">
                  <div className="text-lg font-bold text-[hsl(var(--text-primary))]">{value}</div>
                  <div className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement summary */}
        {!loadingThoughts && thoughts.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: ThumbsUp, label: 'Agrees', value: totalAgree, color: 'text-[hsl(var(--accent-primary))]' },
              { icon: ThumbsDown, label: 'Disagrees', value: totalDisagree, color: 'text-red-400' },
              { icon: MessageSquare, label: 'Comments', value: totalComments, color: 'text-[hsl(var(--text-secondary))]' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center justify-center gap-1 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl py-3">
                <Icon className={cn('w-4 h-4', color)} />
                <span className="text-base font-bold text-[hsl(var(--text-primary))]">{value}</span>
                <span className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* My points */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base font-semibold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[hsl(var(--accent-primary))]" />
              My Points
              {!loadingThoughts && (
                <span className="text-xs font-normal text-[hsl(var(--text-muted))] ml-1">({thoughts.length})</span>
              )}
            </h2>
          </div>

          {loadingThoughts ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 text-[hsl(var(--text-muted))] animate-spin" />
            </div>
          ) : thoughts.length === 0 ? (
            <div className="text-center py-14 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl">
              <Globe className="w-10 h-10 text-[hsl(var(--text-muted))] mx-auto mb-3" />
              <p className="text-[hsl(var(--text-muted))] mb-4 text-sm">Nothing posted yet</p>
              <button onClick={() => navigate('/compose')} className="flex items-center gap-2 mx-auto bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-fg))] text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                <PenLine className="w-4 h-4" /> Make your first point
              </button>
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
                    <span className="ml-auto text-[11px] text-[hsl(var(--text-muted))]">{formatRelativeTime(t.publishedAt)}</span>
                  </div>
                  <h3 className="font-serif text-[14px] font-bold text-[hsl(var(--text-primary))] leading-snug mb-2 line-clamp-2 group-hover:text-[hsl(var(--accent-primary))] transition-colors">
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--text-muted))]">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{t.agreeCount}</span>
                    <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3" />{t.disagreeCount}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{t.discussionCount}</span>
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
