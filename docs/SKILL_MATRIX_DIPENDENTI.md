# Matrice delle Competenze (Skill Matrix) ed Assegnazione Storica Dipendenti

Questo documento mappa formalmente ciascun dipendente reale identificato nei fogli turno storici (`Turni_GZ_26.pdf` e `Turni_VA_2026.pdf`), definendo:
1. **Reparto primario** di appartenenza.
2. **Punteggio di abilità (1-10)** in ciascuno dei 5 reparti chiave (`Cassa`, `Fioreria`, `Decor`, `Serra Calda`, `Serra Fredda`).
3. **Frequenza di rotazione storica** osservata nei dati.

---

## 1. DIPENDENTI SEDE GAZZADA (GZ)

| Dipendente | Reparto Primario | Cassa | Fioreria | Decor | Serra Calda | Serra Fredda | Note / Specializzazione Storica |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Sabrina** | Cassa | **10** | 7 | 6 | 4 | 3 | Specialista principale Cassa & Accoglienza (Rosa) |
| **Eleonora** | Fioreria | 6 | **10** | 8 | 5 | 4 | Confezioni, fiori freschi, composizioni (Arancione) |
| **Teo** | Serra Calda | 5 | 4 | 5 | **10** | 8 | Piante da interno, serre calde (Giallo) |
| **Marco** | Serra Fredda | 4 | 3 | 4 | 8 | **10** | Piante da esterno, vivaio (Verde chiaro) |
| **Daniela** | Fioreria | 7 | **9** | 8 | 5 | 4 | Fioreria e allestimento vetrine/decor |
| **Ginevra** | Serra Fredda | 4 | 4 | 5 | 8 | **9** | Cura piante esterne e serra |
| **Denis** | Area Tecnica / Serra Fredda | 3 | 2 | 4 | 7 | **9** | Scarico merci, terricci, vasi, attrezzatura (Blu/Verde) |
| **Laura** | Cassa / Serra Calda | **8** | 5 | 6 | **8** | 5 | Flessibile tra Cassa e Serra Calda |
| **Ivano** | Area Tecnica | 3 | 2 | 4 | 6 | **9** | Prodotti tecnici, concimi, manutenzione serra |
| **Elina** | Supporto / Serra Fredda | 5 | 6 | 5 | 6 | **7** | Presenza stagionale estiva/autunnale |
| **Mattia** | Supporto / Area Tecnica | 4 | 3 | 5 | 7 | **8** | Presenza stagionale invernale |
| **Davide** | Supporto Generico | 6 | 5 | 5 | 6 | 6 | Supporto e jolly aziendale |

---

## 2. DIPENDENTI SEDE VARESE (VA)

| Dipendente | Reparto Primario | Cassa | Fioreria | Decor | Serra Calda | Serra Fredda | Note / Specializzazione Storica |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Stefania** | Cassa | **10** | 6 | 7 | 4 | 3 | Responsabile / Specialista Cassa (Rosa) |
| **Katja** | Fioreria | 5 | **10** | 8 | 5 | 4 | Specialista Fioreria & Arte Floreale (Arancione) |
| **Luisa** | Fioreria | 6 | **9** | 7 | 6 | 4 | Fioreria e confezionamento |
| **Giancarla** | Decor | 6 | 7 | **10** | 4 | 3 | Oggettistica, Decor, Emporio (Marrone) |
| **Giovanna** | Decor / Cassa | **8** | 6 | **9** | 4 | 3 | Supporto Cassa nei weekend e Decor |
| **Matteo** | Serra Calda | 5 | 4 | 5 | **10** | 8 | Specialista piante da appartamento / riscaldate |
| **Stefano** | Serra Calda | 4 | 3 | 4 | **9** | 8 | Serra Calda e manutenzione verde |
| **Andrea** | Area Tecnica | 3 | 2 | 4 | 7 | **9** | Prodotti tecnici, antiparassitari, terricci |
| **Francesca** | Fioreria | 6 | **9** | 8 | 4 | 3 | Fioreria e confezionamento regalo |
| **Cinzia** | Cassa | **9** | 5 | 6 | 4 | 3 | Presidio Cassa 2 nei giorni di afflusso |
| **Elina** | Serra Fredda | 4 | 4 | 4 | 6 | **8** | Vivaio ed esterno |
| **Gionata** | Serra Fredda | 3 | 2 | 4 | 7 | **10** | Piante da giardino, alberature, vivaio |
| **Giulio** | Area Tecnica | 4 | 3 | 4 | 6 | **9** | Area tecnica, vasi, scarico merci |
| **Carlo** | Area Tecnica / Manutenzione | 4 | 2 | 4 | 6 | **8** | Allestimenti e supporto logistico |
| **Sara** | Supporto Stagionale | 6 | 6 | 7 | 6 | 6 | Presenza primaverile/estiva |
| **Arianna** | Supporto Stagionale | 6 | 5 | 6 | 5 | 6 | Supporto estivo |
| **Gaia** | Supporto Stagionale | 5 | 6 | 7 | 6 | 6 | Supporto primaverile |
| **Claudio** | Area Tecnica | 3 | 2 | 4 | 7 | **8** | Presenza primaverile/invernale |
| **Debora** | Cassa / Supporto | **7** | 5 | 6 | 4 | 4 | Presenza a gennaio |
| **Nancy** | Fioreria / Decor | 5 | **8** | 7 | 4 | 4 | Presenza estiva |

---

## 3. Regole di Assegnazione Dinamica Basate sulle Competenze

1. **Protezione dei Super-Specialisti (Score >= 9)**:
   - Dipendenti come **Sabrina** e **Stefania** (Cassa = 10) hanno la massima priorità nell'assegnazione della Cassa 1.
   - Dipendenti come **Katja** ed **Eleonora** (Fioreria = 10) vengono primariamente assegnate alla Fioreria.
   - Dipendenti come **Teo** e **Matteo** (Serra Calda = 10) presidiano la Serra Calda.
   - Dipendenti come **Marco** e **Gionata** (Serra Fredda = 10) presidiano il Vivaio / Serra Fredda.

2. **Polivalenza e Raddoppi (Score 7-8)**:
   - Dipendenti con skill 7-8 in un reparto secondario (es. **Laura** con Cassa 8 e Serra Calda 8, **Giovanna** con Cassa 8 e Decor 9) vengono usati come prima scelta per i raddoppi di reparto (es. Cassa 2 o supporto Fioreria/Decor nei weekend).

3. **Copertura Assenze/Ferie**:
   - In caso di ferie di una specialista Cassa (es. Sabrina in ferie), l'algoritmo seleziona automaticamente il dipendente presente con il punteggio di Cassa più alto (es. Laura o Daniela a Gazzada; Giovanna o Cinzia a Varese).
