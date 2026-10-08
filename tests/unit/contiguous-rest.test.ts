import { describe, expect, test } from 'vitest';
import { INITIAL_EMPLOYEES } from '../../src/domain/mockData';
import {
  generateMonthlySchedule,
  generateWeeklySchedule,
  hasContiguousRestInMonth,
} from '../../src/engine/schedulerEngine';
import { Employee, Shift } from '../../src/domain/types';

describe('Regola Vittore Nicora: Riposi Disaccoppiati con 2 Giorni Contigui al Mese', () => {
  const gazzadaStaff = INITIAL_EMPLOYEES.filter((e) => e.locationId === 'gazzada' && e.isActive && !e.isOwner);
  const vareseStaff = INITIAL_EMPLOYEES.filter((e) => e.locationId === 'varese' && e.isActive && !e.isOwner);

  test('hasContiguousRestInMonth: rileva correttamente 2 giorni consecutivi di riposo', () => {
    const empId = 'emp-gz-1';
    const shiftsWithContiguous: Shift[] = [
      { id: 's1', employeeId: empId, locationId: 'gazzada', date: '2026-11-10', type: 'riposo' },
      { id: 's2', employeeId: empId, locationId: 'gazzada', date: '2026-11-11', type: 'riposo' },
      { id: 's3', employeeId: empId, locationId: 'gazzada', date: '2026-11-17', type: 'riposo' },
    ];

    expect(hasContiguousRestInMonth(empId, '2026-11', shiftsWithContiguous)).toBe(true);

    const shiftsDecoupled: Shift[] = [
      { id: 's1', employeeId: empId, locationId: 'gazzada', date: '2026-11-10', type: 'riposo' },
      { id: 's2', employeeId: empId, locationId: 'gazzada', date: '2026-11-13', type: 'riposo' },
      { id: 's3', employeeId: empId, locationId: 'gazzada', date: '2026-11-17', type: 'riposo' },
      { id: 's4', employeeId: empId, locationId: 'gazzada', date: '2026-11-20', type: 'riposo' },
    ];

    expect(hasContiguousRestInMonth(empId, '2026-11', shiftsDecoupled)).toBe(false);
  });

  test('generateWeeklySchedule rispetta preferContiguousRestEmployeeIds', () => {
    const targetEmp = gazzadaStaff[0];
    const otherEmp = gazzadaStaff[1];

    const result = generateWeeklySchedule({
      locationId: 'gazzada',
      employees: INITIAL_EMPLOYEES,
      weekStartDate: '2026-11-01', // Domenica 1 Novembre 2026
      preferContiguousRestEmployeeIds: [targetEmp.id],
      todayDate: '2026-11-01',
    });

    const targetShifts = result.shifts.filter((s) => s.employeeId === targetEmp.id && s.type === 'riposo');
    const otherShifts = result.shifts.filter((s) => s.employeeId === otherEmp.id && s.type === 'riposo');

    expect(targetShifts.length).toBe(2);
    expect(otherShifts.length).toBe(2);

    // Per targetEmp: i due riposi devono essere contigui (differenza di 1 giorno)
    const targetDates = targetShifts.map((s) => new Date(s.date).getTime()).sort();
    const targetDiffDays = Math.round((targetDates[1] - targetDates[0]) / (1000 * 60 * 60 * 24));
    expect(targetDiffDays).toBe(1);

    // Per otherEmp: i due riposi devono essere disaccoppiati (differenza > 1 giorno)
    const otherDates = otherShifts.map((s) => new Date(s.date).getTime()).sort();
    const otherDiffDays = Math.round((otherDates[1] - otherDates[0]) / (1000 * 60 * 60 * 24));
    expect(otherDiffDays).toBeGreaterThan(1);
  });

  test('generateMonthlySchedule (Gazzada): tutti i collaboratori ottengono 2 giorni contigui nel mese', () => {
    const result = generateMonthlySchedule({
      locationId: 'gazzada',
      year: 2026,
      month: 11, // Novembre 2026 (30 giorni, 5 domeniche)
      employees: INITIAL_EMPLOYEES,
      todayDate: '2026-11-01',
    });

    expect(result.shifts.length).toBeGreaterThan(0);
    expect(result.stats.staffCount).toBe(gazzadaStaff.length);

    // Verifica per ciascun dipendente di Gazzada
    gazzadaStaff.forEach((emp) => {
      const satisfied = hasContiguousRestInMonth(emp.id, '2026-11', result.shifts);
      expect(satisfied).toBe(true);

      // Statistiche restituite
      expect(result.stats.monthlyContiguousRestSatisfied?.[emp.id]).toBe(true);
    });

    // Reparti presidiati
    expect(result.stats.allDepartmentsCovered).toBe(true);
    expect(result.stats.cassaCoverageScore).toBeGreaterThanOrEqual(95);
  });

  test('generateMonthlySchedule (Varese): tutti i collaboratori ottengono 2 giorni contigui nel mese mantenendo presidi completi', () => {
    const result = generateMonthlySchedule({
      locationId: 'varese',
      year: 2026,
      month: 11, // Novembre 2026
      employees: INITIAL_EMPLOYEES,
      todayDate: '2026-11-01',
      isChristmasSeason: true,
    });

    expect(result.shifts.length).toBeGreaterThan(0);
    expect(result.stats.staffCount).toBe(vareseStaff.length);

    vareseStaff.forEach((emp) => {
      const satisfied = hasContiguousRestInMonth(emp.id, '2026-11', result.shifts);
      expect(satisfied).toBe(true);
      expect(result.stats.monthlyContiguousRestSatisfied?.[emp.id]).toBe(true);
    });

    expect(result.stats.allDepartmentsCovered).toBe(true);
    expect(result.stats.cassaCoverageScore).toBeGreaterThanOrEqual(95);
  });
});
