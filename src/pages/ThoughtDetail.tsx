import { useState, useEffect, useRef, useCallback } from 'react';
import type { TouchEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SEOHead } from '@/components/features/SEOHead';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { Thought } from '@/types';
import { formatRelativeTime, getCategoryColor, cn } from '@/lib/utils';
import {
  Star, ThumbsUp, ThumbsDown, MessageSquare, Share2, UserPlus, UserCheck,
  X, ChevronUp, Send, MoreHorizontal, ChevronLeft, ChevronRight, Menu, RefreshCw,
  Maximize2, Minimize2,
  CornerDownRight, Shield, Flag, ChevronDown, ArrowUpDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ─── Markdown renderer ─────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="font-serif text-lg font-bold text-[hsl(var(--text-primary))] mt-5 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="font-serif text-xl font-bold text-[hsl(var(--text-primary))] mt-6 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mt-6 mb-3">$1</h1>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-2 border-[hsl(var(--accent-primary))]/40 pl-4 italic text-[hsl(var(--text-muted))] my-3">$1</blockquote>')
    .replace(/^[-*] (.*$)/gm, '<li class="ml-4 list-disc text-[hsl(var(--text-secondary))]">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-[hsl(var(--text-secondary))]">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-[hsl(var(--text-secondary))]">')
    .replace(/\n/g, '<br/>');
}

// ─── Detail-page header ────────────────────────────────────────────────────
function DetailHeader({ onMenuOpen, canOpenMenu }: { onMenuOpen: () => void; canOpenMenu: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="lg:hidden flex items-center justify-between px-3 py-3 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--sidebar-bg))] flex-shrink-0">
      <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))] transition-colors" aria-label="Go back">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="font-serif text-base font-bold text-[hsl(var(--accent-primary))]">Let's Be Honest</span>
      <button onClick={onMenuOpen} disabled={!canOpenMenu} className="p-2 rounded-lg text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))] transition-colors disabled:opacity-40" aria-label={canOpenMenu ? 'Open menu' : 'Menu unavailable for guests'}>
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── For You strip (fetches real thoughts) ────────────────────────────────
interface ForYouItem { id: string; username: string; avatarUrl: string | null; title: string; category: string; }

function ForYouStrip() {
  const [items, setItems] = useState<ForYouItem[]>([]);
  const navigate = useNavigate();
  const { id: currentId } = useParams<{ id: string }>();

  useEffect(() => {
    supabase.from('thoughts')
      .select('id, title, category, author:user_profiles(username, avatar_url)')
      .eq('is_draft', false)
      .neq('id', currentId ?? '')
      .order('published_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data) setItems(data.map((r: Record<string, unknown>) => {
          const a = (r.author as Record<string, unknown>) ?? {};
          return {
            id: r.id as string,
            username: (a.username as string) ?? 'unknown',
            avatarUrl: (a.avatar_url as string) ?? null,
            title: r.title as string,
            category: r.category as string,
          };
        }));
      });
  }, [currentId]);

  if (items.length === 0) return null;

  return (
    <div className="sticky top-0 z-20 bg-[hsl(var(--background))] border-b border-[hsl(var(--border-subtle))] flex-shrink-0">
      <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest flex-shrink-0">For You</span>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(`/thought/${item.id}`)}
            className="flex-shrink-0 flex items-center gap-2 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl px-3 py-1.5 hover:border-[hsl(var(--accent-primary))]/30 transition-colors group"
          >
            <AvatarBubble username={item.username} avatarUrl={item.avatarUrl} size="sm" />
            <div className="text-left max-w-[140px]">
              <p className="text-[11px] text-[hsl(var(--text-primary))] font-medium truncate leading-snug group-hover:text-[hsl(var(--accent-primary))] transition-colors">
                {item.title}
              </p>
              <p className="text-[10px] text-[hsl(var(--text-muted))] truncate">{item.category}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Comment types ─────────────────────────────────────────────────────────
interface Comment {
  id: string;
  thoughtId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string | null;
  body: string;
  agree: boolean | null;
  parentId: string | null;
  likesCount: number;
  createdAt: string;
  replies: Comment[];
}

function dbRowToComment(row: Record<string, unknown>): Comment {
  const author = (row.author as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    thoughtId: row.thought_id as string,
    authorId: row.author_id as string,
    authorUsername: (author.username as string) ?? 'unknown',
    authorDisplayName: (author.display_name as string) ?? '',
    authorAvatar: (author.avatar_url as string) ?? null,
    body: row.body as string,
    agree: row.agree as boolean | null,
    parentId: (row.parent_id as string) ?? null,
    likesCount: (row.likes_count as number) ?? 0,
    createdAt: row.created_at as string,
    replies: [],
  };
}

function nestComments(flat: Comment[]): Comment[] {
  const byId = new Map<string, Comment>();
  flat.forEach(c => byId.set(c.id, { ...c, replies: [] }));
  const roots: Comment[] = [];
  byId.forEach(c => {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

// ─── Meatball report menu ─────────────────────────────────────────────────
const REPORT_REASONS = ['Hate speech', 'Harassment', 'Misinformation', 'Spam', 'Other violation'];

function ReportMenu({ commentId, onClose, currentUserId }: { commentId: string; onClose: () => void; currentUserId?: string; }) {
  const [step, setStep] = useState<'menu' | 'report' | 'done'>('menu');
  const [selectedReason, setSelectedReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const handleReport = async () => {
    if (!selectedReason || !currentUserId) return;
    setSubmitting(true);
    await supabase.from('comment_reports').upsert({ comment_id: commentId, reporter_id: currentUserId, reason: selectedReason });
    setSubmitting(false);
    setStep('done');
    setTimeout(onClose, 1500);
  };

  return (
    <div ref={ref} className="absolute right-0 top-6 z-30 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl shadow-xl min-w-[180px] overflow-hidden">
      {step === 'menu' && (
        <div className="py-1">
          <button onClick={() => setStep('report')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <Flag className="w-3.5 h-3.5" /> Report comment
          </button>
        </div>
      )}
      {step === 'report' && (
        <div className="p-3">
          <p className="text-xs font-semibold text-[hsl(var(--text-primary))] mb-2">Why are you reporting this?</p>
          <div className="space-y-1 mb-3">
            {REPORT_REASONS.map(r => (
              <button key={r} onClick={() => setSelectedReason(r)}
                className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors', selectedReason === r ? 'bg-[hsl(var(--accent-primary))]/15 text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))]')}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={handleReport} disabled={!selectedReason || submitting}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      )}
      {step === 'done' && (
        <div className="px-4 py-3 text-center">
          <p className="text-xs font-semibold text-emerald-400">Reported — thank you</p>
          <p className="text-[10px] text-[hsl(var(--text-muted))] mt-0.5">We'll review this comment.</p>
        </div>
      )}
    </div>
  );
}

// ─── Collapsible comment body ─────────────────────────────────────────────
function CommentBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = body.length > 240;
  const displayBody = isLong && !expanded ? body.slice(0, 240) + '…' : body;

  return (
    <div>
      <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed mb-1 whitespace-pre-wrap">{displayBody}</p>
      {isLong && (
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-[hsl(var(--accent-primary))]/70 hover:text-[hsl(var(--accent-primary))] transition-colors">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

// ─── Single comment item ───────────────────────────────────────────────────
function CommentItem({
  comment,
  depth = 0,
  onReply,
  currentUserId,
}: {
  comment: Comment;
  depth?: number;
  onReply: (parentId: string, username: string) => void;
  currentUserId?: string;
}) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(comment.likesCount);
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  // Load whether user has liked this comment
  useEffect(() => {
    if (!currentUserId) return;
    supabase.from('comment_likes').select('id', { count: 'exact', head: true })
      .eq('comment_id', comment.id).eq('user_id', currentUserId)
      .then(({ count }) => { if ((count ?? 0) > 0) setLiked(true); });
  }, [comment.id, currentUserId]);

  const toggleLike = async () => {
    if (!currentUserId) { setShowGuestPrompt(true); return; }
    const next = !liked;
    setLiked(next);
    setLocalLikes(c => next ? c + 1 : c - 1);
    if (next) {
      await supabase.from('comment_likes').upsert({ comment_id: comment.id, user_id: currentUserId });
      await supabase.from('comments').update({ likes_count: localLikes + 1 }).eq('id', comment.id);
    } else {
      await supabase.from('comment_likes').delete().eq('comment_id', comment.id).eq('user_id', currentUserId);
      await supabase.from('comments').update({ likes_count: Math.max(0, localLikes - 1) }).eq('id', comment.id);
    }
  };

  const isOwn = currentUserId === comment.authorId;

  return (
    <div className={cn('group relative', depth > 0 && 'ml-4 sm:ml-8 border-l border-[hsl(var(--border-subtle))] pl-3 sm:pl-4')}>
      <div className="py-3">
        <div className="flex items-start gap-2.5">
          {/* Avatar — links to profile */}
          <button onClick={() => navigate(`/profile/${comment.authorId}`)} className="flex-shrink-0 mt-0.5">
            <AvatarBubble
              username={comment.authorUsername}
              displayName={comment.authorDisplayName}
              avatarUrl={comment.authorAvatar}
              size={depth === 0 ? 'md' : 'sm'}
            />
          </button>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => navigate(`/profile/${comment.authorId}`)} className="text-[13px] font-semibold text-[hsl(var(--text-primary))] hover:text-[hsl(var(--accent-primary))] transition-colors">
                  {comment.authorDisplayName || comment.authorUsername}
                </button>
                <span className="text-[11px] text-[hsl(var(--text-muted))]">@{comment.authorUsername}</span>
                {isOwn && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--surface))] text-[hsl(var(--text-muted))] border border-[hsl(var(--border-subtle))]">You</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] text-[hsl(var(--text-muted))]">{formatRelativeTime(comment.createdAt)}</span>
                <div className="relative">
                  <button onClick={() => setMenuOpen(o => !o)} className="opacity-0 group-hover:opacity-100 p-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-all">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen && <ReportMenu commentId={comment.id} onClose={() => setMenuOpen(false)} currentUserId={currentUserId} />}
                </div>
              </div>
            </div>

            {/* Body */}
            <CommentBody body={comment.body} />

            {/* Actions */}
            <div className="flex items-center gap-3 text-xs text-[hsl(var(--text-muted))] mt-1.5">
              <button onClick={toggleLike} className={cn('flex items-center gap-1 transition-colors hover:text-[hsl(var(--text-secondary))]', liked && 'text-[hsl(var(--accent-primary))]')}>
                <ThumbsUp className="w-3 h-3" />
                {localLikes > 0 && <span>{localLikes}</span>}
              </button>
              {depth === 0 && (
                <button onClick={() => { onReply(comment.id, comment.authorUsername); }} className="flex items-center gap-1 transition-colors hover:text-[hsl(var(--accent-primary))]">
                  <CornerDownRight className="w-3 h-3" /> Reply
                </button>
              )}
              {depth === 0 && comment.replies.length > 0 && (
                <button onClick={() => setRepliesVisible(v => !v)} className="flex items-center gap-1 text-[hsl(var(--accent-primary))]/70 hover:text-[hsl(var(--accent-primary))] transition-colors">
                  <ChevronDown className={cn('w-3 h-3 transition-transform', repliesVisible && 'rotate-180')} />
                  {repliesVisible ? 'Hide' : `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showGuestPrompt && (
        <div className="ml-11 mb-2">
          <div className="inline-flex items-center gap-2 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl px-3 py-2">
            <p className="text-xs text-[hsl(var(--text-secondary))]">Sign in to like comments</p>
            <button onClick={() => navigate('/auth')} className="text-xs font-semibold text-[hsl(var(--accent-primary))] hover:underline">Join free</button>
            <button onClick={() => setShowGuestPrompt(false)} className="text-[hsl(var(--text-muted))]"><X className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* Replies — hidden by default */}
      {repliesVisible && comment.replies.map(reply => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

// ─── Comment compose box (collapses when not focused) ─────────────────────
function CommentCompose({
  onPost,
  currentUserId,
  userAvatar,
  replyingTo,
  onClearReply,
  isGuest,
}: {
  onPost: (body: string, agree: boolean | null, parentId: string | null) => Promise<void>;
  currentUserId?: string;
  userAvatar: string | null;
  replyingTo: { id: string; username: string } | null;
  onClearReply: () => void;
}) {
  const navigate = useNavigate();
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const isExpanded = focused || !!text.trim() || !!replyingTo;

  if (isGuest) {
    return (
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[hsl(var(--text-primary))]">Join the conversation</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--text-muted))]">Sign up for free to add a comment.</p>
        </div>
        <button onClick={() => navigate('/auth')} className="flex-shrink-0 rounded-full bg-[hsl(var(--accent-primary))] px-4 py-2 text-xs font-semibold text-[hsl(var(--accent-fg))] transition-colors hover:bg-[hsl(var(--accent-hover))]">Sign up free</button>
      </div>
    );
  }

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    await onPost(trimmed, null, replyingTo?.id ?? null);
    setText('');
    setFocused(false);
    setPosting(false);
    onClearReply();
  };

  const handleCancel = () => {
    setText('');
    setFocused(false);
    onClearReply();
  };

  return (
    <div className={cn('mb-5 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden transition-all duration-200', isExpanded ? 'shadow-md' : '')}>
      {replyingTo && (
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <span className="text-xs text-[hsl(var(--text-muted))] flex items-center gap-1.5">
            <CornerDownRight className="w-3 h-3" />
            Replying to <span className="font-semibold text-[hsl(var(--accent-primary))]">@{replyingTo.username}</span>
          </span>
          <button onClick={onClearReply} className="p-0.5 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex items-start gap-3 p-4">
        <AvatarBubble username={currentUserId ?? 'you'} avatarUrl={userAvatar} size="md" className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textRef}
            className={cn('w-full bg-transparent text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none resize-none leading-relaxed transition-all duration-200',
              isExpanded ? 'min-h-[60px]' : 'h-6'
            )}
            placeholder={isExpanded ? 'What do you think? Be honest.' : 'Add a comment…'}
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            rows={isExpanded ? 3 : 1}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="flex items-center justify-end gap-2 px-4 pb-3 border-t border-[hsl(var(--border-subtle))] pt-3">
          <button onClick={handleCancel} className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] px-2 py-1.5 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handlePost} disabled={!text.trim() || posting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] text-xs font-semibold rounded-full hover:bg-[hsl(var(--accent-hover))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {posting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {replyingTo ? 'Reply' : 'Post'}
          </button>
        </div>
      )}
    </div>
  );
}

type SortMode = 'top' | 'new';

// ─── Discussion panel ──────────────────────────────────────────────────────
function DiscussionPanel({
  thoughtId,
  comments,
  loading,
  onPost,
  currentUserId,
  userAvatar,
  userVote,
  isGuest,
}: {
  thoughtId: string;
  comments: Comment[];
  loading: boolean;
  onPost: (body: string, agree: boolean | null, parentId: string | null) => Promise<void>;
  currentUserId?: string;
  userAvatar: string | null;
  userVote: 'agree' | 'disagree' | null;
}) {
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [sort, setSort] = useState<SortMode>('top');
  const navigate = useNavigate();

  const nested = nestComments(comments);
  const total = comments.length;

  const sorted = [...nested].sort((a, b) => {
    if (sort === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return (b.likesCount + b.replies.length) - (a.likesCount + a.replies.length); // top
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[hsl(var(--accent-primary))]" />
          {total}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/guidelines')} className="flex items-center gap-1 rounded-full border border-[hsl(var(--border-subtle))] px-2.5 py-1 text-xs text-[hsl(var(--text-muted))] transition-colors hover:border-[hsl(var(--accent-primary))]/50 hover:text-[hsl(var(--accent-primary))]" aria-label="Read platform rules">
            <Shield className="w-3 h-3" />
            Rules
          </button>
          {total > 1 && (
            <div className="flex items-center gap-1 rounded-full border border-[hsl(var(--border-subtle))] p-0.5">
              <ArrowUpDown className="ml-1.5 w-3 h-3 text-[hsl(var(--text-muted))]" />
              {(['top', 'new'] as SortMode[]).map(s => (
                <button key={s} onClick={() => setSort(s)} className={cn('rounded-full px-2.5 py-1 text-xs capitalize transition-colors', sort === s ? 'bg-[hsl(var(--nav-active-bg))] text-[hsl(var(--nav-active-fg))]' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')} aria-pressed={sort === s}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compose */}
      <CommentCompose
        onPost={onPost}
        currentUserId={currentUserId}
        userAvatar={userAvatar}
        isGuest={!currentUserId}
        replyingTo={replyingTo}
        onClearReply={() => setReplyingTo(null)}
      />

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-[hsl(var(--text-muted))]">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading comments…</span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-[hsl(var(--text-muted))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--text-muted))]">Be the first to comment. Say something honest.</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-[hsl(var(--border-subtle))]/50">
          {sorted.map(comment => (
            <CommentItem key={comment.id} comment={comment} depth={0} onReply={(id, username) => setReplyingTo({ id, username })} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ThoughtDetail ──────────────────────────────────────��─────────────
export default function ThoughtDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thought, setThought] = useState<Thought | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userVote, setUserVote] = useState<'agree' | 'disagree' | null>(null);
  const [voteId, setVoteId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [agreeCount, setAgreeCount] = useState(0);
  const [disagreeCount, setDisagreeCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [inboxIds, setInboxIds] = useState<string[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load thought + existing vote
  useEffect(() => {
    const load = async () => {
      setDbLoading(true);
      if (!id) { setDbLoading(false); return; }

      const [thoughtRes, voteRes, followRes] = await Promise.all([
        supabase.from('thoughts').select('*, author:user_profiles(id, username, display_name, avatar_url)').eq('id', id).single(),
        user ? supabase.from('thought_votes').select('id, vote').eq('thought_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        user ? supabase.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', '').maybeSingle() : Promise.resolve({ data: null, error: null }),
      ]);

      if (thoughtRes.data) {
        const data = thoughtRes.data;
        const t: Thought = {
          id: data.id,
          authorId: data.author_id,
          author: {
            username: data.author?.username ?? 'unknown',
            displayName: data.author?.display_name ?? '',
            avatar: data.author?.avatar_url ?? '',
          },
          title: data.title,
          preview: data.body?.slice(0, 120) ?? '',
          body: data.body,
          category: data.category,
          geo: { scope: data.geo_scope as 'Global' | 'Country' | 'City', label: data.geo_label },
          imageUrl: data.image_url ?? undefined,
          publishedAt: data.published_at,
          agreeCount: data.agree_count,
          disagreeCount: data.disagree_count,
          discussionCount: data.discussion_count,
          isRead: true,
          isSaved: false,
          isDraft: data.is_draft,
          tags: [],
        };
        setThought(t);
        setAgreeCount(t.agreeCount);
        setDisagreeCount(t.disagreeCount);

        if (user) {
          const [{ data: savedRow }, { data: follows }] = await Promise.all([
            supabase.from('saved_thoughts').select('thought_id').eq('user_id', user.id).eq('thought_id', id).maybeSingle(),
            supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
          ]);
          setThought(current => current ? { ...current, isSaved: Boolean(savedRow) } : current);
          const followedAuthorIds = (follows ?? []).map(row => row.following_id as string);
          setIsFollowing(followedAuthorIds.includes(data.author_id));
        }

        // Check following
        if (user && data.author_id !== user.id) {
          const { data: followRow } = await supabase.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', data.author_id).maybeSingle();
          setIsFollowing(!!followRow);
        }
      }

      // Existing vote
      if (voteRes.data) {
        setUserVote(voteRes.data.vote as 'agree' | 'disagree');
        setVoteId(voteRes.data.id);
      }

      setDbLoading(false);
    };
    load();
  }, [id, user]);

  // Load the user's inbox order for mobile reading navigation.
  useEffect(() => {
    if (!user) { setInboxIds([]); return; }
    const loadInboxIds = async () => {
      const { data: follows } = await supabase.from('user_follows').select('following_id').eq('follower_id', user.id);
      const followedIds = (follows ?? []).map(row => row.following_id as string).filter(Boolean);
      if (followedIds.length === 0) { setInboxIds([]); return; }
      const { data } = await supabase.from('thoughts').select('id').eq('is_draft', false).in('author_id', followedIds).order('published_at', { ascending: false }).limit(100);
      setInboxIds((data ?? []).map(row => row.id as string));
    };
    loadInboxIds();
  }, [user]);

  // Load comments
  const fetchComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:user_profiles(id, username, display_name, avatar_url)')
      .eq('thought_id', id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data.map(r => dbRowToComment(r as Record<string, unknown>)));
    }
    setCommentsLoading(false);
  }, [id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const navigateInbox = useCallback((direction: 'next' | 'previous') => {
    if (!id || inboxIds.length === 0) return;
    const currentIndex = inboxIds.indexOf(id);
    if (currentIndex < 0) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < inboxIds.length) navigate(`/thought/${inboxIds[nextIndex]}`);
  }, [id, inboxIds, navigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focusMode) setFocusMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusMode]);

  // Horizontal swipe navigates through Inbox points on mobile.
  const handleTouchStart = (event: TouchEvent) => {
    touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const handleTouchEnd = (event: TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || window.innerWidth >= 1024) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
    navigateInbox(dx < 0 ? 'next' : 'previous');
  };

  // Sheet backdrop close
  useEffect(() => {
    if (!commentsOpen) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setCommentsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [commentsOpen]);

  const handleSave = async () => {
    if (!thought) return;
    if (!user) { toast.error('Sign in to save points'); return; }
    const next = !thought.isSaved;
    setThought(t => t ? { ...t, isSaved: next } : t);
    toast.success(next ? 'Saved' : 'Removed from saved');
    window.dispatchEvent(new CustomEvent('lebelho:saved-changed', { detail: { id: thought.id, isSaved: next } }));
    if (user) {
      if (next) {
        await supabase.from('saved_thoughts').upsert({ user_id: user.id, thought_id: thought.id });
      } else {
        await supabase.from('saved_thoughts').delete().eq('user_id', user.id).eq('thought_id', thought.id);
      }
    }
  };

  const handleVote = async (vote: 'agree' | 'disagree') => {
    if (!user || !id) { toast.error('Sign in to vote'); return; }
    const prev = userVote;
    const next = prev === vote ? null : vote;

    // Optimistic update
    setUserVote(next);
    setAgreeCount(c => {
      if (vote === 'agree') return prev === 'agree' ? c - 1 : c + (next ? 1 : 0);
      return prev === 'agree' ? c - 1 : c;
    });
    setDisagreeCount(c => {
      if (vote === 'disagree') return prev === 'disagree' ? c - 1 : c + (next ? 1 : 0);
      return prev === 'disagree' ? c - 1 : c;
    });

    if (next === null) {
      // Remove vote
      if (voteId) {
        await supabase.from('thought_votes').delete().eq('id', voteId);
        setVoteId(null);
      }
    } else if (prev === null) {
      // Insert new vote
      const { data } = await supabase.from('thought_votes').insert({ thought_id: id, user_id: user.id, vote: next }).select('id').single();
      if (data) setVoteId(data.id);
    } else {
      // Update existing vote
      if (voteId) {
        await supabase.from('thought_votes').update({ vote: next }).eq('id', voteId);
      }
    }

    // Sync counts to DB
    await supabase.rpc('sync_thought_vote_counts', { p_thought_id: id }).catch(() => {});
  };

  const handleFollow = async () => {
    if (!thought || !user) return;
    const next = !isFollowing;
    setIsFollowing(next);
    if (next) {
      await supabase.from('user_follows').upsert({ follower_id: user.id, following_id: thought.authorId });
    } else {
      await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', thought.authorId);
    }
    toast.success(next ? `Following @${thought.author.username}` : `Unfollowed @${thought.author.username}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: thought?.title, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      toast.success('Link copied to clipboard');
    }
  };

  const handlePostComment = async (body: string, agree: boolean | null, parentId: string | null) => {
    if (!user || !id) { toast.error('Create an account to join the conversation'); return; }

    const { data, error } = await supabase
      .from('comments')
      .insert({ thought_id: id, author_id: user.id, body, agree, parent_id: parentId ?? null })
      .select('*, author:user_profiles(id, username, display_name, avatar_url)')
      .single();

    if (error) { toast.error('Failed to post comment'); return; }

    const newComment = dbRowToComment(data as Record<string, unknown>);
    setComments(prev => [...prev, newComment]);
    toast.success('Comment posted');
    await supabase.rpc('increment_discussion_count', { thought_row_id: id }).catch(() => {});
  };

  if (dbLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[hsl(var(--background))] flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-baseline gap-0.5">
            <span className="font-serif text-4xl font-bold text-[hsl(var(--accent-primary))]">Le</span>
            <span className="font-serif text-4xl font-bold text-[hsl(var(--text-primary))]">BeHo</span>
          </div>
          <p className="text-xs text-[hsl(var(--text-muted))] tracking-widest uppercase">Let's Be Honest.</p>
          <div className="mt-4 w-48 h-0.5 bg-[hsl(var(--border-subtle))] rounded-full overflow-hidden">
            <div className="h-full bg-[hsl(var(--accent-primary))] rounded-full" style={{ animation: 'loadBar 1.2s ease-in-out infinite' }} />
          </div>
        </div>
        <style>{`@keyframes loadBar{0%{width:0%;margin-left:0%}50%{width:60%;margin-left:20%}100%{width:0%;margin-left:100%}}`}</style>
      </div>
    );
  }

  if (!thought) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <p className="text-[hsl(var(--text-muted))]">Point not found</p>
        </div>
      </AppShell>
    );
  }

  const totalVotes = agreeCount + disagreeCount;
  const agreePercent = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 50;
  const isSelf = user?.id === thought.authorId;

  return (
    <AppShell hideDefaultMobileHeader>
      {thought && (
        <SEOHead
          title={thought.title}
          description={thought.preview || thought.body.slice(0, 155)}
          url={`/thought/${thought.id}`}
          type="article"
        />
      )}
      {user && sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 z-[61]"><Sidebar /></div>
        </div>
      )}

      <div
        className={cn('flex flex-col h-full overflow-hidden lg:overflow-visible', focusMode && 'bg-[hsl(var(--background))]')}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={cn(!focusMode && 'contents')}>
          {!focusMode && <DetailHeader onMenuOpen={() => setSidebarOpen(true)} canOpenMenu={Boolean(user)} />}
          {!focusMode && <ForYouStrip />}
        </div>

        <div className="flex-1 overflow-y-auto lg:overflow-visible">
          <div className="max-w-4xl mx-auto lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:px-6 lg:py-8">

            {/* ── Main column ── */}
            <article className="pb-28 lg:pb-8">
              {thought.imageUrl && (
                <div className="w-full aspect-video overflow-hidden lg:rounded-xl mb-6">
                  <img src={thought.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Author + title */}
              <div className="px-4 lg:px-0 pt-6 pb-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/profile/${thought.authorId}`)}>
                      <AvatarBubble username={thought.author.username} displayName={thought.author.displayName} avatarUrl={thought.author.avatar || null} size="lg" />
                    </button>
                    <div>
                      <button onClick={() => navigate(`/profile/${thought.authorId}`)} className="font-semibold text-[hsl(var(--text-primary))] text-sm hover:text-[hsl(var(--accent-primary))] transition-colors">
                        {thought.author.displayName || thought.author.username}
                      </button>
                      <div className="text-xs text-[hsl(var(--text-muted))]">
                        @{thought.author.username} · {formatRelativeTime(thought.publishedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', getCategoryColor(thought.category))}>{thought.category}</span>
                    <button
                      onClick={() => setFocusMode(value => !value)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--accent-primary))] transition-colors"
                      aria-pressed={focusMode}
                      aria-label={focusMode ? 'Exit Focus reading mode' : 'Enter Focus reading mode'}
                    >
                      {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{focusMode ? 'Exit Focus' : 'Focus'}</span>
                    </button>
                    {!isSelf && (
                      <button onClick={handleFollow} className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors', isFollowing ? 'border-[hsl(var(--accent-primary))]/30 bg-[hsl(var(--accent-primary))]/10 text-[hsl(var(--accent-primary))]' : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')}>
                        {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                        <span className="hidden sm:inline">{isFollowing ? 'Following' : 'Follow'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[hsl(var(--text-primary))] leading-tight mb-6">
                  {thought.title}
                </h1>
              </div>

              {/* Body */}
              <div
                className="px-4 lg:px-0 pt-2 text-base text-[hsl(var(--text-secondary))] leading-relaxed mb-8"
                dangerouslySetInnerHTML={{ __html: `<p class="mb-4 leading-relaxed text-[hsl(var(--text-secondary))]">${renderMarkdown(thought.body)}</p>` }}
              />

              {/* Agree / Disagree */}
              <div className={cn('relative mx-4 lg:mx-0 mb-4', focusMode && 'hidden')}>
                <div className={cn('bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-5', !user && 'blur-sm select-none pointer-events-none')}>

                <p className="text-sm font-medium text-[hsl(var(--text-secondary))] mb-4 text-center">
                  Do you agree with this?
                </p>
                <div className="h-2 bg-[hsl(var(--input-bg))] rounded-full mb-3 overflow-hidden">
                  <div className="h-full bg-[hsl(var(--accent-primary))] rounded-full transition-all duration-500" style={{ width: `${agreePercent}%` }} />
                </div>
                <div className="flex justify-between text-xs text-[hsl(var(--text-muted))] mb-4">
                  <span className="text-[hsl(var(--accent-primary))] font-medium">{agreePercent}% agree</span>
                  <span>{100 - agreePercent}% disagree</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleVote('agree')} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border transition-all', userVote === 'agree' ? 'bg-[hsl(var(--accent-primary))]/20 border-[hsl(var(--accent-primary))]/40 text-[hsl(var(--accent-primary))]' : 'bg-[hsl(var(--input-bg))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--accent-primary))]/30')}>
                    <ThumbsUp className="w-4 h-4" /> Agree · {agreeCount}
                  </button>
                  <button onClick={() => handleVote('disagree')} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border transition-all', userVote === 'disagree' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-[hsl(var(--input-bg))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:border-red-500/30')}>
                    <ThumbsDown className="w-4 h-4" /> Disagree · {disagreeCount}
                  </button>
                </div>
                </div>
                {!user && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[hsl(var(--background))]/45 px-5 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-sm font-semibold text-[hsl(var(--text-primary))]">Sign up to vote on this point</p>
                      <button onClick={() => navigate('/auth')} className="rounded-lg bg-[hsl(var(--accent-primary))] px-4 py-2 text-xs font-semibold text-[hsl(var(--accent-fg))] hover:bg-[hsl(var(--accent-hover))] transition-colors">Sign up</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Save + Share (desktop) */}
              <div className={cn(focusMode ? 'hidden' : 'hidden lg:flex', 'mx-0 items-center gap-3 mb-8')}>
                <button onClick={handleSave} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors', thought.isSaved ? 'border-[hsl(var(--accent-primary))]/30 bg-[hsl(var(--accent-primary))]/10 text-[hsl(var(--accent-primary))]' : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')}>
                  <Star className="w-4 h-4" fill={thought.isSaved ? 'currentColor' : 'none'} /> {thought.isSaved ? 'Saved' : 'Save'}
                </button>
                <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[hsl(var(--border-subtle))] text-sm font-medium text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>

              {/* Desktop discussion */}
              <div className={cn(focusMode ? 'hidden' : 'hidden lg:block', 'mx-0')}>
                <DiscussionPanel
                  thoughtId={thought.id}
                  comments={comments}
                  loading={commentsLoading}
                  onPost={handlePostComment}
                  currentUserId={user?.id}
                  userAvatar={user?.avatarUrl ?? null}
                  userVote={userVote}
                />
              </div>
            </article>

            {/* ── Right sidebar (desktop) ── */}
            <aside className={focusMode ? 'hidden' : 'hidden lg:block'}>
              <div className="sticky top-[120px]">
                <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-5">
                  <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest mb-3">More like this</p>
                  <ForYouDesktop currentId={thought.id} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className={cn('lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[hsl(var(--background))]/95 backdrop-blur-sm border-t border-[hsl(var(--border-subtle))]', focusMode && 'hidden')}>
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          <button onClick={() => handleVote('agree')} className={cn('flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[60px]', userVote === 'agree' ? 'text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-muted))]')}>
            <ThumbsUp className="w-5 h-5" /><span className="text-[10px] font-medium">{agreeCount}</span>
          </button>
          <button onClick={() => handleVote('disagree')} className={cn('flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[60px]', userVote === 'disagree' ? 'text-red-400' : 'text-[hsl(var(--text-muted))]')}>
            <ThumbsDown className="w-5 h-5" /><span className="text-[10px] font-medium">{disagreeCount}</span>
          </button>
          <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[hsl(var(--text-muted))] transition-colors min-w-[60px]">
            <MessageSquare className="w-5 h-5" /><span className="text-[10px] font-medium">{comments.length}</span>
          </button>
          <button onClick={handleSave} className={cn('flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[60px]', thought.isSaved ? 'text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-muted))]')}>
            <Star className="w-5 h-5" fill={thought.isSaved ? 'currentColor' : 'none'} /><span className="text-[10px] font-medium">Save</span>
          </button>
          <button onClick={handleShare} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[hsl(var(--text-muted))] transition-colors min-w-[60px]">
            <Share2 className="w-5 h-5" /><span className="text-[10px] font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* ── Mobile comments sheet ── */}
      {commentsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCommentsOpen(false)} />
          <div ref={sheetRef} className="relative bg-[hsl(var(--background))] rounded-t-3xl max-h-[90vh] flex flex-col" style={{ animation: 'slideUp 0.28s ease-out' }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[hsl(var(--border-subtle))] flex-shrink-0">
              <div className="w-10 h-1 bg-[hsl(var(--border-subtle))] rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
              <div aria-hidden="true" />
              <button onClick={() => setCommentsOpen(false)} className="p-1.5 rounded-full text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface))] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 pb-8 pt-2">
              <DiscussionPanel
                thoughtId={thought.id}
                comments={comments}
                loading={commentsLoading}
                onPost={handlePostComment}
                currentUserId={user?.id}
                userAvatar={user?.avatarUrl ?? null}
                userVote={userVote}
                isGuest={!user}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </AppShell>
  );
}

// Separate desktop "more like this" component to avoid re-fetching
function ForYouDesktop({ currentId }: { currentId: string }) {
  const [items, setItems] = useState<ForYouItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('thoughts')
      .select('id, title, category, author:user_profiles(username, avatar_url)')
      .eq('is_draft', false)
      .neq('id', currentId)
      .order('published_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setItems(data.map((r: Record<string, unknown>) => {
          const a = (r.author as Record<string, unknown>) ?? {};
          return { id: r.id as string, username: (a.username as string) ?? 'unknown', avatarUrl: (a.avatar_url as string) ?? null, title: r.title as string, category: r.category as string };
        }));
      });
  }, [currentId]);

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-2 cursor-pointer group" onClick={() => navigate(`/thought/${item.id}`)}>
          <AvatarBubble username={item.username} avatarUrl={item.avatarUrl} size="sm" className="flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-[hsl(var(--text-primary))] font-medium leading-snug group-hover:text-[hsl(var(--accent-primary))] transition-colors line-clamp-2">{item.title}</p>
            <p className="text-[10px] text-[hsl(var(--text-muted))] mt-0.5">{item.category}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
