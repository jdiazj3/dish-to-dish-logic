import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin_total' | 'admin_sede' | 'cajero' | 'mesero' | 'mesero_externo' | 'cocina';

export function useUserRole(userId?: string) {
  const queryClient = useQueryClient();

  // Limpiar caché de roles cuando cambia el usuario o se cierra sesión
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        // Invalidar todos los cachés de roles al cambiar de usuario
        queryClient.invalidateQueries({ queryKey: ['user-roles'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (error) throw error;
        return (data || []).map(r => r.role as AppRole);
      } catch (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 0, // NO cachear roles - siempre consultar para seguridad
    gcTime: 0, // Eliminar inmediatamente del caché cuando no se usa
    retry: false,
  });
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, sedes(nombre)')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: false, // No reintentar en caso de error
  });
}
