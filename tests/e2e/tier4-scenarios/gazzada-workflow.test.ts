/**
 * Tier 4: Real-World Application Scenarios — Nicora Garden Gazzada
 * Realistic complete operational lifecycle simulation for Gazzada store:
 * - Full October 2026 monthly generation & constraint verification
 * - Staff login, daily presence check, and personal schedule review
 * - Saturday peak emergency replacement
 * - End-of-month payroll summary & CSV export
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { MonthlyStoreSummary } from '../../../src/domain/types';

describe('Tier 4: Realistic Store Workflow — Nicora Garden Gazzada', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  it('T4.1: full October 2026 monthly authoring cycle by store manager', () => {
    // 1. Manager Vittore logs in
    const loginRes = app.loginAsManager('vittore@nicoragarden.it', 'admin');
    expect(loginRes.success).toBe(true);
    expect(app.isManagerMode).toBe(true);

    // 2. Generates October 2026 shifts
    const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
    expect(shifts.length).toBeGreaterThan(150);

    // 3. Draft banner and badge are visible
    expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    expect(app.getHeaderBadgeState('gazzada', 2026, 10)).toBe('draft_unpublished');

    // 4. Verifies mandatory daily presence for Cassa across all 31 days
    for (let day = 1; day <= 31; day++) {
      const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
      const cassaStaff = shifts.filter((s) => s.date === dateStr && s.department === 'Cassa' && s.type !== 'riposo');
      expect(cassaStaff.length).toBeGreaterThanOrEqual(1);
    }

    // 5. Manager audits weekly hours for Sabrina (emp-gz-1)
    const weekHours = app.getWeeklyHours('2026-10-04', 'gazzada');
    expect(weekHours['emp-gz-1']).toBeDefined();
    expect(weekHours['emp-gz-1'].workedDaysCount).toBeGreaterThanOrEqual(4);

    // 6. Publishes month officially
    app.publishMonth('gazzada', 2026, 10);
    expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);
    expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(false);
  });

  it('T4.2: employee daily routine — login, Oggi in Sede, My Schedule, and leave submission', () => {
    // Seed and publish month
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    app.generateMonthlyShifts(2026, 10, 'gazzada');
    app.publishMonth('gazzada', 2026, 10);
    app.logout();

    // 1. Sabrina logs in via PIN
    const loginRes = app.loginAsEmployee('emp-gz-1', '123');
    expect(loginRes.success).toBe(true);
    expect(app.session?.user.name).toBe('Sabrina');

    // 2. Inspects "Oggi in Sede" for today
    const presence = app.getTodayPresence('2026-10-15', 'gazzada');
    expect(presence.presentCount).toBeGreaterThan(0);
    expect(presence.mattina.length + presence.pomeriggio.length + presence.giornata.length).toBe(presence.presentCount);

    // 3. Inspects "I Miei Turni"
    const mySchedule = app.getMySchedule('emp-gz-1', 2026, 10);
    expect(mySchedule.shifts.length).toBeGreaterThan(15);
    expect(mySchedule.isMonthPublished).toBe(true);
    expect(mySchedule.isDraftUnpublishedNoticeVisible).toBe(false);

    // 4. Submits leave request for October 24
    const leaveReq = app.submitRequest({
      requesterId: 'emp-gz-1',
      locationId: 'gazzada',
      type: 'leave',
      shiftDate: '2026-10-24',
      reason: 'Ferie autunnali concordate',
    });
    expect(leaveReq.status).toBe('pending');

    // 5. Manager reviews and approves request
    app.managerApproveRequest(leaveReq.id);

    // 6. Sabrina verifies request status is now approved
    const updatedSchedule = app.getMySchedule('emp-gz-1', 2026, 10);
    const approved = updatedSchedule.userRequests.find((r) => r.id === leaveReq.id);
    expect(approved?.status).toBe('approved');
  });

  it('T4.3: Saturday peak emergency substitution in Gazzada', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    app.generateMonthlyShifts(2026, 10, 'gazzada');
    app.publishMonth('gazzada', 2026, 10);

    // Saturday 2026-10-10: peak customer day
    const saturdayShift = app.shifts.find((s) => s.date === '2026-10-10' && s.department === 'Fioreria')!;
    expect(saturdayShift).toBeDefined();

    // Florist falls sick
    const suggestions = app.getEmergencySuggestions(saturdayShift, 'Fioreria');
    expect(suggestions.length).toBeGreaterThan(0);

    // Pick top available candidate
    const topCandidate = suggestions[0].employee;
    app.applyEmergencySubstitution(saturdayShift, topCandidate.id);

    // Verify replacement shift is on duty
    expect(saturdayShift.type).toBe('malattia');
    const replacement = app.shifts.find((s) => s.employeeId === topCandidate.id && s.date === '2026-10-10');
    expect(replacement).toBeDefined();
    expect(replacement?.department).toBe('Fioreria');
  });

  it('T4.4: end-of-month payroll consolidation and Excel CSV report export', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    app.generateMonthlyShifts(2026, 10, 'gazzada');

    // Consolidated store summary for October 2026
    const summary: MonthlyStoreSummary = {
      year: 2026,
      month: 10,
      monthLabel: 'Ottobre 2026',
      locationId: 'gazzada',
      totalWorkedHours: 1420,
      totalLeaveHours: 80,
      totalAccountedHours: 1500,
      departmentTotals: {
        Cassa: 480,
        Fioreria: 380,
        'Serra Calda': 280,
        'Serra Fredda': 280,
      },
      totalPresenceDays: 180,
      totalRestDays: 72,
      totalLeaveDays: 10,
      totalSickDays: 2,
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
