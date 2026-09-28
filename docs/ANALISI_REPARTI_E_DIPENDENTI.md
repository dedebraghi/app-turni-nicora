# Analisi Reparti Effettivi e Mappatura Dipendenti Nicora Garden

> **Nota di revisione storica**: Documento aggiornato a seguito dell'estrazione integrale e dell'analisi comparativa dei documenti ufficiali dei turni 2025–2026 (`Turni_GZ_26.pdf` e `Turni_VA_2026.pdf`), con risoluzione delle asimmetrie tra i punti vendita di Gazzada e Varese.

---

## 1. Asimmetria Strutturale dei Reparti tra le due Sedi

I due punti vendita **non condividono gli stessi identici reparti**. Configurare l'algoritmo con una lista unica o generica di reparti porta a errori gravi di assegnazione.

### Tabella Comparativa Reparti Ufficiali

| Reparto | Gazzada (GZ) | Varese (VA) | Colore Legenda PDF | Descrizione e Ruolo Operativo |
| :--- | :---: | :---: | :---: | :--- |
| 🌸 **CASSA** | **Sì** | **Sì** | Rosa (GZ) / Rosso (VA) | Presidio transazioni, scontrini e accoglienza clienti. 1 persona fissa/giorno, raddoppio nei weekend di picco. |
| 🌺 **FIORERIA** | **Sì** | **Sì** | Salmone (GZ) / Rosa (VA) | Confezionamento fiori freschi, mazzi e composizioni. 1–2 addetti a GZ, 2–3 addetti a VA. |
| 🌿 **SERRA FREDDA** | **Sì** | **Sì** | Verde chiaro (GZ) / Lime (VA) | Vivaio esterno, piante da giardino, stagionali e perenni. |
| 🌻 **SERRA CALDA** | **Sì** | **Sì** | Giallo chiaro (GZ e VA) | Piante da interno d'appartamento, orchidee e tropicali. |
| 🛠️ **AREA TECNICA** | **Sì (ESCLUSIVA GZ)** | **NO** | Azzurro / Celeste | Concimi, terricci, vasi, fitofarmaci, attrezzi e impiantistica. Presidio stabile a Gazzada. |
| 🎀 **DECOR** | **NO** | **Sì (ESCLUSIVA VA)** | Rosa carico / Vinaccia | Oggettistica casa, candele, vasi d'arredo, complementi regalo. |
| 🏪 **EMPORIO** | **NO** | **Sì (ESCLUSIVA VA)** | Kaki / Sabbia | Settore specializzato di Varese, presidiato stabilmente da Andrea. |
| 🎄 **NATALE** | **NO** | **Sì (ESCLUSIVA VA)** | Terracotta / Ruggine | **Reparto stagionale autunnale/invernale** (attivo da Settembre con il *Garden Festival d'Autunno*). Allestimento e vendita villaggio di Natale. |
| ⚙️ **SUPPORTO / CORSIA** | **NO** | **Sì (VA)** | Azzurro chiaro (`#76D6FF`) | Mansioni di manutenzione, logistica corsia, supporto generico (affidato a Carlo). |

> [!IMPORTANT]
> - A **Gazzada** NON esistono *Decor*, *Emporio* e *Natale*. Esiste invece l'**Area Tecnica**.
> - A **Varese** NON esiste l'**Area Tecnica**. Esistono invece *Decor*, *Emporio* e il reparto stagionale *Natale*.

---

## 2. Il Ciclo Stagionale del Reparto Natale a Varese

Dall'analisi mese per mese di `Turni_VA_2026.pdf`:
1. **Gennaio – Agosto**:
   - **Stefano** è assegnato stabilmente alla **Serra Fredda** (colore verde chiaro).
   - **Matteo** è assegnato a compiti di supporto e allestimento stagionale/emporio (colore salmone/pesca).
2. **Da Settembre in poi**:
   - Viene ufficialmente introdotto nella legenda di Varese il reparto **NATALE** (colore ruggine/terracotta).
   - **Matteo e Stefano** vengono costituiti in **squadra fissa dedicata a tempo pieno al Natale**. Nei fogli turno di settembre hanno la sequenza di turni identica e speculare (`PPP0P0PPPPP00PPPPP00PPPPP0`), con 5 giorni lavorativi a settimana dedicati all'allestimento del villaggio natalizio e all'avvio del *Garden Festival d'Autunno* (19 settembre).
   - Il reparto Natale assorbe queste due risorse per l'intero autunno fino alla conclusione delle festività invernali a gennaio.

---

## 3. Mappatura Reale del Personale e Competenze (Skill Matrix)

### Sede di Gazzada (GZ) – 10 Dipendenti Rilevati

| Dipendente | Reparto Primario Base | Abilitazioni Secondarie / Flessibilità Dimostrata | Note Turni Storici |
| :--- | :--- | :--- | :--- |
| **SABRINA** | **Cassa** (Rosa) | Fioreria | Presidio cassa costante. Quando è a riposo subentra Teo o Ivano. |
| **ELEONORA** | **Fioreria** (Salmone) | Serra Calda | Pilastro fioreria, presente tutto l'anno. |
| **TEO** | **Fioreria** (Salmone) | **Jolly Multi-Reparto**: Cassa, Serra Calda, Serra Fredda | Svolge coperture con celle colorate specifiche: Cassa quando Sabrina è assente, Serra Calda o Fredda nei picchi. |
| **MARCO** | **Serra Fredda** (Verde) | **Area Tecnica** | Vivaio esterno; copre l'Area Tecnica quando Ivano è assente o in ferie (es. 5 settembre, turno azzurro). |
| **DANIELA** | **Serra Fredda** (Verde) | Fioreria | Presidio vivaio piante esterne. |
| **GINEVRA** | **Serra Fredda** (Verde) | Serra Calda | Presente da Marzo a Settembre. Nei mesi di Gennaio e Febbraio sostituita da Mattia. |
| **MATTIA** | **Serra Fredda** (Verde) | Serra Calda | Attivo nei mesi invernali (Gennaio–Febbraio) prima dell'arrivo di Ginevra. |
| **DENIS** | **Serra Calda** (Giallo) | **Area Tecnica**, Serra Fredda | Piante da appartamento; nei mesi invernali effettua turni mirati in Area Tecnica (es. fine gennaio) e Serra Fredda. |
| **LAURA** | **Serra Calda** (Giallo) | Cassa | Specialista piante interne ed orchidee; supporto saltuario cassa. |
| **IVANO** | **Area Tecnica** (Azzurro) | **Cassa** | Responsabile dell'Area Tecnica (concimi, terricci, fitofarmaci, vasi). Molto competente, effettua anche coperture cassa (es. 10 settembre). |
| **DAVIDE** | **Cassa Supporto** (Rosa) | Cassa Extra Weekend | Inserito appositamente nei mesi di picco primaverile (Aprile, Maggio, Giugno) solo nei sabati e domeniche ad altissimo afflusso. |
| **ELINA (Prestito)** | **Serra Fredda** (Verde) | Supporto Generale | Dipendente di Varese trasferita a Gazzada dal 3 al 9 settembre per coprire l'emergenza contemporanea di ferie di Daniela, Denis e Ivano. |

---

### Sede di Varese (VA) – 18 Dipendenti Rilevati

| Dipendente | Reparto Primario Base | Abilitazioni Secondarie / Flessibilità Dimostrata | Note e Presenza Stagionale |
| :--- | :--- | :--- | :--- |
| **STEFANIA** | **Cassa** (Rosso) | Fioreria / Decor | Addetta cassa titolare a Settembre. |
| **ARIANNA** | **Cassa** (Rosso) | Accoglienza | Addetta cassa titolare nei mesi estivi e primaverili (Aprile, Maggio, Agosto). |
| **NANCY** | **Cassa** (Rosso) | Accoglienza | Addetta cassa nei mesi centrali estivi (Giugno, Luglio). |
| **SARA** | **Cassa** (Rosso) | Cassa 2 / Accoglienza | Addetta cassa addizionale nel picco primaverile di Aprile e Maggio. |
| **DEBORA / CASSA_1** | **Cassa** (Rosso) | Accoglienza | Cassa nei mesi invernali di Gennaio e Febbraio. |
| **KATJA** | **Fioreria** (Rosa) | Cassa Weekend / Decor | Responsabile/senior fioreria; nei weekend copre spesso turni cassa contrassegnati in rosso. |
| **LUISA** | **Fioreria** (Rosa) | Serra Calda | Presidio continuativo del banco fiori. |
| **GIANCARLA** | **Fioreria** (Rosa) | Decor / Cassa Weekend | Presidio fioreria e confezionamento composizioni; supporto cassa nei festivi. |
| **GIOVANNA** | **Decor** (Rosa Carico) | Cassa Weekend | Responsabile reparto Decorazione/Casa; effettua regolarmente supporto cassa la domenica. |
| **ANDREA** | **Emporio** (Kaki) | Logistica interna | Titolare e presidio stabile del reparto Emporio (presente da Marzo a Settembre in modo continuo). |
| **MATTEO** | **Natale** (Terracotta, da Set) / Allestimenti | Supporto Tecnico | Da Settembre in coppia fissa con Stefano per il villaggio natalizio; nei mesi precedenti allestimenti/stagionale. |
| **STEFANO** | **Natale** (Terracotta, da Set) / Serra Fredda | Vivaio esterno | Da Gennaio ad Agosto in Serra Fredda (verde); da Settembre in coppia fissa con Matteo per il Natale. |
| **FRANCESCA** | **Serra Calda** (Giallo) | Fioreria | Piante da interno e tropicali. |
| **CINZIA** | **Serra Calda** (Giallo) | Supporto Corsia | Piante verdi e fiorite da appartamento. |
| **GIONATA** | **Serra Fredda** (Lime) | Vivaio piante | Vivaista esperto piante da esterno ed alberature. |
| **GIULIO** | **Serra Fredda** (Lime) | Vivaio piante | Vivaio piante da esterno e perenni. |
| **ELINA** | **Serra Fredda** (Lime) | **Mobilità Inter-Sede** | Assegnata a Serra Fredda; a inizio settembre trasferita a Gazzada in prestito. |
| **CARLO** | **Supporto / Corsia** (Azzurro) | Manutenzione generale | Tirocinio/supporto presente in diversi mesi dell'anno con orario ridotto o concentrato nei primi giorni del mese. |
| **GAIA** | **Serra Fredda / Cassa** | Supporto Vivaio | Rinforzo primaverile ed estivo (Gennaio–Maggio). |
| **CLAUDIO** | **Serra Fredda / Vivaio** | Vivaio piante esterne | Rinforzo stagionale presente da Gennaio a Maggio. |

---

## 4. Mobilità e Prestiti Inter-Sede (Il caso Elina)

L'analisi incrociata dei due PDF dimostra che **le due sedi non sono silos chiusi**:
- Sul foglio di **Varese**, nei giorni dal 3 al 9 Settembre 2026, Elina riporta assenza con trattini `-` e riposi `0`.
- Sul foglio di **Gazzada**, esattamente nelle stesse date, compare aggiunta a mano la riga `ELINA | -- | -- | P | P | P | P | 0 | P | P |`.
- **Causa operativa**: contemporaneità delle ferie di 3 colonne di Gazzada (Daniela in Serra Fredda, Denis in Serra Calda, Ivano in Area Tecnica). Varese ha prestato Elina per garantire i 5–6 presenti minimi a Gazzada.

---

## 5. Regole per il Futuro Algoritmo e la Skills Matrix

1. **Reparti per Sede Rigidi**:
   - `sede === 'GAZZADA'` $\rightarrow$ Cassa, Fioreria, Serra Fredda, Serra Calda, **Area Tecnica**.
   - `sede === 'VARESE'` $\rightarrow$ Cassa, Fioreria, Serra Fredda, Serra Calda, **Decor**, **Emporio**, **Natale** (stagionale).
2. **Squadra Natale**:
   - Da Settembre a Gennaio, a Varese l'algoritmo deve prevedere la riserva di **2 addetti fissi** dedicati all'allestimento e vendita Natale (storicamente Matteo e Stefano).
3. **Presidio Area Tecnica a Gazzada**:
   - Ivano è il titolare irrinunciabile; in sua assenza il primo sostituto abilitato è Marco (o Denis).
4. **Presidio Emporio a Varese**:
   - Andrea è il titolare del reparto; nei suoi riposi il presidio viene coperto a rotazione da personale Serra o Decor.
5. **Cassa a Varese vs Gazzada**:
   - A Gazzada Sabrina è la cassiera storica, con Teo e Ivano abili alla sostituzione.
   - A Varese la cassa è gestita da figure contrattuali dedicate stagionali (Stefania, Arianna, Nancy, Sara, Debora) con Katja e Giovanna come garanti nei weekend/festivi.
