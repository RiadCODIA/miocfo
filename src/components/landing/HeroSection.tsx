import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, TrendingUp, Wallet } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight mb-6">
              Gestione Finanziaria{" "}
              <span className="text-primary">Intelligente</span>{" "}
              per la Tua Azienda
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Dì addio ai fogli Excel complicati. Finexa ti offre una piattaforma 
              professionale per monitorare, analizzare e ottimizzare le finanze 
              della tua PMI in tempo reale.
            </p>
            <div className="flex justify-center lg:justify-start">
              <Button
                size="lg"
                asChild
                className="text-base px-6 rounded-full"
              >
                <Link to="/auth">
                  Inizia Ora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative">
            <div className="bg-background border border-border/50 rounded-2xl p-6 shadow-sm">
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-medium text-foreground">Dashboard</h3>
                <span className="text-xs text-muted-foreground">Oggi</span>
              </div>
              
              {/* Mock KPI Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Saldo</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">€125.430</p>
                  <p className="text-xs text-emerald-600">+12.5%</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Entrate</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">€48.290</p>
                  <p className="text-xs text-emerald-600">+8.3%</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">Margine</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">32.4%</p>
                  <p className="text-xs text-emerald-600">+2.1%</p>
                </div>
              </div>

              {/* Mock Chart */}
              <div className="bg-muted/30 rounded-lg p-4 h-28 flex items-end justify-between gap-1.5">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/60 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
