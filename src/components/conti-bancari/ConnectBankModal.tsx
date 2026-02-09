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
import { Building2, ExternalLink, CheckCircle2, Loader2, AlertCircle, Search } from "lucide-react";
import { useBankingIntegration, BankAccount, ASPSP } from "@/hooks/useBankingIntegration";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accounts: BankAccount[]) => void;
}

export function ConnectBankModal({ open, onOpenChange, onConnect }: ConnectBankModalProps) {
  const [step, setStep] = useState<"select_bank" | "redirecting" | "connecting" | "success" | "error">("select_bank");
  const [aspsps, setAspsps] = useState<ASPSP[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<ASPSP | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loadingBanks, setLoadingBanks] = useState(false);
  
  const { getASPSPs, startAuth, completeSession, isLoading } = useBankingIntegration();
  const { isDemoMode } = useAuth();
  const { toast } = useToast();

  // Generate redirect URI
  const getRedirectUri = useCallback(() => {
    return `${window.location.origin}/conti-bancari`;
  }, []);

  // Handle Enable Banking callback (check for code in URL params after redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Remove params from URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // Complete the session
      setStep("connecting");
      onOpenChange(true);

      const complete = async (retries = 3) => {
        try {
          const accounts = await completeSession(code);
          setConnectedAccounts(accounts);
          setStep("success");
        } catch (error) {
          console.error("Failed to complete session:", error);
          
          if (retries > 0 && error instanceof Error && 
              (error.message.includes("session") || error.message.includes("auth"))) {
            console.log(`Retrying in 1 second... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return complete(retries - 1);
          }
          
          setErrorMessage(error instanceof Error ? error.message : "Errore nel collegamento");
          setStep("error");
        }
      };

      complete();
    }
  }, [completeSession, onOpenChange]);

  // Load banks when modal opens
  useEffect(() => {
    if (open && step === "select_bank" && aspsps.length === 0) {
      setLoadingBanks(true);
      getASPSPs("IT")
        .then((banks) => {
          setAspsps(banks);
        })
        .catch((err) => {
          console.error("Failed to load banks:", err);
          toast({
            title: "Errore",
            description: "Impossibile caricare la lista delle banche",
            variant: "destructive",
          });
        })
        .finally(() => setLoadingBanks(false));
    }
  }, [open, step, aspsps.length, getASPSPs, toast]);

  const filteredBanks = aspsps.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBank = async (bank: ASPSP) => {
    setSelectedBank(bank);

    if (isDemoMode) {
      toast({
        title: "Modalità Demo - Ambiente Sandbox",
        description: "Stai testando con l'ambiente sandbox Enable Banking. Nessun dato bancario reale verrà utilizzato.",
      });
    }

    setStep("redirecting");
    try {
      const redirectUri = getRedirectUri();
      const data = await startAuth(bank.name, bank.country, redirectUri);
      
      // Redirect user to bank authorization page
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Failed to start auth:", error);
      setErrorMessage(error instanceof Error ? error.message : "Impossibile inizializzare Enable Banking");
      setStep("error");
    }
  };

  const handleComplete = () => {
    onConnect(connectedAccounts);
    handleClose();
  };

  const handleClose = () => {
    setStep("select_bank");
    setSearchQuery("");
    setSelectedBank(null);
    setConnectedAccounts([]);
    setErrorMessage("");
    onOpenChange(false);
  };

  const handleRetry = () => {
    setErrorMessage("");
    setStep("select_bank");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "select_bank" && "Seleziona la tua banca"}
            {step === "redirecting" && "Reindirizzamento..."}
            {step === "connecting" && "Collegamento in corso..."}
            {step === "success" && "Connessione riuscita!"}
            {step === "error" && "Errore di connessione"}
          </DialogTitle>
          <DialogDescription>
            {step === "select_bank" && "Cerca e seleziona la tua banca per collegare i conti"}
            {step === "redirecting" && `Stai per essere reindirizzato a ${selectedBank?.name || "la tua banca"}...`}
            {step === "connecting" && "Stiamo salvando i tuoi dati..."}
            {step === "success" && `${connectedAccounts.length} conto/i collegati con successo`}
            {step === "error" && "Si è verificato un errore durante il collegamento"}
          </DialogDescription>
        </DialogHeader>

        {/* Bank Selection */}
        {step === "select_bank" && (
          <div className="space-y-4 py-2">
            {isDemoMode && (
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 text-xs font-medium bg-warning/20 text-warning-foreground border border-warning rounded-full">
                  🧪 SANDBOX / TEST
                </span>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca la tua banca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Banks List */}
            <ScrollArea className="h-[300px]">
              {loadingBanks ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Caricamento banche...</p>
                </div>
              ) : filteredBanks.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Nessuna banca trovata" : "Nessuna banca disponibile"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredBanks.map((bank, idx) => (
                    <button
                      key={`${bank.name}-${bank.country}-${idx}`}
                      onClick={() => handleSelectBank(bank)}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {bank.logo ? (
                          <img
                            src={bank.logo}
                            alt={bank.name}
                            className="h-6 w-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-primary"><line x1="3" x2="21" y1="22" y2="22"></line><line x1="6" x2="6" y1="18" y2="11"></line><line x1="10" x2="10" y1="18" y2="11"></line><line x1="14" x2="14" y1="18" y2="11"></line><line x1="18" x2="18" y1="18" y2="11"></line><polygon points="12 2 20 7 4 7"></polygon></svg>';
                            }}
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{bank.name}</p>
                        {bank.bic && (
                          <p className="text-xs text-muted-foreground">BIC: {bank.bic}</p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Powered by Enable Banking - i tuoi dati sono criptati e al sicuro
              </p>
            </div>

            <Button variant="outline" onClick={handleClose} className="w-full">
              Annulla
            </Button>
          </div>
        )}

        {/* Redirecting State */}
        {step === "redirecting" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">
              Reindirizzamento a {selectedBank?.name || "la banca"}...
            </p>
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
