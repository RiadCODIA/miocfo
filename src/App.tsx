import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
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
        <MainLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/transazioni" element={<Transazioni />} />
            <Route path="/conti-bancari" element={<ContiBancari />} />
            <Route path="/fatture" element={<Fatture />} />
            <Route path="/flussi-cassa" element={<FlussiCassa />} />
            <Route path="/marginalita" element={<Marginalita />} />
            <Route path="/budget" element={<BudgetPrevisioni />} />
            <Route path="/scadenzario" element={<Scadenzario />} />
            <Route path="/kpi-report" element={<KPIReport />} />
            <Route path="/alert" element={<AlertNotifiche />} />
            <Route path="/impostazioni" element={<Impostazioni />} />
            <Route path="/configurazione" element={<Configurazione />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
