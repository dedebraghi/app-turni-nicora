import { Department, Employee, LocationId, ScheduleMode, Shift, ShiftRequest, ShiftType } from '../types';

export const DEPARTMENTS: Department[] = [
  'Cassa',
  'Fioreria',
  'Decor',
  'Serra Calda',
  'Serra Fredda',
];

export interface SchedulerOptions {
  locationId: LocationId;
  employees: Employee[];
  weekStartDate: string; // Deve essere una Domenica (YYYY-MM-DD)
  requests?: ShiftRequest[];
  mode?: ScheduleMode; // 'standard' (spezzato) o 'continuato' (autunno/natale)
}

export interface ScheduleGenerationResult {
  shifts: Shift[];
  stats: {
    totalShifts: number;
    cassaCoverageScore: number; // in percentuale, es. 100%
    staffCount: number;
    employeesWorkingDays: Record<string, number>;
    warnings: string[];
  };
}

/**
 * Ottiene la data della Domenica iniziale della settimana per una qualsiasi data data.
 */
export const getSundayOfWeek = (d: Date = new Date()): Date => {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Domenica, 1 = Lunedì, ... 6 = Sabato
  // Se è già Domenica (0), diff = 0; altrimenti sottraiamo il giorno
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Genera i 7 giorni YYYY-MM-DD a partire da una Domenica.
 */
export const getWeekDays = (sundayDateStr: string): { dateStr: string; dayIndex: number; dayName: string; isWeekend: boolean; isMerchandiseArrival: boolean }[] => {
  const [y, m, d] = sundayDateStr.split('-').map(Number);
  const sunday = new Date(y, m - 1, d);

  const days = [];
  const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  for (let i = 0; i < 7; i++) {
    const curr = new Date(sunday);
    curr.setDate(sunday.getDate() + i);
    const dateStr = curr.toISOString().split('T')[0];
    const isWeekend = i === 0 || i === 6; // Domenica (0) e Sabato (6)
    const isMerchandiseArrival = i === 4 || i === 5; // Giovedì (4) e Venerdì (5)

    days.push({
      dateStr,
      dayIndex: i,
      dayName: dayNames[i],
      isWeekend,
      isMerchandiseArrival,
    });
  }

  return days;
};

/**
 * Algoritmo di Generazione Automatica Turni (conforme ai vincoli di Nicora Garden):
 * 1. Settimana: Domenica -> Sabato (7 giorni).
 * 2. Ciascun collaboratore lavora ESATTAMENTE 5 giorni su 7 (2 giorni di riposo).
 * 3. Le ferie/permessi approvati vengono recepiti come 'ferie'.
 * 4. Cassa: priorità assoluta (100% del tempo coperta dalla risorsa con competenza più alta).
 * 5. Fioreria e Decor coperti con personale specializzato.
 * 6. Serra Calda & Fredda rinforzate su Giovedì/Venerdì (merci) e Sabato/Domenica (picco vivaio).
 * 7. Supporto opzionale "Orario Continuato" (orari sfalsati 9:00, 10:00, 11:00 con chiusura alle 19:00).
 */
export const generateWeeklySchedule = ({
  locationId,
  employees,
  weekStartDate,
  requests = [],
  mode = 'standard',
}: SchedulerOptions): ScheduleGenerationResult => {
  const storeStaff = employees.filter((e) => e.locationId === locationId);
  const weekDays = getWeekDays(weekStartDate);
  const warnings: string[] = [];

  if (storeStaff.length === 0) {
    return {
      shifts: [],
      stats: {
        totalShifts: 0,
        cassaCoverageScore: 0,
        staffCount: 0,
        employeesWorkingDays: {},
        warnings: ['Nessun dipendente associato a questo punto vendita.'],
      },
    };
  }

  // Mappa richieste approvate di ferie per collaboratore: record di empId -> set di dateStr
  const approvedLeaves: Record<string, Set<string>> = {};
  storeStaff.forEach((e) => {
    approvedLeaves[e.id] = new Set();
  });

  requests
    .filter((r) => r.status === 'approved' && r.type === 'leave')
    .forEach((r) => {
      if (approvedLeaves[r.requesterId]) {
        approvedLeaves[r.requesterId].add(r.shiftDate);
      }
    });

  // 1. Assegnazione dei giorni di Riposo / Ferie (esattamente 2 giorni di non lavoro a testa)
  // Per garantire massima presenza nel weekend (Dom/Sab) e durante arrivo merci (Gio/Ven),
  // i giorni di riposo ordinari ruotano primariamente su Lunedì (1), Martedì (2), Mercoledì (3) e secondariamente su Giovedì.
  const offDaysSchedule: Record<string, Set<number>> = {};
  
  // Rotazione ponderata dei giorni di riposo ordinari nei giorni feriali meno intensi (1=Lun, 2=Mar, 3=Mer, 4=Gio)
  const preferredOffDayPairs: [number, number][] = [
    [1, 2], // Lunedì e Martedì
    [2, 3], // Martedì e Mercoledì
    [1, 3], // Lunedì e Mercoledì
    [3, 4], // Mercoledì e Giovedì
    [1, 4], // Lunedì e Giovedì
    [2, 4], // Martedì e Giovedì
    [1, 5], // Lunedì e Venerdì (solo se necessario)
    [3, 5], // Mercoledì e Venerdì
  ];

  storeStaff.forEach((emp, empIdx) => {
    const offDays = new Set<number>();

    // Controlla se ha ferie già approvate in questa settimana
    weekDays.forEach((wDay) => {
      if (approvedLeaves[emp.id]?.has(wDay.dateStr)) {
        offDays.add(wDay.dayIndex);
      }
    });

    // Se ha meno di 2 giorni off, assegna i restanti scegliendo dalla rotazione
    if (offDays.size < 2) {
      const pair = preferredOffDayPairs[empIdx % preferredOffDayPairs.length];
      for (const candidateDay of pair) {
        if (offDays.size < 2 && !offDays.has(candidateDay)) {
          offDays.add(candidateDay);
        }
      }
      // Se ancora non ha 2 giorni, trova il primo giorno feriale libero (1..4)
      for (let d = 1; d <= 4 && offDays.size < 2; d++) {
        if (!offDays.has(d)) {
          offDays.add(d);
        }
      }
    }

    offDaysSchedule[emp.id] = offDays;
  });

  const shifts: Shift[] = [];
  let cassaCoveredDays = 0;

  // 2. Per ciascun giorno della settimana, assegna i turni e i reparti in base alle competenze
  weekDays.forEach((dayMeta) => {
    const { dateStr, dayIndex, isWeekend, isMerchandiseArrival } = dayMeta;

    // Chi è a riposo/ferie oggi?
    const availableStaff: Employee[] = [];

    storeStaff.forEach((emp) => {
      const isOff = offDaysSchedule[emp.id]?.has(dayIndex);
      if (isOff) {
        const isFerie = approvedLeaves[emp.id]?.has(dateStr);
        shifts.push({
          id: `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          locationId,
          date: dateStr,
          type: isFerie ? 'ferie' : 'riposo',
        });
      } else {
        availableStaff.push(emp);
      }
    });

    if (availableStaff.length === 0) {
      warnings.push(`Attenzione: nessun dipendente disponibile il ${dayMeta.dayName} ${dateStr}!`);
      return;
    }

    // Teniamo traccia di chi ha già ricevuto una mansione oggi
    const assignedEmpIds = new Set<string>();

    // Funzione helper per trovare il miglior collaboratore disponibile per un dato reparto
    const getBestAvailableFor = (dept: Department, excludeIds: Set<string>): Employee | null => {
      const candidates = availableStaff
        .filter((e) => !excludeIds.has(e.id))
        .sort((a, b) => {
          const scoreA = a.skills?.[dept] ?? 1;
          const scoreB = b.skills?.[dept] ?? 1;
          return scoreB - scoreA; // Decrescente
        });
      return candidates[0] || null;
    };

    // --- PRIORITÀ 1: CASSA (Presenza continua, 1 o 2 persone) ---
    // Nei weekend e nei giorni merci abbiamo bisogno di 2 casse se lo staff lo permette
    const targetCassaCount = (isWeekend || isMerchandiseArrival) && availableStaff.length >= 6 ? 2 : 1;
    const cassaStaff: Employee[] = [];

    for (let c = 0; c < targetCassaCount; c++) {
      const bestCassa = getBestAvailableFor('Cassa', assignedEmpIds);
      if (bestCassa) {
        cassaStaff.push(bestCassa);
        assignedEmpIds.add(bestCassa.id);
      }
    }

    if (cassaStaff.length > 0) {
      cassaCoveredDays++;
    } else {
      warnings.push(`Cassa sguarnita in data ${dateStr}!`);
    }

    // --- PRIORITÀ 2: FIORERIA ---
    const bestFioreria = getBestAvailableFor('Fioreria', assignedEmpIds);
    if (bestFioreria) {
      assignedEmpIds.add(bestFioreria.id);
    }

    // --- PRIORITÀ 3: DECOR ---
    const bestDecor = getBestAvailableFor('Decor', assignedEmpIds);
    if (bestDecor) {
      assignedEmpIds.add(bestDecor.id);
    }

    // --- ASSEGNAZIONE RIMANENTI: SERRA CALDA, SERRA FREDDA, RINFORZI ---
    const remainingStaff = availableStaff.filter((e) => !assignedEmpIds.has(e.id));

    // Mappa delle assegnazioni per la giornata
    const dayAssignments: { emp: Employee; dept: Department; note: string }[] = [];

    cassaStaff.forEach((emp, idx) => {
      dayAssignments.push({
        emp,
        dept: 'Cassa',
        note: idx === 0 ? 'Cassa 1 - Barriera casse continua' : 'Cassa 2 & Supporto Clienti',
      });
    });

    if (bestFioreria) {
      dayAssignments.push({
        emp: bestFioreria,
        dept: 'Fioreria',
        note: 'Banco Fioreria & Composizioni',
      });
    }

    if (bestDecor) {
      dayAssignments.push({
        emp: bestDecor,
        dept: 'Decor',
        note: 'Reparto Decor, Vasi & Oggettistica',
      });
    }

    // Assegnazione restante su Serra Calda o Serra Fredda a seconda dell'attitudine
    remainingStaff.forEach((emp) => {
      const caldaScore = emp.skills?.['Serra Calda'] ?? 5;
      const freddaScore = emp.skills?.['Serra Fredda'] ?? 5;

      let dept: Department = caldaScore >= freddaScore ? 'Serra Calda' : 'Serra Fredda';
      let note = dept === 'Serra Calda' ? 'Serra Tropicale & Piante da Interno' : 'Vivaio Esterno & Arbusti';

      if (isMerchandiseArrival && dept === 'Serra Fredda') {
        note = 'Arrivo Merce & Ricevimento Piante';
      }

      dayAssignments.push({ emp, dept, note });
    });

    // Ora determiniamo gli orari e la tipologia di turno ('mattina', 'pomeriggio', 'giornata')
    // A seconda della modalità: standard (spezzato) o continuato (scaglionato 9, 10, 11)
    dayAssignments.forEach((item, itemIdx) => {
      const { emp, dept, note } = item;

      if (mode === 'continuato') {
        // Modalità Orario Continuato (Ottobre - Natale):
        // Tre scaglioni: 09:00 - 17:30, 10:00 - 18:30, 11:00 - 19:00
        const staggeredSlots = [
          { start: '09:00', end: '17:30' },
          { start: '10:00', end: '18:30' },
          { start: '11:00', end: '19:00' },
        ];
        const slot = staggeredSlots[itemIdx % staggeredSlots.length];

        shifts.push({
          id: `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          locationId,
          date: dateStr,
          type: 'giornata',
          department: dept,
          startTime: slot.start,
          endTime: slot.end,
          areaNote: `${note} (Orario continuato)`,
        });
      } else {
        // Modalità Standard:
        // Nel weekend o arrivo merci, privilegiamo copertura completa o alternata
        let shiftType: ShiftType = 'giornata';
        let startTime = '08:30';
        let endTime = '19:30';

        if (dept === 'Cassa') {
          // Se ci sono 2 casse: una full day/mattina, una full day/pomeriggio
          shiftType = 'giornata';
          startTime = '08:30';
          endTime = '19:30';
        } else if (itemIdx % 3 === 0) {
          shiftType = 'mattina';
          startTime = '08:30';
          endTime = '12:30';
        } else if (itemIdx % 3 === 1) {
          shiftType = 'pomeriggio';
          startTime = '14:30';
          endTime = '19:30';
        } else {
          shiftType = 'giornata';
          startTime = '08:30';
          endTime = '19:30';
        }

        shifts.push({
          id: `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          locationId,
          date: dateStr,
          type: shiftType,
          department: dept,
          startTime,
          endTime,
          areaNote: note,
        });
      }
    });
  });

  // 3. Calcolo statistiche finali
  const employeesWorkingDays: Record<string, number> = {};
  storeStaff.forEach((emp) => {
    const workedDays = shifts.filter(
      (s) => s.employeeId === emp.id && s.type !== 'riposo' && s.type !== 'ferie'
    ).length;
    employeesWorkingDays[emp.id] = workedDays;
  });

  const cassaCoverageScore = Math.round((cassaCoveredDays / 7) * 100);

  return {
    shifts,
    stats: {
      totalShifts: shifts.length,
      cassaCoverageScore,
      staffCount: storeStaff.length,
      employeesWorkingDays,
      warnings,
    },
  };
};
