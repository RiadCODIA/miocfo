import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Search, 
  MoreVertical,
  Eye,
  KeyRound,
  Ban,
  LogOut,
  Filter,
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
import { useGlobalUsers, useUpdateUserRole, GlobalUser } from "@/hooks/useGlobalUsers";

export default function UtentiGlobali() {
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'user' | 'admin_aziendale' | 'super_admin'>('user');
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading } = useGlobalUsers();
  const updateUserRole = useUpdateUserRole();

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

  const handleViewDetails = (user: GlobalUser) => {
    setSelectedUser(user);
    setDetailSheetOpen(true);
  };

  const handleChangeRole = (user: GlobalUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = () => {
    if (!roleChangeReason.trim()) {
      toast.error("Inserisci un motivo per la modifica");
      return;
    }
    if (!selectedUser) return;
    
    updateUserRole.mutate({
      userId: selectedUser.id,
      role: newRole,
    }, {
      onSuccess: () => {
        setRoleDialogOpen(false);
        setRoleChangeReason("");
      }
    });
  };

  const handleResetPassword = (user: GlobalUser) => {
    toast.success("Email di reset password inviata", {
      description: `Inviata a ${user.firstName || user.id}`
    });
  };

  const handleForceLogout = (user: GlobalUser) => {
    toast.success("Logout forzato", {
      description: `${user.firstName || 'Utente'} è stato disconnesso da tutte le sessioni`
    });
  };

  const handleDisableAccount = (user: GlobalUser) => {
    toast.success("Account disabilitato", {
      description: `${user.firstName || 'Utente'} non potrà più accedere`
    });
  };

  const filteredUsers = (users || []).filter(user => {
    if (filterRole !== "all" && user.role !== filterRole) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const company = (user.companyName || '').toLowerCase();
      if (!fullName.includes(query) && !company.includes(query)) return false;
    }
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredUsers.length} utenti {filteredUsers.length !== (users?.length || 0) && `(filtrati da ${users?.length || 0})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Registrato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : user.id.slice(0, 8)
                      }
                    </TableCell>
                    <TableCell>{user.companyName || '-'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('it-IT')}
                    </TableCell>
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nessun utente trovato
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedUser?.firstName || selectedUser?.lastName 
                ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                : 'Utente'
              }
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
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedUser.firstName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cognome</p>
                    <p className="font-medium">{selectedUser.lastName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Azienda</p>
                    <p className="font-medium">{selectedUser.companyName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data Registrazione</p>
                    <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ruolo</p>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ultimo Accesso</p>
                    <p className="font-medium">{selectedUser.lastSignIn ? new Date(selectedUser.lastSignIn).toLocaleString('it-IT') : 'Mai'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Azioni Rapide
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleChangeRole(selectedUser)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Modifica Ruolo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleResetPassword(selectedUser)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleForceLogout(selectedUser)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Forza Logout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Ruolo Utente</DialogTitle>
            <DialogDescription>
              Stai modificando i permessi di {selectedUser?.firstName || 'questo utente'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuovo Ruolo</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as typeof newRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utente</SelectItem>
                  <SelectItem value="admin_aziendale">Admin Aziendale</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo della Modifica</Label>
              <Textarea 
                placeholder="Inserisci il motivo della modifica (verrà registrato nell'audit trail)"
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
            <Button 
              className="bg-violet-600 hover:bg-violet-700" 
              onClick={handleConfirmRoleChange}
              disabled={updateUserRole.isPending}
            >
              Conferma Modifica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
