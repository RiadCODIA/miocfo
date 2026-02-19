import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Percent, FolderTree, Settings2, Info } from "lucide-react";
import { VatRatesManager } from "@/components/configurazione/VatRatesManager";
import { RevenueCentersManager } from "@/components/configurazione/RevenueCentersManager";
import { CostCategoriesManager } from "@/components/configurazione/CostCategoriesManager";
import { EmployeesManager } from "@/components/configurazione/EmployeesManager";

const tabInfo: Record<string, string> = {
  "revenue-centers": "Definisci le fonti di ricavo della tua azienda. Vengono usati per classificare le entrate nei report e nei flussi di cassa.",
  "cost-categories": "Organizza le voci di spesa in categorie fisse e variabili. Servono per categorizzare le transazioni bancarie e generare analisi di spesa.",
  "vat-rates": "Configura le aliquote IVA applicabili. Vengono usate nella gestione delle fatture e nel calcolo automatico dell'IVA.",
  "employees": "Registra i dipendenti con il relativo costo aziendale. I dati vengono usati nel conto economico e nelle previsioni di cassa.",
};

export default function Configurazione() {
  const [activeTab, setActiveTab] = useState("revenue-centers");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Settings2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Configurazione Aziendale</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Imposta i dati di base che alimentano report, analisi e previsioni in tutto il sistema.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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

        {/* Contextual hint */}
        <div className="flex items-start gap-2.5 mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">{tabInfo[activeTab]}</p>
        </div>

        <TabsContent value="revenue-centers" className="mt-4">
          <RevenueCentersManager />
        </TabsContent>

        <TabsContent value="cost-categories" className="mt-4">
          <CostCategoriesManager />
        </TabsContent>

        <TabsContent value="vat-rates" className="mt-4">
          <VatRatesManager />
        </TabsContent>

        <TabsContent value="employees" className="mt-4">
          <EmployeesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
