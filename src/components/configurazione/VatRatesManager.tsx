import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { toast } from "sonner";

interface VatRate {
  id: string;
  name: string;
  rate: number;
  is_default: boolean;
  created_at: string;
}

export function VatRatesManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VatRate | null>(null);
  const [formData, setFormData] = useState({ name: "", rate: "", is_default: false });
  const queryClient = useQueryClient();

  const { data: vatRates, isLoading } = useQuery({
    queryKey: ["vat-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vat_rates")
        .select("*")
        .order("rate", { ascending: false });
      if (error) throw error;
      return data as VatRate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; rate: number; is_default: boolean }) => {
      const { error } = await supabase.from("vat_rates").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vat-rates"] });
      toast.success("Aliquota IVA creata");
      resetForm();
    },
    onError: () => toast.error("Errore durante il salvataggio"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; rate: number; is_default: boolean }) => {
      const { error } = await supabase.from("vat_rates").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vat-rates"] });
      toast.success("Aliquota IVA aggiornata");
      resetForm();
    },
    onError: () => toast.error("Errore durante l'aggiornamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vat_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vat-rates"] });
      toast.success("Aliquota IVA eliminata");
    },
    onError: () => toast.error("Errore durante l'eliminazione"),
  });

  const resetForm = () => {
    setFormData({ name: "", rate: "", is_default: false });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      rate: parseFloat(formData.rate),
      is_default: formData.is_default,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: VatRate) => {
    setEditingItem(item);
    setFormData({ name: item.name, rate: item.rate.toString(), is_default: item.is_default });
    setIsOpen(true);
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Aliquote IVA</h3>
            <p className="text-sm text-muted-foreground">Gestisci le aliquote IVA disponibili</p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuova Aliquota
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Modifica Aliquota" : "Nuova Aliquota IVA"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. IVA 22%"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Aliquota (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="22.00"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Predefinita</Label>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
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
              <TableHead>Aliquota</TableHead>
              <TableHead>Predefinita</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vatRates?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.rate}%</TableCell>
                <TableCell>
                  {item.is_default && (
                    <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                      Default
                    </span>
                  )}
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
  );
}
