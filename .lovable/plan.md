
# Fix schermo bianco / freeze su tutte le pagine

## Problema identificato

La causa principale dello schermo bianco e del "freeze" e il pattern CSS `opacity-0 animate-fade-in` usato massivamente in tutta l'applicazione (185 occorrenze in 9 pagine).

### Come funziona il bug:
1. Gli elementi partono con `opacity: 0` (invisibili)
2. L'animazione CSS `animate-fade-in` li porta a `opacity: 1` con `animation-fill-mode: forwards`
3. Quando React ri-renderizza il componente (dopo cambio stato, refetch query, reset ErrorBoundary), il DOM non viene completamente rimosso e ri-aggiunto
4. L'animazione CSS **non si ripete** perche il browser non la ritrigga su elementi gia presenti nel DOM
5. Gli elementi restano permanentemente a `opacity: 0` = **schermo bianco**

Questo spiega perche il problema si verifica "su qualsiasi azione" e richiede un refresh manuale.

## Soluzione

Rimuovere `opacity-0 animate-fade-in` e le relative `animationDelay` da tutte le pagine affette. Gli elementi saranno immediatamente visibili senza rischio di rimanere invisibili.

## File da modificare

| File | Occorrenze da rimuovere |
|------|------------------------|
| `src/pages/Transazioni.tsx` | 3 occorrenze |
| `src/pages/AlertNotifiche.tsx` | 5 occorrenze |
| `src/pages/BudgetPrevisioni.tsx` | 5 occorrenze |
| `src/pages/Impostazioni.tsx` | 4 occorrenze |
| + altre 5 pagine | ~168 occorrenze rimanenti |

## Dettaglio tecnico

Per ogni file, tutte le classi `opacity-0 animate-fade-in` verranno rimosse, insieme ai relativi attributi `style={{ animationDelay: "..." }}`.

Esempio di modifica:
```text
// PRIMA (bug)
<div className="space-y-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>

// DOPO (fix)
<div className="space-y-6">
```

La definizione dell'animazione nel `tailwind.config.ts` puo rimanere perche potrebbe essere usata correttamente altrove (es. componenti che vengono montati/smontati con condizionali).
