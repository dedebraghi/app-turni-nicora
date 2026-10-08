# Note e Decisioni Strategiche - App Turni Nicora Garden

Questo documento raccoglie in modo chiaro, trasparente e **non tecnico** le scelte architetturali, i costi vivi e le opzioni strategiche relative all'applicazione dei turni per le sedi di Gazzada e Varese.
È strutturato per esporre a **Vittore Nicora** i pro, i contro e i rischi di ciascuna strada, lasciando a lui la decisione finale.

---

## 📌 Questione 1: Il sito esistente (`nicoragarden.it`) e il Database

### Il contesto
Il sito attuale di Nicora Garden è basato su WordPress (gestito su un classico hosting web con database MySQL). 
Ci si è chiesti: *conviene riutilizzare il database del sito per far funzionare l'app dei turni, o è meglio separare le due cose?*

### Opzione A: Usare il database del sito web attuale
- **Vantaggi apparenti**: Non si apre un nuovo servizio dati esterno.
- **Rischi e Svantaggi**:
  - ⚠️ **Rischio Privacy e Sicurezza dipendenti**: Mettere anagrafiche, orari, malattie, richieste ferie e dati interni del personale sullo stesso server accessibile pubblicamente dal sito web espone l'azienda a rischi elevati in caso di vulnerabilità o attacchi al sito vetrina.
  - ⚠️ **Rischio Blocco/Stabilità**: Se l'agenzia web aggiorna WordPress o tocca il database del sito, l'app dei turni potrebbe smettere di funzionare all'improvviso (o viceversa).
  - ⚠️ **Prestazioni scarse su smartphone**: I server web tradizionali non sono ottimizzati per inviare notifiche istantanee e sincronizzare i turni in tempo reale tra i telefoni dei dipendenti.

### Opzione B (Scelta Consigliata): Database Cloud Dedicato + Indirizzo dedicato
- **Come funziona**: I dati dei turni risiedono su un database cloud moderno e cifrato, completamente separato dal sito vetrina. 
- Al sito web di Nicora chiediamo solo la creazione di un **sottodominio** (es. `turni.nicoragarden.it` o `app.nicoragarden.it`).
- **Vantaggi**:
  - 🛡️ Massima sicurezza e conformità privacy per i dipendenti.
  - ⚡ Velocità immediata sia da computer che da smartphone.
  - 🌐 Immagine aziendale al 100% professionale (`turni.nicoragarden.it`).

---

## 📌 Questione 2: Costi di Gestione del Database e del Cloud

L'obiettivo è garantire affidabilità senza spese inutili o sproporzionate.

### 1. Fase di Prova / Demo (Subito): **Costo 0 €**
- Utilizziamo la piattaforma cloud **Supabase** nel suo piano gratuito.
- Include database PostgreSQL protetto, gestione accessi e sincronizzazione in tempo reale.
- **Da sapere**: Nei piani gratuiti, se il database non riceve accessi per 7 giorni consecutivi, entra in modalità "pausa" (basta un click per riattivarlo, ma impiega qualche secondo). Durante l'uso normale non ci sono problemi.

### 2. Fase a Regime / Produzione: Due alternative a confronto
Quando l'app entrerà nell'operatività quotidiana con tutti i collaboratori, Vittore potrà scegliere tra:

| Soluzione | Costo Indicativo | Caratteristiche | A chi è adatta |
| :--- | :--- | :--- | :--- |
| **Piano Base Ottimizzato (Consigliato)** | **~3 € - 5 € / mese** | Database sempre attivo 24/7, zero tempi di attesa, backup automatici, nessun timeout. | Perfetto per Nicora Garden: spesa minima, massima solidità. |
| **Piano Enterprise (Supabase Pro)** | **~25 $ / mese (~23 €)** | Risorse dedicate per aziende con centinaia di dipendenti e grandi volumi di traffico. | Eccessivo per le esigenze attuali di 25-30 collaboratori. |

---

## 📌 Questione 3: Gestione Dipendenti, Privacy e Sicurezza

Per evitare attriti e rendere l'app semplice per tutti:

1. **Accesso Collaboratori & Gestione PIN**:
   - Ogni collaboratore accede selezionando il proprio nominativo e digitando il suo **PIN numerico riservato** (codice provvisorio iniziale di fabbrica: `1234`).
   - **Privacy garantita**: Per tutelare la riservatezza, il datore di lavoro non vede in chiaro i codici personali scelti dai dipendenti.
   - **Cosa fare se un collaboratore dimentica il PIN**:
     - Nella schermata di login è presente il link **"Hai dimenticato il PIN?"**, che apre una finestra con i 3 passaggi di sblocco e un pulsante rapido per inviare un messaggio WhatsApp precompilato al responsabile.
     - La Direzione (Vittore), dalla sezione **Personale**, apre la scheda del collaboratore o preme il tasto rapido **"Reset PIN"** accanto al nome: con un clic di conferma il PIN viene ripristinato al codice provvisorio `1234`.
     - Il collaboratore entra immediatamente con `1234` e un promemoria discreto a inizio schermata gli ricorderà di reimpostare un nuovo codice segreto dal proprio profilo.
   - **Cosa può fare**: Vede solo i suoi orari, chi è presente oggi nel proprio negozio e invia richieste di ferie/permessi/cambio turno.
   - **Cosa NON può fare**: Non può modificare i turni, non può vedere i dati riservati dei colleghi.

2. **Accesso Direzione & Master Recovery Key di Emergenza**:
   - La Direzione accede tramite la tab **Responsabile** inserendo l'email aziendale e la password amministratore (password iniziale di fabbrica: `admin`).
   - Vittore può cambiare la password in qualunque momento toccando il proprio profilo in alto a destra.
   - **Cosa fare se la Direzione dimentica la nuova password**:
     - È stata configurata nel sistema una **Master Recovery Key** d'emergenza:
       > **Master Recovery Key**: `NicoraMaster2026!`
     - Digitando questa parola chiave nel campo password della Direzione, il sistema apre sempre il tabellone amministrativo anche in caso di totale smarrimento della password memorizzata, permettendo di impostarne subito una nuova.
     - In alternativa estrema, dalla console cloud del database (Supabase), basta aprire la tabella `employees` e riscrivere `admin` nella casella `pin` dell'utente Vittore Nicora.

3. **Assegnazione Sede e Mobilità (Dilemma Aperto: Fissi vs Scambiabili)**:
   - *Punto da chiarire con Vittore*: I collaboratori appartengono in modo fisso a una specifica sede (solo Gazzada o solo Varese), oppure c'è mobilità e una persona può essere assegnata a Gazzada in una settimana e a Varese nella successiva (o fare giorni alterni a seconda delle necessità)?
   - *Impostazione consigliata nell'app*: Rendere il collaboratore "flessibile", potendo impostare una **"Sede Prevalente"** di default ma permettendo al generatore o al manager di pianificare turni sull'altra sede se si verificano emergenze o picchi di lavoro.

3. **Cosa succede quando un dipendente viene assunto o cessa il rapporto**:
   - **Nuovo assunto**: Il manager lo inserisce indicando nome, sede prevalente/flessibile e livello di competenze (1-10) nei vari reparti (cassa, fioreria, serre, decor).
   - **Cessazione rapporto**: L'account non viene "cancellato" (altrimenti si perderebbero i conteggi dei turni passati per le buste paga), ma viene impostato su **"Archiviato / Disattivato"**. L'accesso viene bloccato istantaneamente e la persona scompare dalle pianificazioni future, preservando tutto lo storico.

---

## 📌 Questione 4: Allineamento Reparti e Organico (Dicotomia "Area Tecnica" vs "Emporio" e Turnover Storico)

Dall'audit incrociato tra i **turni storici 2026** (estratti dai prospetti PDF) e le **specifiche ufficiali inviate il 07/10/2026** (file Numbers / Excel), emergono alcune differenze importanti che abbiamo già recepito nel software e che sottoponiamo a Vittore per convalida formale.

### 1. Dicotomia Reparto: "Area Tecnica" vs "Emporio" a Gazzada
- **Nei prospetti PDF storici di Gazzada**: Il reparto è sempre stato denominato **"Area Tecnica"** (presidiato abitualmente da Ivano, Denis e Daniela).
- **Nelle nuove tabelle Excel/Numbers di Vittore**: Lo stesso reparto viene invece denominato **"Emporio"** (uniformato sia a Gazzada che a Varese).
- **Stato nell'applicazione**: Nel sistema i due termini sono già collegati e trattati come sinonimi (Area Tecnica = Emporio).
- 👉 **Domanda per Vittore**: Preferisci che nell'interfaccia di Gazzada continui a comparire l'etichetta storica **"Area Tecnica"** o preferisci uniformarla a **"Emporio"** come a Varese?

### 2. Differenze di Organico e Turnover rispetto ai prospetti 2026
- **Sede di Gazzada**:
  - *Ridenominazione*: **Teo** nei PDF storici corrisponde al nominativo anagrafico formale **Matteo F.** delle nuove tabelle.
  - *Personale storico a rotazione*: Nei mesi primaverili (Maggio e Giugno) nei turni figurava un collaboratore in più (**Davide**, portando l'organico a 10 addetti), mentre nei mesi invernali (Gennaio e Febbraio) figurava **Mattia** al posto di Ginevra. Nelle tabelle attuali l'organico è consolidato a **9 persone fisse** (Sabrina, Eleonora, Matteo F., Marco, Daniela, Ginevra, Denis, Laura, Ivano).
- **Sede di Varese**:
  - *Nuovi ingressi stagionali*: Nelle tabelle compaiono **Luigi** e **Ivan** (dedicati con competenza 6 al reparto Natale), non presenti nei PDF storici dei primi 9 mesi 2026. L'organico attuale sale così a **16 collaboratori**.
  - *Collaboratori storici non più presenti nelle tabelle*: Nei turni PDF comparivano con continuità da gennaio a maggio **Gaia** e **Claudio**, oltre a presenze stagionali estive come **Nancy** (giugno/luglio), **Sara** (aprile/maggio) e **Arianna** (aprile/maggio/agosto), che non compaiono nell'elenco ufficiale attuale.
  - *Disambiguazione*: **Matteo** nei turni storici di Varese è censito nelle tabelle come **Matteo Z.** per distinguerlo chiaramente da Matteo F. di Gazzada.
- **Stato nell'applicazione**: Nell'app è caricato esattamente l'organico attuale delle tabelle ufficiali (9 addetti a Gazzada e 16 a Varese). Il personale storico non più attivo resta archiviato e disattivato nel database, senza interferire nella generazione dei turni.

---

## 📌 Questione 5: Aggiornamento Specifiche e Competenze Dipendenti (File del 07/10/2026)

Con l'invio delle tabelle ufficiali `Specifiche dipendenti turni.xlsx` (fogli *Reparti*, *Necessità Personale* e *Competenze Personale*), **la definizione delle priorità di reparto e delle necessità di personale è già stata risolta direttamente dalle tabelle di Vittore**: ciascun reparto ha ora la sua scala di importanza (da 0 a 3) e il fabbisogno giornaliero predefinito.

### 1. Applicazione Regola "Abilità Più Alta = Reparto Primario"
- Ciascun collaboratore ha ora il proprio **Reparto Primario strettamente e dinamicamente legato al valore massimo** presente nella matrice delle sue competenze.
- Se l'amministratore modifica i punteggi delle abilità dalla schermata Competenze o Anagrafica, il reparto primario del collaboratore si aggiorna in tempo reale.
- **Risoluzione parità e casi particolari (Carlo con tutti 0)**: In caso di parità di punteggio massimo (es. tra reparto ordinario e stagionale Natale, o punteggio 0), il sistema adotta come discriminante oggettivo la **frequenza storica dei turni 2026** estratti dai prospetti ufficiali (`Turni_GZ_26.pdf` e `Turni_VA_2026.pdf`):
  - *Carlo*: Supporto Corsia / Vivaio piante esterne $\rightarrow$ **Serra Fredda**;
  - *Giancarla* e *Giovanna*: Prevalenza annuale continua $\rightarrow$ **Decor**;
  - *Matteo Z.*: Prevalenza annuale continua $\rightarrow$ **Emporio**;
  - *Stefano*: Prevalenza su 8 mesi annui $\rightarrow$ **Serra Fredda**;
  - *Cinzia*: Presidio storico $\rightarrow$ **Serra Calda**;
  - *Elina*: Presidio storico $\rightarrow$ **Serra Fredda**;
  - *Denis (Gazzada)*: Presidio storico continuo $\rightarrow$ **Serra Calda**;
  - *Luigi* e *Ivan (nuovi collaboratori Varese)*: Assegnati al reparto **Natale** (loro competenza di riferimento).

### 2. Punti da chiarire con Vittore: Incongruenza "DECOR/ARREDO" a Gazzada
Analizzando i tre fogli del file Excel fornito da Vittore emergono le seguenti asimmetrie su Gazzada:
1. Nel foglio **"Reparti"**, il reparto `DECOR/ARREDO` a Gazzada ha **IMPORTANZA = 0**.
2. Nel foglio **"Competenze Personale"**, la tabella di Gazzada **non include alcuna colonna Decor** (sono presenti solo *Cassa, Fioreria, Emporio, Serra Calda, Serra Fredda*). Nessun collaboratore di Gazzada ha quindi punteggi su Decor. Al contempo compare stabilmente `EMPORIO` con presidio di Ivano (10), Denis (9) e Daniela (5).
3. Tuttavia, nel foglio **"Necessità Personale"**, la riga `DECOR/ARREDO` di Gazzada riporta **1 persona al giorno da Domenica a Sabato**.
   - Con 9 collaboratori a Gazzada (che lavorano 5 giorni su 7 per 40h), l'organico totale genera $9 \times 5 = 45$ turni settimanali (~6 presenti al giorno).
   - Richiedere 6 presidi fissi (Cassa, Fioreria, Decor, Emporio, Serra Calda, Serra Fredda) tutti i giorni vincolerebbe $6 \times 7 = 42$ turni su 45, azzerando la flessibilità per i carichi merci del venerdì/sabato e forzando a rotazione dipendenti con competenza zero sul Decor.
   - **Impostazione attuale nell'algoritmo**: Abbiamo impostato per Gazzada la necessità di Decor a **0**, garantendo la copertura dei 5 reparti reali di Gazzada (*Cassa, Fioreria, Emporio/Area Tecnica, Serra Calda, Serra Fredda*) e destinando i collaboratori disponibili al supporto vivaio e seconda cassa.
   - 👉 **Domanda per Vittore**: Il reparto Decor a Gazzada deve essere effettivamente presidiato da 1 persona dedicata ogni giorno (e in tal caso, quale collaboratore deve esserne il referente), oppure si tratta di un refuso di copia/incolla nel foglio *Necessità* e la necessità reale per Gazzada è 0 come indicato nel foglio *Reparti*?

### 3. Riposi Settimanali Disaccoppiati
- Recependo il feedback di Vittore ("*preferisco i giorni disaccoppiati, con 2 gg contigui al mese*"), l'algoritmo settimanale include una penalità sui riposi contigui: distribuisce i 2 giorni di riposo settimanale garantendo che **non siano consecutivi** (es. Martedì e Venerdì anziché Lunedì e Martedì consecutivi), massimizzando la continuità operativa del negozio.

---

## 📝 Registro Decisioni di Vittore Nicora

*(Questa sezione verrà aggiornata man mano che Vittore esprimerà le sue preferenze durante i test della demo)*

- [ ] **Database**: Accettazione separazione dal sito web (Opzione B)
- [ ] **Hosting a regime**: Scelta tra piano gratuito con riattivazione o piano low-cost sempre attivo (~5€/mese)
- [ ] **Sottodominio**: Richiesta all'agenzia web del puntamento `turni.nicoragarden.it`
- [ ] **Mobilità Sedi**: Definizione se i dipendenti sono ancorati a una sola sede o possono ruotare tra Gazzada e Varese
- [x] **Validazione competenze & priorità**: Caricata la matrice ufficiale da "Specifiche dipendenti turni.xlsx" (07/10/2026) con regola Abilità Più Alta = Reparto Primario e pesi di importanza reparto
- [ ] **Denominazione Gazzada**: Scelta tra "Area Tecnica" (storico) ed "Emporio" (uniformato)
- [ ] **Chiarimento Decor Gazzada**: Conferma se Decor a Gazzada ha necessità 0 o 1
- [x] **Riposi disaccoppiati**: Implementata distribuzione riposi non consecutivi su 5 giorni lavorativi
- [x] **Nuovi inserimenti Varese**: Integrati Luigi e Ivan a 40h dedicati al reparto Natale
- [x] **Ridenominazioni**: Allineato Teo $\rightarrow$ Matteo F. (Gazzada) e Matteo $\rightarrow$ Matteo Z. (Varese)
