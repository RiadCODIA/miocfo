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
import { Building2, ExternalLink, CheckCircle2, Loader2, AlertCircle, Search, ArrowLeft } from "lucide-react";
import { useBankingIntegration, BankAccount, ASPSP } from "@/hooks/useBankingIntegration";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const COUNTRIES = [
  { code: "IT", label: "Italia" },
  { code: "DE", label: "Germania" },
  { code: "FR", label: "Francia" },
  { code: "ES", label: "Spagna" },
  { code: "NL", label: "Paesi Bassi" },
  { code: "AT", label: "Austria" },
  { code: "BE", label: "Belgio" },
  { code: "PT", label: "Portogallo" },
  { code: "FI", label: "Finlandia" },
  { code: "IE", label: "Irlanda" },
] as const;

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accounts: BankAccount[]) => void;
}

export function ConnectBankModal({ open, onOpenChange, onConnect }: ConnectBankModalProps) {
  const [provider, setProvider] = useState<"choose" | "enable_banking" | "acube">("choose");
  const [step, setStep] = useState<"select_bank" | "redirecting" | "connecting" | "success" | "error">("select_bank");
  const [aspsps, setAspsps] = useState<ASPSP[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<ASPSP | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("IT");
  const [psuType, setPsuType] = useState<"personal" | "business">("personal");
  const [fiscalId, setFiscalId] = useState("");
  const [acubeLoading, setAcubeLoading] = useState(false);
  
  const { getASPSPs, startAuth, completeSession, isLoading } = useBankingIntegration();
  const { isDemoMode } = useAuth();
  const { toast } = useToast();

  // Generate redirect URI
  const getRedirectUri = useCallback(() => {
    return `${window.location.origin}/conti-bancari`;
  }, []);

  // Handle callbacks after redirect (Enable Banking code or A-Cube acube_done)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const acubeDone = urlParams.get("acube_done");
    const acubeFiscalId = urlParams.get("fiscal_id");

    if (code) {
      // Enable Banking callback
      window.history.replaceState({}, document.title, window.location.pathname);
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
            await new Promise(resolve => setTimeout(resolve, 1000));
            return complete(retries - 1);
          }
          setErrorMessage(error instanceof Error ? error.message : "Errore nel collegamento");
          setStep("error");
        }
      };
      complete();
    } else if (acubeDone && acubeFiscalId) {
      // A-Cube callback after bank authorization
      window.history.replaceState({}, document.title, window.location.pathname);
      setProvider("acube");
      setStep("connecting");
      onOpenChange(true);

      const completeAcube = async (retries = 5) => {
        try {
          let session = (await supabase.auth.getSession()).data.session;
          if (!session?.access_token) {
            for (let i = 0; i < retries; i++) {
              await new Promise(r => setTimeout(r, 1000));
              session = (await supabase.auth.getSession()).data.session;
              if (session?.access_token) break;
            }
          }
          if (!session?.access_token) throw new Error("Sessione non disponibile");

          const response = await fetch(
            `https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/acube-banking`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
                apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aG9ubXVoeXdkaXFheHhibnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzEzMTMsImV4cCI6MjA4NTk0NzMxM30.7oaiC1P4pwNdj8mIv4rU5Jsdm2jgkxKwz85PzUxWcvY",
              },
              body: JSON.stringify({
                action: "complete_connection",
                fiscal_id: acubeFiscalId,
              }),
            }
          );
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Errore nel completamento A-Cube");
          }
          const data = await response.json();
          const mapped: BankAccount[] = (data.accounts || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            bank_name: (a.bank_name as string) || "Banca",
            name: (a.name as string) || "Conto",
            iban: a.iban as string,
            balance: (a.balance as number) || 0,
            available_balance: (a.balance as number) || 0,
            current_balance: (a.balance as number) || 0,
            currency: (a.currency as string) || "EUR",
            status: "active",
            provider: "acube",
            last_sync_at: a.last_sync_at as string,
          }));
          setConnectedAccounts(mapped);
          setStep("success");
        } catch (error) {
          console.error("A-Cube complete error:", error);
          setErrorMessage(error instanceof Error ? error.message : "Errore A-Cube");
          setStep("error");
        }
      };
      completeAcube();
    }
  }, [completeSession, onOpenChange]);

  // Load banks when modal opens or country changes
  const fetchBanks = useCallback(async (country: string) => {
    setLoadingBanks(true);
    try {
      const banks = await getASPSPs(country);
      setAspsps(banks);
    } catch (err) {
      console.error("Failed to load banks:", err);
      toast({
        title: "Errore",
        description: "Impossibile caricare la lista delle banche",
        variant: "destructive",
      });
    } finally {
      setLoadingBanks(false);
    }
  }, [getASPSPs, toast]);

  useEffect(() => {
    if (open && provider === "enable_banking" && step === "select_bank") {
      fetchBanks(selectedCountry);
    }
  }, [open, provider, step, selectedCountry, fetchBanks]);

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
      const data = await startAuth(bank.name, bank.country, redirectUri, psuType);
      
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
    setProvider("choose");
    setStep("select_bank");
    setSearchQuery("");
    setSelectedBank(null);
    setConnectedAccounts([]);
    setErrorMessage("");
    setSelectedCountry("IT");
    setPsuType("personal");
    setFiscalId("");
    setAcubeLoading(false);
    onOpenChange(false);
  };

  const handleRetry = () => {
    setErrorMessage("");
    setFiscalId("");
    setSelectedCountry("IT");
    setPsuType("personal");
    setProvider("choose");
    setStep("select_bank");
  };

  const handleAcubeConnect = async () => {
    if (!fiscalId.trim()) {
      toast({ title: "Errore", description: "Inserisci il codice fiscale o P.IVA", variant: "destructive" });
      return;
    }
    setAcubeLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Sessione non disponibile. Effettua il login.");

      const redirectUri = `${window.location.origin}/conti-bancari?acube_done=1&fiscal_id=${encodeURIComponent(fiscalId.trim())}`;

      const response = await fetch(
        `https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/acube-banking`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aG9ubXVoeXdkaXFheHhibnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzEzMTMsImV4cCI6MjA4NTk0NzMxM30.7oaiC1P4pwNdj8mIv4rU5Jsdm2jgkxKwz85PzUxWcvY",
          },
          body: JSON.stringify({
            action: "connect_request",
            fiscal_id: fiscalId.trim(),
            redirect_uri: redirectUri,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore nella richiesta A-Cube");
      }

      const data = await response.json();
      const connectUrl = data.connect_url || data.url;

      if (connectUrl) {
        setStep("redirecting");
        window.location.href = connectUrl;
      } else {
        throw new Error("Nessun URL di reindirizzamento ricevuto da A-Cube");
      }
    } catch (error) {
      console.error("A-Cube connect error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Errore A-Cube");
      setStep("error");
    } finally {
      setAcubeLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {provider === "choose" && "Scegli il metodo di collegamento"}
            {provider !== "choose" && step === "select_bank" && "Seleziona la tua banca"}
            {step === "redirecting" && "Reindirizzamento..."}
            {step === "connecting" && "Collegamento in corso..."}
            {step === "success" && "Connessione riuscita!"}
            {step === "error" && "Errore di connessione"}
          </DialogTitle>
          <DialogDescription>
            {provider === "choose" && "Seleziona come vuoi collegare il tuo conto bancario"}
            {provider !== "choose" && step === "select_bank" && "Cerca e seleziona la tua banca per collegare i conti"}
            {step === "redirecting" && `Stai per essere reindirizzato a ${selectedBank?.name || "la tua banca"}...`}
            {step === "connecting" && "Stiamo salvando i tuoi dati..."}
            {step === "success" && `${connectedAccounts.length} conto/i collegati con successo`}
            {step === "error" && "Si è verificato un errore durante il collegamento"}
          </DialogDescription>
        </DialogHeader>

        {/* Provider Choice */}
        {provider === "choose" && step === "select_bank" && (
          <div className="space-y-4 py-2">
            <button
              onClick={() => setProvider("enable_banking")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors text-left"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Enable Banking</p>
                <p className="text-sm text-muted-foreground">
                  Collegamento diretto PSD2 — sincronizzazione automatica conti e transazioni
                </p>
              </div>
            </button>
            <button
              onClick={() => setProvider("acube")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors text-left"
            >
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">A-Cube</p>
                <p className="text-sm text-muted-foreground">
                  Collegamento tramite A-Cube API — accesso ai conti via AISP
                </p>
              </div>
            </button>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Annulla
            </Button>
          </div>
        )}

        {/* Bank Selection */}
        {/* Enable Banking - Bank Selection */}
        {provider === "enable_banking" && step === "select_bank" && (
          <div className="space-y-4 py-2">

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Paese</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo di conto</label>
                <Select value={psuType} onValueChange={(v) => setPsuType(v as "personal" | "business")}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="personal">Personale</SelectItem>
                    <SelectItem value="business">Aziendale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setProvider("choose")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Annulla
              </Button>
            </div>
          </div>
        )}

        {/* A-Cube - Bank Selection */}
        {provider === "acube" && step === "select_bank" && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <p className="text-foreground font-medium">Collegamento tramite A-Cube</p>
              <p className="text-sm text-muted-foreground text-center">
                Inserisci il tuo codice fiscale o P.IVA per avviare il collegamento AISP tramite A-Cube.
              </p>
            </div>
            <Input
              placeholder="Codice Fiscale o Partita IVA"
              value={fiscalId}
              onChange={(e) => setFiscalId(e.target.value)}
              disabled={acubeLoading}
            />
            <Button
              className="w-full"
              onClick={handleAcubeConnect}
              disabled={acubeLoading || !fiscalId.trim()}
            >
              {acubeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Collegamento in corso...
                </>
              ) : (
                "Avvia collegamento A-Cube"
              )}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setProvider("choose")} className="flex-1" disabled={acubeLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1" disabled={acubeLoading}>
                Annulla
              </Button>
            </div>
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
