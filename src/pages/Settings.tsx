import { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useTheme } from '@/components/features/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, updateUser, getInboxBg, setInboxBg } from '@/lib/storage';
import { SEOHead } from '@/components/features/SEOHead';
import {
  Sun, Moon, Palette, Info,
  User as UserIcon, Save, X, AlertCircle, Globe, Hash, Check,
  Image as ImageIcon, Upload, Trash2, Sliders,
  Download, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CATEGORIES } from '@/types';
import { useNavigate } from 'react-router-dom';

type Theme = 'dark' | 'light';

const THEME_OPTIONS = [
  { id: 'dark' as Theme, label: 'Dark', icon: Moon, previewBg: '#0d0d0d', previewAccent: '#ffffff', previewLine1: '#262626', previewLine2: '#1a1a1a' },
  { id: 'light' as Theme, label: 'Light', icon: Sun, previewBg: '#ffffff', previewAccent: '#0d0d0d', previewLine1: '#e0e0e0', previewLine2: '#efefef' },
];

const USERNAME_MAX = 30;
const DISPLAY_NAME_MAX = 50;
const BIO_MAX = 160;

// ─── Helpers ──────────────────────────────────────────────────────────────
function CharCount({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  return (
    <span className={cn('text-xs tabular-nums', pct >= 1 ? 'text-red-400' : pct >= 0.85 ? 'text-amber-400' : 'text-[hsl(var(--text-muted))]')}>
      {current}/{max}
    </span>
  );
}

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] overflow-hidden mb-4">
      <div className="px-5 py-4 border-b border-[hsl(var(--border-subtle))] flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[hsl(var(--accent-primary))]/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-[hsl(var(--text-primary))]">{title}</h2>
          {subtitle && <p className="text-xs text-[hsl(var(--text-muted))]">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Geo Interests (DB-backed) ────────────────────────────────────────────
interface PlatformScope {
  id: string;
  label: string;
  scope_type: 'Global' | 'Country' | 'City';
  parent_label: string | null;
}

function GeoInterestsPanel({ selected, onChange }: { selected: Set<string>; onChange: (s: Set<string>) => void }) {
  const [scopes, setScopes] = useState<PlatformScope[]>([]);
  const [loadingScopes, setLoadingScopes] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('platform_scopes')
      .select('id, label, scope_type, parent_label')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true })
      .then(({ data }) => {
        setScopes((data ?? []) as PlatformScope[]);
        setLoadingScopes(false);
      });
  }, []);

  const toggle = (label: string) => {
    const next = new Set(selected);
    if (next.has(label)) next.delete(label); else next.add(label);
    onChange(next);
  };

  const q = search.trim().toLowerCase();
  const filtered = scopes.filter(s =>
    !q || s.label.toLowerCase().includes(q) || (s.parent_label ?? '').toLowerCase().includes(q)
  );
  const grouped = {
    Global: filtered.filter(s => s.scope_type === 'Global'),
    Country: filtered.filter(s => s.scope_type === 'Country'),
    City: filtered.filter(s => s.scope_type === 'City'),
  };

  const typeBadge = (t: string) =>
    t === 'Global' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    : t === 'Country' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

  return (
    <div>
      <div className="flex items-center bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-3 py-2 mb-3 gap-2">
        <Globe className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none"
          placeholder="Search regions, countries, cities…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-[hsl(var(--text-muted))]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loadingScopes ? (
        <div className="flex justify-center py-6">
          <RefreshCw className="w-4 h-4 animate-spin text-[hsl(var(--text-muted))]" />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .filter(([, items]) => items.length > 0)
            .map(([type, items]) => (
              <div key={type}>
                <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest mb-2">{type}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.label)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all',
                        selected.has(s.label)
                          ? 'border-[hsl(var(--accent-primary))] bg-[hsl(var(--accent-primary))]/10 text-[hsl(var(--text-primary))]'
                          : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:border-[hsl(var(--accent-primary))]/40 hover:text-[hsl(var(--text-secondary))]'
                      )}
                    >
                      {selected.has(s.label) && <Check className="w-3 h-3 text-[hsl(var(--accent-primary))]" />}
                      <span>{s.label}</span>
                      {s.parent_label && (
                        <span className={cn('text-[10px] px-1 py-0.5 rounded border', typeBadge('City'))}>
                          {s.parent_label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {filtered.length === 0 && (
            <p className="text-xs text-[hsl(var(--text-muted))] text-center py-4">
              No scopes found{search ? ` for "${search}"` : ''}. Admin can add more in the Admin panel.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Topic Interests ──────────────────────────────────────────────────────
function TopicInterestsPanel({ selected, onChange }: { selected: Set<string>; onChange: (s: Set<string>) => void }) {
  const toggle = (cat: string) => {
    const next = new Set(selected);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[hsl(var(--text-muted))]">
          {selected.size === 0 ? 'Select topics to customise your feed' : `${selected.size} topic${selected.size !== 1 ? 's' : ''} selected`}
        </p>
        {selected.size > 0 && (
          <button onClick={() => onChange(new Set())} className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] underline underline-offset-2">
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const isSelected = selected.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all duration-150',
                isSelected
                  ? 'border-[hsl(var(--accent-primary))] bg-[hsl(var(--accent-primary))]/8 text-[hsl(var(--text-primary))]'
                  : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:border-[hsl(var(--accent-primary))]/40 hover:text-[hsl(var(--text-secondary))]'
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-[hsl(var(--accent-primary))]" />}
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inbox Background Panel ───────────────────────────────────────────────
function InboxBackgroundPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bg, setBg] = useState(() => getInboxBg());
  const [opacity, setOpacity] = useState(bg.opacity);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      setInboxBg(url, opacity);
      setBg({ imageUrl: url, opacity });
      toast.success('Inbox background updated');
    };
    reader.readAsDataURL(file);
  };

  const handleOpacityChange = (val: number) => {
    setOpacity(val);
    if (bg.imageUrl) setInboxBg(bg.imageUrl, val);
  };

  const handleRemove = () => {
    setInboxBg(null, opacity);
    setBg({ imageUrl: null, opacity });
    toast.success('Background removed');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
        Add a personal background image to your inbox. Adjust opacity so the content stays readable.
      </p>
      {bg.imageUrl && (
        <div className="relative rounded-xl overflow-hidden border border-[hsl(var(--border-subtle))] h-32">
          <img src={bg.imageUrl} alt="Inbox background preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${1 - opacity})` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-xs font-medium opacity-60">Preview</p>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[hsl(var(--border-subtle))] text-sm text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] transition-colors">
          <Upload className="w-4 h-4" />
          {bg.imageUrl ? 'Change image' : 'Upload image'}
        </button>
        {bg.imageUrl && (
          <button onClick={handleRemove} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" /> Remove
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3 h-3" /> Image Opacity
          </label>
          <span className="text-xs text-[hsl(var(--text-muted))] tabular-nums">{Math.round(opacity * 100)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={e => handleOpacityChange(parseFloat(e.target.value))} className="w-full accent-[hsl(var(--accent-primary))]" disabled={!bg.imageUrl} />
        <div className="flex justify-between text-[10px] text-[hsl(var(--text-muted))] mt-1">
          <span>Subtle</span><span>Vivid</span>
        </div>
      </div>
    </div>
  );
}

// ─── Export Content ───────────────────────────────────────────────────────
function ExportPanel({ userId }: { userId: string }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const [pointsRes, commentsRes] = await Promise.all([
      supabase.from('thoughts').select('title, body, category, geo_label, published_at, is_draft').eq('author_id', userId).order('published_at', { ascending: false }),
      supabase.from('comments').select('body, agree, created_at, thought_id').eq('author_id', userId).order('created_at', { ascending: false }),
    ]);

    const lines: string[] = [];
    lines.push('LeBeHo — Content Export');
    lines.push(`Exported: ${new Date().toLocaleString()}`);
    lines.push('='.repeat(60));
    lines.push('');

    if (pointsRes.data && pointsRes.data.length > 0) {
      lines.push('MY POINTS');
      lines.push('-'.repeat(60));
      pointsRes.data.forEach((p, i) => {
        lines.push(`\n[${i + 1}] ${p.title}`);
        lines.push(`Category: ${p.category} | Scope: ${p.geo_label} | ${p.is_draft ? 'Draft' : 'Published'}`);
        lines.push(`Date: ${p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}`);
        lines.push('');
        lines.push(p.body ?? '');
        lines.push('');
        lines.push('-'.repeat(60));
      });
    } else {
      lines.push('MY POINTS: None yet.');
    }

    lines.push('');
    if (commentsRes.data && commentsRes.data.length > 0) {
      lines.push('MY COMMENTS');
      lines.push('-'.repeat(60));
      commentsRes.data.forEach((c, i) => {
        const stance = c.agree === true ? '[Agree]' : c.agree === false ? '[Disagree]' : '[Neutral]';
        lines.push(`\n[${i + 1}] ${stance}`);
        lines.push(`Date: ${new Date(c.created_at).toLocaleDateString()}`);
        lines.push(c.body ?? '');
      });
    } else {
      lines.push('MY COMMENTS: None yet.');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lebelho-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast.success('Export downloaded');
  };

  return (
    <div>
      <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed mb-4">
        Download all your points and comments as a plain text file.
      </p>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] text-sm font-semibold hover:bg-[hsl(var(--accent-hover))] disabled:opacity-60 transition-colors"
      >
        {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {exporting ? 'Exporting…' : 'Export my content'}
      </button>
    </div>
  );
}

// ─── Delete Account ───────────────────────────────────────────────────────
function DeleteAccountPanel({ userId, onDeleted }: { userId: string; onDeleted: () => void }) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [confirmText, setConfirmText] = useState('');
  const CONFIRM_PHRASE = 'delete my account';

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== CONFIRM_PHRASE) {
      toast.error(`Type "${CONFIRM_PHRASE}" exactly to confirm`);
      return;
    }
    setStep('deleting');
    await supabase.from('thoughts').delete().eq('author_id', userId);
    await supabase.from('user_profiles').delete().eq('id', userId);
    await supabase.auth.signOut();
    onDeleted();
  };

  if (step === 'idle') {
    return (
      <div>
        <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => setStep('confirm')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete account
        </button>
      </div>
    );
  }

  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
      <div className="flex items-start gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-400">This action is irreversible</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
            All your points, comments, votes, and profile data will be permanently deleted. Your username will become available again.
          </p>
        </div>
      </div>
      <p className="text-xs text-[hsl(var(--text-muted))] mb-2">
        Type <span className="font-mono font-bold text-red-400">{CONFIRM_PHRASE}</span> to confirm:
      </p>
      <input
        className="w-full bg-[hsl(var(--input-bg))] border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-[hsl(var(--text-primary))] outline-none focus:border-red-500/60 mb-3"
        placeholder={CONFIRM_PHRASE}
        value={confirmText}
        onChange={e => setConfirmText(e.target.value)}
        disabled={step === 'deleting'}
      />
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={step === 'deleting' || confirmText.toLowerCase() !== CONFIRM_PHRASE}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors"
        >
          {step === 'deleting' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {step === 'deleting' ? 'Deleting…' : 'Permanently delete'}
        </button>
        <button
          onClick={() => { setStep('idle'); setConfirmText(''); }}
          disabled={step === 'deleting'}
          className="px-4 py-2 rounded-xl text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────
export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user: authUser, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  const initialUser = getCurrentUser();
  const [savedValues, setSavedValues] = useState({
    username:    authUser?.username    ?? initialUser.username,
    displayName: authUser?.displayName ?? initialUser.displayName,
    bio:         authUser?.bio         ?? initialUser.bio,
  });
  const [username, setUsername] = useState(authUser?.username    ?? initialUser.username);
  const [displayName, setDisplayName] = useState(authUser?.displayName ?? initialUser.displayName);
  const [bio, setBio] = useState(authUser?.bio ?? initialUser.bio);
  const [errors, setErrors] = useState<{ username?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [geoInterests, setGeoInterests] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('lebelho_geo_interests');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [topicInterests, setTopicInterests] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('lebelho_topic_interests');
    return stored ? new Set(JSON.parse(stored)) : new Set(['Life', 'Society', 'Technology']);
  });

  const [interestsSaved, setInterestsSaved] = useState(false);

  const saveInterests = async () => {
    localStorage.setItem('lebelho_geo_interests', JSON.stringify([...geoInterests]));
    localStorage.setItem('lebelho_topic_interests', JSON.stringify([...topicInterests]));

    // Persist topic interests to DB for logged-in users
    if (authUser) {
      await supabase.from('user_topic_interests').upsert(
        { user_id: authUser.id, topics: [...topicInterests], updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    }

    setInterestsSaved(true);
    toast.success('Interests saved');
    setTimeout(() => setInterestsSaved(false), 2000);
  };

  const isDirty = username !== savedValues.username || displayName !== savedValues.displayName || bio !== savedValues.bio;

  const validateUsername = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return 'Username is required';
    if (trimmed.length < 3) return 'Must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Letters, numbers, and underscores only';
    return undefined;
  };

  const handleSave = async () => {
    const err = validateUsername(username);
    if (err) { setErrors({ username: err }); return; }
    setErrors({});

    if (username.trim().toLowerCase() !== savedValues.username.toLowerCase()) {
      setCheckingUsername(true);
      const { data: taken } = await supabase.rpc('is_username_taken', { p_username: username.trim().toLowerCase() });
      setCheckingUsername(false);
      if (taken) { setErrors({ username: 'This username is already taken' }); return; }
    }

    setIsSaving(true);
    const finalUsername = username.trim().toLowerCase();
    const finalDisplayName = displayName.trim() || finalUsername;
    const finalBio = bio.trim();

    if (authUser) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ username: finalUsername, display_name: finalDisplayName, bio: finalBio })
        .eq('id', authUser.id);
      if (error) {
        setIsSaving(false);
        if (error.code === '23505') { setErrors({ username: 'This username is already taken' }); }
        else { toast.error('Failed to save changes'); }
        return;
      }
      await supabase.auth.updateUser({ data: { username: finalUsername, display_name: finalDisplayName } });
      await refreshProfile();
    } else {
      updateUser({ username: finalUsername, displayName: finalDisplayName, bio: finalBio });
    }
    setSavedValues({ username: finalUsername, displayName: finalDisplayName, bio: finalBio });
    setDisplayName(finalDisplayName);
    setIsSaving(false);
    toast.success('Account updated');
  };

  const handleDiscard = () => {
    setUsername(savedValues.username);
    setDisplayName(savedValues.displayName);
    setBio(savedValues.bio);
    setErrors({});
  };

  const handleAccountDeleted = async () => {
    await logout();
    navigate('/welcome');
    toast.success('Your account has been deleted');
  };

  return (
    <AppShell>
      <SEOHead
        title="Settings"
        description="Manage your LeBeHo pseudonymous identity, interests, appearance, and account preferences."
        url="/settings"
        noIndex
      />
      <div className="max-w-xl mx-auto px-4 lg:px-6 py-8">

        <div className="mb-7">
          <h1 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mb-1">Settings</h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">Manage your LeBeHo identity and preferences.</p>
        </div>

        {/* ── Account ── */}
        <SectionCard icon={<UserIcon className="w-4 h-4 text-[hsl(var(--accent-primary))]" />} title="Account" subtitle="Your pseudonymous identity">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">Username</label>
                <CharCount current={username.length} max={USERNAME_MAX} />
              </div>
              <div className={cn('flex items-center bg-[hsl(var(--input-bg))] border rounded-xl overflow-hidden transition-colors', errors.username ? 'border-red-500/60' : 'border-[hsl(var(--border-subtle))] focus-within:border-[hsl(var(--accent-primary))]/50')}>
                <span className="pl-4 text-[hsl(var(--accent-primary))] font-bold text-sm select-none">@</span>
                <input
                  className="flex-1 bg-transparent px-2 py-3 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none text-sm"
                  value={username} placeholder="YourHandle"
                  onChange={e => { const val = e.target.value.replace(/\s/g, '').slice(0, USERNAME_MAX); setUsername(val); if (errors.username) setErrors(p => ({ ...p, username: undefined })); }}
                  spellCheck={false} autoComplete="off"
                />
                {checkingUsername && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[hsl(var(--text-muted))] mr-3" />}
              </div>
              {errors.username ? (
                <p className="flex items-center gap-1 text-xs text-red-400 mt-1.5"><AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.username}</p>
              ) : (
                <p className="text-xs text-[hsl(var(--text-muted))] mt-1.5">Your unique public identity on LeBeHo.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">Display Name <span className="font-normal normal-case tracking-normal text-[hsl(var(--text-muted))]/60">optional</span></label>
                <CharCount current={displayName.length} max={DISPLAY_NAME_MAX} />
              </div>
              <input className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none focus:border-[hsl(var(--accent-primary))]/50 transition-colors text-sm" placeholder="Doesn't have to be your real name" value={displayName} onChange={e => setDisplayName(e.target.value.slice(0, DISPLAY_NAME_MAX))} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">Bio <span className="font-normal normal-case tracking-normal text-[hsl(var(--text-muted))]/60">optional</span></label>
                <CharCount current={bio.length} max={BIO_MAX} />
              </div>
              <textarea className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none focus:border-[hsl(var(--accent-primary))]/50 transition-colors text-sm resize-none leading-relaxed" placeholder="A sentence about what you think, question, or care about." value={bio} onChange={e => setBio(e.target.value.slice(0, BIO_MAX))} rows={3} />
            </div>

            <div className={cn('flex items-center gap-2 overflow-hidden transition-all duration-200', isDirty ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0 pointer-events-none')}>
              <button onClick={handleSave} disabled={isSaving || checkingUsername} className="flex items-center gap-1.5 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] disabled:opacity-60 text-[hsl(var(--accent-fg))] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                <Save className="w-3.5 h-3.5" />{isSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={handleDiscard} disabled={isSaving} className="flex items-center gap-1.5 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] text-sm px-3 py-2.5 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />Discard
              </button>
            </div>
          </div>
        </SectionCard>

        {/* ── Inbox Background ── */}
        <SectionCard icon={<ImageIcon className="w-4 h-4 text-[hsl(var(--accent-primary))]" />} title="Inbox Background" subtitle="Optional personal touch for your inbox">
          <InboxBackgroundPanel />
        </SectionCard>

        {/* ── Geo Interests ── */}
        <SectionCard icon={<Globe className="w-4 h-4 text-[hsl(var(--accent-primary))]" />} title="Geographic Interests" subtitle="Follow regions that appear in your scope selections">
          <div className="mb-3 text-xs text-[hsl(var(--text-muted))] leading-relaxed">
            Select regions curated by LeBeHo admins. Your selected regions will appear first in scope lists.
            {geoInterests.size > 0 && (
              <span className="ml-1.5 font-semibold text-[hsl(var(--accent-primary))]">
                {geoInterests.size} selected.
              </span>
            )}
          </div>
          <GeoInterestsPanel selected={geoInterests} onChange={setGeoInterests} />
          <button
            onClick={saveInterests}
            className={cn('mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all', interestsSaved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-fg))]')}
          >
            {interestsSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Interests</>}
          </button>
        </SectionCard>

        {/* ── Topic Interests ── */}
        <SectionCard icon={<Hash className="w-4 h-4 text-[hsl(var(--accent-primary))]" />} title="Topic Interests" subtitle="Customise which topics fill your feed">
          <TopicInterestsPanel selected={topicInterests} onChange={setTopicInterests} />
          <button
            onClick={saveInterests}
            className={cn('mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all', interestsSaved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-fg))]')}
          >
            {interestsSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Interests</>}
          </button>
        </SectionCard>

        {/* ── Appearance ── */}
        <SectionCard icon={<Palette className="w-4 h-4 text-[hsl(var(--accent-primary))]" />} title="Appearance" subtitle="How LeBeHo looks to you">
          <div className="grid grid-cols-2 gap-3">
            {THEME_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = theme === opt.id;
              return (
                <button key={opt.id} onClick={() => setTheme(opt.id)}
                  className={cn('flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200', isActive ? 'border-[hsl(var(--accent-primary))] bg-[hsl(var(--accent-primary))]/6' : 'border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--accent-primary))]/40 hover:bg-[hsl(var(--surface-hover))]')}>
                  <div className="w-full h-14 rounded-xl overflow-hidden flex flex-col gap-1.5 p-2.5 border" style={{ backgroundColor: opt.previewBg, borderColor: opt.previewLine1 }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: opt.previewAccent + '60' }} />
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: opt.previewAccent + '80', width: '55%' }} />
                    </div>
                    <div className="h-1 rounded-full" style={{ backgroundColor: opt.previewLine1, width: '80%' }} />
                    <div className="h-1 rounded-full" style={{ backgroundColor: opt.previewLine2, width: '60%' }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4" style={{ color: isActive ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-muted))' }} />
                    <span className={cn('text-sm font-semibold', isActive ? 'text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-primary))]')}>{opt.label}</span>
                    {isActive && <span className="text-[10px] font-bold text-[hsl(var(--accent-primary))] bg-[hsl(var(--accent-primary))]/10 px-1.5 py-0.5 rounded-full">ON</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Export Content ── */}
        {authUser && (
          <SectionCard icon={<Download className="w-4 h-4 text-[hsl(var(--accent-primary))]" />} title="Export Content" subtitle="Download a copy of all your data">
            <ExportPanel userId={authUser.id} />
          </SectionCard>
        )}

        {/* ── About ── */}
        <SectionCard icon={<Info className="w-4 h-4 text-[hsl(var(--accent-primary))]" />} title="About LeBeHo">
          <div className="space-y-3 text-sm">
            {[{ label: 'Version', value: '1.0.0' }, { label: 'Identity', value: 'Pseudonymous' }].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1 border-b border-[hsl(var(--border-subtle))] last:border-0">
                <span className="text-[hsl(var(--text-muted))]">{row.label}</span>
                <span className="text-[hsl(var(--text-secondary))] font-medium">{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1 border-b border-[hsl(var(--border-subtle))]">
              <span className="text-[hsl(var(--text-muted))]">Principle</span>
              <span className="font-serif italic text-[hsl(var(--accent-primary))]">Let's Be Honest.</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {[{ label: 'Guidelines', path: '/guidelines' }, { label: 'Terms', path: '/terms' }, { label: 'Privacy', path: '/privacy' }, { label: 'About', path: '/about' }].map(({ label, path }) => (
                <button key={path} onClick={() => navigate(path)} className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent-primary))] underline underline-offset-2 transition-colors">{label}</button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── Danger zone ── */}
        {authUser && (
          <SectionCard icon={<AlertTriangle className="w-4 h-4 text-red-400" />} title="Danger Zone" subtitle="Irreversible actions">
            <DeleteAccountPanel userId={authUser.id} onDeleted={handleAccountDeleted} />
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}
