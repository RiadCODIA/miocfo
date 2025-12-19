import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Search, 
  MoreVertical,
  Eye,
  KeyRound,
  Ban,
  LogOut,
  Filter,
  UserCheck,
  Clock,
  Shield,
  Activity
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
const users = [
  { 
    id: "1", 
    name: "Mario Rossi", 
    email: "mario.rossi@acme.it", 
    company: "Acme S.r.l.", 
    role: "admin_aziendale", 
    status: "active", 
    lastLogin: "2 ore fa",
    createdAt: "2023-06-15",
    phone: "+39 333 1234567",
    twoFactorEnabled: true,
    activityLog: [
      { action: "login", timestamp: "2024-01-15 14:30", details: "Login da Milano, IT" },
      { action: "permission_change", timestamp: "2024-01-14 10:15", details: "Promosso ad Admin Aziendale" },
      { action: "password_reset", timestamp: "2024-01-10 09:00", details: "Password resettata via email" },
      { action: "login", timestamp: "2024-01-09 08:45", details: "Login da Roma, IT" },
    ]
  },
  { 
    id: "2", 
    name: "Giulia Bianchi", 
    email: "g.bianchi@techcorp.com", 
    company: "TechCorp S.p.A.", 
    role: "user", 
    status: "active", 
    lastLogin: "15 min fa",
    createdAt: "2023-08-20",
    phone: "+39 347 9876543",
    twoFactorEnabled: false,
    activityLog: [
      { action: "login", timestamp: "2024-01-15 14:45", details: "Login da Napoli, IT" },
      { action: "report_generated", timestamp: "2024-01-15 14:30", details: "Report Cash Flow Q4 2023" },
    ]
  },
  { 
    id: "3", 
    name: "Luca Verdi", 
    email: "luca@startup.io", 
    company: "StartUp Innovation", 
    role: "admin_aziendale", 
    status: "invited", 
    lastLogin: "Mai",
    createdAt: "2024-01-10",
    phone: null,
    twoFactorEnabled: false,
    activityLog: []
  },
  { 
    id: "4", 
    name: "Anna Neri", 
    email: "a.neri@globalfinance.com", 
    company: "Global Finance Ltd", 
    role: "user", 
    status: "active", 
    lastLogin: "1 giorno fa",
    createdAt: "2022-11-05",
    phone: "+39 02 5556667",
    twoFactorEnabled: true,
    activityLog: [
      { action: "login", timestamp: "2024-01-14 09:00", details: "Login da Milano, IT" },
      { action: "transaction_export", timestamp: "2024-01-13 16:30", details: "Export 500 transazioni" },
    ]
  },
  { 
    id: "5", 
    name: "Marco Costa", 
    email: "m.costa@localbiz.it", 
    company: "Local Business", 
    role: "user", 
    status: "disabled", 
    lastLogin: "30 giorni fa",
    createdAt: "2023-09-01",
    phone: "+39 055 9998887",
    twoFactorEnabled: false,
    activityLog: [
      { action: "account_disabled", timestamp: "2023-12-15 11:00", details: "Disabilitato per inattività" },
    ]
  },
];

export default function UtentiGlobali() {
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Attivo</Badge>;
      case "invited":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Invitato</Badge>;
      case "disabled":
        return <Badge variant="destructive">Disabilitato</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-violet-500/20 text-violet-600 border-violet-500/30">Super Admin</Badge>;
      case "admin_aziendale":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Admin Aziendale</Badge>;
      case "user":
        return <Badge variant="secondary">Utente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login":
        return <LogOut className="h-4 w-4 text-blue-500" />;
      case "permission_change":
        return <Shield className="h-4 w-4 text-violet-500" />;
      case "password_reset":
        return <KeyRound className="h-4 w-4 text-amber-500" />;
      case "account_disabled":
        return <Ban className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleViewDetails = (user: typeof users[0]) => {
    setSelectedUser(user);
    setDetailSheetOpen(true);
  };

  const handleChangeRole = (user: typeof users[0]) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = () => {
    if (!roleChangeReason.trim()) {
      toast.error("Inserisci un motivo per la modifica");
      return;
    }
    toast.success("Ruolo modificato con successo", {
      description: `${selectedUser?.name} → ${newRole === "admin_aziendale" ? "Admin Aziendale" : "Utente"}`
    });
    setRoleDialogOpen(false);
    setRoleChangeReason("");
  };

  const handleResetPassword = (user: typeof users[0]) => {
    toast.success("Email di reset password inviata", {
      description: `Inviata a ${user.email}`
    });
  };

  const handleForceLogout = (user: typeof users[0]) => {
    toast.success("Logout forzato", {
      description: `${user.name} è stato disconnesso da tutte le sessioni`
    });
  };

  const handleDisableAccount = (user: typeof users[0]) => {
    toast.success("Account disabilitato", {
      description: `${user.name} non potrà più accedere`
    });
  };

  const filteredUsers = users.filter(user => {
    if (filterStatus !== "all" && user.status !== filterStatus) return false;
    if (filterRole !== "all" && user.role !== filterRole) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Utenti Globali</h1>
        <p className="text-muted-foreground mt-1">
          Gestione e controllo globale degli utenti di tutte le aziende
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cerca per nome, email, azienda..." 
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtri
                  {(filterStatus !== "all" || filterRole !== "all") && (
                    <Badge className="ml-2 bg-violet-600">
                      {[filterStatus !== "all", filterRole !== "all"].filter(Boolean).length}
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
                        <SelectItem value="active">Attivo</SelectItem>
                        <SelectItem value="invited">Invitato</SelectItem>
                        <SelectItem value="disabled">Disabilitato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ruolo</Label>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tutti i ruoli" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i ruoli</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin_aziendale">Admin Aziendale</SelectItem>
                        <SelectItem value="user">Utente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => { setFilterStatus("all"); setFilterRole("all"); }}
                  >
                    Resetta Filtri
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco Utenti</CardTitle>
          <CardDescription>
            {filteredUsers.length} utenti {filteredUsers.length !== users.length && `(filtrati da ${users.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Azienda</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Ultimo Accesso</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizza Profilo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Modifica Ruolo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleForceLogout(user)}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Forza Logout
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDisableAccount(user)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Disabilita Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedUser?.name}
            </SheetTitle>
            <SheetDescription>
              Profilo e attività utente
            </SheetDescription>
          </SheetHeader>
          
          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* Profile Panel */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Profilo</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefono</p>
                    <p className="font-medium">{selectedUser.phone || "Non specificato"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Azienda</p>
                    <p className="font-medium">{selectedUser.company}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data Registrazione</p>
                    <p className="font-medium">{selectedUser.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ruolo</p>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stato</p>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  <div>
                    <p className="text-muted-foreground">2FA</p>
                    {selectedUser.twoFactorEnabled ? (
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Attiva</Badge>
                    ) : (
                      <Badge variant="secondary">Non attiva</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ultimo Accesso</p>
                    <p className="font-medium">{selectedUser.lastLogin}</p>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline Attività
                </h4>
                {selectedUser.activityLog.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.activityLog.map((activity, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        {getActionIcon(activity.action)}
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">
                            {activity.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.details}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nessuna attività registrata</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleChangeRole(selectedUser)}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Modifica Ruolo
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleForceLogout(selectedUser)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Forza Logout
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Ruolo Utente</DialogTitle>
            <DialogDescription>
              Modifica il ruolo di {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuovo Ruolo</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utente</SelectItem>
                  <SelectItem value="admin_aziendale">Admin Aziendale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo della modifica *</Label>
              <Textarea 
                placeholder="Inserisci il motivo della modifica ruolo..."
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Annulla
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleConfirmRoleChange}>
              Conferma Modifica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
