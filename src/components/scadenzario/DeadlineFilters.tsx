import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeadlineFilters as FilterType } from "@/hooks/useDeadlines";

interface DeadlineFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export function DeadlineFilters({ filters, onFiltersChange }: DeadlineFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.status || "all"}
        onValueChange={(v) => onFiltersChange({ ...filters, status: v as FilterType["status"] })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Stato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti gli stati</SelectItem>
          <SelectItem value="pending">Pendenti</SelectItem>
          <SelectItem value="completed">Completate</SelectItem>
          <SelectItem value="overdue">Scadute</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.type || "all"}
        onValueChange={(v) => onFiltersChange({ ...filters, type: v as FilterType["type"] })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i tipi</SelectItem>
          <SelectItem value="incasso">Incassi</SelectItem>
          <SelectItem value="pagamento">Pagamenti</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
