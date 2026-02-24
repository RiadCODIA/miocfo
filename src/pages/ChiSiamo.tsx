import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, Smartphone } from "lucide-react";

export default function ChiSiamo() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Chi Siamo</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Rendiamo il controllo finanziario semplice, per tutti. Siamo un team di controller 
              ed esperti di finanza d'azienda. Abbiamo creato MioCFO perché crediamo che ogni 
              imprenditore meriti di guidare la propria azienda con dati chiari, senza la 
              complessità dei vecchi gestionali.
            </p>
          </div>

          {/* Values */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="bg-background border border-border/40 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Chiarezza al Primo Sguardo</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dashboard intuitive che trasformano numeri complessi in informazioni comprensibili. 
                Niente tecnicismi, solo dati che parlano chiaro.
              </p>
            </div>
            <div className="bg-background border border-border/40 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Tecnologia Accessibile</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Strumenti professionali senza bisogno di corsi o manuali. 
                Bastano 5 minuti per iniziare, la tecnologia fa il resto.
              </p>
            </div>
          </div>

          {/* Mission */}
          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">La Nostra Mission</h2>
            <div className="prose prose-muted max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Basta navigare a vista. Conosciamo la sensazione. File Excel che non tornano, 
                nottate passate a incrociare dati, home banking multiple e la costante incertezza 
                sulla liquidità futura.
              </p>
              <p>
                Per anni il controllo di gestione è stato un lusso per pochi: complicato, costoso 
                e riservato alle grandi aziende. La nostra missione è democratizzare il controllo 
                finanziario.
              </p>
              <p>
                Abbiamo tradotto la nostra esperienza decennale in un software intelligente che fa 
                il lavoro pesante al posto tuo. Colleghiamo conti correnti e cassetto fiscale per 
                darti, in tempo reale, la visione d'insieme che ti serve per decidere.
              </p>
            </div>
          </div>

          {/* Team */}
          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Il Team</h2>
            <p className="text-muted-foreground leading-relaxed">
              MioCFO non nasce in un garage da soli sviluppatori. Nasce dall'unione di due mondi: 
              professionisti del controllo di gestione e innovation manager. Siamo persone che 
              hanno passato la carriera dentro le PMI, analizzando bilanci, costruendo piani 
              finanziari e affiancando imprenditori nelle loro scelte strategiche. A un certo 
              punto, ci siamo chiesti: "Perché gli strumenti che usiamo sono così complessi?" 
              E abbiamo costruito quello che avremmo voluto avere come strumento per i nostri 
              clienti: uno strumento potente come un consulente senior, ma semplice da usare 
              come un'app.
            </p>
          </div>

          {/* Future */}
          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Il Futuro che Costruiamo
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">La nostra visione: decisioni migliori, aziende più forti.</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Vogliamo eliminare le "decisioni prese a sensazione". Sogniamo un ecosistema 
              imprenditoriale italiano più competitivo, dove ogni PMI, dalla più piccola alla 
              più strutturata, possa accedere a dati certi per pianificare la crescita e gestire 
              i rischi. MioCFO vuole essere il co-pilota intelligente di ogni imprenditore. 
              Uno strumento che non si limita a mostrare numeri, ma che aiuta a capirli, 
              fornendo la consapevolezza necessaria per guardare al futuro con sicurezza.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center rounded-3xl bg-primary p-10 md:p-14">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Pronto a prendere il controllo?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Scopri cosa può fare MioCFO per la tua azienda. 
              Inizia la tua prova gratuita di 7 giorni. Senza impegno, senza carta di credito.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-6"
            >
              <Link to="/auth?tab=register">
                Inizia la prova gratuita
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
