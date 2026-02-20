import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface RevenueCenter {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
}

export function RevenueCentersManager() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RevenueCenter | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", is_active: true });
  const queryClient = useQueryClient();

  const { data: revenueCenters, isLoading } = useQuery({
    queryKey: ["revenue-centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_centers")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as RevenueCenter[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; is_active: boolean }) => {
      const maxOrder = revenueCenters?.length ? Math.max(...revenueCenters.map(r => r.sort_order)) + 1 : 1;
      const { error } = await supabase.from("revenue_centers").insert({ ...data, sort_order: maxOrder, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-centers"] });
      toast.success("Centro di incasso creato");
      resetForm();
    },
    onError: () => toast.error("Errore durante il salvataggio"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; description: string; is_active: boolean }) => {
      const { error } = await supabase.from("revenue_centers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-centers"] });
      toast.success("Centro di incasso aggiornato");
      resetForm();
    },
    onError: () => toast.error("Errore durante l'aggiornamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("revenue_centers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-centers"] });
      toast.success("Centro di incasso eliminato");
    },
    onError: () => toast.error("Errore durante l'eliminazione"),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", is_active: true });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: RevenueCenter) => {
    setEditingItem(item);
    setFormData({ name: item.name, description: item.description || "", is_active: item.is_active });
    setIsOpen(true);
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Centri di Incasso</h3>
            <p className="text-sm text-muted-foreground">Fonti di ricavo usate per classificare le entrate</p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo Centro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Modifica Centro" : "Nuovo Centro di Incasso"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Vendita Prodotti"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Descrizione</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrizione opzionale..."
                  rows={3}
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
                  {editingItem ? "Salva" : "Crea"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueCenters?.map((item) => {
              const isSystem = !item.user_id;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.name}
                    {isSystem && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">Sistema</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.description || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {item.is_active ? "Attivo" : "Inattivo"}
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
