import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowRight, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'email' | 'otp';

export default function AuthPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Step 1: Send OTP ────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setEmail(trimmed);
    setStep('otp');
    toast.success('Check your email — a 4-digit code is on its way');
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4) {
      toast.error('Enter the 4-digit code from your email');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'email',
    });
    if (error) {
      setLoading(false);
      toast.error('Invalid or expired code. Please try again.');
      return;
    }

    // Check if user already has a profile (returning user)
    const userId = data.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (profile?.username) {
        setLoading(false);
        navigate('/inbox', { replace: true });
        return;
      }
    }

    // New user — go to onboarding
    setLoading(false);
    navigate('/onboarding', { replace: true });
  };

  const handleResend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('New code sent');
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="flex items-baseline gap-1 justify-center mb-2">
          <span className="font-serif text-4xl font-bold text-[hsl(var(--accent-primary))]">Le</span>
          <span className="font-serif text-4xl font-bold text-[hsl(var(--text-primary))]">BeHo</span>
        </div>
        <p className="text-[hsl(var(--text-muted))] text-xs tracking-widest uppercase">Let's Be Honest.</p>
      </div>

      <div className="w-full max-w-sm">

        {/* ── Email step ── */}
        {step === 'email' && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mb-2 text-center">
              Sign in or join
            </h2>
            <p className="text-sm text-[hsl(var(--text-muted))] text-center mb-8 leading-relaxed">
              No password needed. We'll send a code to your email.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 block">
                  Email address
                </label>
                <div className="flex items-center bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden focus-within:border-[hsl(var(--accent-primary))]/50 transition-colors">
                  <Mail className="ml-4 w-4 h-4 text-[hsl(var(--text-muted))] flex-shrink-0" />
                  <input
                    type="email"
                    autoFocus
                    className="flex-1 bg-transparent px-3 py-3.5 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none text-sm"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] disabled:opacity-60 text-[hsl(var(--accent-fg))] font-semibold py-3.5 rounded-xl transition-colors text-sm"
              >
                {loading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>

            <p className="text-xs text-[hsl(var(--text-muted))] text-center mt-6 leading-relaxed">
              Your real identity stays private. LeBeHo is pseudonymous by design.
            </p>
          </div>
        )}

        {/* ── OTP step ── */}
        {step === 'otp' && (
          <div>
            <button
              onClick={() => { setStep('email'); setOtp(''); }}
              className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[hsl(var(--accent-primary))]/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-6 h-6 text-[hsl(var(--accent-primary))]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
                Check your email
              </h2>
              <p className="text-sm text-[hsl(var(--text-muted))] leading-relaxed">
                We sent a 4-digit code to<br />
                <span className="text-[hsl(var(--text-secondary))] font-medium">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 block">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none focus:border-[hsl(var(--accent-primary))]/50 transition-colors text-2xl font-bold tracking-[0.4em] text-center"
                  placeholder="••••"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] disabled:opacity-60 text-[hsl(var(--accent-fg))] font-semibold py-3.5 rounded-xl transition-colors text-sm"
              >
                {loading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <>Verify code <ArrowRight className="w-4 h-4" /></>}
              </button>

              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] py-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Resend code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
