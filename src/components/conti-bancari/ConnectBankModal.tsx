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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, ExternalLink, CheckCircle2, Loader2, AlertCircle, Search } from "lucide-react";
import { useEnableBanking, BankAccount } from "@/hooks/useEnableBanking";

interface ASPSP {
  name: string;
  country: string;
  logo?: string;
  bic?: string;
}

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accounts: BankAccount[]) => void;
}

const COUNTRIES = [
  { code: "IT", name: "Italia" },
  { code: "DE", name: "Germania" },
  { code: "FR", name: "Francia" },
  { code: "ES", name: "Spagna" },
  { code: "NL", name: "Paesi Bassi" },
  { code: "BE", name: "Belgio" },
  { code: "AT", name: "Austria" },
  { code: "PT", name: "Portogallo" },
  { code: "FI", name: "Finlandia" },
  { code: "IE", name: "Irlanda" },
];

export function ConnectBankModal({ open, onOpenChange, onConnect }: ConnectBankModalProps) {
  const [step, setStep] = useState<"select_bank" | "ready" | "connecting" | "success" | "error">("select_bank");
  const [selectedCountry, setSelectedCountry] = useState<string>("IT");
  const [banks, setBanks] = useState<ASPSP[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<ASPSP[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<ASPSP | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  
  const { createSession, completeSession, getASPSPs, isLoading } = useEnableBanking();

  // Generate redirect URI for Enable Banking callback
  const getRedirectUri = useCallback(() => {
    // Enable Banking richiede che il redirect_url sia pre-whitelisted.
    // Usiamo SEMPRE la URL pubblicata per garantire compatibilità.
    const PUBLISHED_URL = "https://insight-buddy-09.lovable.app";
    return `${PUBLISHED_URL}/conti-bancari`;
  }, []);

  // Load banks when country changes
  useEffect(() => {
    if (open && selectedCountry) {
      setIsLoadingBanks(true);
      setSelectedBank(null);
      getASPSPs(selectedCountry)
        .then((aspsps) => {
          const bankList = aspsps as ASPSP[];
          setBanks(bankList);
          setFilteredBanks(bankList);
        })
        .catch((error) => {
          console.error("Failed to load banks:", error);
          setBanks([]);
          setFilteredBanks([]);
        })
        .finally(() => {
          setIsLoadingBanks(false);
        });
    }
  }, [open, selectedCountry, getASPSPs]);

  // Filter banks by search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = banks.filter((bank) =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBanks(filtered);
    } else {
      setFilteredBanks(banks);
    }
  }, [searchQuery, banks]);

  // Handle Enable Banking callback (check for code in URL on mount)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");

    if (authCode) {
      // Remove params from URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // Complete the session with the authorization code
      setStep("connecting");
      onOpenChange(true); // Open modal

      // Funzione per completare con retry (la sessione potrebbe non essere ancora pronta)
      const completeWithRetry = async (retries = 3) => {
        try {
          const accounts = await completeSession(authCode);
          setConnectedAccounts(accounts);
          setStep("success");
        } catch (error) {
          console.error("Failed to complete session:", error);
          
          // Se l'errore è dovuto alla sessione non pronta, riprova
          if (retries > 0 && error instanceof Error && 
              (error.message.includes("session") || error.message.includes("auth") || error.message.includes("user"))) {
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
  }, [completeSession, onOpenChange]);

  const handleSelectBank = (bank: ASPSP) => {
    setSelectedBank(bank);
  };

  const handleProceed = async () => {
    if (!selectedBank) return;

    setStep("ready");
    try {
      const data = await createSession(getRedirectUri(), selectedCountry, selectedBank.name);
      setAuthorizationUrl(data.authorization_url);
    } catch (error) {
      console.error("Failed to create session:", error);
      setErrorMessage(error instanceof Error ? error.message : "Impossibile inizializzare Enable Banking");
      setStep("error");
    }
  };

  const handleOpenEnableBankingAuth = () => {
    if (authorizationUrl) {
      window.location.href = authorizationUrl;
    }
  };

  const handleComplete = () => {
    onConnect(connectedAccounts);
    handleClose();
  };

  const handleClose = () => {
    setStep("select_bank");
    setSelectedBank(null);
    setAuthorizationUrl(null);
    setConnectedAccounts([]);
    setErrorMessage("");
    setSearchQuery("");
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
            {step === "ready" && "Collega un conto bancario"}
            {step === "connecting" && "Collegamento in corso..."}
            {step === "success" && "Connessione riuscita!"}
            {step === "error" && "Errore di connessione"}
          </DialogTitle>
          <DialogDescription>
            {step === "select_bank" && "Scegli il paese e la banca da collegare"}
            {step === "ready" && `Clicca per collegarti a ${selectedBank?.name}`}
            {step === "connecting" && "Stiamo salvando i tuoi dati..."}
            {step === "success" && `${connectedAccounts.length} conto/i collegati con successo`}
            {step === "error" && "Si è verificato un errore durante il collegamento"}
          </DialogDescription>
        </DialogHeader>

        {/* Bank Selection */}
        {step === "select_bank" && (
          <div className="flex flex-col h-[450px]">
            <div className="flex-1 flex flex-col min-h-0 space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="space-y-2 flex-shrink-0">
                <Label>Paese</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un paese" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-shrink-0">
                <Label>Cerca banca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {isLoadingBanks ? (
                  <div className="flex items-center justify-center py-8 h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-full rounded-md">
                    <div className="space-y-1">
                      {filteredBanks.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          Nessuna banca trovata
                        </p>
                      ) : (
                        filteredBanks.map((bank) => (
                          <button
                            key={bank.name}
                            onClick={() => handleSelectBank(bank)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                              selectedBank?.name === bank.name
                                ? "bg-primary/10 border border-primary"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="font-medium text-foreground truncate">
                              {bank.name}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 flex-shrink-0">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Annulla
              </Button>
              <Button
                onClick={handleProceed}
                disabled={!selectedBank || isLoading}
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
              <p className="text-foreground font-medium">{selectedBank?.name}</p>
              <p className="text-sm text-muted-foreground">
                Clicca il pulsante qui sotto per autorizzare l'accesso ai tuoi conti.
              </p>
              <p className="text-xs text-muted-foreground">
                Powered by Enable Banking - i tuoi dati sono criptati e al sicuro
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleOpenEnableBankingAuth}
                disabled={!authorizationUrl || isLoading}
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
                onClick={() => setStep("select_bank")}
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
