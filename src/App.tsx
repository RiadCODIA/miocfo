import { Toaster } from "@/components/ui/toaster";
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
import NotFound from "./pages/NotFound";
// Admin pages
import DashboardAdmin from "./pages/DashboardAdmin";
import Clienti from "./pages/Clienti";
import KpiClienti from "./pages/KpiClienti";
import FlussiClienti from "./pages/FlussiClienti";
// Super Admin pages
import DashboardSuperAdmin from "./pages/DashboardSuperAdmin";
import Aziende from "./pages/Aziende";
import UtentiGlobali from "./pages/UtentiGlobali";
import Piani from "./pages/Piani";
import Integrazioni from "./pages/Integrazioni";
import MonitoraggioLog from "./pages/MonitoraggioLog";
import SicurezzaCompliance from "./pages/SicurezzaCompliance";
import ConfigurazioniGlobali from "./pages/ConfigurazioniGlobali";

const queryClient = new QueryClient();

// Component to handle conditional dashboard rendering
function DashboardRouter() {
  const { demoRole } = useAuth();
  
  if (demoRole === 'super_admin') return <DashboardSuperAdmin />;
  if (demoRole === 'admin_aziendale') return <DashboardAdmin />;
  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Landing page - public */}
            <Route path="/landing" element={<Landing />} />
            
            {/* Auth route - no layout */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Legal pages - public */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            
            {/* Protected routes with MainLayout */}
            <Route
              path="/"
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
              path="/aziende"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Aziende />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
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
              path="/integrazioni"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Integrazioni />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/log"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MonitoraggioLog />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sicurezza"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SicurezzaCompliance />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configurazioni"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ConfigurazioniGlobali />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
