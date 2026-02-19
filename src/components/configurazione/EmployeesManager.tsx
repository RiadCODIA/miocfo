import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  role: string | null;
  annual_cost: number;
  monthly_cost: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export function EmployeesManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    annual_cost: "",
    start_date: "",
    end_date: "",
    is_active: true,
    notes: "",
  });
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Employee[];
    },
  });

  const activeEmployees = employees?.filter((e) => e.is_active) || [];
  const totalMonthlyCost = activeEmployees.reduce((sum, e) => sum + e.monthly_cost, 0);

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Employee, "id" | "created_at" | "monthly_cost">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("employees").insert({
        ...data,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Dipendente aggiunto");
      resetForm();
    },
    onError: () => toast.error("Errore durante il salvataggio"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Employee> & { id: string }) => {
      const { error } = await supabase.from("employees").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Dipendente aggiornato");
      resetForm();
    },
    onError: () => toast.error("Errore durante l'aggiornamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Dipendente eliminato");
    },
    onError: () => toast.error("Errore durante l'eliminazione"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      annual_cost: "",
      start_date: "",
      end_date: "",
      is_active: true,
      notes: "",
    });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      role: formData.role || null,
      annual_cost: parseFloat(formData.annual_cost),
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      is_active: formData.is_active,
      notes: formData.notes || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: Employee) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      role: item.role || "",
      annual_cost: item.annual_cost.toString(),
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      is_active: item.is_active,
      notes: item.notes || "",
    });
    setIsOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dipendenti Attivi</p>
              <p className="text-2xl font-bold text-foreground">{activeEmployees.length}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costo Mensile Totale</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalMonthlyCost)}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costo Annuo Totale</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalMonthlyCost * 12)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Gestione Dipendenti</h3>
              <p className="text-sm text-muted-foreground">Costo aziendale per conto economico e previsioni di cassa</p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuovo Dipendente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifica Dipendente" : "Nuovo Dipendente"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome e Cognome</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Mario Rossi"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ruolo</Label>
                    <Input
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="es. Developer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Costo Azienda Annuo (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.annual_cost}
                    onChange={(e) => setFormData({ ...formData, annual_cost: e.target.value })}
                    placeholder="50000.00"
                    required
                  />
                  {formData.annual_cost && (
                    <p className="text-sm text-muted-foreground">
                      Costo mensile: {formatCurrency(parseFloat(formData.annual_cost) / 12)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Inizio</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fine</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Note opzionali..."
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Attivo</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annulla
                  </Button>
                  <Button type="submit">
                    {editingItem ? "Salva" : "Aggiungi"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
        ) : employees?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nessun dipendente registrato. Clicca "Nuovo Dipendente" per aggiungerne uno.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead className="text-right">Costo Annuo</TableHead>
                <TableHead className="text-right">Costo Mensile</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.role || "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.annual_cost)}</TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {formatCurrency(item.monthly_cost)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {item.is_active ? "Attivo" : "Inattivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
