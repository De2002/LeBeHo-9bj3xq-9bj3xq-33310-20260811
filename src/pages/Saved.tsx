import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { ThoughtRow } from '@/components/features/ThoughtRow';
import { Thought } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Star, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function rowToThought(row: Record<string, unknown>, savedIds: Set<string>): Thought {
  const t = (row.thought as Record<string, unknown>) ?? {};
  const author = (t.author as Record<string, unknown>) ?? {};
  return {
    id: t.id as string,
    authorId: t.author_id as string,
    author: {
      username: (author.username as string) ?? 'unknown',
      displayName: (author.display_name as string) ?? '',
      avatar: (author.avatar_url as string) ?? '',
    },
    title: t.title as string,
    preview: ((t.body as string) ?? '').slice(0, 120),
    body: t.body as string,
    category: t.category as string,
    geo: {
      scope: (t.geo_scope as 'Global' | 'Country' | 'City') ?? 'Global',
      label: (t.geo_label as string) ?? 'Global',
    },
    imageUrl: (t.image_url as string) ?? undefined,
    publishedAt: t.published_at as string,
    agreeCount: (t.agree_count as number) ?? 0,
    disagreeCount: (t.disagree_count as number) ?? 0,
    discussionCount: (t.discussion_count as number) ?? 0,
    isRead: true,
    isSaved: savedIds.has(t.id as string),
    isDraft: false,
    tags: [],
  };
}

export default function Saved() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_thoughts')
      .select('thought_id, thought:thoughts(*, author:user_profiles(id, username, display_name, avatar_url))')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Saved fetch error:', error.message);
      setLoading(false);
      return;
    }

    const ids = new Set<string>((data ?? []).map(r => r.thought_id));
    setSavedIds(ids);
    setThoughts((data ?? [])
      .filter(r => r.thought)
      .map(r => rowToThought(r as Record<string, unknown>, ids))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const handleUnsave = async (id: string) => {
    if (!user) return;
    setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setThoughts(ts => ts.filter(t => t.id !== id));
    await supabase.from('saved_thoughts').delete().eq('user_id', user.id).eq('thought_id', id);
    toast.success('Removed from saved');
  };

  const handleOpen = (thought: Thought) => {
    navigate(`/thought/${thought.id}`);
  };

  return (
    <AppShell>
      <SEOHead title="Saved" noIndex />
      <div className="max-w-3xl mx-auto">
        <div className="px-6 pt-6 pb-4 border-b border-[hsl(var(--border-subtle))]">
          <h1 className="font-serif text-xl font-bold text-[hsl(var(--text-primary))] flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-[hsl(var(--accent-primary))]" fill="currentColor" />
            Saved
          </h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">Thoughts you've starred for later.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-6 h-6 text-[hsl(var(--text-muted))] animate-spin" />
            <p className="text-sm text-[hsl(var(--text-muted))]">Loading saved thoughts…</p>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Star className="w-12 h-12 text-[hsl(var(--text-muted))] mb-4" />
            <p className="font-serif text-lg text-[hsl(var(--text-secondary))] mb-1">Nothing saved yet</p>
            <p className="text-sm text-[hsl(var(--text-muted))]">Star any thought to save it here.</p>
          </div>
        ) : (
          thoughts.map(thought => (
            <ThoughtRow
              key={thought.id}
              thought={thought}
              onClick={() => handleOpen(thought)}
              onToggleSave={handleUnsave}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}
