export type Department =
  | 'Cassa'
  | 'Fioreria'
  | 'Serra Fredda'
  | 'Serra Calda'
  | 'Area Tecnica'
  | 'Decor'
  | 'Emporio'
  | 'Natale';

export type Role = Department;

export type LocationId = 'gazzada' | 'varese';

export interface LocationInfo {
  id: LocationId;
  name: string;
  shortName: string;
  city: string;
  address: string;
  defaultStaffCount: number;
  phone: string;
}

export type SkillScores = Partial<Record<Department, number>>; // 1 - 10 per ciascun reparto della sede

export type ShiftType = 'mattina' | 'pomeriggio' | 'giornata' | 'riposo' | 'ferie' | 'malattia';

export type ScheduleMode = 'standard' | 'continuato'; // 'standard' (spezzato/giornata) o 'continuato' (stagione autunno/Natale)

export interface Employee {
  id: string;
  name: string;
  locationId: LocationId;
  role: Department; // Reparto primario di riferimento
  skills: SkillScores; // Matrice competenze (1-10 per reparto)
  avatar: string;
  email: string;
  phone?: string;
  password?: string;
  color?: string;
  isManager?: boolean;
  contractHours?: number; // es. 40h o 24h
  isActive?: boolean;     // Se false: collaboratore archiviato/cessato (soft-delete)
  isMobile?: boolean;     // Se true: collaboratore mobile (sede primaria + trasferte nell'altra sede)
  isOwner?: boolean;      // Se true: titolare/proprietario (esente da turnazione e non conteggiato nell'organico dipendenti)
}

export interface UserSession {
  user: Employee;
  role: 'employee' | 'manager';
}

export interface Shift {
  id: string;
  employeeId: string;
  locationId: LocationId;
  date: string; // Formato YYYY-MM-DD
  type: ShiftType;
  department?: Department; // Reparto assegnato (es. Cassa, Fioreria)
  startTime?: string;      // es. '08:30' o '09:00'
  endTime?: string;        // es. '12:30' o '19:00'
  areaNote?: string;       // es. 'Cassa 1 Continua', 'Scarico Merci Serra'
  isManualOverride?: boolean;
  isCustomHours?: boolean; // Orario personalizzato concordato
  customHoursReason?: string; // Motivo esplicito dell'orario speciale (es. Part-Time 30h, Richiesta approvata, Straordinario)
  assignedSkillScore?: number; // Punteggio competenza del dipendente nel reparto assegnato (1-10)
}

export type ShiftRequestType = 'swap' | 'leave' | 'schedule_change' | 'sick';

export type ShiftRequestStatus =
  | 'pending'            // In attesa di valutazione Direzione / titolare (o ferie/orario/malattia)
  | 'pending_colleague'  // Scambio turno: in attesa di accettazione da parte del collega
  | 'rejected_colleague' // Scambio turno: rifiutato dal collega
  | 'approved'           // Approvato definitivamente dalla Direzione
  | 'rejected';          // Rifiutato dalla Direzione

export interface ShiftRequest {
  id: string;
  requesterId: string;
  locationId: LocationId;
  type: ShiftRequestType; // Scambio turno, Ferie/Permesso, Variazione Orario o Malattia
  targetEmployeeId?: string; // Per scambio turno
  shiftDate: string;        // YYYY-MM-DD
  targetShiftDate?: string;
  requestedStartTime?: string; // HH:MM per variazione orario
  requestedEndTime?: string;   // HH:MM per variazione orario
  protocolNumber?: string;     // Numero telematico certificato medico INPS (per malattia)
  reason: string;
  status: ShiftRequestStatus;
  createdAt: string;
  managerNote?: string;
  colleagueNote?: string;
}

export type ActiveTab = 'today' | 'my-shifts' | 'planner' | 'requests' | 'personnel' | 'skills' | 'staff';

export interface EmployeeWeeklyHours {
  workedHours: number;
  leaveHours: number;
  totalAccountedHours: number; // workedHours + leaveHours
  contractHours: number;
  isContractFulfilled: boolean;
  deltaHours: number; // totalAccountedHours - contractHours
  workedDaysCount: number;
}

export interface WeekDayMeta {
  dateStr: string;
  dayIndex: number; // 0 = Domenica, 1 = Lunedì ... 6 = Sabato
  dayName: string;
  dayShort: string;
  dayNum: number;
  isWeekend: boolean;
  isMerchandiseArrival: boolean;
  isToday: boolean;
}

export interface DepartmentStaffAssignment {
  employeeId: string;
  name: string;
  department: Department;
  hours: string;
}

export interface DayCoverageSummary {
  dateStr: string;
  totalPresent: number;
  cassaCount: number;
  isCassaOk: boolean;
  fioreriaCount: number;
  serraFreddaCount: number;
  serraCaldaCount: number;
  areaTecnicaCount?: number;
  decorCount?: number;
  emporioCount?: number;
  nataleCount?: number;
  riposoCount: number;
  ferieCount: number;
  malattiaCount: number;
  uncoveredDepartments: Department[];
  averageSkillScore?: number;
  departmentSkillScores?: Partial<Record<Department, number>>;
  suboptimalDepartments?: Department[];
  departmentStaff?: Partial<Record<Department, DepartmentStaffAssignment[]>>;
}

export interface ReplacementSuggestion {
  employee: Employee;
  score: number; // Punteggio idoneità (0-100)
  reasons: string[];
  isAvailableOnDay: boolean;
  currentShiftType: ShiftType;
}

export interface MonthlyEmployeeSummary {
  employee: Employee;
  workedHours: number;
  leaveHours: number;
  totalAccountedHours: number;
  departmentHours: Partial<Record<Department, number>>;
  daysCount: {
    presence: number;
    rest: number;
    leave: number;
    sick: number;
  };
  expectedMonthlyHours: number;
  deltaHours: number;
}

export interface MonthlyStoreSummary {
  year: number;
  month: number; // 1 - 12
  monthLabel: string;
  locationId: LocationId;
  totalWorkedHours: number;
  totalLeaveHours: number;
  totalAccountedHours: number;
  departmentTotals: Partial<Record<Department, number>>;
  totalPresenceDays: number;
  totalRestDays: number;
  totalLeaveDays: number;
  totalSickDays: number;
  employeeSummaries: MonthlyEmployeeSummary[];
}

