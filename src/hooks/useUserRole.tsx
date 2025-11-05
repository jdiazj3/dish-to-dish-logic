import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin_total' | 'admin_sede' | 'cajero' | 'mesero' | 'cocina';

export function useUserRole(userId?: string) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map(r => r.role as AppRole);
    },
    enabled: !!userId,
  });
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, sedes(nombre)')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
