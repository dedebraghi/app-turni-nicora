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

    /* Links e ancore */
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

    /* Struttura capitoli */
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

    /* Box e Card illustrative */
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

    /* Badge & Tag */
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
    .badge-rest { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .badge-leave { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .badge-sick { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
    .badge-draft { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-published { background: #dcfce7; color: #166534; border: 1px solid #86efac; }

    /* Tabelle */
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

    /* Indice TOC */
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

    .toc-dots {
      flex-grow: 1;
      border-bottom: 1px dotted #a0aec0;
      margin: 0 8px 3px 8px;
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
        gestione presenze, richieste ferie, cambi turno, algoritmo di schedulazione 
        ed emergenze operative.
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
          <td>Ottobre 2026 • Versione Ufficiale 1.0</td>
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
      <div class="toc-item level-2"><a href="#cap-1-2">1.2 Accesso Collaboratore (PIN Rapido a 4 Cifre)</a></div>
      <div class="toc-item level-2"><a href="#cap-1-3">1.3 Accesso Responsabile e Direzione (Password Sicura)</a></div>
      <div class="toc-item level-2"><a href="#cap-1-4">1.4 Selezione della Sede Operativa (Gazzada vs Varese)</a></div>
      <div class="toc-item level-2"><a href="#cap-1-5">1.5 Barra Superiore (Header) e Menu Utente</a></div>

      <div class="toc-item level-1"><a href="#cap-2">2. Guida Completa per i Collaboratori (Staff)</a></div>
      <div class="toc-item level-2"><a href="#cap-2-1">2.1 Scheda "Oggi in Sede" (Presenze e Colleghi di Turno)</a></div>
      <div class="toc-item level-2"><a href="#cap-2-2">2.2 Scheda "I Miei Turni" (Pianificazione Personale della Settimana)</a></div>
      <div class="toc-item level-2"><a href="#cap-2-3">2.3 Scheda "Richieste Ferie & Permessi" (Inoltro e Tracciamento)</a></div>
      <div class="toc-item level-2"><a href="#cap-2-4">2.4 Procedura Guidata di Scambio Turno con un Collega</a></div>

      <div class="toc-item level-1"><a href="#cap-3">3. Guida Completa per la Direzione e i Responsabili (Admin)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-1">3.1 Modalità Responsabile e Monitoraggio Presenze</a></div>
      <div class="toc-item level-2"><a href="#cap-3-2">3.2 Scheda "Pianificatore Turni" (Tabellone Settimanale e Mensile)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-3">3.3 Ciclo di Vita dei Turni: Bozza Cloud Riservata vs Pubblicazione allo Staff</a></div>
      <div class="toc-item level-2"><a href="#cap-3-4">3.4 Banner e Gestione Rapida Richieste Pendenti</a></div>
      <div class="toc-item level-2"><a href="#cap-3-5">3.5 Generazione Automatica Intelligente dei Turni</a></div>
      <div class="toc-item level-2"><a href="#cap-3-6">3.6 Modifica Manuale e Assegnazione Postazione Turno</a></div>
      <div class="toc-item level-2"><a href="#cap-3-7">3.7 Wizard Gestione Emergenze e Sostituzioni Improvvise</a></div>
      <div class="toc-item level-2"><a href="#cap-3-8">3.8 Svuotamento e Pulizia Controllata dei Turni</a></div>
      <div class="toc-item level-2"><a href="#cap-3-9">3.9 Esportazione e Stampa Ufficiale per Bacheca</a></div>
      <div class="toc-item level-2"><a href="#cap-3-10">3.10 Scheda "Personale e Competenze" (Anagrafica e Modifica)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-11">3.11 Matrice Competenze (Skills Matrix)</a></div>
      <div class="toc-item level-2"><a href="#cap-3-12">3.12 Monitoraggio Equità (Fairness Tracker e Ore Lavorate)</a></div>

      <div class="toc-item level-1"><a href="#cap-4">4. Glossario Completo di Icone, Badge, Banner e Colori</a></div>
      <div class="toc-item level-2"><a href="#cap-4-1">4.1 Codice Cromatico Ufficiale delle Tipologie di Turno</a></div>
      <div class="toc-item level-2"><a href="#cap-4-2">4.2 Significato dei Badge di Stato Richiesta e Presenza</a></div>
      <div class="toc-item level-2"><a href="#cap-4-3">4.3 Banner Informativi e Avvisi di Sistema</a></div>
      <div class="toc-item level-2"><a href="#cap-4-4">4.4 Notifiche Toast in Tempo Reale</a></div>

      <div class="toc-item level-1"><a href="#cap-5">5. FAQ, Installazione PWA e Supporto</a></div>
      <div class="toc-item level-2"><a href="#cap-5-1">5.1 Installazione dell'App come Icona su Smartphone e PC</a></div>
      <div class="toc-item level-2"><a href="#cap-5-2">5.2 Funzionamento Offline e Risincronizzazione Dati</a></div>
      <div class="toc-item level-2"><a href="#cap-5-3">5.3 Smarrimento o Modifica del PIN di Accesso</a></div>
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
      assicurare una turnazione etica ed equa, e fornire alla Direzione uno strumento infallibile per presidiare costantemente 
      tutti i reparti chiave (a Gazzada: Cassa, Fioreria, Serra Fredda, Serra Calda, Area Tecnica; a Varese: Cassa, Fioreria, Decor, Emporio, Serra Calda, Serra Fredda e stagione Natale).
    </p>

    <div class="info-box">
      <strong>Accessibilità Multipiattaforma:</strong> L'applicazione è fruibile da qualsiasi dispositivo (smartphone iOS/Android, tablet, 
      PC Windows e Mac). È configurata come Progressive Web App (PWA), consentendo l'installazione diretta con icona sulla schermata home 
      e garantendo l'accesso ai turni anche quando ci si trova in una zona del vivaio con copertura internet debole o assente.
    </div>

    <h2 class="section-title" id="cap-1-2">1.2 Accesso Collaboratore (PIN Rapido a 4 Cifre)</h2>
    <p>
      Per rendere l'accesso immediato anche durante il servizio attivo, i collaboratori non devono digitare complesse credenziali:
    </p>
    <ul>
      <li>Dalla schermata di login, selezionare la propria sede di appartenenza (Gazzada o Varese).</li>
      <li>Cliccare o toccare il proprio nome all'interno dell'elenco del personale.</li>
      <li>Digitare il proprio <strong>PIN a 4 cifre</strong> sulla tastiera numerica su schermo.</li>
      <li>Se il PIN è corretto, l'accesso avviene istantaneamente, caricando il profilo personale, i turni del mese e lo stato delle richieste.</li>
    </ul>

    <h2 class="section-title" id="cap-1-3">1.3 Accesso Responsabile e Direzione (Password Sicura)</h2>
    <p>
      I responsabili di sede e i componenti della Direzione accedono tramite la sezione dedicata <strong>"Accesso Direzione"</strong>:
    </p>
    <ul>
      <li>Selezionare la tab <em>"Responsabile / Direzione"</em> nella parte alta della schermata di login.</li>
      <li>Inserire la password riservata di sede o master.</li>
      <li>All'accesso, l'applicazione attiva la <strong>Modalità Direzione</strong>, sbloccando i permessi di modifica su tutti i turni, 
      l'accesso alla matrice competenze, la generazione automatica algoritmica e il pannello di approvazione ferie e cambi turno.</li>
    </ul>

    <h2 class="section-title" id="cap-1-4">1.4 Selezione della Sede Operativa (Gazzada vs Varese)</h2>
    <p>
      Nell'header superiore è sempre visibile il pulsante di selezione sede (es. <em>"Nicora Garden Gazzada"</em> con badge arancione). 
      I responsabili possono passare liberamente da una sede all'altra con un solo tocco, visualizzando all'istante l'organico, il tabellone 
      e le presenze dell'altro punto vendita senza dover effettuare un nuovo login.
    </p>

    <h2 class="section-title" id="cap-1-5">1.5 Barra Superiore (Header) e Menu Utente</h2>
    <p>
      L'header (nella versione desktop e nella versione mobile dedicata) racchiude tutti gli indicatori di stato fondamentali:
    </p>
    <ul>
      <li><strong>Logo Nicora Garden:</strong> Tasto rapido per tornare alla pagina principale "Oggi in Sede".</li>
      <li><strong>Indicatore di Connessione Cloud:</strong> Mostra il pallino verde di sincronizzazione in tempo reale con il database Supabase. 
      Se la connessione cade, l'app avvisa automaticamente che si sta operando in modalità offline con dati memorizzati localmente.</li>
      <li><strong>Pulsante Aggiorna Turni (Refresh):</strong> Icona con due frecce circolari che risincronizza forzatamente l'app con il cloud.</li>
      <li><strong>Campanella Notifiche:</strong> Evidenzia con un pallino numerato arancione le richieste di cambio turno in attesa di risposta da parte del collega o le richieste di ferie in attesa di approvazione da parte della Direzione.</li>
      <li><strong>Menu Utente (Profilo):</strong> Cliccando sull'avatar con le proprie iniziali si apre il menu a tendina che include:
        <ul>
          <li><strong>Guida Rapida all'App:</strong> Riapre il tutorial interattivo guidato passo-passo a schede illustrative.</li>
          <li><strong>Scarica Istruzioni Complete (PDF):</strong> Scarica o apre istantaneamente il presente manuale completo in formato PDF.</li>
          <li><strong>Modifica PIN / Password:</strong> Permette al collaboratore di cambiare in autonomia il proprio PIN a 4 cifre inserendo prima quello attuale.</li>
          <li><strong>Esci dalla Sessione:</strong> Disconnette l'utente e ritorna alla schermata di selezione collaboratore.</li>
        </ul>
      </li>
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
      <li><strong>Tipologia di Turno:</strong> Dicitura riassuntiva (<em>Giornata Intera</em>, <em>Mattina (Mezza g.)</em> o con icona e spunta verde <em>In Cassa</em>).</li>
      <li><strong>Modifica Rapida (solo per la Direzione):</strong> In modalità Responsabile, cliccando sulla card si apre la finestra di modifica del turno per intervenire su orari o reparto in caso di esigenze dell'ultimo minuto.</li>
    </ul>

    <h3 class="sub-title">Sezione Collaboratori a Riposo, Ferie o Assenti</h3>
    <p>
      In fondo alla pagina, un'apposita sezione contrassegnata dall'icona della tazzina di caffè elenca tutti i colleghi dell'organico che oggi non sono di turno, evidenziando chiaramente per ciascuno:
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
        <div class="card-title">Hero Card Profilo & 3 Indicatori Settimanali</div>
        <p style="font-size: 8pt; color: #4a5568;">
          In cima alla pagina compare il tuo profilo personale (nome, reparto di appartenenza e sede). 
          Nel riquadro sono integrati 3 contatori sintetici ricalcolati per la settimana selezionata:
          <br>• <strong>Turni:</strong> numero totale di giornate di lavoro previste (es. 5 turni).
          <br>• <strong>Riposi:</strong> numero di giornate di riposo settimanale programmate (es. 2 riposi).
          <br>• <strong>Assenze:</strong> eventuali giornate di ferie, permesso o malattia ricadenti nella settimana.
        </p>
      </div>
      <div class="card">
        <div class="card-title">Promemoria di Sicurezza PIN</div>
        <p style="font-size: 8pt; color: #4a5568;">
          Se stai ancora utilizzando il codice provvisorio di fabbrica (<em>1234</em>), in cima alla schermata compare 
          un promemoria color ambra che ti invita a personalizzare il tuo PIN a 4 cifre dal menu del profilo per proteggere la tua riservatezza.
        </p>
      </div>
    </div>

    <h3 class="sub-title">Barra di Navigazione Settimanale (Domenica – Sabato)</h3>
    <p>
      L'organizzazione oraria in Nicora Garden segue il ciclo settimanale da Domenica a Sabato. 
      Tramite i pulsanti freccia (<em>Precedente</em> e <em>Successiva</em>) è possibile scorrere le settimane:
    </p>
    <ul>
      <li>Un indicatore testuale evidenzia immediatamente se stai consultando la <span class="badge badge-published">SETTIMANA IN CORSO</span>, la <span class="badge badge-afternoon">PROSSIMA SETTIMANA</span> oppure un periodo precedente o futuro.</li>
      <li>Viene riportato l'intervallo esatto di date (es. <em>Domenica 4 — Sabato 10 Ottobre</em>).</li>
    </ul>

    <h3 class="sub-title">Elenco delle 7 Giornate della Settimana</h3>
    <p>
      Per ciascuno dei 7 giorni della settimana selezionata viene visualizzata una scheda dettagliata:
    </p>
    <ul>
      <li><strong>Giorno e Data:</strong> Il giorno della settimana con numero e mese. La scheda corrispondente alla giornata di <strong>OGGI</strong> è evidenziata con una cornice arancione di risalto.</li>
      <li><strong>Giornata Lavorativa:</strong> Se sei di turno, la scheda riporta la fascia oraria precisa (es. <em>08:30 — 12:30</em> o <em>08:30 — 19:30</em>), la tipologia (<em>Giornata Intera</em> o <em>Mezza Giornata</em>) e il badge colorato del reparto in cui presterai servizio.</li>
      <li><strong>Giornata Non Lavorativa:</strong> Se non lavori, la scheda indica in modo rassicurante il motivo con un badge dedicato: <em>☕ Riposo Settimanale</em>, <em>🌴 Ferie</em> oppure <em>🏥 Malattia</em>.</li>
    </ul>

    <div class="info-box">
      <strong>Visibilità dei Mesi Futuri (Bozze vs Ufficiali):</strong> Per tutelare i collaboratori ed evitare fraintendimenti, 
      i turni dei mesi futuri diventano visibili nell'app solo dopo che la Direzione ha terminato le verifiche e ha premuto il pulsante 
      di pubblicazione ufficiale sul cloud. Fino a quel momento, i turni rimangono in bozza riservata alla sola Direzione.
    </div>

    <h2 class="section-title" id="cap-2-3">2.3 Scheda "Richieste Ferie & Permessi" (Inoltro e Tracciamento)</h2>
    <p>
      Addio a foglietti volanti o messaggi WhatsApp persi. Qualsiasi richiesta di assenza deve essere registrata tramite questa scheda:
    </p>
    <ol>
      <li><strong>Nuova Richiesta Assenza:</strong> Cliccare sul pulsante verde <em>"+ Nuova Richiesta"</em>.</li>
      <li><strong>Tipologia di Richiesta:</strong> Scegliere tra <em>Ferie</em>, <em>Permesso Orario</em> o <em>Permesso Giornaliero</em>.</li>
      <li><strong>Selezione Date:</strong> Impostare la data di inizio e la data di fine (se si tratta di più giorni consecutivi) oppure la singola giornata.</li>
      <li><strong>Motivazione:</strong> Inserire una breve motivazione a beneficio della Direzione per facilitare la valutazione delle coperture di reparto.</li>
      <li><strong>Invio e Notifica:</strong> All'invio, la richiesta viene trasmessa su Supabase Cloud e compare in tempo reale nel tabellone della Direzione con lo stato <span class="badge badge-draft">IN ATTESA</span>.</li>
    </ol>
    <p>
      Nella tabella delle proprie richieste è possibile visualizzare l'esito: se la Direzione accetta la richiesta lo stato diventa 
      <span class="badge badge-full">APPROVATA</span> e il turno nel calendario si trasforma automaticamente in <em>Ferie</em>; 
      se viene rifiutata, lo stato diventa <span class="badge badge-sick">RIFIUTATA</span> ed è visibile la nota esplicativa della Direzione.
    </p>

    <h2 class="section-title" id="cap-2-4">2.4 Procedura Guidata di Scambio Turno con un Collega</h2>
    <p>
      L'applicazione include un sistema intelligente a doppio consenso per scambiare un turno di lavoro con un collega di reparto:
    </p>
    <div class="info-box">
      <strong>Flusso in 3 Passaggi dello Scambio Turno:</strong>
      <ol style="margin-top: 6px;">
        <li><strong>Fase 1 (Proposta):</strong> Tu selezioni il tuo giorno/turno da cedere (es. Sabato 10 Ottobre mattina), selezioni il collega con cui vuoi effettuare lo scambio e indichi il turno del collega che faresti in cambio.</li>
        <li><strong>Fase 2 (Consenso del Collega):</strong> Il collega riceve una notifica in-app e un avviso nella propria scheda richieste con stato <span class="badge badge-afternoon">IN ATTESA DEL COLLEGA</span>. Il collega può esaminare la proposta e cliccare <em>"Accetta Scambio"</em> oppure <em>"Declina"</em>.</li>
        <li><strong>Fase 3 (Autorizzazione Direzione):</strong> Se il collega accetta, la richiesta passa automaticamente all'attenzione della Direzione (<span class="badge badge-draft">IN ATTESA DIREZIONE</span>). La Direzione verifica che non vengano violati i riposi obbligatori e, approvando con un click, scambia in automatico i due turni sul tabellone ufficiale!</li>
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
      Quando l'utente loggato ha il ruolo di Responsabile o Direzione, l'interfaccia si arricchisce delle funzionalità amministrative. 
      Nell'header compare il toggle <strong>"Modalità Responsabile"</strong> che consente di alternare la vista tra la prospettiva collaboratore e la prospettiva manager. 
      Nella scheda <em>Oggi in Sede</em>, la Direzione può cliccare su qualsiasi card collaboratore per modificare all'istante l'orario o la postazione del giorno.
    </p>

    <h2 class="section-title" id="cap-3-2">3.2 Scheda "Pianificatore Turni" (Tabellone Settimanale e Mensile)</h2>
    <p>
      Il <strong>Tabellone Pianificatore</strong> è il cuore pulsante della gestione del punto vendita. Mostra una matrice completa in cui:
    </p>
    <ul>
      <li><strong>Asse Verticale:</strong> Tutti i collaboratori della sede attiva, con avatar, ruolo primario e conteggio cumulativo delle ore pianificate nella settimana corrente (con evidenziazione in rosso se sforano il contratto o in arancione se sono sotto-assegnati).</li>
      <li><strong>Asse Orizzontale:</strong> I giorni della settimana (da Lunedì a Domenica). La Domenica ha una cornice di risalto color arancio per evidenziare il presidio festivo.</li>
      <li><strong>Celle Turno:</strong> Ogni cella riporta il tipo di turno, gli orari precisi, il reparto assegnato ed eventuali note speciali. Cliccando su qualsiasi cella si apre la modale di modifica immediata.</li>
    </ul>

    <h2 class="section-title" id="cap-3-3">3.3 Ciclo di Vita dei Turni: Bozza Cloud Riservata vs Pubblicazione allo Staff</h2>
    <p>
      Per consentire alla Direzione la massima serenità e flessibilità operativa durante la stesura dei turni, 
      l'applicazione adotta un sofisticato sistema a doppio stadio con sincronizzazione cloud centralizzata:
    </p>
    <div class="warning-box">
      <strong>Stato "Bozza nel Cloud" (Visibile solo ai Responsabili):</strong> Quando la Direzione genera o modifica i turni di un mese futuro, 
      i dati vengono salvati immediatamente nel database Supabase Cloud. Grazie al sistema di permessi basato sullo stato di pubblicazione, 
      la bozza è <strong>visibile a qualsiasi responsabile su qualsiasi dispositivo</strong> (PC dell'ufficio, smartphone o tablet da casa), 
      permettendo di perfezionare la turnazione ovunque ci si trovi, rimanendo nel contempo <em>completamente invisibile</em> a tutti i collaboratori di reparto. 
      Un banner giallo in cima al tabellone segnala: <em>"Bozza del mese in elaborazione (non ancora visibile allo staff)"</em>.
    </div>
    <div class="success-box">
      <strong>Pulsante "Pubblica Turni allo Staff":</strong> Una volta che la Direzione ha verificato coperture e riposi, 
      basta premere il pulsante verde <strong>"Pubblica Turni allo Staff"</strong>. In quel preciso istante, il mese viene registrato 
      come ufficiale sul Cloud Supabase e i turni diventano immediatamente visibili e notificati a tutto lo staff su tutti i loro dispositivi.
    </div>

    <h2 class="section-title" id="cap-3-4">3.4 Banner e Gestione Rapida Richieste Pendenti</h2>
    <p>
      In cima al tabellone pianificatore compare automaticamente il <strong>Banner Richieste Pendenti</strong> non appena uno o più collaboratori 
      hanno inoltrato richieste di ferie, permessi o scambi turno approvati dal collega:
    </p>
    <ul>
      <li>Il banner riporta il nome del dipendente, il periodo richiesto, il tipo di assenza e la motivazione.</li>
      <li>La Direzione può cliccare direttamente su <strong>"Approva"</strong> (il turno del collaboratore viene convertito immediatamente in Ferie/Permesso) 
      oppure <strong>"Rifiuta"</strong> con facoltà di digitare una breve nota esplicativa (es. <em>"Fabbisogno cassa non coperto in data 15/10"</em>).</li>
    </ul>

    <h2 class="section-title" id="cap-3-5">3.5 Generazione Automatica Intelligente dei Turni</h2>
    <p>
      Premendo il pulsante <strong>"Genera Turni con Algoritmo"</strong> si apre la modale di schedulazione predittiva. 
      L'algoritmo matematico proprietario esegue migliaia di combinazioni tenendo conto simultaneamente di:
    </p>
    <ul>
      <li><strong>Fabbisogni Minimi di Reparto:</strong> Copertura garantita di almeno N persone in Cassa, N in Fioreria e N nelle Serre in ogni fascia oraria.</li>
      <li><strong>Rispetto delle Ferie Approvate:</strong> Nessun turno viene assegnato a collaboratori con richieste già approvate per quel periodo.</li>
      <li><strong>Rispetto Rigoroso dei Contratti:</strong> Raggiungimento esatto delle 40 ore settimanali per i full-time e del monte ore previsto per i part-time.</li>
      <li><strong>Vincolo di Riposo Settimanale:</strong> Assegnazione di almeno un giorno di riposo per ciascun collaboratore a settimana e rispetto delle 11 ore minime di stacco tra turno serale e turno mattutino consecutivo.</li>
      <li><strong>Equità delle Domeniche:</strong> Rotazione automatica per fare in modo che le domeniche lavorate siano distribuite equamente nell'arco dei mesi.</li>
      <li><strong>Matrice Competenze:</strong> Assegnazione delle persone nei reparti dove hanno punteggi di eccellenza (es. Cassa o Fioreria).</li>
    </ul>

    <h2 class="section-title" id="cap-3-6">3.6 Modifica Manuale e Assegnazione Postazione Turno</h2>
    <p>
      Cliccando su una singola cella del tabellone si apre il pannello <em>"Modifica Turno"</em>, che consente di:
    </p>
    <ul>
      <li>Cambiare la tipologia: Mattina, Pomeriggio, Giornata Intera, Riposo, Ferie o Malattia.</li>
      <li>Personalizzare l'orario di inizio e fine turno al minuto (es. 09:15 - 13:15).</li>
      <li>Assegnare il reparto specifico di presidio (utile per collaboratori polivalenti).</li>
      <li>Inserire note operative visibili al collaboratore (es. <em>"Scarico carrelli Olanda ore 10:00"</em>).</li>
    </ul>

    <h2 class="section-title" id="cap-3-7">3.7 Wizard Gestione Emergenze e Sostituzioni Improvvise</h2>
    <p>
      Quando un collaboratore comunica un'assenza improvvisa (es. malattia mattutina o infortunio), la Direzione clicca su <strong>"Gestione Emergenze"</strong>:
    </p>
    <div class="info-box">
      <strong>Come funziona il Replacement Advisor:</strong>
      <p style="font-size: 8.5pt; margin-top: 4px;">
        1. Selezionare il collaboratore assente e il turno scoperto.
        <br>2. Il sistema esclude all'istante chi è già di turno, chi è in ferie o chi violerebbe le 11 ore di riposo.
        <br>3. Analizza la <strong>Skills Matrix</strong> per verificare chi ha la competenza richiesta dal reparto rimasto scoperto.
        <br>4. Esamina il <strong>Fairness Tracker</strong> e il monte ore settimanale per favorire chi ha meno ore lavorate o meno domeniche accumulate.
        <br>5. Presenta alla Direzione una classifica con i <strong>3 migliori sostituti ideali</strong>, spiegando per ciascuno il motivo del punteggio.
        <br>6. Con un click sul candidato prescelto, il turno viene riassegnato e il collaboratore avvisato!
      </p>
    </div>

    <h2 class="section-title" id="cap-3-8">3.8 Svuotamento e Pulizia Controllata dei Turni</h2>
    <p>
      Nel caso in cui si desideri azzerare la pianificazione per rigenerarla o riorganizzarla, il pulsante <strong>"Svuota Turni"</strong> presente nel tabellone Direzione apre una finestra dedicata con due livelli operativi ben distinti:
    </p>
    <ul>
      <li><strong>Opzione Consigliata ("Elimina solo i turni da oggi in poi"):</strong> Rimuove esclusivamente i turni futuri a partire dalla data odierna in avanti. Tutti i turni dei giorni passati rimangono protetti al 100%, preservando intatto lo storico delle presenze per i conteggi ore e le buste paga.</li>
      <li><strong>Danger Zone ("Svuota TUTTO il database, incluso lo storico"):</strong> Azzeramento totale e irreversibile di qualsiasi turno registrato per la sede selezionata (passato e futuro). Questa opzione richiede una seconda conferma esplicita tramite avviso di sicurezza a schermo. In ogni caso, le anagrafiche dei collaboratori, i PIN, i parametri contrattuali e le competenze non vengono mai toccati.</li>
    </ul>

    <h2 class="section-title" id="cap-3-9">3.9 Esportazione e Stampa Ufficiale per Bacheca</h2>
    <p>
      La Direzione può stampare o esportare in PDF il tabellone turni ufficiale formattato per essere affisso nelle bacheche aziendali di Gazzada o Varese. 
      Il layout è ottimizzato per fogli A4 o A3 in orientamento orizzontale, con font ad altissima leggibilità, colori distintivi per reparto e tabella riassuntiva delle ore.
    </p>

    <h2 class="section-title" id="cap-3-10">3.10 Scheda "Personale e Competenze" (Anagrafica e Modifica)</h2>
    <p>
      Questa scheda consente la gestione completa del team di ciascun punto vendita:
    </p>
    <ul>
      <li><strong>Aggiungi Nuovo Collaboratore:</strong> Nome, cognome, ruolo principale, ore settimanali contrattuali, email, telefono e PIN iniziale.</li>
      <li><strong>Modifica Parametri Contrattuali:</strong> Aggiornamento ore settimanali (es. passaggio da 20h a 40h) e sede di assegnazione prevalente.</li>
      <li><strong>Tasto Reset PIN Rapido:</strong> Se un collaboratore dimentica il proprio codice, la Direzione può generare o reimpostare un nuovo PIN in 3 secondi.</li>
      <li><strong>Archiviazione Collaboratore:</strong> Se un dipendente cessa la collaborazione, non viene cancellato fisicamente dal database (per preservare lo storico dei turni e dei registri passati), ma semplicemente disattivato, scomparendo dal tabellone operativo.</li>
    </ul>

    <h2 class="section-title" id="cap-3-11">3.11 Matrice Competenze (Skills Matrix)</h2>
    <p>
      La <strong>Skills Matrix</strong> è una tabella bidimensionale in cui a ciascun collaboratore è assegnato un voto da <strong>1 a 10</strong> per ciascuno dei 5 reparti aziendali:
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
          <td>Utilizzo gestionale di cassa, emissione scontrini/fatture, pagamenti elettronici, gestione resi, velocità e precisione conteggi.</td>
          <td>Voto 7/10</td>
        </tr>
        <tr>
          <td><strong>Fioreria</strong></td>
          <td>Arte floreale, preparazione mazzi, conservazione reciso, confezionamento piante da regalo, assistenza cerimonie.</td>
          <td>Voto 8/10</td>
        </tr>
        <tr>
          <td><strong>Serra Calda</strong></td>
          <td>Conoscenza botanica piante da interno, patologie fogliari, irrigazione di precisione, concimazione e dislocazione espositiva.</td>
          <td>Voto 6/10</td>
        </tr>
        <tr>
          <td><strong>Serra Fredda / Vivai</strong></td>
          <td>Piante da esterno, alberature, fioriture stagionali, terricci specifici, vasi da esterno e resistenza alle intemperie.</td>
          <td>Voto 6/10</td>
        </tr>
        <tr>
          <td><strong>Decor</strong></td>
          <td>Visual merchandising, oggettistica per la casa, candele, vasi e complementi d'arredo.</td>
          <td>Voto 6/10</td>
        </tr>
        <tr>
          <td><strong>Area Tecnica</strong></td>
          <td>Manutenzione strutture vivaio, impianti di irrigazione, scarico e movimentazione carrelli, logistica magazzino (Gazzada).</td>
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
    <p>
      La Direzione può modificare i punteggi con un semplice click. L'algoritmo di generazione automatica e il wizard delle emergenze leggono questi dati in tempo reale per non lasciare mai sguarnito un reparto critico.
    </p>

    <h2 class="section-title" id="cap-3-12">3.12 Monitoraggio Equità (Fairness Tracker e Ore Lavorate)</h2>
    <p>
      Per favorire un clima aziendale sereno e motivante, il modulo <strong>Fairness Tracker</strong> traccia automaticamente:
    </p>
    <ul>
      <li>Il conteggio esatto delle <strong>Domeniche lavorate</strong> da ciascun collaboratore nell'anno solare.</li>
      <li>Il numero di turni spezzati o chiusure serali effettuate.</li>
      <li>Lo scostamento cumulativo tra ore pianificate e ore da contratto.</li>
    </ul>
    <p>
      Quando si verificano squilibri (es. un dipendente che ha lavorato 3 domeniche consecutive rispetto a un collega con zero domeniche), il sistema segnala visivamente la disparità suggerendo la compensazione nei turni successivi.
    </p>
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
          <td>Apertura del punto vendita, ricevimento merci, prima assistenza clienti e cassa mattutina.</td>
        </tr>
        <tr>
          <td><span class="badge badge-afternoon">Pomeriggio</span></td>
          <td>Turno Pomeridiano</td>
          <td>14:30 – 19:30</td>
          <td>Presidio orario pomeridiano di massimo afflusso, cura del cliente, chiusura cassa e negozio.</td>
        </tr>
        <tr>
          <td><span class="badge badge-full">Giornata</span></td>
          <td>Giornata Intera</td>
          <td>08:30 – 19:30 (con pausa)</td>
          <td>Presidio continuativo giornaliero, solitamente adottato nei weekend o giornate promozionali.</td>
        </tr>
        <tr>
          <td><span class="badge badge-rest">Riposo</span></td>
          <td>Riposo Settimanale</td>
          <td>—</td>
          <td>Giorno di riposo compensativo obbligatorio da legge e contratto nazionale.</td>
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
          <td>La richiesta è stata inviata e si trova nella coda della Direzione.</td>
          <td>Attendere l'esame da parte del responsabile.</td>
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
          <td>Nessuna: il tabellone turni è già stato aggiornato.</td>
        </tr>
        <tr>
          <td><span class="badge badge-sick">Rifiutata</span></td>
          <td>Richiesta Conclusa</td>
          <td>La richiesta non ha potuto essere accolta per carenza organico.</td>
          <td>Consultare la nota del manager per i dettagli.</td>
        </tr>
        <tr>
          <td><span class="badge badge-published">In Servizio</span></td>
          <td>Oggi in Sede</td>
          <td>Il collaboratore ha il turno in corso in questo preciso orario.</td>
          <td>Collaboratore operativo in reparto.</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title" id="cap-4-3">4.3 Banner Informativi e Avvisi di Sistema</h2>
    <ul>
      <li><strong>Banner Giallo "Mese in Bozza":</strong> Segnala alla Direzione che i turni visualizzati sono memorizzati localmente e non sono ancora stati distribuiti ai collaboratori.</li>
      <li><strong>Banner Verde "Turni Pubblicati":</strong> Conferma che tutti i collaboratori stanno consultando la medesima versione ufficiale sincronizzata sul cloud.</li>
      <li><strong>Banner Arancione Richieste Pendenti:</strong> Compare in cima al tabellone per avvisare la Direzione della presenza di richieste che attendono risposta.</li>
    </ul>

    <h2 class="section-title" id="cap-4-4">4.4 Notifiche Toast in Tempo Reale</h2>
    <p>
      L'applicazione include un sistema di notifiche push in tempo reale tramite connessione WebSocket con Supabase:
    </p>
    <ul>
      <li>Quando la Direzione pubblica nuovi turni o modifica un turno che ti riguarda, sullo schermo compare un avviso a comparsa (Toast) con suono discreto: <em>"Il tuo turno per il giorno 12/10 è stato aggiornato"</em>.</li>
      <li>Quando un collega ti propone uno scambio turno, vieni informato all'istante anche se stavi consultando un'altra scheda.</li>
      <li>Quando la Direzione approva o rifiuta una tua richiesta di ferie, ricevi subito la conferma a video.</li>
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
          <li>Tocca i 3 puntini in alto a destra del browser oppure tocca il pulsante verde <em>"Installa App"</em> nell'header.</li>
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
      <li>I turni del mese corrente e l'organico di sede vengono salvati in una memoria protetta sul tuo dispositivo.</li>
      <li>Se ti trovi in una zona del vivaio, delle serre fredde o del magazzino senza copertura Wi-Fi o 4G/5G, puoi comunque aprire l'app e consultare l'orario del tuo turno o l'elenco dei colleghi in servizio.</li>
      <li>Non appena il dispositivo si ricollega a una connessione internet, l'indicatore nell'header torna verde e risincronizza automaticamente eventuali modifiche intervenute nel frattempo.</li>
    </ul>

    <h2 class="section-title" id="cap-5-3">5.3 Smarrimento o Modifica del PIN di Accesso</h2>
    <p>
      La sicurezza e la semplicità di accesso sono entrambe garantite:
    </p>
    <ul>
      <li><strong>Se ricordi il tuo PIN e vuoi cambiarlo:</strong> Clicca sull'icona del tuo profilo in alto a destra, seleziona <em>"Modifica PIN"</em>, inserisci il tuo PIN attuale di 4 cifre e imposta quello nuovo.</li>
      <li><strong>Se hai dimenticato il PIN:</strong> Rivolgiti direttamente al tuo Responsabile di Sede o alla Direzione. Dalla scheda <em>"Personale e Competenze"</em>, il responsabile può reimpostare un nuovo PIN provvisorio in tempo reale.</li>
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
