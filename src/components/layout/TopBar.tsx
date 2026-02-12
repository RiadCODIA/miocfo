import { useState } from "react";
import { Building2, Calendar, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDateRange } from "@/contexts/DateRangeContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subMonths, startOfYear, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { label: "Oggi", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Ultimi 7 giorni", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Ultimi 30 giorni", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Mese corrente", getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Ultimo trimestre", getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: "Anno corrente", getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: "Ultimo anno", getValue: () => ({ from: subDays(new Date(), 365), to: new Date() }) },
] as const;

export function TopBar() {
  const { profile, user } = useAuth();
  const { dateRange, setDateRange, activeLabel, setActiveLabel } = useDateRange();
  const [open, setOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const hour = new Date().getHours();
  const greeting = hour < 13 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";

  const displayName = profile?.first_name
    ? profile.first_name
    : user?.email?.split("@")[0] || "Utente";

  const handlePresetSelect = (label: string, range: { from: Date; to: Date }) => {
    setActiveLabel(label);
    setCustomRange({});
    setDateRange(range);
    setOpen(false);
  };

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!customRange.from || customRange.to) {
      setCustomRange({ from: date });
    } else {
      const from = date < customRange.from ? date : customRange.from;
      const to = date < customRange.from ? customRange.from : date;
      setCustomRange({ from, to });
      const label = `${format(from, "dd/MM/yy")} – ${format(to, "dd/MM/yy")}`;
      setActiveLabel(label);
      setDateRange({ from, to });
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ecco la tua panoramica finanziaria
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 bg-card border-border hover:bg-secondary text-sm text-muted-foreground"
            >
              <Calendar className="h-4 w-4" />
              <span>{activeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex">
              <div className="border-r border-border p-2 space-y-0.5 min-w-[160px]">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handlePresetSelect(opt.label, opt.getValue())}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                      activeLabel === opt.label
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="border-t border-border my-1" />
                <p className="px-3 py-1 text-xs text-muted-foreground font-medium">
                  Personalizzato
                </p>
              </div>
              <div className="p-2">
                <CalendarComponent
                  mode="single"
                  selected={customRange.from}
                  onSelect={handleCustomDateSelect}
                  locale={it}
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(date) => date > new Date()}
                />
                {customRange.from && !customRange.to && (
                  <p className="text-xs text-muted-foreground text-center pb-2">
                    Seleziona la data di fine
                  </p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
          Trial
        </Badge>
      </div>
    </div>
  );
}
