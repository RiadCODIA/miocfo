import { useState } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check, UserPlus, Link2, LayoutDashboard, Phone } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Registrati in 30 secondi",
    description: "Crea il tuo account per la prova gratuita di 7 giorni. Non serve la carta di credito.",
  },
  {
    icon: Link2,
    title: "Collega le tue fonti",
    description: "Connetti in sicurezza le banche (via PSD2) e il tuo Cassetto Fiscale. La piattaforma importerà i dati per te.",
  },
  {
    icon: LayoutDashboard,
    title: "Ottieni la dashboard",
    description: "In pochi minuti, MioCFO analizza i tuoi dati e ti mostra la liquidità, le previsioni e i KPI fondamentali.",
  },
];

const plans = [
  {
    name: "Smart",
    description: "Per il monitoraggio essenziale della liquidità.",
    priceMonthly: 89,
    priceYearly: 69,
    popular: false,
    features: [
      "Dashboard con KPI finanziari",
      "Analisi dei flussi di cassa",
      "Categorizzazione automatica",
      "CFO Virtuale (AI) - Notifiche",
    ],
    cta: "Inizia la prova gratuita",
  },
  {
    name: "Pro",
    description: "Per integrare dati fiscali e pianificare il futuro.",
    priceMonthly: 189,
    priceYearly: 149,
    popular: true,
    includes: "Tutto del piano Smart",
    features: [
      "Dashboard personalizzabile con widget",
      "Algoritmo di Pianificazione (Previsione liquidità)",
      "Dashboard con KPI economici, fiscali e finanziari",
      "Accesso CFO Virtuale (AI) - Notifiche",
      "Reportistica avanzata",
    ],
    cta: "Inizia la prova gratuita",
  },
  {
    name: "Full",
    description: "Per il controllo totale della tua attività.",
    priceMonthly: 399,
    priceYearly: 329,
    popular: false,
    includes: "Tutto del piano Pro",
    features: [
      "Dashboard fino a 10 Widget",
      "Analisi marginalità prodotti",
      "Budget e previsioni avanzate",
      "Supporto prioritario dedicato",
    ],
    cta: "Inizia la prova gratuita",
  },
];

const allInclude = [
  "Connessione sicura PSD2",
  "Crittografia end-to-end",
  "Aggiornamenti automatici",
  "Nessun costo nascosto",
];

const checklistItems = [
  "Monitori incassi e pagamenti",
  "Tieni sotto controllo le scadenze",
  "Assegni nuove categorie ai movimenti",
  "Chiedi al CFO virtuale",
  "Prevedi la cassa e il punto di pareggio",
  "Pianifica quanto risparmiare ogni mese",
];

export default function PianiPricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Steps */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Inizia subito a controllare la tua azienda
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Bastano 3 semplici passi per attivare il tuo CFO virtuale e ottenere una visione chiara della tua liquidità.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto">
                    <step.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Un piano per ogni esigenza
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Tutti i piani iniziano con una prova gratuita di 7 giorni per farti sperimentare il massimo potenziale di MioCFO.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                  !isAnnual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Fatturazione Mensile
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                  isAnnual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Fatturazione Annuale
              </button>
            </div>
            {isAnnual && (
              <p className="text-xs text-success font-medium mt-2">
                Con la fatturazione annuale risparmi 2 mesi!
              </p>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.popular
                    ? "bg-primary text-primary-foreground border-2 border-primary shadow-lg shadow-primary/20"
                    : "bg-background border border-border/50"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-accent text-accent-foreground px-4 py-1 rounded-full">
                    PIÙ SCELTO
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    €{isAnnual ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {" "}/ mese
                  </span>
                </div>

                {plan.includes && (
                  <p className={`text-xs font-semibold mb-3 ${plan.popular ? "text-primary-foreground/80" : "text-primary"}`}>
                    {plan.includes}
                  </p>
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  className={`w-full rounded-full ${
                    plan.popular
                      ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link to="/auth?tab=register">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          {/* All plans include */}
          <div className="text-center mb-20">
            <h3 className="text-lg font-semibold text-foreground mb-6">Tutti i piani includono:</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {allInclude.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full"
                >
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-2xl border border-border/50 bg-background p-8 md:p-12 mb-20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-sm font-medium text-primary mb-2">Prova Gratis per 7 Giorni</p>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Sincronizza i tuoi conti e il cassetto fiscale
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Con MioCFO hai tutte le funzionalità per una gestione rapida, semplice ed efficiente in un unico posto.
                </p>
                <Button asChild className="rounded-full px-6">
                  <Link to="/auth?tab=register">
                    Inizia Gratis <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <ul className="space-y-3">
                {checklistItems.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Consulenza */}
          <div className="text-center rounded-2xl border border-border/50 bg-muted/30 p-8 md:p-12 mb-20">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Cerchi un supporto strategico su misura?
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed">
              Per le aziende che desiderano un partner strategico oltre al software, offriamo un 
              percorso di consulenza "On Top". Analizza i tuoi dati con un controller specialist 
              e un innovation manager del nostro team per definire un piano d'azione dettagliato.
            </p>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link to="/contatti">
                <Phone className="mr-2 h-4 w-4" />
                Richiedi una call
              </Link>
            </Button>
          </div>

          {/* Bottom CTA */}
          <div className="text-center rounded-3xl bg-primary p-10 md:p-14">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Il momento di prendere il controllo è adesso.
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Smetti di navigare a vista. Inizia la tua prova gratuita di 7 giorni.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-6"
            >
              <Link to="/auth?tab=register">
                Prova ora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
