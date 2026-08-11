import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ─── Auth user shape ──────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  joinedAt: string;
}

// ─── Map Supabase user → AuthUser (sync, from metadata) ──────────────────
function mapSupabaseUser(user: SupabaseUser, profile?: Record<string, unknown>): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    username:
      (profile?.username as string) ??
      (user.user_metadata?.username as string) ??
      user.email?.split('@')[0] ??
      'user',
    displayName:
      (profile?.display_name as string) ??
      (user.user_metadata?.display_name as string) ??
      '',
    bio: (profile?.bio as string) ?? '',
    avatarUrl: (profile?.avatar_url as string) ?? null,
    joinedAt:
      (profile?.joined_at as string) ??
      user.created_at ??
      new Date().toISOString(),
  };
}

// ─── Context ──────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (supabaseUser: SupabaseUser): Promise<AuthUser> => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username, display_name, bio, avatar_url, joined_at')
      .eq('id', supabaseUser.id)
      .single();
    return mapSupabaseUser(supabaseUser, profile ?? {});
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      const authUser = await fetchProfile(supabaseUser);
      setUser(authUser);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety #1: Check existing session (page refresh)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted && session?.user) {
        const authUser = await fetchProfile(session.user);
        if (mounted) setUser(authUser);
      }
      if (mounted) setLoading(false);
    });

    // Safety #2: Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const authUser = await fetchProfile(session.user);
          if (mounted) {
            setUser(authUser);
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Silently refresh
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
