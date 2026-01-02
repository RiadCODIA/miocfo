import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus,
  Check,
  Edit,
  Copy,
  Package
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubscriptionPlans, useCreatePlan, useUpdatePlan } from "@/hooks/useSubscriptionPlans";
import { Skeleton } from "@/components/ui/skeleton";

// All available features
const allFeatures = [
  { id: "dashboard", label: "Dashboard" },
  { id: "transactions", label: "Transazioni" },
  { id: "basic_reports", label: "Report Base" },
  { id: "cash_flow", label: "Cash Flow" },
  { id: "budget", label: "Budget & Previsioni" },
  { id: "advanced_reports", label: "Report Avanzati" },
  { id: "ai_categorization", label: "AI Categorization" },
  { id: "api_access", label: "API Access" },
  { id: "sso", label: "SSO" },
  { id: "dedicated_support", label: "Supporto Dedicato" },
  { id: "ai_forecast", label: "AI Forecast" },
  { id: "multi_currency", label: "Multi-Valuta" },
  { id: "custom_integrations", label: "Integrazioni Custom" },
];

export default function Piani() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [formBillingCycle, setFormBillingCycle] = useState("monthly");
  const [formStatus, setFormStatus] = useState("active");
  const [formMaxUsers, setFormMaxUsers] = useState(5);
  const [formMaxBankAccounts, setFormMaxBankAccounts] = useState(2);
  const [formMaxTransactions, setFormMaxTransactions] = useState(1000);
  const [formAiEnabled, setFormAiEnabled] = useState(false);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [formUnlimitedUsers, setFormUnlimitedUsers] = useState(false);
  const [formUnlimitedAccounts, setFormUnlimitedAccounts] = useState(false);
  const [formUnlimitedTransactions, setFormUnlimitedTransactions] = useState(false);

  const handleEditPlan = (plan: typeof plans extends (infer T)[] ? T : never) => {
    if (!plan) return;
    setEditingPlanId(plan.id);
    setIsCreating(false);
    setFormName(plan.name);
    setFormPrice(plan.price);
    setFormBillingCycle(plan.billing_cycle);
    setFormStatus(plan.status);
    setFormMaxUsers(plan.max_users === -1 ? 100 : plan.max_users);
    setFormMaxBankAccounts(plan.max_bank_accounts === -1 ? 50 : plan.max_bank_accounts);
    setFormMaxTransactions(plan.max_transactions_month === -1 ? 100000 : plan.max_transactions_month);
    setFormAiEnabled(plan.ai_features_enabled);
    setFormFeatures(plan.features || []);
    setFormUnlimitedUsers(plan.max_users === -1);
    setFormUnlimitedAccounts(plan.max_bank_accounts === -1);
    setFormUnlimitedTransactions(plan.max_transactions_month === -1);
    setEditSheetOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlanId(null);
    setIsCreating(true);
    setFormName("");
    setFormPrice(49);
    setFormBillingCycle("monthly");
    setFormStatus("active");
    setFormMaxUsers(10);
    setFormMaxBankAccounts(5);
    setFormMaxTransactions(5000);
    setFormAiEnabled(false);
    setFormFeatures(["dashboard", "transactions"]);
    setFormUnlimitedUsers(false);
    setFormUnlimitedAccounts(false);
    setFormUnlimitedTransactions(false);
    setEditSheetOpen(true);
  };

  const handleCopyPlan = (plan: typeof plans extends (infer T)[] ? T : never) => {
    if (!plan) return;
    setEditingPlanId(null);
    setIsCreating(true);
    setFormName(`${plan.name} (Copia)`);
    setFormPrice(plan.price);
    setFormBillingCycle(plan.billing_cycle);
    setFormStatus("draft");
    setFormMaxUsers(plan.max_users === -1 ? 100 : plan.max_users);
    setFormMaxBankAccounts(plan.max_bank_accounts === -1 ? 50 : plan.max_bank_accounts);
    setFormMaxTransactions(plan.max_transactions_month === -1 ? 100000 : plan.max_transactions_month);
    setFormAiEnabled(plan.ai_features_enabled);
    setFormFeatures([...(plan.features || [])]);
    setFormUnlimitedUsers(plan.max_users === -1);
    setFormUnlimitedAccounts(plan.max_bank_accounts === -1);
    setFormUnlimitedTransactions(plan.max_transactions_month === -1);
    setEditSheetOpen(true);
  };

  const handleSavePlan = async () => {
    if (!formName.trim()) {
      return;
    }

    const planData = {
      name: formName,
      price: formPrice,
      billing_cycle: formBillingCycle,
      status: formStatus,
      max_users: formUnlimitedUsers ? -1 : formMaxUsers,
      max_bank_accounts: formUnlimitedAccounts ? -1 : formMaxBankAccounts,
      max_transactions_month: formUnlimitedTransactions ? -1 : formMaxTransactions,
      ai_features_enabled: formAiEnabled,
      features: formFeatures,
    };

    if (isCreating) {
      await createPlan.mutateAsync(planData);
    } else if (editingPlanId) {
      await updatePlan.mutateAsync({ id: editingPlanId, ...planData });
    }
    setEditSheetOpen(false);
  };

  const toggleFeature = (featureId: string) => {
    setFormFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Piani e Limiti</h1>
          <p className="text-muted-foreground mt-1">
            Gestione piani commerciali e limiti di utilizzo
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleNewPlan}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Piano
        </Button>
      </div>

      {/* Empty State */}
      {(!plans || plans.length === 0) && (
        <Card className="bg-muted/50">
          <CardContent className="pt-12 pb-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nessun piano configurato</p>
            <p className="text-sm text-muted-foreground mt-1">Crea il tuo primo piano commerciale</p>
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700" onClick={handleNewPlan}>
              <Plus className="mr-2 h-4 w-4" />
              Crea Piano
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      {plans && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <Badge className={plan.status === "active" 
                    ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-600 border-amber-500/30"
                  }>
                    {plan.status === "active" ? "Attivo" : "Bozza"}
                  </Badge>
                </div>
                <CardDescription className="text-2xl font-bold text-foreground">
                  €{plan.price}/{plan.billing_cycle === "monthly" ? "mese" : "anno"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Limits */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Limiti</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-foreground">
                        {plan.max_users === -1 ? "∞" : plan.max_users}
                      </p>
                      <p className="text-xs text-muted-foreground">Utenti</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-foreground">
                        {plan.max_bank_accounts === -1 ? "∞" : plan.max_bank_accounts}
                      </p>
                      <p className="text-xs text-muted-foreground">Conti</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-foreground">
                        {plan.max_transactions_month === -1 ? "∞" : `${plan.max_transactions_month / 1000}k`}
                      </p>
                      <p className="text-xs text-muted-foreground">Trans./mese</p>
                    </div>
                  </div>
                  {plan.ai_features_enabled && (
                    <Badge className="bg-violet-500/20 text-violet-600 border-violet-500/30 mt-2">
                      AI Features Attive
                    </Badge>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Feature incluse</p>
                  <ul className="space-y-1">
                    {(plan.features || []).slice(0, 5).map((featureId) => {
                      const feature = allFeatures.find(f => f.id === featureId);
                      return feature ? (
                        <li key={featureId} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-emerald-500" />
                          {feature.label}
                        </li>
                      ) : null;
                    })}
                    {(plan.features || []).length > 5 && (
                      <li className="text-sm text-muted-foreground pl-6">
                        +{plan.features.length - 5} altre...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleCopyPlan(plan)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditPlan(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Plan Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isCreating ? "Nuovo Piano" : "Modifica Piano"}
            </SheetTitle>
            <SheetDescription>
              {isCreating ? "Crea un nuovo piano commerciale" : "Modifica i dettagli del piano"}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Informazioni Base</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Piano</Label>
                  <Input 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Es: Professional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prezzo (€)</Label>
                  <Input 
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ciclo Fatturazione</Label>
                  <Select value={formBillingCycle} onValueChange={setFormBillingCycle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensile</SelectItem>
                      <SelectItem value="yearly">Annuale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Stato</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Attivo</SelectItem>
                      <SelectItem value="draft">Bozza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Limiti</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <Label>Max Utenti</Label>
                    <Input 
                      type="number"
                      value={formMaxUsers}
                      onChange={(e) => setFormMaxUsers(Number(e.target.value))}
                      disabled={formUnlimitedUsers}
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-4 pt-6">
                    <Switch 
                      checked={formUnlimitedUsers}
                      onCheckedChange={setFormUnlimitedUsers}
                    />
                    <Label className="text-sm">Illimitati</Label>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <Label>Max Conti Bancari</Label>
                    <Input 
                      type="number"
                      value={formMaxBankAccounts}
                      onChange={(e) => setFormMaxBankAccounts(Number(e.target.value))}
                      disabled={formUnlimitedAccounts}
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-4 pt-6">
                    <Switch 
                      checked={formUnlimitedAccounts}
                      onCheckedChange={setFormUnlimitedAccounts}
                    />
                    <Label className="text-sm">Illimitati</Label>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <Label>Max Transazioni/Mese</Label>
                    <Input 
                      type="number"
                      value={formMaxTransactions}
                      onChange={(e) => setFormMaxTransactions(Number(e.target.value))}
                      disabled={formUnlimitedTransactions}
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-4 pt-6">
                    <Switch 
                      checked={formUnlimitedTransactions}
                      onCheckedChange={setFormUnlimitedTransactions}
                    />
                    <Label className="text-sm">Illimitate</Label>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                  <div>
                    <Label className="text-base">AI Features</Label>
                    <p className="text-sm text-muted-foreground">Abilita funzionalità AI avanzate</p>
                  </div>
                  <Switch 
                    checked={formAiEnabled}
                    onCheckedChange={setFormAiEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Feature Incluse</h4>
              <div className="grid grid-cols-2 gap-3">
                {allFeatures.map((feature) => (
                  <div 
                    key={feature.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox 
                      id={feature.id}
                      checked={formFeatures.includes(feature.id)}
                      onCheckedChange={() => toggleFeature(feature.id)}
                    />
                    <label 
                      htmlFor={feature.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditSheetOpen(false)}>
              Annulla
            </Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700" 
              onClick={handleSavePlan}
              disabled={createPlan.isPending || updatePlan.isPending}
            >
              {createPlan.isPending || updatePlan.isPending ? "Salvataggio..." : "Salva Piano"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
