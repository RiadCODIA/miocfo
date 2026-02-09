import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CategoryAnalysisCard() {
  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[200px]">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">Analisi Categorie</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
        Sblocca l'analisi dettagliata delle categorie di spesa con il piano Pro
      </p>
      <Button size="sm" variant="outline" className="text-xs">
        Upgrade
      </Button>
    </div>
  );
}
