import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ExternalLink, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useBankingIntegration, BankAccount } from "@/hooks/useBankingIntegration";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accounts: BankAccount[]) => void;
}

export function ConnectBankModal({ open, onOpenChange, onConnect }: ConnectBankModalProps) {
  const [step, setStep] = useState<"enter_fiscal_id" | "ready" | "connecting" | "success" | "error">("enter_fiscal_id");
  const [fiscalId, setFiscalId] = useState("");
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const { createConnectRequest, completeConnection, isLoading } = useBankingIntegration();
  const { isDemoMode } = useAuth();
  const { toast } = useToast();

  // Generate redirect URI
  const getRedirectUri = useCallback(() => {
    return `${window.location.origin}/conti-bancari`;
  }, []);

  // Handle A-Cube callback (check for fiscal_id in URL params after redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const callbackFiscalId = urlParams.get("fiscalId") || urlParams.get("fiscal_id");
    const success = urlParams.get("success");

    if (callbackFiscalId && success === "true") {
      // Remove params from URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // Complete the connection
      setStep("connecting");
      onOpenChange(true);

      const completeWithRetry = async (retries = 3) => {
        try {
          const accounts = await completeConnection(callbackFiscalId);
          setConnectedAccounts(accounts);
          setStep("success");
        } catch (error) {
          console.error("Failed to complete connection:", error);
          
          if (retries > 0 && error instanceof Error && 
              (error.message.includes("session") || error.message.includes("auth"))) {
            console.log(`Retrying in 1 second... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return completeWithRetry(retries - 1);
          }
          
          setErrorMessage(error instanceof Error ? error.message : "Errore nel collegamento");
          setStep("error");
        }
      };

      completeWithRetry();
    }
  }, [completeConnection, onOpenChange]);

  // Validate Italian fiscal ID (Partita IVA or Codice Fiscale)
  const isValidFiscalId = (id: string): boolean => {
    const cleaned = id.replace(/\s/g, "").toUpperCase();
    // Partita IVA: 11 digits
    // Codice Fiscale: 16 alphanumeric
    return /^\d{11}$/.test(cleaned) || /^[A-Z0-9]{16}$/.test(cleaned);
  };

  const handleProceed = async () => {
    if (!fiscalId || !isValidFiscalId(fiscalId)) {
      toast({
        title: "Partita IVA non valida",
        description: "Inserisci una Partita IVA o Codice Fiscale valido",
        variant: "destructive",
      });
      return;
    }

    // Block demo users
    if (isDemoMode) {
      toast({
        title: "Modalità Demo",
        description: "Per collegare un conto bancario reale, effettua il login con email e password.",
        variant: "destructive",
      });
      return;
    }

    setStep("ready");
    try {
      const cleanedFiscalId = fiscalId.replace(/\s/g, "").toUpperCase();
      const data = await createConnectRequest(getRedirectUri(), cleanedFiscalId);
      setConnectUrl(data.connect_url);
    } catch (error) {
      console.error("Failed to create connect request:", error);
      setErrorMessage(error instanceof Error ? error.message : "Impossibile inizializzare A-Cube");
      setStep("error");
    }
  };

  const handleOpenAcubePortal = () => {
    if (connectUrl) {
      window.location.href = connectUrl;
    }
  };

  const handleComplete = () => {
    onConnect(connectedAccounts);
    handleClose();
  };

  const handleClose = () => {
    setStep("enter_fiscal_id");
    setFiscalId("");
    setConnectUrl(null);
    setConnectedAccounts([]);
    setErrorMessage("");
    onOpenChange(false);
  };

  const handleRetry = () => {
    setErrorMessage("");
    setStep("enter_fiscal_id");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "enter_fiscal_id" && "Collega il tuo conto bancario"}
            {step === "ready" && "Collega con A-Cube"}
            {step === "connecting" && "Collegamento in corso..."}
            {step === "success" && "Connessione riuscita!"}
            {step === "error" && "Errore di connessione"}
          </DialogTitle>
          <DialogDescription>
            {step === "enter_fiscal_id" && "Inserisci la Partita IVA della tua azienda per collegare i conti bancari"}
            {step === "ready" && "Clicca per completare il collegamento nel portale A-Cube"}
            {step === "connecting" && "Stiamo salvando i tuoi dati..."}
            {step === "success" && `${connectedAccounts.length} conto/i collegati con successo`}
            {step === "error" && "Si è verificato un errore durante il collegamento"}
          </DialogDescription>
        </DialogHeader>

        {/* Fiscal ID Input */}
        {step === "enter_fiscal_id" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscal-id">Partita IVA / Codice Fiscale</Label>
              <Input
                id="fiscal-id"
                placeholder="Es. 12345678901"
                value={fiscalId}
                onChange={(e) => setFiscalId(e.target.value)}
                className="text-center text-lg tracking-wider"
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground text-center">
                Inserisci la Partita IVA (11 cifre) o il Codice Fiscale (16 caratteri) della tua azienda
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Come funziona:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Inserisci la Partita IVA della tua azienda</li>
                <li>Verrai reindirizzato al portale A-Cube</li>
                <li>Seleziona la tua banca e autorizza l'accesso</li>
                <li>I tuoi conti saranno collegati automaticamente</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Annulla
              </Button>
              <Button
                onClick={handleProceed}
                disabled={!fiscalId || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Continua
              </Button>
            </div>
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
              <p className="text-foreground font-medium">
                Partita IVA: {fiscalId.replace(/\s/g, "").toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                Clicca il pulsante qui sotto per autorizzare l'accesso ai tuoi conti.
              </p>
              <p className="text-xs text-muted-foreground">
                Powered by A-Cube - i tuoi dati sono criptati e al sicuro
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleOpenAcubePortal}
                disabled={!connectUrl || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Collega la tua banca
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("enter_fiscal_id")}
                className="w-full"
              >
                Indietro
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
                        {account.name || account.account_type} {account.iban ? `IBAN: ...${account.iban.slice(-4)}` : ""}
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
