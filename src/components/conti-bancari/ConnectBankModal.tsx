import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bank {
  id: string;
  name: string;
  country: string;
}

const mockBanks: Bank[] = [
  { id: "unicredit", name: "UniCredit", country: "Italia" },
  { id: "intesa", name: "Intesa Sanpaolo", country: "Italia" },
  { id: "bnl", name: "BNL - BNP Paribas", country: "Italia" },
  { id: "mps", name: "Monte dei Paschi di Siena", country: "Italia" },
  { id: "credem", name: "Credem", country: "Italia" },
  { id: "bper", name: "BPER Banca", country: "Italia" },
  { id: "fineco", name: "Fineco Bank", country: "Italia" },
  { id: "ing", name: "ING", country: "Italia" },
];

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (bankId: string, bankName: string) => void;
}

export function ConnectBankModal({ open, onOpenChange, onConnect }: ConnectBankModalProps) {
  const [step, setStep] = useState<"search" | "authorize" | "success">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const filteredBanks = mockBanks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setStep("authorize");
  };

  const handleAuthorize = async () => {
    setIsConnecting(true);
    // Simulate GoCardless authorization flow
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setStep("success");
  };

  const handleComplete = () => {
    if (selectedBank) {
      onConnect(selectedBank.id, selectedBank.name);
    }
    // Reset state
    setStep("search");
    setSearchQuery("");
    setSelectedBank(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setStep("search");
    setSearchQuery("");
    setSelectedBank(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "search" && "Collega un conto bancario"}
            {step === "authorize" && "Autorizza l'accesso"}
            {step === "success" && "Connessione riuscita!"}
          </DialogTitle>
          <DialogDescription>
            {step === "search" && "Cerca la tua banca per collegare il conto tramite GoCardless"}
            {step === "authorize" && `Autorizza Finexa ad accedere ai dati di ${selectedBank?.name}`}
            {step === "success" && "Il tuo conto è stato collegato con successo"}
          </DialogDescription>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca la tua banca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => handleSelectBank(bank)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{bank.name}</p>
                    <p className="text-sm text-muted-foreground">{bank.country}</p>
                  </div>
                </button>
              ))}
              {filteredBanks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nessuna banca trovata
                </p>
              )}
            </div>
          </div>
        )}

        {step === "authorize" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-foreground">
                Verrai reindirizzato alla pagina di login di <strong>{selectedBank?.name}</strong> per autorizzare l'accesso.
              </p>
              <p className="text-sm text-muted-foreground">
                Powered by GoCardless - i tuoi dati sono al sicuro
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleAuthorize}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connessione in corso...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Autorizza accesso
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("search")}
                className="w-full"
                disabled={isConnecting}
              >
                Indietro
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-foreground">
                Il conto <strong>{selectedBank?.name}</strong> è stato collegato con successo!
              </p>
              <p className="text-sm text-muted-foreground">
                Le transazioni verranno sincronizzate automaticamente
              </p>
            </div>
            <Button onClick={handleComplete} className="w-full">
              Chiudi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
