import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { AppShell } from '@/components/layout/AppShell';
import { AvatarBubble } from '@/components/features/AvatarBubble';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  Shield, Users, Flag, CheckCircle, Trash2, RefreshCw,
  ChevronLeft, BarChart3, Eye, EyeOff, Ban, UserCheck,
  MessageSquare, AlertTriangle, Hash
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Admin user ID ────────────────────────────────────────────────────────
const ADMIN_USER_ID_PREFIX = 'eaf61d8f-637f-4798-';
const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID ?? ADMIN_USER_ID_PREFIX;

// ─── Types ─────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  joined_at: string;
  restricted_from_commenting: boolean;
  restriction_reason: string | null;
}

interface CommentReport {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  category: string;
  created_at: string;
  comment: {
    id: string;
    body: string;
    author_id: string;
    thought_id: string;
    is_hidden: boolean;
    reviewed_at: string | null;
    reviewer_action: string | null;
    author: { username: string; display_name: string | null; avatar_url: string | null } | null;
  } | null;
  reporter: { username: string } | null;
}

interface Stats {
  totalUsers: number;
  totalPoints: number;
  totalComments: number;
  pendingReports: number;
}

type Tab = 'overview' | 'users' | 'reports' | 'topics';

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-5 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-[hsl(var(--text-primary))]">{value}</div>
        <div className="text-xs text-[hsl(var(--text-muted))]">{label}</div>
      </div>
    </div>
  );
}

// ─── Users tab ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [restrictReason, setRestrictReason] = useState('');
  const [showReasonFor, setShowReasonFor] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, display_name, email, avatar_url, joined_at, restricted_from_commenting, restriction_reason')
      .order('joined_at', { ascending: false });
    if (!error) setUsers((data ?? []) as UserProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleRestriction = async (user: UserProfile) => {
    if (!user.restricted_from_commenting) {
      setShowReasonFor(user.id);
      setRestrictReason('');
      return;
    }
    const { error } = await supabase
      .from('user_profiles')
      .update({ restricted_from_commenting: false, restriction_reason: null })
      .eq('id', user.id);
    if (error) { toast.error('Failed to update user'); return; }
    toast.success(`@${user.username} can now comment again`);
    fetchUsers();
  };

  const confirmRestrict = async (userId: string, username: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ restricted_from_commenting: true, restriction_reason: restrictReason.trim() || 'Violation of community guidelines' })
      .eq('id', userId);
    if (error) { toast.error('Failed to restrict user'); return; }
    toast.success(`@${username} restricted from commenting`);
    setShowReasonFor(null);
    fetchUsers();
  };

  const filtered = users.filter(u =>
    !search ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4">
        <input
          className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none focus:border-[hsl(var(--accent-primary))]/50"
          placeholder="Search by username or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-5 h-5 animate-spin text-[hsl(var(--text-muted))]" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-[hsl(var(--text-muted))] py-12">No users found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <div key={user.id} className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AvatarBubble username={user.username ?? 'unknown'} displayName={user.display_name ?? ''} avatarUrl={user.avatar_url} size="md" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[hsl(var(--text-primary))]">{user.display_name || user.username}</span>
                    <span className="text-xs text-[hsl(var(--text-muted))]">@{user.username}</span>
                    {user.restricted_from_commenting && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5" /> Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{user.email}</p>
                  <p className="text-xs text-[hsl(var(--text-muted))]">
                    Joined {user.joined_at ? new Date(user.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                  {user.restricted_from_commenting && user.restriction_reason && (
                    <p className="text-xs text-red-400/80 mt-1 italic">Reason: {user.restriction_reason}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleRestriction(user)}
                  className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    user.restricted_from_commenting
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                  )}
                >
                  {user.restricted_from_commenting ? <><UserCheck className="w-3 h-3" /> Allow</> : <><Ban className="w-3 h-3" /> Restrict</>}
                </button>
              </div>
              {showReasonFor === user.id && (
                <div className="mt-3 pt-3 border-t border-[hsl(var(--border-subtle))]">
                  <p className="text-xs font-semibold text-[hsl(var(--text-primary))] mb-2">Reason for restriction</p>
                  <input
                    className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-lg px-3 py-2 text-xs text-[hsl(var(--text-primary))] outline-none focus:border-red-500/50 mb-2"
                    placeholder="e.g. Repeated guidelines violations"
                    value={restrictReason}
                    onChange={e => setRestrictReason(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => confirmRestrict(user.id, user.username)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/90 text-white hover:bg-red-500 transition-colors">
                      <Ban className="w-3 h-3" /> Confirm
                    </button>
                    <button onClick={() => setShowReasonFor(null)} className="px-3 py-1.5 rounded-lg text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reports tab ────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Hate speech': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Harassment': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Misinformation': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Spam': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Other violation': 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
};

function ReportsTab() {
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comment_reports')
      .select(`id, comment_id, reporter_id, reason, category, created_at,
        comment:comments(id, body, author_id, thought_id, is_hidden, reviewed_at, reviewer_action,
          author:user_profiles(username, display_name, avatar_url)
        ),
        reporter:user_profiles!comment_reports_reporter_id_fkey(username)`)
      .order('created_at', { ascending: false });
    if (!error) setReports((data ?? []) as unknown as CommentReport[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleAction = async (report: CommentReport, action: 'approve' | 'remove') => {
    setActioning(report.comment_id);
    const now = new Date().toISOString();
    if (action === 'remove') {
      await supabase.from('comments').update({ is_hidden: true, reviewed_at: now, reviewer_action: 'removed' }).eq('id', report.comment_id);
      toast.success('Comment removed');
    } else {
      await supabase.from('comments').update({ is_hidden: false, reviewed_at: now, reviewer_action: 'approved' }).eq('id', report.comment_id);
      toast.success('Comment reinstated');
    }
    setActioning(null);
    fetchReports();
  };

  const filtered = reports.filter(r => filter === 'all' ? true : !r.comment?.reviewed_at);
  const byCat = reports.reduce<Record<string, number>>((acc, r) => { acc[r.reason] = (acc[r.reason] ?? 0) + 1; return acc; }, {});

  return (
    <div>
      {Object.keys(byCat).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(byCat).map(([cat, count]) => (
            <span key={cat} className={cn('text-[11px] px-2.5 py-1 rounded-full border font-medium', CATEGORY_COLORS[cat] ?? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20')}>
              {cat}: {count}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        {(['pending', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors', filter === f ? 'bg-[hsl(var(--accent-primary))]/15 border-[hsl(var(--accent-primary))]/30 text-[hsl(var(--accent-primary))]' : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')}>
            {f === 'pending' ? 'Pending review' : 'All reports'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-5 h-5 animate-spin text-[hsl(var(--text-muted))]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[hsl(var(--text-primary))]">All clear</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-1">No {filter === 'pending' ? 'pending ' : ''}reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            const isActioned = !!report.comment?.reviewed_at;
            return (
              <div key={report.id} className={cn('bg-[hsl(var(--surface))] border rounded-xl p-4', isActioned ? 'border-[hsl(var(--border-subtle))] opacity-60' : 'border-amber-500/20')}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', CATEGORY_COLORS[report.reason] ?? 'bg-neutral-500/10 text-neutral-400')}>
                      <Flag className="w-2.5 h-2.5 inline mr-0.5" />{report.reason}
                    </span>
                    <span className="text-[11px] text-[hsl(var(--text-muted))]">@{report.reporter?.username ?? '?'} · {formatRelativeTime(report.created_at)}</span>
                  </div>
                  {isActioned && (
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', report.comment?.reviewer_action === 'removed' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400')}>
                      {report.comment?.reviewer_action === 'removed' ? 'Removed' : 'Reinstated'}
                    </span>
                  )}
                </div>
                {report.comment && (
                  <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AvatarBubble username={report.comment.author?.username ?? 'unknown'} displayName={report.comment.author?.display_name ?? ''} avatarUrl={report.comment.author?.avatar_url ?? null} size="sm" />
                      <span className="text-xs font-semibold text-[hsl(var(--text-primary))]">@{report.comment.author?.username ?? 'unknown'}</span>
                      {report.comment.is_hidden && (
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 flex items-center gap-0.5">
                          <EyeOff className="w-2.5 h-2.5" /> Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed line-clamp-4">{report.comment.body}</p>
                  </div>
                )}
                {!isActioned && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction(report, 'remove')} disabled={actioning === report.comment_id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                    <button onClick={() => handleAction(report, 'approve')} disabled={actioning === report.comment_id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors">
                      <Eye className="w-3 h-3" /> Reinstate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Topics tab ──────────────────────────────────────────────────────────────
function TopicsTab() {
  const [topics, setTopics] = useState<{ id: string; label: string; sort_order: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTopics = async () => {
    setLoading(true);
    const { data } = await supabase.from('platform_topics').select('*').order('sort_order', { ascending: true });
    setTopics(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTopics(); }, []);

  const addTopic = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    const maxOrder = topics.reduce((m, t) => Math.max(m, t.sort_order), 0);
    const { error } = await supabase.from('platform_topics').insert({ label, sort_order: maxOrder + 1 });
    if (error) { toast.error(error.message.includes('unique') ? 'Topic already exists' : 'Failed to add topic'); }
    else { toast.success(`"${label}" added`); setNewLabel(''); }
    setAdding(false);
    fetchTopics();
  };

  const deleteTopic = async (id: string, label: string) => {
    setDeleting(id);
    await supabase.from('platform_topics').delete().eq('id', id);
    toast.success(`"${label}" removed`);
    setDeleting(null);
    fetchTopics();
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none focus:border-[hsl(var(--accent-primary))]/50"
          placeholder="New topic label…"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTopic()}
        />
        <button onClick={addTopic} disabled={adding || !newLabel.trim()}
          className="px-4 py-2 rounded-xl bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] text-sm font-semibold disabled:opacity-50 hover:bg-[hsl(var(--accent-hover))] transition-colors">
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-4 h-4 animate-spin text-[hsl(var(--text-muted))]" /></div>
      ) : (
        <div className="space-y-2">
          {topics.map(t => (
            <div key={t.id} className="flex items-center justify-between bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3">
              <span className="text-sm text-[hsl(var(--text-primary))]">{t.label}</span>
              <button onClick={() => deleteTopic(t.id, t.label)} disabled={deleting === t.id}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50">
                {deleting === t.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPoints: 0, totalComments: 0, pendingReports: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const isAdmin = !!user?.id && (user.id === ADMIN_USER_ID || user.id.startsWith(ADMIN_USER_ID_PREFIX));

  useEffect(() => {
    if (!isAdmin) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      const [usersRes, pointsRes, commentsRes, reportsRes] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('thoughts').select('id', { count: 'exact', head: true }).eq('is_draft', false),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('comment_reports').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        totalUsers: usersRes.count ?? 0,
        totalPoints: pointsRes.count ?? 0,
        totalComments: commentsRes.count ?? 0,
        pendingReports: reportsRes.count ?? 0,
      });
      setStatsLoading(false);
    };
    fetchStats();
  }, [isAdmin]);

  if (!user) {
    return <AppShell><div className="flex items-center justify-center min-h-[60vh]"><p className="text-[hsl(var(--text-muted))]">Please sign in.</p></div></AppShell>;
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <Shield className="w-12 h-12 text-[hsl(var(--text-muted))]" />
          <h1 className="font-serif text-xl font-bold text-[hsl(var(--text-primary))]">Access Denied</h1>
          <p className="text-sm text-[hsl(var(--text-muted))] text-center">This area is restricted to administrators.</p>
          <button onClick={() => navigate('/inbox')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] text-sm font-semibold">
            <ChevronLeft className="w-4 h-4" /> Back to Inbox
          </button>
        </div>
      </AppShell>
    );
  }

  const TABS = [
    { id: 'overview' as Tab, icon: BarChart3, label: 'Overview' },
    { id: 'users' as Tab, icon: Users, label: 'Users' },
    { id: 'reports' as Tab, icon: Flag, label: `Reports${stats.pendingReports > 0 ? ` (${stats.pendingReports})` : ''}` },
    { id: 'topics' as Tab, icon: Hash, label: 'Topics' },
  ];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-primary))]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))]">Admin</h1>
            <p className="text-xs text-[hsl(var(--text-muted))]">LeBeHo content management</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl p-1 mb-6">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === id ? 'bg-[hsl(var(--accent-primary))]/15 text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            {statsLoading ? (
              <div className="flex justify-center py-12"><RefreshCw className="w-5 h-5 animate-spin text-[hsl(var(--text-muted))]" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard icon={Users} label="Total users" value={stats.totalUsers} color="bg-blue-500/10 text-blue-400" />
                <StatCard icon={MessageSquare} label="Total points" value={stats.totalPoints} color="bg-emerald-500/10 text-emerald-400" />
                <StatCard icon={MessageSquare} label="Total comments" value={stats.totalComments} color="bg-purple-500/10 text-purple-400" />
                <StatCard icon={Flag} label="Total reports" value={stats.pendingReports} color="bg-amber-500/10 text-amber-400" />
              </div>
            )}
            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-5">
              <h2 className="font-semibold text-sm text-[hsl(var(--text-primary))] mb-3">Quick actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTab('users')} className="flex items-center gap-2 p-3 bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--accent-primary))]/30 transition-colors text-left">
                  <Users className="w-4 h-4 text-[hsl(var(--text-muted))]" /> Manage users
                </button>
                <button onClick={() => setTab('reports')} className="flex items-center gap-2 p-3 bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--accent-primary))]/30 transition-colors text-left">
                  <Flag className="w-4 h-4 text-[hsl(var(--text-muted))]" /> Review reports
                </button>
                <button onClick={() => setTab('topics')} className="flex items-center gap-2 p-3 bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--accent-primary))]/30 transition-colors text-left col-span-2">
                  <Hash className="w-4 h-4 text-[hsl(var(--text-muted))]" /> Manage topic interests
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && <UsersTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'topics' && <TopicsTab />}
      </div>
    </AppShell>
  );
}
