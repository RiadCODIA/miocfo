
# Rimozione etichetta "GESTIONE BUSINESS" dalla Sidebar

## Cosa cambia

L'etichetta di sezione "GESTIONE BUSINESS" verra rimossa dalla sidebar. Le sotto-sezioni "Area finanziaria" e "Area economica" rimarranno visibili come prima, ma senza l'intestazione "GESTIONE BUSINESS" sopra di esse.

## Dettaglio tecnico

**File:** `src/components/layout/Sidebar.tsx`

- Nella definizione di `userNavGroups` (riga 71), il campo `label: "GESTIONE BUSINESS"` verra sostituito con una stringa vuota o rimosso
- Nel template di rendering (riga 242), il blocco che mostra `group.label` come intestazione di sezione non verra visualizzato quando il label e vuoto
