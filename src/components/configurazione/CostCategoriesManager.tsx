import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";

type CostType = "fixed" | "variable";
type CashflowType = "operational" | "investment" | "financing";

interface CostCategory {
  id: string;
  name: string;
  cost_type: CostType;
  parent_id: string | null;
  cashflow_type: CashflowType;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
}

const costTypeLabels: Record<CostType, string> = {
  fixed: "Fisso",
  variable: "Variabile",
};

const cashflowTypeLabels: Record<CashflowType, string> = {
  operational: "Operativo",
  investment: "Investimento",
  financing: "Finanziamento",
};

export function CostCategoriesManager() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cost_type: "fixed" as CostType,
    cashflow_type: "operational" as CashflowType,
    parent_id: "",
    is_active: true,
  });
  const [filter, setFilter] = useState<"all" | CostType>("all");
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["cost-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_categories")
        .select("*")
        .order("cost_type", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CostCategory[];
    },
  });

  const filteredCategories = categories?.filter(
    (c) => filter === "all" || c.cost_type === filter
  );

  const parentCategories = categories?.filter((c) => !c.parent_id);

  const createMutation = useMutation({
    mutationFn: async (data: Omit<CostCategory, "id" | "created_at" | "sort_order" | "user_id">) => {
      const maxOrder = categories?.length ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1;
      const { error } = await supabase.from("cost_categories").insert({ ...data, sort_order: maxOrder, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-categories"] });
      toast.success("Categoria creata");
      resetForm();
    },
    onError: () => toast.error("Errore durante il salvataggio"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CostCategory> & { id: string }) => {
      const { error } = await supabase.from("cost_categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-categories"] });
      toast.success("Categoria aggiornata");
      resetForm();
    },
    onError: () => toast.error("Errore durante l'aggiornamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cost_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-categories"] });
      toast.success("Categoria eliminata");
    },
    onError: () => toast.error("Errore durante l'eliminazione"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      cost_type: "fixed",
      cashflow_type: "operational",
      parent_id: "",
      is_active: true,
    });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      cost_type: formData.cost_type,
      cashflow_type: formData.cashflow_type,
      parent_id: formData.parent_id || null,
      is_active: formData.is_active,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: CostCategory) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      cost_type: item.cost_type,
      cashflow_type: item.cashflow_type,
      parent_id: item.parent_id || "",
      is_active: item.is_active,
    });
    setIsOpen(true);
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FolderTree className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Categorie Costi</h3>
            <p className="text-sm text-muted-foreground">Voci di spesa per categorizzare transazioni e analisi</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as "all" | CostType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="fixed">Fissi</SelectItem>
              <SelectItem value="variable">Variabili</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifica Categoria" : "Nuova Categoria"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es. Utenze"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Costo</Label>
                    <Select
                      value={formData.cost_type}
                      onValueChange={(v) => setFormData({ ...formData, cost_type: v as CostType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fisso</SelectItem>
                        <SelectItem value="variable">Variabile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipologia Cashflow</Label>
                    <Select
                      value={formData.cashflow_type}
                      onValueChange={(v) => setFormData({ ...formData, cashflow_type: v as CashflowType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operativo</SelectItem>
                        <SelectItem value="investment">Investimento</SelectItem>
                        <SelectItem value="financing">Finanziamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoria Padre (opzionale)</Label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(v) => setFormData({ ...formData, parent_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nessuna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {parentCategories
                        ?.filter((c) => c.id !== editingItem?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Attiva</Label>
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
                    {editingItem ? "Salva" : "Crea"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cashflow</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories?.map((item) => {
              const parent = categories?.find((c) => c.id === item.parent_id);
              const isSystem = !item.user_id;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {parent && <span className="text-muted-foreground mr-2">↳</span>}
                    {item.name}
                    {isSystem && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">Sistema</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.cost_type === "fixed" 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {costTypeLabels[item.cost_type]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cashflowTypeLabels[item.cashflow_type]}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {item.is_active ? "Attiva" : "Inattiva"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {isSystem ? (
                      <span className="text-xs text-muted-foreground italic">Sola lettura</span>
                    ) : (
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
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
