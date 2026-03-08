import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUserSubscription } from "@/hooks/useUserSubscription";

export function LockedPageOverlay() {
  const navigate = useNavigate();
  const { hasSubscription } = useUserSubscription();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-auto">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center p-8 rounded-2xl bg-card border border-border shadow-xl">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {hasSubscription
            ? "Funzionalità non inclusa nel tuo piano"
            : "Nessun piano attivo"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasSubscription
            ? "Questa sezione non è disponibile con il tuo piano attuale. Effettua l'upgrade per sbloccarla."
            : "Per accedere a questa funzionalità è necessario un piano attivo. Scegli il piano più adatto a te."}
        </p>
        <div className="flex flex-col gap-2 w-full mt-2">
          <Button
            onClick={() => navigate("/piani-pricing")}
            className="w-full"
          >
            {hasSubscription ? "Upgrade Piano" : "Scegli un Piano"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="w-full"
          >
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
