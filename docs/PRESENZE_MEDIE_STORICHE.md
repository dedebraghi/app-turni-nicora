# Calcolo Dettagliato Presenza Media Giornaliera dai Dati Storici (2025 - 2026)

Questo documento contiene i parametri quantitativi estratti dai turni storici ufficiali (`Turni_GZ_26.pdf` e `Turni_VA_2026.pdf`) necessari per la taratura dell'algoritmo di generazione automatica turni:
1. **Media dei lavoratori per giorno della settimana (Lunedì – Domenica)** per ciascuna sede.
2. **Media dei lavoratori per singolo reparto per ciascuno dei 7 giorni della settimana** per ciascuna sede.
3. **Dinamica stagionale e regole di fabbisogno per l'algoritmo**.

---

## 1. Sede di GAZZADA (GZ)

A Gazzada sono operativi **5 reparti**: *Cassa, Fioreria, Serra Fredda, Serra Calda, Area Tecnica*.

### A. Media Lavoratori per Giorno della Settimana e per Reparto (Gazzada)

La tabella seguente mostra l'organico medio effettivamente presente in negozio suddiviso per giorno della settimana e per singolo reparto:

| Giorno | Cassa | Fioreria | Serra Fredda | Serra Calda | Area Tecnica | TOTALE SEDE (Media) | Min / Max Storico |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lunedì** | 1.00 | 0.92 | 2.00 | 1.00 | 0.74 | **5.49** | 4 / 6 |
| **Martedì** | 1.00 | 0.82 | 2.03 | 0.92 | 0.87 | **5.51** | 4 / 7 |
| **Mercoledì** | 1.00 | 1.00 | 1.95 | 0.92 | 0.64 | **5.44** | 4 / 7 |
| **Giovedì** | 1.00 | 0.95 | 2.10 | 0.97 | 0.77 | **5.62** | 5 / 7 |
| **Venerdì** | 1.03 | 1.03 | 2.33 | 0.95 | 0.85 | **6.18** | 5 / 8 |
| **Sabato** | **1.26** | **1.18** | **2.38** | 0.97 | **0.90** | **6.69** | 5 / **10** |
| **Domenica**| 1.10 | 0.90 | 1.49 | 0.90 | 0.79 | **5.18** | 4 / **8** |
| **MEDIA GENERALE** | **1.05** | **0.97** | **2.04** | **0.95** | **0.79** | **5.72** | — |

*(Nota sul presidio Cassa: nei giorni infrasettimanali è sempre garantito 1 addetto al 100%; quando Sabrina è a riposo subentra Teo o Ivano; il valore sale a 1.26 al sabato per via del secondo cassiere Davide nei picchi primaverili).*

### B. Distribuzione Operativa per Reparto a Gazzada
* **Cassa**: 1 presidio fisso tutti i giorni; raddoppio a 2 nei weekend di picco primaverile (Aprile–Maggio con Davide).
* **Fioreria**: 1 persona costante dal lunedì alla domenica, con rinforzo a 1.2 nei sabati.
* **Serra Fredda**: 2 persone fisse nei feriali, rinforzo a 2.3–2.4 il venerdì e sabato (allestimento e vendita), flessione a 1.5 la domenica.
* **Serra Calda**: 1 persona costante tutti i giorni (Denis / Laura).
* **Area Tecnica (Esclusiva GZ)**: 1 persona presente circa 5 giorni a settimana (Ivano); nei suoi riposi viene coperta da Marco o Denis.

---

## 2. Sede di VARESE (VA)

A Varese sono operativi **6 reparti ordinari** (*Cassa, Fioreria, Decor, Emporio, Serra Calda, Serra Fredda*) + **1 reparto stagionale** (*Natale*, attivo da Settembre a Gennaio) + mansioni di *Supporto/Corsia* (Carlo).

### A. Media Lavoratori per Giorno della Settimana e per Reparto (Varese - Media Annuale)

La tabella seguente mostra la media annuale distribuita sui 7 giorni della settimana:

| Giorno | Cassa | Fioreria | Decor | Emporio | Serra Calda | Serra Fredda | Natale *(stag.)* | Supporto *(Carlo)* | TOTALE SEDE (Media) | Min / Max Storico |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lunedì** | 1.00 | 1.84 | 0.76 | 1.21 | 1.24 | 2.84 | 0.16 | 0.53 | **9.24** | 6 / 12 |
| **Martedì** | 1.00 | 1.92 | 0.42 | 1.11 | 1.37 | 2.61 | 0.26 | 0.55 | **8.87** | 6 / 12 |
| **Mercoledì** | 1.00 | 1.74 | 0.79 | 1.21 | 1.21 | 2.84 | 0.21 | 0.58 | **9.21** | 6 / 10 |
| **Giovedì** | 1.00 | 1.95 | 0.72 | 0.92 | 1.00 | 2.46 | 0.15 | 0.49 | **8.15** | 6 / 10 |
| **Venerdì** | 1.00 | 1.77 | 0.62 | 1.05 | 1.13 | 2.74 | 0.15 | 0.67 | **8.67** | 6 / 11 |
| **Sabato** | **1.25** | **2.03** | 0.62 | 0.95 | 1.18 | **2.54** | 0.05 | 0.49 | **10.20** | 7 / **15** |
| **Domenica**| 1.00 | 1.89 | 0.66 | 1.03 | 1.29 | 2.66 | 0.00 | 0.55 | **7.15** | 5 / **10** |
| **MEDIA GENERALE** | **1.03** | **1.88** | **0.65** | **1.07** | **1.20** | **2.67** | **0.14** | **0.55** | **8.28** | — |

*(Nota sul presidio Cassa a Varese: la cassa è sempre presidiata da 1 addetto dedicato; quando l'addetto primario è a riposo subentra a turno Katja, Giancarla o Giovanna; nei sabati di picco primaverile e autunnale si attiva la Cassa 2 portando la presenza a 1.25-1.50).*

---

### B. Variazione Stagionale Cruciale a Varese: Settembre (Natale Attivo) vs Maggio (Picco Primavera)

Poiché Varese ha forti specificità stagionali (il reparto **Natale** in autunno e il boom del vivaio in primavera), per un algoritmo efficiente servono anche i target dei due periodi chiave:

#### 1. Autunno (Settembre – Avvio Reparto Natale):
In questo periodo **Matteo e Stefano** sono dedicati a tempo pieno al **Natale**:

| Giorno | Cassa | Fioreria | Decor | Emporio | Serra Calda | Serra Fredda | NATALE | Supporto | TOTALE SETTEMBRE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lunedì** | 1.00 | 1.67 | 0.67 | 0.33 | 1.33 | 2.33 | **2.00** | 0.00 | **8.67** |
| **Martedì** | 1.00 | 2.50 | 0.75 | 0.75 | 1.50 | 2.00 | **2.00** | 0.25 | **10.75** |
| **Mercoledì** | 1.00 | 1.75 | 0.75 | 0.75 | 1.00 | 1.25 | **2.00** | 0.00 | **8.00** |
| **Giovedì** | 1.00 | 2.00 | 0.50 | 1.00 | 1.00 | 1.75 | **2.00** | 0.25 | **8.50** |
| **Venerdì** | 1.00 | 1.75 | 0.50 | 0.50 | 1.25 | 2.00 | **2.00** | 0.00 | **8.00** |
| **Sabato** | **1.25** | **2.50** | **1.00** | 0.75 | 1.75 | **2.50** | **1.00** | 0.25 | **10.00 - 11.00** |
| **Domenica**| 1.00 | 2.00 | 0.67 | 0.67 | 1.33 | 1.33 | 0.00 | 0.00 | **6.33 - 7.00** |

👉 **Regola Natale per l'Algoritmo**: da Settembre a Gennaio, dal Lunedì al Venerdì il reparto Natale ha **2 persone dedicate** (Matteo & Stefano). Il sabato uno dei due dà supporto alla corsia/vendita e la domenica riposano.

---

#### 2. Primavera (Maggio – Massimo Picco Piante ed Esterno):
In primavera il reparto Natale non esiste (è a 0); le risorse sono tutte concentrate sulla vendita vivaio (**Serra Fredda**):

| Giorno | Cassa | Fioreria | Decor | Emporio | Serra Calda | Serra Fredda | TOTALE MAGGIO |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lunedì** | 1.00 | 2.50 | 0.75 | 1.25 | 1.50 | **3.00** | **10.50** |
| **Martedì** | 1.00 | 3.25 | 0.75 | 1.75 | 2.50 | **5.00** | **14.75** |
| **Mercoledì** | 1.00 | 1.25 | 1.00 | 1.25 | 1.25 | **3.75** | **9.00** |
| **Giovedì** | 1.00 | 2.75 | 1.00 | 2.00 | 1.25 | **4.25** | **12.50** |
| **Venerdì** | 1.00 | 2.20 | 0.60 | 1.40 | 1.40 | **3.80** | **10.80** |
| **Sabato** | **1.50** | **2.80** | 0.60 | 1.20 | 1.20 | **4.40** | **11.40 - 14.00** |
| **Domenica**| 1.00 | 2.00 | 0.60 | 0.80 | 1.20 | **3.00** | **8.80 - 10.00** |

👉 **Regola Primavera per l'Algoritmo**: ad Aprile e Maggio la **Serra Fredda** richiede **da 3 a 5 persone al giorno** (grazie ai rinforzi stagionali Gaia, Claudio, Sara) per gestire carichi e vendite.

---

## 3. Matrice dei Target Giornalieri da Inserire nell'Algoritmo

Quando configureremo l'algoritmo, i vincoli di organico per giorno della settimana dovranno seguire questa matrice precisa:

### Target Minimi e Ottimali Gazzada (GZ)

| Reparto | Lunedì | Martedì | Mercoledì | Giovedì | Venerdì | Sabato | Domenica |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cassa** | 1 | 1 | 1 | 1 | 1 | **1–2** | 1 |
| **Fioreria** | 1 | 1 | 1 | 1 | 1 | **1–2** | 1 |
| **Serra Fredda** | 2 | 2 | 2 | 2 | **2–3** | **2–3** | 1–2 |
| **Serra Calda** | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| **Area Tecnica** | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| **TOTALE TARGET GZ** | **5** | **5** | **5** | **5–6** | **6** | **6–8** | **5** |

### Target Minimi e Ottimali Varese (VA) - Regime Ordinario (con Emporio e Decor)

| Reparto | Lunedì | Martedì | Mercoledì | Giovedì | Venerdì | Sabato | Domenica |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cassa** | 1 | 1 | 1 | 1 | 1 | **1–2** | 1 |
| **Fioreria** | 2 | 2 | 2 | 2 | 2 | **2–3** | 2 |
| **Decor** | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| **Emporio** | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| **Serra Calda** | 1 | 1 | 1 | 1 | 1 | 1–2 | 1 |
| **Serra Fredda** | 2–3 | 2–3 | 2–3 | 2 | 2–3 | **3–4** | 2 |
| **Natale** *(se Set–Gen)* | **2** | **2** | **2** | **2** | **2** | **1** | 0 |
| **TOTALE TARGET VA (Ordinario)** | **8** | **8** | **8** | **8** | **8–9** | **10** | **7** |
| **TOTALE TARGET VA (con Natale)** | **9–10**| **9–10**| **9–10**| **9–10**| **9–10**| **11** | **7** |
