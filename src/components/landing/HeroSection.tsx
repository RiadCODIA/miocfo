import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, TrendingUp, Wallet } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background decorations - minimal */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Gestione Finanziaria{" "}
              <span className="text-gradient">Intelligente</span>{" "}
              per la Tua Azienda
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Dì addio ai fogli Excel complicati. Finexa ti offre una piattaforma 
              professionale per monitorare, analizzare e ottimizzare le finanze 
              della tua PMI in tempo reale.
            </p>
            <div className="flex justify-center lg:justify-start">
              <Button
                size="lg"
                asChild
                className="text-lg px-8"
              >
                <Link to="/auth">
                  Inizia Ora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="glass rounded-2xl p-6 shadow-2xl glow">
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Dashboard</h3>
                <span className="text-sm text-muted-foreground">Oggi</span>
              </div>
              
              {/* Mock KPI Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-background/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Saldo</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">€125.430</p>
                  <p className="text-xs text-success">+12.5%</p>
                </div>
                <div className="bg-background/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-xs text-muted-foreground">Entrate</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">€48.290</p>
                  <p className="text-xs text-success">+8.3%</p>
                </div>
                <div className="bg-background/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    <span className="text-xs text-muted-foreground">Margine</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">32.4%</p>
                  <p className="text-xs text-success">+2.1%</p>
                </div>
              </div>

              {/* Mock Chart */}
              <div className="bg-background/60 rounded-lg p-4 h-32 flex items-end justify-between gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t opacity-80"
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
