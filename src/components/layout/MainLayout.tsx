import { ReactNode, useState, createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AlertListener } from "@/components/AlertListener";
import { TopBar } from "./TopBar";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  useRealtimeSync();

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <DateRangeProvider>
        <div className="min-h-screen bg-background">
          <AlertListener />
          <Sidebar />
          <main className={`min-h-screen transition-all duration-300 pointer-events-auto ${collapsed ? "pl-16" : "pl-64"}`}>
            <div className="p-6 lg:p-8">
              <TopBar />
              <ErrorBoundary key={location.pathname}>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </DateRangeProvider>
    </SidebarContext.Provider>
  );
}
