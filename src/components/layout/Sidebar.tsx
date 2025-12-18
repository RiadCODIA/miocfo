import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  PieChart,
  CalendarRange,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import finexaLogo from "@/assets/finexa-logo.png";

const sidebarSections = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "transazioni", label: "Transazioni", icon: ArrowLeftRight, path: "/transazioni" },
  { id: "flussi_cassa", label: "Flussi di Cassa", icon: TrendingUp, path: "/flussi-cassa" },
  { id: "marginalita", label: "Marginalità", icon: PieChart, path: "/marginalita" },
  { id: "budget_previsioni", label: "Budget & Previsioni", icon: CalendarRange, path: "/budget" },
  { id: "scadenzario", label: "Scadenzario", icon: Calendar, path: "/scadenzario" },
  { id: "kpi_report", label: "KPI & Report", icon: BarChart3, path: "/kpi-report" },
  { id: "alert_notifiche", label: "Alert & Notifiche", icon: Bell, path: "/alert" },
  { id: "impostazioni_personali", label: "Impostazioni", icon: Settings, path: "/impostazioni" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <img 
              src={finexaLogo} 
              alt="Finexa" 
              className={cn(
                "h-8 object-contain transition-all duration-300",
                collapsed ? "w-8" : "w-auto max-w-[140px]"
              )}
            />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {sidebarSections.map((section, index) => {
            const isActive = location.pathname === section.path;
            return (
              <NavLink
                key={section.id}
                to={section.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <section.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{section.label}</span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-medium text-sm">
              UN
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Utente Normale</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">utente@azienda.it</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
