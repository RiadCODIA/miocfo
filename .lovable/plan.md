
# Allineamento Sidebar al Design di Riferimento

## Cosa manca nella sidebar attuale

Confrontando con lo screenshot di riferimento, vanno aggiunte 3 voci mancanti e riorganizzata la struttura.

## Modifiche previste

### 1. Nuove pagine da creare
- **Collegamenti** (`/collegamenti`) - Pagina per gestire integrazioni e collegamenti esterni (es. banche, software contabili)
- **Comunicazioni** (`/comunicazioni`) - Pagina per messaggi e comunicazioni interne
- **AI Assistant** (`/ai-assistant`) - Pagina con chatbot AI per assistenza finanziaria

### 2. Aggiornamento Sidebar
La struttura della navigazione verra riorganizzata cosi:

**NAVIGAZIONE**
- Dashboard
- Collegamenti (NUOVA)
- Conti & Transazioni

**GESTIONE BUSINESS** (collapsible, con sotto-gruppi)
- Area finanziaria: Fatture, Flussi di Cassa, Scadenzario
- Area economica: Budget & Previsioni, Movimenti

**ANALYTICS & AI**
- Dati & Statistiche (rinominata da "KPI & Report")
- Notifiche
- Comunicazioni (NUOVA)
- AI Assistant (NUOVA, con badge "New")

### 3. File coinvolti

| File | Azione |
|------|--------|
| `src/pages/Collegamenti.tsx` | Creare - pagina integrazioni |
| `src/pages/Comunicazioni.tsx` | Creare - pagina comunicazioni |
| `src/pages/AIAssistant.tsx` | Creare - pagina AI chatbot |
| `src/components/layout/Sidebar.tsx` | Modificare - aggiungere voci e riorganizzare gruppi |
| `src/App.tsx` | Modificare - aggiungere le 3 nuove route protette |

### 4. Dettagli tecnici

- Le nuove pagine avranno inizialmente un layout placeholder con header, descrizione e contenuto base funzionante
- La pagina **Collegamenti** mostrera le integrazioni disponibili (banche, software) con stato connesso/non connesso
- La pagina **Comunicazioni** avra una lista di messaggi/notifiche con filtri
- La pagina **AI Assistant** avra un'interfaccia chat per interagire con l'AI
- Il badge "New" sull'AI Assistant sara implementato con lo stesso pattern del badge notifiche esistente
- La sidebar supportera sotto-gruppi dentro "GESTIONE BUSINESS" per separare area finanziaria e area economica
