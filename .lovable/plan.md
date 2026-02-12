
# Sbloccare l'Analisi Categorie nella Dashboard

## Obiettivo
Sostituire la card "bloccata" (con lucchetto e pulsante Upgrade) con un grafico a torta/donut reale che mostra la distribuzione delle spese per categoria, usando i dati gia presenti nel database.

## Cosa cambia

### 1. Nuovo componente `CategoryAnalysisCard`
- Rimuovere completamente il contenuto attuale (icona lucchetto, testo upgrade, bottone)
- Inserire un **grafico a torta (PieChart)** di Recharts che mostra le categorie di spesa
- Sotto il grafico, una lista compatta delle top categorie con importo e percentuale
- Stato di caricamento con Skeleton
- Messaggio informativo se non ci sono dati categorizzati

### 2. Nuovo hook per i dati
- Creare una query che unisce `bank_transactions` con `cost_categories` tramite `ai_category_id`
- Raggruppa per categoria, calcola totale e percentuale
- Ordina per importo decrescente

## Dettagli tecnici

**File modificati:**
- `src/components/dashboard/CategoryAnalysisCard.tsx` -- riscrittura completa: PieChart Recharts con colori distinti per categoria, legenda, e fallback se vuoto

**Dati:** La query usera `bank_transactions.ai_category_id` joinato con `cost_categories.name` per ottenere nome categoria e somma importi (solo transazioni negative = spese).

**Librerie:** Recharts gia installato, nessuna dipendenza aggiuntiva.
