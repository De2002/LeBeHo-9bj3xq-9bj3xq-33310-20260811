import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { Thought } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
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
    agreeCount: 0,
    disagreeCount: 0,
    discussionCount: 0,
    isRead: true,
    isSaved: false,
    isDraft: true,
    tags: [],
  };
}

export default function Drafts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('author_id', user.id)
      .eq('is_draft', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Drafts fetch error:', error.message);
      setLoading(false);
      return;
    }
    setDrafts((data ?? []).map(r => rowToThought(r as Record<string, unknown>)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(prev => prev === id ? null : prev), 3000);
      return;
    }
    setDrafts(prev => prev.filter(d => d.id !== id));
    setDeleteConfirm(null);
    await supabase.from('thoughts').delete().eq('id', id);
    toast.success('Draft deleted');
  };

  return (
    <AppShell>
      <SEOHead title="Drafts" noIndex />
      <div className="max-w-3xl mx-auto">
        <div className="px-6 pt-6 pb-4 border-b border-[hsl(var(--border-subtle))]">
          <h1 className="font-serif text-xl font-bold text-[hsl(var(--text-primary))] flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
            Drafts
          </h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">Thoughts you're still working on.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-6 h-6 text-[hsl(var(--text-muted))] animate-spin" />
            <p className="text-sm text-[hsl(var(--text-muted))]">Loading drafts…</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText className="w-12 h-12 text-[hsl(var(--text-muted))] mb-4" />
            <p className="font-serif text-lg text-[hsl(var(--text-secondary))] mb-1">No drafts</p>
            <p className="text-sm text-[hsl(var(--text-muted))]">Save a thought as a draft to continue later.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border-subtle))]">
            {drafts.map(draft => (
              <div
                key={draft.id}
                className="group flex items-start gap-3 px-6 py-4 hover:bg-[hsl(var(--row-read-hover))] transition-colors"
              >
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/compose?draft=${draft.id}`)}>
                  <p className="text-sm font-semibold text-[hsl(var(--text-primary))] mb-0.5 truncate">
                    {draft.title || 'Untitled draft'}
                  </p>
                  <p className="text-xs text-[hsl(var(--text-muted))] truncate mb-1">
                    {draft.preview || 'Empty draft'}
                  </p>
                  <p className="text-xs text-[hsl(var(--text-muted))]">
                    Last edited {formatRelativeTime(draft.publishedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/compose?draft=${draft.id}`)}
                    className="p-2 rounded-lg text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--nav-hover-bg))] transition-colors"
                    title="Edit draft"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className={cn_inline(
                      'p-2 rounded-lg transition-colors',
                      deleteConfirm === draft.id
                        ? 'text-red-400 bg-red-400/10'
                        : 'text-[hsl(var(--text-muted))] hover:text-red-400 hover:bg-red-400/10'
                    )}
                    title={deleteConfirm === draft.id ? 'Click again to confirm' : 'Delete draft'}
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

// inline cn helper to avoid extra import
function cn_inline(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
