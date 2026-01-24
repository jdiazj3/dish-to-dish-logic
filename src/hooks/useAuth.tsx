import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST - MUST be synchronous
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Si la sesión es invalidada o hay signout, limpiar todo
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Synchronous state updates only
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Si hay error de sesión, limpiar estado
      if (error || !session) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Session check failed:', err);
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, nombre: string, apellido: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          nombre,
          apellido
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      // Limpiar estado local independientemente del resultado
      setSession(null);
      setUser(null);
      return { error: null };
    } catch (err) {
      // Aún así limpiar estado local
      setSession(null);
      setUser(null);
      return { error: null };
    }
  };

  return { user, session, loading, signIn, signUp, signOut };
}
