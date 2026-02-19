import { Building2, CreditCard, Users, Star } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "500+",
    label: "Aziende attive",
  },
  {
    icon: CreditCard,
    value: "2M+",
    label: "Transazioni gestite",
  },
  {
    icon: Users,
    value: "1.200+",
    label: "Utenti soddisfatti",
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "Valutazione media",
  },
];

const testimonials = [
  {
    quote: "mioCFO ha rivoluzionato il modo in cui gestiamo le finanze aziendali. Finalmente ho visibilità in tempo reale.",
    author: "Marco R.",
    role: "CEO, TechStart Srl",
  },
  {
    quote: "Addio Excel! Con mioCFO risparmio ore ogni settimana e ho report sempre aggiornati automaticamente.",
    author: "Laura B.",
    role: "CFO, Design Studio",
  },
  {
    quote: "Il collegamento bancario automatico è fantastico. I dati sono sempre sincronizzati senza fare nulla.",
    author: "Giuseppe M.",
    role: "Titolare, Consulting Pro",
  },
];

export function SocialProofSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm"
            >
              <stat.icon className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <p className="text-2xl md:text-3xl font-semibold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Cosa dicono i nostri <span className="text-primary">clienti</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.author}
              className="bg-background border border-border/50 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div>
                <p className="text-sm font-medium text-foreground">{testimonial.author}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
