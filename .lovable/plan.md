

# Recuperare tutte le transazioni da Revolut

## Problema identificato

Due limitazioni impediscono di vedere tutte le transazioni:

1. **Edge function `enable-banking`**: Le funzioni `syncToDatabase` (riga 397) e `syncSingleAccount` (riga 537) calcolano la data di inizio come `Date.now() - 90 giorni`. Questo scarica solo 3 mesi di storico.

2. **Hook `useTransactions`**: Ha un `.limit(500)` che taglia i risultati se ci sono piu di 500 transazioni.

3. **Paginazione API Enable Banking**: L'API potrebbe restituire le transazioni in pagine (continuation token), ma il codice attuale non gestisce la paginazione.

## Soluzione

### 1. Estendere il periodo di sync nella edge function

Cambiare la finestra di sincronizzazione da 90 giorni a **730 giorni (2 anni)** sia in `syncToDatabase` che in `syncSingleAccount`. Enable Banking PSD2 supporta tipicamente fino a 2 anni di storico.

**File:** `supabase/functions/enable-banking/index.ts`
- Riga 397: `90 * 24 * 60 * 60 * 1000` diventa `730 * 24 * 60 * 60 * 1000`
- Riga 537: stessa modifica

### 2. Gestire la paginazione dell'API Enable Banking

La funzione `getAccountTransactions` deve gestire il `continuation_key` restituito dall'API per scaricare tutte le pagine di transazioni, non solo la prima.

**File:** `supabase/functions/enable-banking/index.ts`
- Modificare `getAccountTransactions` per iterare finche c'e un `continuation_key` nella risposta

### 3. Rimuovere il limite di 500 nel hook useTransactions

Aumentare o rimuovere il `.limit(500)` per permettere di caricare tutte le transazioni disponibili nel periodo selezionato.

**File:** `src/hooks/useTransactions.ts`
- Rimuovere `.limit(500)` o aumentare a 5000

### 4. Aggiungere opzione "Tutto" nei preset della TopBar

Aggiungere un preset "Tutto il periodo" che non applica filtri di data, cosi l'utente puo vedere tutte le transazioni storiche.

**File:** `src/components/layout/TopBar.tsx`
- Aggiungere opzione con range molto ampio (es. dal 2020 a oggi)

### File coinvolti

| File | Azione |
|------|--------|
| `supabase/functions/enable-banking/index.ts` | Modificare: estendere periodo sync + paginazione API |
| `src/hooks/useTransactions.ts` | Modificare: rimuovere limit(500) |
| `src/components/layout/TopBar.tsx` | Modificare: aggiungere preset "Tutto il periodo" |

### Note importanti

- Dopo il deploy, sara necessario **ri-sincronizzare** il conto Revolut dalla pagina Conti Bancari per scaricare lo storico completo
- La prima sincronizzazione sara piu lenta perche scarichera 2 anni di dati

