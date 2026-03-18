import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIUsage } from "@/hooks/useAIUsage";
import { useNavigate } from "react-router-dom";

export function AIBlockBanner() {
  const { isAssistantBlocked, isTransactionAnalysesBlocked, usage, shouldSuggestUpgrade, upgradePlan } = useAIUsage();
  const navigate = useNavigate();

  if (!isAssistantBlocked && !isTransactionAnalysesBlocked) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      <div className="rounded-2xl bg-card border border-destructive/30 shadow-xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Limite AI del piano raggiunto</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAssistantBlocked && isTransactionAnalysesBlocked
                ? "Hai esaurito sia i messaggi AI sia le analisi AI mensili incluse nel tuo piano."
                : isAssistantBlocked
                  ? "Hai esaurito i messaggi AI mensili inclusi nel tuo piano."
                  : "Hai esaurito le analisi AI mensili incluse nel tuo piano."}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <p>Messaggi AI: <strong className="text-foreground">{usage?.assistantMessagesUsed ?? 0} / {usage?.assistantMessagesLimit ?? 0}</strong></p>
          <p>Analisi AI: <strong className="text-foreground">{usage?.transactionAnalysesUsed ?? 0} / {usage?.transactionAnalysesLimit ?? 0}</strong></p>
        </div>

        <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => navigate("/pricing")}>
          <ArrowRight className="h-3 w-3" />
          Passa a un piano superiore
        </Button>

        {shouldSuggestUpgrade && upgradePlan && (
          <p className="text-[10px] text-center text-muted-foreground">Upgrade consigliato: piano {upgradePlan}</p>
        )}
      </div>
    </div>
  );
}
