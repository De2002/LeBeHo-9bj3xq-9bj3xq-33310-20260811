import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { Thought, Category, CATEGORIES } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { Globe, Search, List, LayoutGrid, MessageSquare, Star, X, RefreshCw, LogIn } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORY_IMAGE_SEEDS: Record<string, string> = {
  'Life': 'lifestyle,philosophy', 'Relationships': 'couple,connection',
  'Family': 'family,together', 'Friendship': 'friends,laughing',
  'Work & Career': 'office,career', 'Money': 'finance,money',
  'Education': 'education,books', 'Society': 'city,society',
  'Culture': 'culture,art', 'Politics': 'government,politics',
  'Technology': 'technology,digital', 'Health & Wellbeing': 'health,wellness',
  'Entertainment': 'entertainment,music', 'Travel & Places': 'travel,landscape',
  'Beliefs & Values': 'meditation,spirituality', 'Personal': 'journal,writing',
  'Economy': 'economy,finance', 'Science': 'science,research',
  'Environment': 'nature,environment', 'Philosophy': 'philosophy,thought',
  'Religion': 'religion,faith', 'Sports': 'sports,athlete',
  'Art': 'art,creative', 'History': 'history,museum', 'Business': 'business,corporate',
  'Travel': 'travel,adventure', 'Food': 'food,cuisine', 'Other': 'abstract,minimal',
};

function getThumbUrl(thought: Thought): string {
  if (thought.imageUrl) return thought.imageUrl;
  const keywords = CATEGORY_IMAGE_SEEDS[thought.category] ?? 'abstract';
  const seed = thought.id.replace(/\D/g, '').slice(0, 4) || '42';
  return `https://source.unsplash.com/320x240/?${encodeURIComponent(keywords)}&sig=${seed}`;
}

function getCategoryAccentText(category: string): string {
  const map: Record<string, string> = {
    'Relationships': 'text-rose-500 dark:text-rose-400',
    'Family': 'text-orange-500 dark:text-orange-400',
    'Friendship': 'text-yellow-600 dark:text-yellow-400',
    'Work & Career': 'text-blue-600 dark:text-blue-400',
    'Money': 'text-green-600 dark:text-green-400',
    'Education': 'text-cyan-600 dark:text-cyan-400',
    'Society': 'text-purple-600 dark:text-purple-400',
    'Culture': 'text-pink-600 dark:text-pink-400',
    'Politics': 'text-red-600 dark:text-red-400',
    'Technology': 'text-indigo-600 dark:text-indigo-400',
    'Health & Wellbeing': 'text-emerald-600 dark:text-emerald-400',
    'Entertainment': 'text-fuchsia-600 dark:text-fuchsia-400',
    'Travel & Places': 'text-teal-600 dark:text-teal-400',
    'Beliefs & Values': 'text-violet-600 dark:text-violet-400',
    'Life': 'text-amber-600 dark:text-amber-400',
    'Personal': 'text-stone-600 dark:text-stone-400',
    'Other': 'text-neutral-600 dark:text-neutral-400',
  };
  return map[category] ?? 'text-[hsl(var(--accent-primary))]';
}

function rowToThought(row: Record<string, unknown>, savedIds: Set<string>): Thought {
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
    isRead: true,
    isSaved: savedIds.has(row.id as string),
    isDraft: false,
    tags: [],
  };
}

const SAVED_KEY = 'lebelho_saved_ids';
function getSavedIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')); } catch { return new Set(); }
}
function persistSaved(ids: Set<string>) { localStorage.setItem(SAVED_KEY, JSON.stringify([...ids])); }

type ViewMode = 'list' | 'grid';

interface ExploreRowProps {
  thought: Thought;
  onClick: () => void;
  onToggleSave: (id: string) => void;
  isGuest: boolean;
}

function GuestPrompt({ onSignUp }: { onSignUp: () => void }) {
  return (
    <div className="fixed inset-x-4 bottom-20 sm:bottom-6 z-50 mx-auto max-w-sm bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-4 shadow-2xl text-center">
      <p className="text-sm font-semibold text-[hsl(var(--text-primary))] mb-1">Want to join the conversation?</p>
      <p className="text-xs text-[hsl(var(--text-muted))] mb-3">Create a free pseudonymous LeBeHo account.</p>
      <button
        onClick={onSignUp}
        className="w-full py-2 rounded-xl bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] font-semibold text-sm hover:bg-[hsl(var(--accent-hover))] transition-colors"
      >
        Create free account
      </button>
    </div>
  );
}

function ExploreListRow({ thought, onClick, onToggleSave, isGuest }: ExploreRowProps) {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) { setShowPrompt(true); return; }
    onToggleSave(thought.id);
  };

  return (
    <>
      <div className="group flex gap-0 border-b border-[hsl(var(--row-border))] cursor-pointer hover:bg-[hsl(var(--surface-hover))] transition-colors duration-150" onClick={onClick}>
        <div className="flex-shrink-0 w-[130px] sm:w-[160px] self-stretch">
          <img src={getThumbUrl(thought)} alt="" className="w-full h-full object-cover" style={{ minHeight: '100px', maxHeight: '140px' }} loading="lazy" />
        </div>
        <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-between gap-2">
          <span className={cn('text-xs font-semibold tracking-wide', getCategoryAccentText(thought.category))}>
            {thought.category}
          </span>
          <h3 className="font-serif text-[15px] sm:text-base font-bold text-[hsl(var(--text-primary))] leading-snug line-clamp-3">
            {thought.title}
          </h3>
          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-1.5 min-w-0">
              <AvatarBubble username={thought.author.username} displayName={thought.author.displayName} avatarUrl={thought.author.avatar || null} size="sm" />
              <span className="text-xs text-[hsl(var(--text-muted))] truncate">@{thought.author.username}</span>
              <span className="text-[11px] text-[hsl(var(--text-muted))]/50 hidden sm:inline">· {formatRelativeTime(thought.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-0.5 text-xs text-[hsl(var(--text-muted))]">
                <MessageSquare className="w-3 h-3" />{thought.discussionCount}
              </span>
              <button
                className={cn('p-1 rounded transition-colors', thought.isSaved ? 'text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-muted))]/40 group-hover:text-[hsl(var(--text-muted))]')}
                onClick={handleSave}
              >
                <Star className="w-3.5 h-3.5" fill={thought.isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showPrompt && <GuestPrompt onSignUp={() => navigate('/auth')} />}
    </>
  );
}

function ExploreGridCard({ thought, onClick, onToggleSave, isGuest }: ExploreRowProps) {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) { setShowPrompt(true); return; }
    onToggleSave(thought.id);
  };

  return (
    <>
      <div className="group bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden cursor-pointer hover:border-[hsl(var(--accent-primary))]/30 transition-all duration-200" onClick={onClick}>
        <div className="aspect-video overflow-hidden">
          <img src={getThumbUrl(thought)} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
        </div>
        <div className="p-4">
          <span className={cn('text-xs font-semibold tracking-wide', getCategoryAccentText(thought.category))}>{thought.category}</span>
          <h3 className="font-serif text-[14px] font-bold text-[hsl(var(--text-primary))] leading-snug mt-1.5 mb-3 line-clamp-2">{thought.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AvatarBubble username={thought.author.username} displayName={thought.author.displayName} avatarUrl={thought.author.avatar || null} size="sm" />
              <span className="text-xs text-[hsl(var(--text-muted))]">@{thought.author.username}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--text-muted))]">
              <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{thought.discussionCount}</span>
              <button
                className={cn('p-0.5 rounded transition-colors', thought.isSaved ? 'text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-muted))]/40 group-hover:text-[hsl(var(--text-muted))]')}
                onClick={handleSave}
              >
                <Star className="w-3.5 h-3.5" fill={thought.isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showPrompt && <GuestPrompt onSignUp={() => navigate('/auth')} />}
    </>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user;
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIdsState] = useState<Set<string>>(getSavedIds);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchFocused, setSearchFocused] = useState(false);
  const [displayTopics, setDisplayTopics] = useState<string[]>([]);
  const [userHasTopics, setUserHasTopics] = useState(false);

  // Load user's topic interests (or platform defaults for guests)
  useEffect(() => {
    const loadTopics = async () => {
      if (!user) {
        // For guests, load all platform topics
        const { data } = await supabase
          .from('platform_topics')
          .select('label')
          .order('sort_order', { ascending: true });
        if (data && data.length > 0) {
          setDisplayTopics(data.map(d => d.label));
        } else {
          setDisplayTopics([...CATEGORIES]);
        }
        return;
      }
      // For logged-in users, load their selected topics
      const { data } = await supabase
        .from('user_topic_interests')
        .select('topics')
        .eq('user_id', user.id)
        .single();

      if (data?.topics && Array.isArray(data.topics) && data.topics.length > 0) {
        setDisplayTopics(data.topics as string[]);
        setUserHasTopics(true);
      } else {
        // Fallback to platform topics
        const { data: platformData } = await supabase
          .from('platform_topics')
          .select('label')
          .order('sort_order', { ascending: true });
        if (platformData && platformData.length > 0) {
          setDisplayTopics(platformData.map(d => d.label));
        } else {
          setDisplayTopics([...CATEGORIES]);
        }
        setUserHasTopics(false);
      }
    };
    loadTopics();
  }, [user]);

  // Load saved IDs from DB for logged-in users
  useEffect(() => {
    if (!user) return;
    supabase.from('saved_thoughts').select('thought_id').eq('user_id', user.id).then(({ data }) => {
      if (data) {
        const ids = new Set(data.map(r => r.thought_id as string));
        setSavedIdsState(ids);
        persistSaved(ids);
      }
    });
  }, [user]);

  const fetchThoughts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('thoughts')
      .select('*, author:user_profiles(id, username, display_name, avatar_url)')
      .eq('is_draft', false)
      .order('published_at', { ascending: false })
      .limit(200);

    if (error) { console.error('Explore fetch error:', error.message); setLoading(false); return; }
    const saved = getSavedIds();
    setThoughts((data ?? []).map(r => rowToThought(r as Record<string, unknown>, saved)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchThoughts(); }, [fetchThoughts]);

  const handleSave = async (id: string) => {
    if (!user) return;
    const isSaved = savedIds.has(id);
    const next = new Set(savedIds);
    isSaved ? next.delete(id) : next.add(id);
    setSavedIdsState(next);
    persistSaved(next);
    setThoughts(ts => ts.map(t => t.id === id ? { ...t, isSaved: !isSaved } : t));
    if (isSaved) {
      await supabase.from('saved_thoughts').delete().eq('user_id', user.id).eq('thought_id', id);
    } else {
      await supabase.from('saved_thoughts').upsert({ user_id: user.id, thought_id: id });
    }
  };

  const filtered = thoughts
    .filter(t => {
      // Filter content by selected category pill first
      if (selectedCategory && t.category !== selectedCategory) return false;
      // If user has topic interests and no specific pill chosen, filter feed to those topics
      if (!selectedCategory && userHasTopics && displayTopics.length > 0) {
        if (!displayTopics.includes(t.category)) return false;
      }
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
          !t.preview.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (b.agreeCount + b.disagreeCount) - (a.agreeCount + a.disagreeCount));

  return (
    <AppShell>
      <SEOHead
        title="Explore Points"
        description="Discover honest opinions on life, society, politics, technology, relationships and more from people around the world on LeBeHo."
        url="/explore"
      />
      <div className="max-w-2xl lg:max-w-3xl mx-auto">
        {/* Sticky toolbar */}
        <div className="sticky top-0 z-10 bg-[hsl(var(--background))]">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-full p-0.5 flex-shrink-0">
              <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-full transition-colors', viewMode === 'list' ? 'bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))]' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')} title="List view"><List className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-full transition-colors', viewMode === 'grid' ? 'bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))]' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')} title="Grid view"><LayoutGrid className="w-3.5 h-3.5" /></button>
            </div>

            {/* Category filter pills — user's selected topics */}
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1.5 w-max">
                <button onClick={() => setSelectedCategory('')} className={cn('flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors', selectedCategory === '' ? 'bg-[hsl(var(--accent-primary))]/15 border-[hsl(var(--accent-primary))]/30 text-[hsl(var(--accent-primary))]' : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')}>
                  All
                </button>
                {displayTopics.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat as Category)}
                    className={cn('flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors', selectedCategory === cat ? 'bg-[hsl(var(--accent-primary))]/15 border-[hsl(var(--accent-primary))]/30 text-[hsl(var(--accent-primary))]' : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search icon */}
            <button onClick={() => setSearchFocused(v => !v)} className={cn('flex-shrink-0 p-2 rounded-full transition-colors', searchFocused ? 'bg-[hsl(var(--accent-primary))]/15 text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))]')}>
              <Search className="w-4 h-4" />
            </button>
          </div>

          {searchFocused && (
            <div className="px-4 pb-2">
              <div className="flex items-center bg-[hsl(var(--input-bg))] border border-[hsl(var(--accent-primary))]/30 rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-[hsl(var(--accent-primary))] mr-2 flex-shrink-0" />
                <input autoFocus className="flex-1 bg-transparent text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none" placeholder="Search points..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch('')} className="text-[hsl(var(--text-muted))]"><X className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          )}

          <div className="h-px bg-[hsl(var(--border-subtle))]" />
        </div>

        {/* Guest banner */}
        {isGuest && (
          <div className="mx-4 my-3 flex items-center justify-between gap-3 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3">
            <p className="text-xs text-[hsl(var(--text-secondary))]">
              <span className="font-semibold text-[hsl(var(--text-primary))]">Browsing as guest.</span> Sign up to vote, comment, and save.
            </p>
            <button onClick={() => navigate('/auth')} className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] hover:bg-[hsl(var(--accent-hover))] transition-colors">
              <LogIn className="w-3 h-3" /> Sign up
            </button>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-6 h-6 text-[hsl(var(--text-muted))] animate-spin" />
            <p className="text-sm text-[hsl(var(--text-muted))]">Loading points…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Globe className="w-10 h-10 text-[hsl(var(--text-muted))] mx-auto mb-3" />
            <p className="font-serif text-[hsl(var(--text-secondary))]">No points found</p>
            <p className="text-sm text-[hsl(var(--text-muted))] mt-1">{selectedCategory || search ? 'Try a different filter' : 'Be the first to share a point.'}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div>{filtered.map(thought => <ExploreListRow key={thought.id} thought={thought} onClick={() => navigate(`/thought/${thought.id}`)} onToggleSave={handleSave} isGuest={isGuest} />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-4 lg:px-6">
            {filtered.map(thought => <ExploreGridCard key={thought.id} thought={thought} onClick={() => navigate(`/thought/${thought.id}`)} onToggleSave={handleSave} isGuest={isGuest} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
