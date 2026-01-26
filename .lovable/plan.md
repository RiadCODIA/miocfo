
# Redesign Sezione Problema/Soluzione

## Panoramica
Ridisegnare la sezione "Problema/Soluzione" con un design più moderno, minimal e visivamente accattivante, seguendo lo stile dello screenshot ma migliorandolo ulteriormente.

## Miglioramenti Proposti

### Design Attuale vs Nuovo Design

**Problemi del design attuale:**
- Card troppo piccole e con poco padding
- Background grigio della sezione poco elegante
- Icone standard senza personalità
- Bordi troppo sottili

**Nuovo design:**
- Background bianco per la sezione (più pulito)
- Card più grandi con padding generoso (p-10 o p-12)
- Card con ombre morbide invece di bordi evidenti
- Icone più grandi e stilizzate
- Freccia centrale più prominente e moderna
- Migliore spacing verticale tra elementi

### Specifiche Tecniche

**Card Problema (sinistra):**
- Background: rosa/rosso molto chiaro (`bg-red-50`)
- Bordo: sottile rosa (`border border-red-100`)
- Ombra morbida (`shadow-lg shadow-red-100/50`)
- Icona: FileSpreadsheet più grande (h-20 w-20), colore rosso/corallo
- Bordi arrotondati: `rounded-3xl`

**Freccia Centrale:**
- Cerchio con gradient primary → accent
- Dimensione: w-16 h-16
- Ombra: glow effect sottile
- Posizionamento centrale perfetto

**Card Soluzione (destra):**
- Background: verde molto chiaro (`bg-emerald-50` o `bg-green-50`)
- Bordo: sottile verde (`border border-emerald-100`)
- Ombra morbida (`shadow-lg shadow-emerald-100/50`)
- Icona: LayoutDashboard o Grid più grande (h-20 w-20), colore verde
- Bordi arrotondati: `rounded-3xl`

### Layout
- Grid 3 colonne: `grid md:grid-cols-[1fr_auto_1fr]`
- Gap generoso: `gap-8 md:gap-12`
- Sezione con `py-24` per più respiro
- Container con max-width per centrare bene

### Typography
- Titoli: `text-2xl font-bold`
- Descrizioni: `text-base leading-relaxed`
- Colore titoli: foreground puro
- Colore descrizioni: muted-foreground

### Responsive Mobile
- Stack verticale su mobile
- Freccia ruotata verso il basso su mobile
- Padding ridotto su schermi piccoli

## File da Modificare
```text
src/components/landing/ProblemSolutionSection.tsx
```

## Codice Proposto

Il componente verrà riscritto con:
- Layout migliorato con flexbox/grid ottimizzato
- Card con stile glassmorphism leggero
- Animazioni hover sottili (scale e shadow)
- Icone più espressive
- Background section pulito (bianco o quasi bianco)
