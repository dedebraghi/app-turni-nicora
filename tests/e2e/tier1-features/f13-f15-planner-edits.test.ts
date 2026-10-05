/**
 * Tier 1: Core Features F13, F14, F15 (Planner, Scheduler Engine, & Manual Edits)
 * Covers:
 * - F13: Planner Weekly/Monthly & Hours Calculation (contract quotas, deltas, week navigation)
 * - F14: Shift Generation Modal & Engine (monthly batch generation, constraints, mode)
 * - F15: Manual Shift Edits & Delta Saving (single shift modification, hours recalculation)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { getWeekDays, getShiftHours, getLeaveHours, calculateEmployeeWeeklyHours, getSundayOfWeek, formatLocalDate } from '../../../src/engine/schedulerEngine';
import { Shift, Employee } from '../../../src/domain/types';

describe('Tier 1: Features F13, F14, F15 (Planner, Generation Engine, & Edits)', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  // ==========================================
  // --- F13: PLANNER & HOURS CALCULATION (>= 5 TESTS) ---
  // ==========================================
  describe('F13: Planner Hours Calculation & Quotas', () => {
    const weekStartSunday = '2026-10-04';
    const weekDays = getWeekDays(weekStartSunday);

    it('F13.1: getWeekDays returns exactly 7 days starting Sunday and ending Saturday', () => {
      expect(weekDays.length).toBe(7);
      expect(weekDays[0].dayIndex).toBe(0); // Domenica
      expect(weekDays[0].dateStr).toBe('2026-10-04');
      expect(weekDays[6].dayIndex).toBe(6); // Sabato
      expect(weekDays[6].dateStr).toBe('2026-10-10');
    });

    it('F13.2: calculates shift duration correctly for standard shift types', () => {
      const morningShift: Shift = { id: 's1', employeeId: 'e1', locationId: 'gazzada', date: '2026-10-05', type: 'mattina', startTime: '08:30', endTime: '12:30' };
      const afternoonShift: Shift = { id: 's2', employeeId: 'e1', locationId: 'gazzada', date: '2026-10-05', type: 'pomeriggio', startTime: '14:30', endTime: '19:30' };
      const restShift: Shift = { id: 's3', employeeId: 'e1', locationId: 'gazzada', date: '2026-10-05', type: 'riposo' };

      expect(getShiftHours(morningShift)).toBe(4);
      expect(getShiftHours(afternoonShift)).toBe(5);
      expect(getShiftHours(restShift)).toBe(0);
    });

    it('F13.3: accurately sums weekly hours against a 40h contract for 5 workdays', () => {
      const emp: Employee = {
        id: 'emp-test-40',
        name: 'Test 40h',
        locationId: 'gazzada',
        role: 'Cassa',
        skills: { Cassa: 10 },
        avatar: 'TT',
        email: 'test@nicoragarden.it',
        contractHours: 40,
      };

      // 4 days of giornata (8h each) + 1 day of giornata (8h) = 40h
      const shifts: Shift[] = [
        { id: '1', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-04', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '2', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-05', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '3', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-06', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '4', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-07', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '5', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-08', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '6', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-09', type: 'riposo' },
        { id: '7', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-10', type: 'riposo' },
      ];

      const res = calculateEmployeeWeeklyHours(emp, shifts);
      expect(res.workedHours).toBe(40);
      expect(res.contractHours).toBe(40);
      expect(res.deltaHours).toBe(0);
      expect(res.isContractFulfilled).toBe(true);
      expect(res.workedDaysCount).toBe(5);
    });

    it('F13.4: recognizes part-time contract (24h) and calculates positive delta on overtime', () => {
      const empPt: Employee = {
        id: 'emp-pt-24',
        name: 'Part Time',
        locationId: 'gazzada',
        role: 'Fioreria',
        skills: { Fioreria: 10 },
        avatar: 'PT',
        email: 'pt@nicoragarden.it',
        contractHours: 24,
      };

      // Worked 3 days of 9h = 27h -> +3h delta
      const shifts: Shift[] = [
        { id: '1', employeeId: empPt.id, locationId: 'gazzada', date: '2026-10-05', type: 'pomeriggio', startTime: '10:00', endTime: '19:00' }, // 9h
        { id: '2', employeeId: empPt.id, locationId: 'gazzada', date: '2026-10-06', type: 'pomeriggio', startTime: '10:00', endTime: '19:00' }, // 9h
        { id: '3', employeeId: empPt.id, locationId: 'gazzada', date: '2026-10-07', type: 'pomeriggio', startTime: '10:00', endTime: '19:00' }, // 9h
      ];

      const res = calculateEmployeeWeeklyHours(empPt, shifts);
      expect(res.workedHours).toBe(27);
      expect(res.contractHours).toBe(24);
      expect(res.deltaHours).toBe(3);
      expect(res.isContractFulfilled).toBe(false); // Overtime +3h is a deviation from exact contract target
    });

    it('F13.5: counts leave hours (ferie) towards total accounted hours', () => {
      const emp: Employee = {
        id: 'emp-ferie',
        name: 'Ferie Staff',
        locationId: 'gazzada',
        role: 'Cassa',
        skills: { Cassa: 10 },
        avatar: 'FS',
        email: 'fs@nicoragarden.it',
        contractHours: 40,
      };

      // 4 days of work (32h) + 1 day of ferie (8h)
      const shifts: Shift[] = [
        { id: '1', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-05', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '2', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-06', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '3', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-07', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '4', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-08', type: 'giornata', startTime: '08:30', endTime: '17:30' },
        { id: '5', employeeId: emp.id, locationId: 'gazzada', date: '2026-10-09', type: 'ferie' },
      ];

      const res = calculateEmployeeWeeklyHours(emp, shifts);
      expect(res.workedHours).toBe(32);
      expect(res.leaveHours).toBe(8);
      expect(res.totalAccountedHours).toBe(40);
      expect(res.isContractFulfilled).toBe(true);
    });
  });

  // ==========================================
  // --- F14: SHIFT GENERATION ENGINE (>= 5 TESTS) ---
  // ==========================================
  describe('F14: Shift Generation Modal & Engine', () => {
    it('F14.1: generates shifts covering every day of the month for all active staff', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      expect(shifts.length).toBeGreaterThan(150);

      // Verify all dates in October 2026 exist
      for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
        const hasDay = shifts.some((s) => s.date === dateStr);
        expect(hasDay).toBe(true);
      }
    });

    it('F14.2: guarantees daily Cassa coverage on every day of the generated month', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
        const cassaStaff = shifts.filter(
          (s) => s.date === dateStr && s.department === 'Cassa' && s.type !== 'riposo' && s.type !== 'ferie'
        );
        expect(cassaStaff.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('F14.3: respects employee skills matrix and assigns relevant departments', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      // Sabrina (emp-gz-1) has Cassa = 10, Fioreria = 7
      const sabrinaShifts = shifts.filter((s) => s.employeeId === 'emp-gz-1' && s.type !== 'riposo');
      const sabrinaDepts = new Set(sabrinaShifts.map((s) => s.department));

      expect(sabrinaDepts.has('Cassa') || sabrinaDepts.has('Fioreria')).toBe(true);
    });

    it('F14.4: generation establishes draft status and leaves month unpublished', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      expect(app.isMonthDraft('gazzada', 2026, 10)).toBe(true);
      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });

    it('F14.5: supports "continuato" seasonal schedule mode', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 11, 'gazzada', 'continuato');

      expect(shifts.length).toBeGreaterThan(0);
      // Continuous shifts have defined staggered hours
      const hasDefinedHours = shifts.some((s) => s.startTime && s.endTime);
      expect(hasDefinedHours).toBe(true);
    });
  });

  // ==========================================
  // --- F15: MANUAL SHIFT EDITS & DELTAS (>= 5 TESTS) ---
  // ==========================================
  describe('F15: Manual Shift Edits & Delta Saving', () => {
    let baseShift: Shift;

    beforeEach(() => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      baseShift = shifts.find((s) => s.type !== 'riposo' && (s.startTime || s.type === 'mattina' || s.type === 'pomeriggio' || s.type === 'giornata')) || shifts[0];
    });

    it('F15.1: modifying a shift sets isManualOverride to true', () => {
      const updated: Shift = { ...baseShift, type: 'giornata', startTime: '08:30', endTime: '19:30' };
      app.editShift(updated);

      const modified = app.shifts.find((s) => s.id === baseShift.id);
      expect(modified?.isManualOverride).toBe(true);
      expect(modified?.type).toBe('giornata');
    });

    it('F15.2: modifying shift immediately updates weekly hours calculation', () => {
      const parts = baseShift.date.split('-');
      const shiftDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const targetSunday = getSundayOfWeek(shiftDateObj);
      const weekStartSunday = formatLocalDate(targetSunday);

      const initialHours = app.getWeeklyHours(weekStartSunday, 'gazzada');
      const empId = baseShift.employeeId;
      const initialWorked = initialHours[empId]?.workedHours || 0;

      // Change shift to rest (0 hours)
      app.editShift({ ...baseShift, type: 'riposo', startTime: undefined, endTime: undefined });

      const updatedHours = app.getWeeklyHours(weekStartSunday, 'gazzada');
      const updatedWorked = updatedHours[empId]?.workedHours || 0;

      expect(updatedWorked).toBeLessThan(initialWorked);
    });

    it('F15.3: single cell edit saves only targeted shift without mutating other shifts', () => {
      const shift2 = app.shifts[1];
      const origShift2Type = shift2.type;

      app.editShift({ ...baseShift, type: 'ferie' });

      const currentShift2 = app.shifts.find((s) => s.id === shift2.id);
      expect(currentShift2?.type).toBe(origShift2Type);
    });

    it('F15.4: updating shift department updates department presence summary', () => {
      const updated: Shift = { ...baseShift, type: 'mattina', department: 'Serra Fredda' };
      app.editShift(updated);

      const dayPresence = app.getTodayPresence(baseShift.date, 'gazzada');
      const serraShift = dayPresence.mattina.find((s) => s.id === baseShift.id);
      expect(serraShift?.department).toBe('Serra Fredda');
    });

    it('F15.5: edit persists to mock Supabase backend table', () => {
      const updated: Shift = { ...baseShift, areaNote: 'Scarico piante mattutino' };
      app.editShift(updated);

      const cloudShift = app.cloud.shifts.get(baseShift.id);
      expect(cloudShift?.areaNote).toBe('Scarico piante mattutino');
    });
  });
});
