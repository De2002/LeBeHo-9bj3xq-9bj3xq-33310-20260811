import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { ThoughtRow } from '@/components/features/ThoughtRow';
import { Thought, Category, CATEGORIES } from '@/types';
import { getInboxBg } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Search, RefreshCw, Inbox as InboxIcon, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type InboxTab = 'all' | 'unread' | 'saved';

function rowToThought(row: Record<string, unknown>, savedIds: Set<string>, readIds: Set<string>): Thought {
  const author = (row.author as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    author: {
      username: (author.username as string) ?? 'unknown',
      displayName: (author.display_name as string) ?? '',
      avatar: (author.avatar_url as string) ?? '',
    },
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
    isRead: readIds.has(row.id as string),
    isSaved: savedIds.has(row.id as string),
    isDraft: (row.is_draft as boolean) ?? false,
    tags: [],
  };
}

const SAVED_KEY = 'lebelho_saved_ids';
const READ_KEY  = 'lebelho_read_ids';
const CLEAR_KEY = 'lebelho_inbox_cleared_at';

function getSavedIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')); } catch { return new Set(); }
}
function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]')); } catch { return new Set(); }
}
function persistSaved(ids: Set<string>) { localStorage.setItem(SAVED_KEY, JSON.stringify([...ids])); }
function persistRead(ids: Set<string>)  { localStorage.setItem(READ_KEY,  JSON.stringify([...ids])); }
function getClearedAt(): string | null { return localStorage.getItem(CLEAR_KEY); }
function persistClearedAt(iso: string) { localStorage.setItem(CLEAR_KEY, iso); }

export default function Inbox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIdsState] = useState<Set<string>>(getSavedIds);
  const [readIds,  setReadIdsState]  = useState<Set<string>>(getReadIds);
  const [tab, setTab] = useState<InboxTab>('all');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [inboxBg] = useState(() => getInboxBg());
  const [clearConfirm, setClearConfirm] = useState(false);

  const fetchThoughts = useCallback(async () => {
    setLoading(true);
    const clearedAt = getClearedAt();

    if (!user) {
      setThoughts([]);
      setLoading(false);
      return;
    }

    const { data: follows, error: followsError } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followsError) {
      console.error('Inbox follows fetch error:', followsError.message);
      setThoughts([]);
      setLoading(false);
      return;
    }

    const followedIds = [...new Set((follows ?? [])
      .map(row => row.following_id as string)
      .filter(id => Boolean(id) && id !== user.id))];

    if (followedIds.length === 0) {
      setThoughts([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('thoughts')
      .select('*, author:user_profiles(id, username, display_name, avatar_url)')
      .eq('is_draft', false)
      .in('author_id', followedIds)
      .order('published_at', { ascending: false })
      .limit(100);

    // If user has cleared inbox, only fetch thoughts published AFTER the clear time
    if (clearedAt) {
      query = query.gt('published_at', clearedAt);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Inbox fetch error:', error.message);
      setLoading(false);
      return;
    }

    const saved = getSavedIds();
    const read  = getReadIds();
    setThoughts((data ?? []).map(r => rowToThought(r as Record<string, unknown>, saved, read)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchThoughts(); }, [fetchThoughts]);

  const handleSave = async (id: string) => {
    if (!user) return;
    const isSaved = savedIds.has(id);
    setSavedIdsState(prev => {
      const next = new Set(prev);
      if (isSaved) {
        next.delete(id);
      } else {
        next.add(id);
      }
      persistSaved(next);
      setThoughts(ts => ts.map(t => t.id === id ? { ...t, isSaved: !isSaved } : t));
      return next;
    });
    if (isSaved) {
      await supabase.from('saved_thoughts').delete().eq('user_id', user.id).eq('thought_id', id);
    } else {
      await supabase.from('saved_thoughts').upsert({ user_id: user.id, thought_id: id });
    }
  };

  const handleOpen = (thought: Thought) => {
    setReadIdsState(prev => {
      const next = new Set(prev);
      next.add(thought.id);
      persistRead(next);
      setThoughts(ts => ts.map(t => t.id === thought.id ? { ...t, isRead: true } : t));
      return next;
    });
    navigate(`/thought/${thought.id}`);
  };

  const markAllRead = () => {
    setReadIdsState(prev => {
      const next = new Set(prev);
      thoughts.forEach(t => next.add(t.id));
      persistRead(next);
      setThoughts(ts => ts.map(t => ({ ...t, isRead: true })));
      return next;
    });
  };

  const handleClearInbox = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3500);
      return;
    }
    const now = new Date().toISOString();
    persistClearedAt(now);
    setThoughts([]);
    setClearConfirm(false);
    toast.success('Inbox cleared — new thoughts will appear as they arrive');
  };

  const filtered = thoughts.filter(t => {
    if (tab === 'unread' && t.isRead) return false;
    if (tab === 'saved' && !t.isSaved) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.author.username.toLowerCase().includes(search.toLowerCase()) &&
        !t.preview.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = thoughts.filter(t => !t.isRead).length;

  return (
    <AppShell>
      <SEOHead
        title="Inbox"
        description="Your personalized inbox of honest opinions from people and topics you follow on LeBeHo."
        url="/inbox"
        noIndex
      />
      <div
        className="max-w-3xl mx-auto relative min-h-screen"
        style={inboxBg.imageUrl ? {
          backgroundImage: `url(${inboxBg.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {inboxBg.imageUrl && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ backgroundColor: `rgba(0,0,0,${1 - inboxBg.opacity})` }}
          />
        )}

        <div className="relative z-[1]">
          {/* Toolbar strip */}
          <div className="sticky top-0 z-10 bg-[hsl(var(--background))]/90 backdrop-blur-sm">

            <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-3">
              {/* Tabs */}
              <div className="flex items-center gap-0.5 bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-full p-0.5">
                {(['all', 'unread', 'saved'] as InboxTab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-150',
                      tab === t
                        ? 'bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] shadow-sm'
                        : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]'
                    )}
                  >
                    {t}
                    {t === 'unread' && unreadCount > 0 && (
                      <span className={cn(
                        'ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        tab === 'unread'
                          ? 'bg-[hsl(var(--accent-fg))]/20 text-[hsl(var(--accent-fg))]'
                          : 'bg-[hsl(var(--accent-primary))]/15 text-[hsl(var(--accent-primary))]'
                      )}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setSearchFocused(v => !v)}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    searchFocused
                      ? 'bg-[hsl(var(--accent-primary))]/15 text-[hsl(var(--accent-primary))]'
                      : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))]'
                  )}
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Clear inbox button */}
                <button
                  onClick={handleClearInbox}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                    clearConfirm
                      ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                      : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:border-red-500/30 hover:text-red-400'
                  )}
                  title="Clear inbox"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{clearConfirm ? 'Confirm clear?' : 'Clear'}</span>
                </button>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-2 rounded-full text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))] transition-colors"
                    title="Mark all read"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {searchFocused && (
              <div className="px-4 pb-2">
                <div className="flex items-center bg-[hsl(var(--input-bg))] border border-[hsl(var(--accent-primary))]/30 rounded-xl px-3 py-2.5 transition-colors">
                  <Search className="w-4 h-4 text-[hsl(var(--accent-primary))] mr-2 flex-shrink-0" />
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none"
                    placeholder="Search thoughts, people, topics..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="h-px bg-[hsl(var(--border-subtle))]" />
          </div>

          {/* Thought list */}
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <RefreshCw className="w-6 h-6 text-[hsl(var(--text-muted))] animate-spin" />
                <p className="text-sm text-[hsl(var(--text-muted))]">Loading thoughts…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <InboxIcon className="w-12 h-12 text-[hsl(var(--text-muted))] mb-4" />
                <p className="font-serif text-lg text-[hsl(var(--text-secondary))] mb-1">Nothing here</p>
                <p className="text-sm text-[hsl(var(--text-muted))]">
                  {tab === 'unread' ? 'All caught up.' : tab === 'saved' ? 'Star a thought to save it.' : 'No published thoughts yet. Be the first to share.'}
                </p>
              </div>
            ) : (
              filtered.map(thought => (
                <ThoughtRow
                  key={thought.id}
                  thought={thought}
                  onClick={() => handleOpen(thought)}
                  onToggleSave={handleSave}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
