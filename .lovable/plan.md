

# Conto Economico con dati dai Movimenti e Analisi AI

## Problema attuale
Il Conto Economico prende dati solo dalle **fatture** (tabella `invoices`). I **movimenti bancari** (tabella `bank_transactions`) non vengono utilizzati, quindi il report e' incompleto.

## Soluzione

Integrare i movimenti bancari nel Conto Economico e aggiungere una sezione di **analisi AI** che genera un report intelligente sui dati aggregati.

### 1. Aggiornare l'hook `useContoEconomico.ts`

Oltre alle fatture, il hook carichera anche i movimenti bancari (`bank_transactions`) per l'anno selezionato:
- **Ricavi da movimenti**: transazioni con `amount > 0`, aggregate per mese
- **Costi da movimenti**: transazioni con `amount < 0`, categorizzate tramite `ai_category_id` e aggregate per mese
- I dati dei movimenti verranno mostrati come righe separate nella tabella, cosi l'utente vede sia i dati da fatture che da movimenti

### 2. Creare edge function `analyze-conto-economico`

Una nuova edge function dedicata che:
- Riceve anno e dati aggregati (ricavi, costi, margini) dal frontend
- Invia il tutto a Lovable AI (Gemini) con un prompt specifico da CFO
- Restituisce un report strutturato con:
  - **Score di salute economica** (1-100)
  - **Trend dei margini** e confronto con benchmark PMI
  - **Aree critiche** identificate
  - **Suggerimenti operativi** con priorita e timeline
  - **Previsioni** per i mesi successivi

### 3. Aggiornare `ContoEconomicoTab.tsx`

- Aggiungere righe per "Ricavi da movimenti bancari" e "Costi da movimenti bancari"
- Aggiungere un pulsante **"Analisi AI"** sopra la tabella
- Mostrare sotto la tabella una sezione con il report AI che include:
  - Card con score di salute e indicatori chiave
  - Lista di suggerimenti con priorita
  - Aree critiche evidenziate
  - Azioni raccomandate

### 4. File coinvolti

| File | Azione |
|------|--------|
| `src/hooks/useContoEconomico.ts` | Modificare: aggiungere query su `bank_transactions` |
| `supabase/functions/analyze-conto-economico/index.ts` | Creare: edge function AI per analisi conto economico |
| `src/components/area-economica/ContoEconomicoTab.tsx` | Modificare: aggiungere righe movimenti + sezione AI report |
| `src/components/area-economica/AIReportSection.tsx` | Creare: componente per visualizzare il report AI |
| `supabase/config.toml` | Modificare: registrare nuova edge function |

### 5. Dettagli tecnici

**Hook aggiornato** - aggiungera una query parallela:
```
bank_transactions -> select amount, date, ai_category_id
                  -> filtro per anno
                  -> aggregazione per mese
```

Nuovi campi nel return: `ricaviMovimenti`, `costiMovimentiPerCategoria`, `costiMovimentiTotali`

**Edge function** - usa Lovable AI (LOVABLE_API_KEY gia configurato) con modello `google/gemini-3-flash-preview`. Riceve i dati aggregati dal frontend (non fa query al DB), analizza e restituisce JSON strutturato.

**UI** - Pulsante "Genera Analisi AI" con stato di loading. Il report viene mostrato in cards sotto la tabella con score, suggerimenti e azioni. Gestione errori 429/402 con toast.

