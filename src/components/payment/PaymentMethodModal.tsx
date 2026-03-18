import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Check, Lock, ArrowLeft, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscriptionPlans, type SubscriptionPlan } from "@/hooks/useSubscriptionPlans";
import { cn } from "@/lib/utils";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planId?: string;
  price: number;
  isAnnual: boolean;
  /** If provided, pre-selects a plan and skips the selection step */
  skipPlanSelection?: boolean;
}

export function PaymentMethodModal({
  open,
  onOpenChange,
  planName,
  planId,
  price,
  isAnnual,
  skipPlanSelection = false,
}: PaymentMethodModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
  const [success, setSuccess] = useState(false);

  // Plan selection state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [step, setStep] = useState<"select-plan" | "payment">(
    skipPlanSelection ? "payment" : "select-plan"
  );

  const activePlanName = skipPlanSelection ? planName : selectedPlan?.name || planName;
  const activePlanId = skipPlanSelection ? planId : selectedPlan?.id || planId;
  const activePrice = skipPlanSelection
    ? price
    : isAnnual
      ? (selectedPlan?.priceYearly ?? selectedPlan?.priceMonthly ?? price)
      : (selectedPlan?.priceMonthly ?? price);

  const handleStripeCheckout = async () => {
    if (!user) return;
    setLoading("stripe");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (activePlanId) {
      const { error } = await supabase.from("user_subscriptions").upsert(
        {
          user_id: user.id,
          plan_id: activePlanId,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: isAnnual
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        await supabase.from("user_subscriptions").insert({
          user_id: user.id,
          plan_id: activePlanId,
          status: "active",
          started_at: new Date().toISOString(),
        });
      }
    }

    await supabase
      .from("plan_requests")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "pending");

    setLoading(null);
    setSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    queryClient.invalidateQueries({ queryKey: ["my-plan-request"] });

    toast.success(`Piano ${activePlanName} attivato con successo! (Mock)`);

    setTimeout(() => {
      setSuccess(false);
      setStep(skipPlanSelection ? "payment" : "select-plan");
      setSelectedPlan(null);
      onOpenChange(false);
    }, 2000);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setStep(skipPlanSelection ? "payment" : "select-plan");
      setSelectedPlan(null);
      setSuccess(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === "select-plan" && !success ? (
          <>
            <DialogHeader>
              <DialogTitle>Scegli il tuo piano</DialogTitle>
              <DialogDescription>
                Seleziona il piano più adatto alle tue esigenze
              </DialogDescription>
            </DialogHeader>

            {plansLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
                {(plans || [])
                  .filter((p) => p.isActive)
                  .map((plan) => {
                    const isCurrent = plan.id === planId;
                    const isSelected = selectedPlan?.id === plan.id;

                    return (
                      <button
                        key={plan.id}
                        onClick={() => !isCurrent && setSelectedPlan(plan)}
                        disabled={isCurrent}
                        className={cn(
                          "w-full text-left rounded-lg border p-4 transition-all",
                          isCurrent
                            ? "border-primary/30 bg-primary/5 opacity-70 cursor-default"
                            : isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                              : "border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/50 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{plan.name}</p>
                              {isCurrent && (
                                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                                  Piano attuale
                                </Badge>
                              )}
                            </div>
                            {plan.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">€{plan.priceMonthly}</p>
                            <p className="text-[11px] text-muted-foreground">/mese</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>AI Assistant: {plan.aiAssistantMessagesLimitMonthly}/mese</span>
                          <span>• Analisi AI: {plan.aiTransactionAnalysesLimitMonthly}/mese</span>
                          {plan.maxBankAccounts && <span>• {plan.maxBankAccounts} conti</span>}
                          {plan.maxInvoicesMonthly && <span>• {plan.maxInvoicesMonthly} fatture/mese</span>}
                        </div>
                      </button>
                    );
                  })}

                <Button
                  className="w-full mt-4 gap-2"
                  disabled={!selectedPlan}
                  onClick={() => setStep("payment")}
                >
                  <CreditCard className="h-4 w-4" />
                  Continua con {selectedPlan?.name || "…"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              {!skipPlanSelection && !success && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -ml-2 mb-1 gap-1 text-muted-foreground"
                  onClick={() => setStep("select-plan")}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Indietro
                </Button>
              )}
              <DialogTitle>Scegli il metodo di pagamento</DialogTitle>
              <DialogDescription>
                Piano <span className="font-semibold text-foreground">{activePlanName}</span> — €{activePrice}/{isAnnual ? "anno" : "mese"}
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
                <Button
                  variant="outline"
                  className="w-full h-14 justify-between px-4"
                  onClick={handleStripeCheckout}
                  disabled={loading !== null}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
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

                <Button
                  variant="outline"
                  className="w-full h-14 justify-between px-4 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-sm font-bold text-muted-foreground">PP</span>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
