import { Calendar, CreditCard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardFilters() {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Ultimi 30 giorni</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-card border-border">
          <DropdownMenuItem>Oggi</DropdownMenuItem>
          <DropdownMenuItem>Ultimi 7 giorni</DropdownMenuItem>
          <DropdownMenuItem>Ultimi 30 giorni</DropdownMenuItem>
          <DropdownMenuItem>Ultimo trimestre</DropdownMenuItem>
          <DropdownMenuItem>Anno corrente</DropdownMenuItem>
          <DropdownMenuItem>Personalizzato...</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>Tutti i conti</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-card border-border">
          <DropdownMenuItem>Tutti i conti</DropdownMenuItem>
          <DropdownMenuItem>Conto Corrente Principale</DropdownMenuItem>
          <DropdownMenuItem>Conto Operativo</DropdownMenuItem>
          <DropdownMenuItem>Conto Deposito</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
