

## Piano: Correggere l'overflow del Modal di Selezione Banca

### Problema
Le card delle banche e i contenuti del modal stanno uscendo fuori dai bordi del popup. Questo è causato da:
1. Altezza fissa `h-[500px]` che non si adatta correttamente al DialogContent
2. Manca `overflow-hidden` nel contenitore principale del contenuto
3. La `ScrollArea` non sta contenendo correttamente la lista delle banche

---

## Soluzione

### Modifiche al file `src/components/conti-bancari/ConnectBankModal.tsx`

**1. Aggiungere `overflow-hidden` e margini corretti al DialogContent:**
```tsx
<DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
```

**2. Correggere il contenitore principale dello step "select_bank":**
```tsx
{step === "select_bank" && (
  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
    {/* ... contenuti ... */}
  </div>
)}
```

**3. Correggere il contenitore della ScrollArea:**
```tsx
{/* Lista banche con overflow corretto */}
<div className="flex-1 min-h-0 overflow-hidden">
  {isLoadingBanks ? (
    {/* ... loading state ... */}
  ) : (
    <ScrollArea className="h-full">
      <div className="space-y-2 pb-2 px-1">
        {/* ... bank cards ... */}
      </div>
    </ScrollArea>
  )}
</div>
```

**4. Rimuovere margini negativi problematici:**
- Rimuovere `-mx-2` dal contenitore della lista banche che causa l'overflow laterale

---

## Riepilogo Modifiche

| Linea | Modifica |
|-------|----------|
| 191 | Aggiungere `max-h-[90vh] overflow-hidden flex flex-col` a DialogContent |
| 211 | Aggiungere `min-h-0 overflow-hidden` e rimuovere `h-[500px]` fisso |
| 266 | Rimuovere `-mx-2` e aggiungere `overflow-hidden` |

---

## Risultato Atteso
- Le card delle banche rimangono contenute dentro il modal
- Lo scroll funziona correttamente all'interno dell'area designata
- Il modal si adatta meglio alle diverse dimensioni dello schermo con `max-h-[90vh]`

