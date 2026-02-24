import { useState } from "react";
import { ShieldCheck, CheckCircle2, Circle, FileText, Loader2, Landmark, Link, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CassettoFiscaleModal } from "@/components/fatture/CassettoFiscaleModal";
import { ConnectBankModal } from "@/components/conti-bancari/ConnectBankModal";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const EDGE_URL = "https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/acube-cassetto-fiscale";

export default function Collegamenti() {
  const { user } = useAuth();
  
  const queryClient = useQueryClient();
  const [cassettoModalOpen, setCassettoModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Check localStorage for a configured fiscal_id — shows "connected" badge immediately after setup
  const savedFiscalId = localStorage.getItem("cassetto_fiscal_id");

  const { data: cassettoInvoices = [], isLoading: isLoadingCassetto } = useQuery({
    queryKey: ["cassetto-fiscale-invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("source", "cassetto_fiscale")
        .order("invoice_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: bankAccounts = [], isLoading: isLoadingBanks } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const cassettoConnected = !!savedFiscalId || cassettoInvoices.length > 0;
  const connectedBanks = bankAccounts.filter((a) => a.is_connected);

  const handleDownloadNow = async () => {
    if (!savedFiscalId) return;
    setIsDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch(EDGE_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "download-now", fiscal_id: savedFiscalId }),
      });

      const res = await fetch(EDGE_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "fetch-invoices", fiscal_id: savedFiscalId }),
      });
      const result = await res.json();
      const count = result?.imported ?? 0;

      toast.success("Importazione completata", {
        description: count > 0 ? `${count} fatture importate.` : "Nessuna nuova fattura. Il download A-Cube potrebbe richiedere alcuni minuti.",
      });
      queryClient.invalidateQueries({ queryKey: ["cassetto-fiscale-invoices"] });
    } catch (err) {
      toast.error("Errore download", { description: err instanceof Error ? err.message : "Errore sconosciuto" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Collegamenti</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci le connessioni bancarie e fiscali
        </p>
      </div>

      <Tabs defaultValue="banche" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="banche" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Conti Bancari
          </TabsTrigger>
          <TabsTrigger value="cassetto" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Cassetto Fiscale
          </TabsTrigger>
        </TabsList>

        {/* === BANK CONNECTIONS TAB === */}
        <TabsContent value="banche" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Conti Bancari</CardTitle>
                    <CardDescription className="text-sm">
                      Collega i tuoi conti per sincronizzare transazioni e saldi
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={connectedBanks.length > 0 ? "default" : "secondary"}>
                    {connectedBanks.length > 0 ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> {connectedBanks.length} conness{connectedBanks.length === 1 ? "o" : "i"}</>
                    ) : (
                      <><Circle className="h-3 w-3 mr-1" /> Nessun conto</>
                    )}
                  </Badge>
                  <Button onClick={() => setBankModalOpen(true)}>
                    {connectedBanks.length > 0 ? "Aggiungi conto" : "Collega"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {isLoadingBanks ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bankAccounts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  Conti collegati ({bankAccounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Banca</TableHead>
                      <TableHead>IBAN</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Ultima sincr.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((acc) => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-medium">{acc.name}</TableCell>
                        <TableCell>{acc.bank_name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {acc.iban ? `${acc.iban.slice(0, 4)}...${acc.iban.slice(-4)}` : "—"}
                        </TableCell>
                        <TableCell className="capitalize">{acc.account_type || "—"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          €{(acc.balance ?? 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={acc.is_connected ? "default" : "secondary"}>
                            {acc.is_connected ? "Connesso" : "Disconnesso"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {acc.last_sync_at
                            ? format(new Date(acc.last_sync_at), "dd MMM HH:mm", { locale: it })
                            : "Mai"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Landmark className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">Nessun conto collegato</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Collega un conto bancario per sincronizzare transazioni e saldi automaticamente
                </p>
                <Button className="mt-4" onClick={() => setBankModalOpen(true)}>
                  <Link className="h-4 w-4 mr-2" />
                  Collega Conto Bancario
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === CASSETTO FISCALE TAB === */}
        <TabsContent value="cassetto" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Cassetto Fiscale (A-Cube)</CardTitle>
                    <CardDescription className="text-sm">
                      Importa automaticamente le fatture passive dall'Agenzia delle Entrate
                      {savedFiscalId && (
                        <span className="ml-2 font-mono text-xs opacity-70">({savedFiscalId})</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cassettoConnected ? "default" : "secondary"}>
                    {cassettoConnected ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Connesso</>
                    ) : (
                      <><Circle className="h-3 w-3 mr-1" /> Non connesso</>
                    )}
                  </Badge>
                  {cassettoConnected && savedFiscalId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadNow}
                      disabled={isDownloading}
                    >
                      {isDownloading
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Scaricamento...</>
                        : <><Download className="h-3.5 w-3.5 mr-1.5" />Scarica ora</>
                      }
                    </Button>
                  )}
                  <Button
                    variant={cassettoConnected ? "outline" : "default"}
                    onClick={() => setCassettoModalOpen(true)}
                  >
                    {cassettoConnected ? "Gestisci" : "Collega"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {isLoadingCassetto ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cassettoInvoices.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Fatture dal Cassetto Fiscale ({cassettoInvoices.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N. Fattura</TableHead>
                      <TableHead>Fornitore</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Imponibile</TableHead>
                      <TableHead className="text-right">IVA</TableHead>
                      <TableHead className="text-right">Totale</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cassettoInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoice_number || "—"}</TableCell>
                        <TableCell>{inv.vendor_name || inv.client_name || "—"}</TableCell>
                        <TableCell>
                          {inv.invoice_date
                            ? format(new Date(inv.invoice_date), "dd MMM yyyy", { locale: it })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          €{inv.amount?.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          €{(inv.vat_amount ?? 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €{inv.total_amount?.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inv.payment_status === "paid"
                                ? "default"
                                : inv.payment_status === "overdue"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {inv.payment_status === "paid"
                              ? "Pagata"
                              : inv.payment_status === "overdue"
                              ? "Scaduta"
                              : "In attesa"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : cassettoConnected ? (
            // Connected but no invoices yet
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Download className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">Nessuna fattura ancora importata</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Il Cassetto Fiscale è connesso. Avvia il download per importare le fatture disponibili.
                </p>
                <Button className="mt-4" onClick={handleDownloadNow} disabled={isDownloading}>
                  {isDownloading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importazione...</>
                    : <><Download className="h-4 w-4 mr-2" />Scarica fatture ora</>
                  }
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">Nessuna fattura importata</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Collega il Cassetto Fiscale per importare automaticamente le fatture passive
                </p>
                <Button className="mt-4" onClick={() => setCassettoModalOpen(true)}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Collega Cassetto Fiscale
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CassettoFiscaleModal
        open={cassettoModalOpen}
        onOpenChange={setCassettoModalOpen}
        onConnected={() => {}}
      />

      <ConnectBankModal
        open={bankModalOpen}
        onOpenChange={setBankModalOpen}
        onConnect={() => {}}
      />
    </div>
  );
}
