import { Landmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_type: string | null;
  balance: number | null;
}

export function AccountBalancesList() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["bank-accounts-balances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, name, bank_name, account_type, balance")
        .eq("is_connected", true)
        .order("balance", { ascending: false });
      if (error) throw error;
      return data as BankAccount[];
    },
  });

  const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 1;

  const formatCurrency = (value: number) =>
    `€ ${value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm h-full">
      <h3 className="text-sm font-semibold text-foreground mb-4">Saldi per Conto</h3>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Caricamento...</div>
      ) : !accounts?.length ? (
        <div className="text-sm text-muted-foreground">Nessun conto collegato</div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => {
            const pct = totalBalance > 0 ? ((acc.balance || 0) / totalBalance) * 100 : 0;
            return (
              <div key={acc.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Landmark className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{acc.name}</p>
                  <p className="text-xs text-muted-foreground">{acc.bank_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(acc.balance || 0)}</p>
                  <p className="text-xs text-muted-foreground">{pct.toFixed(0)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
