import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Percent, FolderTree } from "lucide-react";
import { VatRatesManager } from "@/components/configurazione/VatRatesManager";
import { RevenueCentersManager } from "@/components/configurazione/RevenueCentersManager";
import { CostCategoriesManager } from "@/components/configurazione/CostCategoriesManager";
import { EmployeesManager } from "@/components/configurazione/EmployeesManager";

export default function Configurazione() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Configurazione Aziendale</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci categorie, aliquote IVA, centri di incasso e dipendenti
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue-centers" className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
          <TabsTrigger value="revenue-centers" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Centri Incasso</span>
          </TabsTrigger>
          <TabsTrigger value="cost-categories" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">Categorie Costi</span>
          </TabsTrigger>
          <TabsTrigger value="vat-rates" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Aliquote IVA</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Dipendenti</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue-centers" className="mt-6">
          <RevenueCentersManager />
        </TabsContent>

        <TabsContent value="cost-categories" className="mt-6">
          <CostCategoriesManager />
        </TabsContent>

        <TabsContent value="vat-rates" className="mt-6">
          <VatRatesManager />
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <EmployeesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
