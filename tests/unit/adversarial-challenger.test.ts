/**
 * Adversarial Challenger Stress Harness (Milestone M3 Verification)
 * 
 * Objective:
 * 1. Adversarially challenge draft generation, unpublishing, and publication determinism under consecutive cycles.
 * 2. Adversarially challenge staff privacy isolation across roles, employee IDs, and location switching.
 * 3. Stress-test the scheduler engine and hours calculation against complex constraints & pathological inputs.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setupBrowserEnv } from '../harness/browser-env';
import { AppHarness } from '../harness/app-harness';
import {
  generateMonthlySchedule,
  generateWeeklySchedule,
  calculateEmployeeWeeklyHours,
  getShiftHours,
  getLeaveHours,
  getWeekDays,
  getSundayOfWeek,
  formatLocalDate,
} from '../../src/engine/schedulerEngine';
import {
  isMonthPublished,
  recordMonthPublished,
  recordMonthUnpublished,
  recordDraftGenerated,
  resetDraftGenerated,
  hasDraftGenerated,
  syncPublishedMonthsFromCloud,
  getPublishedMonthsMap,
} from '../../src/services/storageService';
import { INITIAL_EMPLOYEES } from '../../src/domain/mockData';
import { Employee, Shift, ShiftRequest } from '../../src/domain/types';

// Setup headless browser environment before any test executes
setupBrowserEnv();

describe('Adversarial Challenger Suite: Robustness & Security Oracles', () => {
  let harness: AppHarness;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    harness = new AppHarness();
  });

  // =========================================================================
  // DIMENSION 1: DRAFT / PUBLISH / UNPUBLISH DETERMINISM UNDER CONSECUTIVE OPERATIONS
  // =========================================================================
  describe('Dimension 1: Draft & Publication Lifecycle Determinism', () => {
    test('1.1: 10 consecutive generate -> publish -> unpublish -> clear cycles remain 100% deterministic', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      const loc = 'gazzada';
      const year = 2026;
      const month = 10;

      for (let cycle = 1; cycle <= 10; cycle++) {
        // Step A: Generate draft
        harness.generateMonthlyShifts(year, month, loc);
        expect(harness.isMonthDraft(loc, year, month), `Cycle ${cycle}: Must be draft`).toBe(true);
        expect(harness.isMonthOfficiallyPublished(loc, year, month), `Cycle ${cycle}: Must NOT be published`).toBe(false);
        expect(harness.hasUnpublishedDraftInView(loc, year, month), `Cycle ${cycle}: Unpublished draft in view`).toBe(true);
        expect(harness.isPublishBannerVisible(loc, year, month), `Cycle ${cycle}: Banner must be visible`).toBe(true);
        expect(harness.getHeaderBadgeState(loc, year, month)).toBe('draft_unpublished');

        // Step B: Publish
        harness.publishMonth(loc, year, month);
        expect(harness.isMonthOfficiallyPublished(loc, year, month), `Cycle ${cycle}: Must be published`).toBe(true);
        expect(harness.hasUnpublishedDraftInView(loc, year, month), `Cycle ${cycle}: No unpublished draft`).toBe(false);
        expect(harness.isPublishBannerVisible(loc, year, month), `Cycle ${cycle}: Banner must be hidden`).toBe(false);
        expect(harness.getHeaderBadgeState(loc, year, month)).toBe('cassa_ok');

        // Step C: Unpublish
        recordMonthUnpublished(loc, year, month);
        expect(harness.isMonthOfficiallyPublished(loc, year, month), `Cycle ${cycle}: Must be unpublished`).toBe(false);
        expect(harness.hasUnpublishedDraftInView(loc, year, month), `Cycle ${cycle}: Unpublished draft again`).toBe(true);
        expect(harness.isPublishBannerVisible(loc, year, month), `Cycle ${cycle}: Banner visible again`).toBe(true);

        // Step D: Clear month (Svuota Turni)
        harness.clearShifts('month', `${year}-${month.toString().padStart(2, '0')}-01`, loc);
        expect(harness.isMonthDraft(loc, year, month), `Cycle ${cycle}: Draft flag cleared`).toBe(false);
        expect(harness.isMonthOfficiallyPublished(loc, year, month), `Cycle ${cycle}: Cleared month not published`).toBe(false);
        expect(harness.getHeaderBadgeState(loc, year, month)).toBe('draft_not_generated');
      }
    });

    test('1.2: Multi-month and multi-location interleaved operations never cross-contaminate publication state', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');

      // Generate 4 combinations: (Gazzada, Varese) x (2026-10, 2026-11)
      harness.generateMonthlyShifts(2026, 10, 'gazzada');
      harness.generateMonthlyShifts(2026, 10, 'varese');
      harness.generateMonthlyShifts(2026, 11, 'gazzada');
      harness.generateMonthlyShifts(2026, 11, 'varese');

      // Verify all 4 start as draft & unpublished
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(harness.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(false);
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 11)).toBe(false);
      expect(harness.isMonthOfficiallyPublished('varese', 2026, 11)).toBe(false);

      // Publish ONLY Gazzada 2026-10
      harness.publishMonth('gazzada', 2026, 10);

      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);
      expect(harness.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(false);
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 11)).toBe(false);
      expect(harness.isMonthOfficiallyPublished('varese', 2026, 11)).toBe(false);

      // Publish Varese 2026-11
      harness.publishMonth('varese', 2026, 11);

      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);
      expect(harness.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(false);
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 11)).toBe(false);
      expect(harness.isMonthOfficiallyPublished('varese', 2026, 11)).toBe(true);

      // Unpublish Gazzada 2026-10
      recordMonthUnpublished('gazzada', 2026, 10);
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(harness.isMonthOfficiallyPublished('varese', 2026, 11)).toBe(true);
    }, 30000);

    test('1.3: Realtime echo burst does NOT prematurely publish draft shifts', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      const shifts = harness.generateMonthlyShifts(2026, 10, 'gazzada');

      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);

      // Simulate 50 rapid sequential incoming Realtime shift echoes
      for (let i = 0; i < 50; i++) {
        const sample = shifts.slice(i * 2, i * 2 + 5);
        harness.simulateRealtimeShiftFlush(sample, false);
      }

      // Must strictly remain unpublished draft
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(harness.hasUnpublishedDraftInView('gazzada', 2026, 10)).toBe(true);
      expect(harness.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });

    test('1.4: Authoritative cloud sync accurately reflects empty, partial, and full cloud sets', () => {
      // Setup initial local map with multiple entries
      recordMonthPublished('gazzada', 2026, 10);
      recordMonthPublished('varese', 2026, 10);
      recordMonthPublished('gazzada', 2026, 11);

      expect(isMonthPublished('gazzada', 2026, 10)).toBe(true);
      expect(isMonthPublished('varese', 2026, 10)).toBe(true);
      expect(isMonthPublished('gazzada', 2026, 11)).toBe(true);

      // Cloud says ONLY 'varese_2026-10' is published
      syncPublishedMonthsFromCloud(new Set(['varese_2026-10']));

      expect(isMonthPublished('gazzada', 2026, 10)).toBe(false);
      expect(isMonthPublished('varese', 2026, 10)).toBe(true);
      expect(isMonthPublished('gazzada', 2026, 11)).toBe(false);

      // Cloud says nothing is published
      syncPublishedMonthsFromCloud(new Set());

      expect(isMonthPublished('gazzada', 2026, 10)).toBe(false);
      expect(isMonthPublished('varese', 2026, 10)).toBe(false);
      expect(isMonthPublished('gazzada', 2026, 11)).toBe(false);
    });
  });

  // =========================================================================
  // DIMENSION 2: STAFF PRIVACY ISOLATION UNDER VARIED ROLES & LOCATIONS
  // =========================================================================
  describe('Dimension 2: Staff Privacy & Role Isolation Boundaries', () => {
    test('2.1: Regular employee cannot see unpublished draft shifts across any location', () => {
      // Manager generates drafts for both Gazzada and Varese
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      const gzShifts = harness.generateMonthlyShifts(2026, 10, 'gazzada');
      const vaShifts = harness.generateMonthlyShifts(2026, 10, 'varese');
      expect(gzShifts.length).toBeGreaterThan(0);
      expect(vaShifts.length).toBeGreaterThan(0);

      // Regular Gazzada employee logs in
      harness.loginAsEmployee('emp-gz-1', '1234');
      harness.switchLocation('gazzada');

      const visibleGz = harness.getVisibleShifts();
      const octShiftsGz = visibleGz.filter((s) => s.date.startsWith('2026-10'));
      expect(octShiftsGz.length).toBe(0);

      // Regular employee switches location to Varese
      harness.switchLocation('varese');
      const visibleVa = harness.getVisibleShifts();
      const octShiftsVa = visibleVa.filter((s) => s.date.startsWith('2026-10'));
      expect(octShiftsVa.length).toBe(0);
    }, 25000);

    test('2.2: Mobile employee sees published shifts in one store but NOT drafts in the other', () => {
      // Manager generates drafts for both
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      harness.generateMonthlyShifts(2026, 10, 'gazzada');
      harness.generateMonthlyShifts(2026, 10, 'varese');

      // Publish ONLY Gazzada
      harness.publishMonth('gazzada', 2026, 10);

      // Identify or configure a mobile employee
      const mobileEmp = harness.employees.find((e) => e.isMobile) || {
        ...harness.employees[0],
        id: 'emp-mobile-test',
        isMobile: true,
        password: '1234',
        isManager: false,
        isOwner: false,
      };
      if (!harness.employees.some((e) => e.id === mobileEmp.id)) {
        harness.employees.push(mobileEmp);
      }

      harness.loginAsEmployee(mobileEmp.id, '1234');

      // Query visible shifts: Gazzada shifts visible, Varese shifts HIDDEN
      const visible = harness.getVisibleShifts();
      const gzVisible = visible.filter((s) => s.locationId === 'gazzada' && s.date.startsWith('2026-10'));
      const vaVisible = visible.filter((s) => s.locationId === 'varese' && s.date.startsWith('2026-10'));

      expect(gzVisible.length).toBeGreaterThan(0);
      expect(vaVisible.length).toBe(0);
    }, 25000);

    test('2.3: Immediate privacy restoration on manager logout / demotion', () => {
      harness.generateMonthlyShifts(2026, 10, 'gazzada');

      // 1. Employee login -> 0 drafts visible
      harness.loginAsEmployee('emp-gz-1', '1234');
      expect(harness.getVisibleShifts().filter((s) => s.date.startsWith('2026-10')).length).toBe(0);

      // 2. Elevate to manager -> drafts visible
      const elevated = harness.unlockManagerWithPin('NicoraMaster2026!');
      expect(elevated).toBe(true);
      expect(harness.isManagerMode).toBe(true);
      expect(harness.getVisibleShifts().filter((s) => s.date.startsWith('2026-10')).length).toBeGreaterThan(0);

      // 3. Logout -> session cleared, manager mode false
      harness.logout();
      expect(harness.isManagerMode).toBe(false);

      // 4. Log back in as employee -> drafts immediately hidden
      harness.loginAsEmployee('emp-gz-1', '1234');
      expect(harness.getVisibleShifts().filter((s) => s.date.startsWith('2026-10')).length).toBe(0);
    });

    test('2.4: Shift requests privacy isolation between employees', () => {
      // Employee 1 submits a leave request with private note
      harness.loginAsEmployee('emp-gz-1', '1234');
      const req1 = harness.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-15',
        reason: 'Visita medica specialistica strettamente riservata',
      });

      // Employee 1 submits a shift swap targeting Employee 2
      const swapReq = harness.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'swap',
        shiftDate: '2026-10-16',
        targetEmployeeId: 'emp-gz-2',
        targetShiftDate: '2026-10-17',
        reason: 'Scambio turno concordato',
      });

      // Check Employee 1's visible requests
      const emp1Requests = harness.getVisibleRequests();
      expect(emp1Requests.some((r) => r.id === req1.id)).toBe(true);
      expect(emp1Requests.some((r) => r.id === swapReq.id)).toBe(true);

      // Check Employee 2 (the swap target)
      harness.loginAsEmployee('emp-gz-2', '1234');
      const emp2Requests = harness.getVisibleRequests();
      // Employee 2 must see swapReq (they are the target)
      expect(emp2Requests.some((r) => r.id === swapReq.id)).toBe(true);
      // Employee 2 must NOT see Employee 1's private medical leave request!
      expect(emp2Requests.some((r) => r.id === req1.id)).toBe(false);

      // Check Employee 3 (unrelated colleague)
      harness.loginAsEmployee('emp-gz-3', '1234');
      const emp3Requests = harness.getVisibleRequests();
      // Employee 3 must NOT see req1 or swapReq
      expect(emp3Requests.some((r) => r.id === req1.id)).toBe(false);
      expect(emp3Requests.some((r) => r.id === swapReq.id)).toBe(false);

      // Check Manager
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      const mgrRequests = harness.getVisibleRequests();
      expect(mgrRequests.some((r) => r.id === req1.id)).toBe(true);
      expect(mgrRequests.some((r) => r.id === swapReq.id)).toBe(true);
    });
  });

  // =========================================================================
  // DIMENSION 3: SCHEDULER ENGINE & HOURS CALCULATION STRESS & BOUNDARY ORACLES
  // =========================================================================
  describe('Dimension 3: Scheduler Engine Robustness & Hours Oracles', () => {
    test('3.1: Pathological input - 0 available employees returns clean empty structure without crash', () => {
      const result = generateWeeklySchedule({
        locationId: 'gazzada',
        employees: [],
        weekStartDate: '2026-10-04',
      });

      expect(result.shifts).toEqual([]);
      expect(result.stats.totalShifts).toBe(0);
      expect(result.stats.staffCount).toBe(0);
      expect(result.stats.cassaCoverageScore).toBe(0);
      expect(result.stats.warnings).toContain('Nessun dipendente trovato per la sede selezionata.');
    });

    test('3.2: Highly constrained input - 1 employee only schedules within limits without crashing', () => {
      const singleEmp: Employee = {
        id: 'emp-solo',
        name: 'Solo Worker',
        locationId: 'gazzada',
        role: 'Cassa',
        skills: { Cassa: 10 },
        contractHours: 40,
        isActive: true,
      };

      const result = generateWeeklySchedule({
        locationId: 'gazzada',
        employees: [singleEmp],
        weekStartDate: '2026-10-04',
        todayDate: '2026-10-04',
      });

      expect(result.stats.staffCount).toBe(1);
      expect(result.shifts.every((s) => s.employeeId === 'emp-solo')).toBe(true);
      expect(result.shifts).toHaveLength(7);

      const workShifts = result.shifts.filter((s) => s.type !== 'riposo');
      const restShifts = result.shifts.filter((s) => s.type === 'riposo');

      // Rule: At most 5 work days per week
      expect(workShifts.length).toBeLessThanOrEqual(5);
      // Rule: At least 2 rest days per week
      expect(restShifts.length).toBeGreaterThanOrEqual(2);
    });

    test('3.3: Leap year handling (February 2028: 29 days)', () => {
      const res = generateMonthlySchedule({
        locationId: 'gazzada',
        year: 2028,
        month: 2,
        employees: INITIAL_EMPLOYEES,
      });

      expect(res.shifts.length).toBeGreaterThan(0);
      const feb29Shifts = res.shifts.filter((s) => s.date === '2028-02-29');
      expect(feb29Shifts.length).toBeGreaterThan(0);

      // Verify no invalid dates like 2028-02-30 exist
      const feb30Shifts = res.shifts.filter((s) => s.date === '2028-02-30');
      expect(feb30Shifts.length).toBe(0);
    });

    test('3.4: Year rollover boundary week (2026-12-27 to 2027-01-02)', () => {
      const weekDays = getWeekDays('2026-12-27');
      expect(weekDays).toHaveLength(7);
      expect(weekDays[0].dateStr).toBe('2026-12-27');
      expect(weekDays[5].dateStr).toBe('2027-01-01');
      expect(weekDays[6].dateStr).toBe('2027-01-02');

      const result = generateWeeklySchedule({
        locationId: 'gazzada',
        employees: INITIAL_EMPLOYEES,
        weekStartDate: '2026-12-27',
      });

      expect(result.shifts.length).toBeGreaterThan(0);
      const newYearShifts = result.shifts.filter((s) => s.date === '2027-01-01');
      expect(newYearShifts.length).toBeGreaterThan(0);
    });

    test('3.5: Hours Calculation Invariant Oracle: Worked + Leave = Total Accounted Hours', () => {
      const testEmployees: Employee[] = [
        { id: 'e1', name: 'Full-time 40h', locationId: 'gazzada', role: 'Cassa', contractHours: 40, isActive: true },
        { id: 'e2', name: 'Part-time 30h', locationId: 'gazzada', role: 'Fioreria', contractHours: 30, isActive: true },
        { id: 'e3', name: 'Part-time 24h', locationId: 'gazzada', role: 'Decor', contractHours: 24, isActive: true },
        { id: 'e4', name: 'Part-time 20h', locationId: 'gazzada', role: 'Serra Calda', contractHours: 20, isActive: true },
      ];

      testEmployees.forEach((emp) => {
        // Test combinations of shifts: 3 work days, 1 ferie, 1 malattia, 2 riposo
        const sampleShifts: Shift[] = [
          { id: 's1', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-05', type: 'giornata', startTime: '08:30', endTime: '19:30' },
          { id: 's2', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-06', type: 'mattina', startTime: '08:30', endTime: '12:30' },
          { id: 's3', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-07', type: 'pomeriggio', startTime: '14:30', endTime: '19:30' },
          { id: 's4', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-08', type: 'ferie' },
          { id: 's5', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-09', type: 'malattia' },
          { id: 's6', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-10', type: 'riposo' },
          { id: 's7', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-11', type: 'riposo' },
        ];

        const summary = calculateEmployeeWeeklyHours(emp, sampleShifts, 'standard');

        // Oracle 1: Total accounted equals worked + leave
        expect(summary.totalAccountedHours).toBeCloseTo(summary.workedHours + summary.leaveHours, 1);

        // Oracle 2: Delta equals totalAccounted - contractHours
        expect(summary.deltaHours).toBeCloseTo(summary.totalAccountedHours - emp.contractHours, 1);

        // Oracle 3: Leave hours for 1 day ferie + 1 day malattia equals 2 * (contractHours / 5)
        const expectedLeave = (emp.contractHours / 5) * 2;
        expect(summary.leaveHours).toBeCloseTo(expectedLeave, 1);

        // Oracle 4: Worked days count strictly counts working shifts (3 in this sample)
        expect(summary.workedDaysCount).toBe(3);
      });
    });

    test('3.6: getShiftHours handles normal, split, zero-length, and custom hours cleanly', () => {
      // Standard giornata
      expect(getShiftHours({ id: '1', employeeId: 'e', locationId: 'gazzada', date: '2026-10-01', type: 'giornata', startTime: '08:30', endTime: '19:30' }, 'standard')).toBe(8);

      // Continuato giornata
      expect(getShiftHours({ id: '2', employeeId: 'e', locationId: 'gazzada', date: '2026-10-01', type: 'giornata', startTime: '09:00', endTime: '17:30' }, 'continuato')).toBe(8);

      // Custom hours (e.g. 10:00 to 16:00 = 6 hours)
      expect(getShiftHours({ id: '3', employeeId: 'e', locationId: 'gazzada', date: '2026-10-01', type: 'giornata', startTime: '10:00', endTime: '16:00', isCustomHours: true }, 'standard')).toBe(6);

      // Mattina default
      expect(getShiftHours({ id: '4', employeeId: 'e', locationId: 'gazzada', date: '2026-10-01', type: 'mattina' })).toBe(4);

      // Riposo, ferie, malattia are 0 worked hours
      expect(getShiftHours({ id: '5', employeeId: 'e', locationId: 'gazzada', date: '2026-10-01', type: 'riposo' })).toBe(0);
      expect(getShiftHours({ id: '6', employeeId: 'e', locationId: 'gazzada', date: '2026-10-01', type: 'ferie' })).toBe(0);
      expect(getShiftHours({ id: '7', employeeId: 'e', locationId: 'gazzada', date: '2026-10-01', type: 'malattia' })).toBe(0);
    });
  });
});
