import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export default function Privacy() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="Gennaio 2026">
      <LegalSection title="1. Titolare del Trattamento">
        <p>
          Il Titolare del trattamento dei dati personali è Finexa S.r.l., con sede legale in Italia. 
          Per qualsiasi richiesta relativa al trattamento dei dati personali, è possibile contattarci 
          all'indirizzo email: <a href="mailto:privacy@finexa.it" className="text-primary hover:underline">privacy@finexa.it</a>
        </p>
      </LegalSection>

      <LegalSection title="2. Tipologie di Dati Raccolti">
        <p>Finexa raccoglie le seguenti categorie di dati personali:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Dati di registrazione:</strong> nome, cognome, indirizzo email, password (criptata)</li>
          <li><strong>Dati aziendali:</strong> ragione sociale, partita IVA, settore di attività</li>
          <li><strong>Dati bancari:</strong> informazioni sui conti bancari collegati tramite Enable Banking (IBAN, saldi, transazioni)</li>
          <li><strong>Dati di fatturazione:</strong> fatture caricate, dati dei fornitori, importi</li>
          <li><strong>Dati di navigazione:</strong> indirizzo IP, browser utilizzato, pagine visitate</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalità del Trattamento">
        <p>I dati personali sono trattati per le seguenti finalità:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Erogazione dei servizi di gestione finanziaria richiesti</li>
          <li>Creazione e gestione dell'account utente</li>
          <li>Sincronizzazione dei dati bancari tramite servizi di Open Banking</li>
          <li>Elaborazione di report e analisi finanziarie</li>
          <li>Invio di comunicazioni di servizio e notifiche</li>
          <li>Adempimento di obblighi legali e fiscali</li>
          <li>Miglioramento dei servizi e dell'esperienza utente</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Base Giuridica del Trattamento">
        <p>Il trattamento dei dati personali si basa sulle seguenti basi giuridiche:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Contratto:</strong> il trattamento è necessario per l'esecuzione del contratto di servizio</li>
          <li><strong>Consenso:</strong> per l'accesso ai dati bancari tramite Enable Banking</li>
          <li><strong>Obbligo legale:</strong> per adempiere a obblighi di legge</li>
          <li><strong>Interesse legittimo:</strong> per migliorare i servizi e prevenire frodi</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Condivisione con Terze Parti">
        <p>I dati personali possono essere condivisi con i seguenti soggetti terzi:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>
            <strong>Enable Banking:</strong> fornitore di servizi di Open Banking (PSD2) per l'accesso sicuro 
            ai dati bancari. Enable Banking opera come AISP (Account Information Service Provider) regolamentato.
          </li>
          <li>
            <strong>Supabase:</strong> fornitore di infrastruttura cloud per l'hosting del database e 
            l'autenticazione degli utenti. I dati sono archiviati in data center europei.
          </li>
          <li>
            <strong>Fornitori di servizi essenziali:</strong> per l'invio di email transazionali e l'analisi 
            aggregata dell'utilizzo della piattaforma.
          </li>
        </ul>
        <p className="mt-3">
          Non vendiamo né condividiamo i tuoi dati personali con terze parti per finalità di marketing.
        </p>
      </LegalSection>

      <LegalSection title="6. Diritti degli Utenti">
        <p>In conformità al GDPR, hai diritto di:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Accesso:</strong> ottenere conferma del trattamento e accedere ai tuoi dati</li>
          <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
          <li><strong>Cancellazione:</strong> richiedere la cancellazione dei tuoi dati ("diritto all'oblio")</li>
          <li><strong>Limitazione:</strong> limitare il trattamento in determinate circostanze</li>
          <li><strong>Portabilità:</strong> ricevere i tuoi dati in formato strutturato e leggibile</li>
          <li><strong>Opposizione:</strong> opporti al trattamento basato su interesse legittimo</li>
          <li><strong>Revoca del consenso:</strong> revocare il consenso in qualsiasi momento</li>
        </ul>
        <p className="mt-3">
          Per esercitare questi diritti, contattaci all'indirizzo{" "}
          <a href="mailto:privacy@finexa.it" className="text-primary hover:underline">privacy@finexa.it</a>.
        </p>
      </LegalSection>

      <LegalSection title="7. Conservazione dei Dati">
        <p>
          I dati personali vengono conservati per il tempo strettamente necessario alle finalità per cui 
          sono stati raccolti:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Dati dell'account: per tutta la durata del rapporto contrattuale e per i successivi 10 anni per obblighi fiscali</li>
          <li>Dati bancari: fino alla revoca del consenso o alla disconnessione del conto bancario</li>
          <li>Log di sistema: massimo 12 mesi per finalità di sicurezza</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Sicurezza dei Dati">
        <p>
          Adottiamo misure tecniche e organizzative appropriate per proteggere i dati personali, tra cui:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Crittografia dei dati in transito (TLS 1.3) e a riposo</li>
          <li>Autenticazione sicura con hashing delle password</li>
          <li>Accesso limitato ai dati su base "need-to-know"</li>
          <li>Monitoraggio continuo delle attività sospette</li>
          <li>Backup regolari e piani di disaster recovery</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Trasferimenti Internazionali">
        <p>
          I dati sono principalmente archiviati in data center situati nell'Unione Europea. 
          Qualora si rendesse necessario un trasferimento al di fuori dello Spazio Economico Europeo, 
          ci assicuriamo che siano presenti adeguate garanzie (es. Clausole Contrattuali Standard, 
          decisioni di adeguatezza).
        </p>
      </LegalSection>

      <LegalSection title="10. Contatti">
        <p>
          Per qualsiasi domanda relativa a questa Privacy Policy o al trattamento dei tuoi dati personali, 
          puoi contattarci:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Email: <a href="mailto:privacy@finexa.it" className="text-primary hover:underline">privacy@finexa.it</a></li>
          <li>Email generale: <a href="mailto:info@finexa.it" className="text-primary hover:underline">info@finexa.it</a></li>
        </ul>
        <p className="mt-3">
          Hai inoltre il diritto di presentare un reclamo all'Autorità Garante per la Protezione dei 
          Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.garanteprivacy.it</a>).
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
