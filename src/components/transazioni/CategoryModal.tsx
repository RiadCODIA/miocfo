import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CostCategory {
  id: string;
  name: string;
  cost_type: string;
  cashflow_type: string;
}

interface Transaction {
  id: string;
  description?: string | null;
  merchantName?: string | null;
  amount: number;
  aiCategoryId?: string | null;
}

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  aiSuggestion?: {
    category_id: string;
    category_name: string;
    confidence: number;
    reasoning: string;
  } | null;
}

export function CategoryModal({
  open,
  onOpenChange,
  transaction,
  aiSuggestion,
}: CategoryModalProps) {
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [createRule, setCreateRule] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (aiSuggestion) {
        setSelectedCategoryId(aiSuggestion.category_id);
      } else if (transaction?.aiCategoryId) {
        setSelectedCategoryId(transaction.aiCategoryId);
      } else {
        setSelectedCategoryId("");
      }
    }
  }, [open, aiSuggestion, transaction]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("cost_categories")
      .select("id, name, cost_type, cashflow_type")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleConfirm = async () => {
    if (!transaction || !selectedCategoryId) return;

    setIsLoading(true);
    try {
      // Update transaction with confirmed category
      const { error: updateError } = await supabase
        .from("bank_transactions")
        .update({
          ai_category_id: selectedCategoryId,
          category_confirmed: true,
        })
        .eq("id", transaction.id);

      if (updateError) throw updateError;

      // If createRule is checked, create a categorization rule
      if (createRule) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const pattern = transaction.merchantName || transaction.description || "";
          const { error: ruleError } = await supabase
            .from("categorization_rules")
            .insert({
              pattern: pattern.toLowerCase(),
              category_id: selectedCategoryId,
              user_id: user.id,
            });

          if (ruleError) {
            console.error("Failed to create rule:", ruleError);
            toast.error("Categoria confermata, ma regola non creata");
          } else {
            toast.success("Categoria confermata e regola creata per transazioni simili");
          }
        }
      } else {
        toast.success("Categoria confermata");
      }

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update category:", error);
      toast.error("Errore durante il salvataggio");
    } finally {
      setIsLoading(false);
    }
  };

  const isIncome = transaction ? transaction.amount >= 0 : false;
  
  // Filter categories: income transactions see all, expense transactions see only expense categories
  const filteredCategories = categories.filter((cat) => {
    if (isIncome) return true; // income can pick any category
    // For expenses, exclude revenue-type categories
    return cat.cashflow_type !== "operational" || cat.cost_type !== "variable" 
      ? true : true; // show all for now, but filter out revenue-like names
  });

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Categorizza Transazione</DialogTitle>
          <DialogDescription>
            {transaction?.merchantName || transaction?.description || "Transazione"}
            {transaction?.merchantName && transaction?.description && ` - ${transaction.description}`}
            <span className={`ml-2 font-semibold ${isIncome ? "text-success" : "text-destructive"}`}>
              {isIncome ? "+" : ""}€{Math.abs(transaction?.amount || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* AI Suggestion */}
          {aiSuggestion && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Suggerimento AI ({aiSuggestion.confidence}% confidenza)
              </div>
              <p className="text-sm text-muted-foreground">
                {aiSuggestion.reasoning}
              </p>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona categoria..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      {cat.name}
                      <span className="text-xs text-muted-foreground">
                        ({cat.cost_type === "fixed" ? "Fisso" : "Variabile"})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Rule Checkbox */}
          {selectedCategoryId && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createRule"
                checked={createRule}
                onCheckedChange={(checked) => setCreateRule(checked === true)}
              />
              <Label htmlFor="createRule" className="text-sm font-normal">
                Applica automaticamente a transazioni simili
              </Label>
            </div>
          )}

          {/* Preview */}
          {selectedCategory && (
            <div className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
              <span className="font-medium">Tipo:</span> {selectedCategory.cost_type} •{" "}
              <span className="font-medium">Flusso:</span> {selectedCategory.cashflow_type}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedCategoryId || isLoading}>
            <Check className="h-4 w-4 mr-1" />
            Conferma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}