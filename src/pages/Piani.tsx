import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Plus,
  Check,
  X,
  Edit,
  Copy
} from "lucide-react";

// Mock data
const plans = [
  {
    id: "1",
    name: "Starter",
    price: "€29/mese",
    status: "active",
    limits: { users: 5, accounts: 2, transactions: 1000 },
    features: ["Dashboard", "Transazioni", "Report Base"],
    subscribers: 45,
  },
  {
    id: "2",
    name: "Professional",
    price: "€99/mese",
    status: "active",
    limits: { users: 20, accounts: 10, transactions: 10000 },
    features: ["Dashboard", "Transazioni", "Cash Flow", "Budget", "Report Avanzati", "AI Categorization"],
    subscribers: 78,
  },
  {
    id: "3",
    name: "Enterprise",
    price: "€299/mese",
    status: "active",
    limits: { users: -1, accounts: -1, transactions: -1 },
    features: ["Tutto Professional", "API Access", "SSO", "Supporto Dedicato", "AI Forecast"],
    subscribers: 33,
  },
];

export default function Piani() {
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
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Piano
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                  {plan.status}
                </Badge>
              </div>
              <CardDescription className="text-2xl font-bold text-foreground">
                {plan.price}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Limits */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Limiti</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">
                      {plan.limits.users === -1 ? "∞" : plan.limits.users}
                    </p>
                    <p className="text-xs text-muted-foreground">Utenti</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">
                      {plan.limits.accounts === -1 ? "∞" : plan.limits.accounts}
                    </p>
                    <p className="text-xs text-muted-foreground">Conti</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">
                      {plan.limits.transactions === -1 ? "∞" : `${plan.limits.transactions / 1000}k`}
                    </p>
                    <p className="text-xs text-muted-foreground">Trans./mese</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Feature incluse</p>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscribers */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{plan.subscribers}</span> sottoscrittori
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}