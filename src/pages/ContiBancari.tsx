import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, AlertCircle, RefreshCw, Upload, ArrowDownUp } from "lucide-react";
import { BankAccountCard } from "@/components/conti-bancari/BankAccountCard";
import { ConnectBankModal } from "@/components/conti-bancari/ConnectBankModal";
import { UploadStatementModal } from "@/components/conti-bancari/UploadStatementModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useBankingIntegration, BankAccount, useBankAccountsQuery } from "@/hooks/useBankingIntegration";

export default function ContiBancari() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { syncAccount, removeAccount } = useBankingIntegration();
  const { data: accounts = [], isLoading, refetch } = useBankAccountsQuery();

  const { data: txCount = 0 } = useQuery({
    queryKey: ["bank-transactions-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bank_transactions")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const handleSync = async (id: string) => {
    await syncAccount(id);
  };

  const handleTest = async (id: string) => {
    await syncAccount(id);
  };

  const handleRemove = async (id: string) => {
    await removeAccount(id);
  };

  const handleDebug = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    console.log("[Debug] Account:", account);
    return { account };
  };

  const handleConnect = (newAccounts: BankAccount[]) => {
    console.log("Connected accounts:", newAccounts);
    refetch();
  };

  const handleUploadSuccess = () => {
    refetch();
  };

  // Approximate exchange rates to EUR (updated periodically)
  const toEurRate: Record<string, number> = {
    EUR: 1, USD: 0.92, GBP: 1.17, CHF: 1.06, JPY: 0.0061,
    CAD: 0.68, AUD: 0.60, SEK: 0.089, NOK: 0.087, DKK: 0.13,
    PLN: 0.23, CZK: 0.040, HUF: 0.0026, RON: 0.20, BGN: 0.51,
    HRK: 0.13, TRY: 0.027, CNY: 0.13, INR: 0.011, BRL: 0.16,
  };

  const totalBalance = accounts.reduce((sum, acc) => {
    const currency = (acc.currency || "EUR").toUpperCase();
    const rate = toEurRate[currency] ?? 1;
    return sum + (acc.balance || 0) * rate;
  }, 0);

  const mapAccountToCard = (account: BankAccount) => {
    const source = account.provider as "enable_banking" | "powens" | "manual" | "acube" | undefined;
    return {
      id: account.id,
      bankName: account.bank_name,
      iban: account.iban || `•••• ${account.mask || "****"}`,
      balance: account.available_balance || account.current_balance || account.balance || 0,
      currency: account.currency || "EUR",
      status: account.status as "active" | "pending" | "error" | "disconnected",
      lastSync: account.last_sync_at ? new Date(account.last_sync_at) : new Date(),
      source: source || "enable_banking",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conti Bancari</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i tuoi conti collegati tramite Enable Banking, A-Cube o caricando estratti conto
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Aggiorna
          </Button>
          <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Carica estratto conto
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Collega nuovo conto
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Importa i tuoi conti</AlertTitle>
        <AlertDescription>
          Collega i tuoi conti bancari tramite Enable Banking per sincronizzazione automatica, 
          oppure carica estratti conto in formato PDF o CSV per importare le transazioni manualmente.
        </AlertDescription>
      </Alert>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conti collegati</p>
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowDownUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transazioni totali</p>
              <p className="text-2xl font-bold text-foreground">{txCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo totale</p>
              <p className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("it-IT", {
                  style: "currency",
                  currency: "EUR",
                }).format(totalBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && accounts.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-foreground">Caricamento conti...</h3>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <BankAccountCard
              key={account.id}
              account={mapAccountToCard(account)}
              onSync={handleSync}
              onTest={handleTest}
              onRemove={handleRemove}
              onDebug={handleDebug}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && accounts.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Nessun conto collegato</h3>
          <p className="text-muted-foreground mt-1">
            Collega il tuo primo conto bancario per iniziare
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Collega conto
          </Button>
        </div>
      )}

      {/* Connect Bank Modal */}
      <ConnectBankModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConnect={handleConnect}
      />

      {/* Upload Statement Modal */}
      <UploadStatementModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
