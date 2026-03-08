import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planId?: string;
  price: number;
  isAnnual: boolean;
}

export function PaymentMethodModal({
  open,
  onOpenChange,
  planName,
  planId,
  price,
  isAnnual,
}: PaymentMethodModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStripeCheckout = async () => {
    if (!user) return;
    setLoading("stripe");

    // Mock: simulate Stripe checkout delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // If we have a planId from subscription_plans table, activate subscription
    if (planId) {
      const { error } = await supabase.from("user_subscriptions").upsert(
        {
          user_id: user.id,
          plan_id: planId,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: isAnnual
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        // Fallback: just insert
        await supabase.from("user_subscriptions").insert({
          user_id: user.id,
          plan_id: planId,
          status: "active",
          started_at: new Date().toISOString(),
        });
      }
    }

    // Also cancel any pending plan requests
    await supabase
      .from("plan_requests")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "pending");

    setLoading(null);
    setSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    queryClient.invalidateQueries({ queryKey: ["my-plan-request"] });

    toast.success(`Piano ${planName} attivato con successo! (Mock)`);

    setTimeout(() => {
      setSuccess(false);
      onOpenChange(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scegli il metodo di pagamento</DialogTitle>
          <DialogDescription>
            Piano <span className="font-semibold text-foreground">{planName}</span> — €{price}/{isAnnual ? "anno" : "mese"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-foreground">Pagamento completato!</p>
            <p className="text-sm text-muted-foreground">Il tuo piano è stato attivato.</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {/* Stripe / Credit Card */}
            <Button
              variant="outline"
              className="w-full h-14 justify-between px-4"
              onClick={handleStripeCheckout}
              disabled={loading !== null}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Carta di credito / debito</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex via Stripe</p>
                </div>
              </div>
              {loading === "stripe" ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-xs font-medium text-muted-foreground">Mock</span>
              )}
            </Button>

            {/* PayPal - Coming Soon */}
            <Button
              variant="outline"
              className="w-full h-14 justify-between px-4 opacity-50 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(220,80%,95%)] dark:bg-[hsl(220,60%,15%)] flex items-center justify-center">
                  <span className="text-sm font-bold text-[hsl(220,80%,40%)]">PP</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">PayPal</p>
                  <p className="text-xs text-muted-foreground">In arrivo</p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Coming soon</span>
            </Button>

            <div className="flex items-center justify-center gap-1.5 pt-3 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Pagamento sicuro e crittografato</span>
            </div>

            <p className="text-[11px] text-center text-muted-foreground/70 pb-1">
              Ambiente di test — nessun addebito reale verrà effettuato.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
