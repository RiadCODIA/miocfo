import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Link2, CheckCircle2, Clock, AlertTriangle, RefreshCw, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  supplier: string;
  amount: number;
  matchStatus: "matched" | "pending" | "discrepancy";
  matchedTransactionId?: string;
  invoiceType: "income" | "expense";
  fileName: string;
  filePath: string;
  fileType?: string | null;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onMatch: (invoice: Invoice) => void;
  onReprocess?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  reprocessingId?: string | null;
  deletingId?: string | null;
  isLoading?: boolean;
}

export function InvoiceTable({ invoices, onView, onMatch, onReprocess, onDelete, reprocessingId, deletingId, isLoading }: InvoiceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.matchStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig = {
    matched: {
      label: "Abbinata",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20",
    },
    pending: {
      label: "In attesa",
      icon: Clock,
      className: "bg-warning/10 text-warning border-warning/20",
    },
    discrepancy: {
      label: "Discrepanza",
      icon: AlertTriangle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero fattura o fornitore..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="matched">Abbinate</SelectItem>
            <SelectItem value="pending">In attesa</SelectItem>
            <SelectItem value="discrepancy">Discrepanza</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Data</TableHead>
              <TableHead>Numero</TableHead>
              <TableHead>Fornitore</TableHead>
              <TableHead className="text-right">Importo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {invoices.length === 0 
                    ? "Nessuna fattura caricata. Carica le tue prime fatture qui sopra."
                    : "Nessuna fattura trovata con i filtri selezionati"
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => {
                const status = statusConfig[invoice.matchStatus];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.date.toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.supplier}</TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("it-IT", {
                        style: "currency",
                        currency: "EUR",
                      }).format(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.matchStatus !== "matched" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMatch(invoice)}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onReprocess && (invoice.amount === 0 || invoice.supplier === 'Fornitore Sconosciuto') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReprocess(invoice)}
                            disabled={reprocessingId === invoice.id}
                            title="Riprocessa con AI"
                          >
                            {reprocessingId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(invoice)}
                            disabled={deletingId === invoice.id}
                            title="Elimina fattura"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
