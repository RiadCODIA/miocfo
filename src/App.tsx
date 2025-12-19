import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Transazioni from "./pages/Transazioni";
import ContiBancari from "./pages/ContiBancari";
import Fatture from "./pages/Fatture";
import FlussiCassa from "./pages/FlussiCassa";
import Marginalita from "./pages/Marginalita";
import BudgetPrevisioni from "./pages/BudgetPrevisioni";
import Scadenzario from "./pages/Scadenzario";
import KPIReport from "./pages/KPIReport";
import AlertNotifiche from "./pages/AlertNotifiche";
import Impostazioni from "./pages/Impostazioni";
import Configurazione from "./pages/Configurazione";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth route - no layout */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes with MainLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Index />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
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
              path="/marginalita"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Marginalita />
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
