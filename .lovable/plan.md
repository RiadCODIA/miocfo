

## Piano: Migliorare il Design del Modal "Seleziona la tua banca"

### Obiettivo
Rendere il modal di selezione banca piu moderno, pulito e professionale, con una migliore gerarchia visiva e spaziatura.

---

## Miglioramenti Proposti

### 1. Layout Generale
- Aumentare la larghezza del modal a `sm:max-w-[550px]` per dare piu respiro
- Rimuovere il contenitore con bordo e sfondo grigio che appesantisce il design
- Usare una struttura piu ariosa con spaziatura maggiore tra gli elementi

### 2. Header del Modal
- Aggiungere un'icona decorativa nel header (Building2 o Landmark)
- Centrare titolo e descrizione per un look piu elegante

### 3. Form Fields (Paese e Tipo Conto)
- Disporre Paese e Tipo di conto su **due colonne affiancate** per risparmiare spazio verticale
- Usare un design piu minimal per i select (senza bordo pesante)

### 4. Campo Ricerca
- Aggiungere uno sfondo leggero al campo di ricerca
- Icona di ricerca piu grande e prominente

### 5. Lista Banche
- Card delle banche con hover effect piu elegante (shadow + scale)
- Aggiungere un sottile bordo di separazione tra le banche
- Stato selezionato piu evidente con bordo primary e sfondo gradient leggero
- Aggiungere un badge o checkmark quando una banca e selezionata

### 6. Bottoni Footer
- Bottoni con design piu prominente
- "Continua" con gradiente primary per maggiore enfasi
- Spaziatura migliore dal contenuto sopra

### 7. Stati Loading ed Empty
- Migliorare l'animazione di loading con un messaggio contestuale
- Stato "Nessuna banca trovata" con icona e suggerimento

---

## Dettagli Tecnici

### File da modificare
`src/components/conti-bancari/ConnectBankModal.tsx`

### Struttura Proposta (step "select_bank")

```tsx
{step === "select_bank" && (
  <div className="flex flex-col h-[500px]">
    {/* Header con icona */}
    <div className="flex items-center justify-center pb-4">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <Landmark className="h-7 w-7 text-primary" />
      </div>
    </div>
    
    {/* Selettori Paese e Tipo su due colonne */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Paese
        </Label>
        <Select ...>
          <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2">
            ...
          </SelectTrigger>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tipo conto
        </Label>
        <Select ...>
          <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2">
            ...
          </SelectTrigger>
        </Select>
      </div>
    </div>
    
    {/* Ricerca con design migliorato */}
    <div className="relative mb-4">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Cerca la tua banca..."
        className="pl-12 h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 text-base"
      />
    </div>
    
    {/* Lista banche con card migliorate */}
    <div className="flex-1 min-h-0 -mx-2">
      <ScrollArea className="h-full px-2">
        <div className="space-y-2">
          {filteredBanks.map((bank) => (
            <button
              key={bank.name}
              onClick={() => handleSelectBank(bank)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200",
                "hover:shadow-md hover:scale-[1.02] hover:bg-muted/80",
                selectedBank?.name === bank.name
                  ? "bg-primary/10 ring-2 ring-primary shadow-md"
                  : "bg-muted/40"
              )}
            >
              <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground flex-1">
                {bank.name}
              </span>
              {selectedBank?.name === bank.name && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
    
    {/* Footer con bottoni prominenti */}
    <div className="flex gap-3 pt-6 border-t mt-4">
      <Button variant="ghost" onClick={handleClose} className="flex-1 h-12 rounded-xl">
        Annulla
      </Button>
      <Button
        onClick={handleProceed}
        disabled={!selectedBank || isLoading}
        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl transition-all"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Continua
      </Button>
    </div>
  </div>
)}
```

---

## Riepilogo Visivo delle Modifiche

| Elemento | Attuale | Nuovo Design |
|----------|---------|--------------|
| Container form | Box grigio con bordo | Sfondo pulito, no bordo |
| Paese + Tipo | In colonna (verticale) | In riga (2 colonne) |
| Select triggers | Standard shadcn | Piu alti (h-12), rounded-xl, sfondo muted |
| Campo ricerca | Standard | Piu grande, icona prominente |
| Card banche | Semplice hover | Shadow + scale + checkmark quando selezionata |
| Bottoni | Standard | Piu alti, rounded-xl, gradiente su "Continua" |

---

## File da Modificare
- `src/components/conti-bancari/ConnectBankModal.tsx`

