import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import { usePlaid, BankAccount } from "@/hooks/usePlaid";

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accounts: BankAccount[]) => void;
}

export function ConnectBankModal({ open, onOpenChange, onConnect }: ConnectBankModalProps) {
  const [step, setStep] = useState<"init" | "ready" | "connecting" | "success" | "error">("init");
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const { createLinkToken, exchangePublicToken, isLoading } = usePlaid();

  // Get link token when modal opens
  useEffect(() => {
    if (open && !linkToken) {
      setStep("init");
      createLinkToken()
        .then((token) => {
          setLinkToken(token);
          setStep("ready");
        })
        .catch((error) => {
          console.error("Failed to get link token:", error);
          setErrorMessage(error.message || "Impossibile inizializzare Plaid");
          setStep("error");
        });
    }
  }, [open, linkToken, createLinkToken]);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setStep("connecting");
      try {
        const accounts = await exchangePublicToken(publicToken);
        setConnectedAccounts(accounts);
        setStep("success");
      } catch (error) {
        console.error("Failed to exchange token:", error);
        setErrorMessage(error instanceof Error ? error.message : "Errore nel collegamento");
        setStep("error");
      }
    },
    [exchangePublicToken]
  );

  const onExit = useCallback(() => {
    // User exited Plaid Link without completing
    console.log("User exited Plaid Link");
  }, []);

  const { open: openPlaidLink, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  const handleComplete = () => {
    onConnect(connectedAccounts);
    handleClose();
  };

  const handleClose = () => {
    setStep("init");
    setLinkToken(null);
    setConnectedAccounts([]);
    setErrorMessage("");
    onOpenChange(false);
  };

  const handleRetry = () => {
    setLinkToken(null);
    setErrorMessage("");
    setStep("init");
    createLinkToken()
      .then((token) => {
        setLinkToken(token);
        setStep("ready");
      })
      .catch((error) => {
        setErrorMessage(error.message || "Impossibile inizializzare Plaid");
        setStep("error");
      });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "init" && "Preparazione..."}
            {step === "ready" && "Collega un conto bancario"}
            {step === "connecting" && "Collegamento in corso..."}
            {step === "success" && "Connessione riuscita!"}
            {step === "error" && "Errore di connessione"}
          </DialogTitle>
          <DialogDescription>
            {step === "init" && "Stiamo preparando la connessione sicura con Plaid"}
            {step === "ready" && "Clicca per aprire Plaid Link e collegare il tuo conto"}
            {step === "connecting" && "Stiamo salvando i tuoi dati..."}
            {step === "success" && `${connectedAccounts.length} conto/i collegati con successo`}
            {step === "error" && "Si è verificato un errore durante il collegamento"}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {step === "init" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Inizializzazione Plaid...</p>
          </div>
        )}

        {/* Ready State */}
        {step === "ready" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-foreground">
                Clicca il pulsante qui sotto per aprire Plaid Link e selezionare la tua banca.
              </p>
              <p className="text-sm text-muted-foreground">
                Powered by Plaid - i tuoi dati sono criptati e al sicuro
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => openPlaidLink()}
                disabled={!ready || isLoading}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Apri Plaid Link
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Annulla
              </Button>
            </div>
          </div>
        )}

        {/* Connecting State */}
        {step === "connecting" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Stiamo collegando i tuoi conti...</p>
          </div>
        )}

        {/* Success State */}
        {step === "success" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-foreground">
                {connectedAccounts.length === 1 
                  ? `Il conto ${connectedAccounts[0].bank_name} è stato collegato!`
                  : `${connectedAccounts.length} conti sono stati collegati!`
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Le transazioni verranno sincronizzate automaticamente
              </p>
            </div>
            {connectedAccounts.length > 0 && (
              <div className="space-y-2">
                {connectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Building2 className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{account.bank_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.account_name || account.account_type} •••• {account.mask}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={handleComplete} className="w-full">
              Chiudi
            </Button>
          </div>
        )}

        {/* Error State */}
        {step === "error" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-foreground">Si è verificato un errore</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Riprova
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full">
                Chiudi
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
