import { Button } from "@/components/ui/button";
import { ArrowRight, FileSpreadsheet, AlertCircle, Unlink, HelpCircle, Building2, LineChart, Gauge, Linkedin, Instagram, Facebook, LayoutDashboard, Bot, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import miocfoLogo from "@/assets/miocfo-logo-blue.png";
import { HeroSection } from "@/components/landing/HeroSection";
import React from "react";

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

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Problems Section */}
      <section id="chi-siamo" className="py-20 md:py-32 relative overflow-hidden scroll-mt-20">
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
            <ProblemCard 
              icon={<FileSpreadsheet className="h-8 w-8" />} 
              title="File Excel infiniti" 
              description="Ore perse ogni settimana per aggiornare manualmente fogli di calcolo complessi." 
              delay={0}
            />
            <ProblemCard 
              icon={<AlertCircle className="h-8 w-8" />} 
              title="Sorprese sul conto" 
              description="Scarsa visibilità sulla liquidità futura, con il rischio di scoprirlo troppo tardi." 
              delay={0.1}
            />
            <ProblemCard 
              icon={<Unlink className="h-8 w-8" />} 
              title="Dati scollegati" 
              description="Fatture, banche e bilanci parlano lingue diverse. Impossibile avere una visione d'insieme." 
              delay={0.2}
            />
            <ProblemCard 
              icon={<HelpCircle className="h-8 w-8" />} 
              title="Decisioni a sensazione" 
              description="Prendere decisioni strategiche basandosi sull'intuito invece che su dati certi." 
              delay={0.3}
            />
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section id="piani" className="py-20 md:py-32 relative overflow-hidden bg-muted/20 scroll-mt-20">
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
            {/* Vertical Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary to-primary/50 hidden md:block" />
            
            <div className="space-y-16 md:space-y-24">
              <ProcessStep 
                number="1"
                title="Collega le tue fonti" 
                description="Connetti in sicurezza le tue banche (PSD2) e il tuo Cassetto Fiscale. MioCFO fa il resto."
                icon={<Building2 className="h-8 w-8" />}
                side="left"
              />
              <ProcessStep 
                number="2"
                title="Visualizza la tua liquidità" 
                description="Accedi a una dashboard unificata. Guarda entrate, uscite, saldi aggregati. Tutto in un unico posto."
                icon={<Gauge className="h-8 w-8" />}
                side="right"
              />
              <ProcessStep 
                number="3"
                title="Anticipa il futuro" 
                description="Grazie all'IA, incrociamo le scadenze delle fatture con i costi ricorrenti per mostrarti la previsione di cassa."
                icon={<LineChart className="h-8 w-8" />}
                side="left"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funzionalita" className="py-20 md:py-32 relative overflow-hidden scroll-mt-20">
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
            <FeatureCard 
              icon={<LayoutDashboard className="h-12 w-12" />}
              badge="Piano Full"
              title="Dashboard Personalizzabile"
              description="Crea la tua plancia di comando. Scegli fino a 10 KPI (widget) per monitorare solo ciò che conta davvero per te, dai flussi di cassa ai dati di bilancio."
              delay={0}
            />
            <FeatureCard 
              icon={<Bot className="h-12 w-12" />}
              badge="AI Powered"
              title="Il CFO Virtuale"
              description="Non guardare solo i dati, ascoltali. MioCFO ti invia notifiche proattive e suggerimenti su scadenze critiche, trend inaspettati o aree di miglioramento."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Link2 className="h-12 w-12" />}
              title="Analisi Integrata"
              description="Smetti di saltare da un portale all'altro. Collega conti correnti e fatturazione elettronica per un'analisi completa."
              tags={["Banche PSD2", "Cassetto Fiscale", "Fatture Elettroniche"]}
              delay={0.2}
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contatti" className="py-20 md:py-32 relative overflow-hidden scroll-mt-20">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Glowing border */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-3xl blur-sm" />
            
            <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-8 md:p-16 text-center border border-primary/20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  Inizia oggi
                </span>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                  Prendi il controllo della tua azienda
                </h2>
                <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  Registrati ora e ottieni 7 giorni di prova gratuita del piano Full. Senza impegno, senza carta di credito.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg" 
                    asChild 
                    className="text-base h-14 px-12 rounded-xl shadow-xl shadow-primary/30 relative overflow-hidden group"
                  >
                    <Link to="/auth?tab=register">
                      <span className="relative z-10 flex items-center">
                        Inizia la prova gratuita 
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={miocfoLogo} alt="mioCFO" className="h-8" />
              </Link>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
            <nav className="flex gap-8 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors font-medium">Privacy Policy</Link>
              <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors font-medium">Cookie Policy</Link>
              <Link to="/contatti" className="text-muted-foreground hover:text-primary transition-colors font-medium">Contatti</Link>
            </nav>
            <p className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} mioCFO. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface ProblemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  side: 'left' | 'right';
}

const ProcessStep = ({ number, title, description, icon, side }: ProcessStepProps) => {
  return (
    <motion.div 
      className={`flex flex-col md:flex-row gap-6 items-center ${side === 'right' ? 'md:flex-row-reverse' : ''}`}
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Number bubble */}
      <div className="flex-shrink-0 relative z-10">
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/30"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {number}
        </motion.div>
      </div>
      
      {/* Content card */}
      <motion.div 
        className="flex-grow relative group"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="absolute -inset-px bg-gradient-to-r from-primary/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/50 group-hover:border-primary/30 transition-all">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              {icon}
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProblemCard = ({ icon, title, description, delay = 0 }: ProblemCardProps) => {
  return (
    <motion.div 
      className="group relative"
      variants={fadeInUp}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-px bg-gradient-to-b from-primary/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      
      <div className="relative h-full bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
        <motion.div 
          className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 text-primary"
          whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
        >
          {icon}
        </motion.div>
        <h3 className="text-lg font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
      </div>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  tags?: string[];
  delay?: number;
}

const FeatureCard = ({ icon, badge, title, description, tags, delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div 
      className="group relative"
      variants={fadeInUp}
      transition={{ delay }}
    >
      <div className="absolute -inset-px bg-gradient-to-br from-primary/30 to-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      <div className="relative h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 transition-all duration-300 group-hover:border-primary/30 group-hover:-translate-y-1">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground mb-6 shadow-lg shadow-primary/20">
          {icon}
        </div>
        
        {/* Badge */}
        {badge && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {badge}
          </span>
        )}
        
        {/* Title */}
        <h3 className="text-2xl font-bold mb-4 text-foreground">{title}</h3>
        
        {/* Description */}
        <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};