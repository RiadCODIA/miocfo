import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring' as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24">
      <div className="relative pt-24 md:pt-36">
        <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,transparent_48%,hsl(var(--primary)/0.1)_100%)]" />

        <div className="mx-auto max-w-5xl px-6">
          <div className="sm:mx-auto lg:mr-auto lg:mt-0">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.1,
                    },
                  },
                },
                item: transitionVariants.item,
              }}
              className="flex flex-col items-center gap-6 text-center lg:gap-8"
            >
              <div className="rounded-full border border-border bg-muted px-4 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Gestione finanziaria per PMI
                </span>
              </div>

              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                Gestione Finanziaria{" "}
                <span className="text-primary">Intelligente</span>{" "}
                per la Tua Azienda
              </h1>

              <p className="max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
                Dì addio ai fogli Excel complicati. mioCFO ti offre una piattaforma 
                professionale per monitorare, analizzare e ottimizzare le finanze 
                della tua PMI in tempo reale.
              </p>

              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-6">
                  <Link to="/auth">
                    <span className="flex items-center gap-2">
                      Inizia Ora
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="rounded-full px-6"
                >
                  <a href="#funzionalita">
                    Scopri le funzionalità
                  </a>
                </Button>
              </div>
            </AnimatedGroup>
          </div>
        </div>

        {/* Dashboard Preview */}
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.3,
                },
              },
            },
            item: {
              hidden: {
                opacity: 0,
                y: 24,
                filter: 'blur(12px)',
              },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: {
                  type: 'spring' as const,
                  bounce: 0.3,
                  duration: 1.5,
                },
              },
            },
          }}
          className="mt-16 md:mt-24"
        >
          <div className="relative mx-auto max-w-5xl px-6">
            <div className="relative rounded-2xl border border-border/50 bg-background/80 p-2 shadow-2xl shadow-primary/5 backdrop-blur-sm md:rounded-3xl md:p-3">
              <div className="rounded-xl border border-border/30 bg-muted/30 p-4 md:rounded-2xl md:p-6">
                {/* Mock Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-400/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                    <div className="h-3 w-3 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-xs text-muted-foreground">Dashboard mioCFO</span>
                </div>

                {/* Mock KPI Cards */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                  <div className="rounded-lg bg-background p-3 md:p-4 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Saldo Totale</p>
                    <p className="text-lg md:text-xl font-semibold text-foreground">€125.430</p>
                    <p className="text-xs text-emerald-600 mt-1">+12.5%</p>
                  </div>
                  <div className="rounded-lg bg-background p-3 md:p-4 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Entrate Mese</p>
                    <p className="text-lg md:text-xl font-semibold text-foreground">€48.290</p>
                    <p className="text-xs text-emerald-600 mt-1">+8.3%</p>
                  </div>
                  <div className="rounded-lg bg-background p-3 md:p-4 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Margine</p>
                    <p className="text-lg md:text-xl font-semibold text-foreground">32.4%</p>
                    <p className="text-xs text-emerald-600 mt-1">+2.1%</p>
                  </div>
                </div>

                {/* Mock Chart */}
                <div className="rounded-lg bg-background p-4 border border-border/30 h-28 md:h-32 flex items-end justify-between gap-1.5">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/50 rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedGroup>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
