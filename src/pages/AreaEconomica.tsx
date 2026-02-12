import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContoEconomicoTab } from "@/components/area-economica/ContoEconomicoTab";
import { ScadenzarioTab } from "@/components/area-economica/ScadenzarioTab";
import { PrevisioniTab } from "@/components/area-economica/PrevisioniTab";

export default function AreaEconomica() {
  return (
    <div className="space-y-6">
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Area Economica</h1>
        <p className="text-muted-foreground mt-1">
          Gestione ricavi, costi, conto economico e scadenze clienti/fornitori
        </p>
      </div>

      <Tabs defaultValue="conto-economico" className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="conto-economico" className="text-xs uppercase font-semibold">
            Conto Economico
          </TabsTrigger>
          <TabsTrigger value="scadenzario" className="text-xs uppercase font-semibold">
            Scadenzario Clienti/Fornitori
          </TabsTrigger>
          <TabsTrigger value="previsioni" className="text-xs uppercase font-semibold">
            Previsioni
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conto-economico">
          <ContoEconomicoTab />
        </TabsContent>
        <TabsContent value="scadenzario">
          <ScadenzarioTab />
        </TabsContent>
        <TabsContent value="previsioni">
          <PrevisioniTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
