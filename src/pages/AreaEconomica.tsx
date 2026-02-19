import { ContoEconomicoTab } from "@/components/area-economica/ContoEconomicoTab";

export default function AreaEconomica() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Area Economica</h1>
        <p className="text-muted-foreground mt-1">
          Conto economico basato su fatture emesse e ricevute
        </p>
      </div>

      <ContoEconomicoTab />
    </div>
  );
}
