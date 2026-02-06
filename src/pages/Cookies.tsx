import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { Card } from "@/components/ui/card";

export default function Cookies() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="Gennaio 2026">
      <LegalSection title="1. Cosa sono i Cookie">
        <p>
          I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo 
          (computer, tablet o smartphone) quando visiti un sito web. I cookie permettono al sito 
          di riconoscerti e ricordare le tue preferenze durante la navigazione.
        </p>
        <p className="mt-3">
          mioCFO utilizza i cookie per garantire il corretto funzionamento della piattaforma, 
          migliorare l'esperienza utente e analizzare l'utilizzo del servizio.
        </p>
      </LegalSection>

      <LegalSection title="2. Tipologie di Cookie Utilizzati">
        <div className="space-y-4 mt-4">
          <Card className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Cookie Tecnici (Necessari)</h4>
            <p className="text-sm text-muted-foreground">
              Questi cookie sono essenziali per il funzionamento della piattaforma e non possono 
              essere disattivati. Includono cookie per l'autenticazione, la sicurezza e la gestione 
              della sessione utente.
            </p>
            <ul className="list-disc pl-6 mt-2 text-sm text-muted-foreground space-y-1">
              <li><strong>Autenticazione:</strong> mantengono la sessione di login attiva</li>
              <li><strong>Sicurezza:</strong> proteggono da attacchi CSRF e altre minacce</li>
              <li><strong>Preferenze:</strong> memorizzano le impostazioni dell'interfaccia (es. tema)</li>
            </ul>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Cookie di Sessione</h4>
            <p className="text-sm text-muted-foreground">
              Sono cookie temporanei che vengono eliminati automaticamente quando chiudi il browser. 
              Servono a mantenere la continuità della navigazione durante una singola sessione.
            </p>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Cookie Persistenti</h4>
            <p className="text-sm text-muted-foreground">
              Rimangono sul tuo dispositivo per un periodo definito o fino alla loro cancellazione 
              manuale. Vengono utilizzati per ricordare le tue preferenze tra una visita e l'altra.
            </p>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Cookie Analitici</h4>
            <p className="text-sm text-muted-foreground">
              Ci aiutano a capire come gli utenti utilizzano la piattaforma, quali pagine sono 
              più visitate e dove si verificano eventuali problemi. I dati sono raccolti in forma 
              aggregata e anonima.
            </p>
          </Card>
        </div>
      </LegalSection>

      <LegalSection title="3. Cookie di Terze Parti">
        <p>
          La piattaforma mioCFO può utilizzare servizi di terze parti che installano propri cookie:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>
            <strong>Supabase:</strong> per l'autenticazione e la gestione delle sessioni utente. 
            I cookie di Supabase sono necessari per il funzionamento del servizio.
          </li>
          <li>
            <strong>Enable Banking:</strong> durante il processo di collegamento del conto bancario, 
            potrebbero essere utilizzati cookie tecnici per la gestione del flusso di autenticazione.
          </li>
        </ul>
        <p className="mt-3">
          Non utilizziamo cookie di profilazione pubblicitaria o di marketing di terze parti.
        </p>
      </LegalSection>

      <LegalSection title="4. Elenco dei Cookie">
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold text-foreground">Nome</th>
                <th className="text-left py-2 px-3 font-semibold text-foreground">Tipo</th>
                <th className="text-left py-2 px-3 font-semibold text-foreground">Durata</th>
                <th className="text-left py-2 px-3 font-semibold text-foreground">Finalità</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2 px-3">sb-*-auth-token</td>
                <td className="py-2 px-3">Tecnico</td>
                <td className="py-2 px-3">Sessione</td>
                <td className="py-2 px-3">Autenticazione Supabase</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-3">sb-refresh-token</td>
                <td className="py-2 px-3">Tecnico</td>
                <td className="py-2 px-3">7 giorni</td>
                <td className="py-2 px-3">Rinnovo sessione</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-3">theme</td>
                <td className="py-2 px-3">Preferenze</td>
                <td className="py-2 px-3">1 anno</td>
                <td className="py-2 px-3">Preferenza tema</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="5. Gestione delle Preferenze">
        <p>
          Puoi gestire le tue preferenze sui cookie in diversi modi:
        </p>
        
        <h4 className="font-semibold text-foreground mt-4 mb-2">Impostazioni del Browser</h4>
        <p>
          La maggior parte dei browser ti permette di controllare i cookie attraverso le impostazioni. 
          Puoi bloccare tutti i cookie, accettare solo alcuni o ricevere un avviso quando un sito 
          tenta di impostare un cookie.
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Safari</a></li>
          <li><a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
        </ul>

        <h4 className="font-semibold text-foreground mt-4 mb-2">Conseguenze della Disattivazione</h4>
        <p>
          Tieni presente che disattivare i cookie tecnici potrebbe compromettere il funzionamento 
          della piattaforma mioCFO. In particolare:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Potresti non riuscire ad effettuare il login</li>
          <li>Le preferenze non verranno salvate</li>
          <li>Alcune funzionalità potrebbero non essere disponibili</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Aggiornamenti">
        <p>
          Questa Cookie Policy potrebbe essere aggiornata periodicamente per riflettere modifiche 
          alle nostre pratiche o per altri motivi operativi, legali o regolamentari. Ti invitiamo 
          a consultare regolarmente questa pagina per rimanere informato.
        </p>
      </LegalSection>

      <LegalSection title="7. Contatti">
        <p>
          Per qualsiasi domanda relativa all'utilizzo dei cookie su mioCFO, puoi contattarci:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Email: <a href="mailto:privacy@miocfo.it" className="text-primary hover:underline">privacy@miocfo.it</a></li>
          <li>Email generale: <a href="mailto:info@miocfo.it" className="text-primary hover:underline">info@miocfo.it</a></li>
        </ul>
      </LegalSection>
    </LegalPageLayout>
  );
}
