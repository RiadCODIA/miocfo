
Obiettivo: eliminare del tutto la ricarica AI e passare a limiti mensili fissi per piano, con contatori reali per AI Assistant e Analisi AI Transazioni.

Cosa ho verificato
- Oggi il sistema AI è basato su budget in euro (`ai_monthly_limit_eur`) + ricariche (`credit_recharged`, `num_recharges`).
- La ricarica è esposta in più punti:
  - `src/hooks/useAIUsage.ts`
  - `src/pages/AIAssistant.tsx`
  - `src/components/AIBlockBanner.tsx`
  - `src/components/payment/AIRechargeModal.tsx`
  - `src/pages/Fatture.tsx`
  - vari edge functions che bloccano con messaggi tipo “Ricarica il credito”.
- `analyze-spending` oggi non salva alcun documento e non applica un tetto mensile per numero di analisi.
- Lo schema attuale non ha contatori dedicati per:
  - messaggi AI Assistant inviati nel mese
  - analisi AI Transazioni effettuate nel mese

Implementazione proposta

1. Sostituire il modello “crediti/ricarica” con “quote per piano”
- Impostare i limiti:
  - Small: 50 messaggi AI / mese, 3 analisi AI / mese
  - Pro: 60 messaggi AI / mese, 3 analisi AI / mese
  - Full: 100 messaggi AI / mese, 5 analisi AI / mese
- Non userò più il budget in euro come logica primaria per Assistant e Analisi Transazioni.

2. Aggiornare il modello dati
- Estendere `subscription_plans` con campi dedicati ai limiti:
  - `ai_assistant_messages_limit_monthly`
  - `ai_transaction_analyses_limit_monthly`
- Estendere `ai_usage_monthly` con contatori:
  - `assistant_messages_used`
  - `transaction_analyses_used`
- Aggiungere una tabella documenti per salvare ogni analisi AI Transazioni, ad esempio:
  - `ai_analysis_documents`
  - con `user_id`, `month_year`, `analysis_type`, `title`, `payload`, `created_at`
- Mantengo RLS coerente: ogni utente vede solo i propri documenti.

3. Togliere la ricarica dall’app
- Rimuovere dalla UI:
  - modal ricarica
  - bottoni “Ricarica”
  - banner e testi che invitano alla ricarica
- Sostituire i messaggi con copy basato sul piano:
  - “Hai raggiunto il limite mensile del tuo piano”
  - CTA unica: upgrade piano
- Allineare:
  - `AIAssistant`
  - `AIBlockBanner`
  - `Fatture`
  - `KPIReport`
  - altri messaggi AI dove oggi compare “crediti/ricarica”

4. Far funzionare il limite nell’AI Assistant
- In `useAIUsage.ts` cambiare il ritorno dati:
  - limiti per piano
  - usati/rimanenti per messaggi
  - usati/rimanenti per analisi
- In `src/pages/AIAssistant.tsx` mostrare chiaramente il contatore:
  - es. `12 / 50 messaggi usati questo mese`
- Bloccare l’invio quando il tetto è raggiunto.
- In `supabase/functions/ai-assistant/index.ts`:
  - leggere il piano attivo
  - controllare `assistant_messages_used`
  - incrementare il contatore solo quando parte una richiesta valida

5. Far funzionare il limite nelle Analisi AI Transazioni
- In `supabase/functions/analyze-spending/index.ts`:
  - controllare il limite mensile del piano
  - incrementare `transaction_analyses_used`
  - salvare ogni risultato generato come documento persistente
- In `src/hooks/useSpendingAnalysis.ts`:
  - aggiornare i messaggi errore da “crediti” a “limite mensile”
- In `src/components/transazioni/SpendingReportModal.tsx`:
  - mostrare contatore tipo `2 / 3 analisi usate`
  - mantenere il report corrente
  - aggiungere accesso all’archivio analisi salvate

6. Mostrare i documenti salvati in Transazioni
- Aggiungere una lista/archivio nella pagina Transazioni o nel modal report:
  - titolo analisi
  - data creazione
  - periodo analizzato
  - pulsante apri / rileggi
- Ogni nuova analisi diventa un documento consultabile anche dopo refresh.

7. Aggiornare Piani e Abbonamento
- In pricing e impostazioni, sostituire il linguaggio “crediti AI / €/mese” con:
  - messaggi AI mensili
  - analisi AI mensili
- In `Impostazioni > Abbonamento` mostrare i contatori reali:
  - messaggi usati / limite
  - analisi usate / limite
  - niente ricarica, niente crediti aggiuntivi

8. Pulizia tecnica della ricarica
- Disattivare l’uso di:
  - `create-ai-recharge-checkout`
  - `stripe-webhook-ai-recharge`
  - `AIRechargeModal`
- Ripulire `supabase/config.toml` e i riferimenti front-end.
- Valuterò se lasciare temporaneamente i vecchi campi DB (`credit_recharged`, `num_recharges`, `cost_accumulated`) per compatibilità, ma non saranno più usati dalla nuova logica.

Dettaglio tecnico
- Frontend principali:
  - `src/hooks/useAIUsage.ts`
  - `src/pages/AIAssistant.tsx`
  - `src/hooks/useSpendingAnalysis.ts`
  - `src/components/transazioni/SpendingReportModal.tsx`
  - `src/components/AIBlockBanner.tsx`
  - `src/pages/Impostazioni.tsx`
  - `src/pages/PianiPricing.tsx`
  - `src/components/payment/PaymentMethodModal.tsx`
- Backend principali:
  - `supabase/functions/ai-assistant/index.ts`
  - `supabase/functions/analyze-spending/index.ts`
  - nuove migration Supabase per quote + documenti
- Pulizia ricarica:
  - `supabase/functions/create-ai-recharge-checkout/index.ts`
  - `supabase/functions/stripe-webhook-ai-recharge/index.ts`

Risultato finale
- Nessuna ricarica AI.
- Limiti chiari e fissi per piano.
- AI Assistant con numero massimo di messaggi mensili realmente bloccante.
- Analisi AI Transazioni con numero massimo mensile realmente bloccante.
- Ogni analisi AI Transazioni salvata come documento consultabile.
- Sezione Abbonamento aggiornata con utilizzo reale invece dei crediti.
