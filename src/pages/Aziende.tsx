import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Search, 
  MoreVertical,
  Eye,
  UserCog,
  Pause,
  Play
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
const companies = [
  { id: "1", name: "Acme S.r.l.", status: "active", plan: "Professional", users: 12, lastActivity: "2 ore fa" },
  { id: "2", name: "TechCorp S.p.A.", status: "active", plan: "Enterprise", users: 45, lastActivity: "15 min fa" },
  { id: "3", name: "StartUp Innovation", status: "pending_onboarding", plan: "Starter", users: 3, lastActivity: "Mai" },
  { id: "4", name: "Global Finance Ltd", status: "active", plan: "Enterprise", users: 28, lastActivity: "1 giorno fa" },
  { id: "5", name: "Local Business", status: "suspended", plan: "Starter", users: 5, lastActivity: "30 giorni fa" },
];

export default function Aziende() {
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
            <Button variant="outline">Filtri</Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco Aziende</CardTitle>
          <CardDescription>
            {companies.length} aziende registrate sulla piattaforma
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
              {companies.map((company) => (
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizza Dettagli
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserCog className="mr-2 h-4 w-4" />
                          Impersonifica
                        </DropdownMenuItem>
                        {company.status === "active" ? (
                          <DropdownMenuItem className="text-destructive">
                            <Pause className="mr-2 h-4 w-4" />
                            Sospendi
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-emerald-600">
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
    </div>
  );
}