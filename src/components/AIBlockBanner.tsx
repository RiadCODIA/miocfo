import { useState } from "react";
import { AlertTriangle, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIUsage } from "@/hooks/useAIUsage";
import { useNavigate } from "react-router-dom";
import { AIRechargeModal } from "@/components/payment/AIRechargeModal";

export function AIBlockBanner() {
  const { isBlocked, usage, shouldSuggestUpgrade, upgradePlan } = useAIUsage();
  const navigate = useNavigate();
  const [rechargeOpen, setRechargeOpen] = useState(false);

  if (!isBlocked) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <div className="rounded-2xl bg-card border border-destructive/30 shadow-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Limite AI raggiunto</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hai raggiunto il limite di utilizzo AI incluso nel tuo piano per questo mese.
                Ricarica il credito o passa a un piano superiore per continuare.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setRechargeOpen(true)}
            >
              <Zap className="h-3 w-3" />
              Ricarica credito AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => navigate("/piani-pricing")}
            >
              <ArrowRight className="h-3 w-3" />
              Passa a un piano superiore
            </Button>
          </div>

          {shouldSuggestUpgrade && upgradePlan && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-xs text-foreground">
                <strong>Stai usando molto l'AI!</strong> Il piano {upgradePlan} include una soglia più alta.
              </p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-primary gap-1"
                onClick={() => navigate("/piani-pricing")}
              >
                Scopri il piano {upgradePlan} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            Consumo: €{usage?.costAccumulated.toFixed(2)} / €{usage?.budgetAvailable.toFixed(2)} disponibili
          </p>
        </div>
      </div>
      <AIRechargeModal open={rechargeOpen} onOpenChange={setRechargeOpen} />
    </>
  );
}
