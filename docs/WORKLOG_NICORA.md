# Log Ore Lavorate - App Turni Nicora Garden

Registro analitico delle ore dedicate allo sviluppo dell'applicazione gestionale turni per **Nicora Garden** (Sedi di Gazzada e Varese).
Documento riservato a uso consuntivo e rendicontazione finale per Vittore Nicora.

- **Tariffa oraria concordata**: 20,00 €/ora
- **Inizio Progetto**: 18 Settembre 2026

---

## 📊 Tabella Dettaglio Attività

| Data | Ore | Modulo / Ambito | Descrizione Dettagliata Attività | Stato |
| :--- | :---: | :--- | :--- | :---: |
| **18/09/2026** | **4.0h** | **Architettura & Core Engine** | Setup PWA React 19 + TypeScript + TailwindCSS. Configurazione modelli dati (Gazzada 10 pax, Varese 14 pax, ciclo Domenica-Sabato). Sviluppo `schedulerEngine` (algoritmo generazione con matrice competenze), `fairnessTracker` ed `emergencyAdvisor`. Creazione viste `PlannerGrid`, `TodayPresence` e richieste ferie. | ✅ Completato |
| **19/09/2026** | **2.5h** | **Cloud Database & Auth (Supabase)** | Creazione script DDL SQL (`supabase/schema.sql`) per tabelle relazionali (`locations`, `employees`, `shifts`, `shift_requests`), indici prestazionali, RLS e seed dei 24 collaboratori. Implementazione client Supabase, architettura autenticazione ibrida (PIN rapido dipendenti e login protetto manager), fallback trasparente a `localStorage` e indicatore stato cloud nell'header. | ✅ Completato |
| **19/09/2026** | **2.0h** | **Sync Realtime & Dati Sedi** | Implementazione canali Supabase Realtime WebSocket unificati per Gazzada e Varese con gestione modifiche turni e richieste ferie. Sviluppo del componente `NotificationToast` per notifiche mirate all'utente loggato in caso di cambio turno o approvazione ferie. | ✅ Completato |
| **20/09/2026** | **2.5h** | **Mobile-First UI, Continuato & Orari Flessibili** | Sviluppo vista dedicata smartphone touch-first (`MobileDayView` a schede verticali senza scroll orizzontale) con selettore pillole e copertura Cassa/Organico. Configurazione template 'Orario Continuato / Alta Stagione' (09:00-19:00 a scaglioni 9:00-17:30, 10:00-18:30, 11:00-19:00) con preset 1-click nel planner e bilanciamento nello scheduler. Integrazione richieste orari flessibili (entrate posticipate / uscite anticipate) per dipendenti con approvazione immediata sul tabellone. | ✅ Completato |
| **20/09/2026** | **2.5h** | **Flusso Ferie 1-Click & Gestione Staff** | Sviluppo pannello dedicato `StaffManagement` (anagrafica collaboratori, aggiunta nuovi assunti con competenze e PIN, modifica e archiviazione/cessazione soft-delete senza perdita storico turni). Implementazione componente `PendingRequestsBanner` per approvazione/rifiuto ferie e variazioni orario con 1 singolo tap mobile-first dal planner, conversione immediata turno in ferie e ricalcolo copertura cassa/organico. | ✅ Completato |
| **20/09/2026** | **2.0h** | **Tab Personale & Engine Ore Contratto** | Unificazione tab Competenze e Staff nella nuova sezione 'Personale' (gestione competenze 1-10, ore contrattuali settimanali, anagrafica e PIN). Aggiornamento algoritmo schedulerEngine: vincolo 5 giorni lavorativi e 2 riposi per tutti, quadratura esatta monte ore contrattuale (40h, 30h, 24h, 20h), presidio garantito di tutti e 5 i reparti (Cassa, Fioreria, Decor, Serre), allocazione ponderata risorse eccedenti, computo ferie nel monte ore e allarme scopertura su approvazione ferie a valle. | ✅ Completato |
| **20/09/2026** | **1.5h** | **Export & Report Ore per Mese e Reparto** | Implementazione modulo consuntivo e report analitico mensile nella tab Personale. Selettore temporale mensile navigabile con tasti rapidi. Aggregazione analitica ore lavorate per dipendente e scomposizione sui 5 reparti (Cassa, Fioreria, Decor, Serra Calda, Serra Fredda), conteggio presenze effettive, riposi, ferie e malattie, calcolo monte ore contrattuale e saldo ore (+/-). Esportazione CSV formattata per Excel/consulente del lavoro (con BOM UTF-8 e separatore ';') e modulo di stampa / salvataggio PDF A4 orizzontale con bacheca firme per l'amministrazione. Chiusura task Google Workspace. | ✅ Completato |
| **22/09/2026** | *da sv.* | **Deploy Cloud, PWA & Consegna Demo** | Messa online su Vercel, test installazione PWA su smartphone reale (iOS/Android), predisposizione link demo per Vittore. | ⏳ Pianificato |

---

## 📈 Riepilogo Progressivo

- **Ore Pregresse validate**: 17.0 ore (340,00 €)
- **Ore da Sviluppare stimate**: ~1.0 ora
- **Totale Complessivo Stimato a Finire**: ~18.0 ore (~360,00 €)

*(Il presente file viene aggiornato al termine di ciascun task operativo).*

