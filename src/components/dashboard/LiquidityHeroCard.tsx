import { TrendingUp, TrendingDown, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BankAccountOption {
  id: string;
  name: string;
  bank_name: string;
}

interface LiquidityHeroCardProps {
  totalBalance: number;
  change?: number;
  isLoading?: boolean;
  accounts?: BankAccountOption[];
  selectedAccountId: string | null;
  onAccountChange: (accountId: string | null) => void;
}

export function LiquidityHeroCard({
  totalBalance,
  change,
  isLoading,
  accounts,
  selectedAccountId,
  onAccountChange,
}: LiquidityHeroCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const now = new Date();

  const formatCurrency = (value: number) => {
    return value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);
  const buttonLabel = selectedAccount
    ? `${selectedAccount.bank_name} — ${selectedAccount.name}`
    : "Tutti i conti";

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Liquidità Totale
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-foreground">
              {isLoading ? "..." : `€ ${formatCurrency(totalBalance)}`}
            </span>
            {change !== undefined && !isLoading && (
              <span className={cn(
                "flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full",
                isPositive && "text-success bg-success/10",
                isNegative && "text-destructive bg-destructive/10",
                !isPositive && !isNegative && "text-muted-foreground bg-muted"
              )}>
                {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
                {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
              {isPositive && "+"}{change?.toFixed(1)}%
              <span className="ml-0.5">MoM</span>
              </span>
            )}
            {change !== undefined && !isLoading && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    Rappresenta la variazione percentuale del saldo complessivo dei conti correnti rispetto al mese precedente. Nello specifico: Liquidità Totale = Somma dei saldi di tutti i conti correnti.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ultimo aggiornamento: {format(now, "dd MMMM yyyy, HH:mm", { locale: it })}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground hover:bg-muted transition-colors max-w-[220px] truncate">
              <span className="truncate">{buttonLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border min-w-[200px]">
            <DropdownMenuItem
              onClick={() => onAccountChange(null)}
              className={cn(!selectedAccountId && "font-semibold")}
            >
              Tutti i conti
            </DropdownMenuItem>
            {accounts?.map((acc) => (
              <DropdownMenuItem
                key={acc.id}
                onClick={() => onAccountChange(acc.id)}
                className={cn(selectedAccountId === acc.id && "font-semibold")}
              >
                {acc.bank_name} — {acc.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
