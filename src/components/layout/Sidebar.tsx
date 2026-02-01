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
} from "lucide-react";
import { cn } from "@/lib/utils";
import finexaLogo from "@/assets/finexa-logo.png";
import finexaLogoIcon from "@/assets/finexa-logo-icon.png";
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

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
}

// Sidebar sections for regular users (clients)
const userSidebarSections: SidebarSection[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "transazioni", label: "Transazioni", icon: ArrowLeftRight, path: "/transazioni" },
  { id: "conti_bancari", label: "Conti Bancari", icon: Landmark, path: "/conti-bancari" },
  { id: "fatture", label: "Fatture", icon: FileText, path: "/fatture" },
  { id: "flussi_cassa", label: "Flussi di Cassa", icon: TrendingUp, path: "/flussi-cassa" },
  { id: "budget_previsioni", label: "Budget & Previsioni", icon: CalendarRange, path: "/budget" },
  { id: "scadenzario", label: "Scadenzario", icon: Calendar, path: "/scadenzario" },
  { id: "kpi_report", label: "KPI & Report", icon: BarChart3, path: "/kpi-report" },
  { id: "alert_notifiche", label: "Alert & Notifiche", icon: Bell, path: "/alert" },
  { id: "configurazione", label: "Configurazione", icon: Cog, path: "/configurazione" },
  { id: "impostazioni_personali", label: "Impostazioni", icon: Settings, path: "/impostazioni" },
];

// Sidebar sections for admin_aziendale (completely different)
const adminSidebarSections: SidebarSection[] = [
  { id: "dashboard_admin", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "clienti", label: "I Miei Clienti", icon: Users, path: "/clienti" },
  { id: "kpi_clienti", label: "KPI per Cliente", icon: BarChart3, path: "/kpi-clienti" },
  { id: "flussi_clienti", label: "Flussi di Cassa", icon: TrendingUp, path: "/flussi-clienti" },
  { id: "alert_notifiche", label: "Alert & Notifiche", icon: Bell, path: "/alert" },
];

// Sidebar sections for super_admin (platform administration)
const superAdminSidebarSections: SidebarSection[] = [
  { id: "system_dashboard", label: "Dashboard di Sistema", icon: LayoutDashboard, path: "/" },
  { id: "global_users", label: "Utenti", icon: Users, path: "/utenti-globali" },
  { id: "plans_limits", label: "Piani", icon: CreditCard, path: "/piani" },
  { id: "fatturazione", label: "Fatturazione", icon: Receipt, path: "/fatturazione" },
  { id: "kpi_interni", label: "KPI Interni", icon: LineChart, path: "/kpi-interni" },
  { id: "impostazioni_admin", label: "Impostazioni", icon: Settings, path: "/impostazioni" },
];

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebarState();
  const location = useLocation();
  const { user, profile, signOut, demoRole, isDemoMode } = useAuth();
  const { data: alertsCount } = useActiveAlertsCount();

  const isAdmin = demoRole === 'admin_aziendale';
  const isSuperAdmin = demoRole === 'super_admin';

  // Completely different sidebar based on role
  const sidebarSections: SidebarSection[] = isSuperAdmin
    ? superAdminSidebarSections
    : isAdmin 
      ? adminSidebarSections 
      : userSidebarSections;

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "UN";
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email?.split("@")[0] || "Utente";
  };

  const getDisplayEmail = () => {
    if (isDemoMode && demoRole) {
      if (demoRole === 'super_admin') return 'Super Amministratore';
      if (demoRole === 'admin_aziendale') return 'Consulente';
      return 'Utente Standard';
    }
    return user?.email || "";
  };

  const handleSignOut = async () => {
    await signOut();
  };

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
              src={collapsed ? finexaLogoIcon : finexaLogo} 
              alt="Finexa" 
              className={cn(
                "object-contain transition-all duration-300",
                collapsed ? "h-14 w-14" : "h-8 w-auto max-w-[140px]"
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

        {/* Role Badge */}
        {isDemoMode && !collapsed && (
          <div className="px-4 py-2 border-b border-sidebar-border">
            <Badge 
              variant={isSuperAdmin ? "default" : isAdmin ? "default" : "secondary"} 
              className={cn(
                "w-full justify-center text-xs",
                isSuperAdmin && "bg-violet-500/20 text-violet-600 border-violet-500/30",
                isAdmin && !isSuperAdmin && "bg-amber-500/20 text-amber-600 border-amber-500/30"
              )}
            >
              {isSuperAdmin ? "👑 Super Admin" : isAdmin ? "🛡️ Consulente" : "👤 Utente Demo"}
            </Badge>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {sidebarSections.map((section, index) => {
            const isActive = location.pathname === section.path;
            const isAlertSection = section.id === "alert_notifiche";
            const showAlertBadge = isAlertSection && alertsCount && alertsCount.total > 0;
            
            return (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={section.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      section.adminOnly && "border-l-2 border-amber-500/50"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <section.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">{section.label}</span>
                    )}
                    {/* Alert badge */}
                    {showAlertBadge && (
                      <span className={cn(
                        "flex items-center justify-center text-xs font-bold text-white rounded-full",
                        alertsCount.highPriority > 0 ? "bg-destructive" : "bg-amber-500",
                        collapsed ? "absolute -top-1 -right-1 h-5 w-5" : "ml-auto h-5 min-w-5 px-1.5"
                      )}>
                        {alertsCount.total > 99 ? "99+" : alertsCount.total}
                      </span>
                    )}
                    {isActive && !collapsed && !showAlertBadge && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                    )}
                  </NavLink>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>{section.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm shrink-0",
              isSuperAdmin 
                ? "bg-gradient-to-br from-violet-500 to-violet-600"
                : isAdmin 
                  ? "bg-gradient-to-br from-amber-500 to-amber-600" 
                  : "bg-gradient-to-br from-primary to-primary/60"
            )}>
              {getInitials()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{getDisplayName()}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{getDisplayEmail()}</p>
              </div>
            )}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="h-8 w-8 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Esci</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 shrink-0"
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
