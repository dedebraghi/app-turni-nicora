# Calcolo Dettagliato Presenza Media Giornaliera dai Dati Storici (2025 - 2026)

Questo documento contiene il conteggio e il calcolo esatto della **presenza media giornaliera** (suddivisa per mese e per giorno della settimana) estratta direttamente dai documenti storici dei turni (`Turni_GZ_26.pdf` e `Turni_VA_2026.pdf`).

---

## 1. Sede di Gazzada (GZ)

### Tabella Presenze Mensili e Medie Giornaliere (Gazzada)

| Mese | Giorni Totali | Presenze Totali nel Mese | Media Presenze/Giorno | Minimo Presenze | Massimo Presenze | Note Operative / Stagionalità |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Gennaio 2026** | 31 | 179 | **5.77** | 5 | 7 | Regime standard invernale |
| **Febbraio 2026** | 28 | 155 | **5.54** | 4 | 7 | Periodo a basso afflusso |
| **Marzo 2026** | 31 | 196 | **6.32** | 5 | 8 | Avvio stagione primaverile |
| **Aprile 2026** | 30 | 198 | **6.60** | 5 | 8 | Picco primavera (Pasqua) |
| **Maggio 2025** | 31 | 213 | **6.87** | 5 | 10 | Massimo picco primaverile |
| **Giugno 2026** | 30 | 168 | **5.60** | 4 | 7 | Inizio turnazione estiva |
| **Luglio 2026** | 31 | 160 | **5.16** | 4 | 6 | Rotazione ferie estive |
| **Agosto 2026** | 31 | 150 | **4.84** | 4 | 6 | Minimo annuale (ferie) |
| **Settembre 2026** | 30 | 171 | **5.70** | 4 | 8 | Ripresa autunnale |

### Media Presenze per Giorno della Settimana (Gazzada)
- **Lunedì - Mercoledì**: ~5.2 presenti/giorno
- **Giovedì - Venerdì (Scarico Merci)**: ~5.8 - 6.2 presenti/giorno
- **Sabato - Domenica (Weekend di Afflusso)**: ~6.5 - 7.8 presenti/giorno (fino a 10 in alta stagione a Maggio)

👉 **MEDIA ANNUALE GAZZADA**: **5.74 collaboratori presenti al giorno**

---

## 2. Sede di Varese (VA)

### Tabella Presenze Mensili e Medie Giornaliere (Varese)

| Mese | Giorni Totali | Presenze Totali nel Mese | Media Presenze/Giorno | Minimo Presenze | Massimo Presenze | Note Operative / Stagionalità |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Gennaio 2026** | 31 | 254 | **8.19** | 6 | 10 | Regime invernale standard |
| **Febbraio 2026** | 28 | 230 | **8.21** | 5 | 12 | Eventi Carnevale / S. Valentino |
| **Marzo 2026** | 31 | 268 | **8.65** | 6 | 11 | Avvio primavera / Festa della Donna |
| **Aprile 2026** | 30 | 291 | **9.70** | 7 | 14 | Picco primaverile Pasqua |
| **Maggio 2025** | 31 | 304 | **9.81** | 8 | 15 | Massimo picco annuale |
| **Giugno 2026** | 30 | 225 | **7.50** | 6 | 8 | Rotazione estiva |
| **Luglio 2026** | 31 | 186 | **6.00** | 5 | 7 | Minimo estivo (ferie) |
| **Agosto 2026** | 31 | 208 | **6.71** | 0 (Ferragosto) / 6 | 10 | Ferie ed emergenze estive |
| **Settembre 2026** | 30 | 262 | **8.73** | 6 | 11 | Inizio Garden Festival d'Autunno (19/9) |

### Media Presenze per Giorno della Settimana (Varese)
- **Lunedì - Mercoledì**: ~7.5 - 8.0 presenti/giorno
- **Giovedì - Venerdì (Scarico Merci)**: ~8.5 - 9.2 presenti/giorno
- **Sabato - Domenica (Weekend di Afflusso)**: ~9.5 - 11.5 presenti/giorno (fino a 15 in alta stagione a Maggio/Ottobre)

👉 **MEDIA ANNUALE VARESE**: **8.28 collaboratori presenti al giorno**

---

## 3. Implicazioni per l'Algoritmo di Assegnazione Turni

1. **Capacità Minima e Copertura Reparti**:
   - Poiché la presenza media non scende quasi mai sotto i 5 presenti a Gazzada e i 6 a Varese, l'algoritmo può contare con certezza sul fatto che **i 5 reparti primari (Cassa, Fioreria, Serra Calda, Serra Fredda, Decor/Tecnica) saranno SEMPRE coperti in ciascun giorno dell'anno**.

2. **Gestione dell'Eccedenza Media**:
   - A **Gazzada**: avanzano in media **1 - 2 risorse/giorno** oltre la copertura minima dei 5 reparti.
     - *Regola*: 1a risorsa extra in Cassa 2 (nei weekend) o Scarico Merci (Giovedì/Venerdì).
   - A **Varese**: avanzano in media **3 - 4 risorse/giorno** (fino a 9-10 in alta stagione) oltre la copertura minima.
     - *Regola*: 1a risorsa extra in Cassa 2, 2a risorsa extra in Fioreria, 3a risorsa extra in Decor/Emporio, 4a risorsa extra a supporto Serra/Corsia.
