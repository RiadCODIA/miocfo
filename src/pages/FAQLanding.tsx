import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "Generali e Prova Gratuita",
    items: [
      {
        q: "Cos'è MioCFO?",
        a: "MioCFO è una piattaforma di gestione finanziaria progettata per le PMI italiane. Ti permette di collegare conti bancari e cassetto fiscale per avere una visione completa e in tempo reale delle finanze aziendali.",
      },
      {
        q: "Devo inserire la carta di credito per la prova gratuita?",
        a: "No, la prova gratuita di 7 giorni non richiede alcuna carta di credito. Puoi esplorare tutte le funzionalità del piano Full senza alcun impegno.",
      },
      {
        q: "Cosa succede alla fine della prova gratuita?",
        a: "Alla scadenza dei 7 giorni, potrai scegliere il piano più adatto alle tue esigenze. Se decidi di non proseguire, il tuo account rimarrà attivo in modalità base.",
      },
      {
        q: "Posso cambiare piano in futuro?",
        a: "Sì, puoi effettuare l'upgrade o il downgrade del tuo piano in qualsiasi momento dalle impostazioni del tuo account.",
      },
    ],
  },
  {
    title: "Funzionamento e Connessioni",
    items: [
      {
        q: "Come collego i miei conti bancari?",
        a: "MioCFO utilizza la tecnologia PSD2 per connettersi in sicurezza ai tuoi conti bancari. Basta selezionare la tua banca, autenticarti e i dati verranno sincronizzati automaticamente.",
      },
      {
        q: "Posso collegare il Cassetto Fiscale?",
        a: "Sì, MioCFO si integra direttamente con il Cassetto Fiscale dell'Agenzia delle Entrate per importare automaticamente le tue fatture elettroniche.",
      },
      {
        q: "Quanto tempo serve per configurare MioCFO?",
        a: "La configurazione iniziale richiede circa 5 minuti. Basta registrarsi, collegare i propri conti e la dashboard si popola automaticamente con i dati finanziari.",
      },
    ],
  },
  {
    title: "Sicurezza dei Dati",
    items: [
      {
        q: "I miei dati sono al sicuro?",
        a: "Assolutamente sì. Utilizziamo crittografia end-to-end e standard bancari di sicurezza. I dati sono ospitati su server europei conformi al GDPR. Non abbiamo mai accesso alle tue credenziali bancarie.",
      },
      {
        q: "MioCFO può effettuare operazioni sul mio conto?",
        a: "No, MioCFO ha accesso esclusivamente in lettura ai tuoi dati bancari tramite PSD2. Non può effettuare alcun pagamento o movimento sul tuo conto.",
      },
    ],
  },
  {
    title: "Piani e Abbonamenti",
    items: [
      {
        q: "Cosa include la fatturazione annuale?",
        a: "Con la fatturazione annuale risparmi l'equivalente di 2 mesi rispetto al pagamento mensile. Tutte le funzionalità del piano scelto restano invariate.",
      },
      {
        q: "Posso annullare l'abbonamento in qualsiasi momento?",
        a: "Sì, puoi annullare il tuo abbonamento in qualsiasi momento. L'accesso rimarrà attivo fino alla fine del periodo già pagato.",
      },
      {
        q: "Offrite sconti per più aziende?",
        a: "Sì, per chi gestisce più aziende o per studi commercialisti offriamo condizioni personalizzate. Contattaci per un preventivo dedicato.",
      },
    ],
  },
];

export default function FAQLanding() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Domande Frequenti
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tutto quello che devi sapere su come funziona MioCFO, sulla sicurezza 
              e sugli abbonamenti. In modo semplice e trasparente.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-10 mb-20">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-3">
                  {category.title}
                </h2>
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
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center rounded-2xl border border-border/50 bg-muted/30 p-8 md:p-12">
            <h3 className="text-xl font-bold text-foreground mb-3">
              Non hai trovato la risposta che cercavi?
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Il nostro team è qui per aiutarti. Contattaci via chat direttamente 
              dalla piattaforma o scrivici un'email. Ti risponderemo al più presto.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild className="rounded-full px-6">
                <Link to="/contatti">Contatta il Supporto</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <a href="mailto:support@miocfo.com">
                  <Mail className="mr-2 h-4 w-4" />
                  support@miocfo.com
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
