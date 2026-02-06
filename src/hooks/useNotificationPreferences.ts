import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
  budgetAlerts: boolean;
  deadlineReminders: boolean;
  weeklySummary: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultPreferences = {
  emailAlerts: true,
  pushAlerts: true,
  budgetAlerts: true,
  deadlineReminders: true,
  weeklySummary: false,
};

export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async (): Promise<NotificationPreferences | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Return defaults if no record exists
        return {
          id: "",
          userId: user.id,
          ...defaultPreferences,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        id: data.id,
        userId: data.user_id,
        emailAlerts: data.email_alerts ?? true,
        pushAlerts: data.push_alerts ?? true,
        budgetAlerts: data.budget_alerts ?? true,
        deadlineReminders: data.deadline_reminders ?? true,
        weeklySummary: data.weekly_summary ?? false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    enabled: !!user?.id,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Partial<Omit<NotificationPreferences, "id" | "userId" | "createdAt" | "updatedAt">>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          email_alerts: preferences.emailAlerts,
          push_alerts: preferences.pushAlerts,
          budget_alerts: preferences.budgetAlerts,
          deadline_reminders: preferences.deadlineReminders,
          weekly_summary: preferences.weeklySummary,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}
