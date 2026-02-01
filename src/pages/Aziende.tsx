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
  RefreshCw,
  Loader2
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
import { useCompanies, useUpdateCompany, type Company } from "@/hooks/useCompanies";
import { useCompanyMetrics } from "@/hooks/useCompanyMetrics";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Extended company type with calculated fields for display
interface CompanyDisplay extends Company {
  users?: number;
  bankAccounts?: number;
  transactions30d?: number;
  syncFailed7d?: number;
  lastActivity?: string;
  plan?: string;
  integrations?: { name: string; status: string }[];
}

function CompanyMetricsDisplay({ companyId }: { companyId: string }) {
  const { data: metrics, isLoading } = useCompanyMetrics(companyId);
  
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  
  return <span>{metrics?.users || 0}</span>;
}

export default function Aziende() {
  const { data: companiesData, isLoading, error } = useCompanies();
  const updateCompany = useUpdateCompany();
  
  const [selectedCompany, setSelectedCompany] = useState<CompanyDisplay | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"suspend" | "activate">("suspend");
  const [actionReason, setActionReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const companies: CompanyDisplay[] = (companiesData || []).map(c => ({
    ...c,
    users: 0, // Will be calculated per-company
    bankAccounts: 0,
    transactions30d: 0,
    syncFailed7d: 0,
    lastActivity: c.updated_at ? format(new Date(c.updated_at), "dd MMM yyyy", { locale: it }) : "Mai",
    plan: "Professional", // TODO: Link to subscription when implemented
    integrations: []
  }));

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

  const handleViewDetails = (company: CompanyDisplay) => {
    setSelectedCompany(company);
    setDetailSheetOpen(true);
  };

  const handleActionClick = (company: CompanyDisplay, type: "suspend" | "activate") => {
    setSelectedCompany(company);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!actionReason.trim()) {
      toast.error("Inserisci un motivo per l'azione");
      return;
    }
    if (!selectedCompany) return;
    
    const newStatus = actionType === "suspend" ? "suspended" : "active";
    
    try {
      await updateCompany.mutateAsync({
        id: selectedCompany.id,
        status: newStatus
      });
      
      const actionLabel = actionType === "suspend" ? "sospesa" : "attivata";
      toast.success(`Azienda ${actionLabel} con successo`, {
        description: `${selectedCompany?.name} - Motivo: ${actionReason}`
      });
    } catch (error) {
      toast.error("Errore durante l'operazione");
    }
    
    setActionDialogOpen(false);
    setActionReason("");
  };

  const handleImpersonate = (company: CompanyDisplay) => {
    toast.success("Impersonificazione avviata", {
      description: `Stai visualizzando come ${company.name}`
    });
  };

  const filteredCompanies = companies.filter(company => {
    if (filterStatus !== "all" && company.status !== filterStatus) return false;
    if (searchQuery && !company.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">Errore nel caricamento delle aziende</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

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
                placeholder="Cerca per ragione sociale..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtri
                  {filterStatus !== "all" && (
                    <Badge className="ml-2 bg-violet-600">1</Badge>
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
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setFilterStatus("all")}
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
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento...
              </span>
            ) : (
              <>
                {filteredCompanies.length} aziende {filteredCompanies.length !== companies.length && `(filtrate da ${companies.length})`}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nessuna azienda registrata</p>
              <p className="text-muted-foreground">Le aziende verranno create quando gli utenti si registrano</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ragione Sociale</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>P.IVA</TableHead>
                  <TableHead>Utenti</TableHead>
                  <TableHead>Ultima Attività</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{getStatusBadge(company.status || "active")}</TableCell>
                    <TableCell className="text-muted-foreground">{company.vat_number || "-"}</TableCell>
                    <TableCell>
                      <CompanyMetricsDisplay companyId={company.id} />
                    </TableCell>
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
          )}
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
            <CompanyDetailContent company={selectedCompany} getStatusBadge={getStatusBadge} getIntegrationStatusIcon={getIntegrationStatusIcon} />
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
                ? `Stai per sospendere ${selectedCompany?.name}. L'azienda non potrà più accedere ai servizi.`
                : `Stai per riattivare ${selectedCompany?.name}. L'azienda potrà nuovamente accedere ai servizi.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo (obbligatorio)</Label>
              <Textarea 
                placeholder="Inserisci il motivo dell'azione..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleConfirmAction}
              variant={actionType === "suspend" ? "destructive" : "default"}
              disabled={updateCompany.isPending}
            >
              {updateCompany.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate component for company details with metrics
function CompanyDetailContent({ 
  company, 
  getStatusBadge, 
  getIntegrationStatusIcon 
}: { 
  company: CompanyDisplay; 
  getStatusBadge: (status: string) => JSX.Element;
  getIntegrationStatusIcon: (status: string) => JSX.Element;
}) {
  const { data: metrics, isLoading: metricsLoading } = useCompanyMetrics(company.id);
  
  return (
    <div className="mt-6 space-y-6">
      {/* Summary Panel */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Informazioni Generali</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">P.IVA</p>
            <p className="font-medium">{company.vat_number || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{company.email || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Telefono</p>
            <p className="font-medium">{company.phone || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Data Registrazione</p>
            <p className="font-medium">
              {company.created_at 
                ? format(new Date(company.created_at), "dd MMMM yyyy", { locale: it })
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Piano</p>
            <p className="font-medium">{company.plan}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Stato</p>
            {getStatusBadge(company.status || "active")}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Metriche</h4>
        {metricsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics?.users || 0}</p>
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
                    <p className="text-2xl font-bold">{metrics?.bankAccounts || 0}</p>
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
                    <p className="text-2xl font-bold">{metrics?.transactions30d || 0}</p>
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
                    <p className="text-2xl font-bold">{metrics?.syncFailed7d || 0}</p>
                    <p className="text-xs text-muted-foreground">Sync Falliti (7g)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Integrations Status */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Stato Integrazioni</h4>
        {company.integrations && company.integrations.length > 0 ? (
          <div className="space-y-2">
            {company.integrations.map((integration, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">{integration.name}</span>
                <div className="flex items-center gap-2">
                  {getIntegrationStatusIcon(integration.status)}
                  <span className="text-sm text-muted-foreground capitalize">
                    {integration.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-muted/50 rounded-lg">
            <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nessuna integrazione configurata</p>
          </div>
        )}
      </div>
    </div>
  );
}
