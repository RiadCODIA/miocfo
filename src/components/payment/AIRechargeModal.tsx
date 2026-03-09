import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAIUsage } from "@/hooks/useAIUsage";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AIRechargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RECHARGE_OPTIONS = [
  { amount: 5, label: "+€5", description: "Credito base" },
  { amount: 10, label: "+€10", description: "Credito standard", recommended: true },
  { amount: 15, label: "+€15", description: "Credito avanzato" },
];

export function AIRechargeModal({ open, onOpenChange }: AIRechargeModalProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [selected, setSelected] = useState<number>(10);
  const { usage, shouldSuggestUpgrade, upgradePlan } = useAIUsage();
  const navigate = useNavigate();

  const handleRecharge = async (amount: number) => {
    setLoading(amount);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Non autenticato");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-ai-recharge-checkout", {
        body: { amount_eur: amount },
      });

      if (error) throw new Error(error.message);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Nessun URL di pagamento ricevuto");
      }
    } catch (err) {
      toast.error("Errore pagamento", {
        description: err instanceof Error ? err.message : "Impossibile avviare il pagamento",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ricarica Credito AI
          </DialogTitle>
          <DialogDescription>
            Acquista credito aggiuntivo per continuare ad usare le funzionalità AI
          </DialogDescription>
        </DialogHeader>

        {/* Current Usage */}
        {usage && (
          <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credito usato</span>
              <span className="font-medium text-destructive">€{usage.costAccumulated.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Limite piano</span>
              <span className="font-medium">€{usage.planLimit.toFixed(2)}</span>
            </div>
            {usage.creditRecharged > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credito ricaricato</span>
                <span className="font-medium text-success">+€{usage.creditRecharged.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Recharge Options */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Seleziona importo</p>
          <div className="grid grid-cols-3 gap-3">
            {RECHARGE_OPTIONS.map((opt) => (
              <button
                key={opt.amount}
                onClick={() => setSelected(opt.amount)}
                className={cn(
                  "relative rounded-xl border-2 p-3 text-center transition-all cursor-pointer",
                  selected === opt.amount
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                {opt.recommended && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                    Consigliato
                  </span>
                )}
                <p className="font-bold text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={() => handleRecharge(selected)}
            disabled={loading !== null}
            className="w-full gap-2"
          >
            {loading === selected ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Paga +€{selected} con Stripe
          </Button>

          {shouldSuggestUpgrade && upgradePlan && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { onOpenChange(false); navigate("/piani-pricing"); }}
            >
              Passa al piano {upgradePlan}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            Annulla
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Il pagamento è gestito in sicurezza da Stripe. Il credito viene aggiunto immediatamente dopo il pagamento.
        </p>
      </DialogContent>
    </Dialog>
  );
}
