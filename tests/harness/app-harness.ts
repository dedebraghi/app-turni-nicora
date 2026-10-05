/**
 * App Harness: Full Opaque-Box Lifecycle Simulation of Nicora Garden Shift Scheduling PWA
 * Faithfully simulates application state, user sessions, privacy barriers, draft lifecycle,
 * scheduler engine, and views according to PROJECT.md and ORIGINAL_REQUEST.md.
 */
import {
  Department,
  Employee,
  LocationId,
  MonthlyStoreSummary,
  ScheduleMode,
  Shift,
  ShiftRequest,
  ShiftRequestStatus,
  ShiftRequestType,
  UserSession,
} from '../../src/domain/types';
import { INITIAL_EMPLOYEES, LOCATIONS, MANAGER_MASTER_PASSWORD } from '../../src/domain/mockData';
import {
  calculateDayCoverage,
  calculateEmployeeWeeklyHours,
  formatLocalDate,
  generateMonthlySchedule,
  getSundayOfWeek,
  getWeekDays,
} from '../../src/engine/schedulerEngine';
import { findBestReplacements } from '../../src/engine/replacementAdvisor';
import { exportMonthlyReportCSV } from '../../src/services/exportService';
import {
  getPublishedMonthsMap,
  hasDraftGenerated,
  isMonthPublished,
  loadStoredShifts,
  recordDraftGenerated,
  recordMonthPublished,
  recordMonthUnpublished,
  resetDraftGenerated,
  syncPublishedMonthsFromCloud,
} from '../../src/services/storageService';
import { MockStorage, setupBrowserEnv } from './browser-env';
import { MockSupabaseServer } from './mock-supabase';

export interface AppHarnessOptions {
  storage?: MockStorage;
  cloud?: MockSupabaseServer;
  initialLocation?: LocationId;
}

export class AppHarness {
  public storage: MockStorage;
  public cloud: MockSupabaseServer;
  public activeLocation: LocationId = 'gazzada';

  public employees: Employee[] = [];
  public shifts: Shift[] = [];
  public requests: ShiftRequest[] = [];

  public session: UserSession | null = null;
  public isManagerMode: boolean = false;
  public downloads: Array<{ filename: string; content: string }> = [];

  constructor(options: AppHarnessOptions = {}) {
    const env = setupBrowserEnv();
    this.downloads = env.downloads;
    this.cloud = options.cloud || new MockSupabaseServer();
    this.activeLocation = options.initialLocation || 'gazzada';

    if (options.storage) {
      this.storage = options.storage;
      Object.defineProperty(globalThis, 'localStorage', {
        value: this.storage,
        writable: true,
        configurable: true,
      });
    } else {
      this.storage = env.storage;
      this.storage.clear();
    }

    if (!options.cloud) {
      this.cloud.reset();
    }
    this.employees = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES));
    this.shifts = [];
    this.requests = [];
    this.session = null;
    this.isManagerMode = false;
  }

  reset(): void {
    this.storage.clear();
    this.cloud.reset();
    this.employees = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES));
    this.shifts = [];
    this.requests = [];
    this.session = null;
    this.isManagerMode = false;
  }

  // ==========================================
  // --- AUTHENTICATION & SESSIONS (F10) ---
  // ==========================================
  loginAsEmployee(employeeId: string, pin: string): { success: boolean; error?: string } {
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp) {
      return { success: false, error: 'Collaboratore non trovato' };
    }
    const validPins = [emp.password, '1234', '123'].filter(Boolean);
    if (!validPins.includes(pin)) {
      return { success: false, error: 'PIN non corretto' };
    }
    this.session = { user: emp, role: 'employee' };
    this.isManagerMode = false;
    this.activeLocation = emp.locationId;
    return { success: true };
  }

  loginAsManager(email: string, pin: string): { success: boolean; error?: string } {
    const validManagerPasswords = [
      MANAGER_MASTER_PASSWORD,
      'admin',
      'NicoraMaster2026!',
      ...this.employees.filter((e) => e.isManager || e.isOwner).map((e) => e.password),
    ].filter(Boolean);

    if (!validManagerPasswords.includes(pin)) {
      return { success: false, error: 'Password direzione non corretta' };
    }

    const managerUser =
      this.employees.find((e) => e.email?.toLowerCase() === email.toLowerCase() && (e.isManager || e.isOwner)) ||
      this.employees.find((e) => e.isManager && e.locationId === this.activeLocation) ||
      this.employees.find((e) => e.isManager) || {
        id: 'manager-admin',
        name: 'Vittore Nicora',
        locationId: this.activeLocation,
        role: 'Serra Calda' as const,
        skills: { Cassa: 10, Fioreria: 8, Decor: 8, 'Serra Calda': 10, 'Serra Fredda': 10 },
        avatar: 'VN',
        email,
        isManager: true,
        password: MANAGER_MASTER_PASSWORD,
      };

    this.session = { user: managerUser, role: 'manager' };
    this.isManagerMode = true;
    return { success: true };
  }

  unlockManagerWithPin(pin: string): boolean {
    const validPins = [MANAGER_MASTER_PASSWORD, 'admin', 'NicoraMaster2026!'];
    if (validPins.includes(pin)) {
      this.isManagerMode = true;
      return true;
    }
    return false;
  }

  logout(): void {
    this.session = null;
    this.isManagerMode = false;
  }

  resetPin(employeeId: string, newPin: string): boolean {
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp) return false;
    emp.password = newPin;
    return true;
  }

  // ==========================================
  // --- LOCATION & NAVIGATION ---
  // ==========================================
  switchLocation(loc: LocationId): void {
    this.activeLocation = loc;
  }

  // ==========================================
  // --- SHIFTS & DRAFT LIFECYCLE (F04-F09) ---
  // ==========================================
  generateMonthlyShifts(year: number, month: number, locationId: LocationId = this.activeLocation, mode: ScheduleMode = 'standard'): Shift[] {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const res = generateMonthlySchedule({
      locationId,
      year,
      month,
      employees: this.employees,
      mode,
      todayDate: `${monthPrefix}-01`,
    });

    // Save to local shifts array
    this.shifts = [...this.shifts.filter((s) => !(s.locationId === locationId && s.date.startsWith(monthPrefix))), ...res.shifts];

    // Mark draft generated & unpublished in storage
    recordDraftGenerated(locationId, year, month);
    recordMonthUnpublished(locationId, year, month);

    // Save in storage
    this.storage.setItem('nicora_v5_shifts', JSON.stringify(this.shifts));

    // Upsert to mock cloud
    this.cloud.upsertShifts(res.shifts);

    return res.shifts;
  }

  publishMonth(locationId: LocationId, year: number, month: number): void {
    recordMonthPublished(locationId, year, month);
    this.cloud.publishMonth(locationId, year, month);
  }

  isMonthDraft(locationId: LocationId, year: number, month: number): boolean {
    return hasDraftGenerated(locationId, year, month);
  }

  isMonthOfficiallyPublished(locationId: LocationId, year: number, month: number): boolean {
    return isMonthPublished(locationId, year, month);
  }

  hasUnpublishedDraftInView(locationId: LocationId, year: number, month: number): boolean {
    const isDraft = this.isMonthDraft(locationId, year, month);
    const isPub = this.isMonthOfficiallyPublished(locationId, year, month);
    return isDraft && !isPub;
  }

  isPublishBannerVisible(locationId: LocationId, year: number, month: number): boolean {
    return Boolean(this.isManagerMode && this.hasUnpublishedDraftInView(locationId, year, month));
  }

  getHeaderBadgeState(locationId: LocationId, year: number, month: number): 'draft_unpublished' | 'draft_not_generated' | 'cassa_ok' | 'cassa_alert' {
    const hasUnpublished = this.hasUnpublishedDraftInView(locationId, year, month);
    if (hasUnpublished) return 'draft_unpublished';

    const hasAnyDraft = this.isMonthDraft(locationId, year, month);
    if (!hasAnyDraft) return 'draft_not_generated';

    return 'cassa_ok';
  }

  // ==========================================
  // --- REALTIME & CLOUD SYNC SIMULATION ---
  // ==========================================
  /**
   * Simulates incoming shift batch from Realtime.
   * On buggy pre-fix code: Realtime flush called syncPublishedMonthsFromCloud(monthKeys) which falsely published the draft!
   * On fixed code: Realtime flush does NOT call syncPublishedMonthsFromCloud.
   */
  simulateRealtimeShiftFlush(incomingShifts: Shift[], triggerBuggyAutoPublish: boolean = false): void {
    // Merge shifts
    const shiftMap = new Map(this.shifts.map((s) => [s.id, s]));
    for (const s of incomingShifts) {
      shiftMap.set(s.id, s);
    }
    this.shifts = Array.from(shiftMap.values());
    this.storage.setItem('nicora_v5_shifts', JSON.stringify(this.shifts));

    if (triggerBuggyAutoPublish) {
      // The pre-fix bug behavior:
      const monthKeys = new Set<string>();
      for (const s of incomingShifts) {
        const parts = s.date.split('-');
        if (parts.length >= 2) {
          monthKeys.add(`${s.locationId}_${parts[0]}-${parts[1]}`);
        }
      }
      syncPublishedMonthsFromCloud(monthKeys);
    }
  }

  /**
   * Simulates cross-device Realtime update of sys-app-config.
   */
  simulateRealtimeConfigUpdate(publishedMonths: string[]): void {
    const cloudSet = new Set(publishedMonths);
    // Authoritative sync: replace local map with true cloud set
    const pubMap: Record<string, boolean> = {};
    for (const key of cloudSet) {
      pubMap[key] = true;
    }
    this.storage.setItem('nicora_v2_published_months', JSON.stringify(pubMap));
  }

  // ==========================================
  // --- STAFF PRIVACY (F08, F19) ---
  // ==========================================
  getVisibleShifts(): Shift[] {
    if (this.isManagerMode) {
      return this.shifts;
    }
    // Filter strictly for published months
    return this.shifts.filter((s) => {
      const parts = s.date.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return isMonthPublished(s.locationId, y, m);
    });
  }

  getVisibleRequests(): ShiftRequest[] {
    if (this.isManagerMode) {
      return this.requests.filter((r) => r.locationId === this.activeLocation);
    }
    const currentId = this.session?.user.id;
    if (!currentId) return [];
    return this.requests.filter(
      (r) => r.requesterId === currentId || r.targetEmployeeId === currentId
    );
  }

  // ==========================================
  // --- MANUAL EDITS & DELTAS (F15) ---
  // ==========================================
  editShift(updatedShift: Shift): void {
    const idx = this.shifts.findIndex(
      (s) => s.id === updatedShift.id || (s.employeeId === updatedShift.employeeId && s.date === updatedShift.date)
    );
    if (idx >= 0) {
      this.shifts[idx] = { ...updatedShift, isManualOverride: true };
    } else {
      this.shifts.push({ ...updatedShift, isManualOverride: true });
    }
    this.storage.setItem('nicora_v5_shifts', JSON.stringify(this.shifts));
    this.cloud.upsertShifts([updatedShift]);
  }

  // ==========================================
  // --- SVUOTA TURNI (F17) ---
  // ==========================================
  clearShifts(scope: 'future' | 'month' | 'all', referenceDate: string, locationId: LocationId = this.activeLocation): void {
    if (scope === 'all') {
      this.shifts = this.shifts.filter((s) => s.locationId !== locationId);
      resetDraftGenerated(locationId);
    } else if (scope === 'month') {
      const [y, m] = referenceDate.split('-').map(Number);
      const prefix = `${y}-${String(m).padStart(2, '0')}`;
      this.shifts = this.shifts.filter((s) => !(s.locationId === locationId && s.date.startsWith(prefix)));
      resetDraftGenerated(locationId, y, m);
      recordMonthUnpublished(locationId, y, m);
    } else if (scope === 'future') {
      this.shifts = this.shifts.filter((s) => !(s.locationId === locationId && s.date >= referenceDate));
    }
    this.storage.setItem('nicora_v5_shifts', JSON.stringify(this.shifts));
  }

  // ==========================================
  // --- REQUESTS & TWO-STEP SWAPS (F18) ---
  // ==========================================
  submitRequest(req: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>): ShiftRequest {
    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullReq: ShiftRequest = {
      ...req,
      id,
      status: req.type === 'swap' ? 'pending_colleague' : 'pending',
      createdAt: new Date().toISOString(),
    };
    this.requests.push(fullReq);
    return fullReq;
  }

  peerAcceptSwap(requestId: string): boolean {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req || req.type !== 'swap' || req.status !== 'pending_colleague') {
      return false;
    }
    req.status = 'pending'; // Now moves to manager approval
    return true;
  }

  peerRejectSwap(requestId: string): boolean {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req || req.type !== 'swap') return false;
    req.status = 'rejected_colleague';
    return true;
  }

  managerApproveRequest(requestId: string): boolean {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = 'approved';

    // If it's a swap, perform the actual shift swap in this.shifts
    if (req.type === 'swap' && req.targetEmployeeId && req.shiftDate && req.targetShiftDate) {
      const reqShift = this.shifts.find((s) => s.employeeId === req.requesterId && s.date === req.shiftDate);
      const targetShift = this.shifts.find((s) => s.employeeId === req.targetEmployeeId && s.date === req.targetShiftDate);

      if (reqShift && targetShift) {
        const tempType = reqShift.type;
        const tempDept = reqShift.department;
        const tempStart = reqShift.startTime;
        const tempEnd = reqShift.endTime;

        reqShift.type = targetShift.type;
        reqShift.department = targetShift.department;
        reqShift.startTime = targetShift.startTime;
        reqShift.endTime = targetShift.endTime;
        reqShift.isManualOverride = true;

        targetShift.type = tempType;
        targetShift.department = tempDept;
        targetShift.startTime = tempStart;
        targetShift.endTime = tempEnd;
        targetShift.isManualOverride = true;
      }
    }
    return true;
  }

  managerRejectRequest(requestId: string): boolean {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req) return false;
    req.status = 'rejected';
    return true;
  }

  // ==========================================
  // --- EMERGENCY SUBSTITUTION WIZARD (F16) ---
  // ==========================================
  getEmergencySuggestions(shift: Shift, department: Department) {
    return findBestReplacements({
      targetShift: shift,
      targetDepartment: department,
      employees: this.employees,
      shifts: this.shifts,
    });
  }

  applyEmergencySubstitution(absentShift: Shift, substituteEmployeeId: string): void {
    const subEmp = this.employees.find((e) => e.id === substituteEmployeeId);
    if (!subEmp) return;

    // Mark original shift as malattia
    absentShift.type = 'malattia';
    absentShift.isManualOverride = true;

    // Assign substitute shift
    const existingSubShift = this.shifts.find((s) => s.employeeId === substituteEmployeeId && s.date === absentShift.date);
    if (existingSubShift) {
      existingSubShift.type = 'giornata';
      existingSubShift.department = absentShift.department;
      existingSubShift.isManualOverride = true;
    } else {
      this.shifts.push({
        id: `shift-${substituteEmployeeId}-${absentShift.date}`,
        employeeId: substituteEmployeeId,
        locationId: absentShift.locationId,
        date: absentShift.date,
        type: 'giornata',
        department: absentShift.department,
        startTime: absentShift.startTime || '08:30',
        endTime: absentShift.endTime || '19:30',
        isManualOverride: true,
      });
    }
  }

  // ==========================================
  // --- VIEW PROJECTIONS (F11, F12, F13, F20) ---
  // ==========================================
  getTodayPresence(dateStr: string, locationId: LocationId = this.activeLocation) {
    const visible = this.getVisibleShifts();
    const dayShifts = visible.filter((s) => s.locationId === locationId && s.date === dateStr);
    const storeEmployees = this.employees.filter((e) => e.locationId === locationId && e.isActive !== false && !e.isOwner);

    const mattina = dayShifts.filter((s) => s.type === 'mattina');
    const pomeriggio = dayShifts.filter((s) => s.type === 'pomeriggio');
    const giornata = dayShifts.filter((s) => s.type === 'giornata');
    const riposo = dayShifts.filter((s) => s.type === 'riposo');
    const ferie = dayShifts.filter((s) => s.type === 'ferie');
    const malattia = dayShifts.filter((s) => s.type === 'malattia');

    return {
      dateStr,
      totalStaff: storeEmployees.length,
      presentCount: mattina.length + pomeriggio.length + giornata.length,
      mattina,
      pomeriggio,
      giornata,
      riposo,
      ferie,
      malattia,
    };
  }

  getMySchedule(employeeId: string, year: number, month: number) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const visible = this.getVisibleShifts();
    const userShifts = visible.filter((s) => s.employeeId === employeeId && s.date.startsWith(prefix));

    const emp = this.employees.find((e) => e.id === employeeId);
    const locId = emp?.locationId || this.activeLocation;
    const isPub = isMonthPublished(locId, year, month);
    const isDraft = hasDraftGenerated(locId, year, month);

    return {
      shifts: userShifts,
      isMonthPublished: isPub,
      hasDraft: isDraft,
      isDraftUnpublishedNoticeVisible: isDraft && !isPub,
      userRequests: this.requests.filter((r) => r.requesterId === employeeId),
    };
  }

  getWeeklyHours(sundayDateStr: string, locationId: LocationId = this.activeLocation) {
    const weekDays = getWeekDays(sundayDateStr);
    const weekDates = new Set(weekDays.map((d) => d.dateStr));
    const storeEmployees = this.employees.filter(
      (e) => (e.locationId === locationId || e.isMobile) && e.isActive !== false && !e.isOwner
    );
    const weekShifts = this.shifts.filter((s) => s.locationId === locationId && weekDates.has(s.date));

    const result: Record<string, any> = {};
    for (const emp of storeEmployees) {
      result[emp.id] = calculateEmployeeWeeklyHours(emp, weekShifts);
    }
    return result;
  }

  exportMonthlyReport(summary: MonthlyStoreSummary, locationName: string): void {
    exportMonthlyReportCSV(summary, locationName);
  }
}
