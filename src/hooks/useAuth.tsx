import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'university_admin';
  university_name: string | null;
  university_code: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Clear any invalid session data first
    const initializeAuth = async () => {
      try {
        // Clear any existing invalid sessions
        await supabase.auth.signOut({ scope: 'global' });
      } catch (error) {
        // Ignore errors during cleanup
        console.log('Cleanup completed');
      }
      
      if (!mounted) return;
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          console.log('Auth state changed:', event, session?.user?.email);
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Fetch profile data with retry
            setTimeout(async () => {
              if (!mounted) return;
              
              try {
                const { data: profileData, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .single();
                
                if (error) {
                  console.error('Profile fetch error:', error);
                  // If profile doesn't exist, it will be created by the trigger
                } else {
                  setProfile(profileData as Profile);
                }
              } catch (err) {
                console.error('Profile fetch failed:', err);
              }
            }, 100);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      );

      // Check for existing session
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session retrieval error:', error);
          // Clear invalid session
          await supabase.auth.signOut({ scope: 'global' });
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      }
      
      setLoading(false);
      
      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    };

    initializeAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Clear any existing sessions first
      await supabase.auth.signOut({ scope: 'global' });
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      
      console.log('SignUp result:', { data, error });
      
      return { error };
    } catch (err) {
      console.error('SignUp error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear any existing sessions
      await supabase.auth.signOut({ scope: 'global' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('SignIn result:', { data, error });
      
      return { error };
    } catch (err) {
      console.error('SignIn error:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      setProfile(null);
      
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for a clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      console.log('Password reset result:', { error });
      
      return { error };
    } catch (err) {
      console.error('Password reset error:', err);
      return { error: err };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };
    
    console.log('Updating profile for user:', user.id, 'with updates:', updates);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select();
    
    console.log('Update result:', { data, error });
    
    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }
    
    return { error };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}