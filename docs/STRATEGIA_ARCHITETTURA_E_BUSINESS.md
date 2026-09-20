# Strategia Architetturale, Proprietà del Codice e Modello di Business

Documento strategico interno per lo sviluppo, rilascio e mantenimento a lungo termine dell'applicazione **Turni Nicora Garden** per le sedi di Gazzada e Varese.

---

## 1. Proprietà Intellettuale e Codice Sorgente (GitHub)

- **Proprietà del Codice**: Il repository GitHub è **privato** ed è di esclusiva proprietà dello sviluppatore (`github.com/tuo-account/app-turni-nicora`).
- **Nessuna Cessione del Sorgente**: Con la tariffa oraria pattuita (~20 €/ora per lo sviluppo), al cliente viene venduta la **licenza d'uso del software finito e funzionante come servizio (SaaS)**, non la proprietà o cessione esclusiva del codice sorgente.
- **Isolamento**: Il cliente e i suoi collaboratori non hanno accesso ai sorgenti, né possono clonarli o cederli a terzi. Gli aggiornamenti e l'evoluzione dell'app rimangono sotto il tuo esclusivo controllo.

---

## 2. Piattaforma di Hosting e Rilascio Web (Vercel)

### Account Vercel Personale dello Sviluppatore
- L'app viene deployata tramite il **tuo account Vercel personale** (piano Hobby / Free), collegato direttamente al tuo repository GitHub privato.
- Vercel compila il codice e serve unicamente i file statici di produzione compressi (Single Page Application / PWA). Il cliente interagisce con l'interfaccia via browser/smartphone esattamente come farebbe con un qualsiasi servizio SaaS moderno (es. Notion, Slack, Gmail), senza mai toccare l'infrastruttura.

### Dimensionamento & Limiti del Piano Gratuito di Vercel
Il piano Hobby gratuito di Vercel include:
- **Traffico Banda**: 100 GB / mese con CDN globale.
- **Richieste / Visualizzazioni**: Illimitate per architetture statiche/PWA.
- **Certificati SSL / HTTPS**: Illimitati e inclusi a costo zero.

#### Stima dei consumi reali per Nicora Garden (25-30 dipendenti):
1. **Dimensione bundle**: La build compressa pesa meno di **100 KB** (~0.1 MB).
2. **Meccanismo PWA & Cache**: Una volta installata o aperta su smartphone, il Service Worker memorizza i file in locale sul dispositivo. Le visite quotidiane successive non riscaricano l'applicazione.
3. **Flusso dati**: Le interazioni (lettura turni, richieste ferie) interrogano direttamente le API del database (Supabase), senza consumare risorse di calcolo su Vercel.
4. **Stima estrema**: 30 dipendenti × 5 accessi/giorno con svuotamento cache = ~15 MB/giorno ➔ **meno di 0.5 GB al mese** (pari allo **0.5%** dei 100 GB gratuiti disponibili).
5. **Zero rischi di addebito**: Il piano Hobby non prevede addebiti automatici o carte di credito per sforamenti.

---

## 3. Dominio Aziendale Personalizzato (`turni.nicoragarden.it`)

- **Costo su Vercel**: **0 € (Completamente gratuito)**.
- **Procedura tecnica**:
  1. Su Vercel si associa il dominio personalizzato `turni.nicoragarden.it`.
  2. Vercel genera il record di puntamento DNS (`CNAME` verso `cname.vercel-dns.com`).
  3. Si invia una comunicazione formale all'agenzia web / fornitore che gestisce il dominio del Garden:
     > *"Buongiorno, per consentire l'accesso al nuovo portale interno dei turni aziendali, vi chiediamo cortesemente di aggiungere un record DNS di tipo CNAME: `turni.nicoragarden.it` che punti a `cname.vercel-dns.com`."*
  4. La propagazione richiede pochi minuti e attiva in automatico il certificato SSL HTTPS gratuito.

---

## 4. Gestione Database Cloud: Modello Operativo & Economico

### A. Fase Pilota / Demo (Immediata): **Costo 0 €**
- Il database viene istanziato su **Supabase Free Tier** a nome dello sviluppatore.
- Permette di mostrare a Vittore l'applicazione completamente funzionante, multi-dispositivo e in tempo reale senza anticipare costi o richiedere dati di pagamento.
- *Nota tecnica*: Il tier gratuito va in standby ("pause") solo se rimane completamente inattivo per 7 giorni consecutivi; durante i test attivi rimane sempre operativo.

### B. Fase a Regime: I Due Modelli di Business a Confronto

Al termine della demo, verranno presentate a Vittore due opzioni trasparenti:

#### Modello 1 (Consigliato): Canone Annuale "Chiavi in Mano" gestito dallo Sviluppatore
- **Come funziona**: Il database cloud rimane sotto la gestione dello sviluppatore (su piano base con risorse attive 24/7 a ~3-5 €/mese).
- **Proposta commerciale**: Viene concordato con Nicora Garden un **canone forfettario di gestione annuale** (es. **100 € - 150 € / anno** fatturato una tantum).
- **Vantaggi per il Cliente**:
  - Nessuna incombenza amministrativa, nessuna registrazione su piattaforme tecniche estere, nessuna micro-fattura mensile in valuta estera in contabilità.
  - Garanzia di funzionamento, monitoraggio e backup inclusi nel pacchetto.
- **Vantaggi per lo Sviluppatore**:
  - Copertura dei costi vivi dei server con margine netto (~50-80 €/anno).
  - Pieno controllo dell'architettura e fidelizzazione del cliente per manutenzioni future.

#### Modello 2: Intestazione Diretta al Cliente (Fatturazione Diretta Nicora)
- **Come funziona**: Si crea l'account del database con email aziendale (`amministrazione@nicoragarden.it`) e carta di credito aziendale del Garden.
- **Vantaggi**: Il cliente scarica direttamente i costi vivi dell'infrastruttura. Lo sviluppatore chiude la prestazione con il saldo delle ore lavorate.
- **Svantaggi**: Maggiori attriti amministrativi per il cliente e potenziale disservizio se la carta scade o non viene rinnovata.

---

## 5. Roadmap e Piano d'Azione

1. **Setup Demo**: Deploy su Vercel personale + Supabase Free.
2. **Test con Vittore**: Validazione delle funzionalità con dati reali.
3. **Messa a Regime**: Scelta del modello di gestione (Canone annuale vs Account aziendale diretto) e configurazione del sottodominio aziendale `turni.nicoragarden.it`.
