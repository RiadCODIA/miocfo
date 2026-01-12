import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

const getAlertIcon = (type: string) => {
  switch (type) {
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
};

export function AlertListener() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          const alert = payload.new as {
            id: string;
            type: string;
            title: string;
            description: string | null;
            priority: string;
          };

          // Show toast based on priority
          const toastFn = alert.priority === "high" ? toast.error : 
                         alert.priority === "medium" ? toast.warning : 
                         toast.info;

          toastFn(alert.title, {
            description: alert.description || undefined,
            icon: getAlertIcon(alert.type),
            action: {
              label: "Vedi",
              onClick: () => navigate("/alert"),
            },
            duration: alert.priority === "high" ? 10000 : 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, navigate]);

  return null;
}
