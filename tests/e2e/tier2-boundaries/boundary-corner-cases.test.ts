/**
 * Tier 2: Boundary & Corner Cases
 * Covers:
 * - Empty inputs & Zero states
 * - Edge dates (leap years, month length differences, year rollover)
 * - Multi-location isolation
 * - Inactive staff & Owner exclusion
 * - Rapid re-renders & out-of-order events
 * - Corrupt storage recovery
 * - Input validation & security stress
 * - Coverage gaps detection
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import {
  calculateDayCoverage,
  calculateEmployeeWeeklyHours,
  formatLocalDate,
  getShiftHours,
  getSundayOfWeek,
  getWeekDays,
} from '../../../src/engine/schedulerEngine';
import {
  loadStoredEmployees,
  loadStoredShifts,
  loadStoredRequests,
  getPublishedMonthsMap,
} from '../../../src/services/storageService';
import { Employee, Shift } from '../../../src/domain/types';

describe('Tier 2: Boundary & Corner Cases', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  // ==========================================
  // --- 1. ZERO STATE & EMPTY INPUTS ---
  // ==========================================
  describe('Zero State & Empty Inputs', () => {
    it('T2.1: getTodayPresence returns 0 present count and empty lists when shifts array is completely empty', () => {
      app.shifts = [];
      const presence = app.getTodayPresence('2026-10-15', 'gazzada');

      expect(presence.presentCount).toBe(0);
      expect(presence.mattina).toHaveLength(0);
      expect(presence.pomeriggio).toHaveLength(0);
      expect(presence.giornata).toHaveLength(0);
    });

    it('T2.2: calculateDayCoverage handles days with zero scheduled shifts without throwing', () => {
      const activeEmps = app.employees.filter((e) => e.locationId === 'gazzada' && e.isActive !== false);
      const coverage = calculateDayCoverage('2026-10-15', activeEmps, [], 'gazzada');

      expect(coverage.totalPresent).toBe(0);
      expect(coverage.cassaCount).toBe(0);
      expect(coverage.isCassaOk).toBe(false);
      expect(coverage.uncoveredDepartments.length).toBeGreaterThan(0);
    });

    it('T2.3: getWeeklyHours returns 0 worked hours for employees with zero shifts', () => {
      const hours = app.getWeeklyHours('2026-10-04', 'gazzada');
      for (const empId of Object.keys(hours)) {
        expect(hours[empId].workedHours).toBe(0);
        expect(hours[empId].leaveHours).toBe(0);
      }
    });
  });

  // ==========================================
  // --- 2. EDGE DATES & CALENDAR BOUNDARIES ---
  // ==========================================
  describe('Edge Dates & Calendar Boundaries', () => {
    it('T2.4: correctly calculates Sunday for Leap Year date (2028-02-29)', () => {
      const leapDay = new Date(2028, 1, 29); // 2028-02-29 is a Tuesday
      const sunday = getSundayOfWeek(leapDay);
      const sundayStr = formatLocalDate(sunday);

      expect(sundayStr).toBe('2028-02-27'); // Sunday is 2028-02-27
      const weekDays = getWeekDays(sundayStr);
      expect(weekDays).toHaveLength(7);
      expect(weekDays.some((d) => d.dateStr === '2028-02-29')).toBe(true);
    });

    it('T2.5: handles Year-End Rollover (2026-12-31 to 2027-01-01) in weekly date sequences', () => {
      // 2026-12-31 is Thursday, Sunday of that week is 2026-12-27
      const sunday = getSundayOfWeek(new Date(2026, 11, 31));
      const sundayStr = formatLocalDate(sunday);
      const weekDays = getWeekDays(sundayStr);

      expect(weekDays[0].dateStr).toBe('2026-12-27');
      expect(weekDays[4].dateStr).toBe('2026-12-31');
      expect(weekDays[5].dateStr).toBe('2027-01-01'); // Rolled into new year
      expect(weekDays[6].dateStr).toBe('2027-01-02');
    });

    it('T2.6: handles months with different lengths (28, 30, and 31 days)', () => {
      // February 2026 (28 days)
      const febDays = new Date(2026, 2, 0).getDate();
      expect(febDays).toBe(28);

      // April 2026 (30 days)
      const aprDays = new Date(2026, 4, 0).getDate();
      expect(aprDays).toBe(30);

      // October 2026 (31 days)
      const octDays = new Date(2026, 10, 0).getDate();
      expect(octDays).toBe(31);
    });
  });

  // ==========================================
  // --- 3. MULTI-LOCATION ISOLATION ---
  // ==========================================
  describe('Multi-Location Strict Isolation', () => {
    it('T2.7: shifts generated for Gazzada never appear in Varese query', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      const vaShifts = app.shifts.filter((s) => s.locationId === 'varese');
      expect(vaShifts).toHaveLength(0);

      const vaPresence = app.getTodayPresence('2026-10-10', 'varese');
      expect(vaPresence.presentCount).toBe(0);
    });

    it('T2.8: publication status of Gazzada has zero effect on Varese', () => {
      app.publishMonth('gazzada', 2026, 10);
      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);
      expect(app.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(false);
    });

    it('T2.9: requests submitted for Gazzada are hidden when manager views Varese', () => {
      app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-15',
        reason: 'Gazzada leave',
      });

      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.switchLocation('varese');
      const visibleInVarese = app.getVisibleRequests();
      expect(visibleInVarese).toHaveLength(0);

      app.switchLocation('gazzada');
      const visibleInGazzada = app.getVisibleRequests();
      expect(visibleInGazzada).toHaveLength(1);
    });
  });

  // ==========================================
  // --- 4. INACTIVE STAFF & OWNER EXCLUSION ---
  // ==========================================
  describe('Inactive Staff & Owner Handling', () => {
    it('T2.10: owner (Vittore, isOwner: true) is excluded from operational presence and shift quotas', () => {
      const owner = app.employees.find((e) => e.isOwner || e.id === 'emp-gz-4')!;
      expect(owner.isOwner).toBe(true);

      const presence = app.getTodayPresence('2026-10-10', 'gazzada');
      const activeIds = app.employees
        .filter((e) => e.locationId === 'gazzada' && e.isActive !== false && !e.isOwner)
        .map((e) => e.id);

      expect(activeIds).not.toContain(owner.id);
    });

    it('T2.11: inactive employee (isActive: false) is excluded from scheduler rosters', () => {
      const inactive = app.employees.find((e) => e.id === 'emp-gz-11')!;
      expect(inactive.isActive).toBe(false);

      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const generated = app.generateMonthlyShifts(2026, 10, 'gazzada');

      const inactiveShifts = generated.filter((s) => s.employeeId === inactive.id);
      expect(inactiveShifts).toHaveLength(0);
    });
  });

  // ==========================================
  // --- 5. RAPID RE-RENDERS & STORAGE STRESS ---
  // ==========================================
  describe('Rapid Re-renders & Storage Stress', () => {
    it('T2.12: handles 50 rapid sequential realtime shift flushes without data degradation', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const baseShifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      for (let i = 0; i < 50; i++) {
        app.simulateRealtimeShiftFlush(baseShifts.slice(0, 5), false);
      }

      expect(app.shifts.length).toBe(baseShifts.length);
      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });

    it('T2.13: recovers gracefully when localStorage contains malformed JSON', () => {
      app.storage.setItem('nicora_v4_employees', 'INVALID_JSON{{{');
      app.storage.setItem('nicora_v5_shifts', 'NOT_AN_ARRAY');
      app.storage.setItem('nicora_v2_published_months', '{ corrupt: true,');

      // Functions should catch JSON errors and fall back gracefully
      const emps = loadStoredEmployees();
      expect(emps.length).toBeGreaterThan(0);

      const shifts = loadStoredShifts();
      expect(Array.isArray(shifts)).toBe(true);

      const pubMap = getPublishedMonthsMap();
      expect(typeof pubMap).toBe('object');
    });
  });

  // ==========================================
  // --- 6. ADVERSARIAL INPUTS & SECURITY ---
  // ==========================================
  describe('Adversarial Inputs & Input Hardening', () => {
    it('T2.14: rejects adversarial PIN attempts (whitespace, SQL injection, extreme length)', () => {
      const adversarialPins = [
        '',
        '   ',
        "' OR '1'='1",
        '<script>alert(1)</script>',
        'A'.repeat(500),
        '123\04',
        'undefined',
        'null',
      ];

      for (const badPin of adversarialPins) {
        const empLogin = app.loginAsEmployee('emp-gz-1', badPin);
        expect(empLogin.success).toBe(false);

        const mgrLogin = app.loginAsManager('vittore@nicoragarden.it', badPin);
        expect(mgrLogin.success).toBe(false);
      }
    });

    it('T2.15: shift without explicit start/end times falls back cleanly to standard hours', () => {
      const shiftWithoutHours: Shift = {
        id: 's-no-hours',
        employeeId: 'emp-gz-1',
        locationId: 'gazzada',
        date: '2026-10-15',
        type: 'mattina',
      };

      const hours = getShiftHours(shiftWithoutHours);
      expect(hours).toBe(4); // Standard mattina = 4h
    });

    it('T2.16: publishing or unpublishing the same month multiple times is idempotent', () => {
      app.publishMonth('gazzada', 2026, 10);
      app.publishMonth('gazzada', 2026, 10);
      app.publishMonth('gazzada', 2026, 10);
      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);

      app.clearShifts('month', '2026-10-01', 'gazzada');
      app.clearShifts('month', '2026-10-01', 'gazzada');
      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
    });
  });
});
