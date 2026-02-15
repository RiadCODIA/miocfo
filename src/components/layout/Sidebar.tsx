import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  CalendarRange,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Landmark,
  FileText,
  Cog,
  LogOut,
  Users,
  CreditCard,
  Receipt,
  LineChart,
  Link2,
  Bot,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import miocfoLogo from "@/assets/miocfo-logo.png";
import miocfoLogoIcon from "@/assets/miocfo-logo-icon.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useSidebarState } from "./MainLayout";
import { useActiveAlertsCount } from "@/hooks/useAlerts";
import { useState } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

interface NavSubGroup {
  label: string;
  items: NavItem[];
}

interface NavGroup {
  label: string;
  collapsible?: boolean;
  items?: NavItem[];
  subGroups?: NavSubGroup[];
}

const userNavGroups: NavGroup[] = [
  {
    label: "NAVIGAZIONE",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { id: "collegamenti", label: "Collegamenti", icon: Link2, path: "/collegamenti" },
      { id: "conti_bancari", label: "Conti & Transazioni", icon: Landmark, path: "/conti-bancari" },
    ],
  },
  {
    label: "GESTIONE BUSINESS",
    collapsible: false,
    subGroups: [
      {
        label: "Area finanziaria",
        items: [
          { id: "fatture", label: "Fatture", icon: FileText, path: "/fatture" },
          { id: "flussi_cassa", label: "Flussi di Cassa", icon: TrendingUp, path: "/flussi-cassa" },
          { id: "scadenzario", label: "Scadenzario", icon: Calendar, path: "/scadenzario" },
        ],
      },
      {
        label: "Area economica",
        items: [
          { id: "conto_economico", label: "Conto Economico", icon: Receipt, path: "/area-economica" },
          { id: "budget_previsioni", label: "Budget & Previsioni", icon: CalendarRange, path: "/budget" },
          { id: "transazioni", label: "Movimenti", icon: ArrowLeftRight, path: "/transazioni" },
        ],
      },
    ],
  },
  {
    label: "ANALYTICS & AI",
    items: [
      { id: "kpi_report", label: "Dati & Statistiche", icon: BarChart3, path: "/kpi-report" },
      { id: "alert_notifiche", label: "Notifiche", icon: Bell, path: "/alert" },
      { id: "ai_assistant", label: "AI Assistant", icon: Bot, path: "/ai-assistant", badge: "New" },
    ],
  },
];

const superAdminNavGroups: NavGroup[] = [
  {
    label: "SISTEMA",
    items: [
      { id: "system_dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { id: "global_users", label: "Utenti", icon: Users, path: "/utenti-globali" },
      { id: "plans_limits", label: "Piani", icon: CreditCard, path: "/piani" },
      { id: "fatturazione", label: "Fatturazione", icon: Receipt, path: "/fatturazione" },
      { id: "kpi_interni", label: "KPI Interni", icon: LineChart, path: "/kpi-interni" },
    ],
  },
];

function NavItemRow({ item, collapsed, isActive, alertsCount }: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  alertsCount?: { total: number } | null;
}) {
  const isAlertItem = item.id === "alert_notifiche";
  const showAlertBadge = isAlertItem && alertsCount && alertsCount.total > 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={item.path}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
            isActive
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white/90"
          )}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-sidebar-primary" />
          )}
          <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-sidebar-primary")} />
          {!collapsed && (
            <span className="text-sm font-medium truncate">{item.label}</span>
          )}
          {/* Alert count badge */}
          {showAlertBadge && (
            <span className={cn(
              "flex items-center justify-center text-xs font-bold text-white rounded-full bg-destructive",
              collapsed ? "absolute -top-1 -right-1 h-5 w-5" : "ml-auto h-5 min-w-5 px-1.5"
            )}>
              {alertsCount!.total > 99 ? "99+" : alertsCount!.total}
            </span>
          )}
          {/* Feature badge (e.g. "New") */}
          {item.badge && !showAlertBadge && !collapsed && (
            <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-sidebar-primary text-white border-0">
              {item.badge}
            </Badge>
          )}
        </NavLink>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right">
          <p>{item.label}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebarState();
  const location = useLocation();
  const { user, profile, signOut, userRole } = useAuth();
  const { data: alertsCount } = useActiveAlertsCount();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isSuperAdmin = userRole === 'super_admin';
  const navGroups = isSuperAdmin ? superAdminNavGroups : userNavGroups;

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return "UN";
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email?.split("@")[0] || "Utente";
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      style={{ background: "linear-gradient(180deg, hsl(var(--sidebar-background)), hsl(230 30% 12%))" }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src={collapsed ? miocfoLogoIcon : miocfoLogo}
              alt="mioCFO"
              className={cn(
                "object-contain transition-all duration-300 brightness-0 invert",
                collapsed ? "h-14 w-14" : "h-8 w-auto max-w-[140px]"
              )}
            />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-5 overflow-y-auto">
          {navGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.label];
            return (
              <div key={group.label}>
                {!collapsed && (
                  <div
                    className={cn(
                      "px-3 mb-2 flex items-center justify-between",
                      group.collapsible && "cursor-pointer"
                    )}
                    onClick={() => group.collapsible && toggleGroup(group.label)}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                      {group.label}
                    </span>
                    {group.collapsible && (
                      isGroupCollapsed
                        ? <ChevronDown className="h-3 w-3 text-white/40" />
                        : <ChevronUp className="h-3 w-3 text-white/40" />
                    )}
                  </div>
                )}
                {(!group.collapsible || !isGroupCollapsed) && (
                  <div className="space-y-0.5">
                    {/* Flat items */}
                    {group.items?.map((item) => (
                      <NavItemRow
                        key={item.id}
                        item={item}
                        collapsed={collapsed}
                        isActive={location.pathname === item.path}
                        alertsCount={alertsCount}
                      />
                    ))}
                    {/* Sub-groups */}
                    {group.subGroups?.map((sub) => (
                      <div key={sub.label}>
                        {!collapsed && (
                          <p className="px-3 mt-3 mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
                            {sub.label}
                          </p>
                        )}
                        {sub.items.map((item) => (
                          <NavItemRow
                            key={item.id}
                            item={item}
                            collapsed={collapsed}
                            isActive={location.pathname === item.path}
                            alertsCount={alertsCount}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 pb-2 space-y-0.5">
          <NavItemRow
            item={{ id: "configurazione", label: "Configurazione", icon: Cog, path: "/configurazione" }}
            collapsed={collapsed}
            isActive={location.pathname === "/configurazione"}
          />
          <NavItemRow
            item={{ id: "impostazioni", label: "Impostazioni", icon: Settings, path: "/impostazioni" }}
            collapsed={collapsed}
            isActive={location.pathname === "/impostazioni"}
          />
        </div>

        {/* User section */}
        <div className="p-3 border-t border-white/10">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/30 flex items-center justify-center text-white font-medium text-xs shrink-0">
              {getInitials()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{getDisplayName()}</p>
              </div>
            )}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut()}
                    className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Esci</p></TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-white/5 shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
