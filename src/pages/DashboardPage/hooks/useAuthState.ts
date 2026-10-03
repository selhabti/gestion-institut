import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';

interface AuthUserLike {
  id: string;
  email?: string | null;
}

interface AuthSessionLike {
  user: AuthUserLike | null;
}

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUserLike | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: AuthSessionLike | null) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth
      .getSession()
      .then((res: { data: { session: AuthSessionLike | null } }) => {
        setUser(res.data.session?.user ?? null);
      });

    return () => subscription.unsubscribe();
  }, []);

  return { user };
};
