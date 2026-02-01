

## Piano: Fix Endpoint Transazioni + Rimozione Pulsante "Ricollega"

## Problema Identificato

Dall'analisi approfondita ho trovato 2 problemi:

### 1. Header PSU Mancanti per le Transazioni

La documentazione di Enable Banking mostra che l'endpoint `/accounts/{id}/transactions` accetta header PSU opzionali:
- `Psu-Ip-Address`
- `Psu-User-Agent`
- `Psu-Referer`
- `Psu-Accept`
- `Psu-Accept-Language`
- `Psu-Geo-Location`

Alcune banche PSD2 italiane (come BCC di Cherasco) potrebbero richiedere questi header per le transazioni, anche se sono marcati come "opzionali" nella documentazione. Il fatto che i **saldi funzionino** ma le **transazioni falliscano** suggerisce che la banca ha requisiti più stringenti per l'accesso ai movimenti.

### 2. Pulsante "Ricollega" Non Funzionante

Il pulsante "Ricollega" apre la modale di connessione ma non gestisce correttamente la riconnessione di un conto esistente, creando confusione.

---

## Soluzione Proposta

### Parte A: Aggiungere Header PSU alle Richieste Transazioni

Modificare la funzione `enableBankingRequest` per accettare header PSU opzionali e passarli alle chiamate API per le transazioni:

```text
File: supabase/functions/enable-banking/index.ts

1. Aggiornare la firma della funzione enableBankingRequest per accettare header opzionali:
   
   async function enableBankingRequest(
     endpoint: string,
     method: string = "GET",
     body?: Record<string, unknown>,
     psuHeaders?: Record<string, string>  // NUOVO
   )

2. Unire gli header PSU se presenti:

   const headers: Record<string, string> = {
     "Authorization": `Bearer ${jwt}`,
     "Content-Type": "application/json",
     ...psuHeaders,  // NUOVO
   };

3. Nelle funzioni che chiamano l'endpoint transactions, passare header PSU:

   // In syncAccountTransactions()
   const psuHeaders = {
     "Psu-Ip-Address": "0.0.0.0",  // Edge function, IP non disponibile
     "Psu-User-Agent": "Finexa/1.0",
     "Psu-Accept": "application/json",
     "Psu-Accept-Language": "it-IT",
   };
   
   const transactionsResponse = await enableBankingRequest(url, "GET", undefined, psuHeaders);
```

### Parte B: Rimuovere Pulsante "Ricollega"

```text
File: src/components/conti-bancari/BankAccountCard.tsx

1. Rimuovere la prop onReconnect dall'interfaccia
2. Rimuovere lo stato isReconnecting e la funzione handleReconnect
3. Rimuovere il pulsante "Ricollega" dal JSX
4. Cambiare il testo dello status "error" da "Riconnessione richiesta" a "Errore sincronizzazione"

File: src/pages/ContiBancari.tsx

1. Rimuovere la funzione handleReconnect
2. Rimuovere lo stato reconnectAccountId
3. Rimuovere la prop onReconnect passata a BankAccountCard
```

### Parte C: Migliorare Messaggio Errore per ASPSP_ERROR

```text
File: supabase/functions/enable-banking/index.ts

Nella gestione errori di syncAccount, cambiare il messaggio per ASPSP_ERROR:

Prima:
"Errore banca (ASPSP_ERROR): la banca non ha risposto correttamente tramite PSD2. 
 Riprova più tardi o ricollega il conto."

Dopo:
"La banca non ha risposto correttamente. Riprova tra qualche minuto. 
 Se il problema persiste, scollega e ricollega il conto."
```

---

## File da Modificare

| File | Modifica |
|------|----------|
| `supabase/functions/enable-banking/index.ts` | Aggiungere header PSU alle richieste transazioni |
| `src/components/conti-bancari/BankAccountCard.tsx` | Rimuovere pulsante "Ricollega" e aggiornare stato |
| `src/pages/ContiBancari.tsx` | Rimuovere logica handleReconnect |

---

## Risultato Atteso

1. Le richieste transazioni includeranno gli header PSU che alcune banche italiane richiedono
2. Il pulsante "Ricollega" (che non funzionava) sarà rimosso
3. L'utente vedrà messaggi di errore più chiari
4. Per ricollegare, l'utente dovrà scollegare e collegare di nuovo (flusso funzionante)

---

## Nota Importante

Se anche con gli header PSU la banca BCC di Cherasco continua a dare errore ASPSP_ERROR, significa che:
- La banca ha un problema temporaneo sul loro sistema PSD2
- Oppure è necessario ricollegare il conto per ottenere un nuovo consenso

In quel caso, l'unica soluzione è:
1. Scollegare il conto (pulsante cestino)
2. Collegare nuovamente il conto (pulsante "Collega nuovo conto")

