import { useState } from "react";
import { ShieldCheck, CheckCircle2, Circle, FileText, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CassettoFiscaleModal } from "@/components/fatture/CassettoFiscaleModal";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Collegamenti() {
  const { user } = useAuth();
  const [cassettoModalOpen, setCassettoModalOpen] = useState(false);

  const { data: cassettoInvoices = [], isLoading } = useQuery({
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

  const cassettoConnected = cassettoInvoices.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cassetto Fiscale</h1>
        <p className="text-muted-foreground mt-1">
          Collegamento con l'Agenzia delle Entrate tramite A-Cube
        </p>
      </div>

      {/* Status Card */}
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

      {/* Invoices from Cassetto Fiscale */}
      {isLoading ? (
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

      <CassettoFiscaleModal
        open={cassettoModalOpen}
        onOpenChange={setCassettoModalOpen}
        onConnected={() => {}}
      />
    </div>
  );
}
