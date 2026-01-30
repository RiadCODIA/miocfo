import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, AlertCircle, RefreshCw, Upload } from "lucide-react";
import { BankAccountCard } from "@/components/conti-bancari/BankAccountCard";
import { ConnectBankModal } from "@/components/conti-bancari/ConnectBankModal";
import { UploadStatementModal } from "@/components/conti-bancari/UploadStatementModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEnableBanking, BankAccount } from "@/hooks/useEnableBanking";

export default function ContiBancari() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reconnectAccountId, setReconnectAccountId] = useState<string | null>(null);
  const { accounts, isLoading, fetchAccounts, syncAccount, removeAccount, completeSession } = useEnableBanking();

  // Fetch accounts on mount (callback handling is done by ConnectBankModal)
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSync = async (id: string) => {
    await syncAccount(id);
  };

  const handleTest = async (id: string) => {
    // Test connection by syncing
    await syncAccount(id);
  };

  const handleRemove = async (id: string) => {
    await removeAccount(id);
  };

  const handleReconnect = (id: string) => {
    // Store the account ID for reconnection and open the modal
    setReconnectAccountId(id);
    setIsModalOpen(true);
  };

  const handleConnect = (newAccounts: BankAccount[]) => {
    // Accounts are already added by the hook
    console.log("Connected accounts:", newAccounts);
    setReconnectAccountId(null); // Clear reconnect state
  };

  const handleUploadSuccess = () => {
    fetchAccounts();
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  // Map the account format to the card format
  const mapAccountToCard = (account: BankAccount) => ({
    id: account.id,
    bankName: account.bank_name,
    iban: account.iban || `•••• ${account.mask || "****"}`,
    balance: account.current_balance || 0,
    currency: account.currency || "EUR",
    status: account.status as "active" | "pending" | "error" | "disconnected",
    lastSync: account.last_sync_at ? new Date(account.last_sync_at) : new Date(),
    source: (account as BankAccount & { source?: string }).source || "enable_banking",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conti Bancari</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i tuoi conti collegati tramite Enable Banking o caricando estratti conto
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => fetchAccounts()} disabled={isLoading}>
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
              <Landmark className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conti attivi</p>
              <p className="text-2xl font-bold text-foreground">
                {accounts.filter((a) => a.status === "active").length}
              </p>
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
              onReconnect={handleReconnect}
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
