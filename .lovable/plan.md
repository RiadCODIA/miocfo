

# Fix: Persistenza notifiche e navigazione al click

## Problemi identificati

1. **Il filtro "Tipo" non funziona correttamente**: I valori del filtro tipo sono "warning", "error", "info", "success" ma i tipi degli alert nel database sono "scadenza", "budget", "liquidita", "fattura", "sync". Il filtro non corrisponde mai.

2. **Manca la navigazione al click**: Cliccando su una notifica non succede nulla. Serve navigare alla pagina corrispondente (es. Budget -> /budget, Scadenza -> /scadenzario).

3. **Le azioni read/delete funzionano** ma le azioni sono visibili solo per gli alert "Non letti". Dopo aver segnato come letto, scompare il pulsante di eliminazione. Serve mostrare il pulsante di eliminazione anche per gli alert letti.

## Soluzione

### 1. Correggere il filtro per tipo

Cambiare le opzioni del filtro tipo per riflettere i tipi reali degli alert:

| Valore filtro | Label |
|---|---|
| all | Tutti i tipi |
| budget | Budget |
| scadenza | Scadenza |
| liquidita | Liquidita |
| fattura | Fattura |
| sync | Sincronizzazione |

### 2. Aggiungere `action_url` alla creazione degli alert

Nella edge function `check-alerts`, aggiungere il campo `action_url` a ogni alert:

| Tipo alert | URL destinazione |
|---|---|
| scadenza | /scadenzario |
| budget | /budget |
| liquidita | /flussi-cassa |
| fattura | /fatture |
| sync | /conti-bancari |

### 3. Rendere le righe cliccabili

Nel componente `AlertNotifiche.tsx`:
- Aggiungere `useNavigate` da react-router-dom
- Al click sulla riga, se l'alert ha un `actionUrl`, navigare a quella pagina
- Aggiungere cursore pointer e stile hover per indicare la cliccabilita
- Segnare automaticamente l'alert come letto al click

### 4. Mostrare il pulsante elimina anche per alert letti

Attualmente il blocco azioni e visibile solo se `!alert.isRead`. Separare la logica: mostrare il check solo per non-letti, ma il pulsante X (elimina) sempre.

## File da modificare

| File | Modifiche |
|---|---|
| `supabase/functions/check-alerts/index.ts` | Aggiungere `action_url` a ogni `createAlert` |
| `src/pages/AlertNotifiche.tsx` | Fix filtro tipo, righe cliccabili con navigazione, pulsante elimina sempre visibile |

## Dettagli tecnici

### Modifica alla funzione `createAlert`

Aggiungere il parametro `action_url` alla firma e all'insert:

```text
createAlert(supabase, userId, {
  type: "budget",
  title: "...",
  message: "...",
  severity: "error",
  action_url: "/budget"     // <-- nuovo campo
})
```

### Navigazione nel componente

```text
const navigate = useNavigate();

// Al click sulla riga:
onClick={() => {
  if (!alert.isRead) handleMarkAsRead(alert.id);
  if (alert.actionUrl) navigate(alert.actionUrl);
}}
```

### Pulsante elimina sempre visibile

Il pulsante Check (segna come letto) viene mostrato solo per alert non letti, mentre il pulsante X (elimina) viene sempre mostrato.

