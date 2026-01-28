
## Piano: Ristrutturare il layout del modal ConnectBankModal

### Problema
Il selettore del paese, il campo di ricerca e la lista delle banche sono visualmente al di fuori di un contenitore coesivo. La struttura attuale ha questi elementi "liberi" nel modal senza un bordo o sfondo che li raggruppi come un form.

### Soluzione
Avvolgere l'area di input (paese, ricerca banca, lista banche) in un contenitore con bordo e sfondo che le raggruppi visivamente come un "form", mantenendo i pulsanti di azione (Annulla/Continua) fuori da questo contenitore.

### Modifiche Tecniche

**File: `src/components/conti-bancari/ConnectBankModal.tsx`**

Ristrutturare il blocco `step === "select_bank"` (righe 199-283):

```
Struttura attuale:
<div className="flex flex-col h-[450px]">
  <div className="space-y-4 py-4 flex-1 flex flex-col min-h-0">
    - Paese (Select)
    - Cerca banca (Input)
    - ScrollArea con lista banche
  </div>
  <div className="flex gap-3 pt-4 flex-shrink-0 border-t">
    - Pulsanti Annulla/Continua
  </div>
</div>

Nuova struttura:
<div className="flex flex-col h-[450px]">
  <div className="flex-1 flex flex-col min-h-0 border rounded-lg p-4 bg-muted/30">
    - Paese (Select)
    - Cerca banca (Input)  
    - ScrollArea con lista banche (senza bordo proprio)
  </div>
  <div className="flex gap-3 pt-4 flex-shrink-0">
    - Pulsanti Annulla/Continua
  </div>
</div>
```

Modifiche specifiche:
1. Aggiungere `border rounded-lg p-4 bg-muted/30` al contenitore degli input
2. Rimuovere `py-4` dal contenitore interno (ora gestito dal padding del form)
3. Rimuovere `rounded-md border` dalla ScrollArea (il bordo è ora sul form esterno)
4. Rimuovere `border-t` dalla riga dei pulsanti (non più necessario)

### Risultato Visivo
- Paese, ricerca e lista banche saranno raggruppati in un riquadro con bordo e sfondo leggero
- I pulsanti di azione rimarranno fuori dal form, ancorati in basso
- Layout più pulito e coerente con il design di un form
