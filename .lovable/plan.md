
# Integrazione Cassetto Fiscale con A-Cube

## Cosa fa

Collegando il Cassetto Fiscale tramite A-Cube, il software potra:
- **Scaricare automaticamente** tutte le fatture attive e passive dal portale dell'Agenzia delle Entrate
- **Importarle nella sezione Fatture** senza doverle caricare manualmente
- **Schedulare il download giornaliero** per avere le fatture sempre aggiornate

## Prerequisiti per l'utente

Per collegare il Cassetto Fiscale servono le credenziali **Fisconline** dell'azienda:
- **Codice Fiscale** dell'azienda
- **Password** del portale Agenzia delle Entrate
- **PIN** Fisconline

Se l'azienda non ha queste credenziali, puo richiederle dal [portale dell'Agenzia delle Entrate](https://ivaservizi.agenziaentrate.gov.it/portale/).

In alternativa, A-Cube supporta anche la modalita "Appointee" (delegato) o "Proxy" (delega unificata) per evitare di condividere le credenziali dirette.

## Architettura

```text
Frontend (Fatture.tsx)
    |
    v
Edge Function "acube-cassetto-fiscale"
    |
    +-- POST /business-registry-configurations  (crea azienda su A-Cube Gov IT)
    +-- PUT  /business-registry-configurations/{id}/credentials/fisconline  (salva credenziali)
    +-- POST /schedule/invoice-download/{fiscal_id}  (attiva download giornaliero)
    +-- POST /jobs/invoice-download  (download on-demand)
    +-- GET  /invoices?fiscal_id=...  (recupera fatture scaricate)
    |
    v
Database (tabella invoices)
```

## File da creare/modificare

| File | Azione |
|------|--------|
| `supabase/functions/acube-cassetto-fiscale/index.ts` | **Creare**: nuova edge function per Gov IT API |
| `src/components/fatture/CassettoFiscaleModal.tsx` | **Creare**: modale per inserire credenziali Fisconline |
| `src/pages/Fatture.tsx` | **Modificare**: aggiungere pulsante "Collega Cassetto Fiscale" e "Scarica dal Cassetto" |
| `supabase/config.toml` | **Modificare**: aggiungere configurazione per la nuova edge function |

## Dettagli tecnici

### 1. Edge Function `acube-cassetto-fiscale`

Nuova edge function che usa lo stesso login A-Cube (`ACUBE_EMAIL`, `ACUBE_PASSWORD`) ma chiama l'API Gov IT:
- **Base URL sandbox**: `https://gov-it-sandbox.api.acubeapi.com`
- **Base URL produzione**: `https://api.acubeapi.com`

Azioni supportate:

- **`setup`**: Crea un `BusinessRegistryConfiguration` per il codice fiscale e salva le credenziali Fisconline
- **`schedule`**: Attiva il download automatico giornaliero delle fatture dal Cassetto Fiscale
- **`download-now`**: Avvia un download on-demand per un intervallo di date specifico
- **`fetch-invoices`**: Recupera le fatture scaricate da A-Cube e le importa nella tabella `invoices` del database
- **`status`**: Verifica lo stato della connessione e dello schedule

### 2. Modale Credenziali Fisconline

Un componente `CassettoFiscaleModal.tsx` con form per:
- Codice Fiscale / Partita IVA
- Password portale Agenzia delle Entrate
- PIN Fisconline

Le credenziali vengono inviate all'edge function che le salva su A-Cube (A-Cube le cripta e gestisce il rinnovo password).

### 3. Modifiche pagina Fatture

- Nuovo pulsante **"Collega Cassetto Fiscale"** nell'header
- Una volta collegato, il pulsante diventa **"Scarica dal Cassetto"** per importare le fatture
- Le fatture scaricate dal Cassetto vengono inserite nella stessa tabella `invoices` con un campo che indica la fonte (`source: "cassetto_fiscale"`)
- Badge visivo per distinguere le fatture importate dal Cassetto da quelle caricate manualmente

### 4. Flusso utente

1. L'utente clicca "Collega Cassetto Fiscale"
2. Inserisce codice fiscale, password e PIN nel modale
3. Il sistema crea il Business Registry su A-Cube e salva le credenziali
4. (Opzionale) L'utente attiva il download automatico giornaliero
5. L'utente puo cliccare "Scarica dal Cassetto" per importare le fatture immediatamente
6. Le fatture appaiono nella tabella con tutte le informazioni estratte (numero, data, fornitore, importo)

### 5. Migrazione database

Aggiungere un campo `source` alla tabella `invoices` per distinguere la provenienza:
- `manual` - caricata manualmente dall'utente
- `cassetto_fiscale` - importata dal Cassetto Fiscale
- `null` - fatture esistenti (default)

Aggiungere anche un campo `acube_invoice_id` per evitare duplicati durante le sincronizzazioni successive.

### Note

- Le credenziali Fisconline scadono ogni 90 giorni. A-Cube invia email di notifica automaticamente.
- Le fatture nel Cassetto Fiscale possono impiegare fino a 72 ore per essere disponibili dopo l'emissione.
- Il download dell'archivio completo include le fatture dal 1 gennaio dell'anno precedente.
