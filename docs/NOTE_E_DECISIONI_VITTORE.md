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

1. **Accesso Dipendenti**:
   - Ogni collaboratore ha il suo accesso personale (email e password/PIN).
   - **Cosa può fare**: Vede solo i suoi orari, chi è presente oggi nel proprio negozio e invia richieste di ferie/permessi/cambio turno.
   - **Cosa NON può fare**: Non può modificare i turni, non può vedere i dati riservati dei colleghi.

2. **Assegnazione Sede e Mobilità (Dilemma Aperto: Fissi vs Scambiabili)**:
   - *Punto da chiarire con Vittore*: I collaboratori appartengono in modo fisso a una specifica sede (solo Gazzada o solo Varese), oppure c'è mobilità e una persona può essere assegnata a Gazzada in una settimana e a Varese nella successiva (o fare giorni alterni a seconda delle necessità)?
   - *Impostazione consigliata nell'app*: Rendere il collaboratore "flessibile", potendo impostare una **"Sede Prevalente"** di default ma permettendo al generatore o al manager di pianificare turni sull'altra sede se si verificano emergenze o picchi di lavoro.

3. **Cosa succede quando un dipendente viene assunto o cessa il rapporto**:
   - **Nuovo assunto**: Il manager lo inserisce indicando nome, sede prevalente/flessibile e livello di competenze (1-10) nei vari reparti (cassa, fioreria, serre, decor).
   - **Cessazione rapporto**: L'account non viene "cancellato" (altrimenti si perderebbero i conteggi dei turni passati per le buste paga), ma viene impostato su **"Archiviato / Disattivato"**. L'accesso viene bloccato istantaneamente e la persona scompare dalle pianificazioni future, preservando tutto lo storico.

---

## 📝 Registro Decisioni di Vittore Nicora

*(Questa sezione verrà aggiornata man mano che Vittore esprimerà le sue preferenze durante i test della demo)*

- [ ] **Database**: Accettazione separazione dal sito web (Opzione B)
- [ ] **Hosting a regime**: Scelta tra piano gratuito con riattivazione o piano low-cost sempre attivo (~5€/mese)
- [ ] **Sottodominio**: Richiesta all'agenzia web del puntamento `turni.nicoragarden.it`
- [ ] **Mobilità Sedi**: Definizione se i dipendenti sono ancorati a una sola sede o possono ruotare tra Gazzada e Varese
- [ ] **Validazione competenze**: Conferma dei punteggi e reparti per i dipendenti di Gazzada e Varese
