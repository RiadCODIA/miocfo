import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!user) throw new Error("Non autenticato");

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      refreshProfile();
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
  });
}
