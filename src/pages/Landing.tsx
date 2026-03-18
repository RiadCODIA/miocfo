import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, FileSpreadsheet, AlertCircle, Unlink, HelpCircle, Building2, LineChart, Gauge, Linkedin, Instagram, Facebook, LayoutDashboard, Bot, Link2, Eye, Smartphone, Check, X, UserPlus, Phone, Mail, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import miocfoLogo from "@/assets/miocfo-logo-blue.png";
import { HeroSection } from "@/components/landing/HeroSection";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { PaymentMethodModal } from "@/components/payment/PaymentMethodModal";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

// ─── Pricing Data ─────────────────────────────────────────
const pricingSteps = [
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
    name: "Small",
    description: "Analisi dati bancari con upload e connessione Home Banking.",
    priceMonthly: 49,
    priceYearly: 41,
    popular: false,
    features: ["Dashboard con KPI finanziari", "Flussi di Cassa", "Transazioni con categorizzazione", "Conti correnti (upload + API)", "Connessione Home Banking PSD2", "AI: 50 messaggi Assistant + 3 analisi / mese"],
    notIncluded: ["Conto Economico", "Fatture e Scadenzario", "Budget & Previsioni", "AI Assistant"],
    cta: "Inizia con Small",
  },
  {
    name: "Pro",
    description: "Analisi completa: dati bancari, fatture e conto economico.",
    priceMonthly: 79,
    priceYearly: 66,
    popular: true,
    includes: "Tutto del piano Small",
    features: ["Conto Economico completo", "Gestione Fatture", "Scadenzario", "Collegamenti completi (Banche + Cassetto Fiscale)", "AI: 60 messaggi Assistant + 3 analisi / mese"],
    notIncluded: ["Budget & Previsioni", "AI Assistant"],
    cta: "Inizia con Pro",
  },
  {
    name: "Full",
    description: "Controllo totale della tua attività con AI integrata.",
    priceMonthly: 199,
    priceYearly: 166,
    popular: false,
    includes: "Tutto del piano Pro",
    features: ["Budget & Previsioni avanzate", "AI Assistant integrato", "Analisi e report con AI", "KPI Report avanzati", "Alert e Notifiche intelligenti", "AI: 100 messaggi Assistant + 5 analisi / mese"],
    notIncluded: [],
    cta: "Inizia con Full",
  },
];

const allInclude = ["Connessione sicura PSD2", "Crittografia end-to-end", "Aggiornamento automatico", "Analisi AI in tempo reale"];

// ─── FAQ Data ─────────────────────────────────────────────
const faqCategories = [
  {
    title: "Generali e Prova Gratuita",
    items: [
      { q: "Cos'è MioCFO?", a: "MioCFO è una piattaforma di gestione finanziaria progettata per le PMI italiane. Ti permette di collegare conti bancari e cassetto fiscale per avere una visione completa e in tempo reale delle finanze aziendali." },
      { q: "Devo inserire la carta di credito per la prova gratuita?", a: "No, la prova gratuita di 7 giorni non richiede alcuna carta di credito. Puoi esplorare tutte le funzionalità del piano Full senza alcun impegno." },
      { q: "Cosa succede alla fine della prova gratuita?", a: "Alla scadenza dei 7 giorni, potrai scegliere il piano più adatto alle tue esigenze. Se decidi di non proseguire, il tuo account rimarrà attivo in modalità base." },
    ],
  },
  {
    title: "Funzionamento e Connessioni",
    items: [
      { q: "Come collego i miei conti bancari?", a: "MioCFO utilizza la tecnologia PSD2 per connettersi in sicurezza ai tuoi conti bancari. Basta selezionare la tua banca, autenticarti e i dati verranno sincronizzati automaticamente." },
      { q: "Posso collegare il Cassetto Fiscale?", a: "Sì, MioCFO si integra direttamente con il Cassetto Fiscale dell'Agenzia delle Entrate per importare automaticamente le tue fatture elettroniche." },
    ],
  },
  {
    title: "Sicurezza dei Dati",
    items: [
      { q: "I miei dati sono al sicuro?", a: "Assolutamente sì. Utilizziamo crittografia end-to-end e standard bancari di sicurezza. I dati sono ospitati su server europei conformi al GDPR. Non abbiamo mai accesso alle tue credenziali bancarie." },
      { q: "MioCFO può effettuare operazioni sul mio conto?", a: "No, MioCFO ha accesso esclusivamente in lettura ai tuoi dati bancari tramite PSD2. Non può effettuare alcun pagamento o movimento sul tuo conto." },
    ],
  },
];

export default function Landing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; planName: string; planId?: string; price: number } | null>(null);
  const { user } = useAuth();
  const { data: dbPlans } = useSubscriptionPlans();

  const getPlanId = (planName: string) => {
    return dbPlans?.find((p) => p.name.toLowerCase() === planName.toLowerCase())?.id;
  };

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (!user) return;
    setPaymentModal({
      open: true,
      planName: plan.name,
      planId: getPlanId(plan.name),
      price: isAnnual ? plan.priceYearly * 12 : plan.priceMonthly,
    });
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => {
      toast.success("Messaggio inviato con successo! Ti risponderemo al più presto.");
      (e.target as HTMLFormElement).reset();
      setContactLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* ═══════════════════════════════════════════════════
          PROBLEMS SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              I problemi di oggi
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Stanco di navigare a vista?
            </h2>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <ProblemCard icon={<FileSpreadsheet className="h-8 w-8" />} title="File Excel infiniti" description="Ore perse ogni settimana per aggiornare manualmente fogli di calcolo complessi." delay={0} />
            <ProblemCard icon={<AlertCircle className="h-8 w-8" />} title="Sorprese sul conto" description="Scarsa visibilità sulla liquidità futura, con il rischio di scoprirlo troppo tardi." delay={0.1} />
            <ProblemCard icon={<Unlink className="h-8 w-8" />} title="Dati scollegati" description="Fatture, banche e bilanci parlano lingue diverse. Impossibile avere una visione d'insieme." delay={0.2} />
            <ProblemCard icon={<HelpCircle className="h-8 w-8" />} title="Decisioni a sensazione" description="Prendere decisioni strategiche basandosi sull'intuito invece che su dati certi." delay={0.3} />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CHI SIAMO SECTION
          ═══════════════════════════════════════════════════ */}
      <section id="chi-siamo" className="py-20 md:py-32 relative overflow-hidden bg-muted/20 scroll-mt-20">
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Chi Siamo
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Il team dietro MioCFO
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Siamo un team di controller ed esperti di finanza d'azienda. Abbiamo creato MioCFO perché crediamo che ogni imprenditore meriti di guidare la propria azienda con dati chiari, senza la complessità dei vecchi gestionali.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 mb-16"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Chiarezza al Primo Sguardo</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dashboard intuitive che trasformano numeri complessi in informazioni comprensibili. Niente tecnicismi, solo dati che parlano chiaro.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Tecnologia Accessibile</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Strumenti professionali senza bisogno di corsi o manuali. Bastano 5 minuti per iniziare, la tecnologia fa il resto.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              MioCFO non nasce in un garage da soli sviluppatori. Nasce dall'unione di professionisti del controllo di gestione e innovation manager. Persone che hanno passato la carriera dentro le PMI, analizzando bilanci, costruendo piani finanziari e affiancando imprenditori nelle loro scelte strategiche.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PROCESS / SOLUTION SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              La soluzione
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              MioCFO è il tuo co-pilota
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tre semplici passi per avere il controllo totale della tua finanza aziendale
            </p>
          </motion.div>
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary to-primary/50 hidden md:block" />
            <div className="space-y-16 md:space-y-24">
              <ProcessStep number="1" title="Collega le tue fonti" description="Connetti in sicurezza le tue banche (PSD2) e il tuo Cassetto Fiscale. MioCFO fa il resto." icon={<Building2 className="h-8 w-8" />} side="left" />
              <ProcessStep number="2" title="Visualizza la tua liquidità" description="Accedi a una dashboard unificata. Guarda entrate, uscite, saldi aggregati. Tutto in un unico posto." icon={<Gauge className="h-8 w-8" />} side="right" />
              <ProcessStep number="3" title="Anticipa il futuro" description="Grazie all'IA, incrociamo le scadenze delle fatture con i costi ricorrenti per mostrarti la previsione di cassa." icon={<LineChart className="h-8 w-8" />} side="left" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Funzionalità
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Progettato per chi guida l'azienda
            </h2>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <FeatureCard icon={<LayoutDashboard className="h-12 w-12" />} badge="Piano Full" title="Dashboard Personalizzabile" description="Crea la tua plancia di comando. Scegli fino a 10 KPI (widget) per monitorare solo ciò che conta davvero per te, dai flussi di cassa ai dati di bilancio." delay={0} />
            <FeatureCard icon={<Bot className="h-12 w-12" />} badge="AI Powered" title="Il CFO Virtuale" description="Non guardare solo i dati, ascoltali. MioCFO ti invia notifiche proattive e suggerimenti su scadenze critiche, trend inaspettati o aree di miglioramento." delay={0.1} />
            <FeatureCard icon={<Link2 className="h-12 w-12" />} title="Analisi Integrata" description="Smetti di saltare da un portale all'altro. Collega conti correnti e fatturazione elettronica per un'analisi completa." tags={["Banche PSD2", "Cassetto Fiscale", "Fatture Elettroniche"]} delay={0.2} />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PIANI / PRICING SECTION
          ═══════════════════════════════════════════════════ */}
      <section id="piani" className="py-20 md:py-32 relative overflow-hidden scroll-mt-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Steps */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Come iniziare
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Inizia subito a controllare la tua azienda
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Bastano 3 semplici passi per attivare il tuo CFO virtuale e ottenere una visione chiara della tua liquidità.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-24 max-w-4xl mx-auto">
            {pricingSteps.map((step, i) => (
              <motion.div
                key={step.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
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
              </motion.div>
            ))}
          </div>

          {/* Pricing Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Un piano per ogni esigenza
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Tutti i piani iniziano con una prova gratuita di 7 giorni per farti sperimentare il massimo potenziale di MioCFO.
            </p>
            <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${!isAnnual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                Fatturazione Mensile
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${isAnnual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                Fatturazione Annuale
              </button>
            </div>
            {isAnnual && (
              <p className="text-xs text-success font-medium mt-2">
                Con la fatturazione annuale risparmi 2 mesi!
              </p>
            )}
          </motion.div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-20 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl p-8 flex flex-col ${plan.popular ? "bg-primary text-primary-foreground border-2 border-primary shadow-lg shadow-primary/20" : "bg-background border border-border/50"}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-accent text-accent-foreground px-4 py-1 rounded-full">
                    PIÙ SCELTO
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">€{isAnnual ? plan.priceYearly : plan.priceMonthly}</span>
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}> / mese</span>
                </div>
                {plan.includes && (
                  <p className={`text-xs font-semibold mb-3 ${plan.popular ? "text-primary-foreground/80" : "text-primary"}`}>{plan.includes}</p>
                )}
                <ul className="space-y-3 mb-4 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.notIncluded.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {plan.notIncluded.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm opacity-40">
                        <X className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {user ? (
                  <Button size="lg" className={`w-full rounded-full ${plan.popular ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : ""}`} variant={plan.popular ? "default" : "outline"} onClick={() => handlePlanClick(plan)}>
                    {plan.cta}
                  </Button>
                ) : (
                  <Button asChild size="lg" className={`w-full rounded-full ${plan.popular ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : ""}`} variant={plan.popular ? "default" : "outline"}>
                    <Link to="/auth?tab=register">{plan.cta}</Link>
                  </Button>
                )}
              </motion.div>
            ))}
          </div>

          {/* All plans include */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Tutti i piani prevedono:</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {allInclude.map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Payment Methods Accepted */}
          <div className="text-center mb-10">
            <p className="text-xs text-muted-foreground mb-3">Metodi di pagamento accettati</p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Visa / Mastercard / Amex</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full opacity-50">
                <span className="font-bold text-[10px]">PP</span>
                <span>PayPal (in arrivo)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CONSULENZA ON TOP SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Cerchi un supporto strategico su misura?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
              Per le aziende che desiderano un partner strategico oltre al software, offriamo un
              percorso di consulenza "On Top". Analizza i tuoi dati con un controller specialist e
              un innovation manager del nostro team per definire un piano d'azione dettagliato.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full gap-2"
              asChild
            >
              <a href="#contatti">
                <Phone className="h-4 w-4" />
                Contattaci
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FAQ SECTION
          ═══════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 md:py-32 relative overflow-hidden bg-muted/20 scroll-mt-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Domande Frequenti
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tutto quello che devi sapere su come funziona MioCFO, sulla sicurezza e sugli abbonamenti.
            </p>
          </motion.div>

          <div className="space-y-10">
            {faqCategories.map((category) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-3">
                  {category.title}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, i) => (
                    <AccordionItem key={i} value={`${category.title}-${i}`}>
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary text-left">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CONTATTI SECTION
          ═══════════════════════════════════════════════════ */}
      <section id="contatti" className="py-20 md:py-32 relative overflow-hidden scroll-mt-20">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Contatti
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Contattaci</h2>
            <p className="text-muted-foreground">
              Siamo qui per rispondere a tutte le tue domande
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleContactSubmit}
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Il tuo nome" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="la-tua@email.com" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" type="tel" placeholder="+39 ..." className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="message">Messaggio *</Label>
              <Textarea id="message" placeholder="Come possiamo aiutarti?" required rows={5} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={contactLoading}>
              {contactLoading ? "Invio in corso..." : "Invia Messaggio"}
            </Button>
          </motion.form>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-muted/20">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute -inset-px bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-3xl blur-sm" />
            <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-8 md:p-16 text-center border border-primary/20">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  Inizia oggi
                </span>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                  Prendi il controllo della tua azienda
                </h2>
                <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  Registrati ora e ottieni 7 giorni di prova gratuita del piano Full. Senza impegno, senza carta di credito.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" asChild className="text-base h-14 px-12 rounded-xl shadow-xl shadow-primary/30 relative overflow-hidden group">
                    <Link to="/auth?tab=register">
                      <span className="relative z-10 flex items-center">
                        Inizia la prova gratuita
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer className="border-t py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={miocfoLogo} alt="mioCFO" className="h-8" />
              </Link>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
              </div>
            </div>
            <nav className="flex gap-8 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors font-medium">Privacy Policy</Link>
              <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors font-medium">Cookie Policy</Link>
              <a href="#contatti" onClick={(e) => { e.preventDefault(); document.querySelector('#contatti')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer">Contatti</a>
            </nav>
            <p className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} mioCFO. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      {paymentModal && (
        <PaymentMethodModal
          open={paymentModal.open}
          onOpenChange={(open) => setPaymentModal(open ? paymentModal : null)}
          planName={paymentModal.planName}
          planId={paymentModal.planId}
          price={paymentModal.price}
          isAnnual={isAnnual}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

interface ProblemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const ProblemCard = ({ icon, title, description, delay = 0 }: ProblemCardProps) => (
  <motion.div className="group relative" variants={fadeInUp} transition={{ duration: 0.5, delay }} whileHover={{ y: -8, transition: { duration: 0.2 } }}>
    <div className="absolute -inset-px bg-gradient-to-b from-primary/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
    <div className="relative h-full bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
      <motion.div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 text-primary" whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}>
        {icon}
      </motion.div>
      <h3 className="text-lg font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
    </div>
  </motion.div>
);

interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  side: 'left' | 'right';
}

const ProcessStep = ({ number, title, description, icon, side }: ProcessStepProps) => (
  <motion.div
    className={`flex flex-col md:flex-row gap-6 items-center ${side === 'right' ? 'md:flex-row-reverse' : ''}`}
    initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    <div className="flex-shrink-0 relative z-10">
      <motion.div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/30" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 400 }}>
        {number}
      </motion.div>
    </div>
    <motion.div className="flex-grow relative group" whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <div className="absolute -inset-px bg-gradient-to-r from-primary/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/50 group-hover:border-primary/30 transition-all">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            {icon}
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

interface FeatureCardProps {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  tags?: string[];
  delay?: number;
}

const FeatureCard = ({ icon, badge, title, description, tags, delay = 0 }: FeatureCardProps) => (
  <motion.div className="group relative" variants={fadeInUp} transition={{ delay }}>
    <div className="absolute -inset-px bg-gradient-to-br from-primary/30 to-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
    <div className="relative h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 transition-all duration-300 group-hover:border-primary/30 group-hover:-translate-y-1">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground mb-6 shadow-lg shadow-primary/20">
        {icon}
      </div>
      {badge && (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {badge}
        </span>
      )}
      <h3 className="text-2xl font-bold mb-4 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag, index) => (
            <span key={index} className="px-3 py-1 rounded-full bg-muted text-sm font-medium">{tag}</span>
          ))}
        </div>
      )}
    </div>
  </motion.div>
);
