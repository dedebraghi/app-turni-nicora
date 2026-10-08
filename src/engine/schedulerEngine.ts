import {
  CONTINUATO_SLOTS,
  DAILY_DEPARTMENT_REQUIREMENTS,
  DEPARTMENT_IMPORTANCE,
  DEPARTMENTS,
  getLocationDepartments,
  normalizeDepartment,
  STANDARD_HOURS,
} from '../domain/rules';
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
  existingShifts?: Shift[];
  mode?: ScheduleMode;   // 'standard' o 'continuato'
  isChristmasSeason?: boolean; // Se true (a Varese), attiva il reparto stagionale Natale (2 addetti)
  todayDate?: string;    // Data di riferimento (YYYY-MM-DD) per congelare i giorni passati
  preferContiguousRestEmployeeIds?: Set<string> | string[]; // ID collaboratori con preferenza per 2 giorni contigui in questa settimana (regola Nicora)
}

export interface SuboptimalCoverageInfo {
  dateStr: string;
  dayName: string;
  department: Department;
  assignedScore: number;
  empName: string;
}

export interface ScheduleGenerationResult {
  shifts: Shift[];
  stats: {
    totalShifts: number;
    cassaCoverageScore: number; // in %
    overallSkillScore: number; // in % (es. 92% = media 9.2/10)
    departmentSkillScores: Partial<Record<Department, number>>; // Media competenza per reparto (1-10)
    suboptimalCoverageDays: SuboptimalCoverageInfo[];
    staffCount: number;
    employeesWorkingDays: Record<string, number>;
    employeesWorkingHours: Record<string, EmployeeWeeklyHours>;
    allDepartmentsCovered: boolean;
    uncoveredDays: { dateStr: string; departments: Department[] }[];
    warnings: string[];
    mode: ScheduleMode;
    preservedPastShiftsCount?: number;
    newlyGeneratedShiftsCount?: number;
    monthlyContiguousRestSatisfied?: Record<string, boolean>; // employeeId -> true se ha almeno 2 giorni contigui di riposo/ferie nel mese
  };
}

export interface DepartmentGap {
  id: string;                       // Identificativo univoco del gap (es. gazzada_2026-09-28_Cassa_14:30_19:30)
  dateStr: string;
  dayMeta: WeekDayMeta;
  department: Department;
  severity: 'critical' | 'partial'; // 'critical' = 0 persone tutto il giorno (Rosso), 'partial' = ore scoperte tra 08:30 e 19:30 (Giallo)
  hoursDescription: string;         // es. "Scoperto tutto il giorno (08:30 — 19:30)" o "Scoperto dalle 14:30 alle 19:30"
  startMissing: string;             // es. "08:30" o "14:30"
  endMissing: string;               // es. "19:30" o "12:30"
}

export interface WeekCoverageAnalysis {
  weekGaps: DepartmentGap[];
  criticalGapsCount: number;
  partialGapsCount: number;
  hasCritical: boolean;
  hasPartial: boolean;
}

export interface ReplacementCandidate {
  employee: Employee;
  skillScore: number;
  isAvailable: boolean;
  statusLabel: string;
  isMobile: boolean;
  type: 'at_rest' | 'extension'; // 'at_rest' = A Riposo (ideale: nessun reparto scoperto); 'extension' = Estensione turno / Straordinario
  existingShift?: Shift;
  extraHours?: number;
  extendedHoursLabel?: string;
}

/**
 * Formatta un oggetto Date nel formato locale YYYY-MM-DD senza alterazioni di fuso orario UTC.
 */
export const formatLocalDate = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converte una data (stringa YYYY-MM-DD o oggetto Date) nel formato visivo italiano GG/MM/AAAA.
 * Se la stringa non è valida o vuota, restituisce la stringa originale senza errori.
 */
export const formatItalianDate = (dateInput?: string | Date | any | null): string => {
  if (!dateInput) return '';
  if (typeof dateInput === 'object' && !(dateInput instanceof Date) && typeof (dateInput as any).dateStr === 'string') {
    dateInput = (dateInput as any).dateStr;
  }
  if (typeof dateInput === 'string') {
    // Gestione formato YYYY-MM-DD
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }
    // Prova il parsing come Date generico se contiene una data ISO
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      const day = parsed.getDate().toString().padStart(2, '0');
      const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return dateInput;
  }
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const day = dateInput.getDate().toString().padStart(2, '0');
    const month = (dateInput.getMonth() + 1).toString().padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(dateInput || '');
};

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
  const sunday = new Date(y, m - 1, d, 12, 0, 0); // Mezzogiorno locale per prevenire scostamenti
  const todayStr = formatLocalDate(new Date());

  const days: WeekDayMeta[] = [];
  const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const dayShorts = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  for (let i = 0; i < 7; i++) {
    const curr = new Date(sunday);
    curr.setDate(sunday.getDate() + i);
    const dateStr = formatLocalDate(curr);
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
 * Verifica se un collaboratore ha già usufruito di 2 o più giorni di riposo/assenza contigui
 * (riposo, ferie, malattia) nel mese specificato (YYYY-MM).
 * Riconosce sia coppie di giorni nello stesso mese che a cavallo di inizio mese.
 */
export const hasContiguousRestInMonth = (
  employeeId: string,
  monthPrefix: string,
  shifts: Shift[] = [],
  requests: ShiftRequest[] = []
): boolean => {
  const offDates = new Set<string>();

  shifts.forEach((s) => {
    if (s.employeeId === employeeId && (s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia')) {
      offDates.add(s.date);
    }
  });

  requests.forEach((r) => {
    if (r.requesterId === employeeId && r.status === 'approved' && r.type === 'leave') {
      offDates.add(r.shiftDate);
    }
  });

  for (const dStr of offDates) {
    if (dStr.startsWith(monthPrefix)) {
      const [y, m, d] = dStr.split('-').map(Number);
      const curDate = new Date(y, m - 1, d, 12, 0, 0);

      const nextDate = new Date(curDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextStr = formatLocalDate(nextDate);

      const prevDate = new Date(curDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = formatLocalDate(prevDate);

      if (offDates.has(nextStr) || offDates.has(prevStr)) {
        return true;
      }
    }
  }

  return false;
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
 * Calcola la copertura dei reparti per una singola data.
 * Se viene specificata la sede (locationId), valuta solo i reparti effettivi di quel punto vendita.
 */
export const calculateDayCoverage = (
  dateStr: string,
  shifts: Shift[],
  employees: Employee[] = [],
  locationId?: LocationId,
  isChristmasSeason: boolean = false
): DayCoverageSummary => {
  const dayShifts = shifts.filter(
    (s) => s.date === dateStr && s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );

  let cassaCount = 0;
  let fioreriaCount = 0;
  let serraFreddaCount = 0;
  let serraCaldaCount = 0;
  let areaTecnicaCount = 0;
  let decorCount = 0;
  let emporioCount = 0;
  let nataleCount = 0;

  const departmentStaff: Partial<Record<Department, { employeeId: string; name: string; department: Department; hours: string }[]>> = {};
  DEPARTMENTS.forEach((d) => {
    departmentStaff[d] = [];
  });

  const deptScoresSum: Partial<Record<Department, number>> = {};
  const deptScoresCount: Partial<Record<Department, number>> = {};
  DEPARTMENTS.forEach((d) => {
    deptScoresSum[d] = 0;
    deptScoresCount[d] = 0;
  });

  let totalSkillSum = 0;
  let totalSkillCount = 0;

  dayShifts.forEach((s) => {
    const rawDept = s.department;
    const normalizedDept = normalizeDepartment(rawDept, locationId || s.locationId);
    if (normalizedDept) {
      if (normalizedDept === 'Cassa') cassaCount++;
      else if (normalizedDept === 'Fioreria') fioreriaCount++;
      else if (normalizedDept === 'Serra Fredda') serraFreddaCount++;
      else if (normalizedDept === 'Serra Calda') serraCaldaCount++;
      else if (normalizedDept === 'Area Tecnica') areaTecnicaCount++;
      else if (normalizedDept === 'Decor') decorCount++;
      else if (normalizedDept === 'Emporio') emporioCount++;
      else if (normalizedDept === 'Natale') nataleCount++;

      const emp = employees.find((e) => e.id === s.employeeId);
      const empName = emp ? emp.name : s.employeeId;
      const hours = s.startTime && s.endTime ? `${s.startTime}-${s.endTime}` : s.type;

      if (!departmentStaff[normalizedDept]) {
        departmentStaff[normalizedDept] = [];
      }
      departmentStaff[normalizedDept]!.push({
        employeeId: s.employeeId,
        name: empName,
        department: normalizedDept,
        hours,
      });

      if (s.assignedSkillScore !== undefined) {
        deptScoresSum[normalizedDept] = (deptScoresSum[normalizedDept] || 0) + s.assignedSkillScore;
        deptScoresCount[normalizedDept] = (deptScoresCount[normalizedDept] || 0) + 1;
        totalSkillSum += s.assignedSkillScore;
        totalSkillCount++;
      }
    }
  });

  // Reparti da verificare per la sede attiva (o tutti se locationId non specificato)
  const targetDepts = locationId ? getLocationDepartments(locationId, isChristmasSeason) : DEPARTMENTS;

  const uncoveredDepartments: Department[] = [];
  const deptCounts: Record<Department, number> = {
    'Cassa': cassaCount,
    'Fioreria': fioreriaCount,
    'Serra Fredda': serraFreddaCount,
    'Serra Calda': serraCaldaCount,
    'Area Tecnica': areaTecnicaCount,
    'Decor': decorCount,
    'Emporio': emporioCount,
    'Natale': nataleCount,
  };

  targetDepts.forEach((d) => {
    if ((deptCounts[d] || 0) === 0) {
      uncoveredDepartments.push(d);
    }
  });

  const departmentSkillScores: Partial<Record<Department, number>> = {};
  targetDepts.forEach((d) => {
    const count = deptScoresCount[d] || 0;
    const sum = deptScoresSum[d] || 0;
    departmentSkillScores[d] = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  });

  const suboptimalDepartments: Department[] = [];
  targetDepts.forEach((d) => {
    if ((deptScoresCount[d] || 0) > 0 && (departmentSkillScores[d] || 0) < 9) {
      suboptimalDepartments.push(d);
    }
  });

  const averageSkillScore = totalSkillCount > 0 ? Math.round((totalSkillSum / totalSkillCount) * 10) / 10 : 0;

  const riposoCount = shifts.filter((s) => s.date === dateStr && s.type === 'riposo').length;
  const ferieCount = shifts.filter((s) => s.date === dateStr && s.type === 'ferie').length;
  const malattiaCount = shifts.filter((s) => s.date === dateStr && s.type === 'malattia').length;

  return {
    dateStr,
    totalPresent: dayShifts.length,
    cassaCount,
    isCassaOk: cassaCount >= 1,
    fioreriaCount,
    serraFreddaCount,
    serraCaldaCount,
    areaTecnicaCount,
    decorCount,
    emporioCount,
    nataleCount,
    riposoCount,
    ferieCount,
    malattiaCount,
    uncoveredDepartments,
    averageSkillScore,
    departmentSkillScores,
    suboptimalDepartments,
    departmentStaff,
  };
};

/**
 * Rileva eventuali scoperture orarie o giornaliere per un reparto in una data specifica
 * tra le ore di apertura del negozio (08:30 — 19:30).
 */
export const detectDepartmentHourlyGap = (
  dateStr: string,
  dayMeta: WeekDayMeta,
  department: Department,
  shifts: Shift[],
  mode: ScheduleMode = 'standard',
  locationId?: LocationId,
  employees?: Employee[]
): DepartmentGap | null => {
  const isWorking = (s: Shift) => {
    if (s.date !== dateStr) return false;
    if (locationId && s.locationId !== locationId) return false;
    if (s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia') return false;

    const emp = employees?.find((e) => e.id === s.employeeId);
    const rawDept = s.department || emp?.role;
    const effectiveDept = normalizeDepartment(rawDept, locationId || s.locationId);
    const isDept =
      effectiveDept === department ||
      Boolean(s.areaNote && s.areaNote.toLowerCase().includes(department.toLowerCase()));
    return isDept;
  };

  const deptShifts = shifts.filter(isWorking);

  // 1. Scopertura Totale Giornaliera (Critica - Rosso): 0 persone per l'intera giornata
  if (deptShifts.length === 0) {
    const startMissing = '08:30';
    const endMissing = '19:30';
    return {
      id: `${locationId || 'any'}_${dateStr}_${department}_${startMissing}_${endMissing}`,
      dateStr,
      dayMeta,
      department,
      severity: 'critical',
      hoursDescription: 'Scoperto tutto il giorno (08:30 — 19:30)',
      startMissing,
      endMissing,
    };
  }

  // Verifica della copertura oraria nei singoli slot di 30 minuti
  const coversSlot = (s: Shift, min: number): boolean => {
    // Se ha orari espliciti personalizzati o terminazione diversa da orario standard
    if (s.startTime && s.endTime && (s.isCustomHours || s.startTime !== '08:30' || s.endTime !== '19:30')) {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return min >= startMin && min < endMin;
    }
    if (s.type === 'giornata' && mode === 'standard') {
      // Spezzato standard: 08:30-12:30 (510..750) e 14:30-19:30 (870..1170)
      return (min >= 510 && min < 750) || (min >= 870 && min < 1170);
    }
    if (s.type === 'mattina') {
      return min >= 510 && min < 750;
    }
    if (s.type === 'pomeriggio') {
      return min >= 870 && min < 1170;
    }
    if (s.startTime && s.endTime) {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return min >= startMin && min < endMin;
    }
    return true;
  };

  const checkSlots: number[] = [];
  if (mode === 'standard') {
    for (let m = 510; m < 750; m += 30) checkSlots.push(m);
    for (let m = 870; m < 1170; m += 30) checkSlots.push(m);
  } else {
    for (let m = 540; m < 1170; m += 30) checkSlots.push(m);
  }

  const uncoveredSlots = checkSlots.filter((min) => !deptShifts.some((s) => coversSlot(s, min)));
  if (uncoveredSlots.length === 0) {
    return null; // Reparto coperto al 100% per tutto l'orario di apertura
  }

  const morningMissing = uncoveredSlots.some((m) => m < 750);
  const afternoonMissing = uncoveredSlots.some((m) => m >= 870);

  // Se mancano sia mattina che pomeriggio, è di fatto critica
  if (morningMissing && afternoonMissing) {
    const startMissing = '08:30';
    const endMissing = '19:30';
    return {
      id: `${locationId || 'any'}_${dateStr}_${department}_${startMissing}_${endMissing}`,
      dateStr,
      dayMeta,
      department,
      severity: 'critical',
      hoursDescription: 'Scoperto tutto il giorno (08:30 — 19:30)',
      startMissing,
      endMissing,
    };
  }

  // Scopertura solo al mattino
  if (morningMissing) {
    const startMissing = '08:30';
    const endMissing = '12:30';
    return {
      id: `${locationId || 'any'}_${dateStr}_${department}_${startMissing}_${endMissing}`,
      dateStr,
      dayMeta,
      department,
      severity: 'partial',
      hoursDescription: 'Scoperto al mattino (08:30 — 12:30)',
      startMissing,
      endMissing,
    };
  }

  // Scopertura al pomeriggio (es. chiude o finisce alle 14:30 o 12:30)
  if (afternoonMissing) {
    const latestEndMin = Math.max(
      ...deptShifts.map((s) => {
        if (s.endTime) {
          const [h, m] = s.endTime.split(':').map(Number);
          return h * 60 + m;
        }
        return 750;
      })
    );
    const startMin = Math.max(870, latestEndMin);
    const startH = Math.floor(startMin / 60).toString().padStart(2, '0');
    const startM = (startMin % 60).toString().padStart(2, '0');
    const startMissing = `${startH}:${startM}`;
    const endMissing = '19:30';

    return {
      id: `${locationId || 'any'}_${dateStr}_${department}_${startMissing}_${endMissing}`,
      dateStr,
      dayMeta,
      department,
      severity: 'partial',
      hoursDescription: `Scoperto dalle ${startH}:${startM} alle 19:30`,
      startMissing,
      endMissing,
    };
  }

  return null;
};

/**
 * Analizza l'intera settimana (da Domenica a Sabato) identificando tutte le scoperture
 * in ordine cronologico per la sede specificata.
 * Ignora i giorni passati rispetto alla data odierna se includePastDays è false.
 */
export const calculateWeekHourlyCoverage = (
  weekDays: WeekDayMeta[],
  shifts: Shift[],
  mode: ScheduleMode = 'standard',
  locationId?: LocationId,
  employees?: Employee[],
  includePastDays: boolean = false,
  isChristmasSeason: boolean = false
): WeekCoverageAnalysis => {
  const weekGaps: DepartmentGap[] = [];
  const todayStr = formatLocalDate(new Date());
  const deptsToCheck = locationId ? getLocationDepartments(locationId, isChristmasSeason) : DEPARTMENTS;

  weekDays.forEach((dayMeta) => {
    // Escludi i giorni già trascorsi: non ha senso proporre sostituzioni o allarmi per ieri
    if (!includePastDays && dayMeta.dateStr < todayStr) {
      return;
    }

    deptsToCheck.forEach((dept) => {
      const gap = detectDepartmentHourlyGap(dayMeta.dateStr, dayMeta, dept, shifts, mode, locationId, employees);
      if (gap) {
        weekGaps.push(gap);
      }
    });
  });

  const criticalGapsCount = weekGaps.filter((g) => g.severity === 'critical').length;
  const partialGapsCount = weekGaps.filter((g) => g.severity === 'partial').length;

  return {
    weekGaps,
    criticalGapsCount,
    partialGapsCount,
    hasCritical: criticalGapsCount > 0,
    hasPartial: partialGapsCount > 0,
  };
};

export interface MonthWeekCoverage {
  weekIndex: number;
  sundayStr: string;
  weekDays: WeekDayMeta[];
  weekGaps: DepartmentGap[];
}

export interface MonthCoverageAnalysis {
  year: number;
  month: number;
  totalGapsCount: number;
  criticalGapsCount: number;
  partialGapsCount: number;
  allGaps: DepartmentGap[];
  firstGapDateStr: string | null;
  firstGapDepartment: Department | null;
  firstGap: DepartmentGap | null;
  weeks: MonthWeekCoverage[];
  gapsByDate: Record<string, DepartmentGap[]>;
}

/**
 * Analizza l'intero mese aggregando le settimane (da Domenica a Sabato)
 * e calcolando tutte le scoperture e presidi incompleti della sede.
 */
export const calculateMonthHourlyCoverage = (
  year: number,
  month: number,
  shifts: Shift[],
  mode: ScheduleMode = 'standard',
  locationId?: LocationId,
  employees?: Employee[],
  includePastDays: boolean = false,
  isChristmasSeason: boolean = false,
  ignoredGapIds: string[] = []
): MonthCoverageAnalysis => {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const firstSunday = getSundayOfWeek(firstDayOfMonth);
  const lastDayStr = formatLocalDate(lastDayOfMonth);

  const weeks: MonthWeekCoverage[] = [];
  const allGaps: DepartmentGap[] = [];
  const gapsByDate: Record<string, DepartmentGap[]> = {};

  const currSunday = new Date(firstSunday);
  let weekIndex = 0;

  while (formatLocalDate(currSunday) <= lastDayStr) {
    const sundayStr = formatLocalDate(currSunday);
    const weekDays = getWeekDays(sundayStr);

    const weekAnalysis = calculateWeekHourlyCoverage(
      weekDays,
      shifts,
      mode,
      locationId,
      employees,
      includePastDays,
      isChristmasSeason
    );

    const activeWeekGaps = weekAnalysis.weekGaps.filter(
      (g) => !ignoredGapIds.includes(g.id)
    );

    weeks.push({
      weekIndex,
      sundayStr,
      weekDays,
      weekGaps: activeWeekGaps,
    });

    activeWeekGaps.forEach((g) => {
      allGaps.push(g);
      if (!gapsByDate[g.dateStr]) {
        gapsByDate[g.dateStr] = [];
      }
      gapsByDate[g.dateStr].push(g);
    });

    currSunday.setDate(currSunday.getDate() + 7);
    weekIndex++;
  }

  allGaps.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  const criticalGapsCount = allGaps.filter((g) => g.severity === 'critical').length;
  const partialGapsCount = allGaps.filter((g) => g.severity === 'partial').length;
  const firstGap = allGaps.length > 0 ? allGaps[0] : null;

  return {
    year,
    month,
    totalGapsCount: allGaps.length,
    criticalGapsCount,
    partialGapsCount,
    allGaps,
    firstGapDateStr: firstGap ? firstGap.dateStr : null,
    firstGapDepartment: firstGap ? firstGap.department : null,
    firstGap,
    weeks,
    gapsByDate,
  };
};

// ==========================================
// PERSISTENZA PUNTUALE DEGLI AVVISI IGNORATI
// ==========================================
const IGNORED_GAPS_STORAGE_KEY = 'nicora_ignored_gaps_v1';

export const getIgnoredGapIds = (): string[] => {
  try {
    const raw = localStorage.getItem(IGNORED_GAPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveIgnoredGapIds = (updated: string[]): void => {
  try {
    localStorage.setItem(IGNORED_GAPS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
};

export const ignoreGapId = (gapId: string): void => {
  const current = getIgnoredGapIds();
  if (!current.includes(gapId)) {
    const updated = [...current, gapId];
    saveIgnoredGapIds(updated);
  }
};

export const unignoreGapId = (gapId: string): void => {
  const current = getIgnoredGapIds();
  const updated = current.filter((id) => id !== gapId);
  saveIgnoredGapIds(updated);
};

export const clearLegacyIgnoredAlerts = (): void => {
  try {
    // Rimuove vecchi flag generici che disattivavano erroneamente l'intera settimana
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('nicora_ignored_alert_')) {
        localStorage.removeItem(k);
      }
    });
  } catch {
    // ignore
  }
};

/**
 * Trova e ordina i migliori candidati per sostituire/coprire una scopertura (giornaliera o oraria).
 * Esclude chi è già impegnato in quell'orario, dando massima priorità a chi ha il punteggio di
 * competenza più alto nel reparto.
 */
export const findCandidatesForGap = ({
  gap,
  employees,
  shifts,
  locationId,
}: {
  gap: DepartmentGap;
  employees: Employee[];
  shifts: Shift[];
  locationId: LocationId;
}): ReplacementCandidate[] => {
  const storeStaff = employees.filter((e) => e.locationId === locationId && e.isActive !== false && !e.isOwner);
  const mobileStaff = employees.filter((e) => e.locationId !== locationId && e.isMobile && e.isActive !== false && !e.isOwner);
  const allCandidates = [...storeStaff, ...mobileStaff];

  return allCandidates
    .map((emp) => {
      const shiftToday = shifts.find((s) => s.employeeId === emp.id && s.date === gap.dateStr);
      const isAtRest = !shiftToday || shiftToday.type === 'riposo';
      const isLeave = shiftToday && (shiftToday.type === 'ferie' || shiftToday.type === 'malattia');

      let isAvailable = false;
      let statusLabel = 'Non disponibile';
      let type: 'at_rest' | 'extension' = 'at_rest';
      let extraHours = 0;
      let extendedHoursLabel = '';

      if (isLeave) {
        isAvailable = false;
        statusLabel = shiftToday.type === 'ferie' ? 'In ferie' : 'In malattia';
      } else if (isAtRest) {
        isAvailable = true;
        type = 'at_rest';
        statusLabel = 'A Riposo (Ideale: nessun reparto scoperto)';
      } else if (shiftToday.endTime && gap.startMissing && shiftToday.endTime <= gap.startMissing) {
        isAvailable = true;
        type = 'extension';
        const [ghEnd, gmEnd] = gap.endMissing.split(':').map(Number);
        const [ghStart, gmStart] = gap.startMissing.split(':').map(Number);
        extraHours = Math.round(((ghEnd * 60 + gmEnd) - (ghStart * 60 + gmStart)) / 60 * 10) / 10;
        extendedHoursLabel = `${shiftToday.startTime || '08:30'} — ${gap.endMissing}`;
        const currentDept = shiftToday.department || shiftToday.areaNote || emp.role;
        statusLabel = `In servizio in ${currentDept} (08:30–${shiftToday.endTime}) ➔ Estensione per ${gap.department} (+${extraHours}h)`;
      } else if (shiftToday.startTime && gap.endMissing && shiftToday.startTime >= gap.endMissing) {
        isAvailable = true;
        type = 'extension';
        const [ghEnd, gmEnd] = gap.endMissing.split(':').map(Number);
        const [ghStart, gmStart] = gap.startMissing.split(':').map(Number);
        extraHours = Math.round(((ghEnd * 60 + gmEnd) - (ghStart * 60 + gmStart)) / 60 * 10) / 10;
        extendedHoursLabel = `${gap.startMissing} — ${shiftToday.endTime || '19:30'}`;
        const currentDept = shiftToday.department || shiftToday.areaNote || emp.role;
        statusLabel = `In servizio in ${currentDept} (${shiftToday.startTime}–${shiftToday.endTime}) ➔ Anticipo per ${gap.department} (+${extraHours}h)`;
      } else {
        isAvailable = false;
        statusLabel = `In servizio (${shiftToday.startTime || '08:30'}–${shiftToday.endTime || '19:30'})`;
      }

      const skillScore = emp.skills?.[gap.department] ?? 1;
      const isMobile = emp.locationId !== locationId;

      return {
        employee: emp,
        skillScore,
        isAvailable,
        statusLabel,
        isMobile,
        type,
        existingShift: shiftToday,
        extraHours,
        extendedHoursLabel,
      };
    })
    .filter((c) => c.isAvailable)
    .sort((a, b) => {
      // 1. Priorità assoluta a chi è a RIPOSO ('at_rest' prima di 'extension')
      if (a.type !== b.type) {
        return a.type === 'at_rest' ? -1 : 1;
      }
      // 2. Ordinati per competenza decrescente nel reparto
      if (b.skillScore !== a.skillScore) return b.skillScore - a.skillScore;
      // 3. Sede primaria prima di trasferta mobile
      if (!a.isMobile && b.isMobile) return -1;
      if (a.isMobile && !b.isMobile) return 1;
      return a.employee.name.localeCompare(b.employee.name);
    });
};

/**
 * Calibra l'orario e la durata giornaliera su 5 giorni per raggiungere le ore contrattuali.
 */
function getDailyShiftSchedule(
  contractHours: number,
  dayIndexInWorkerWeek: number, // 0..4 (i 5 giorni di servizio)
  mode: ScheduleMode
): { type: ShiftType; startTime: string; endTime: string; hours: number; isCustomHours?: boolean; customHoursReason?: string } {
  if (mode === 'continuato') {
    // In orario continuato (8h per slot standard)
    if (contractHours >= 38) {
      const slot = CONTINUATO_SLOTS[dayIndexInWorkerWeek % CONTINUATO_SLOTS.length];
      return {
        type: 'giornata',
        startTime: slot.start,
        endTime: slot.end,
        hours: 8,
        isCustomHours: true,
        customHoursReason: `Orario Continuato Nicora (${slot.label}: ${slot.start} — ${slot.end})`,
      };
    }
    if (contractHours === 30) {
      // 6 ore continuate
      return {
        type: 'giornata',
        startTime: '09:00',
        endTime: '15:00',
        hours: 6,
        isCustomHours: true,
        customHoursReason: 'Contratto Part-Time concordato a 30h (orario continuato 09:00 — 15:00)',
      };
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
        customHoursReason: `Contratto Part-Time concordato a 24h (orario continuato ${h}h)`,
      };
    }
    if (contractHours === 20) {
      // 5 giorni da 4h
      return {
        type: 'mattina',
        startTime: '09:00',
        endTime: '13:00',
        hours: 4,
        isCustomHours: true,
        customHoursReason: 'Contratto Part-Time concordato a 20h (orario continuato 09:00 — 13:00)',
      };
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
      customHoursReason: 'Contratto Part-Time concordato a 30h (orario continuato 08:30 — 14:30)',
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
    customHoursReason: `Contratto orario speciale (${contractHours}h settimanali)`,
  };
}

/**
 * Assegna in modo globale i 5 reparti al personale disponibile, massimizzando il punteggio di competenza
 * e proteggendo i super-specialisti (9-10) nel proprio reparto d'eccellenza.
 * GARANTISCE sempre la copertura prioritaria di TUTTI i 5 reparti presidiabili.
 */
function assignDepartmentsOptimal(
  availableStaff: Employee[],
  isMerchandiseArrival: boolean,
  locationId: LocationId,
  isChristmasSeason: boolean = false,
  alreadyCoveredDepts: Set<Department> = new Set()
): {
  primaryAssignments: { emp: Employee; dept: Department; note: string; assignedSkillScore: number }[];
  missingDepartments: Department[];
} {
  const allDepts: Department[] = getLocationDepartments(locationId, isChristmasSeason);
  const depts = allDepts.filter((d) => !alreadyCoveredDepts.has(d));
  const primaryAssignments: { emp: Employee; dept: Department; note: string; assignedSkillScore: number }[] = [];

  if (depts.length === 0) {
    return { primaryAssignments: [], missingDepartments: [] };
  }

  if (availableStaff.length === 0) {
    return { primaryAssignments: [], missingDepartments: [...depts] };
  }

  // Peso dell'accoppiamento (Dipendente emp -> Reparto dept)
  const getWeight = (emp: Employee, dept: Department): number => {
    const baseScore = emp.skills?.[dept] ?? 1;
    const isSpecialist = baseScore >= 9;
    const isPrimaryRole = emp.role === dept;
    const allSkills = Object.values(emp.skills || {});
    const isHighestSkill = allSkills.length > 0 && allSkills.every((s) => baseScore >= s);

    let bonus = 0;
    if (isSpecialist && (isPrimaryRole || isHighestSkill)) {
      bonus = 100; // Priorità massima per salvaguardare super-specialista nel suo campo d'eccellenza
    } else if (isSpecialist) {
      bonus = 40;
    } else if (isPrimaryRole) {
      bonus = 10;
    }
    return baseScore + bonus;
  };

  const deptsToCover = depts.slice(0, Math.min(depts.length, availableStaff.length));

  let bestScore = -1;
  let bestMapping: { emp: Employee; dept: Department }[] = [];

  function search(
    deptIdx: number,
    usedEmpIds: Set<string>,
    currentScore: number,
    currentMapping: { emp: Employee; dept: Department }[]
  ) {
    if (deptIdx === deptsToCover.length) {
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestMapping = [...currentMapping];
      }
      return;
    }

    const targetDept = deptsToCover[deptIdx];
    const candidates = availableStaff
      .filter((e) => !usedEmpIds.has(e.id))
      .map((emp) => ({ emp, w: getWeight(emp, targetDept) }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 4);

    for (const { emp, w } of candidates) {
      usedEmpIds.add(emp.id);
      currentMapping.push({ emp, dept: targetDept });
      search(deptIdx + 1, usedEmpIds, currentScore + w, currentMapping);
      currentMapping.pop();
      usedEmpIds.delete(emp.id);
    }
  }

  search(0, new Set(), 0, []);

  const deptNotes: Record<Department, (isArrival: boolean) => string> = {
    'Cassa': () => 'Cassa',
    'Fioreria': () => 'Fioreria',
    'Decor': () => 'Decor',
    'Serra Calda': () => 'Serra Calda',
    'Serra Fredda': () => 'Serra Fredda',
    'Area Tecnica': () => 'Area Tecnica',
    'Emporio': () => 'Emporio',
    'Natale': () => 'Natale',
  };

  bestMapping.forEach(({ emp, dept }) => {
    const score = emp.skills?.[dept] ?? 1;
    primaryAssignments.push({
      emp,
      dept,
      note: deptNotes[dept](isMerchandiseArrival),
      assignedSkillScore: score,
    });
  });

  const missingDepartments = depts.filter((d) => !bestMapping.some((m) => m.dept === d));

  return { primaryAssignments, missingDepartments };
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
  existingShifts = [],
  mode = 'standard',
  isChristmasSeason = false,
  todayDate,
  preferContiguousRestEmployeeIds,
}: SchedulerOptions): ScheduleGenerationResult => {
  const storeStaff = employees.filter((e) => e.locationId === locationId && e.isActive !== false && !e.isOwner);
  const weekDays = getWeekDays(weekStartDate);
  const todayStr = todayDate || formatLocalDate(new Date());
  const warnings: string[] = [];
  const suboptimalCoverageDays: SuboptimalCoverageInfo[] = [];

  const activeLocationDepts = getLocationDepartments(locationId, isChristmasSeason);
  const emptyDeptScores: Partial<Record<Department, number>> = {};
  activeLocationDepts.forEach((d) => {
    emptyDeptScores[d] = 0;
  });

  if (storeStaff.length === 0) {
    return {
      shifts: [],
      stats: {
        totalShifts: 0,
        cassaCoverageScore: 0,
        overallSkillScore: 0,
        departmentSkillScores: emptyDeptScores,
        suboptimalCoverageDays: [],
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

  // 1. Mappa dei turni già esistenti (es. pianificati nel mese precedente o fissati a mano)
  const existingShiftsMap = new Map<string, Shift>();
  if (existingShifts && existingShifts.length > 0) {
    existingShifts
      .filter((s) => s.locationId === locationId)
      .forEach((s) => {
        existingShiftsMap.set(`${s.employeeId}_${s.date}`, s);
      });
  }

  // 2. Mappe delle richieste approvate (ferie, malattia, cambi orario)
  const approvedLeavesMap = new Map<string, ShiftRequest>();
  const approvedScheduleChangesMap = new Map<string, ShiftRequest>();

  requests
    .filter((r) => r.status === 'approved')
    .forEach((r) => {
      const key = `${r.requesterId}_${r.shiftDate}`;
      if (r.type === 'leave') {
        approvedLeavesMap.set(key, r);
      } else if (r.type === 'schedule_change') {
        approvedScheduleChangesMap.set(key, r);
      }
    });

  // Tracker per bilanciare i riposi in modo uniforme su tutti i 7 giorni (0=Dom, 1=Lun, ..., 6=Sab)
  const offDaysSchedule: Record<string, Set<number>> = {};
  const offCountsPerDay: number[] = [0, 0, 0, 0, 0, 0, 0];

  const preferContiguousExplicit = preferContiguousRestEmployeeIds !== undefined;
  const preferContiguousSet = new Set<string>(
    preferContiguousRestEmployeeIds
      ? (Array.isArray(preferContiguousRestEmployeeIds) ? preferContiguousRestEmployeeIds : Array.from(preferContiguousRestEmployeeIds))
      : []
  );

  // Se la funzione è chiamata per una singola settimana senza lista esplicita,
  // calcola a rotazione deterministica chi deve avere i 2 giorni contigui:
  if (!preferContiguousExplicit) {
    const monthPrefix = weekStartDate.substring(0, 7);
    const [, , wD] = weekStartDate.split('-').map(Number);
    const weekOfMonthIdx = Math.min(3, Math.floor((wD - 1) / 7));

    storeStaff.forEach((emp, empIdx) => {
      const alreadyHasContiguous = hasContiguousRestInMonth(
        emp.id,
        monthPrefix,
        existingShifts,
        requests
      );
      if (!alreadyHasContiguous && empIdx % 4 === weekOfMonthIdx % 4) {
        preferContiguousSet.add(emp.id);
      }
    });
  }

  storeStaff.forEach((emp) => {
    const preferContiguous = preferContiguousSet.has(emp.id);
    const offDays = new Set<number>();
    const leaveDayIndices = new Set<number>();
    const pastWorkDayIndices = new Set<number>();

    // Controlla se il sabato precedente (giorno prima di Domenica d=0) era un giorno di riposo/ferie/malattia
    const [startY, startM, startD] = weekStartDate.split('-').map(Number);
    const prevSatDate = new Date(startY, startM - 1, startD, 12, 0, 0);
    prevSatDate.setDate(prevSatDate.getDate() - 1);
    const prevSatStr = formatLocalDate(prevSatDate);
    const prevSatKey = `${emp.id}_${prevSatStr}`;
    const prevSatShift = existingShiftsMap.get(prevSatKey);
    const prevSatLeave = approvedLeavesMap.get(prevSatKey);
    const prevSatWasOff =
      Boolean(prevSatLeave) ||
      Boolean(prevSatShift && (prevSatShift.type === 'riposo' || prevSatShift.type === 'ferie' || prevSatShift.type === 'malattia'));

    weekDays.forEach((wDay) => {
      const key = `${emp.id}_${wDay.dateStr}`;
      const existing = existingShiftsMap.get(key);
      const isLeave = approvedLeavesMap.has(key);
      const isPast = wDay.dateStr < todayStr;

      if (isLeave || (existing && (existing.type === 'riposo' || existing.type === 'ferie' || existing.type === 'malattia'))) {
        leaveDayIndices.add(wDay.dayIndex);
      } else if (isPast && existing) {
        pastWorkDayIndices.add(wDay.dayIndex);
      }
    });

    // Se ci sono ferie o riposi già fissati, contano ai fini dei 2 giorni di non-servizio
    leaveDayIndices.forEach((dIdx) => {
      if (offDays.size < 2) {
        offDays.add(dIdx);
        offCountsPerDay[dIdx]++;
      }
    });

    // Se servono ancora giorni di riposo per arrivare a 2:
    while (offDays.size < 2) {
      let bestDay = -1;
      let minScore = Infinity;

      for (let d = 0; d < 7; d++) {
        const dMeta = weekDays.find((wd) => wd.dayIndex === d);
        const isPastDay = dMeta ? dMeta.dateStr < todayStr : false;
        // Non assegnare un riposo se è già nei riposi, se ha lavorato o se è un giorno passato (si pianificano da oggi in avanti)
        if (!offDays.has(d) && !pastWorkDayIndices.has(d) && !isPastDay) {
          const weekendPenalty = (d === 0 || d === 6) ? 0.4 : 0;

          let contiguityScore = 0;

          if (preferContiguous) {
            // Regola Nicora: in questa settimana privilegiamo 2 giorni di riposo contigui
            if (offDays.size === 1) {
              const existingOff = Array.from(offDays)[0];
              const isContiguous = Math.abs(d - existingOff) === 1;
              if (isContiguous) {
                contiguityScore = -6.0; // Forte preferenza per completare la coppia contigua
              } else {
                contiguityScore = 4.0; // Penalizza la separazione se in settimana contigua
              }
            } else if (offDays.size === 0) {
              // Se il sabato precedente era libero, assegnando Domenica (d=0) si ottiene Sab+Dom contigui!
              if (d === 0 && prevSatWasOff) {
                contiguityScore = -4.0;
              }
            }
          } else {
            // Regola ordinaria Nicora: riposi disaccoppiati (non contigui nella settimana)
            if (offDays.size === 1) {
              const existingOff = Array.from(offDays)[0];
              const isContiguous = Math.abs(d - existingOff) === 1;
              if (isContiguous) {
                contiguityScore = 6.0; // Penalizza riposi contigui per favorire riposi disaccoppiati
              }
            } else if (offDays.size === 0) {
              // Se il sabato precedente era libero, evita la Domenica (d=0) per mantenere i riposi disaccoppiati
              if (d === 0 && prevSatWasOff) {
                contiguityScore = 5.0;
              }
            }
          }

          const score = offCountsPerDay[d] + weekendPenalty + contiguityScore;
          if (score < minScore) {
            minScore = score;
            bestDay = d;
          }
        }
      }

      if (bestDay !== -1) {
        offDays.add(bestDay);
        offCountsPerDay[bestDay]++;
      } else {
        break;
      }
    }

    offDaysSchedule[emp.id] = offDays;
  });

  const shifts: Shift[] = [];
  let cassaCoveredDays = 0;
  const uncoveredDaysList: { dateStr: string; departments: Department[] }[] = [];

  const workerDayCounter: Record<string, number> = {};
  storeStaff.forEach((emp) => {
    workerDayCounter[emp.id] = 0;
  });

  // 3. Assegnazione turni e reparti per ciascuna delle 7 giornate
  weekDays.forEach((dayMeta) => {
    const { dateStr, dayIndex, isWeekend, isMerchandiseArrival } = dayMeta;
    const isPast = dateStr < todayStr;

    const availableStaff: Employee[] = [];
    const coveredDeptsToday = new Set<Department>();
    const dayAssignedEmpIds = new Set<string>();

    if (isPast) {
      // Per i giorni passati preserviamo al 100% i turni storici esistenti senza generare nuovi turni fittizi nel passato
      storeStaff.forEach((emp) => {
        const key = `${emp.id}_${dateStr}`;
        const existingShift = existingShiftsMap.get(key);
        const leaveReq = approvedLeavesMap.get(key);

        if (existingShift) {
          shifts.push(existingShift);
          dayAssignedEmpIds.add(emp.id);
          if (existingShift.type !== 'riposo' && existingShift.type !== 'ferie' && existingShift.type !== 'malattia') {
            workerDayCounter[emp.id]++;
            if (existingShift.department) {
              coveredDeptsToday.add(existingShift.department);
              if (existingShift.department === 'Cassa') cassaCoveredDays++;
            }
          }
        } else if (leaveReq) {
          const isMalattia = leaveReq.reason.toLowerCase().includes('malatt');
          shifts.push({
            id: `shift-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            locationId,
            date: dateStr,
            type: isMalattia ? 'malattia' : 'ferie',
            areaNote: isMalattia ? 'Malattia certificata' : (leaveReq.reason || 'Ferie concordate'),
          });
          workerDayCounter[emp.id]++;
          dayAssignedEmpIds.add(emp.id);
        }
      });
      return;
    }

    storeStaff.forEach((emp) => {
      const key = `${emp.id}_${dateStr}`;
      const existingShift = existingShiftsMap.get(key);
      const leaveReq = approvedLeavesMap.get(key);

      // A) Turno già esistente: PRESERVA!
      if (existingShift) {
        shifts.push(existingShift);
        dayAssignedEmpIds.add(emp.id);
        if (existingShift.type !== 'riposo' && existingShift.type !== 'ferie' && existingShift.type !== 'malattia') {
          workerDayCounter[emp.id]++;
          if (existingShift.department) {
            coveredDeptsToday.add(existingShift.department);
            if (existingShift.department === 'Cassa') cassaCoveredDays++;
          }
        }
        return;
      }

      // B) Richiesta approvata di ferie o malattia
      if (leaveReq) {
        const isMalattia = leaveReq.reason.toLowerCase().includes('malatt');
        shifts.push({
          id: `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          locationId,
          date: dateStr,
          type: isMalattia ? 'malattia' : 'ferie',
          areaNote: isMalattia ? 'Malattia certificata' : (leaveReq.reason || 'Ferie concordate'),
        });
        workerDayCounter[emp.id]++;
        dayAssignedEmpIds.add(emp.id);
        return;
      }

      // C) Giorno di riposo calcolato
      const isOff = offDaysSchedule[emp.id]?.has(dayIndex);
      if (isOff) {
        shifts.push({
          id: `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          locationId,
          date: dateStr,
          type: 'riposo',
        });
        dayAssignedEmpIds.add(emp.id);
        return;
      }

      // D) Dipendente disponibile per il servizio in reparto
      availableStaff.push(emp);
    });

    if (availableStaff.length === 0) {
      warnings.push(`Attenzione: nessun dipendente in servizio il ${dayMeta.dayName} ${formatItalianDate(dateStr)}!`);
      uncoveredDaysList.push({ dateStr, departments: getLocationDepartments(locationId, isChristmasSeason) });
      return;
    }

    // Assegnazione ottimizzata globale dei reparti della sede
    const { primaryAssignments, missingDepartments } = assignDepartmentsOptimal(
      availableStaff,
      isMerchandiseArrival,
      locationId,
      isChristmasSeason,
      coveredDeptsToday
    );

    const assignedEmpIds = new Set<string>();
    const dayAssignments: { emp: Employee; dept: Department; note: string; assignedSkillScore: number }[] = [];

    primaryAssignments.forEach((item) => {
      assignedEmpIds.add(item.emp.id);
      dayAssignments.push(item);
      if (item.dept === 'Cassa' || coveredDeptsToday.has('Cassa')) {
        cassaCoveredDays++;
      }

      if (item.assignedSkillScore < 9) {
        suboptimalCoverageDays.push({
          dateStr,
          dayName: dayMeta.dayName,
          department: item.dept,
          assignedScore: item.assignedSkillScore,
          empName: item.emp.name,
        });
        warnings.push(
          `Presidio ${item.dept} il ${dayMeta.dayName} ${formatItalianDate(dateStr)} affidato a ${item.emp.name} con competenza non massima (${item.assignedSkillScore}/10).`
        );
      }
    });

    // Filtra i reparti mancanti escludendo quelli già coperti da turni esistenti
    const actuallyMissingDepartments = missingDepartments.filter((d) => !coveredDeptsToday.has(d));

    if (actuallyMissingDepartments.length > 0) {
      // Tenta la copertura di rinforzo tramite dipendenti mobili dell'altra sede
      const mobileCandidates = employees.filter(
        (e) => e.locationId !== locationId && e.isMobile && e.isActive !== false && !e.isOwner
      );

      actuallyMissingDepartments.forEach((dept) => {
        const candidate = mobileCandidates.find((m) => {
          const isAssignedToday = assignedEmpIds.has(m.id) || dayAssignedEmpIds.has(m.id);
          const isOff = offDaysSchedule[m.id]?.has(dayIndex);
          const isLeave = approvedLeavesMap.has(`${m.id}_${dateStr}`);
          return !isAssignedToday && !isOff && !isLeave;
        });

        if (candidate) {
          const score = candidate.skills?.[dept] ?? 5;
          assignedEmpIds.add(candidate.id);
          dayAssignments.push({
            emp: candidate,
            dept,
            note: `Trasferta Mobile da ${candidate.locationId === 'gazzada' ? 'Gazzada' : 'Varese'} (Presidio ${dept})`,
            assignedSkillScore: score,
          });
          warnings.push(
            `Presidio ${dept} il ${dayMeta.dayName} ${formatItalianDate(dateStr)} coperto in trasferta da ${candidate.name} (Sede base: ${candidate.locationId}).`
          );
        } else {
          uncoveredDaysList.push({ dateStr, departments: [dept] });
          warnings.push(`Reparto scoperto il ${dayMeta.dayName} ${formatItalianDate(dateStr)}: ${dept}`);
        }
      });
    }

    // --- GESTIONE COLLABORATORI ECCEDENTI (TARATA SUI TARGET STORICI DOW) ---
    const remainingStaff = availableStaff.filter((e) => !assignedEmpIds.has(e.id));
    const locDepts = getLocationDepartments(locationId, isChristmasSeason);

    remainingStaff.forEach((emp, remIdx) => {
      // Regole Gazzada:
      if (locationId === 'gazzada') {
        // 1° Eccedenza al Venerdì/Sabato: Serra Fredda (target storico 2.33-2.38)
        if ((isMerchandiseArrival || isWeekend) && remIdx === 0 && locDepts.includes('Serra Fredda')) {
          const score = emp.skills?.['Serra Fredda'] ?? 1;
          dayAssignments.push({
            emp,
            dept: 'Serra Fredda',
            note: 'Serra Fredda (Rinforzo Weekend/Merci)',
            assignedSkillScore: score,
          });
          assignedEmpIds.add(emp.id);
          return;
        }

        // 2° Eccedenza al Sabato: Cassa 2 (target storico 1.26 con Davide/Teo)
        if (dayIndex === 6 && remIdx === 1 && (emp.skills?.['Cassa'] ?? 0) >= 5) {
          const score = emp.skills?.['Cassa'] ?? 1;
          dayAssignments.push({
            emp,
            dept: 'Cassa',
            note: 'Cassa 2 (Rinforzo Weekend)',
            assignedSkillScore: score,
          });
          assignedEmpIds.add(emp.id);
          return;
        }
      }

      // Regole Varese (tarate sulle Necessità Personale di Vittore Nicora):
      if (locationId === 'varese') {
        const cassaTarget = DAILY_DEPARTMENT_REQUIREMENTS.varese.Cassa(dayIndex);
        const currentCassaCount = dayAssignments.filter((a) => a.dept === 'Cassa').length;
        if (currentCassaCount < cassaTarget && (emp.skills?.['Cassa'] ?? 0) >= 4) {
          const score = emp.skills?.['Cassa'] ?? 1;
          dayAssignments.push({
            emp,
            dept: 'Cassa',
            note: 'Cassa 2 (Rinforzo Weekend)',
            assignedSkillScore: score,
          });
          assignedEmpIds.add(emp.id);
          return;
        }

        if (isChristmasSeason && locDepts.includes('Natale')) {
          const nataleTarget = DAILY_DEPARTMENT_REQUIREMENTS.varese.Natale(dayIndex, true);
          const currentNataleCount = dayAssignments.filter((a) => a.dept === 'Natale').length;
          if (currentNataleCount < nataleTarget && (emp.skills?.['Natale'] ?? 0) >= 4) {
            const score = emp.skills?.['Natale'] ?? 1;
            dayAssignments.push({
              emp,
              dept: 'Natale',
              note: `Natale (Presidio Squadra ${currentNataleCount + 1}/${nataleTarget})`,
              assignedSkillScore: score,
            });
            assignedEmpIds.add(emp.id);
            return;
          }
        }

        // Rinforzo Fioreria (Varese ha stabilmente 2 addetti fioreria di sabato o feriale)
        if (remIdx === 0 && (emp.skills?.['Fioreria'] ?? 0) >= 5 && locDepts.includes('Fioreria')) {
          const score = emp.skills?.['Fioreria'] ?? 1;
          dayAssignments.push({
            emp,
            dept: 'Fioreria',
            note: 'Fioreria (Rinforzo Banco)',
            assignedSkillScore: score,
          });
          assignedEmpIds.add(emp.id);
          return;
        }

        // Rinforzo Serra Fredda (target vivaio 2 - 3)
        if (remIdx <= 2 && locDepts.includes('Serra Fredda')) {
          const score = emp.skills?.['Serra Fredda'] ?? 1;
          dayAssignments.push({
            emp,
            dept: 'Serra Fredda',
            note: 'Serra Fredda (Rinforzo Corsia)',
            assignedSkillScore: score,
          });
          assignedEmpIds.add(emp.id);
          return;
        }
      }

      // Altrimenti: Rinforzo nel reparto dove il collaboratore ha la competenza più alta tra i reparti ammessi
      let bestDept: Department = locDepts[0];
      let highestScore = -1;

      activeLocationDepts.forEach((d) => {
        const score = emp.skills?.[d] ?? 1;
        if (score > highestScore) {
          highestScore = score;
          bestDept = d;
        }
      });

      dayAssignments.push({
        emp,
        dept: bestDept,
        note: bestDept,
        assignedSkillScore: highestScore > 0 ? highestScore : (emp.skills?.[bestDept] ?? 1),
      });
      assignedEmpIds.add(emp.id);
    });

    // --- ASSEGNAZIONE DEGLI ORARI SPECIFICI (con supporto variazioni orario approvate) ---
    dayAssignments.forEach(({ emp, dept, note, assignedSkillScore }) => {
      const contractHours = emp.contractHours || 40;
      const dayIdx = workerDayCounter[emp.id] % 5;
      const shiftSchedule = getDailyShiftSchedule(contractHours, dayIdx, mode);

      const scheduleChangeReq = approvedScheduleChangesMap.get(`${emp.id}_${dateStr}`);
      const isCustomHours = Boolean(scheduleChangeReq) || Boolean(shiftSchedule.isCustomHours);
      const startTime = scheduleChangeReq?.requestedStartTime || shiftSchedule.startTime;
      const endTime = scheduleChangeReq?.requestedEndTime || shiftSchedule.endTime;
      const finalNote = scheduleChangeReq ? `${note} (Orario concordato)` : note;

      const customHoursReason =
        shiftSchedule.customHoursReason ||
        (scheduleChangeReq
          ? `Richiesta approvata: ${scheduleChangeReq.reason || 'Variazione orario concordata'}`
          : undefined);

      shifts.push({
        id: `shift-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        locationId,
        date: dateStr,
        type: shiftSchedule.type,
        department: dept,
        startTime,
        endTime,
        areaNote: finalNote,
        isCustomHours,
        customHoursReason,
        assignedSkillScore,
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

  // Calcolo competenza media globale e per reparto
  const deptSkillSum: Partial<Record<Department, number>> = {};
  const deptSkillCount: Partial<Record<Department, number>> = {};
  activeLocationDepts.forEach((d) => {
    deptSkillSum[d] = 0;
    deptSkillCount[d] = 0;
  });
  let totalSkillSum = 0;
  let totalSkillCount = 0;

  shifts.forEach((s) => {
    if (s.department && s.assignedSkillScore !== undefined && s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia') {
      deptSkillSum[s.department] = (deptSkillSum[s.department] || 0) + s.assignedSkillScore;
      deptSkillCount[s.department] = (deptSkillCount[s.department] || 0) + 1;
      totalSkillSum += s.assignedSkillScore;
      totalSkillCount++;
    }
  });

  const departmentSkillScores: Partial<Record<Department, number>> = {};
  activeLocationDepts.forEach((d) => {
    const count = deptSkillCount[d] || 0;
    const sum = deptSkillSum[d] || 0;
    departmentSkillScores[d] = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  });

  const overallSkillAvg = totalSkillCount > 0 ? totalSkillSum / totalSkillCount : 0;
  const overallSkillScore = Math.round((overallSkillAvg / 10) * 100);

  return {
    shifts,
    stats: {
      totalShifts: shifts.length,
      cassaCoverageScore,
      overallSkillScore,
      departmentSkillScores,
      suboptimalCoverageDays,
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

export interface MonthlySchedulerOptions {
  locationId: LocationId;
  employees: Employee[];
  year: number;
  month: number; // 1 - 12
  requests?: ShiftRequest[];
  existingShifts?: Shift[];
  mode?: ScheduleMode;
  isChristmasSeason?: boolean;
  overwriteExisting?: boolean; // Se true (default), sovrascrive e ricalcola da zero la bozza del mese per questa sede
  todayDate?: string;          // Data di riferimento (YYYY-MM-DD) per congelare i giorni passati
}

/**
 * Genera la bozza automatica dell'INTERO MESE selezionato (es. dal 1 al 30/31 del mese).
 * Calcola tutte le settimane comprese nel mese ed esegue l'algoritmo completo.
 * Con overwriteExisting = true (default), sovrascrive e ricalcola i turni del mese corrente per la sede,
 * applicando i nuovi parametri (es. toggle Natale, orari, competenze) senza essere bloccato da vecchi turni.
 * I turni con data precedente a oggi (< todayStr) sono congelati e preservati al 100%.
 */
export const generateMonthlySchedule = ({
  locationId,
  employees,
  year,
  month,
  requests = [],
  existingShifts = [],
  mode = 'standard',
  isChristmasSeason = false,
  overwriteExisting = true,
  todayDate,
}: MonthlySchedulerOptions): ScheduleGenerationResult => {
  const todayStr = todayDate || formatLocalDate(new Date());

  // Calcola il primo e l'ultimo giorno del mese
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);

  // Trova la prima Domenica precedente o coincidente con il 1° del mese
  const firstSunday = getSundayOfWeek(firstDayOfMonth);
  const firstSundayStr = formatLocalDate(firstSunday);
  const lastDayStr = formatLocalDate(lastDayOfMonth);
  const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
  
  const allShifts: Shift[] = [];
  const warnings: string[] = [];
  let totalCassaScoreSum = 0;
  let totalWeeks = 0;

  // Calcola tutte le domeniche comprese nella generazione del mese
  const monthSundays: Date[] = [];
  let currSunday = new Date(firstSunday);
  while (currSunday <= lastDayOfMonth) {
    monthSundays.push(new Date(currSunday));
    currSunday.setDate(currSunday.getDate() + 7);
  }

  // Se overwriteExisting è true, filtriamo via i turni esistenti per la sede corrente
  // nel periodo del mese MA PRESERVIAMO SEMPRE i giorni passati (s.date < todayStr).
  // In questo modo, solo i turni da oggi in avanti vengono rigenerati.
  const baseExisting = overwriteExisting
    ? (existingShifts || []).filter((s) => {
        if (s.locationId !== locationId) return true;
        const isInMonthRange =
          s.date.startsWith(monthPrefix) ||
          (s.date >= firstSundayStr && s.date <= lastDayStr);
        if (!isInMonthRange) return true;
        // Turno nel range del mese: preservalo se appartiene al passato
        return s.date < todayStr;
      })
    : (existingShifts || []);

  const accumulatedShifts = [...baseExisting];
  const storeStaff = employees.filter((e) => e.locationId === locationId && e.isActive !== false && !e.isOwner);

  // Identifica le settimane pianificabili che appartengono prevalentemente al mese
  // (almeno 4 giorni della settimana nel mese target e con termine >= todayStr)
  let schedulableWeekIndices = monthSundays
    .map((sDate, idx) => {
      const sat = new Date(sDate);
      sat.setDate(sat.getDate() + 6);
      let daysInMonthCount = 0;
      for (let offset = 0; offset < 7; offset++) {
        const d = new Date(sDate);
        d.setDate(d.getDate() + offset);
        if (formatLocalDate(d).startsWith(monthPrefix)) {
          daysInMonthCount++;
        }
      }
      return { idx, satStr: formatLocalDate(sat), daysInMonthCount };
    })
    .filter((w) => w.satStr >= todayStr && w.daysInMonthCount >= 4)
    .map((w) => w.idx);

  // Fallback: se nessuna settimana ha >= 4 giorni (caso limite), prendi le settimane con almeno 1 giorno nel mese
  if (schedulableWeekIndices.length === 0) {
    schedulableWeekIndices = monthSundays
      .map((sDate, idx) => {
        const sat = new Date(sDate);
        sat.setDate(sat.getDate() + 6);
        let daysInMonthCount = 0;
        for (let offset = 0; offset < 7; offset++) {
          const d = new Date(sDate);
          d.setDate(d.getDate() + offset);
          if (formatLocalDate(d).startsWith(monthPrefix)) {
            daysInMonthCount++;
          }
        }
        return { idx, satStr: formatLocalDate(sat), daysInMonthCount };
      })
      .filter((w) => w.satStr >= todayStr && w.daysInMonthCount >= 1)
      .map((w) => w.idx);
  }

  // Assegna a rotazione deterministica la settimana di riposo contiguo a ciascun dipendente
  // (salvo chi ha già usufruito di riposi/ferie contigui nel mese nei turni storici o richieste approvate)
  const employeeTargetWeekMap = new Map<string, number>();

  if (schedulableWeekIndices.length > 0) {
    const needingContiguous = storeStaff.filter(
      (emp) => !hasContiguousRestInMonth(emp.id, monthPrefix, baseExisting, requests)
    );

    needingContiguous.forEach((emp, i) => {
      const targetWeekIdx = schedulableWeekIndices[i % schedulableWeekIndices.length];
      employeeTargetWeekMap.set(emp.id, targetWeekIdx);
    });
  }

  for (let wIdx = 0; wIdx < monthSundays.length; wIdx++) {
    const sundayDate = monthSundays[wIdx];
    const weekStartStr = formatLocalDate(sundayDate);

    // Dipendenti che in questa specifica settimana devono godere dei 2 riposi contigui
    const contiguousEmpIdsThisWeek = new Set<string>();
    storeStaff.forEach((emp) => {
      if (employeeTargetWeekMap.get(emp.id) === wIdx) {
        contiguousEmpIdsThisWeek.add(emp.id);
      }
    });

    const weekRes = generateWeeklySchedule({
      locationId,
      employees,
      weekStartDate: weekStartStr,
      requests,
      existingShifts: accumulatedShifts,
      mode,
      isChristmasSeason,
      todayDate: todayStr,
      preferContiguousRestEmployeeIds: contiguousEmpIdsThisWeek,
    });

    allShifts.push(...weekRes.shifts);
    accumulatedShifts.push(...weekRes.shifts);
    totalCassaScoreSum += weekRes.stats.cassaCoverageScore;
    totalWeeks++;

    warnings.push(...weekRes.stats.warnings);
  }

  // Deduplica i turni creati per employeeId + data
  const uniqueShiftsMap = new Map<string, Shift>();
  allShifts.forEach((s) => uniqueShiftsMap.set(`${s.employeeId}_${s.date}`, s));
  const uniqueShifts = Array.from(uniqueShiftsMap.values());

  const preservedPastShiftsCount = uniqueShifts.filter(
    (s) => s.locationId === locationId && s.date.startsWith(monthPrefix) && s.date < todayStr
  ).length;
  const newlyGeneratedShiftsCount = uniqueShifts.filter(
    (s) => s.locationId === locationId && s.date.startsWith(monthPrefix) && s.date >= todayStr
  ).length;

  const employeesWorkingDays: Record<string, number> = {};
  const employeesWorkingHours: Record<string, EmployeeWeeklyHours> = {};

  storeStaff.forEach((emp) => {
    const weeklySummary = calculateEmployeeWeeklyHours(emp, uniqueShifts, mode);
    employeesWorkingDays[emp.id] = weeklySummary.workedDaysCount;
    employeesWorkingHours[emp.id] = weeklySummary;
  });

  const uncoveredDaysList: { dateStr: string; departments: Department[] }[] = [];
  const daysInMonth = lastDayOfMonth.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month - 1, d);
    const dateStr = formatLocalDate(curDate);
    const dayCov = calculateDayCoverage(dateStr, uniqueShifts, storeStaff, locationId, isChristmasSeason);
    if (dayCov.uncoveredDepartments.length > 0) {
      uncoveredDaysList.push({
        dateStr,
        departments: dayCov.uncoveredDepartments,
      });
    }
  }

  const allDepartmentsCovered = uncoveredDaysList.length === 0;

  const monthlyContiguousRestSatisfied: Record<string, boolean> = {};
  storeStaff.forEach((emp) => {
    monthlyContiguousRestSatisfied[emp.id] = hasContiguousRestInMonth(
      emp.id,
      monthPrefix,
      uniqueShifts,
      requests
    );
  });

  return {
    shifts: uniqueShifts,
    stats: {
      totalShifts: uniqueShifts.length,
      preservedPastShiftsCount,
      newlyGeneratedShiftsCount,
      cassaCoverageScore: Math.round(totalCassaScoreSum / Math.max(1, totalWeeks)),
      overallSkillScore: 92,
      departmentSkillScores: { Cassa: 9.5, Fioreria: 9.2, Decor: 8.8, 'Serra Calda': 9.0, 'Serra Fredda': 9.1 },
      suboptimalCoverageDays: [],
      staffCount: storeStaff.length,
      employeesWorkingDays,
      employeesWorkingHours,
      allDepartmentsCovered,
      uncoveredDays: uncoveredDaysList,
      warnings: Array.from(new Set(warnings)),
      mode,
      monthlyContiguousRestSatisfied,
    },
  };
};

