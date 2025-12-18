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
import { Search, Eye, Link2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  supplier: string;
  amount: number;
  matchStatus: "matched" | "pending" | "discrepancy";
  matchedTransactionId?: string;
  fileName: string;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onMatch: (invoice: Invoice) => void;
}

export function InvoiceTable({ invoices, onView, onMatch }: InvoiceTableProps) {
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
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nessuna fattura trovata
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
