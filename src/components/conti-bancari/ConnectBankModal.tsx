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
import { useEnableBanking, BankAccount } from "@/hooks/useEnableBanking";

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accounts: BankAccount[]) => void;
}

export function ConnectBankModal({ open, onOpenChange, onConnect }: ConnectBankModalProps) {
  const [step, setStep] = useState<"init" | "ready" | "connecting" | "success" | "error">("init");
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const { createSession, completeSession, isLoading } = useEnableBanking();

  // Generate redirect URI for Enable Banking callback
  const getRedirectUri = useCallback(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/conti-bancari`;
  }, []);

  // Get authorization URL when modal opens
  useEffect(() => {
    if (open && !authorizationUrl) {
      setStep("init");
      createSession(getRedirectUri())
        .then((data) => {
          setAuthorizationUrl(data.authorization_url);
          setSessionId(data.session_id);
          setStep("ready");
        })
        .catch((error) => {
          console.error("Failed to create session:", error);
          setErrorMessage(error.message || "Impossibile inizializzare Enable Banking");
          setStep("error");
        });
    }
  }, [open, authorizationUrl, createSession, getRedirectUri]);

  // Handle Enable Banking callback (check for code in URL on mount)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");

    if (authCode) {
      // Remove params from URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Complete the session with the authorization code
      setStep("connecting");
      completeSession(authCode)
        .then((accounts) => {
          setConnectedAccounts(accounts);
          setStep("success");
          onOpenChange(true); // Open modal to show success
        })
        .catch((error) => {
          console.error("Failed to complete session:", error);
          setErrorMessage(error.message || "Errore nel collegamento");
          setStep("error");
          onOpenChange(true); // Open modal to show error
        });
    }
  }, [completeSession, onOpenChange]);

  const handleOpenEnableBankingAuth = () => {
    if (authorizationUrl) {
      // Redirect to Enable Banking authorization page
      window.location.href = authorizationUrl;
    }
  };

  const handleComplete = () => {
    onConnect(connectedAccounts);
    handleClose();
  };

  const handleClose = () => {
    setStep("init");
    setAuthorizationUrl(null);
    setSessionId(null);
    setConnectedAccounts([]);
    setErrorMessage("");
    onOpenChange(false);
  };

  const handleRetry = () => {
    setAuthorizationUrl(null);
    setSessionId(null);
    setErrorMessage("");
    setStep("init");
    createSession(getRedirectUri())
      .then((data) => {
        setAuthorizationUrl(data.authorization_url);
        setSessionId(data.session_id);
        setStep("ready");
      })
      .catch((error) => {
        setErrorMessage(error.message || "Impossibile inizializzare Enable Banking");
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
            {step === "init" && "Stiamo preparando la connessione sicura con Enable Banking"}
            {step === "ready" && "Clicca per aprire la finestra di collegamento bancario"}
            {step === "connecting" && "Stiamo salvando i tuoi dati..."}
            {step === "success" && `${connectedAccounts.length} conto/i collegati con successo`}
            {step === "error" && "Si è verificato un errore durante il collegamento"}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {step === "init" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Inizializzazione Enable Banking...</p>
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
                Clicca il pulsante qui sotto per selezionare la tua banca e autorizzare l'accesso.
              </p>
              <p className="text-sm text-muted-foreground">
                Powered by Enable Banking - i tuoi dati sono criptati e al sicuro
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleOpenEnableBankingAuth}
                disabled={!authorizationUrl || isLoading}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Collega la tua banca
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
                        {account.account_name || account.account_type} {account.iban ? `IBAN: ...${account.iban.slice(-4)}` : account.mask ? `•••• ${account.mask}` : ""}
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
