import { Building2, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  const { profile, user } = useAuth();
  
  const hour = new Date().getHours();
  const greeting = hour < 13 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";
  
  const displayName = profile?.first_name 
    ? profile.first_name 
    : user?.email?.split("@")[0] || "Utente";

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ecco la tua panoramica finanziaria
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Ultimi 30 giorni</span>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
          Trial
        </Badge>
      </div>
    </div>
  );
}
