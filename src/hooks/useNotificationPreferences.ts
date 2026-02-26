import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
  criticalAlerts: boolean;
  budgetAlerts: boolean;
  deadlineReminders: boolean;
  weeklySummary: boolean;
  notifyLiquidity: boolean;
  notifyCashflow: boolean;
  notificationEmail: string;
  createdAt: string;
  updatedAt: string;
}

const defaultPreferences: Omit<NotificationPreferences, "id" | "userId" | "createdAt" | "updatedAt"> = {
  emailAlerts: true,
  pushAlerts: true,
  criticalAlerts: true,
  budgetAlerts: true,
  deadlineReminders: true,
  weeklySummary: false,
  notifyLiquidity: true,
  notifyCashflow: true,
  notificationEmail: "",
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
        criticalAlerts: (data as any).critical_alerts ?? true,
        budgetAlerts: data.budget_alerts ?? true,
        deadlineReminders: data.deadline_reminders ?? true,
        weeklySummary: data.weekly_summary ?? false,
        notifyLiquidity: (data as any).notify_liquidity ?? true,
        notifyCashflow: (data as any).notify_cashflow ?? true,
        notificationEmail: (data as any).notification_email ?? "",
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

      const payload: Record<string, any> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (preferences.emailAlerts !== undefined) payload.email_alerts = preferences.emailAlerts;
      if (preferences.pushAlerts !== undefined) payload.push_alerts = preferences.pushAlerts;
      if (preferences.criticalAlerts !== undefined) payload.critical_alerts = preferences.criticalAlerts;
      if (preferences.budgetAlerts !== undefined) payload.budget_alerts = preferences.budgetAlerts;
      if (preferences.deadlineReminders !== undefined) payload.deadline_reminders = preferences.deadlineReminders;
      if (preferences.weeklySummary !== undefined) payload.weekly_summary = preferences.weeklySummary;
      if (preferences.notifyLiquidity !== undefined) payload.notify_liquidity = preferences.notifyLiquidity;
      if (preferences.notifyCashflow !== undefined) payload.notify_cashflow = preferences.notifyCashflow;
      if (preferences.notificationEmail !== undefined) payload.notification_email = preferences.notificationEmail || null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(payload as any, { onConflict: "user_id" })
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
