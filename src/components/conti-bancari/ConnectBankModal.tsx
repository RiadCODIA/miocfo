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
import { Building2, ExternalLink, CheckCircle2, Loader2, AlertCircle, Search, Landmark, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [psuType, setPsuType] = useState<"personal" | "business">("business");
  
  const { createSession, completeSession, getASPSPs, isLoading } = useEnableBanking();

  // Generate redirect URI for Enable Banking callback
  const getRedirectUri = useCallback(() => {
    // Usa l'origin corrente per supportare domini custom, preview e published
    return `${window.location.origin}/conti-bancari`;
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
      const data = await createSession(getRedirectUri(), selectedCountry, selectedBank.name, psuType);
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
    setPsuType("business");
    onOpenChange(false);
  };

  const handleRetry = () => {
    setErrorMessage("");
    setStep("select_bank");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-xl">
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
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Header con icona */}
            <div className="flex items-center justify-center pb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Landmark className="h-7 w-7 text-primary" />
              </div>
            </div>

            {/* Selettori Paese e Tipo su due colonne */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Paese
                </Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2">
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
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tipo conto
                </Label>
                <Select value={psuType} onValueChange={(v) => setPsuType(v as "personal" | "business")}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Conto Privato</SelectItem>
                    <SelectItem value="business">Conto Aziendale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ricerca con design migliorato */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Cerca la tua banca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 text-base"
              />
            </div>

            {/* Lista banche con card migliorate */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {isLoadingBanks ? (
                <div className="flex flex-col items-center justify-center py-12 h-full gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Caricamento banche...</p>
                </div>
              ) : (
                <ScrollArea className="h-full px-2">
                  <div className="space-y-2 pb-2">
                    {filteredBanks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <SearchX className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-center text-muted-foreground">
                          Nessuna banca trovata
                        </p>
                        <p className="text-center text-xs text-muted-foreground">
                          Prova con un altro termine di ricerca
                        </p>
                      </div>
                    ) : (
                      filteredBanks.map((bank) => (
                        <button
                          key={bank.name}
                          onClick={() => handleSelectBank(bank)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200",
                            "hover:shadow-md hover:scale-[1.01] hover:bg-muted/80",
                            selectedBank?.name === bank.name
                              ? "bg-primary/10 ring-2 ring-primary shadow-md"
                              : "bg-muted/40"
                          )}
                        >
                          <div className="h-10 w-10 rounded-lg bg-background shadow-sm flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-semibold text-foreground flex-1 truncate">
                            {bank.name}
                          </span>
                          {selectedBank?.name === bank.name && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Footer con bottoni prominenti */}
            <div className="flex gap-3 pt-6 border-t mt-4">
              <Button variant="ghost" onClick={handleClose} className="flex-1 h-12 rounded-xl">
                Annulla
              </Button>
              <Button
                onClick={handleProceed}
                disabled={!selectedBank || isLoading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
