

# Miglioramento Analisi AI Spese - Report Più Dettagliato e Specifico

## Problema Attuale

L'analisi AI attuale è troppo generica:
- Fornisce solo 3-4 aree critiche
- Suggerimenti di risparmio vaghi (max 30 parole)
- Nessuna analisi temporale (trend mensili)
- Nessun confronto con benchmark di settore
- Mancano metriche operative specifiche
- Note sui fornitori troppo brevi (max 15 parole)

## Dati Disponibili per Analisi Più Profonda

| Dato | Valore Attuale |
|------|----------------|
| Transazioni totali | 743 |
| Periodo coperto | Nov 2025 - Gen 2026 (3 mesi) |
| Spese totali | €54,803 |
| Entrate totali | €53,948 |
| Transazioni categorizzate | 393 (53%) |

## Miglioramenti Proposti

### 1. Arricchimento Dati per l'AI

Aggiungere al prompt:
- **Trend mensili**: aggregazione spese mese per mese
- **Media transazione**: importo medio per categoria
- **Frequenza pagamenti**: quante volte al mese per ogni fornitore
- **Rapporto entrate/uscite**: cash flow netto

### 2. Espansione Output AI

| Sezione | Prima | Dopo |
|---------|-------|------|
| Aree critiche | max 3-4, 20 parole | max 5-6, 50 parole con benchmark |
| Suggerimenti risparmio | max 4-5, 30 parole | max 6-8, 80 parole con step operativi |
| Analisi fornitori | max 8, 15 parole note | max 12, 40 parole con storico |
| Azioni | 3-5 generiche | 6-8 con priorità e timeline |
| **NUOVO: Trend Analysis** | - | Analisi trend 3 mesi |
| **NUOVO: Cash Flow Health** | - | Salute finanziaria |
| **NUOVO: Anomalie** | - | Transazioni anomale identificate |

### 3. Nuove Sezioni UI

- **Trend Temporale**: grafico linea spese mensili
- **Cash Flow Score**: indicatore salute finanziaria (1-100)
- **Anomalie Rilevate**: transazioni sospette o fuori media
- **Confronto Benchmark**: come si posiziona vs PMI italiane

## File da Modificare

| File | Modifica |
|------|----------|
| `supabase/functions/analyze-spending/index.ts` | Arricchire dati inviati all'AI, espandere prompt, nuove sezioni output |
| `src/hooks/useSpendingAnalysis.ts` | Aggiornare interfacce TypeScript per nuovi campi |
| `src/components/transazioni/SpendingReportModal.tsx` | Nuove sezioni UI: trend, score, anomalie |

## Dettagli Tecnici

### Edge Function - Nuovi Dati da Calcolare

```typescript
// Aggregazione mensile
const monthlySpending = new Map<string, number>();
transactions.forEach((tx) => {
  const month = tx.date.substring(0, 7); // YYYY-MM
  monthlySpending.set(month, (monthlySpending.get(month) || 0) + Math.abs(tx.amount));
});

// Frequenza pagamenti per fornitore
const supplierFrequency = topSuppliers.map(s => ({
  ...s,
  monthlyFrequency: s.transactionCount / 3, // diviso mesi
  avgTransactionAmount: s.totalAmount / s.transactionCount
}));

// Cash flow netto
const netCashFlow = totalIncome - totalSpent;
const cashFlowRatio = totalIncome / totalSpent;
```

### Prompt AI Migliorato

```
Sei un CFO virtuale senior con 20 anni di esperienza in PMI italiane.
Analizza i dati finanziari forniti e genera un report DETTAGLIATO...

NUOVE SEZIONI:
6. trendAnalysis: oggetto con:
   - monthlyTrend: array con { month, amount, change% }
   - overallTrend: "increasing" | "stable" | "decreasing"
   - seasonalPattern: pattern stagionale se identificato
   - forecast: previsione prossimo mese

7. cashFlowHealth: oggetto con:
   - score: 1-100 (salute finanziaria)
   - ratio: rapporto entrate/uscite
   - diagnosis: diagnosi dettagliata (max 60 parole)
   - riskLevel: "low" | "medium" | "high" | "critical"

8. anomalies: Array di transazioni anomale (max 5)
   - description: cosa è anomalo
   - amount: importo
   - supplier: fornitore
   - reason: perché è sospetto
   - recommendation: cosa fare

Fornisci analisi APPROFONDITA con:
- Cifre specifiche e percentuali precise
- Confronti con benchmark PMI italiane
- Step operativi concreti (non generici)
- Timeline per implementare i suggerimenti
```

### Nuove Interfacce TypeScript

```typescript
export interface TrendAnalysis {
  monthlyTrend: { month: string; amount: number; changePercent: number }[];
  overallTrend: "increasing" | "stable" | "decreasing";
  seasonalPattern: string | null;
  forecast: number;
}

export interface CashFlowHealth {
  score: number;
  ratio: number;
  diagnosis: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface Anomaly {
  description: string;
  amount: number;
  supplier: string;
  reason: string;
  recommendation: string;
}
```

### Nuove Sezioni UI

1. **Cash Flow Score Card** - Indicatore visivo 0-100 con colore
2. **Trend Chart** - LineChart con spese mensili
3. **Anomalie Section** - Lista transazioni sospette con alert
4. **Suggerimenti Espansi** - Accordion con dettagli e step

## Risultato Atteso

L'analisi passerà da un report generico di 4-5 bullet point a un report completo da CFO con:
- Analisi trend su 3 mesi
- Score salute finanziaria
- Anomalie identificate
- Suggerimenti con step operativi e timeline
- Confronto con benchmark di settore
- Previsioni cash flow

