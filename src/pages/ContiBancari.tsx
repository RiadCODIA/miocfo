import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, AlertCircle } from "lucide-react";
import { BankAccountCard, BankAccount } from "@/components/conti-bancari/BankAccountCard";
import { ConnectBankModal } from "@/components/conti-bancari/ConnectBankModal";
import { ConnectionTestPanel } from "@/components/conti-bancari/ConnectionTestPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const mockAccounts: BankAccount[] = [
  {
    id: "1",
    bankName: "UniCredit",
    iban: "IT60X0542811101000000123456",
    balance: 45230.50,
    currency: "EUR",
    status: "active",
    lastSync: new Date(Date.now() - 1800000),
  },
  {
    id: "2",
    bankName: "Intesa Sanpaolo",
    iban: "IT60X0306911101000000654321",
    balance: 12890.00,
    currency: "EUR",
    status: "active",
    lastSync: new Date(Date.now() - 3600000),
  },
  {
    id: "3",
    bankName: "Fineco Bank",
    iban: "IT60X0301503200000003567890",
    balance: 8450.75,
    currency: "EUR",
    status: "pending",
    lastSync: new Date(Date.now() - 86400000),
  },
];

export default function ContiBancari() {
  const [accounts, setAccounts] = useState<BankAccount[]>(mockAccounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleSync = async (id: string) => {
    toast({
      title: "Sincronizzazione avviata",
      description: "Le transazioni verranno aggiornate a breve.",
    });
    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id ? { ...acc, lastSync: new Date(), status: "active" } : acc
      )
    );
    toast({
      title: "Sincronizzazione completata",
      description: "Le transazioni sono state aggiornate.",
    });
  };

  const handleTest = async (id: string) => {
    toast({
      title: "Test connessione",
      description: "Verifica della connessione in corso...",
    });
  };

  const handleRemove = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    toast({
      title: "Conto rimosso",
      description: "Il conto è stato scollegato con successo.",
    });
  };

  const handleConnect = (bankId: string, bankName: string) => {
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      bankName,
      iban: `IT60X${Math.random().toString().slice(2, 25)}`,
      balance: Math.random() * 50000,
      currency: "EUR",
      status: "pending",
      lastSync: new Date(),
    };
    setAccounts((prev) => [...prev, newAccount]);
    toast({
      title: "Conto collegato",
      description: `Il conto ${bankName} è stato aggiunto con successo.`,
    });
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conti Bancari</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i tuoi conti collegati tramite GoCardless
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Collega nuovo conto
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Integrazione GoCardless</AlertTitle>
        <AlertDescription>
          Per attivare l'integrazione reale con GoCardless, è necessario configurare le API keys 
          nel backend. Contatta l'amministratore per abilitare questa funzionalità.
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

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <BankAccountCard
            key={account.id}
            account={account}
            onSync={handleSync}
            onTest={handleTest}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {accounts.length === 0 && (
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

      {/* Connection Test Panel */}
      <ConnectionTestPanel />

      {/* Connect Bank Modal */}
      <ConnectBankModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConnect={handleConnect}
      />
    </div>
  );
}
