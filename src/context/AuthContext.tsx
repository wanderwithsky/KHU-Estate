import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_code: string;
  role: string;
  full_name: string;
  email: string;
  status: string;
  must_change_password?: boolean;
  parent_user_id?: string;
  senior_tl_id?: string;
  team_id?: string;
}

// Track current session ID so we can close it on logout
let currentLoginSessionId: string | null = null;

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  logout: () => Promise<void>;
  pingHeartbeat: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsInitialized(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          if (_event === 'SIGNED_IN') {
             await trackLogin(session.user.id);
          }
        } else {
          setProfile(null);
          setIsInitialized(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error.message);
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setIsInitialized(true);
    }
  };

  const trackLogin = async (authUserId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      if (profileData) {
        currentLoginSessionId = crypto.randomUUID();
        await supabase.from('login_sessions').insert({
          session_id: currentLoginSessionId,
          user_id: profileData.id,
          status: 'ACTIVE',
        });
      }
    } catch (e) {
      console.error('Failed to track login', e);
    }
  };

  const logout = async () => {
    if (currentLoginSessionId) {
      await supabase.from('login_sessions').update({
        logout_at: new Date().toISOString(),
        status: 'ENDED'
      }).eq('session_id', currentLoginSessionId);
      currentLoginSessionId = null;
    }
    await supabase.auth.signOut();
  };

  const pingHeartbeat = async () => {
    if (currentLoginSessionId) {
      await supabase.from('login_sessions').update({
        last_activity_at: new Date().toISOString()
      }).eq('session_id', currentLoginSessionId);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isInitialized, logout, pingHeartbeat }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
