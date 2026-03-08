import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import PianiPricing from "./pages/PianiPricing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Transazioni from "./pages/Transazioni";
import ContiBancari from "./pages/ContiBancari";
import Fatture from "./pages/Fatture";
import FlussiCassa from "./pages/FlussiCassa";

import BudgetPrevisioni from "./pages/BudgetPrevisioni";
import Scadenzario from "./pages/Scadenzario";
import KPIReport from "./pages/KPIReport";
import AlertNotifiche from "./pages/AlertNotifiche";
import Impostazioni from "./pages/Impostazioni";
import Configurazione from "./pages/Configurazione";
import Collegamenti from "./pages/Collegamenti";
import Comunicazioni from "./pages/Comunicazioni";
import AIAssistant from "./pages/AIAssistant";
import AreaEconomica from "./pages/AreaEconomica";
import NotFound from "./pages/NotFound";
// Admin pages
import Clienti from "./pages/Clienti";
import KpiClienti from "./pages/KpiClienti";
import FlussiClienti from "./pages/FlussiClienti";
// Super Admin pages
import DashboardSuperAdmin from "./pages/DashboardSuperAdmin";
import UtentiGlobali from "./pages/UtentiGlobali";
import Piani from "./pages/Piani";
import Fatturazione from "./pages/Fatturazione";
import KPIInterni from "./pages/KPIInterni";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      // Keep previous data while refetching to avoid white flashes
      placeholderData: (prev: unknown) => prev,
    },
  },
});

// Component to handle conditional dashboard rendering
function DashboardRouter() {
  const { userRole } = useAuth();
  
  if (userRole === 'super_admin') return <DashboardSuperAdmin />;
  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Landing page - root */}
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<PianiPricing />} />
            
            {/* Auth route - no layout */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Legal pages - public */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            
            {/* Protected routes with MainLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardRouter />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin-only routes */}
            <Route
              path="/clienti"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Clienti />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpi-clienti"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <KpiClienti />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/flussi-clienti"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FlussiClienti />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Super Admin routes */}
            <Route
              path="/utenti-globali"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <UtentiGlobali />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/piani"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Piani />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fatturazione"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Fatturazione />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpi-interni"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <KPIInterni />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* User routes */}
            <Route
              path="/transazioni"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Transazioni />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/conti-bancari"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ContiBancari />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fatture"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Fatture />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/flussi-cassa"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FlussiCassa />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <BudgetPrevisioni />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scadenzario"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Scadenzario />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpi-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <KPIReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alert"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AlertNotifiche />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/impostazioni"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Impostazioni />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configurazione"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Configurazione />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/collegamenti"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Collegamenti />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comunicazioni"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Comunicazioni />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AIAssistant />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/area-economica"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AreaEconomica />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
