

## Piano: Estendere lo storico bancario a 3 anni

### Problema
Attualmente, quando si collegano i conti bancari, il sistema scarica solo **2 anni** (730 giorni) di transazioni. Serve estendere a **3 anni** (1095 giorni).

### Modifiche previste

#### 1. Edge Function `enable-banking` - Due punti da aggiornare

**File: `supabase/functions/enable-banking/index.ts`**

Ci sono 2 occorrenze di `730 * 24 * 60 * 60 * 1000` (righe 462 e 602) che vanno cambiate in `1095 * 24 * 60 * 60 * 1000`:

- **Riga 462**: Sync iniziale durante il collegamento del conto
- **Riga 602**: Sync durante il refresh manuale ("Aggiorna")

#### 2. Edge Function `sync-bank-accounts` - Nessuna modifica

Questa function usa 30 giorni per l'auto-sync periodico, il che e corretto: la sincronizzazione automatica non deve riscaricare tutto lo storico ogni volta, ma solo le transazioni recenti. Lo storico completo di 3 anni viene scaricato solo al collegamento iniziale e al refresh manuale.

### Dettagli tecnici

```text
Prima:  730 * 24 * 60 * 60 * 1000  (2 anni)
Dopo:  1095 * 24 * 60 * 60 * 1000  (3 anni)
```

Entrambe le modifiche sono nel file `supabase/functions/enable-banking/index.ts`. Dopo la modifica, la function verra ri-deployata automaticamente.

**Nota**: La quantita di storico effettivamente disponibile dipende anche dalla banca collegata (alcune banche PSD2 forniscono massimo 18-24 mesi). Il sistema richiedera 3 anni ma ricevera quello che la banca rende disponibile.

**File modificati**: `supabase/functions/enable-banking/index.ts`
