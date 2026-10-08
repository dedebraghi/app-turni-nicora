import os
import sys
from playwright.sync_api import sync_playwright

DOCS_DIR = os.path.abspath("docs")
os.makedirs(DOCS_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. TEMPLATE HTML: NOTE E DECISIONI STRATEGICHE (PER VITTORE)
# -------------------------------------------------------------
html_decisioni = """<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>App Turni Nicora Garden - Note e Decisioni Strategiche</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: "Pagina " counter(page) " di " counter(pages);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 8pt;
        color: #6b7280;
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      font-size: 9.5pt;
      line-height: 1.45;
    }
    
    .header-box {
      border-bottom: 2px solid #0a474b;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .brand-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0a474b;
      letter-spacing: -0.02em;
    }
    
    .brand-subtitle {
      font-size: 9pt;
      color: #fd651e;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-top: 2px;
    }
    
    .meta-box {
      text-align: right;
      font-size: 8.5pt;
      color: #4b5563;
    }
    
    .meta-box strong {
      color: #111827;
    }
    
    .intro-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 9pt;
      color: #166534;
    }
    
    .question-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #0a474b;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    
    .question-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0a474b;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }
    
    .question-desc {
      font-size: 9pt;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .question-prompt {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 9pt;
      color: #9a3412;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }
    
    .option-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 8.5pt;
    }
    
    .option-box.recommended {
      background: #f0fdf9;
      border-color: #99f6e4;
    }
    
    .option-header {
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    }
    
    .badge-rec {
      background: #0a474b;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    
    .badge-alt {
      background: #e5e7eb;
      color: #374151;
      font-size: 7pt;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    
    .option-detail {
      color: #4b5563;
      margin-bottom: 4px;
    }
    
    .option-meta {
      font-size: 8pt;
      border-top: 1px dashed #d1d5db;
      padding-top: 4px;
      margin-top: 4px;
    }
    
    .cost-tag {
      font-weight: 700;
      color: #0a474b;
    }
    
    .single-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 8.5pt;
      margin-bottom: 6px;
    }
    
    .footer-note {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 8pt;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- Intestazione Formale -->
  <div class="header-box">
    <div>
      <div class="brand-title">App Turni Nicora Garden</div>
      <div class="brand-subtitle">Atelier Botanico &bull; Sedi di Gazzada e Varese</div>
    </div>
    <div class="meta-box">
      <div><strong>Destinatario:</strong> Vittore Nicora</div>
      <div><strong>Data Documento:</strong> 8 Ottobre 2026</div>
      <div><strong>Stato:</strong> Proposte Operative & Scelte Strategiche</div>
    </div>
  </div>

  <!-- Questione 1: Database Cloud -->
  <div class="question-card">
    <div class="question-title">1. Dove salvare i dati dell'app (Database Cloud Supabase vs Sito Web)</div>
    <div class="question-desc">
      L'applicazione memorizza turni, richieste ferie e anagrafiche dei 24 collaboratori.
      Attualmente è collegata alla piattaforma cloud professionale <strong>Supabase</strong>, registrata a costo zero con un account provvisorio (<code>turni.nicora@gmail.com</code>) che ho creato per permetterti di testare l'app subito: possiamo sostituirlo o trasferirlo in qualsiasi momento a una tua email personale o aziendale.
    </div>
    <div class="question-prompt">
      La tua decisione: Manteniamo il database cloud dedicato (gratuito o base) o preferisci collegare tutto al tuo sito web attuale?
    </div>
    <div class="options-grid">
      <div class="option-box recommended">
        <div class="option-header">
          <span>Opzione A: Database Cloud Supabase</span>
          <span class="badge-rec">Consigliata</span>
        </div>
        <div class="option-detail">
          I dati risiedono su un server cloud indipendente e cifrato. Se il sito web aziendale rallenta, viene aggiornato o ha problemi, l'app dei turni continua a funzionare all'istante senza alcun rischio per il sito vetrina.<br><br>
          <strong>Come funziona il piano attuale a 0 €:</strong> Il database è gratuito. L'unico vincolo dei piani gratuiti è che se l'app non registra accessi per 7 giorni consecutivi, il database entra in pausa automatica (si riattiva con un clic). Durante l'uso lavorativo normale il problema non si pone mai. Se in futuro preferisci una continuità garantita al 100% 24/7 senza pause, puoi passare a un piano continuativo da ~5-10 €/mese.
        </div>
        <div class="option-meta">
          <strong>Pro:</strong> Massima velocità, sicurezza dati collaboratori separata dal sito.<br>
          <span class="cost-tag">Costi:</span> 0 € (piano gratuito attuale) oppure ~5-10 €/mese se desideri la garanzia no-pause continua.
        </div>
      </div>
      <div class="option-box">
        <div class="option-header">
          <span>Opzione B: Integrazione nel database WordPress</span>
          <span class="badge-alt">Sconsigliata</span>
        </div>
        <div class="option-detail">
          Scrivere i turni nello stesso database del sito WordPress attuale del garden.
        </div>
        <div class="option-meta">
          <strong>Pro:</strong> Nessun servizio cloud esterno.<br>
          <strong>Contro:</strong> Rischio di appesantire il sito vetrina; se WordPress ha un errore o va giù si bloccano anche i turni; non ottimizzato per sincronizzazioni istantanee su smartphone; richiede molte ore di riscrittura.<br>
          <span class="cost-tag">Costi:</span> Spese di sviluppo e manutenzione periodica.
        </div>
      </div>
    </div>
  </div>

  <!-- Questione 2: Dominio Web -->
  <div class="question-card">
    <div class="question-title">2. Indirizzo di accesso per il personale (turni.nicoragarden.it)</div>
    <div class="question-desc">
      Per far accedere comodamente i collaboratori senza fargli digitare indirizzi provvisori complessi, possiamo attivare un indirizzo ufficiale semplice da ricordare: <code>turni.nicoragarden.it</code>.
      Un <strong>sottodominio</strong> è un indirizzo interno al vostro dominio esistente che <strong>non costa nulla in più (0 €)</strong>.
    </div>
    <div class="question-prompt">
      Cosa serve da parte tua: Inoltrare questa breve richiesta all'agenzia che ti gestisce il sito web
    </div>
    <div class="single-box" style="background: #f8fafc; border-left: 3px solid #0a474b; padding: 10px 12px; margin-top: 6px;">
      <div style="font-weight: 700; color: #0a474b; margin-bottom: 4px; font-size: 8.5pt;">✉️ Testo pronto da copiare e girare via email all'agenzia web:</div>
      <div style="font-family: monospace; font-size: 8pt; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; line-height: 1.4; color: #1e293b;">
        <strong>Oggetto:</strong> Configurazione sottodominio turni.nicoragarden.it<br><br>
        "Buongiorno,<br>
        per la nuova applicazione interna dei turni del personale avremmo bisogno di creare il sottodominio <strong>turni.nicoragarden.it</strong> impostando un puntamento DNS di tipo <strong>CNAME</strong> verso l'applicazione.<br>
        Potete confermarmi quando il record è attivo o indicarmi a chi far riferire Davide per i parametri di destinazione?<br>
        Grazie mille, Vittore Nicora"
      </div>
      <div style="font-size: 8pt; color: #64748b; margin-top: 6px;">
        <em>L'agenzia web impiega 2 minuti ad applicare la modifica nel pannello del dominio. Nessun costo aggiuntivo per l'azienda.</em>
      </div>
    </div>
  </div>

  <!-- Questione 3: PIN Collaboratori e Password Direzione -->
  <div class="question-card">
    <div class="question-title">3. Gestione PIN collaboratori, privacy e recupero codici</div>
    <div class="question-desc">
      Ogni dipendente ha un PIN personale a 4 cifre per accedere ai propri turni. Per tutelare la privacy e la conformità di legge, non puoi vedere in chiaro i codici scelti dai collaboratori. Entrambe le procedure di sblocco rapido sono già configurate e pronte all'uso.
    </div>
    <div class="options-grid">
      <div class="option-box" style="background: #f0fdf9; border-color: #99f6e4;">
        <div class="option-header">
          <span>Se un collaboratore dimentica il PIN</span>
          <span class="badge-rec">Già Attivo</span>
        </div>
        <div class="option-detail">
          Il collaboratore tocca <em>"PIN dimenticato?"</em> al login (ha anche il tasto rapido per avvisarti direttamente su WhatsApp). Tu entri nella sezione <strong>Personale</strong> e premi <strong>"Reset PIN"</strong>. Con un solo clic il codice torna al valore provvisorio <strong>1234</strong>, così il dipendente rientra subito e ne imposta uno nuovo.
        </div>
        <div class="option-meta">
          <strong>Costo:</strong> 0 € &bull; <strong>Tempo di sblocco:</strong> 10 secondi &bull; Autonomia totale.
        </div>
      </div>
      <div class="option-box" style="background: #f0fdf9; border-color: #99f6e4;">
        <div class="option-header">
          <span>Se dimentichi la password Direzione</span>
          <span class="badge-rec">Già Attivo</span>
        </div>
        <div class="option-detail">
          La tua password iniziale di fabbrica è <code>admin</code>. Se la cambi e la dimentichi, è attiva una chiave d'emergenza segreta di riserva: <code>NicoraMaster2026!</code> che ti garantisce sempre l'accesso immediato, oltre alla possibilità di reset dal database.
        </div>
        <div class="option-meta">
          <strong>Costo:</strong> 0 € &bull; Massima sicurezza e zero rischio di blocco.
        </div>
      </div>
    </div>
  </div>

  <!-- Questione 4: Mobilità Sedi -->
  <div class="question-card">
    <div class="question-title">4. Organico e mobilità dei collaboratori tra Gazzada e Varese</div>
    <div class="question-desc">
      A Gazzada l'organico tipo è di circa 10 collaboratori (~7-8 presenti al giorno), mentre a Varese è di circa 14-16 collaboratori (~10-11 presenti al giorno). L'algoritmo garantisce sempre la copertura dei 5 reparti minimi (Cassa, Fioreria, Serra Calda, Serra Fredda, Decor).
    </div>
    <div class="question-prompt">
      La tua decisione: Come preferisci gestire gli spostamenti tra i due negozi?
    </div>
    <div class="options-grid">
      <div class="option-box">
        <div class="option-header">
          <span>Opzione 1: Dipendenti strettamente fissi</span>
          <span class="badge-alt">Rigida</span>
        </div>
        <div class="option-detail">
          Ciascuna persona lavora unicamente nel proprio punto vendita assegnato e non viene mai conteggiata o spostata nell'altro negozio.
        </div>
        <div class="option-meta">
          <strong>Pro:</strong> Massima prevedibilità per lo staff.<br>
          <strong>Contro:</strong> Se hai un'ondata di assenze o ferie in una sede, non puoi attingere dall'altra.
        </div>
      </div>
      <div class="option-box recommended">
        <div class="option-header">
          <span>Opzione 2: Collaboratori Mobili / Jolly</span>
          <span class="badge-rec">Consigliata</span>
        </div>
        <div class="option-detail">
          Ogni dipendente ha la sua sede di riferimento abituale, ma puoi contrassegnare 1 o 2 persone flessibili per sede che l'app può pianificare in trasferta se l'altro negozio è in emergenza.
        </div>
        <div class="option-meta">
          <strong>Pro:</strong> Massima flessibilità per te.<br>
          <strong>Funzione già pronta:</strong> Ti basta spuntare <em>"Collaboratore Mobile"</em> nella scheda del dipendente.
        </div>
      </div>
    </div>
  </div>

  <!-- Questione 5: Allineamento Reparti e Organico -->
  <div class="question-card">
    <div class="question-title">5. Allineamento Reparti e Organico: Dicotomia "Area Tecnica / Emporio" e Fogli Storici</div>
    <div class="question-desc">
      Dall'analisi incrociata tra i <strong>turni storici 2026</strong> (file PDF) e le nuove <strong>specifiche inviate il 07/10/2026</strong> (file Numbers / Excel), abbiamo allineato l'algoritmo alle tue tabelle su necessità e competenze. Ti sottoponiamo due conferme operative per completare l'allineamento.
    </div>
    
    <div class="question-prompt">
      Punto 1 &bull; Dicotomia nome reparto a Gazzada: Preferisci visualizzare "Area Tecnica" o "Emporio"?
    </div>
    <div class="options-grid" style="margin-bottom: 8px;">
      <div class="option-box">
        <div class="option-header">
          <span>Opzione A: Area Tecnica (Storico PDF)</span>
          <span class="badge-alt">Abitudine Gazzada</span>
        </div>
        <div class="option-detail">
          Mantiene la dicitura storica presente nei turni cartacei e PDF di Gazzada per il presidio di Ivano, Denis e Daniela.
        </div>
      </div>
      <div class="option-box recommended">
        <div class="option-header">
          <span>Opzione B: Emporio (Nuove Specifiche)</span>
          <span class="badge-rec">Consigliata</span>
        </div>
        <div class="option-detail">
          Uniforma la nomenclatura tra le due sedi (Emporio sia a Gazzada che a Varese), rispecchiando fedelmente le tue tabelle Excel.
        </div>
      </div>
    </div>

    <div class="question-prompt">
      Punto 2 &bull; Differenze di organico e turnover rispetto ai prospetti storici 2026
    </div>
    <div class="single-box" style="line-height: 1.45;">
      Dall'audit tra i prospetti storici e le nuove tabelle emergono alcune variazioni di personale che abbiamo già recepito nel sistema, ma utili per un tuo riscontro:<br><br>
      <strong>A Gazzada (9 collaboratori stabili nelle tabelle attuali):</strong><br>
      &bull; <em>Ridenominazione:</em> <strong>Teo</strong> nei PDF storici corrisponde al nominativo anagrafico <strong>Matteo F.</strong> delle nuove tabelle.<br>
      &bull; <em>Personale storico:</em> nei mesi primaverili compariva <strong>Davide</strong> (organico a 10) e nei mesi invernali <strong>Mattia</strong> (al posto di Ginevra). Nelle tabelle attuali l'organico è consolidato a 9.<br><br>
      <strong>A Varese (16 collaboratori censiti nelle tabelle attuali):</strong><br>
      &bull; <em>Nuovi ingressi:</em> Nelle tabelle sono stati inseriti <strong>Luigi</strong> e <strong>Ivan</strong> (focalizzati sul reparto Natale), non presenti nei PDF storici.<br>
      &bull; <em>Collaboratori storici non più presenti:</em> Nei PDF figuravano collaboratori continuativi da gennaio a maggio come <strong>Gaia</strong> e <strong>Claudio</strong>, oltre a presenze estive come <strong>Nancy</strong>, <strong>Sara</strong> e <strong>Arianna</strong>, non presenti nelle tabelle attuali.<br>
      &bull; <em>Disambiguazione:</em> <strong>Matteo</strong> nei PDF è censito come <strong>Matteo Z.</strong> per distinguerlo da Matteo F.<br><br>
      <span style="color: #64748b; font-size: 8pt;"><em>Nell'app abbiamo caricato esattamente l'organico attuale delle tue tabelle (9 a Gazzada, 16 a Varese). I collaboratori storici non più attivi restano archiviati nel database senza interferire con la generazione automatica.</em></span>
    </div>
  </div>

  <div class="footer-note">
    <span>Documento a uso decisionale per la direzione &bull; Davide Braghiroli</span>
    <span>Nicora Verde & Paesaggi S.r.l.</span>
  </div>

</body>
</html>
"""

# -------------------------------------------------------------
# 2. TEMPLATE HTML: REGISTRO CONSUNTIVO ORE & ATTIVITÀ
# -------------------------------------------------------------
html_consuntivo = """<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>App Turni Nicora Garden - Consuntivo Ore Lavorate</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: "Pagina " counter(page) " di " counter(pages);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 8pt;
        color: #6b7280;
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      font-size: 8.5pt;
      line-height: 1.4;
    }
    
    .header-box {
      border-bottom: 2px solid #0a474b;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .brand-title {
      font-size: 15pt;
      font-weight: 800;
      color: #0a474b;
      letter-spacing: -0.02em;
    }
    
    .brand-subtitle {
      font-size: 8.5pt;
      color: #fd651e;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-top: 2px;
    }
    
    .meta-box {
      text-align: right;
      font-size: 8pt;
      color: #4b5563;
    }
    
    .meta-box strong {
      color: #111827;
    }
    
    .summary-card {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    
    .metric-pod {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    
    .metric-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .metric-value {
      font-size: 13pt;
      font-weight: 900;
      color: #0a474b;
      margin-top: 2px;
    }
    
    .metric-sub {
      font-size: 7pt;
      color: #94a3b8;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 8pt;
    }
    
    th {
      background: #0a474b;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: top;
    }
    
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    
    .col-date {
      width: 12%;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }
    
    .col-hours {
      width: 8%;
      font-weight: 800;
      color: #0a474b;
      text-align: center;
      white-space: nowrap;
    }
    
    .col-module {
      width: 25%;
      font-weight: 700;
      color: #1e293b;
    }
    
    .col-desc {
      width: 45%;
      color: #475569;
      line-height: 1.35;
    }
    
    .col-status {
      width: 10%;
      text-align: center;
      font-weight: 700;
      color: #166534;
      white-space: nowrap;
    }
    
    .status-badge {
      background: #dcfce7;
      color: #166534;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7pt;
    }
    
    .signatures-box {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      font-size: 8pt;
      color: #475569;
      page-break-inside: avoid;
    }
    
    .sign-field {
      border-bottom: 1px dashed #94a3b8;
      height: 34px;
      margin-top: 6px;
    }
    
    .footer-note {
      margin-top: 12px;
      font-size: 7.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- Intestazione -->
  <div class="header-box">
    <div>
      <div class="brand-title">Prospetto Attività & Ore Lavorate</div>
      <div class="brand-subtitle">Gestionale Turni Nicora Garden &bull; Sedi di Gazzada e Varese</div>
    </div>
    <div class="meta-box">
      <div><strong>Referente:</strong> Vittore Nicora</div>
      <div><strong>Sviluppatore:</strong> Davide Braghiroli</div>
      <div><strong>Data:</strong> 8 Ottobre 2026</div>
    </div>
  </div>

  <!-- Riepilogo Consuntivo -->
  <div class="summary-card">
    <div class="metric-pod">
      <div class="metric-label">Monte Ore Totale</div>
      <div class="metric-value">40.5 h</div>
      <div class="metric-sub">Attività svolte</div>
    </div>
    <div class="metric-pod">
      <div class="metric-label">Tariffa Oraria</div>
      <div class="metric-value">20,00 €</div>
      <div class="metric-sub">Tariffa concordata</div>
    </div>
    <div class="metric-pod">
      <div class="metric-label">Importo Totale</div>
      <div class="metric-value">810,00 €</div>
      <div class="metric-sub">Consuntivo finale</div>
    </div>
    <div class="metric-pod">
      <div class="metric-label">Stato Consegna</div>
      <div class="metric-value" style="color: #0a474b; font-size: 11pt; margin-top: 4px;">Completato</div>
      <div class="metric-sub">Rilascio e collaudo</div>
    </div>
  </div>

  <!-- Tabella Dettagliata delle Attività -->
  <table>
    <thead>
      <tr>
        <th class="col-date">Data</th>
        <th class="col-hours">Ore</th>
        <th class="col-module">Modulo / Ambito</th>
        <th class="col-desc">Descrizione Attività</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="col-date">18/09/2026</td>
        <td class="col-hours">3.5 h</td>
        <td class="col-module">Architettura & Core Engine</td>
        <td class="col-desc">Setup PWA React 19 + TypeScript + TailwindCSS. Modelli dati (Gazzada 10, Varese 14). Sviluppo schedulerEngine (competenze 1-10), fairnessTracker ed emergencyAdvisor. Viste PlannerGrid, presenze giornaliere e richieste.</td>
      </tr>
      <tr>
        <td class="col-date">19/09/2026</td>
        <td class="col-hours">2.0 h</td>
        <td class="col-module">Cloud Database & Auth</td>
        <td class="col-desc">DDL SQL Supabase (locations, employees, shifts, shift_requests), indici, RLS e seed 24 dipendenti. Client Supabase, autenticazione ibrida (PIN rapido e login manager), fallback locale e indicatore cloud.</td>
      </tr>
      <tr>
        <td class="col-date">19/09/2026</td>
        <td class="col-hours">1.5 h</td>
        <td class="col-module">Sync Realtime & Dati Sedi</td>
        <td class="col-desc">Canali Supabase Realtime WebSocket unificati per Gazzada e Varese con gestione turni e richieste ferie. Componente NotificationToast per notifiche mirate su smartphone collaboratore in tempo reale.</td>
      </tr>
      <tr>
        <td class="col-date">20/09/2026</td>
        <td class="col-hours">2.0 h</td>
        <td class="col-module">Mobile-First UI & Orario Continuato</td>
        <td class="col-desc">Vista smartphone touch-first (MobileDayView verticale senza scroll orizzontale). Template 'Orario Continuato / Alta Stagione' (09:00-19:00 a scaglioni). Integrazione richieste uscite anticipate e ingressi flessibili.</td>
      </tr>
      <tr>
        <td class="col-date">20/09/2026</td>
        <td class="col-hours">2.0 h</td>
        <td class="col-module">Flusso Ferie & Gestione Staff</td>
        <td class="col-desc">Pannello StaffManagement (anagrafica, nuovi assunti, soft-delete per preservare storico). PendingRequestsBanner per approvazione/rifiuto rapido dal planner, conversione immediata e ricalcolo copertura cassa.</td>
      </tr>
      <tr>
        <td class="col-date">20/09/2026</td>
        <td class="col-hours">2.0 h</td>
        <td class="col-module">Personale & Ore Contratto</td>
        <td class="col-desc">Unificazione sezione Personale (competenze 1-10, ore contrattuali settimanali). Algoritmo 5gg lavorativi e 2 riposi, quadratura monte ore (40h, 30h, 24h, 20h), presidio garantito 5 reparti e computo ferie.</td>
      </tr>
      <tr>
        <td class="col-date">20/09/2026</td>
        <td class="col-hours">1.5 h</td>
        <td class="col-module">Export & Report Ore Mensile</td>
        <td class="col-desc">Modulo consuntivo mensile in Personale. Aggregazione analitica ore lavorate per dipendente e reparto, conteggio presenze/ferie/malattie, saldo ore. Export CSV per consulente lavoro e stampa PDF A4 orizzontale.</td>
      </tr>
      <tr>
        <td class="col-date">21/09/2026</td>
        <td class="col-hours">2.0 h</td>
        <td class="col-module">Risoluzione Bug & UI Refactoring</td>
        <td class="col-desc">Risoluzione Bug #1-#8 (filtro archiviati in sostituzioni emergenza, correzione distribuzione presenze, contatore slider sedi dinamico, sincronizzazione banner coperture con assegnazione automatica).</td>
      </tr>
      <tr>
        <td class="col-date">22/09/2026</td>
        <td class="col-hours">2.5 h</td>
        <td class="col-module">Analisi Dati Turni Storici Reali</td>
        <td class="col-desc">Analisi documentazione storica Nicora (PDF Gazzada e Varese 2026). Estrazione reparti, mappatura presenze medie per giorno e reparto, costruzione matrice competenze reale dei 24 collaboratori.</td>
      </tr>
      <tr>
        <td class="col-date">23/09/2026</td>
        <td class="col-hours">1.5 h</td>
        <td class="col-module">Collaboratori Mobili & Bug #9</td>
        <td class="col-desc">Inserimento organico reale, modello collaboratori mobili multi-sede (isMobile) per trasferte Gazzada-Varese in caso di deficit. Badge trasferta nel tabellone e integrazione nell'algoritmo di sostituzione.</td>
      </tr>
      <tr>
        <td class="col-date">25-27/09/2026</td>
        <td class="col-hours">2.5 h</td>
        <td class="col-module">Restyling Stitch & Dual-Layout</td>
        <td class="col-desc">Restyling completo ispirato al design system Google Stitch e brand Atelier Botanico Nicora (salvia, smeraldo, arancio). Architettura separata smartphone touch-first e desktop/tablet. MobileHeader condiviso nativo.</td>
      </tr>
      <tr>
        <td class="col-date">28/09/2026</td>
        <td class="col-hours">3.0 h</td>
        <td class="col-module">Algoritmo Mensile & Sostituzioni</td>
        <td class="col-desc">Generazione tabellone mensile in blocco unico con rispetto ferie/malattie/orari concordati. Rilevamento buchi di presidio orario con allarmi rosso/giallo. Wizard sostituzioni guidate e congelamento turni storici passati.</td>
      </tr>
      <tr>
        <td class="col-date">29/09/2026</td>
        <td class="col-hours">2.0 h</td>
        <td class="col-module">Scambi Turno & Gestione Titolare</td>
        <td class="col-desc">Flusso scambi turno a doppio consenso (accettazione collega e conferma responsabile). Segnalazione malattia con numero INPS. Esclusione titolare Vittore dalla turnazione dipendenti. ClearShiftsModal con Danger Zone.</td>
      </tr>
      <tr>
        <td class="col-date">30/09/2026</td>
        <td class="col-hours">3.0 h</td>
        <td class="col-module">Bozze, Pubblicazione & Tutorial</td>
        <td class="col-desc">Gestione bozze mensili: turni in bozza riservata e pulsante esplicito 'Pubblica Turni allo Staff' sincronizzato su Supabase. Onboarding tutorial guidato a 6 slide. PWA auto-update e formattazione date in italiano.</td>
      </tr>
      <tr>
        <td class="col-date">02/10/2026</td>
        <td class="col-hours">1.5 h</td>
        <td class="col-module">Realtime Push & Auto-Update</td>
        <td class="col-desc">Canale WebSocket Supabase Realtime con buffering anti-flapping (250ms). I collaboratori ricevono i turni aggiornati all'istante sullo smartphone senza dover premere 'Aggiorna'. Notifiche toast mirate.</td>
      </tr>
      <tr>
        <td class="col-date">05/10/2026</td>
        <td class="col-hours">2.0 h</td>
        <td class="col-module">Batch Upsert, Recupero PIN & Master Key</td>
        <td class="col-desc">Risoluzione N+1 query login via batch upsert Supabase. Dialog 'PIN dimenticato?' al login con contatto WhatsApp rapido; tasto 'Reset PIN a 1234' per Direzione con sync cloud; Master Recovery Key e documentazione operativa.</td>
      </tr>
      <tr>
        <td class="col-date">05/10/2026</td>
        <td class="col-hours">1.5 h</td>
        <td class="col-module">Manuale Operativo PDF & In-App Download</td>
        <td class="col-desc">Compilazione Manuale Operativo Ufficiale in PDF editoriale A4 (13 pag., grafica Nicora Garden, indice navigabile). Salvataggio per PWA offline e download in-app da menu account (desktop e mobile).</td>
      </tr>
      <tr>
        <td class="col-date">05/10/2026</td>
        <td class="col-hours">1.0 h</td>
        <td class="col-module">Bozze Cloud Cross-Device & Sincronizzazione</td>
        <td class="col-desc">Ciclo di vita bozze centralizzato su Supabase Cloud (sys-app-config): turni in bozza accessibili e modificabili da qualsiasi responsabile su ogni dispositivo, invisibili allo staff fino alla pubblicazione.</td>
      </tr>
      <tr>
        <td class="col-date">05/10/2026</td>
        <td class="col-hours">0.5 h</td>
        <td class="col-module">Privacy & Isolamento Richieste Staff (GDPR)</td>
        <td class="col-desc">Blindatura privacy schede Richieste: i collaboratori visualizzano solo le proprie richieste personali, con protezione dati sanitari e INPS. Visibilità completa riservata alla Direzione.</td>
      </tr>
      <tr>
        <td class="col-date">05/10/2026</td>
        <td class="col-hours">1.5 h</td>
        <td class="col-module">Audit Funzionale & Suite Test 176 Casi</td>
        <td class="col-desc">Risoluzione root cause banner bozza, rimozione auto-pubblicazione spuria, fix su 5 difetti funzionali e costruzione suite automatizzata da 176 test (unit, integration, adversarial stress test) con pass rate 100%.</td>
      </tr>
      <tr>
        <td class="col-date">07/10/2026</td>
        <td class="col-hours">1.5 h</td>
        <td class="col-module">Copertura Oraria Mensile & Competenze Vittore</td>
        <td class="col-desc">Calcolo copertura oraria mensile (calculateMonthHourlyCoverage). Navigazione rapida alle criticità ("Risolvi Prima Criticità"), indicatori pillola e frecce. Sync cloud regole ignorate e allineamento competenze con specifiche di Vittore Nicora (179 test passati).</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    <span>Prospetto consuntivo attività a tariffa concordata di 20,00 €/h</span>
    <span>Totale: 40,5 ore &bull; Importo: 810,00 €</span>
  </div>

</body>
</html>
"""

def generate_pdf(html_content, output_pdf_path):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html_content, wait_until="networkidle")
        page.pdf(
            path=output_pdf_path,
            format="A4",
            print_background=True,
            margin={"top": "14mm", "bottom": "14mm", "left": "14mm", "right": "14mm"}
        )
        browser.close()
        print(f"PDF generato con successo: {output_pdf_path}")

if __name__ == "__main__":
    pdf_decisioni = os.path.join(DOCS_DIR, "Note_e_Decisioni_Strategiche_Nicora_Garden.pdf")
    pdf_consuntivo = os.path.join(DOCS_DIR, "Registro_Consuntivo_Ore_Nicora_Garden.pdf")
    
    generate_pdf(html_decisioni, pdf_decisioni)
    generate_pdf(html_consuntivo, pdf_consuntivo)
