

## Piano: Correggere il Layout del Form ConnectBankModal

### Problema Identificato
Dalla screenshot, la lista delle banche sta fuoriuscendo visivamente dal contenitore del form con bordo. Il problema principale e che il contenitore `flex-1 min-h-0` che contiene la `ScrollArea` non ha `overflow-hidden`, permettendo ai contenuti di apparire fuori dal box.

### Soluzione
Aggiungere `overflow-hidden` al contenitore della lista e assicurarsi che la `ScrollArea` sia correttamente contenuta all'interno del form con bordo.

### Modifiche Tecniche

**File: `src/components/conti-bancari/ConnectBankModal.tsx`**

1. **Linea 231** - Aggiungere `overflow-hidden` al div contenitore della ScrollArea:
   ```tsx
   // Da:
   <div className="flex-1 min-h-0">
   
   // A:
   <div className="flex-1 min-h-0 overflow-hidden">
   ```

2. **Linea 237** - Aggiungere `rounded-md` alla ScrollArea per consistenza visiva interna:
   ```tsx
   // Da:
   <ScrollArea className="h-full">
   
   // A:
   <ScrollArea className="h-full rounded-md">
   ```

### Risultato Atteso
- La lista delle banche sara correttamente contenuta all'interno del box con bordo arrotondato
- Lo scroll funzionera solo all'interno del contenitore designato
- Non ci saranno elementi visivamente al di fuori del form

