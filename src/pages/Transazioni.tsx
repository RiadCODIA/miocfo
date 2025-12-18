import { useState } from "react";
import { Search, Filter, Download, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const transactions = [
  { id: 1, data: "18/12/2024", descrizione: "Fattura Cliente ABC Srl", importo: 12500, conto: "Conto Principale", categoria: "Vendite", stato: "automatica" },
  { id: 2, data: "17/12/2024", descrizione: "Pagamento fornitore XYZ", importo: -3200, conto: "Conto Operativo", categoria: "Fornitori", stato: "automatica" },
  { id: 3, data: "16/12/2024", descrizione: "Bonifico stipendi dicembre", importo: -15800, conto: "Conto Principale", categoria: "Personale", stato: "automatica" },
  { id: 4, data: "15/12/2024", descrizione: "Incasso fattura #1234", importo: 8750, conto: "Conto Principale", categoria: "Vendite", stato: "manuale" },
  { id: 5, data: "14/12/2024", descrizione: "Canone hosting annuale", importo: -480, conto: "Conto Operativo", categoria: "Servizi IT", stato: "automatica" },
  { id: 6, data: "13/12/2024", descrizione: "Rimborso spese viaggio", importo: -320, conto: "Conto Operativo", categoria: "Trasferte", stato: "da verificare" },
  { id: 7, data: "12/12/2024", descrizione: "Acconto cliente DEF SpA", importo: 5000, conto: "Conto Principale", categoria: "Vendite", stato: "automatica" },
  { id: 8, data: "11/12/2024", descrizione: "Utenze ufficio novembre", importo: -890, conto: "Conto Operativo", categoria: "Utenze", stato: "automatica" },
];

export default function Transazioni() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case "automatica":
        return <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">Automatica</Badge>;
      case "manuale":
        return <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Manuale</Badge>;
      case "da verificare":
        return <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">Da verificare</Badge>;
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Transazioni</h1>
        <p className="text-muted-foreground mt-1">
          Analisi dettagliata dei movimenti bancari
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ricerca testuale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <Select defaultValue="all">
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i periodi</SelectItem>
            <SelectItem value="today">Oggi</SelectItem>
            <SelectItem value="week">Ultima settimana</SelectItem>
            <SelectItem value="month">Ultimo mese</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Conto" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i conti</SelectItem>
            <SelectItem value="principale">Conto Principale</SelectItem>
            <SelectItem value="operativo">Conto Operativo</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="vendite">Vendite</SelectItem>
            <SelectItem value="fornitori">Fornitori</SelectItem>
            <SelectItem value="personale">Personale</SelectItem>
            <SelectItem value="utenze">Utenze</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
          <Filter className="h-4 w-4" />
          Altri filtri
        </Button>

        <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary ml-auto">
          <Download className="h-4 w-4" />
          Esporta
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead className="text-muted-foreground">Descrizione</TableHead>
              <TableHead className="text-muted-foreground text-right">Importo</TableHead>
              <TableHead className="text-muted-foreground">Conto</TableHead>
              <TableHead className="text-muted-foreground">Categoria</TableHead>
              <TableHead className="text-muted-foreground">Stato</TableHead>
              <TableHead className="text-muted-foreground w-[100px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => (
              <TableRow
                key={tx.id}
                className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                style={{ animationDelay: `${300 + index * 50}ms` }}
              >
                <TableCell className="font-medium">{tx.data}</TableCell>
                <TableCell className="max-w-[300px] truncate">{tx.descrizione}</TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  tx.importo > 0 ? "text-success" : "text-destructive"
                )}>
                  {tx.importo > 0 ? "+" : ""}€{Math.abs(tx.importo).toLocaleString("it-IT")}
                </TableCell>
                <TableCell className="text-muted-foreground">{tx.conto}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-border">
                    {tx.categoria}
                  </Badge>
                </TableCell>
                <TableCell>{getStatoBadge(tx.stato)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
