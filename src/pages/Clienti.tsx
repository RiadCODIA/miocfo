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
  Phone,
  User,
  Lock,
  CheckCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAdminClients, useCreateClientUser } from "@/hooks/useAdminClients";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Clienti() {
  const navigate = useNavigate();
  const { data: adminClients, isLoading } = useAdminClients();
  const createClientUser = useCreateClientUser();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{email: string; password: string} | null>(null);
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    vatNumber: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredClients = (adminClients || []).filter(client =>
    client.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.profile?.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.profile?.last_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newClient.firstName.trim()) errors.firstName = "Nome obbligatorio";
    if (!newClient.lastName.trim()) errors.lastName = "Cognome obbligatorio";
    if (!newClient.companyName.trim()) errors.companyName = "Nome azienda obbligatorio";
    if (!newClient.email.trim()) errors.email = "Email obbligatoria";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) {
      errors.email = "Email non valida";
    }
    if (!newClient.password) errors.password = "Password obbligatoria";
    else if (newClient.password.length < 6) {
      errors.password = "La password deve avere almeno 6 caratteri";
    }
    if (newClient.password !== newClient.confirmPassword) {
      errors.confirmPassword = "Le password non coincidono";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClient = async () => {
    if (!validateForm()) return;
    
    try {
      await createClientUser.mutateAsync({
        email: newClient.email,
        password: newClient.password,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        companyName: newClient.companyName,
        phone: newClient.phone || undefined,
        vatNumber: newClient.vatNumber || undefined,
      });
      
      // Show credentials after successful creation
      setCreatedCredentials({
        email: newClient.email,
        password: newClient.password
      });
      setShowCredentials(true);
      
      // Reset form
      setNewClient({
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        vatNumber: "",
      });
      setFormErrors({});
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setShowCredentials(false);
    setCreatedCredentials(null);
    setFormErrors({});
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
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuovo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            {showCredentials && createdCredentials ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    Cliente Creato con Successo
                  </DialogTitle>
                  <DialogDescription>
                    Il cliente può accedere con queste credenziali
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert className="bg-emerald-50 border-emerald-200">
                    <AlertDescription className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="font-mono text-sm font-medium">{createdCredentials.email}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Password</Label>
                        <p className="font-mono text-sm font-medium">{createdCredentials.password}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground">
                    Comunica queste credenziali al cliente in modo sicuro. 
                    Il cliente potrà modificare la password dopo il primo accesso.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseDialog}>
                    Chiudi
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Cliente</DialogTitle>
                  <DialogDescription>
                    Crea un account utente per il tuo nuovo cliente. 
                    Riceverà le credenziali per accedere alla piattaforma.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  {/* User Info Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Dati Utente
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="firstName">Nome *</Label>
                        <Input
                          id="firstName"
                          placeholder="Mario"
                          value={newClient.firstName}
                          onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                          className={formErrors.firstName ? "border-destructive" : ""}
                        />
                        {formErrors.firstName && (
                          <p className="text-xs text-destructive">{formErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lastName">Cognome *</Label>
                        <Input
                          id="lastName"
                          placeholder="Rossi"
                          value={newClient.lastName}
                          onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                          className={formErrors.lastName ? "border-destructive" : ""}
                        />
                        {formErrors.lastName && (
                          <p className="text-xs text-destructive">{formErrors.lastName}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Credentials Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      Credenziali di Accesso
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="mario.rossi@azienda.it"
                          value={newClient.email}
                          onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                          className={formErrors.email ? "border-destructive" : ""}
                        />
                        {formErrors.email && (
                          <p className="text-xs text-destructive">{formErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Minimo 6 caratteri"
                          value={newClient.password}
                          onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                          className={formErrors.password ? "border-destructive" : ""}
                        />
                        {formErrors.password && (
                          <p className="text-xs text-destructive">{formErrors.password}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="confirmPassword">Conferma Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Ripeti la password"
                          value={newClient.confirmPassword}
                          onChange={(e) => setNewClient({ ...newClient, confirmPassword: e.target.value })}
                          className={formErrors.confirmPassword ? "border-destructive" : ""}
                        />
                        {formErrors.confirmPassword && (
                          <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Info Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Building className="h-4 w-4" />
                      Dati Azienda
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="companyName">Nome Azienda *</Label>
                        <Input
                          id="companyName"
                          placeholder="Azienda S.r.l."
                          value={newClient.companyName}
                          onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                          className={formErrors.companyName ? "border-destructive" : ""}
                        />
                        {formErrors.companyName && (
                          <p className="text-xs text-destructive">{formErrors.companyName}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="vatNumber">Partita IVA</Label>
                        <Input
                          id="vatNumber"
                          placeholder="IT12345678901"
                          value={newClient.vatNumber}
                          onChange={(e) => setNewClient({ ...newClient, vatNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone">Telefono</Label>
                        <Input
                          id="phone"
                          placeholder="+39 02 1234567"
                          value={newClient.phone}
                          onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Annulla
                  </Button>
                  <Button onClick={handleCreateClient} disabled={createClientUser.isPending}>
                    {createClientUser.isPending ? "Creazione..." : "Crea Cliente"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, azienda o email..."
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
                  <TableHead>Azienda</TableHead>
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
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {client.profile?.first_name && client.profile?.last_name 
                              ? `${client.profile.first_name} ${client.profile.last_name}`
                              : "Utente"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dal {new Date(client.created_at).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{client.company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.company.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {client.company.email}
                          </div>
                        )}
                        {client.company.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {client.company.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={client.company.status === "warning" ? "secondary" : "outline"}
                          className={client.company.status === "warning" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : ""}
                        >
                          {client.company.status === "active" ? "Attivo" : client.company.status === "warning" ? "Attenzione" : client.company.status}
                        </Badge>
                        {client.company.alerts_count > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {client.company.alerts_count}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(client.company.revenue) || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={Number(client.company.cashflow) >= 0 ? "text-emerald-600" : "text-destructive"}>
                        {formatCurrency(Number(client.company.cashflow) || 0)}
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
