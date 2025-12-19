import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Search, 
  MoreVertical,
  Eye,
  UserCog,
  Pause,
  Play,
  Filter,
  Users,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Mock data
const companies = [
  { 
    id: "1", 
    name: "Acme S.r.l.", 
    status: "active", 
    plan: "Professional", 
    users: 12, 
    lastActivity: "2 ore fa",
    vatNumber: "IT12345678901",
    email: "admin@acme.it",
    phone: "+39 02 1234567",
    createdAt: "2023-06-15",
    bankAccounts: 3,
    transactions30d: 456,
    syncFailed7d: 0,
    integrations: [
      { name: "Plaid", status: "connected" },
      { name: "Stripe", status: "connected" },
    ]
  },
  { 
    id: "2", 
    name: "TechCorp S.p.A.", 
    status: "active", 
    plan: "Enterprise", 
    users: 45, 
    lastActivity: "15 min fa",
    vatNumber: "IT98765432101",
    email: "info@techcorp.com",
    phone: "+39 06 9876543",
    createdAt: "2023-03-20",
    bankAccounts: 8,
    transactions30d: 1234,
    syncFailed7d: 2,
    integrations: [
      { name: "Plaid", status: "connected" },
      { name: "Stripe", status: "error" },
    ]
  },
  { 
    id: "3", 
    name: "StartUp Innovation", 
    status: "pending_onboarding", 
    plan: "Starter", 
    users: 3, 
    lastActivity: "Mai",
    vatNumber: "IT11122233344",
    email: "hello@startup.io",
    phone: "+39 333 1234567",
    createdAt: "2024-01-10",
    bankAccounts: 0,
    transactions30d: 0,
    syncFailed7d: 0,
    integrations: []
  },
  { 
    id: "4", 
    name: "Global Finance Ltd", 
    status: "active", 
    plan: "Enterprise", 
    users: 28, 
    lastActivity: "1 giorno fa",
    vatNumber: "IT55566677788",
    email: "support@globalfinance.com",
    phone: "+39 02 5556667",
    createdAt: "2022-11-05",
    bankAccounts: 12,
    transactions30d: 2890,
    syncFailed7d: 1,
    integrations: [
      { name: "Plaid", status: "connected" },
    ]
  },
  { 
    id: "5", 
    name: "Local Business", 
    status: "suspended", 
    plan: "Starter", 
    users: 5, 
    lastActivity: "30 giorni fa",
    vatNumber: "IT99988877766",
    email: "info@localbiz.it",
    phone: "+39 055 9998887",
    createdAt: "2023-09-01",
    bankAccounts: 1,
    transactions30d: 0,
    syncFailed7d: 5,
    integrations: [
      { name: "Plaid", status: "error" },
    ]
  },
];

export default function Aziende() {
  const [selectedCompany, setSelectedCompany] = useState<typeof companies[0] | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"suspend" | "activate">("suspend");
  const [actionReason, setActionReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Attiva</Badge>;
      case "pending_onboarding":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">In Onboarding</Badge>;
      case "suspended":
        return <Badge variant="destructive">Sospesa</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getIntegrationStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const handleViewDetails = (company: typeof companies[0]) => {
    setSelectedCompany(company);
    setDetailSheetOpen(true);
  };

  const handleActionClick = (company: typeof companies[0], type: "suspend" | "activate") => {
    setSelectedCompany(company);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!actionReason.trim()) {
      toast.error("Inserisci un motivo per l'azione");
      return;
    }
    const actionLabel = actionType === "suspend" ? "sospesa" : "attivata";
    toast.success(`Azienda ${actionLabel} con successo`, {
      description: `${selectedCompany?.name} - Motivo: ${actionReason}`
    });
    setActionDialogOpen(false);
    setActionReason("");
  };

  const handleImpersonate = (company: typeof companies[0]) => {
    toast.success("Impersonificazione avviata", {
      description: `Stai visualizzando come ${company.name}`
    });
  };

  const filteredCompanies = companies.filter(company => {
    if (filterStatus !== "all" && company.status !== filterStatus) return false;
    if (filterPlan !== "all" && company.plan !== filterPlan) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Aziende</h1>
          <p className="text-muted-foreground mt-1">
            Gestione globale delle aziende clienti
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Building2 className="mr-2 h-4 w-4" />
          Nuova Azienda
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cerca per ragione sociale, ID, piano..." 
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtri
                  {(filterStatus !== "all" || filterPlan !== "all") && (
                    <Badge className="ml-2 bg-violet-600">
                      {[filterStatus !== "all", filterPlan !== "all"].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtri Avanzati</h4>
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tutti gli stati" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="active">Attiva</SelectItem>
                        <SelectItem value="pending_onboarding">In Onboarding</SelectItem>
                        <SelectItem value="suspended">Sospesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Piano</Label>
                    <Select value={filterPlan} onValueChange={setFilterPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tutti i piani" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i piani</SelectItem>
                        <SelectItem value="Starter">Starter</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => { setFilterStatus("all"); setFilterPlan("all"); }}
                  >
                    Resetta Filtri
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco Aziende</CardTitle>
          <CardDescription>
            {filteredCompanies.length} aziende {filteredCompanies.length !== companies.length && `(filtrate da ${companies.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ragione Sociale</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Piano</TableHead>
                <TableHead>Utenti</TableHead>
                <TableHead>Ultima Attività</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{getStatusBadge(company.status)}</TableCell>
                  <TableCell>{company.plan}</TableCell>
                  <TableCell>{company.users}</TableCell>
                  <TableCell className="text-muted-foreground">{company.lastActivity}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(company)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizza Dettagli
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleImpersonate(company)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Impersonifica
                        </DropdownMenuItem>
                        {company.status === "active" ? (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleActionClick(company, "suspend")}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Sospendi
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-emerald-600"
                            onClick={() => handleActionClick(company, "activate")}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Attiva
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Company Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedCompany?.name}
            </SheetTitle>
            <SheetDescription>
              Dettagli completi dell'azienda
            </SheetDescription>
          </SheetHeader>
          
          {selectedCompany && (
            <div className="mt-6 space-y-6">
              {/* Summary Panel */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Informazioni Generali</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">P.IVA</p>
                    <p className="font-medium">{selectedCompany.vatNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCompany.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefono</p>
                    <p className="font-medium">{selectedCompany.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data Registrazione</p>
                    <p className="font-medium">{selectedCompany.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Piano</p>
                    <p className="font-medium">{selectedCompany.plan}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stato</p>
                    {getStatusBadge(selectedCompany.status)}
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Metriche</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{selectedCompany.users}</p>
                          <p className="text-xs text-muted-foreground">Utenti</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-violet-500" />
                        <div>
                          <p className="text-2xl font-bold">{selectedCompany.bankAccounts}</p>
                          <p className="text-xs text-muted-foreground">Conti Bancari</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="text-2xl font-bold">{selectedCompany.transactions30d}</p>
                          <p className="text-xs text-muted-foreground">Transazioni (30g)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="text-2xl font-bold">{selectedCompany.syncFailed7d}</p>
                          <p className="text-xs text-muted-foreground">Sync Falliti (7g)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Integrations Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Stato Integrazioni</h4>
                {selectedCompany.integrations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCompany.integrations.map((integration, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2">
                          {getIntegrationStatusIcon(integration.status)}
                          <span className="font-medium">{integration.name}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Sync
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nessuna integrazione configurata</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleImpersonate(selectedCompany)}
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Impersonifica
                </Button>
                {selectedCompany.status === "active" ? (
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      handleActionClick(selectedCompany, "suspend");
                    }}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Sospendi
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      handleActionClick(selectedCompany, "activate");
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Attiva
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend" ? "Sospendi Azienda" : "Attiva Azienda"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "suspend" 
                ? `Stai per sospendere ${selectedCompany?.name}. Gli utenti non potranno più accedere.`
                : `Stai per riattivare ${selectedCompany?.name}. Gli utenti potranno accedere nuovamente.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea 
                placeholder="Inserisci il motivo dell'azione..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              variant={actionType === "suspend" ? "destructive" : "default"}
              className={actionType === "activate" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={handleConfirmAction}
            >
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
