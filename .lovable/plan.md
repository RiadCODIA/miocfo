
# Redesign Completo Landing Page - Minimal e Moderno

## Panoramica
Trasformare l'intera landing page in un design ultra-minimal e moderno, con focus su whitespace, tipografia pulita e interazioni sottili.

## Filosofia del Design

### Principi Guida
- **Whitespace abbondante**: Sezioni con padding generoso (py-24 o py-32)
- **Colori sobri**: Predominanza di bianco, grigi chiari e accenti sottili
- **Tipografia pulita**: Gerarchie chiare, peso leggero dove possibile
- **Animazioni sottili**: Transizioni morbide invece di effetti vistosi
- **Rimozione elementi superflui**: Meno decorazioni, piu contenuto

## Sezioni da Ridisegnare

### 1. LandingHeader
**Modifiche:**
- Background trasparente puro (no glassmorphism quando non scrollato)
- Navigazione con font-weight piu leggero (font-normal invece di font-medium)
- Pulsante "Accedi" con bordo sottile e stile ghost
- Mobile menu semplificato con sfondo bianco solido

### 2. HeroSection
**Modifiche:**
- Rimuovere completamente i blob decorativi di background
- Titolo con dimensioni leggermente ridotte per eleganza
- Sottotitolo con colore piu chiaro e peso leggero
- Pulsante CTA con stile minimal (bordo arrotondato, transizione sottile)
- Dashboard mockup semplificato con bordi meno evidenti
- Rimuovere effetto "glow" dal mockup

### 3. ProblemSolutionSection
**Stato:** Gia ridisegnata - Mantenere il design attuale

### 4. FeaturesSection
**Modifiche:**
- Rimuovere effetto glass dalle card
- Card con sfondo bianco puro e ombra sottilissima
- Icone in cerchi con sfondo grigio chiaro (bg-muted) invece di gradienti
- Rimuovere animazioni hover eccessive (scale)
- Bordi invisibili o quasi invisibili
- Griglia con gap maggiore

### 5. HowItWorks
**Modifiche:**
- Rimuovere sfondo muted/30
- Linea di connessione piu sottile e grigia (invece di gradient)
- Cerchi step con colore solido primary (no gradient)
- Numeri step integrati meglio (senza bordo spesso)
- Tipografia piu leggera per le descrizioni

### 6. SocialProofSection
**Modifiche:**
- Statistiche con stile piu sobrio (no glass)
- Numeri grandi ma con font-weight medium invece di bold
- Testimonial con card bianche e ombra minima
- Stelle di rating piu piccole o in scala di grigi con accento

### 7. CTASection
**Modifiche:**
- Rimuovere elementi decorativi blur
- Gradient piu sobrio o colore solido
- Padding ridotto per aspetto meno "pesante"
- Testo piu conciso

### 8. LandingFooter
**Modifiche:**
- Sfondo bianco invece di muted/50
- Separatore superiore sottile
- Icone social piu piccole e minimal
- Layout piu compatto

## File da Modificare

```text
src/components/landing/LandingHeader.tsx
src/components/landing/HeroSection.tsx
src/components/landing/FeaturesSection.tsx
src/components/landing/HowItWorks.tsx
src/components/landing/SocialProofSection.tsx
src/components/landing/CTASection.tsx
src/components/landing/LandingFooter.tsx
```

## Dettagli Tecnici

### LandingHeader
- Rimuovere `glass` class quando scrollato, usare `bg-white/95 backdrop-blur-sm`
- Navigation links: `text-muted-foreground hover:text-foreground`
- Button "Accedi": `variant="ghost"` con bordo sottile

### HeroSection
- Rimuovere i div con blob blur
- Container: `max-w-5xl` per centrare meglio
- Titolo: `text-4xl md:text-5xl lg:text-6xl font-semibold` (non bold)
- Sottotitolo: `text-muted-foreground font-normal`
- Dashboard mockup: bordo `border border-border/50` invece di `glow`

### FeaturesSection
- Card: `bg-white border border-border/30 shadow-sm hover:shadow-md`
- Icona container: `bg-muted` invece di gradient
- Rimuovere `hover:-translate-y-1`

### HowItWorks
- Sezione: `bg-white` invece di `bg-muted/30`
- Linea connessione: `h-px bg-border` invece di gradient
- Cerchi: `bg-primary` solido invece di gradient

### SocialProofSection
- Stat card: `bg-white border border-border/50 shadow-sm`
- Numeri: `font-semibold` invece di `font-bold text-gradient`
- Testimonial: `bg-white shadow-sm` senza glass

### CTASection
- Box: `bg-primary` solido oppure gradient molto sottile
- Rimuovere elementi blur decorativi
- Padding: `py-12 md:py-16` invece di `py-16 md:py-20`

### LandingFooter
- Sfondo: `bg-white border-t border-border`
- Icone social: `w-9 h-9` con hover sottile

## Risultato Atteso
Una landing page elegante, professionale e moderna che comunica affidabilita e semplicita, perfetta per un prodotto B2B fintech.
