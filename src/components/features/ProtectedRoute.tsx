import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    // Detect if onboarding was not completed:
    // After OTP verify but before onboarding, username falls back to email prefix.
    // A proper username is set explicitly in onboarding (stored in user_profiles.username).
    // We check the DB-sourced username vs the email-prefix fallback.
    const emailPrefix = user.email?.split('@')[0] ?? '';
    const hasRealUsername = user.username && user.username !== emailPrefix;
    if (!hasRealUsername && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="flex items-baseline gap-1 animate-pulse">
          <span className="font-serif text-4xl font-bold text-[hsl(var(--accent-primary))]">Le</span>
          <span className="font-serif text-4xl font-bold text-[hsl(var(--text-primary))]">BeHo</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
