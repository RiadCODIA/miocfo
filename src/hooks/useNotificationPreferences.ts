import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  criticalAlerts: boolean;
  weeklyReports: boolean;
  notifyLiquidity: boolean;
  notifyDeadlines: boolean;
  notifyBudget: boolean;
  notifyCashflow: boolean;
  notificationEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

const defaultPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  criticalAlerts: true,
  weeklyReports: false,
  notifyLiquidity: true,
  notifyDeadlines: true,
  notifyBudget: true,
  notifyCashflow: true,
  notificationEmail: null,
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
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        criticalAlerts: data.critical_alerts,
        weeklyReports: data.weekly_reports,
        notifyLiquidity: data.notify_liquidity,
        notifyDeadlines: data.notify_deadlines,
        notifyBudget: data.notify_budget,
        notifyCashflow: data.notify_cashflow,
        notificationEmail: data.notification_email,
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

      const updateData = {
        user_id: user.id,
        email_notifications: preferences.emailNotifications,
        push_notifications: preferences.pushNotifications,
        critical_alerts: preferences.criticalAlerts,
        weekly_reports: preferences.weeklyReports,
        notify_liquidity: preferences.notifyLiquidity,
        notify_deadlines: preferences.notifyDeadlines,
        notify_budget: preferences.notifyBudget,
        notify_cashflow: preferences.notifyCashflow,
        notification_email: preferences.notificationEmail,
        updated_at: new Date().toISOString(),
      };

      // Upsert - insert if not exists, update if exists
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(updateData, { onConflict: "user_id" })
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
