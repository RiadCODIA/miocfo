import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export default function Terms() {
  return (
    <LegalPageLayout title="Termini di Servizio" lastUpdated="Gennaio 2026">
      <LegalSection title="1. Accettazione dei Termini">
        <p>
          Utilizzando la piattaforma mioCFO, accetti di essere vincolato dai presenti Termini di Servizio. 
          Se non accetti questi termini, ti preghiamo di non utilizzare i nostri servizi.
        </p>
        <p>
          Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. 
          Le modifiche saranno comunicate tramite email o notifica sulla piattaforma e diventeranno 
          effettive dalla data di pubblicazione.
        </p>
      </LegalSection>

      <LegalSection title="2. Descrizione del Servizio">
        <p>
          mioCFO è una piattaforma di gestione finanziaria per piccole e medie imprese che offre:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Dashboard con indicatori finanziari in tempo reale (KPI)</li>
          <li>Collegamento e sincronizzazione di conti bancari tramite Open Banking</li>
          <li>Gestione e archiviazione delle fatture</li>
          <li>Analisi dei flussi di cassa e previsioni</li>
          <li>Calcolo della marginalità per prodotti e servizi</li>
          <li>Sistema di alert e notifiche automatiche</li>
          <li>Report e analisi finanziarie</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Registrazione e Account">
        <p>
          Per utilizzare mioCFO, devi creare un account fornendo informazioni accurate e complete. 
          Sei responsabile di:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Mantenere la riservatezza delle credenziali di accesso</li>
          <li>Tutte le attività svolte tramite il tuo account</li>
          <li>Notificarci immediatamente in caso di accesso non autorizzato</li>
          <li>Aggiornare le informazioni dell'account per mantenerle accurate</li>
        </ul>
        <p className="mt-3">
          Ci riserviamo il diritto di sospendere o terminare account che violano questi termini 
          o che presentano attività sospette.
        </p>
      </LegalSection>

      <LegalSection title="4. Obblighi dell'Utente">
        <p>Utilizzando mioCFO, ti impegni a:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Utilizzare il servizio solo per finalità lecite e conformi alla legge</li>
          <li>Non tentare di accedere a sistemi o dati non autorizzati</li>
          <li>Non interferire con il funzionamento della piattaforma</li>
          <li>Non utilizzare il servizio per attività fraudolente o illegali</li>
          <li>Fornire informazioni accurate e veritiere</li>
          <li>Rispettare i diritti di proprietà intellettuale</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Collegamento Conti Bancari (Enable Banking)">
        <p>
          mioCFO utilizza i servizi di <strong>Enable Banking</strong>, un fornitore di servizi di 
          Open Banking regolamentato ai sensi della direttiva PSD2, per permetterti di collegare 
          i tuoi conti bancari alla piattaforma.
        </p>
        <p className="mt-3">
          Collegando un conto bancario, autorizzi Enable Banking ad accedere alle informazioni del 
          tuo conto (saldi, transazioni) e a condividerle con mioCFO per le finalità del servizio.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Il consenso può essere revocato in qualsiasi momento disconnettendo il conto</li>
          <li>Enable Banking opera come AISP (Account Information Service Provider) autorizzato</li>
          <li>Non abbiamo mai accesso alle tue credenziali bancarie</li>
          <li>I dati bancari sono trattati in conformità alla normativa sulla privacy</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Proprietà Intellettuale">
        <p>
          Tutti i contenuti presenti sulla piattaforma mioCFO, inclusi ma non limitati a:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Software, codice sorgente e algoritmi</li>
          <li>Design, interfaccia utente e grafica</li>
          <li>Testi, documentazione e contenuti</li>
          <li>Marchi, loghi e nomi commerciali</li>
        </ul>
        <p className="mt-3">
          sono di proprietà esclusiva di mioCFO S.r.l. o dei rispettivi licenziatari e sono 
          protetti dalle leggi sulla proprietà intellettuale.
        </p>
        <p className="mt-3">
          Ti concediamo una licenza limitata, non esclusiva, non trasferibile per utilizzare 
          la piattaforma secondo questi termini.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitazioni di Responsabilità">
        <p>
          <strong>Esclusione di garanzie:</strong> Il servizio viene fornito "così com'è" e 
          "come disponibile". Non garantiamo che il servizio sarà sempre disponibile, 
          ininterrotto, sicuro o privo di errori.
        </p>
        <p className="mt-3">
          <strong>Limitazione di responsabilità:</strong> Nella misura massima consentita dalla legge, 
          mioCFO non sarà responsabile per:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Danni indiretti, incidentali, speciali o consequenziali</li>
          <li>Perdita di profitti, dati o opportunità commerciali</li>
          <li>Decisioni finanziarie basate sulle informazioni fornite dalla piattaforma</li>
          <li>Interruzioni del servizio dovute a cause di forza maggiore</li>
          <li>Azioni di terze parti, inclusi i fornitori di servizi bancari</li>
        </ul>
        <p className="mt-3">
          <strong>Avvertenza:</strong> Le informazioni fornite da mioCFO hanno scopo informativo 
          e non costituiscono consulenza finanziaria, fiscale o legale professionale.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilità del Servizio">
        <p>
          Ci impegniamo a garantire la massima disponibilità del servizio, tuttavia:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Potremmo effettuare manutenzioni programmate con preavviso</li>
          <li>Il servizio potrebbe essere temporaneamente non disponibile per cause tecniche</li>
          <li>La sincronizzazione bancaria dipende dalla disponibilità delle banche partner</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Recesso e Cancellazione">
        <p>
          Puoi cancellare il tuo account in qualsiasi momento dalle impostazioni della piattaforma 
          o contattando il nostro supporto.
        </p>
        <p className="mt-3">
          In caso di cancellazione:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>I collegamenti bancari verranno automaticamente revocati</li>
          <li>I dati personali saranno trattati secondo la Privacy Policy</li>
          <li>Alcuni dati potrebbero essere conservati per obblighi legali</li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Modifiche ai Termini">
        <p>
          Ci riserviamo il diritto di modificare questi Termini di Servizio in qualsiasi momento. 
          Le modifiche sostanziali saranno comunicate con almeno 30 giorni di preavviso tramite 
          email o notifica sulla piattaforma.
        </p>
        <p className="mt-3">
          L'uso continuato del servizio dopo l'entrata in vigore delle modifiche costituisce 
          accettazione dei nuovi termini.
        </p>
      </LegalSection>

      <LegalSection title="11. Legge Applicabile e Foro Competente">
        <p>
          Questi Termini di Servizio sono regolati dalla legge italiana. Per qualsiasi controversia 
          derivante dall'utilizzo dei servizi mioCFO, sarà competente in via esclusiva il Foro del 
          luogo di residenza o domicilio del consumatore, se applicabile, o in alternativa il 
          Foro di Milano.
        </p>
      </LegalSection>

      <LegalSection title="12. Contatti">
        <p>
          Per qualsiasi domanda relativa a questi Termini di Servizio, puoi contattarci:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Email: <a href="mailto:legal@miocfo.it" className="text-primary hover:underline">legal@miocfo.it</a></li>
          <li>Email generale: <a href="mailto:info@miocfo.it" className="text-primary hover:underline">info@miocfo.it</a></li>
        </ul>
      </LegalSection>
    </LegalPageLayout>
  );
}
