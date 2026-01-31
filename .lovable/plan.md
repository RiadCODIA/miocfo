

## Piano: Allargare il Modal e Correggere l'Overflow

### Problema
Il modal di selezione banca è troppo piccolo e i contenuti (card delle banche) fuoriescono dai bordi del popup.

---

## Modifiche

### File: `src/components/conti-bancari/ConnectBankModal.tsx`

**1. Aumentare la larghezza del modal (linea 191):**
```tsx
// Da:
<DialogContent className="sm:max-w-[550px]">

// A:
<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
```
- `sm:max-w-[700px]`: larghezza maggiore per dare più respiro
- `max-h-[90vh]`: limita l'altezza al 90% dello schermo
- `overflow-hidden`: impedisce ai contenuti di uscire
- `flex flex-col`: permette al contenuto di gestirsi con flexbox

**2. Correggere il contenitore dello step "select_bank" (linea 211):**
```tsx
// Da:
<div className="flex flex-col h-[500px]">

// A:
<div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ height: "600px" }}>
```
- `flex-1`: occupa lo spazio disponibile
- `min-h-0`: permette al contenuto di ridursi se necessario
- `overflow-hidden`: contiene i figli
- `height: 600px`: altezza maggiore per mostrare più banche

**3. Correggere il contenitore della lista banche (linea 266):**
```tsx
// Da:
<div className="flex-1 min-h-0 -mx-2">

// A:
<div className="flex-1 min-h-0 overflow-hidden">
```
- Rimuovere `-mx-2` che causa overflow laterale
- Aggiungere `overflow-hidden` per contenere la ScrollArea

---

## Riepilogo Modifiche

| Linea | Elemento | Modifica |
|-------|----------|----------|
| 191 | DialogContent | Aggiungere `sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col` |
| 211 | Container step | Cambiare `h-[500px]` in `flex-1 min-h-0 overflow-hidden` con `height: 600px` inline |
| 266 | Container lista | Rimuovere `-mx-2`, aggiungere `overflow-hidden` |

---

## Risultato Atteso
- Modal più ampio (700px invece di 550px)
- Altezza maggiore (600px) per mostrare più banche
- Contenuti correttamente contenuti all'interno del modal
- Scroll funzionante solo nell'area della lista banche

