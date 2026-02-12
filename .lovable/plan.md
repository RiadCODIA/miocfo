

# Aggiornamento pagina Collegamenti

## Cosa cambia

La pagina **Collegamenti** attualmente mostra 3 card statiche (Collegamento Bancario, Software di Fatturazione, Gateway di Pagamento) tutte con stato "Non connesso" e senza funzionalita reale.

L'obiettivo e trasformarla in un hub funzionale che:

1. **Aggiunge la card "Cassetto Fiscale"** (A-Cube) con il modale gia creato per inserire le credenziali Fisconline
2. **Rende funzionale la card "Collegamento Bancario"** collegandola al modale di connessione banca gia esistente (`ConnectBankModal`)
3. **Mostra lo stato reale** delle connessioni (leggendo dal database se ci sono conti bancari collegati o fatture importate dal cassetto fiscale)

## Card previste

| Card | Icona | Stato | Azione click |
|------|-------|-------|-------------|
| Collegamento Bancario | Building2 | Connesso se ci sono conti in `bank_accounts` | Apre `ConnectBankModal` / gestisci |
| Cassetto Fiscale (A-Cube) | ShieldCheck | Connesso se ci sono fatture con `source = 'cassetto_fiscale'` | Apre `CassettoFiscaleModal` / scarica fatture |
| Software di Fatturazione | FileSpreadsheet | Non connesso (futuro) | Placeholder |
| Gateway di Pagamento | CreditCard | Non connesso (futuro) | Placeholder |

## Dettagli tecnici

### File modificato: `src/pages/Collegamenti.tsx`

- Importare `ConnectBankModal`, `CassettoFiscaleModal`, e i hook necessari
- Aggiungere query al database per verificare lo stato reale delle connessioni:
  - `bank_accounts` con `count` per sapere se ci sono conti collegati
  - `invoices` con filtro `source = 'cassetto_fiscale'` per sapere se il cassetto e collegato
- Gestire lo state per apertura/chiusura dei modali
- Rendere i pulsanti "Collega" / "Gestisci" funzionali per le card bancarie e cassetto fiscale
- Le card "Software di Fatturazione" e "Gateway di Pagamento" restano come placeholder per sviluppi futuri

