import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Building, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  TrendingUp, 
  AlertTriangle,
  Mail,
  Phone
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useCompanies, useCreateCompany } from "@/hooks/useCompanies";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clienti() {
  const navigate = useNavigate();
  const { data: companies, isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const filteredClients = (companies || []).filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email) {
      return;
    }
    
    await createCompany.mutateAsync({
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone || null,
      vat_number: null,
      status: 'active',
      alerts_count: 0,
      revenue: 0,
      cashflow: 0,
      owner_id: null,
    });
    
    setIsDialogOpen(false);
    setNewClient({ name: "", email: "", phone: "" });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">I Miei Clienti</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i tuoi clienti e visualizza i loro dati
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Cliente</DialogTitle>
              <DialogDescription>
                Aggiungi un nuovo cliente al tuo portafoglio
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Azienda *</Label>
                <Input
                  id="name"
                  placeholder="Es. Azienda S.r.l."
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@azienda.it"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  placeholder="+39 02 1234567"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreateClient} disabled={createCompany.isPending}>
                {createCompany.isPending ? "Creazione..." : "Crea Cliente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome o email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Clienti</CardTitle>
          <CardDescription>
            {filteredClients.length} clienti trovati
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nessun cliente trovato</p>
              <p className="text-sm mt-1">Aggiungi il tuo primo cliente per iniziare</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Cliente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Fatturato</TableHead>
                  <TableHead className="text-right">Cash Flow</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Dal {new Date(client.created_at).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={client.status === "warning" ? "secondary" : "outline"}
                          className={client.status === "warning" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : ""}
                        >
                          {client.status === "active" ? "Attivo" : client.status === "warning" ? "Attenzione" : client.status}
                        </Badge>
                        {client.alerts_count > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {client.alerts_count}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(client.revenue) || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={Number(client.cashflow) >= 0 ? "text-emerald-600" : "text-destructive"}>
                        {formatCurrency(Number(client.cashflow) || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate("/kpi-clienti")}>
                            <Eye className="h-4 w-4 mr-2" />
                            Vedi KPI
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/flussi-clienti")}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Vedi Flussi
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/alert")}>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Vedi Alert
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
