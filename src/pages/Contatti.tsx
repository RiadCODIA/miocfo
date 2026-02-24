import { useState } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Contatti() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submit
    setTimeout(() => {
      toast.success("Messaggio inviato con successo! Ti risponderemo al più presto.");
      (e.target as HTMLFormElement).reset();
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Contattaci</h1>
            <p className="text-muted-foreground">
              Siamo qui per rispondere a tutte le tue domande
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <Textarea
                id="message"
                placeholder="Come possiamo aiutarti?"
                required
                rows={5}
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? "Invio in corso..." : "Invia Messaggio"}
            </Button>
          </form>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
