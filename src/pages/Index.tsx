import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      // Check if onboarding was completed — username will be email prefix if not
      const emailPrefix = user.email?.split('@')[0] ?? '';
      const hasRealUsername = user.username && user.username !== emailPrefix;
      if (!hasRealUsername) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/inbox', { replace: true });
      }
    } else {
      navigate('/welcome', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
      <div className="flex items-baseline gap-1 animate-pulse">
        <span className="font-serif text-4xl font-bold text-[hsl(var(--accent-primary))]">Le</span>
        <span className="font-serif text-4xl font-bold text-[hsl(var(--text-primary))]">BeHo</span>
      </div>
    </div>
  );
};

export default Index;
