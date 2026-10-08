import os
import sys
from playwright.sync_api import sync_playwright

DOCS_DIR = os.path.abspath("docs")
PUBLIC_DIR = os.path.abspath("public")
os.makedirs(DOCS_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

html_content = """<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Nicora Garden - Manuale Operativo e Istruzioni Complete dell'App Turni</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: "Pagina " counter(page) " di " counter(pages);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 8pt;
        color: #718096;
      }
      @bottom-left {
        content: "Nicora Garden • Manuale Operativo Ufficiale App Turni";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 8pt;
        color: #718096;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a202c;
      background: #ffffff;
      font-size: 9pt;
      line-height: 1.5;
    }

    a {
      color: #0a474b;
      text-decoration: none;
      font-weight: 600;
    }
    a:hover {
      text-decoration: underline;
    }

    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 250mm;
      padding: 20mm 10mm 10mm 10mm;
      border: 3px solid #0a474b;
      border-radius: 8px;
      background: linear-gradient(180deg, #f7faf9 0%, #ffffff 100%);
    }

    .brand-header {
      border-bottom: 3px solid #fd651e;
      padding-bottom: 20px;
    }

    .brand-title {
      font-size: 26pt;
      font-weight: 900;
      color: #0a474b;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 13pt;
      font-weight: 700;
      color: #fd651e;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .cover-doc-title {
      margin-top: 50px;
    }

    .cover-doc-title h1 {
      font-size: 22pt;
      color: #0a474b;
      font-weight: 800;
      line-height: 1.2;
    }

    .cover-doc-title p {
      font-size: 11pt;
      color: #4a5568;
      margin-top: 15px;
      line-height: 1.6;
    }

    .cover-meta {
      background: #ffffff;
      border: 1px solid #cbd5e0;
      border-left: 5px solid #0a474b;
      padding: 16px 20px;
      border-radius: 6px;
    }

    .cover-meta table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }

    .cover-meta td {
      padding: 4px 8px;
    }

    .cover-meta td.label {
      font-weight: bold;
      color: #0a474b;
      width: 140px;
    }

    .cover-footer {
      font-size: 8.5pt;
      color: #718096;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      text-align: center;
    }

    .chapter {
      page-break-before: always;
      padding-top: 5mm;
    }

    h1.chapter-title {
      font-size: 16pt;
      color: #0a474b;
      font-weight: 800;
      border-bottom: 2px solid #0a474b;
      padding-bottom: 6px;
      margin-bottom: 14px;
      letter-spacing: -0.02em;
    }

    h2.section-title {
      font-size: 12pt;
      color: #fd651e;
      font-weight: 700;
      margin-top: 16px;
      margin-bottom: 8px;
      border-left: 4px solid #fd651e;
      padding-left: 8px;
    }

    h3.sub-title {
      font-size: 10pt;
      color: #0a474b;
      font-weight: 700;
      margin-top: 12px;
      margin-bottom: 4px;
    }

    p {
      margin-bottom: 8px;
      text-align: justify;
    }

    ul, ol {
      margin-left: 18px;
      margin-bottom: 10px;
    }

    li {
      margin-bottom: 4px;
    }

    .info-box {
      background: #f0f7f5;
      border-left: 4px solid #0a474b;
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    .warning-box {
      background: #fffaf0;
      border-left: 4px solid #dd6b20;
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    .success-box {
      background: #f0fff4;
      border-left: 4px solid #38a169;
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    .badge {
      display: inline-block;
      padding: 2px 7px;
      font-size: 7.5pt;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .badge-morning { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
    .badge-afternoon { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-full { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-special { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-rest { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .badge-leave { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .badge-sick { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
    .badge-draft { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-published { background: #dcfce7; color: #166534; border: 1px solid #86efac; }

    table.manual-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    table.manual-table th {
      background: #0a474b;
      color: #ffffff;
      padding: 7px 10px;
      text-align: left;
      font-weight: 700;
      font-size: 8.5pt;
    }

    table.manual-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      vertical-align: top;
    }

    table.manual-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .toc-container {
      background: #f8faf9;
      border: 1px solid #d1deda;
      border-radius: 6px;
      padding: 16px 20px;
      margin-top: 15px;
      margin-bottom: 25px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 9pt;
      border-bottom: 1px dotted #cbd5e0;
      padding-bottom: 2px;
    }

    .toc-item.level-1 {
      font-weight: 800;
      color: #0a474b;
      margin-top: 8px;
      font-size: 9.5pt;
    }

    .toc-item.level-2 {
      margin-left: 15px;
      font-weight: 500;
      color: #2d3748;
    }

    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 10px 0;
      page-break-inside: avoid;
    }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
    }

    .card-title {
      font-weight: 700;
      color: #0a474b;
      font-size: 9pt;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- ============================================================ -->
  <!-- COPERTINA EDITORIALE -->
  <!-- ============================================================ -->
  <div class="cover-page">
    <div class="brand-header">
      <div class="brand-title">NICORA GARDEN</div>
      <div class="brand-subtitle">Sedi di Gazzada Schianno & Varese</div>
    </div>

    <div class="cover-doc-title">
      <h1>MANUALE OPERATIVO COMPLETO<br>DELL'APPLICAZIONE TURNI</h1>
      <p>
        Guida ufficiale dettagliata all'utilizzo della piattaforma di pianificazione, 
        gestione presenze, richieste ferie e scambi turno, algoritmo di schedulazione predittiva, 
        risoluzione guidata scoperture ed emergenze operative.
      </p>
    </div>

    <div class="cover-meta">
      <table>
        <tr>
          <td class="label">Piattaforma:</td>
          <td>App Turni Nicora Garden (Web & PWA Offline-First)</td>
        </tr>
        <tr>
          <td class="label">Sedi Coinvolte:</td>
          <td>Gazzada Schianno (Via Gallarate 26) • Varese (Via Carnia 158)</td>
        </tr>
        <tr>
          <td class="label">Destinatari:</td>
          <td>Collaboratori di Reparto, Capi Reparto, Responsabili di Sede e Direzione Generale</td>
        </tr>
        <tr>
          <td class="label">Infrastruttura:</td>
          <td>Architettura Cloud Supabase Postgres con Sincronizzazione Realtime</td>
        </tr>
        <tr>
          <td class="label">Data Rilascio:</td>
          <td>Ottobre 2026 • Versione Ufficiale 1.0 (Revisione Completa)</td>
        </tr>
      </table>
    </div>

    <div class="cover-footer">
      Documento Riservato ad uso interno aziendale • Nicora Garden S.r.l.
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- SOMMARIO / INDICE CLICCABILE -->
  <!-- ============================================================ -->
  <div class="chapter">
    <h1 class="chapter-title" id="indice">SOMMARIO GENERALE DEL MANUALE</h1>
    <p>
      Il presente manuale è strutturato in capitoli indipendenti. Tutti i titoli dell'indice sottostante sono 
      <strong>cliccabili</strong>: cliccando su una voce verrai immediatamente reindirizzato alla pagina e al capitolo corrispondente.
    </p>

    <div class="toc-container">
      <div class="toc-item level-1"><a href="#cap-1">1. Panoramica dell'Applicazione e Accesso al Sistema</a></div>
      <div class="toc-item level-2"><a href="#cap-1-1">1.1 Finalità dell'App e Filosofia di Gestione</a></div>
      <div class="toc-item level-2"><a href="#cap-1-2">1.2 Accesso Collaboratore (Selezione Nominativo e PIN)</a></div>
      <div class="toc-item level-2"><a href="#cap-1-3">1.3 Accesso Responsabile e Direzione (Email e Password)</a></div>
      <div class="toc-item level-2"><a href="#cap-1-4">1.4 Selezione della Sede Operativa (Gazzada vs Varese)</a></div>
      <div class="toc-item level-2"><a href="#cap-1-5">1.5 Barra Superiore (Header), Menu Utente e Barra di Navigazione</a></div>
      <div class="toc-item level-2"><a href="#cap-1-6">1.6 Collaboratori Condivisi (Jolly Mobile tra Sedi)</a></div>

      <div class="toc-item level-1"><a href="#cap-2">2. Guida Completa per i Collaboratori (Staff)</a></div>
      <div class="toc-item level-2"><a href="#cap-2-1">2.1 Scheda "Oggi in Sede" (Presenze e Colleghi di Turno)</a></div>
      <div class="toc-item level-2"><a href="#cap-2-2">2.2 Scheda "I Miei Turni" (Pianificazione Personale della Settimana)</a></div>
      <div class="toc-item level-2"><a href="#cap-2-3">2.3 Scheda "Richieste Ferie & Permessi" (I 4 Moduli di Richiesta)</a></div>
      <div class="toc-item level-2"><a href="#cap-2-4">2.4 Procedura Guidata di Scambio Turno con un Collega</a></div>

      <div class="toc-item level-1"><a href="#cap-3">3. Guida Completa per la Direzione e i Responsabili (Admin)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-1">3.1 Modalità Responsabile e Monitoraggio Presenze</a></div>
      <div class="toc-item level-2"><a href="#cap-3-2">3.2 Scheda "Pianificatore Turni" (Tabellone Settimanale Domenica–Sabato)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-3">3.3 Ciclo di Vita dei Turni: Bozza Cloud Riservata vs Pubblicazione allo Staff</a></div>
      <div class="toc-item level-2"><a href="#cap-3-4">3.4 Banner e Gestione Rapida Richieste Pendenti</a></div>
      <div class="toc-item level-2"><a href="#cap-3-5">3.5 Generazione Automatica Intelligente (Orario Continuato e Stagione Natale)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-6">3.6 Modifica Manuale Turno, Orari Speciali e Slot Continuato</a></div>
      <div class="toc-item level-2"><a href="#cap-3-7">3.7 Rilevamento Criticità Settimanali e Wizard Scoperture Reparto</a></div>
      <div class="toc-item level-2"><a href="#cap-3-8">3.8 Wizard Emergenze e Sostituzioni Improvvise (Replacement Advisor)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-9">3.9 I 3 Livelli di Svuotamento e Pulizia Controllata dei Turni</a></div>
      <div class="toc-item level-2"><a href="#cap-3-10">3.10 Esportazione Bacheca A4 e Condivisione WhatsApp Negozio</a></div>
      <div class="toc-item level-2"><a href="#cap-3-11">3.11 Scheda "Personale & Competenze" (Organico, Contratto e Reset PIN)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-12">3.12 Matrice Competenze (Skills Matrix per gli 8 Reparti Aziendali)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-13">3.13 Report Mensile Ore, Consuntivo Lavoro ed Export CSV Excel</a></div>

      <div class="toc-item level-1"><a href="#cap-4">4. Glossario Completo di Icone, Badge, Banner e Colori</a></div>
      <div class="toc-item level-2"><a href="#cap-4-1">4.1 Codice Cromatico Ufficiale delle Tipologie di Turno</a></div>
      <div class="toc-item level-2"><a href="#cap-4-2">4.2 Significato dei Badge di Stato Richiesta e Presenza</a></div>
      <div class="toc-item level-2"><a href="#cap-4-3">4.3 Banner Informativi, Allarmi Criticità e Avvisi di Sistema</a></div>
      <div class="toc-item level-2"><a href="#cap-4-4">4.4 Notifiche Toast Visive in Tempo Reale</a></div>

      <div class="toc-item level-1"><a href="#cap-5">5. FAQ, Installazione PWA e Supporto</a></div>
      <div class="toc-item level-2"><a href="#cap-5-1">5.1 Installazione dell'App come Icona su Smartphone e PC</a></div>
      <div class="toc-item level-2"><a href="#cap-5-2">5.2 Funzionamento Offline e Risincronizzazione Dati</a></div>
      <div class="toc-item level-2"><a href="#cap-5-3">5.3 Procedura di Recupero e Modifica del PIN o Password</a></div>
      <div class="toc-item level-2"><a href="#cap-5-4">5.4 Verifica Aggiornamenti dell'Applicazione</a></div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- CAPITOLO 1 -->
  <!-- ============================================================ -->
  <div class="chapter">
    <h1 class="chapter-title" id="cap-1">1. PANORAMICA DELL'APPLICAZIONE E ACCESSO AL SISTEMA</h1>
    
    <h2 class="section-title" id="cap-1-1">1.1 Finalità dell'App e Filosofia di Gestione</h2>
    <p>
      L'Applicazione Turni Nicora Garden è lo strumento digitale ufficiale progettato per armonizzare l'intera organizzazione 
      del lavoro nei due punti vendita di <strong>Gazzada Schianno</strong> e <strong>Varese</strong>. L'obiettivo primario 
      è garantire la massima trasparenza per ciascun collaboratore, eliminare la confusione delle comunicazioni cartacee o via chat, 
      assicurare una turnazione etica ed equa, e fornire alla Direzione uno strumento affidabile per presidiare costantemente 
      tutti i reparti chiave (a Gazzada: Cassa, Fioreria, Serra Fredda, Serra Calda, Area Tecnica; a Varese: Cassa, Fioreria, Decor, Emporio, Serra Calda, Serra Fredda e stagione Natale).
    </p>

    <div class="info-box">
      <strong>Accessibilità Multipiattaforma:</strong> L'applicazione è fruibile da qualsiasi dispositivo (smartphone iOS/Android, tablet, 
      PC Windows e Mac). È configurata come Progressive Web App (PWA), consentendo l'installazione diretta con icona sulla schermata home 
      e garantendo l'accesso ai turni anche quando ci si trova in una zona del vivaio con copertura internet debole o assente.
    </div>

    <h2 class="section-title" id="cap-1-2">1.2 Accesso Collaboratore (Selezione Nominativo e PIN)</h2>
    <p>
      Per rendere l'accesso immediato anche durante il servizio attivo, i collaboratori non devono digitare credenziali complesse:
    </p>
    <ul>
      <li>Dalla schermata di login, selezionare la propria sede di appartenenza (Gazzada o Varese).</li>
      <li>Aprire il menu a tendina <strong>"Seleziona il tuo nominativo"</strong>, dotato di avatar, reparto di assegnazione e ricerca rapida, e toccare il proprio nome.</li>
      <li>Digitare il proprio <strong>PIN personale</strong> nel campo riservato (con pulsante a icona per mostrare o nascondere i caratteri digitati).</li>
      <li>Toccare <strong>"Accedi ai Miei Turni"</strong>: l'accesso avviene istantaneamente, caricando il profilo personale, i turni del mese e lo stato delle richieste.</li>
      <li>Sotto il modulo è presente il collegamento <strong>"Hai dimenticato il PIN?"</strong> per avviare la procedura rapida di ripristino.</li>
    </ul>

    <h2 class="section-title" id="cap-1-3">1.3 Accesso Responsabile e Direzione (Email e Password)</h2>
    <p>
      I responsabili di sede e i componenti della Direzione accedono tramite la sezione dedicata <strong>"Responsabile"</strong>:
    </p>
    <ul>
      <li>Selezionare la tab <em>"Responsabile"</em> nella parte alta della schermata di login.</li>
      <li>Inserire l'<strong>Email del Responsabile</strong> (es. <code>vittore@nicoragarden.it</code>).</li>
      <li>Digitare la <strong>Password Direzione</strong> riservata di sede, la master password aziendale oppure la chiave di sblocco master di ripristino.</li>
      <li>Toccare <strong>"Accedi al Tabellone Direzione"</strong>: l'app attiva la <strong>Modalità Direzione</strong>, sbloccando i permessi di modifica su tutti i turni, 
      l'accesso alla matrice competenze, la generazione automatica algoritmica, il wizard delle emergenze e il pannello di approvazione ferie e cambi turno.</li>
      <li>In caso di smarrimento credenziali, il link <strong>"Password dimenticata?"</strong> illustra le procedure di recupero tramite master key o pannello cloud.</li>
    </ul>

    <h2 class="section-title" id="cap-1-4">1.4 Selezione della Sede Operativa (Gazzada vs Varese)</h2>
    <p>
      Nell'header superiore (sia desktop che mobile) è sempre presente il selettore della sede attiva (<em>"Gazzada"</em> o <em>"Varese"</em>). 
      I responsabili possono passare liberamente da una sede all'altra con un solo tocco, visualizzando all'istante l'organico, il tabellone 
      e le presenze dell'altro punto vendita senza dover effettuare un nuovo login.
    </p>

    <h2 class="section-title" id="cap-1-5">1.5 Barra Superiore (Header), Menu Utente e Barra di Navigazione</h2>
    <p>
      L'interfaccia (nella versione desktop e nella versione mobile dedicata) racchiude tutti gli indicatori di stato fondamentali:
    </p>
    <ul>
      <li><strong>Logo Nicora Garden:</strong> Tasto rapido per tornare alla pagina principale "Oggi in Sede".</li>
      <li><strong>Pulsante Aggiorna Turni (Refresh):</strong> Icona con due frecce circolari che risincronizza forzatamente l'app con Supabase Cloud.</li>
      <li><strong>Tasto Installa PWA:</strong> Presente nell'header desktop e mobile per installare l'app con un clic o aprire la guida interattiva per Android e iOS.</li>
      <li><strong>Badge Notifiche sulle Schede:</strong> I contatori numerati rossi/arancioni delle richieste in attesa (proposte di scambio per i collaboratori, richieste di ferie/permessi per la Direzione) sono integrati direttamente sulla linguetta <strong>"Richieste"</strong> della barra di navigazione.</li>
      <li><strong>Menu Utente (Profilo):</strong> Toccando l'avatar con le proprie iniziali si apre il menu a tendina con:
        <ul>
          <li><strong>Guida Rapida all'App:</strong> Riapre il tutorial interattivo guidato a schede.</li>
          <li><strong>Scarica Istruzioni Complete (PDF):</strong> Scarica o apre istantaneamente il presente manuale completo.</li>
          <li><strong>Modifica PIN / Password:</strong> Permette di aggiornare in autonomia il proprio codice segreto.</li>
          <li><strong>Verifica Aggiornamenti App:</strong> Tasto rapido che scarica immediatamente l'ultima versione del codice dell'applicazione conservando sessione di login e dati memorizzati.</li>
          <li><strong>Esci dalla Sessione:</strong> Disconnette l'utente e ritorna alla schermata di login.</li>
        </ul>
      </li>
    </ul>

    <h2 class="section-title" id="cap-1-6">1.6 Collaboratori Condivisi (Jolly Mobile tra Sedi)</h2>
    <p>
      L'applicazione gestisce nativamente i collaboratori polivalenti che operano tra Gazzada e Varese contrassegnati dal ruolo <strong>Jolly Mobile</strong>:
    </p>
    <ul>
      <li>I collaboratori Jolly sono visibili nel tabellone di entrambe le sedi o nella sede di trasferta corrente.</li>
      <li>L'algoritmo di schedulazione e il wizard di sostituzione riconoscono automaticamente le trasferte per garantire il rispetto dei massimali orari contrattuali ed evitare sovrapposizioni tra i due vivai.</li>
    </ul>
  </div>

  <!-- ============================================================ -->
  <!-- CAPITOLO 2 -->
  <!-- ============================================================ -->
  <div class="chapter">
    <h1 class="chapter-title" id="cap-2">2. GUIDA COMPLETA PER I COLLABORATORI (STAFF)</h1>
    
    <h2 class="section-title" id="cap-2-1">2.1 Scheda "Oggi in Sede" (Presenze e Colleghi di Turno)</h2>
    <p>
      La scheda <strong>"Oggi in Sede"</strong> è la pagina predefinita di atterraggio. È stata disegnata per rispondere 
      istantaneamente alla domanda: <em>"A che ora lavoro oggi e quali colleghi sono di turno nei vari reparti?"</em>.
    </p>

    <div class="card-grid">
      <div class="card">
        <div class="card-title">Banner Hero "Il Tuo Turno"</div>
        <p style="font-size: 8pt; color: #4a5568;">
          Collocato in cima alla pagina con risalto visivo e sfondo scuro elegante. Riporta chiaramente il tuo nome, la fascia oraria del tuo turno odierno 
          (es. 08:30 — 19:30 oppure 08:30 — 12:30), la tipologia (Giornata Intera o Mezza Giornata) e il badge colorato del reparto assegnato (es. Cassa, Fioreria, Serra). 
          Se per oggi non lavori, la card si adatta visualizzando lo stato reale: <em>Giorno di Riposo ☕</em>, <em>In Ferie 🌴</em> oppure <em>In Malattia 🏥</em>.
        </p>
      </div>
      <div class="card">
        <div class="card-title">3 Riquadri Statistici (KPI Giornalieri)</div>
        <p style="font-size: 8pt; color: #4a5568;">
          In alto sono posizionati 3 indicatori compatti essenziali:
          <br>• <strong>In Servizio:</strong> totale esatto dei collaboratori presenti oggi in sede (con pallino verde).
          <br>• <strong>Riposo / Ferie:</strong> conteggio dei colleghi a riposo, ferie o assenti oggi.
          <br>• <strong>Presidio Cassa:</strong> conteggio delle linee cassa attive, con badge di sicurezza verde <em>Cassa Presidiata</em> oppure allarme rosso <em>Cassa Scoperta!</em> se nessuna risorsa è allocata.
        </p>
      </div>
    </div>

    <h3 class="sub-title">Barra Filtri per Reparto (Pillole Interattive)</h3>
    <p>
      Sotto il banner personale è presente una barra a scorrimento orizzontale con pulsanti a pillola per filtrare l'elenco delle presenze:
    </p>
    <ul>
      <li><strong>Tutti i Reparti:</strong> Mostra l'organico complessivo in servizio oggi con il relativo contatore totale.</li>
      <li><strong>Pillole di Reparto:</strong> Cliccando su una pillola (es. <em>Cassa</em>, <em>Fioreria</em>, <em>Decor</em>, <em>Serra Calda</em>, <em>Serra Fredda</em>, <em>Area Tecnica</em>, <em>Emporio</em> o <em>Natale</em>), la lista mostra esclusivamente i colleghi operativi in quel determinato reparto.</li>
    </ul>

    <h3 class="sub-title">Elenco dei Collaboratori in Turno</h3>
    <p>
      Ciascun collaboratore in servizio nella giornata è visualizzato con una card dedicata contenente:
    </p>
    <ul>
      <li><strong>Avatar e Ruolo:</strong> Avatar con iniziali e pallino verde di presenza, affiancato dal badge arancione <span class="badge badge-morning">TU</span> se si tratta della propria scheda, o dal badge <span class="badge badge-draft">RESP</span> se il collaboratore ha il ruolo di responsabile di sede.</li>
      <li><strong>Reparto Assegnato:</strong> Badge con colore distintivo del reparto per cui è programmato il turno.</li>
      <li><strong>Fascia Oraria:</strong> Orario programmato di inizio e fine servizio (es. 08:30 — 12:30 o 08:30 — 19:30).</li>
      <li><strong>Tipologia di Turno:</strong> Dicitura riassuntiva (<em>Giornata Intera</em>, <em>Mattina</em>, <em>Pomeriggio</em> o badge dorato <span class="badge badge-special">SPECIALE</span> per orari personalizzati concordati).</li>
      <li><strong>Modifica Rapida (solo per la Direzione):</strong> In modalità Responsabile, cliccando sulla card si apre la finestra di modifica del turno per intervenire su orari o reparto.</li>
    </ul>

    <h3 class="sub-title">Sezione Collaboratori a Riposo, Ferie o Assenti</h3>
    <p>
      In fondo alla pagina, un'apposita sezione contrassegnata dall'icona della tazzina di caffè elenca tutti i colleghi dell'organico che oggi non sono di turno, evidenziando:
    </p>
    <ul>
      <li><strong>☕ Giorno di Riposo:</strong> Giorno di riposo settimanale compensativo.</li>
      <li><strong>🌴 In Ferie:</strong> Assenza programmata per ferie o permesso approvato dalla direzione.</li>
      <li><strong>🏥 In Malattia:</strong> Assenza per malattia o infortunio regolarmente registrata.</li>
    </ul>

    <h2 class="section-title" id="cap-2-2">2.2 Scheda "I Miei Turni" (Pianificazione Personale della Settimana)</h2>
    <p>
      Questa sezione offre al collaboratore la vista chiara e trasparente di tutta la propria programmazione oraria settimanale:
    </p>

    <div class="card-grid">
      <div class="card">
        <div class="card-title">Hero Card Profilo & Quadratura Ore Settimanali</div>
        <p style="font-size: 8pt; color: #4a5568;">
          In cima alla pagina compare il tuo profilo personale (nome, reparto di appartenenza e sede). 
          Nel riquadro sono integrati contatori sintetici ricalcolati per la settimana selezionata:
          <br>• <strong>Ore Contrattuali:</strong> monte ore settimanale previsto da contratto (es. 40h o 24h).
          <br>• <strong>Ore Pianificate & Saldo:</strong> totale ore effettivamente assegnate nella settimana e bilancio (+/-).
          <br>• <strong>Turni & Riposi:</strong> numero esatto di giornate di servizio e giorni di riposo programmati.
        </p>
      </div>
      <div class="card">
        <div class="card-title">Promemoria di Sicurezza PIN</div>
        <p style="font-size: 8pt; color: #4a5568;">
          Se stai ancora utilizzando il codice provvisorio di fabbrica (<em>1234</em>), in cima alla schermata compare 
          un promemoria color ambra che ti invita a personalizzare il tuo PIN dal menu del profilo per proteggere la tua riservatezza.
        </p>
      </div>
    </div>

    <h3 class="sub-title">Barra di Navigazione Settimanale (Ciclo Domenica – Sabato)</h3>
    <p>
      La turnazione aziendale in Nicora Garden segue rigorosamente il ciclo settimanale da <strong>Domenica a Sabato</strong>. 
      Tramite i pulsanti freccia (<em>Precedente</em> e <em>Successiva</em>) è possibile scorrere le settimane:
    </p>
    <ul>
      <li>Un indicatore evidenzia immediatamente se stai consultando la <span class="badge badge-published">SETTIMANA ATTUALE</span>, la <span class="badge badge-afternoon">PROSSIMA SETTIMANA</span> o un periodo differente.</li>
      <li>Viene riportato l'intervallo esatto di date (es. <em>Dom 4 — Sab 10 Ottobre</em>).</li>
    </ul>

    <h3 class="sub-title">Elenco delle 7 Giornate della Settimana</h3>
    <p>
      Per ciascuno dei 7 giorni della settimana selezionata viene visualizzata una scheda dettagliata:
    </p>
    <ul>
      <li><strong>Giorno e Data:</strong> Nome del giorno, numero e mese. La scheda corrispondente alla giornata di <strong>OGGI</strong> è evidenziata con un badge verde <span class="badge badge-published">OGGI</span> e sfondo dedicato.</li>
      <li><strong>Giornata Lavorativa:</strong> Se sei di turno, la scheda riporta la fascia oraria precisa (es. <em>08:30 — 12:30</em>, <em>08:30 — 19:30</em> o scaglione continuato), la tipologia e il badge colorato del reparto in cui presterai servizio.</li>
      <li><strong>Giornata Non Lavorativa:</strong> Se non lavori, la scheda indica in modo chiaro il motivo con un badge dedicato: <em>☕ Riposo Settimanale</em>, <em>🌴 Ferie</em> oppure <em>🏥 Malattia</em>.</li>
    </ul>

    <div class="info-box">
      <strong>Visibilità dei Mesi Futuri (Bozze vs Ufficiali):</strong> Per tutelare i collaboratori ed evitare fraintendimenti, 
      i turni dei mesi futuri diventano visibili nell'app solo dopo che la Direzione ha terminato le verifiche e ha premuto il pulsante 
      di pubblicazione ufficiale sul cloud. Fino a quel momento, i turni rimangono in bozza riservata alla sola Direzione.
    </div>

    <h2 class="section-title" id="cap-2-3">2.3 Scheda "Richieste Ferie & Permessi" (I 4 Moduli di Richiesta)</h2>
    <p>
      Qualsiasi esigenza di variazione o assenza deve essere registrata tramite questa scheda. L'app mette a disposizione <strong>4 moduli specifici</strong>:
    </p>
    <ol>
      <li><strong>🌴 Ferie & Permessi:</strong> Per richiedere ferie programmate o permessi orari/giornalieri. Selezionare la data o il periodo e inserire la motivazione a supporto.</li>
      <li><strong>🔄 Scambio Turno:</strong> Procedura guidata a due passaggi con controllo automatico di compatibilità per scambiare un turno con un collega di sede.</li>
      <li><strong>⏰ Variazione Orario:</strong> Per richiedere flessibilità su un turno già fissato (es. entrata posticipata alle 10:00 o uscita anticipata concordata), indicando l'ora di inizio e fine desiderate.</li>
      <li><strong>🏥 Malattia:</strong> Per segnalare tempestivamente un'assenza per malattia o infortunio e allertare subito la Direzione aziendale per la copertura dei reparti critici. Consente l'inserimento facoltativo del <em>Numero Protocollo Telematico INPS (PUC)</em>. Il certificato telematico va comunque inoltrato entro le 48 ore ordinarie all'amministrazione.</li>
    </ol>
    <p>
      Nella tabella delle proprie richieste è possibile visualizzare l'esito: se la Direzione approva la richiesta lo stato diventa 
      <span class="badge badge-full">APPROVATA</span> e il turno nel calendario si aggiorna automaticamente; 
      se viene rifiutata, lo stato diventa <span class="badge badge-sick">RIFIUTATA</span> ed è visibile la nota motivazionale della Direzione.
    </p>

    <h2 class="section-title" id="cap-2-4">2.4 Procedura Guidata di Scambio Turno con un Collega</h2>
    <p>
      L'applicazione adotta un sofisticato sistema a doppio consenso con verifica automatica delle incompatibilità:
    </p>
    <div class="info-box">
      <strong>Come Funziona lo Scambio Turno in 3 Fasi:</strong>
      <ol style="margin-top: 6px;">
        <li><strong>Fase 1 (Proposta Intelligente):</strong> Tu selezioni la data del tuo turno da cedere e la data del turno del collega. L'app verifica automaticamente che tu sia effettivamente in servizio nel giorno che vuoi cedere, calcola il tuo reparto e ti mostra <em>solo i colleghi effettivamente in turno nella data richiesta</em> che non abbiano conflitti di orario.</li>
        <li><strong>Fase 2 (Consenso del Collega):</strong> Il collega riceve in tempo reale una notifica in-app e un banner in risalto nella propria scheda richieste con lo stato <span class="badge badge-afternoon">IN ATTESA DEL COLLEGA</span>, dove può confrontare i due turni ed esaminare orari e reparti prima di cliccare <em>"Accetta Scambio"</em> oppure <em>"Rifiuta"</em>.</li>
        <li><strong>Fase 3 (Autorizzazione Direzione):</strong> Se il collega accetta, la richiesta passa all'attenzione della Direzione (<span class="badge badge-draft">IN ATTESA DIREZIONE</span>). Con l'approvazione finale del manager, l'app scambia in automatico i due turni sul tabellone ufficiale sia sul Cloud che nei calendari di entrambi i dipendenti!</li>
      </ol>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- CAPITOLO 3 -->
  <!-- ============================================================ -->
  <div class="chapter">
    <h1 class="chapter-title" id="cap-3">3. GUIDA COMPLETA PER LA DIREZIONE E I RESPONSABILI (ADMIN)</h1>

    <h2 class="section-title" id="cap-3-1">3.1 Modalità Responsabile e Monitoraggio Presenze</h2>
    <p>
      Quando l'utente loggato ha il ruolo di Responsabile o Direzione, l'interfaccia si arricchisce delle funzionalità amministrative complete. 
      Nell'header e nelle schede di gestione, la Direzione può visualizzare l'intero organico, modificare all'istante orari e reparti di ciascun collaboratore 
      e accedere a strumenti predittivi di controllo presenze.
    </p>

    <h2 class="section-title" id="cap-3-2">3.2 Scheda "Pianificatore Turni" (Tabellone Settimanale Domenica–Sabato)</h2>
    <p>
      Il <strong>Tabellone Pianificatore</strong> è il cuore pulsante della gestione del punto vendita:
    </p>
    <ul>
      <li><strong>Asse Verticale:</strong> Tutti i collaboratori della sede attiva, con avatar, ruolo primario e quadratura cumulativa delle ore settimanali (badge verde a contratto raggiunto, ambra se in difetto, rosso se in esubero).</li>
      <li><strong>Asse Orizzontale:</strong> I giorni della settimana da <strong>Domenica a Sabato</strong>. La Domenica è posizionata all'inizio con cornice di risalto color arancio per evidenziare il presidio festivo.</li>
      <li><strong>Celle Turno:</strong> Ogni cella riporta il tipo di turno, gli orari precisi, il reparto assegnato, badge di turno speciale ed eventuali note. Cliccando su qualsiasi cella si apre la modale di modifica immediata.</li>
    </ul>

    <h2 class="section-title" id="cap-3-3">3.3 Ciclo di Vita dei Turni: Bozza Cloud Riservata vs Pubblicazione allo Staff</h2>
    <p>
      Per consentire alla Direzione la massima serenità operativa durante la stesura dei turni, 
      l'applicazione adotta un sistema a doppio stadio con sincronizzazione cloud centralizzata:
    </p>
    <div class="warning-box">
      <strong>Stato "Bozza nel Cloud" (Visibile solo ai Responsabili):</strong> Quando la Direzione genera o modifica i turni di un mese futuro, 
      i dati vengono salvati immediatamente nel database Supabase Cloud. La bozza è <strong>visibile a qualsiasi responsabile su qualsiasi dispositivo</strong> (PC dell'ufficio, smartphone o tablet da casa), 
      ma rimane <em>completamente invisibile</em> ai collaboratori di reparto finché non viene rilasciata. Un banner giallo segnala: <em>"Bozza del mese in elaborazione (non ancora visibile allo staff)"</em>.
    </div>
    <div class="success-box">
      <strong>Pulsante "Pubblica Turni Ora":</strong> Una volta che la Direzione ha verificato coperture e riposi, 
      basta premere il pulsante verde <strong>"Pubblica Turni Ora"</strong>. In quel preciso istante, il mese viene registrato 
      come ufficiale sul Cloud e i turni diventano visibili a tutto lo staff su tutti i loro dispositivi.
    </div>

    <h2 class="section-title" id="cap-3-4">3.4 Banner e Gestione Rapida Richieste Pendenti</h2>
    <p>
      In cima al tabellone pianificatore compare automaticamente il <strong>Banner Richieste Pendenti</strong> non appena uno o più collaboratori 
      hanno inoltrato richieste di ferie, permessi, variazioni orario o scambi turno approvati dal collega:
    </p>
    <ul>
      <li>Il banner riporta il nome del dipendente, il periodo richiesto, il tipo di assenza e la motivazione.</li>
      <li>La Direzione può cliccare direttamente su <strong>"Approva"</strong> (il turno del collaboratore viene convertito immediatamente in Ferie/Permesso o scambiato sul tabellone) 
      oppure <strong>"Rifiuta"</strong> con facoltà di digitare una breve nota esplicativa (es. <em>"Fabbisogno cassa non coperto in data 15/10"</em>).</li>
    </ul>

    <h2 class="section-title" id="cap-3-5">3.5 Generazione Automatica Intelligente (Orario Continuato e Stagione Natale)</h2>
    <p>
      Premendo il pulsante <strong>"Genera Bozza Turni"</strong> si apre la modale di pianificazione predittiva mensile:
    </p>
    <ul>
      <li><strong>Selettore Mese:</strong> Pulsanti rapidi <em>Mese Corrente</em> e <em>Prossimo Mese</em>, affiancati da tendina per pianificare qualsiasi mese futuro.</li>
      <li><strong>Modalità Orario di Servizio:</strong> Possibilità di scegliere tra <strong>Orario Standard (Spezzato)</strong> (08:30–12:30 e 14:30–19:30) oppure <strong>Orario Continuato (Ottobre–Dicembre)</strong> con scaglioni 09:00, 10:00 e 10:30 e chiusura alle 19:00.</li>
      <li><strong>Toggle Stagionale Natale (Varese):</strong> Attivabile nei mesi autunnali per allocare prioritariamente i collaboratori specializzati (Matteo & Stefano) al reparto <em>Natale</em>.</li>
      <li><strong>Protezione Storico Turni Passati:</strong> Nel mese in corso, tutti i turni con data precedente a oggi sono <strong>congelati e protetti al 100%</strong>: la generazione ricalcola solo i turni futuri.</li>
      <li><strong>Sovrascrittura Selettiva:</strong> Scelta tra sovrascrittura della bozza futura o preservazione dei turni già compilati manualmente.</li>
      <li><strong>Vincoli Algoritmici Rigorosi:</strong> 5 giorni lavorativi su 7 per ciascun collaboratore (2 riposi settimanali garantiti, con 2 giorni contigui a rotazione mensile), rispetto dei contratti part-time e full-time, riposo minimo di 11 ore tra i turni, recepimento automatico di ferie e malattie già approvate.</li>
      <li><strong>Tasto "Risolvi Prima Criticità":</strong> Se l'algoritmo rileva giornate con presidi incompleti, un pulsante rapido porta la Direzione direttamente alla data scoperta per completare l'assegnazione.</li>
    </ul>

    <h2 class="section-title" id="cap-3-6">3.6 Modifica Manuale Turno, Orari Speciali e Slot Continuato</h2>
    <p>
      Cliccando su una singola cella del tabellone si apre il pannello <em>"Gestione Turno Responsabile"</em>, che consente di:
    </p>
    <ul>
      <li>Cambiare la tipologia: Mattina, Pomeriggio, Giornata Intera, Riposo, Ferie o Malattia.</li>
      <li><strong>Template Orario Continuato (9–19):</strong> Pulsanti rapidi a 3 scaglioni (<em>09:00 — 17:30</em>, <em>10:00 — 18:30</em>, <em>10:30 — 19:00</em>) per applicare all'istante i turni dell'alta stagione.</li>
      <li><strong>Personalizzazione Orario al Minuto:</strong> Impostazione orari liberi con causale automatica di turno <span class="badge badge-special">SPECIALE</span> (es. part-time contrattualizzato a 24h, flessibilità concordata o straordinario).</li>
      <li>Assegnare il reparto specifico di presidio tra tutti gli 8 reparti aziendali.</li>
      <li>Inserire mansioni o note operative visibili al collaboratore (es. <em>"Scarico carrelli vivaio ore 10:00"</em>).</li>
    </ul>

    <h2 class="section-title" id="cap-3-7">3.7 Rilevamento Criticità Settimanali e Wizard Scoperture Reparto</h2>
    <p>
      Nel tabellone desktop e nella vista giornaliera mobile è attivo un motore di controllo orario in tempo reale:
    </p>
    <ul>
      <li><strong>Banner Allerta Criticità:</strong> Se in una fascia oraria o in un giorno un reparto cardine (Cassa, Fioreria, Serre) è sguarnito, compare un avviso rosso (criticità totale) o arancione (presidio orario parziale).</li>
      <li><strong>Tasto "Ignora questo presidio":</strong> Consente al responsabile di dichiarare conscia una scopertura specifica (es. chiusura anticipata programmata). La scelta viene memorizzata sia localmente che su Supabase Cloud.</li>
      <li><strong>Tasto "Trova Sostituto" (Staff Substitution Wizard):</strong> Apre la procedura guidata per risolvere la falla analizzando l'organico:
        <ul>
          <li><strong>Candidati a Riposo:</strong> Propone colleghi disponibili a riposo che hanno alta competenza nel reparto scoperto.</li>
          <li><strong>Candidati in Estensione:</strong> Propone colleghi già in turno che possono estendere l'orario a copertura del reparto scoperto <em>senza sguarnire la loro mansione originaria</em>.</li>
        </ul>
      </li>
    </ul>

    <h2 class="section-title" id="cap-3-8">3.8 Wizard Emergenze e Sostituzioni Improvvise (Replacement Advisor)</h2>
    <p>
      Quando un collaboratore comunica un'assenza improvvisa (es. malattia mattutina o infortunio), la Direzione clicca su <strong>"Gestione Emergenza"</strong>:
    </p>
    <div class="info-box">
      <strong>Algoritmo del Replacement Advisor:</strong>
      <ol style="margin-top: 4px;">
        <li>Selezionare il collaboratore assente, la data e il reparto scoperto da presidiare con urgenza.</li>
        <li>Il sistema esclude automaticamente chi è già in servizio in quel reparto, chi è in ferie o chi violerebbe le 11 ore di riposo.</li>
        <li>Consulta la <strong>Skills Matrix</strong> e valuta il punteggio di competenza specifica nel reparto sguarnito.</li>
        <li>Presenta alla Direzione una classifica con i <strong>3 migliori sostituti ideali</strong>, motivando il punteggio assegnato.</li>
        <li>Con un click sul candidato prescelto, il turno dell'assente si converte in malattia e il sostituto viene inserito nel reparto con notifica automatica.</li>
      </ol>
    </div>

    <h2 class="section-title" id="cap-3-9">3.9 I 3 Livelli di Svuotamento e Pulizia Controllata dei Turni</h2>
    <p>
      Il pulsante <strong>"Svuota Turni"</strong> presente nel tabellone Direzione apre una modale di sicurezza con <strong>3 livelli operativi ben distinti</strong>:
    </p>
    <ul>
      <li><strong>1. Elimina solo i turni da oggi in poi (Consigliato):</strong> Rimuove esclusivamente i turni futuri a partire dalla data odierna. Tutti i turni dei giorni passati rimangono protetti al 100%, preservando intatto lo storico per buste paga e consulenti del lavoro.</li>
      <li><strong>2. Svuota un mese intero:</strong> Selettore mese che elimina tutti i turni del mese scelto (passati e futuri del solo mese) e ne revoca lo stato di pubblicazione su Supabase Cloud, riportandolo a bozza non pubblicata.</li>
      <li><strong>3. Danger Zone (Reset totale del database):</strong> Cancellazione irreversibile di qualsiasi turno registrato per la sede selezionata (incluso tutto lo storico passato). Richiede conferma esplicita. In ogni caso, anagrafiche, PIN, contratti e competenze restano protetti.</li>
    </ul>

    <h2 class="section-title" id="cap-3-10">3.10 Esportazione Bacheca A4 e Condivisione WhatsApp Negozio</h2>
    <p>
      La modale <em>"Stampa & WhatsApp"</em> consente la duplice distribuzione della programmazione settimanale:
    </p>
    <ul>
      <li><strong>Stampa per la Bacheca (PDF A4 Orizzontale):</strong> Genera la griglia ufficiale formattata ad alta leggibilità, ottimizzata per l'affissione al box cassa o nella bacheca aziendale.</li>
      <li><strong>Copia per Gruppo WhatsApp Negozio:</strong> Genera con un clic il testo formattato completo di emoji, orari e ripartizione reparti, pronto per essere incollato nelle chat di reparto o nel gruppo aziendale dei dipendenti.</li>
    </ul>

    <h2 class="section-title" id="cap-3-11">3.11 Scheda "Personale & Competenze" (Organico, Contratto e Reset PIN)</h2>
    <p>
      Questa scheda unificata consente la gestione completa del team di ciascun punto vendita:
    </p>
    <ul>
      <li><strong>Aggiungi Nuovo Collaboratore / Modifica Anagrafica:</strong> Nominativo, sede, reparto primario, ore settimanali contrattuali, email, telefono, ruolo Direzione e flag Jolly Mobile.</li>
      <li><strong>Regolatore Rapido Ore Contratto:</strong> Pulsanti preset immediati (<em>40h</em>, <em>30h</em>, <em>24h</em>, <em>20h</em>) e stepper <code>+</code>/<code>-</code> con salvataggio sincronizzato.</li>
      <li><strong>Tasto Reset PIN Rapido:</strong> Se un collaboratore dimentica il proprio codice, la Direzione tocca <em>"Reset PIN"</em> per reimpostarlo istantaneamente a <code>1234</code>.</li>
      <li><strong>Archiviazione Collaboratore:</strong> Disattiva il dipendente cessato escludendolo dai nuovi turni ma preservando lo storico presenze passato.</li>
    </ul>

    <h2 class="section-title" id="cap-3-12">3.12 Matrice Competenze (Skills Matrix per gli 8 Reparti Aziendali)</h2>
    <p>
      La <strong>Skills Matrix</strong> assegna a ciascun collaboratore un punteggio da <strong>1 a 10</strong> per ciascuno degli <strong>8 reparti aziendali</strong>:
    </p>
    <table class="manual-table">
      <thead>
        <tr>
          <th>Reparto</th>
          <th>Descrizione Competenze Misurate</th>
          <th>Soglia Minima Autonomia</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Cassa</strong></td>
          <td>Gestionale di cassa, scontrini/fatture, pagamenti elettronici, resi, velocità e precisione conteggi (priorità assoluta).</td>
          <td>Voto 7/10</td>
        </tr>
        <tr>
          <td><strong>Fioreria</strong></td>
          <td>Arte floreale, preparazione mazzi, conservazione reciso, confezionamento piante da regalo, cerimonie.</td>
          <td>Voto 8/10</td>
        </tr>
        <tr>
          <td><strong>Decor</strong></td>
          <td>Visual merchandising, oggettistica per la casa, candele, vasi e complementi d'arredo.</td>
          <td>Voto 6/10</td>
        </tr>
        <tr>
          <td><strong>Serra Calda</strong></td>
          <td>Botanica piante da interno, patologie fogliari, irrigazione di precisione, concimazione e dislocazione espositiva.</td>
          <td>Voto 6/10</td>
        </tr>
        <tr>
          <td><strong>Serra Fredda</strong></td>
          <td>Piante da esterno, vivai, alberature, fioriture stagionali, terricci e vasi resistenti alle intemperie.</td>
          <td>Voto 6/10</td>
        </tr>
        <tr>
          <td><strong>Area Tecnica</strong></td>
          <td>Manutenzione strutture vivaio, impianti irrigazione, scarico e movimentazione carrelli (Gazzada).</td>
          <td>Voto 6/10</td>
        </tr>
        <tr>
          <td><strong>Emporio</strong></td>
          <td>Presidio corsie alimentari, prodotti tipici e cura casa/giardino (Varese).</td>
          <td>Voto 6/10</td>
        </tr>
        <tr>
          <td><strong>Natale</strong></td>
          <td>Allestimento Villaggio di Natale, luci, alberi sintetici e decorazioni festive (alta stagione a Varese).</td>
          <td>Voto 6/10</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title" id="cap-3-13">3.13 Report Mensile Ore, Consuntivo Lavoro ed Export CSV Excel</h2>
    <p>
      Nella sotto-vista <strong>"Report Ore & Export Mese"</strong>, la Direzione dispone del quadro contabile completo:
    </p>
    <ul>
      <li><strong>Navigazione Mese per Mese:</strong> Frecce di scorrimento temporale con pulsante rapido <em>"Oggi"</em>.</li>
      <li><strong>KPI Mensili Aggregati:</strong> Ore lavorate totali della sede, ore dedicate a Cassa, Fioreria/Decor, Serre, e totale giornate di ferie/malattia.</li>
      <li><strong>Tabella Dettaglio Collaboratore:</strong> Per ogni risorsa sono riportati: presenze effettive, riposi, assenze, ore dettagliate per ciascuno dei reparti, totale ore lavorate, ore figurative di assenza, totale ore rendicontate e saldo (+/- rispetto al contratto).</li>
      <li><strong>Scarica CSV Excel:</strong> Esporta istantaneamente un foglio di calcolo con codifica UTF-8 BOM, direttamente compatibile con Microsoft Excel e software paghe.</li>
      <li><strong>Stampa / PDF A4 Orizzontale:</strong> Formatta l'intero consuntivo in un documento stampabile ad uso archivio o consulente del lavoro.</li>
    </ul>
  </div>

  <!-- ============================================================ -->
  <!-- CAPITOLO 4 -->
  <!-- ============================================================ -->
  <div class="chapter">
    <h1 class="chapter-title" id="cap-4">4. GLOSSARIO COMPLETO DI ICONE, BADGE, BANNER E COLORI</h1>

    <h2 class="section-title" id="cap-4-1">4.1 Codice Cromatico Ufficiale delle Tipologie di Turno</h2>
    <table class="manual-table">
      <thead>
        <tr>
          <th>Badge Visivo</th>
          <th>Tipologia Turno</th>
          <th>Orario Tipico</th>
          <th>Descrizione e Note di Presidio</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-morning">Mattina</span></td>
          <td>Turno Mattutino</td>
          <td>08:30 – 12:30</td>
          <td>Apertura punto vendita, ricevimento merci, prima assistenza e cassa mattutina.</td>
        </tr>
        <tr>
          <td><span class="badge badge-afternoon">Pomeriggio</span></td>
          <td>Turno Pomeridiano</td>
          <td>14:30 – 19:30</td>
          <td>Presidio orario pomeridiano di massimo afflusso, cura del cliente e chiusura negozio.</td>
        </tr>
        <tr>
          <td><span class="badge badge-full">Giornata</span></td>
          <td>Giornata Intera</td>
          <td>08:30 – 19:30 (con pausa)</td>
          <td>Presidio continuativo giornaliero (weekend, promozioni o orario continuato 9-19).</td>
        </tr>
        <tr>
          <td><span class="badge badge-special">Speciale</span></td>
          <td>Orario Speciale Concordato</td>
          <td>Orario Personalizzato</td>
          <td>Turno con orari su misura (contratto part-time 24h/30h, estensione straordinario o flessibilità).</td>
        </tr>
        <tr>
          <td><span class="badge badge-rest">Riposo</span></td>
          <td>Riposo Settimanale</td>
          <td>—</td>
          <td>Giorno di riposo compensativo obbligatorio da legge e contratto nazionale (2 gg/settimana).</td>
        </tr>
        <tr>
          <td><span class="badge badge-leave">Ferie</span></td>
          <td>Ferie o Permesso</td>
          <td>—</td>
          <td>Assenza programmata regolarmente approvata dalla Direzione aziendale.</td>
        </tr>
        <tr>
          <td><span class="badge badge-sick">Malattia</span></td>
          <td>Malattia / Infortunio</td>
          <td>—</td>
          <td>Assenza improvvisa comunicata con certificato telematico INPS.</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title" id="cap-4-2">4.2 Significato dei Badge di Stato Richiesta e Presenza</h2>
    <table class="manual-table">
      <thead>
        <tr>
          <th>Badge</th>
          <th>Contesto</th>
          <th>Significato Operativo</th>
          <th>Azione Necessaria</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-draft">In Attesa</span></td>
          <td>Richiesta Ferie / Permesso</td>
          <td>La richiesta è stata inoltrata ed è nella coda della Direzione.</td>
          <td>Attendere la valutazione del responsabile.</td>
        </tr>
        <tr>
          <td><span class="badge badge-afternoon">In Attesa Collega</span></td>
          <td>Scambio Turno</td>
          <td>La proposta di scambio turno è stata inviata al collega bersaglio.</td>
          <td>Il collega deve aprire l'app e cliccare "Accetta Scambio".</td>
        </tr>
        <tr>
          <td><span class="badge badge-full">Approvata</span></td>
          <td>Richiesta Conclusa</td>
          <td>La richiesta è stata validata positivamente dalla Direzione.</td>
          <td>Nessuna: il tabellone turni è già stato aggiornato sul cloud.</td>
        </tr>
        <tr>
          <td><span class="badge badge-sick">Rifiutata</span></td>
          <td>Richiesta Conclusa</td>
          <td>La richiesta non ha potuto essere accolta dalla Direzione o dal collega.</td>
          <td>Consultare la nota esplicativa del manager.</td>
        </tr>
        <tr>
          <td><span class="badge badge-published">In Servizio</span></td>
          <td>Oggi in Sede</td>
          <td>Il collaboratore ha il turno attivo in questo preciso orario.</td>
          <td>Collaboratore presente e operativo in reparto.</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title" id="cap-4-3">4.3 Banner Informativi, Allarmi Criticità e Avvisi di Sistema</h2>
    <ul>
      <li><strong>Banner Giallo "Mese in Bozza":</strong> Segnala alla Direzione che i turni visualizzati sono salvati in bozza e non sono ancora stati distribuiti ai collaboratori.</li>
      <li><strong>Banner Verde "Turni Pubblicati":</strong> Conferma che tutti i collaboratori stanno consultando la medesima versione ufficiale sincronizzata sul cloud.</li>
      <li><strong>Banner Rosso/Ambra Allerta Criticità:</strong> Segnala alla Direzione una scopertura di reparto oraria o totale nella settimana corrente, con tasti per ignorare il presidio o trovare un sostituto.</li>
      <li><strong>Banner Arancione Richieste Pendenti:</strong> Compare in cima al tabellone per avvisare la Direzione della presenza di richieste che attendono risposta.</li>
    </ul>

    <h2 class="section-title" id="cap-4-4">4.4 Notifiche Toast Visive in Tempo Reale</h2>
    <p>
      L'applicazione include un sistema di notifiche toast visive animate tramite connessione realtime con Supabase:
    </p>
    <ul>
      <li>Quando la Direzione pubblica nuovi turni o modifica un tuo orario, sullo schermo compare un avviso visivo immediato con chiusura automatica a tempo.</li>
      <li>Quando un collega ti propone uno scambio turno, vieni informato istantaneamente con un toast interattivo.</li>
      <li>Quando una tua richiesta di ferie viene approvata o rifiutata, ricevi subito la conferma visiva a video.</li>
    </ul>
  </div>

  <!-- ============================================================ -->
  <!-- CAPITOLO 5 -->
  <!-- ============================================================ -->
  <div class="chapter">
    <h1 class="chapter-title" id="cap-5">5. FAQ, INSTALLAZIONE PWA E SUPPORTO</h1>

    <h2 class="section-title" id="cap-5-1">5.1 Installazione dell'App come Icona su Smartphone e PC</h2>
    <p>
      Per avere l'App Turni Nicora a portata di mano senza dover digitare l'indirizzo web ogni volta:
    </p>
    <div class="card-grid">
      <div class="card">
        <div class="card-title">Su iPhone e iPad (Safari)</div>
        <ol style="font-size: 8pt; margin-left: 14px; margin-top: 4px;">
          <li>Apri il link dell'applicazione con il browser <strong>Safari</strong>.</li>
          <li>Tocca l'icona di condivisione in basso (il quadrato con la freccia verso l'alto).</li>
          <li>Scorri il menu e tocca <strong>"Aggiungi alla schermata Home"</strong>.</li>
          <li>Tocca "Aggiungi" in alto a destra: troverai l'icona ufficiale di Nicora Garden sulla tua Home!</li>
        </ol>
      </div>
      <div class="card">
        <div class="card-title">Su Android (Chrome o altri browser)</div>
        <ol style="font-size: 8pt; margin-left: 14px; margin-top: 4px;">
          <li>Apri il link con il browser <strong>Google Chrome</strong>.</li>
          <li>Tocca il pulsante verde <em>"Installa App"</em> nell'header oppure i 3 puntini del browser.</li>
          <li>Seleziona <strong>"Installa applicazione"</strong> o <strong>"Aggiungi a schermata Home"</strong>.</li>
          <li>L'app si installerà come una vera e propria applicazione nativa a schermo intero.</li>
        </ol>
      </div>
    </div>

    <h2 class="section-title" id="cap-5-2">5.2 Funzionamento Offline e Risincronizzazione Dati</h2>
    <p>
      L'applicazione è progettata con tecnologia <em>Offline-First</em>:
    </p>
    <ul>
      <li>I turni pubblicati e l'organico di sede vengono salvati in una cache locale protetta sul tuo dispositivo.</li>
      <li>Se ti trovi nelle serre fredde, nei vivai esterni o nel magazzino privo di connessione internet, puoi comunque consultare il tuo orario e l'elenco dei colleghi in servizio.</li>
      <li>Non appena la rete torna disponibile, l'app risincronizza in automatico qualsiasi modifica intervenuta nel frattempo.</li>
    </ul>

    <h2 class="section-title" id="cap-5-3">5.3 Procedura di Recupero e Modifica del PIN o Password</h2>
    <p>
      La sicurezza e la semplicità di accesso sono entrambe garantite:
    </p>
    <ul>
      <li><strong>Modifica Autonoma del PIN:</strong> Clicca sul tuo avatar in alto a destra, seleziona <em>"Modifica PIN"</em>, inserisci il tuo PIN attuale e imposta quello nuovo.</li>
      <li><strong>PIN Dimenticato (Procedura Rapida Collaboratore):</strong> Dalla schermata di login, tocca <em>"Hai dimenticato il PIN?"</em>. Si aprirà una modale con un pulsante rapido per inviare un messaggio WhatsApp precompilato al titolare/responsabile. La Direzione aprirà la scheda del personale e premerà <em>"Reset PIN"</em> ripristinandolo a <code>1234</code> in 3 secondi.</li>
      <li><strong>Password Direzione Dimenticata:</strong> Dalla schermata di login Responsabile, tocca <em>"Password dimenticata?"</em>. Se la password di default (<code>admin</code>) è stata modificata, è possibile sbloccare l'accesso tramite la Master Recovery Key aziendale o reimpostarla dal pannello cloud Supabase.</li>
    </ul>

    <h2 class="section-title" id="cap-5-4">5.4 Verifica Aggiornamenti dell'Applicazione</h2>
    <p>
      Per assicurarsi di utilizzare sempre l'ultimissima versione rilasciata senza cancellare le sessioni di accesso memorizzate:
    </p>
    <ul>
      <li>Aprire il menu profilo in alto a destra e toccare <strong>"Verifica aggiornamenti app"</strong>.</li>
      <li>L'applicazione controlla la versione remota, aggiorna il service worker PWA e ricarica i file più recenti in un istante.</li>
    </ul>

    <div style="margin-top: 30px; padding: 15px; border-top: 2px solid #0a474b; text-align: center; font-size: 8.5pt; color: #4a5568;">
      <strong>Nicora Garden S.r.l.</strong> • Gazzada Schianno (VA) & Varese (VA)<br>
      Piattaforma Gestionale Turni e Presenze • Per supporto o segnalazioni rivolgersi alla Direzione Aziendale
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    print("Avvio generazione PDF del Manuale d'Uso Completo con Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html_content, wait_until="networkidle")
        
        # Salva in public/ per servire direttamente nell'applicazione
        public_pdf_path = os.path.join(PUBLIC_DIR, "manuale_istruzioni_app_turni.pdf")
        page.pdf(
            path=public_pdf_path,
            format="A4",
            print_background=True,
            margin={"top": "18mm", "bottom": "18mm", "left": "16mm", "right": "16mm"}
        )
        print(f"PDF salvato con successo in: {public_pdf_path}")
        
        # Salva anche in docs/ per archivio documentale
        docs_pdf_path = os.path.join(DOCS_DIR, "Manuale_Istruzioni_Nicora_Garden.pdf")
        page.pdf(
            path=docs_pdf_path,
            format="A4",
            print_background=True,
            margin={"top": "18mm", "bottom": "18mm", "left": "16mm", "right": "16mm"}
        )
        print(f"Copia archivio salvata in: {docs_pdf_path}")
        browser.close()

if __name__ == "__main__":
    generate_pdf()
