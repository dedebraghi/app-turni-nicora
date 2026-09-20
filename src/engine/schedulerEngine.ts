import { CONTINUATO_SLOTS, DEPARTMENTS, STANDARD_HOURS } from '../domain/rules';
import {
  DayCoverageSummary,
  Department,
  Employee,
  EmployeeWeeklyHours,
  LocationId,
  ScheduleMode,
  Shift,
  ShiftRequest,
  ShiftType,
  WeekDayMeta,
} from '../domain/types';

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
    employeesWorkingHours: Record<string, EmployeeWeeklyHours>;
    allDepartmentsCovered: boolean;
    uncoveredDays: { dateStr: string; departments: Department[] }[];
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
 * Calcola le ore effettive lavorate da un turno.
 */
export const getShiftHours = (shift: Shift, mode: ScheduleMode = 'standard'): number => {
  if (shift.type === 'riposo' || shift.type === 'ferie' || shift.type === 'malattia') {
    return 0;
  }

  if (shift.startTime && shift.endTime) {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    const rawDiff = (endH + endM / 60) - (startH + startM / 60);

    // Orario standard spezzato (es. 08:30 - 19:30): 8 ore contrattuali con pausa pranzo
    if (shift.type === 'giornata' && !shift.isCustomHours && mode === 'standard') {
      return 8;
    }
    // Orario continuato (es. 09:00 - 17:30 = 8.5h di presenza con 30 min di pausa): 8 ore effettive
    if (shift.type === 'giornata' && mode === 'continuato') {
      return 8;
    }

    return Math.max(0, Math.round(rawDiff * 10) / 10);
  }

  if (shift.type === 'giornata') return 8;
  if (shift.type === 'mattina') return 4;
  if (shift.type === 'pomeriggio') return 5;
  return 0;
};

/**
 * Calcola la quota oraria figurativa per una giornata di ferie o malattia approvata.
 * Corrisponde alla quota giornaliera del contratto su base 5 giorni (es. 40h -> 8h; 20h -> 4h; 24h -> 4.8h).
 */
export const getLeaveHours = (shift: Shift, employee: Employee): number => {
  if (shift.type !== 'ferie' && shift.type !== 'malattia') return 0;
  const contract = employee.contractHours || 40;
  return Math.round((contract / 5) * 10) / 10;
};

/**
 * Calcola il riepilogo settimanale ore per un collaboratore (lavorate, ferie, saldo contratto).
 */
export const calculateEmployeeWeeklyHours = (
  employee: Employee,
  shifts: Shift[],
  mode: ScheduleMode = 'standard'
): EmployeeWeeklyHours => {
  const empShifts = shifts.filter((s) => s.employeeId === employee.id);
  const contractHours = employee.contractHours || 40;

  let workedHours = 0;
  let leaveHours = 0;
  let workedDaysCount = 0;

  empShifts.forEach((s) => {
    if (s.type === 'riposo') return;
    if (s.type === 'ferie' || s.type === 'malattia') {
      leaveHours += getLeaveHours(s, employee);
    } else {
      workedHours += getShiftHours(s, mode);
      workedDaysCount++;
    }
  });

  workedHours = Math.round(workedHours * 10) / 10;
  leaveHours = Math.round(leaveHours * 10) / 10;
  const totalAccountedHours = Math.round((workedHours + leaveHours) * 10) / 10;
  const deltaHours = Math.round((totalAccountedHours - contractHours) * 10) / 10;
  const isContractFulfilled = Math.abs(deltaHours) <= 0.5;

  return {
    workedHours,
    leaveHours,
    totalAccountedHours,
    contractHours,
    isContractFulfilled,
    deltaHours,
    workedDaysCount,
  };
};

/**
 * Calcola la copertura dei 5 reparti per una singola data.
 */
export const calculateDayCoverage = (
  dateStr: string,
  shifts: Shift[]
): DayCoverageSummary => {
  const dayShifts = shifts.filter(
    (s) => s.date === dateStr && s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );

  let cassaCount = 0;
  let fioreriaCount = 0;
  let decorCount = 0;
  let serraCaldaCount = 0;
  let serraFreddaCount = 0;

  dayShifts.forEach((s) => {
    if (s.department === 'Cassa') cassaCount++;
    else if (s.department === 'Fioreria') fioreriaCount++;
    else if (s.department === 'Decor') decorCount++;
    else if (s.department === 'Serra Calda') serraCaldaCount++;
    else if (s.department === 'Serra Fredda') serraFreddaCount++;
  });

  const uncoveredDepartments: Department[] = [];
  if (cassaCount === 0) uncoveredDepartments.push('Cassa');
  if (fioreriaCount === 0) uncoveredDepartments.push('Fioreria');
  if (decorCount === 0) uncoveredDepartments.push('Decor');
  if (serraCaldaCount === 0) uncoveredDepartments.push('Serra Calda');
  if (serraFreddaCount === 0) uncoveredDepartments.push('Serra Fredda');

  const riposoCount = shifts.filter((s) => s.date === dateStr && s.type === 'riposo').length;
  const ferieCount = shifts.filter((s) => s.date === dateStr && s.type === 'ferie').length;
  const malattiaCount = shifts.filter((s) => s.date === dateStr && s.type === 'malattia').length;

  return {
    dateStr,
    totalPresent: dayShifts.length,
    cassaCount,
    isCassaOk: cassaCount >= 1,
    fioreriaCount,
    decorCount,
    serraCaldaCount,
    serraFreddaCount,
    riposoCount,
    ferieCount,
    malattiaCount,
    uncoveredDepartments,
  };
};

/**
 * Calibra l'orario e la durata giornaliera su 5 giorni per raggiungere le ore contrattuali.
 */
function getDailyShiftSchedule(
  contractHours: number,
  dayIndexInWorkerWeek: number, // 0..4 (i 5 giorni di servizio)
  mode: ScheduleMode
): { type: ShiftType; startTime: string; endTime: string; hours: number; isCustomHours?: boolean } {
  if (mode === 'continuato') {
    // In orario continuato (8h per slot standard)
    if (contractHours >= 38) {
      const slot = CONTINUATO_SLOTS[dayIndexInWorkerWeek % CONTINUATO_SLOTS.length];
      return { type: 'giornata', startTime: slot.start, endTime: slot.end, hours: 8, isCustomHours: true };
    }
    if (contractHours === 30) {
      // 6 ore continuate
      return { type: 'giornata', startTime: '09:00', endTime: '15:00', hours: 6, isCustomHours: true };
    }
    if (contractHours === 24) {
      // 4 giorni da 5h + 1 da 4h = 24h
      const h = dayIndexInWorkerWeek < 4 ? 5 : 4;
      const endH = 9 + h;
      return {
        type: 'giornata',
        startTime: '09:00',
        endTime: `${endH.toString().padStart(2, '0')}:00`,
        hours: h,
        isCustomHours: true,
      };
    }
    if (contractHours === 20) {
      // 5 giorni da 4h
      return { type: 'mattina', startTime: '09:00', endTime: '13:00', hours: 4, isCustomHours: true };
    }
  }

  // Modalità Standard
  if (contractHours >= 38) {
    // Full-Time 40h: 5 giorni x 8h
    return {
      type: 'giornata',
      startTime: STANDARD_HOURS.giornata.start,
      endTime: STANDARD_HOURS.giornata.end,
      hours: 8,
    };
  }

  if (contractHours === 30) {
    // Part-Time 30h: 5 giorni x 6h
    return {
      type: 'giornata',
      startTime: '08:30',
      endTime: '14:30',
      hours: 6,
      isCustomHours: true,
    };
  }

  if (contractHours === 25) {
    // Part-Time 25h: 5 giorni x 5h pomeridiane
    return {
      type: 'pomeriggio',
      startTime: STANDARD_HOURS.pomeriggio.start,
      endTime: STANDARD_HOURS.pomeriggio.end,
      hours: 5,
    };
  }

  if (contractHours === 24) {
    // Part-Time 24h: 4 giorni x 5h (pomeriggio) + 1 giorno x 4h (mattina) = 24h esatte
    if (dayIndexInWorkerWeek < 4) {
      return {
        type: 'pomeriggio',
        startTime: STANDARD_HOURS.pomeriggio.start,
        endTime: STANDARD_HOURS.pomeriggio.end,
        hours: 5,
      };
    } else {
      return {
        type: 'mattina',
        startTime: STANDARD_HOURS.mattina.start,
        endTime: STANDARD_HOURS.mattina.end,
        hours: 4,
      };
    }
  }

  if (contractHours === 20) {
    // Part-Time 20h: 5 giorni x 4h (tutte le mattine, presidio apertura cassa e piante)
    return {
      type: 'mattina',
      startTime: STANDARD_HOURS.mattina.start,
      endTime: STANDARD_HOURS.mattina.end,
      hours: 4,
    };
  }

  // Formula generica per qualsiasi valore contrattuale personalizzato H
  const baseH = Math.floor(contractHours / 5);
  const remainder = contractHours % 5;
  const hours = dayIndexInWorkerWeek < remainder ? baseH + 1 : baseH;
  const startH = 8;
  const startM = 30;
  const endH = startH + hours;
  return {
    type: hours >= 7 ? 'giornata' : hours >= 5 ? 'pomeriggio' : 'mattina',
    startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
    endTime: `${endH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
    hours,
    isCustomHours: true,
  };
}

/**
 * Algoritmo Intelligente di Pianificazione Turni Nicora Garden:
 * 1. Settimana: Domenica -> Sabato (7 giorni).
 * 2. Ciascun collaboratore lavora ESATTAMENTE 5 giorni su 7 (2 riposi garantiti).
 * 3. Le ore di contratto settimanali (es. 40h, 30h, 24h, 20h) vengono divise esattamente sui 5 giorni lavorativi.
 * 4. Presidio Obbligatorio di TUTTI e 5 i Reparti (Cassa, Fioreria, Decor, Serra Calda, Serra Fredda).
 * 5. I collaboratori eccedenti vengono allocati prioritariamente come Cassa 2 (weekend/merci) o rinforzo sul loro reparto di massima competenza.
 * 6. Le ferie/permessi approvati vengono recepiti come 'ferie' senza generare turni duplicati.
 */
export const generateWeeklySchedule = ({
  locationId,
  employees,
  weekStartDate,
  requests = [],
  mode = 'standard',
}: SchedulerOptions): ScheduleGenerationResult => {
  const storeStaff = employees.filter((e) => e.locationId === locationId && e.isActive !== false);
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
        employeesWorkingHours: {},
        allDepartmentsCovered: false,
        uncoveredDays: [],
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

  // 2. Assegnazione equa dei 2 giorni di riposo per collaboratore (Vincolo 5 giorni lavorativi su 7)
  // Rotazione sui giorni feriali (Lun=1, Mar=2, Mer=3, Gio=4) per preservare weekend (Dom=0, Sab=6) e merci (Gio=4, Ven=5).
  // I 2 giorni di riposo garantiti sono DISGIUNTI dalle giornate di ferie (riposi + ferie + lavoro = 7 giorni esatti).
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

    // Mappa dei giorni della settimana con ferie per questo dipendente
    const leaveDayIndices = new Set<number>();
    weekDays.forEach((wDay) => {
      if (approvedLeaves[emp.id]?.has(wDay.dateStr)) {
        leaveDayIndices.add(wDay.dayIndex);
      }
    });

    // Assegna 2 giorni di riposo ordinari diversi dai giorni di ferie
    const pair = preferredOffDayPairs[empIdx % preferredOffDayPairs.length];
    for (const candidateDay of pair) {
      if (offDays.size < 2 && !offDays.has(candidateDay) && !leaveDayIndices.has(candidateDay)) {
        offDays.add(candidateDay);
      }
    }
    for (let d = 1; d <= 4 && offDays.size < 2; d++) {
      if (!offDays.has(d) && !leaveDayIndices.has(d)) {
        offDays.add(d);
      }
    }
    for (let d = 0; d <= 6 && offDays.size < 2; d++) {
      if (!offDays.has(d) && !leaveDayIndices.has(d)) {
        offDays.add(d);
      }
    }

    offDaysSchedule[emp.id] = offDays;
  });

  const shifts: Shift[] = [];
  let cassaCoveredDays = 0;
  const uncoveredDaysList: { dateStr: string; departments: Department[] }[] = [];

  // Mappa per tracciare a quale giorno di lavoro (0..4) è arrivato ciascun dipendente
  const workerDayCounter: Record<string, number> = {};
  storeStaff.forEach((emp) => {
    workerDayCounter[emp.id] = 0;
  });

  // 3. Assegnazione turni e reparti per ciascuna delle 7 giornate
  weekDays.forEach((dayMeta) => {
    const { dateStr, dayIndex, isWeekend, isMerchandiseArrival } = dayMeta;

    const availableStaff: Employee[] = [];

    storeStaff.forEach((emp) => {
      const isOff = offDaysSchedule[emp.id]?.has(dayIndex);
      const isFerie = approvedLeaves[emp.id]?.has(dateStr);

      if (isFerie) {
        shifts.push({
          id: `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          locationId,
          date: dateStr,
          type: 'ferie',
          areaNote: 'Ferie approvate dalla direzione',
        });
        // Conta come una delle 5 giornate del lavoratore
        workerDayCounter[emp.id]++;
      } else if (isOff) {
        shifts.push({
          id: `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          locationId,
          date: dateStr,
          type: 'riposo',
        });
      } else {
        availableStaff.push(emp);
      }
    });

    if (availableStaff.length === 0) {
      warnings.push(`Attenzione: nessun dipendente in servizio il ${dayMeta.dayName} ${dateStr}!`);
      uncoveredDaysList.push({ dateStr, departments: [...DEPARTMENTS] });
      return;
    }

    const assignedEmpIds = new Set<string>();

    // Helper per estrarre il miglior candidato per competenza decrescente in uno specifico reparto
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

    const dayAssignments: { emp: Employee; dept: Department; note: string }[] = [];

    // --- VINCOLO 1: CASSA (Presidio obbligatorio 100%) ---
    const bestCassa = getBestAvailableFor('Cassa', assignedEmpIds);
    if (bestCassa) {
      assignedEmpIds.add(bestCassa.id);
      dayAssignments.push({
        emp: bestCassa,
        dept: 'Cassa',
        note: 'Cassa 1 Principale (Barriera Continua)',
      });
      cassaCoveredDays++;
    } else {
      warnings.push(`Cassa sguarnita in data ${dateStr}!`);
    }

    // --- VINCOLO 2: FIORERIA (Presidio obbligatorio) ---
    const bestFioreria = getBestAvailableFor('Fioreria', assignedEmpIds);
    if (bestFioreria) {
      assignedEmpIds.add(bestFioreria.id);
      dayAssignments.push({
        emp: bestFioreria,
        dept: 'Fioreria',
        note: 'Banco Fioreria & Composizioni',
      });
    }

    // --- VINCOLO 3: DECOR (Presidio obbligatorio) ---
    const bestDecor = getBestAvailableFor('Decor', assignedEmpIds);
    if (bestDecor) {
      assignedEmpIds.add(bestDecor.id);
      dayAssignments.push({
        emp: bestDecor,
        dept: 'Decor',
        note: 'Decor, Vasi & Oggettistica',
      });
    }

    // --- VINCOLO 4: SERRA CALDA (Presidio obbligatorio) ---
    const bestSerraCalda = getBestAvailableFor('Serra Calda', assignedEmpIds);
    if (bestSerraCalda) {
      assignedEmpIds.add(bestSerraCalda.id);
      dayAssignments.push({
        emp: bestSerraCalda,
        dept: 'Serra Calda',
        note: 'Serra Tropicale & Piante da Interno',
      });
    }

    // --- VINCOLO 5: SERRA FREDDA / VIVAIO (Presidio obbligatorio) ---
    const bestSerraFredda = getBestAvailableFor('Serra Fredda', assignedEmpIds);
    if (bestSerraFredda) {
      assignedEmpIds.add(bestSerraFredda.id);
      dayAssignments.push({
        emp: bestSerraFredda,
        dept: 'Serra Fredda',
        note: isMerchandiseArrival
          ? 'Arrivo Merce & Ricevimento Piante'
          : 'Vivaio Esterno & Arbusti',
      });
    }

    // Verifica se qualcuno dei 5 reparti è rimasto scoperto
    const missingDepts: Department[] = [];
    if (!bestCassa) missingDepts.push('Cassa');
    if (!bestFioreria) missingDepts.push('Fioreria');
    if (!bestDecor) missingDepts.push('Decor');
    if (!bestSerraCalda) missingDepts.push('Serra Calda');
    if (!bestSerraFredda) missingDepts.push('Serra Fredda');

    if (missingDepts.length > 0) {
      uncoveredDaysList.push({ dateStr, departments: missingDepts });
      warnings.push(`Reparti scoperti il ${dayMeta.dayName} ${dateStr}: ${missingDepts.join(', ')}`);
    }

    // --- GESTIONE COLLABORATORI ECCEDENTI (Tutti devono fare le ore e i 5 giorni) ---
    const remainingStaff = availableStaff.filter((e) => !assignedEmpIds.has(e.id));

    remainingStaff.forEach((emp, remIdx) => {
      // 1° Eccedenza nel Weekend o Picco Merci: Seconda Cassa
      if ((isWeekend || isMerchandiseArrival) && remIdx === 0 && (emp.skills?.['Cassa'] ?? 0) >= 5) {
        dayAssignments.push({
          emp,
          dept: 'Cassa',
          note: 'Cassa 2 (Supporto Barriera & Uscite)',
        });
        assignedEmpIds.add(emp.id);
        return;
      }

      // 1° Eccedenza nei giorni merci (Gio/Ven): Rinforzo scarico serre
      if (isMerchandiseArrival && remIdx === 0) {
        dayAssignments.push({
          emp,
          dept: 'Serra Fredda',
          note: 'Scarico Merci Bilici & Carrelli Danesi',
        });
        assignedEmpIds.add(emp.id);
        return;
      }

      // Altrimenti: Rinforzo nel reparto dove il collaboratore ha la competenza più alta
      let bestDept: Department = emp.role;
      let highestScore = -1;

      DEPARTMENTS.forEach((d) => {
        const score = emp.skills?.[d] ?? 1;
        if (score > highestScore) {
          highestScore = score;
          bestDept = d;
        }
      });

      let note = `Supporto ${bestDept}`;
      if (bestDept === 'Fioreria') note = 'Fioreria (Confezioni & Allestimento)';
      else if (bestDept === 'Serra Calda') note = 'Serra Calda (Manutenzione & Clienti)';
      else if (bestDept === 'Decor') note = 'Decor (Riassortimento Scaffali)';
      else if (bestDept === 'Serra Fredda') note = 'Vivaio (Cura Piante & Spostamenti)';
      else if (bestDept === 'Cassa') note = 'Cassa di Supporto & Accoglienza';

      dayAssignments.push({
        emp,
        dept: bestDept,
        note,
      });
      assignedEmpIds.add(emp.id);
    });

    // --- ASSEGNAZIONE DEGLI ORARI SPECIFICI (Tarati sul contratto settimanale) ---
    dayAssignments.forEach(({ emp, dept, note }) => {
      const contractHours = emp.contractHours || 40;
      const dayIdx = workerDayCounter[emp.id] % 5;
      const shiftSchedule = getDailyShiftSchedule(contractHours, dayIdx, mode);

      shifts.push({
        id: `shift-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        locationId,
        date: dateStr,
        type: shiftSchedule.type,
        department: dept,
        startTime: shiftSchedule.startTime,
        endTime: shiftSchedule.endTime,
        areaNote: note,
        isCustomHours: shiftSchedule.isCustomHours,
      });

      workerDayCounter[emp.id]++;
    });
  });

  // 4. Calcolo Statistiche Finali e Quadratura Monte Ore
  const employeesWorkingDays: Record<string, number> = {};
  const employeesWorkingHours: Record<string, EmployeeWeeklyHours> = {};

  storeStaff.forEach((emp) => {
    const weeklySummary = calculateEmployeeWeeklyHours(emp, shifts, mode);
    employeesWorkingDays[emp.id] = weeklySummary.workedDaysCount;
    employeesWorkingHours[emp.id] = weeklySummary;
  });

  const cassaCoverageScore = Math.round((cassaCoveredDays / 7) * 100);
  const allDepartmentsCovered = uncoveredDaysList.length === 0;

  return {
    shifts,
    stats: {
      totalShifts: shifts.length,
      cassaCoverageScore,
      staffCount: storeStaff.length,
      employeesWorkingDays,
      employeesWorkingHours,
      allDepartmentsCovered,
      uncoveredDays: uncoveredDaysList,
      warnings,
      mode,
    },
  };
};
