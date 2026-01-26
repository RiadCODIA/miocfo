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
    quote: "Finexa ha rivoluzionato il modo in cui gestiamo le finanze aziendali. Finalmente ho visibilità in tempo reale.",
    author: "Marco R.",
    role: "CEO, TechStart Srl",
  },
  {
    quote: "Addio Excel! Con Finexa risparmio ore ogni settimana e ho report sempre aggiornati automaticamente.",
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
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="text-center p-6 rounded-2xl glass animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
              <p className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cosa dicono i nostri <span className="text-gradient">clienti</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.author}
              className="glass rounded-2xl p-6 animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "{testimonial.quote}"
              </p>
              <div>
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
