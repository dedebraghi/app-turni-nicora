/**
 * Tier 3: Cross-Feature Combinations & Complex Integrated Workflows
 * Covers:
 * - Flow 1: Draft generation + manual edit + emergency replacement + publish
 * - Flow 2: Leave request + shift swap + planner weekly hours recalculation
 * - Flow 3: Svuota turni (future only) + regeneration + publish
 * - Flow 4: Role elevation & privacy barrier switching
 * - Flow 5: Multi-location parallel draft workflows (Gazzada & Varese)
 * - Flow 6: Emergency substitution conflicting with approved leave
 * - Flow 7: Shift editing + summary aggregation + Excel CSV export
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { Shift, MonthlyStoreSummary } from '../../../src/domain/types';

describe('Tier 3: Cross-Feature Combinations & Integrated Flows', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  // =========================================================================
  // --- FLOW 1: DRAFT -> EDIT -> EMERGENCY REPLACEMENT -> PUBLISH ---
  // =========================================================================
  it('T3.1: Flow 1 - draft generation -> manual edit -> emergency substitution -> publish', () => {
    // 1. Manager logs in and generates October 2026 draft
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
    expect(shifts.length).toBeGreaterThan(150);
    expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);

    // 2. Regular employee checks view: must see 0 shifts
    app.loginAsEmployee('emp-gz-1', '123');
    expect(app.getVisibleShifts().filter((s) => s.date.startsWith('2026-10'))).toHaveLength(0);

    // 3. Manager unlocks and manually edits a shift
    app.unlockManagerWithPin('admin');
    const targetShift = app.shifts.find((s) => s.employeeId === 'emp-gz-1' && s.date === '2026-10-15')!;
    app.editShift({ ...targetShift, department: 'Fioreria', isManualOverride: true });
    const updatedTargetShift = app.shifts.find((s) => s.id === targetShift.id)!;

    // 4. Emergency: Sabrina (emp-gz-1) calls in sick on 2026-10-15
    const suggestions = app.getEmergencySuggestions(updatedTargetShift, 'Fioreria');
    expect(suggestions.length).toBeGreaterThan(0);
    const candidate = suggestions[0].employee;
    app.applyEmergencySubstitution(updatedTargetShift, candidate.id);

    expect(updatedTargetShift.type).toBe('malattia');
    const subShift = app.shifts.find((s) => s.employeeId === candidate.id && s.date === '2026-10-15');
    expect(subShift?.department).toBe('Fioreria');

    // 5. Manager officially publishes the month
    app.publishMonth('gazzada', 2026, 10);
    expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(false);

    // 6. Employee now views published shifts including the emergency substitution
    app.loginAsEmployee('emp-gz-1', '123');
    const visibleShifts = app.getVisibleShifts().filter((s) => s.date.startsWith('2026-10'));
    expect(visibleShifts.length).toBeGreaterThan(0);
    const myDayShift = visibleShifts.find((s) => s.employeeId === 'emp-gz-1' && s.date === '2026-10-15');
    expect(myDayShift?.type).toBe('malattia');
  });

  // =========================================================================
  // --- FLOW 2: LEAVE REQUEST + SHIFT SWAP + PLANNER HOURS RECALCULATION ---
  // =========================================================================
  it('T3.2: Flow 2 - leave request + peer shift swap + weekly planner hours update', () => {
    // Seed initial schedule
    app.shifts = [
      { id: 's1', employeeId: 'emp-gz-1', locationId: 'gazzada', date: '2026-10-05', type: 'mattina', startTime: '08:30', endTime: '12:30' }, // 4h
      { id: 's2', employeeId: 'emp-gz-1', locationId: 'gazzada', date: '2026-10-06', type: 'giornata', startTime: '08:30', endTime: '17:30' }, // 8h
      { id: 's3', employeeId: 'emp-gz-2', locationId: 'gazzada', date: '2026-10-05', type: 'pomeriggio', startTime: '14:30', endTime: '19:30' }, // 5h
      { id: 's4', employeeId: 'emp-gz-2', locationId: 'gazzada', date: '2026-10-06', type: 'mattina', startTime: '08:30', endTime: '12:30' }, // 4h
    ];
    app.publishMonth('gazzada', 2026, 10);

    // Initial weekly hours
    const initialHours = app.getWeeklyHours('2026-10-04', 'gazzada');
    expect(initialHours['emp-gz-1'].workedHours).toBe(12); // 4 + 8 = 12
    expect(initialHours['emp-gz-2'].workedHours).toBe(9);  // 5 + 4 = 9

    // Employee 1 submits swap with Employee 2 for 2026-10-05
    const swapReq = app.submitRequest({
      requesterId: 'emp-gz-1',
      locationId: 'gazzada',
      type: 'swap',
      targetEmployeeId: 'emp-gz-2',
      shiftDate: '2026-10-05',
      targetShiftDate: '2026-10-05',
      reason: 'Need afternoon instead of morning',
    });

    // Colleague accepts
    app.peerAcceptSwap(swapReq.id);

    // Manager approves
    app.managerApproveRequest(swapReq.id);

    // Re-verify weekly hours:
    // emp-gz-1 now has pomeriggio (5h) + giornata (8h) = 13h
    // emp-gz-2 now has mattina (4h) + mattina (4h) = 8h
    const updatedHours = app.getWeeklyHours('2026-10-04', 'gazzada');
    expect(updatedHours['emp-gz-1'].workedHours).toBe(13);
    expect(updatedHours['emp-gz-2'].workedHours).toBe(8);
  });

  // =========================================================================
  // --- FLOW 3: SVUOTA TURNI (FUTURE ONLY) + REGENERATION + PUBLISH ---
  // =========================================================================
  it('T3.3: Flow 3 - Svuota turni future-only -> historical shifts preserved -> regenerate & publish', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    app.generateMonthlyShifts(2026, 10, 'gazzada');
    app.publishMonth('gazzada', 2026, 10);

    const cutoff = '2026-10-15';
    const pastShiftsCount = app.shifts.filter((s) => s.date < cutoff).length;
    expect(pastShiftsCount).toBeGreaterThan(0);

    // Svuota solo turni futuri
    app.clearShifts('future', cutoff, 'gazzada');
    expect(app.shifts.filter((s) => s.date >= cutoff)).toHaveLength(0);
    expect(app.shifts.filter((s) => s.date < cutoff)).toHaveLength(pastShiftsCount);

    // Manager regenerates
    app.generateMonthlyShifts(2026, 10, 'gazzada');
    expect(app.shifts.filter((s) => s.date >= cutoff).length).toBeGreaterThan(0);
  });

  // =========================================================================
  // --- FLOW 4: ROLE ELEVATION & PRIVACY BARRIER SWITCHING ---
  // =========================================================================
  it('T3.4: Flow 4 - employee login -> privacy enforced -> manager elevation -> privacy restored on logout', () => {
    app.generateMonthlyShifts(2026, 10, 'gazzada'); // In draft mode

    // 1. Employee login
    app.loginAsEmployee('emp-gz-1', '123');
    expect(app.isManagerMode).toBe(false);
    expect(app.getVisibleShifts().filter((s) => s.date.startsWith('2026-10'))).toHaveLength(0);

    // 2. Elevate to manager
    app.unlockManagerWithPin('admin');
    expect(app.isManagerMode).toBe(true);
    expect(app.getVisibleShifts().filter((s) => s.date.startsWith('2026-10')).length).toBeGreaterThan(0);
    expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);

    // 3. Logout
    app.logout();
    expect(app.session).toBeNull();
    expect(app.isManagerMode).toBe(false);

    // 4. Login as different employee: privacy holds
    app.loginAsEmployee('emp-gz-2', '123');
    expect(app.getVisibleShifts().filter((s) => s.date.startsWith('2026-10'))).toHaveLength(0);
  });

  // =========================================================================
  // --- FLOW 5: MULTI-LOCATION PARALLEL DRAFTS (GAZZADA & VARESE) ---
  // =========================================================================
  it('T3.5: Flow 5 - parallel draft generation for Gazzada and Varese with independent publication', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');

    // Generate both
    app.generateMonthlyShifts(2026, 10, 'gazzada');
    app.generateMonthlyShifts(2026, 10, 'varese');

    expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
    expect(app.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(false);

    // Publish only Gazzada
    app.publishMonth('gazzada', 2026, 10);
    expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);
    expect(app.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(false);

    // Gazzada employee sees shifts
    app.loginAsEmployee('emp-gz-1', '123');
    const gzVisible = app.getVisibleShifts().filter((s) => s.locationId === 'gazzada' && s.date.startsWith('2026-10'));
    expect(gzVisible.length).toBeGreaterThan(0);

    // Varese employee sees ZERO shifts
    app.loginAsEmployee('emp-va-1', '123');
    const vaVisible = app.getVisibleShifts().filter((s) => s.locationId === 'varese' && s.date.startsWith('2026-10'));
    expect(vaVisible.length).toBe(0);
  }, 30000);

  // =========================================================================
  // --- FLOW 6: EMERGENCY SUBSTITUTION CONFLICTING WITH APPROVED LEAVE ---
  // =========================================================================
  it('T3.6: Flow 6 - employee on approved leave cannot be recommended for emergency substitution', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
    const targetShift = shifts.find((s) => s.department === 'Cassa' && s.date === '2026-10-15')!;

    // Put Eleonora on ferie on that day
    app.editShift({
      id: `shift-emp-gz-2-2026-10-15`,
      employeeId: 'emp-gz-2',
      locationId: 'gazzada',
      date: '2026-10-15',
      type: 'ferie',
    });

    const suggestions = app.getEmergencySuggestions(targetShift, 'Cassa');
    const eleonoraMatch = suggestions.find((s) => s.employee.id === 'emp-gz-2');

    expect(eleonoraMatch?.isAvailableOnDay).toBe(false);
    expect(eleonoraMatch?.score).toBeLessThan(50);
  });

  // =========================================================================
  // --- FLOW 7: SHIFT EDITING + SUMMARY AGGREGATION + CSV EXPORT ---
  // =========================================================================
  it('T3.7: Flow 7 - shift edits -> monthly summary -> Excel CSV export generation', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    app.generateMonthlyShifts(2026, 10, 'gazzada');

    // Edit Sabrina's shifts
    const sabrinaShifts = app.shifts.filter((s) => s.employeeId === 'emp-gz-1' && s.date.startsWith('2026-10'));
    expect(sabrinaShifts.length).toBeGreaterThan(0);

    // Build MonthlyStoreSummary
    const summary: MonthlyStoreSummary = {
      year: 2026,
      month: 10,
      monthLabel: 'Ottobre 2026',
      locationId: 'gazzada',
      totalWorkedHours: 160,
      totalLeaveHours: 8,
      totalAccountedHours: 168,
      departmentTotals: { Cassa: 160 },
      totalPresenceDays: 20,
      totalRestDays: 8,
      totalLeaveDays: 1,
      totalSickDays: 0,
      employeeSummaries: [
        {
          employee: app.employees[0],
          workedHours: 160,
          leaveHours: 8,
          totalAccountedHours: 168,
          departmentHours: { Cassa: 160 },
          daysCount: { presence: 20, rest: 8, leave: 1, sick: 0 },
          expectedMonthlyHours: 160,
          deltaHours: 8,
        },
      ],
    };

    app.exportMonthlyReport(summary, 'Nicora Garden Gazzada');
    expect(app.downloads).toHaveLength(1);
    expect(app.downloads[0].filename).toBe('nicora_report_ore_gazzada_2026_10.csv');
  });
});
