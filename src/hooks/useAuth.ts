//path: src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email?: string | null;
}

interface AuthSession {
  user: AuthUser | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then((res: { data: { session: AuthSession | null } }) => {
        setUser(res.data.session?.user ?? null);
        setIsAdmin(
          res.data.session?.user?.email?.endsWith('@admin.com') ?? false
        );
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: AuthSession | null) => {
        setUser(session?.user ?? null);
        setIsAdmin(session?.user?.email?.endsWith('@admin.com') ?? false);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    isAdmin,
    loading,
    signOut,
  };
};
