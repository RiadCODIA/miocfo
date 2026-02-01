
# Correzione Registrazione: Email Non Ricevuta

## Problema Identificato

La registrazione richiede la conferma via email, ma l'email di Supabase non arriva. Questo può accadere per:
- Limite di email di Supabase raggiunto
- Email finita nello spam
- Servizio email di base non configurato correttamente

## Soluzioni Proposte

### Opzione A: Disabilitare Conferma Email (Consigliata per Sviluppo)

Vai su **Supabase Dashboard > Authentication > Providers > Email** e:
1. Disabilita "Confirm email"
2. Gli utenti potranno accedere immediatamente dopo la registrazione

Link diretto: https://supabase.com/dashboard/project/ublsnradzhfpqhunfqbn/auth/providers

### Opzione B: Configurare Servizio Email Custom (Consigliato per Produzione)

Se vuoi mantenere la conferma email in produzione, devi configurare un servizio email esterno come **Resend**:

1. Creare account su https://resend.com
2. Verificare il tuo dominio email
3. Creare API key su https://resend.com/api-keys
4. Configurare la chiave in Supabase

## Dettagli Tecnici

### Stato Attuale
- L'app usa `supabase.auth.signUp()` con `emailRedirectTo` configurato correttamente
- La registrazione viene chiamata ma l'email non arriva
- Nel database ci sono solo 2 utenti esistenti (nessun nuovo signup recente)

### Verifica Immediata

Per verificare se la registrazione ha funzionato ma l'email non è arrivata:
1. Controlla la cartella Spam della tua email
2. Vai su Supabase Dashboard > Authentication > Users per vedere se l'utente è stato creato
3. Se l'utente esiste ma non è confermato, puoi confermarlo manualmente dal dashboard

### Configurazione Alternativa: Auto-conferma Email

Se preferisci mantenere il flusso email ma sbloccare gli utenti esistenti:
1. Vai su Authentication > Users
2. Trova l'utente non confermato
3. Clicca sui tre puntini e seleziona "Confirm email"

## Azioni Richieste

1. **Controllo immediato**: Verifica in Supabase Dashboard se l'utente consulente è stato creato
2. **Per sviluppo**: Disabilita "Confirm email" nelle impostazioni
3. **Per produzione**: Configura Resend per email affidabili

## Link Utili

- [Impostazioni Auth Supabase](https://supabase.com/dashboard/project/ublsnradzhfpqhunfqbn/auth/providers)
- [Utenti registrati](https://supabase.com/dashboard/project/ublsnradzhfpqhunfqbn/auth/users)
