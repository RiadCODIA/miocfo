import { createContext, useContext, useState, ReactNode } from "react";
import { subDays } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  activeLabel: string;
  setActiveLabel: (label: string) => void;
}

const DateRangeContext = createContext<DateRangeContextType>({
  dateRange: { from: subDays(new Date(), 30), to: new Date() },
  setDateRange: () => {},
  activeLabel: "Ultimi 30 giorni",
  setActiveLabel: () => {},
});

export const useDateRange = () => useContext(DateRangeContext);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeLabel, setActiveLabel] = useState("Ultimi 30 giorni");

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, activeLabel, setActiveLabel }}>
      {children}
    </DateRangeContext.Provider>
  );
}
