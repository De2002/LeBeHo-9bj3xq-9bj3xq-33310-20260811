import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, Category } from '@/types';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'username' | 'geo' | 'topics';

const GEO_OPTIONS = [
  { id: 'global',       label: 'Global',         icon: '🌍' },
  { id: 'africa',       label: 'Africa',          icon: '🌍' },
  { id: 'asia',         label: 'Asia',            icon: '🌏' },
  { id: 'europe',       label: 'Europe',          icon: '🌍' },
  { id: 'north-america',label: 'North America',   icon: '🌎' },
  { id: 'south-america',label: 'South America',   icon: '🌎' },
  { id: 'oceania',      label: 'Oceania',         icon: '🌏' },
  { id: 'us',           label: 'United States',   icon: '🇺🇸' },
  { id: 'uk',           label: 'United Kingdom',  icon: '🇬🇧' },
  { id: 'nigeria',      label: 'Nigeria',         icon: '🇳🇬' },
  { id: 'kenya',        label: 'Kenya',           icon: '🇰🇪' },
  { id: 'ghana',        label: 'Ghana',           icon: '🇬🇭' },
  { id: 'south-africa', label: 'South Africa',    icon: '🇿🇦' },
  { id: 'india',        label: 'India',           icon: '🇮🇳' },
  { id: 'germany',      label: 'Germany',         icon: '🇩🇪' },
  { id: 'france',       label: 'France',          icon: '🇫🇷' },
  { id: 'brazil',       label: 'Brazil',          icon: '🇧🇷' },
  { id: 'canada',       label: 'Canada',          icon: '🇨🇦' },
  { id: 'japan',        label: 'Japan',           icon: '🇯🇵' },
  { id: 'china',        label: 'China',           icon: '🇨🇳' },
  { id: 'australia',    label: 'Australia',       icon: '🇦🇺' },
  { id: 'mexico',       label: 'Mexico',          icon: '🇲🇽' },
  { id: 'egypt',        label: 'Egypt',           icon: '🇪🇬' },
];

const STEPS: Step[] = ['username', 'geo', 'topics'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [selectedGeo, setSelectedGeo] = useState<string[]>(['global']);
  const [selectedTopics, setSelectedTopics] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const currentIdx = STEPS.indexOf(step);

  // ── Step 1: Validate & save username ────────────────────────────────────
  const handleUsernameNext = async () => {
    const cleaned = username.trim().replace(/\s+/g, '').toLowerCase();
    if (!cleaned || cleaned.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
      setUsernameError('Only letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    // Check uniqueness
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', cleaned)
      .single();

    if (existing) {
      setLoading(false);
      setUsernameError('That username is already taken');
      return;
    }
    setLoading(false);
    setUsernameError('');
    setStep('geo');
  };

  // ── Step 3: Save everything & go to inbox ───────────────────────────────
  const handleFinish = async (skip = false) => {
    setLoading(true);
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) {
      toast.error('Session expired. Please sign in again.');
      navigate('/auth', { replace: true });
      return;
    }

    const cleaned = username.trim().replace(/\s+/g, '').toLowerCase();

    const geoInterests = selectedGeo;
    const topicInterests = skip ? [] : selectedTopics.map(t => t);

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: supabaseUser.id,
        email: supabaseUser.email,
        username: cleaned,
        display_name: displayName.trim() || cleaned,
        joined_at: new Date().toISOString(),
        bio: '',
      });

    if (error) {
      setLoading(false);
      toast.error('Failed to save profile. Please try again.');
      return;
    }

    // Save interests to localStorage for now (can be moved to DB later)
    localStorage.setItem('lebho_geo_interests', JSON.stringify(geoInterests));
    localStorage.setItem('lebho_topic_interests', JSON.stringify(topicInterests));

    // Update auth metadata
    await supabase.auth.updateUser({
      data: {
        username: cleaned,
        display_name: displayName.trim() || cleaned,
      },
    });

    await refreshProfile();
    setLoading(false);
    navigate('/inbox', { replace: true });
  };

  const toggleGeo = (id: string) => {
    setSelectedGeo(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleTopic = (cat: Category) => {
    setSelectedTopics(prev =>
      prev.includes(cat) ? prev.filter(t => t !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-baseline gap-1 justify-center mb-8">
          <span className="font-serif text-3xl font-bold text-[hsl(var(--accent-primary))]">Le</span>
          <span className="font-serif text-3xl font-bold text-[hsl(var(--text-primary))]">BeHo</span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const isActive = step === s;
            const isDone = currentIdx > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                  isActive
                    ? 'bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))] scale-110'
                    : isDone
                    ? 'bg-[hsl(var(--accent-primary))]/20 text-[hsl(var(--accent-primary))]'
                    : 'bg-[hsl(var(--surface))] text-[hsl(var(--text-muted))]'
                )}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'h-px w-10 transition-colors duration-300',
                    currentIdx > i ? 'bg-[hsl(var(--accent-primary))]/50' : 'bg-[hsl(var(--border-subtle))]'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Username ── */}
        {step === 'username' && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
              Choose your LeBeHo identity
            </h2>
            <p className="text-sm text-[hsl(var(--text-muted))] mb-8 leading-relaxed">
              This is your public pseudonym. Your real name stays private forever.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 block">
                  Username <span className="text-[hsl(var(--accent-primary))]">*</span>
                </label>
                <div className={cn(
                  'flex items-center bg-[hsl(var(--input-bg))] border rounded-xl overflow-hidden transition-colors',
                  usernameError
                    ? 'border-red-500/60'
                    : 'border-[hsl(var(--border-subtle))] focus-within:border-[hsl(var(--accent-primary))]/50'
                )}>
                  <span className="pl-4 text-[hsl(var(--accent-primary))] font-bold text-sm select-none">@</span>
                  <input
                    className="flex-1 bg-transparent px-2 py-3.5 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none text-sm"
                    placeholder="MayaThinks"
                    value={username}
                    autoFocus
                    onChange={e => { setUsername(e.target.value.replace(/\s/g, '')); setUsernameError(''); }}
                    maxLength={30}
                    onKeyDown={e => e.key === 'Enter' && handleUsernameNext()}
                  />
                </div>
                {usernameError && (
                  <p className="text-xs text-red-400 mt-1.5">{usernameError}</p>
                )}
                <p className="text-xs text-[hsl(var(--text-muted))] mt-1.5">
                  Letters, numbers, and underscores only. This cannot be changed later.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 block">
                  Display name{' '}
                  <span className="font-normal normal-case tracking-normal text-[hsl(var(--text-muted))]/60">optional</span>
                </label>
                <input
                  className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none focus:border-[hsl(var(--accent-primary))]/50 transition-colors text-sm"
                  placeholder="Can be anything — doesn't have to be your real name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value.slice(0, 50))}
                  onKeyDown={e => e.key === 'Enter' && handleUsernameNext()}
                />
              </div>
            </div>

            <button
              onClick={handleUsernameNext}
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] disabled:opacity-60 text-[hsl(var(--accent-fg))] font-semibold py-3.5 rounded-xl transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Continue <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ── Step 2: Geo interests ── */}
        {step === 'geo' && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
              What world do you want in your inbox?
            </h2>
            <p className="text-sm text-[hsl(var(--text-muted))] mb-6 leading-relaxed">
              Select continents and countries. Your feed will prioritise these perspectives.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6 max-h-72 overflow-y-auto pr-1">
              {GEO_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleGeo(opt.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left',
                    selectedGeo.includes(opt.id)
                      ? 'bg-[hsl(var(--accent-primary))]/10 border-[hsl(var(--accent-primary))]/40 text-[hsl(var(--accent-primary))]'
                      : 'bg-[hsl(var(--surface))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--text-muted))]'
                  )}
                >
                  <span className="text-base leading-none">{opt.icon}</span>
                  <span className="truncate flex-1">{opt.label}</span>
                  {selectedGeo.includes(opt.id) && <Check className="w-3 h-3 flex-shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('username')}
                className="px-4 py-3 rounded-xl border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] text-sm font-medium hover:bg-[hsl(var(--surface))] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('topics')}
                className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-fg))] font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Topic interests ── */}
        {step === 'topics' && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
              What topics matter to you?
            </h2>
            <p className="text-sm text-[hsl(var(--text-muted))] mb-6 leading-relaxed">
              Pick as many as you like. You can always update these in Settings.
            </p>

            <div className="flex flex-wrap gap-2 mb-6 max-h-60 overflow-y-auto pr-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleTopic(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                    selectedTopics.includes(cat)
                      ? 'bg-[hsl(var(--accent-primary))]/10 border-[hsl(var(--accent-primary))]/40 text-[hsl(var(--accent-primary))]'
                      : 'bg-[hsl(var(--surface))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--text-muted))]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('geo')}
                className="px-4 py-3 rounded-xl border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] text-sm font-medium hover:bg-[hsl(var(--surface))] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleFinish(false)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] disabled:opacity-60 text-[hsl(var(--accent-fg))] font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Open my inbox <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>

            <button
              onClick={() => handleFinish(true)}
              disabled={loading}
              className="w-full mt-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] py-2 transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
