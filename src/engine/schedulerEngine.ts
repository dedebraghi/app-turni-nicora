import { CONTINUATO_SLOTS, STANDARD_HOURS } from '../domain/rules';
import { Department, Employee, LocationId, ScheduleMode, Shift, ShiftRequest, ShiftType, WeekDayMeta } from '../domain/types';

export interface SchedulerOptions {
  locationId: LocationId;
  employees: Employee[];
  weekStartDate: string; // Deve essere una Domenica (YYYY-MM-DD)
  requests?: ShiftRequest[];
  mode?: ScheduleMode;   // 'standard' o 'continuato'
}

export interface ScheduleGenerationResult {
  shifts: Shift[];
  stats: {
    totalShifts: number;
    cassaCoverageScore: number; // in %
    staffCount: number;
    employeesWorkingDays: Record<string, number>;
    warnings: string[];
    mode: ScheduleMode;
  };
}

/**
 * Calcola la data della Domenica iniziale per una data qualsiasi.
 */
export const getSundayOfWeek = (d: Date = new Date()): Date => {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Domenica, 1 = Lunedì ... 6 = Sabato
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Genera i 7 giorni (Domenica -> Sabato) a partire da una Domenica YYYY-MM-DD.
 */
export const getWeekDays = (sundayDateStr: string): WeekDayMeta[] => {
  const [y, m, d] = sundayDateStr.split('-').map(Number);
  const sunday = new Date(y, m - 1, d);
  const todayStr = new Date().toISOString().split('T')[0];

  const days: WeekDayMeta[] = [];
  const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const dayShorts = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  for (let i = 0; i < 7; i++) {
    const curr = new Date(sunday);
    curr.setDate(sunday.getDate() + i);
    const dateStr = curr.toISOString().split('T')[0];
    const isWeekend = i === 0 || i === 6; // Dom e Sab
    const isMerchandiseArrival = i === 4 || i === 5; // Gio e Ven
    const isToday = dateStr === todayStr;

    days.push({
      dateStr,
      dayIndex: i,
      dayName: dayNames[i],
      dayShort: dayShorts[i],
      dayNum: curr.getDate(),
      isWeekend,
      isMerchandiseArrival,
      isToday,
    });
  }

  return days;
};

/**
 * Algoritmo Intelligente di Pianificazione Turni Nicora Garden:
 * 1. Settimana: Domenica -> Sabato (7 giorni).
 * 2. Ciascun collaboratore lavora ESATTAMENTE 5 giorni su 7 (2 giorni di riposo garantiti).
 * 3. Le ferie/permessi approvati vengono recepiti come 'ferie'.
 * 4. Presidio Cassa (priorità assoluta, 100% di copertura).
 * 5. Assegnazione basata sulla Matrice Competenze (1-10) per Cassa, Fioreria, Decor, Serre.
 * 6. Rinforzi nei giorni merci (Gio/Ven) e nel weekend garden (Dom/Sab).
 * 7. Supporto orario 'standard' vs 'continuato' (Ottobre-Dicembre con scaglioni 9, 10, 11 e chiusura 19:00).
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
        warnings: ['Nessun dipendente trovato per la sede selezionata.'],
        mode,
      },
    };
  }

  // 1. Mappa delle ferie approvate
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

  // 2. Assegnazione equa dei 2 giorni di riposo per ciascun collaboratore (Vincolo 5/7)
  // I riposi ordinari si concentrano sui giorni di minore afflusso (Lun=1, Mar=2, Mer=3, Gio=4)
  // per preservare la massima presenza nei giorni di arrivo merci (Gio/Ven) e nel weekend (Dom/Sab).
  const offDaysSchedule: Record<string, Set<number>> = {};
  
  const preferredOffDayPairs: [number, number][] = [
    [1, 2], // Lunedì e Martedì
    [2, 3], // Martedì e Mercoledì
    [1, 3], // Lunedì e Mercoledì
    [3, 4], // Mercoledì e Giovedì
    [1, 4], // Lunedì e Giovedì
    [2, 4], // Martedì e Giovedì
    [1, 5], // Lunedì e Venerdì
    [3, 5], // Mercoledì e Venerdì
  ];

  storeStaff.forEach((emp, empIdx) => {
    const offDays = new Set<number>();

    // Controlla se il dipendente ha ferie già approvate in questa settimana
    weekDays.forEach((wDay) => {
      if (approvedLeaves[emp.id]?.has(wDay.dateStr)) {
        offDays.add(wDay.dayIndex);
      }
    });

    // Se ha meno di 2 giorni off, assegna i restanti dalla rotazione
    if (offDays.size < 2) {
      const pair = preferredOffDayPairs[empIdx % preferredOffDayPairs.length];
      for (const candidateDay of pair) {
        if (offDays.size < 2 && !offDays.has(candidateDay)) {
          offDays.add(candidateDay);
        }
      }
      // Se ancora non ne ha 2, assegna il primo giorno feriale (1..4) disponibile
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

  // 3. Assegnazione turni e reparti per ciascuna delle 7 giornate
  weekDays.forEach((dayMeta) => {
    const { dateStr, dayIndex, isWeekend, isMerchandiseArrival } = dayMeta;

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
      warnings.push(`Attenzione: nessun dipendente in servizio il ${dayMeta.dayName} ${dateStr}!`);
      return;
    }

    const assignedEmpIds = new Set<string>();

    // Helper per trovare il miglior collaboratore per competenza decrescente
    const getBestAvailableFor = (dept: Department, excludeIds: Set<string>): Employee | null => {
      const candidates = availableStaff
        .filter((e) => !excludeIds.has(e.id))
        .sort((a, b) => {
          const scoreA = a.skills?.[dept] ?? 1;
          const scoreB = b.skills?.[dept] ?? 1;
          return scoreB - scoreA;
        });
      return candidates[0] || null;
    };

    // --- PRIORITÀ 1: CASSA (Presidio continuo garantito) ---
    // Nei weekend e nei giorni di arrivo merci (con organico >= 6), assegniamo 2 casse
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

    // --- PRIORITÀ 4: SERRA CALDA E SERRA FREDDA (VIVAIO ESTERNO) ---
    const remainingStaff = availableStaff.filter((e) => !assignedEmpIds.has(e.id));
    const dayAssignments: { emp: Employee; dept: Department; note: string }[] = [];

    cassaStaff.forEach((emp, idx) => {
      dayAssignments.push({
        emp,
        dept: 'Cassa',
        note: idx === 0 ? 'Cassa 1 Principale (Barriera Continua)' : 'Cassa 2 & Supporto Reparti',
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
        note: 'Decor, Vasi & Oggettistica',
      });
    }

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

    // --- ASSEGNAZIONE ORARI (Standard vs Continuato) ---
    dayAssignments.forEach((item, itemIdx) => {
      const { emp, dept, note } = item;

      if (mode === 'continuato') {
        // Modalità Orario Continuato (Metà Ottobre - Natale):
        // Scaglioni di ingresso 09:00, 10:00, 11:00 con chiusura ore 19:00
        const slot = CONTINUATO_SLOTS[itemIdx % CONTINUATO_SLOTS.length];

        shifts.push({
          id: `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          locationId,
          date: dateStr,
          type: 'giornata',
          department: dept,
          startTime: slot.start,
          endTime: slot.end,
          areaNote: `${note} (Continuato)`,
        });
      } else {
        // Modalità Standard:
        // Cassa: sempre giornata intera
        // Altri reparti: alternanza equilibrata mattina, pomeriggio, giornata
        let shiftType: ShiftType = 'giornata';
        let startTime = STANDARD_HOURS.giornata.start;
        let endTime = STANDARD_HOURS.giornata.end;

        if (dept === 'Cassa') {
          shiftType = 'giornata';
          startTime = STANDARD_HOURS.giornata.start;
          endTime = STANDARD_HOURS.giornata.end;
        } else if (itemIdx % 3 === 0) {
          shiftType = 'mattina';
          startTime = STANDARD_HOURS.mattina.start;
          endTime = STANDARD_HOURS.mattina.end;
        } else if (itemIdx % 3 === 1) {
          shiftType = 'pomeriggio';
          startTime = STANDARD_HOURS.pomeriggio.start;
          endTime = STANDARD_HOURS.pomeriggio.end;
        } else {
          shiftType = 'giornata';
          startTime = STANDARD_HOURS.giornata.start;
          endTime = STANDARD_HOURS.giornata.end;
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

  // 4. Calcolo statistiche finali
  const employeesWorkingDays: Record<string, number> = {};
  storeStaff.forEach((emp) => {
    const workedDays = shifts.filter(
      (s) => s.employeeId === emp.id && s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
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
      mode,
    },
  };
};
