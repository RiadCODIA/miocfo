import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAIUsage } from "@/hooks/useAIUsage";
import { useNavigate } from "react-router-dom";

interface AIRechargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIRechargeModal({ open, onOpenChange }: AIRechargeModalProps) {
  const { usage, shouldSuggestUpgrade, upgradePlan } = useAIUsage();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Limite AI raggiunto
          </DialogTitle>
          <DialogDescription>
            Hai raggiunto il limite mensile previsto dal tuo piano per le funzionalità AI.
          </DialogDescription>
        </DialogHeader>

        {usage && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Messaggi AI Assistant</span>
              <span className="font-medium text-foreground">
                {usage.assistantMessagesUsed} / {usage.assistantMessagesLimit}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Analisi AI Transazioni</span>
              <span className="font-medium text-foreground">
                {usage.transactionAnalysesUsed} / {usage.transactionAnalysesLimit}
              </span>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          I limiti si rinnovano automaticamente ogni mese. Per continuare subito, puoi passare a un piano superiore.
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {shouldSuggestUpgrade && upgradePlan ? (
            <Button
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                navigate("/piani-pricing");
              }}
            >
              Passa al piano {upgradePlan}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Ho capito
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
