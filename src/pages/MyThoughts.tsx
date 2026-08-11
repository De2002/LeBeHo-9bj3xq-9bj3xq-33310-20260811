import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { Thought } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Megaphone, ThumbsUp, ThumbsDown, MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import { cn, formatRelativeTime, getCategoryColor } from '@/lib/utils';
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

export default function MyThoughts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchMyThoughts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('author_id', user.id)
      .eq('is_draft', false)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('MyPoints fetch error:', error.message);
      setLoading(false);
      return;
    }
    setThoughts((data ?? []).map(r => rowToThought(r as Record<string, unknown>)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMyThoughts(); }, [fetchMyThoughts]);

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(prev => prev === id ? null : prev), 3000);
      return;
    }
    setThoughts(prev => prev.filter(t => t.id !== id));
    setDeleteConfirm(null);
    await supabase.from('thoughts').delete().eq('id', id);
    toast.success('Point deleted');
  };

  return (
    <AppShell>
      <SEOHead title="My Points" noIndex />
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 z-10 bg-[hsl(var(--background))]">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h1 className="font-serif text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
                My Points
              </h1>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                {loading ? '…' : `${thoughts.length} ${thoughts.length === 1 ? 'point' : 'points'} posted`}
              </p>
            </div>
            <button
              onClick={() => navigate('/compose')}
              className="flex items-center gap-1.5 text-xs bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] font-semibold px-3 py-1.5 rounded-full transition-colors hover:bg-[hsl(var(--accent-hover))]"
            >
              <Megaphone className="w-3.5 h-3.5" />
              Make a Point
            </button>
          </div>
          <div className="h-px bg-[hsl(var(--border-subtle))]" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-6 h-6 text-[hsl(var(--text-muted))] animate-spin" />
            <p className="text-sm text-[hsl(var(--text-muted))]">Loading your points…</p>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Megaphone className="w-12 h-12 text-[hsl(var(--text-muted))] mb-4" />
            <p className="font-serif text-lg text-[hsl(var(--text-secondary))] mb-2">No points posted yet</p>
            <p className="text-sm text-[hsl(var(--text-muted))] mb-6">What's on your mind? Be honest.</p>
            <button
              onClick={() => navigate('/compose')}
              className="flex items-center gap-2 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-fg))] font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              Make a Point
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border-subtle))]">
            {thoughts.map(t => (
              <div
                key={t.id}
                className="group px-5 py-4 hover:bg-[hsl(var(--surface-hover))] transition-colors cursor-pointer"
                onClick={() => navigate(`/thought/${t.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', getCategoryColor(t.category))}>
                        {t.category}
                      </span>
                      <span className="text-[11px] text-[hsl(var(--text-muted))]">{t.geo.label}</span>
                    </div>
                    <h3 className="font-serif text-[15px] font-bold text-[hsl(var(--text-primary))] leading-snug mb-1.5 line-clamp-2">
                      {t.title}
                    </h3>
                    <p className="text-xs text-[hsl(var(--text-muted))] line-clamp-2 mb-3">
                      {t.preview}
                    </p>
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
                      <span>{formatRelativeTime(t.publishedAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                    className={cn(
                      'flex-shrink-0 p-2 rounded-lg text-xs transition-all opacity-0 group-hover:opacity-100',
                      deleteConfirm === t.id
                        ? 'bg-red-500/15 text-red-400'
                        : 'text-[hsl(var(--text-muted))] hover:text-red-400 hover:bg-red-400/10'
                    )}
                    title={deleteConfirm === t.id ? 'Click again to confirm delete' : 'Delete point'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
