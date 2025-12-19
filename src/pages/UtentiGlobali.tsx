import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  MoreVertical,
  Eye,
  KeyRound,
  Ban,
  LogOut
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

// Mock data
const users = [
  { id: "1", name: "Mario Rossi", email: "mario.rossi@acme.it", company: "Acme S.r.l.", role: "admin_aziendale", status: "active", lastLogin: "2 ore fa" },
  { id: "2", name: "Giulia Bianchi", email: "g.bianchi@techcorp.com", company: "TechCorp S.p.A.", role: "user", status: "active", lastLogin: "15 min fa" },
  { id: "3", name: "Luca Verdi", email: "luca@startup.io", company: "StartUp Innovation", role: "admin_aziendale", status: "invited", lastLogin: "Mai" },
  { id: "4", name: "Anna Neri", email: "a.neri@globalfinance.com", company: "Global Finance Ltd", role: "user", status: "active", lastLogin: "1 giorno fa" },
  { id: "5", name: "Marco Costa", email: "m.costa@localbiz.it", company: "Local Business", role: "user", status: "disabled", lastLogin: "30 giorni fa" },
];

export default function UtentiGlobali() {
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
            <Button variant="outline">Filtri</Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco Utenti</CardTitle>
          <CardDescription>
            {users.length} utenti registrati sulla piattaforma
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
              {users.map((user) => (
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizza Profilo
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LogOut className="mr-2 h-4 w-4" />
                          Forza Logout
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
    </div>
  );
}