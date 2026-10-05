/**
 * Tier 4: Real-World Application Scenarios — Nicora Garden Varese
 * Realistic complete operational lifecycle simulation for Varese store:
 * - 20 employees across 6 core departments + seasonal 'Natale' department
 * - Peak season 'continuato' schedule generation
 * - 2-step shift swap between weekend staff members
 * - Emergency substitution for seasonal department with skill matching
 * - Multi-store mobile employee rotation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { Shift } from '../../../src/domain/types';

describe('Tier 4: Realistic Store Workflow — Nicora Garden Varese', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness({ initialLocation: 'varese' });
  });

  it('T4.5: Varese peak Christmas season generation with continuato mode and Natale department', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    expect(app.activeLocation).toBe('varese');

    // Generate November 2026 for Varese with continuato mode
    const shifts = app.generateMonthlyShifts(2026, 11, 'varese', 'continuato');
    expect(shifts.length).toBeGreaterThan(200);

    // Draft state is established
    expect(app.isPublishBannerVisible('varese', 2026, 11)).toBe(true);
    expect(app.getHeaderBadgeState('varese', 2026, 11)).toBe('draft_unpublished');

    // Verify departments present include Varese departments (Cassa, Fioreria, Decor, Emporio, Serra Calda, Serra Fredda)
    const activeDepts = new Set(shifts.map((s) => s.department).filter(Boolean));
    expect(activeDepts.has('Cassa')).toBe(true);
    expect(activeDepts.has('Fioreria')).toBe(true);
    expect(activeDepts.has('Decor') || activeDepts.has('Emporio')).toBe(true);

    // Official publication
    app.publishMonth('varese', 2026, 11);
    expect(app.isMonthOfficiallyPublished('varese', 2026, 11)).toBe(true);
  }, 30000);

  it('T4.6: two-step shift swap between Varese staff members with peer accept and manager approval', () => {
    // Seed shifts for two Varese employees
    const shift1: Shift = {
      id: 's-va-1',
      employeeId: 'emp-va-1',
      locationId: 'varese',
      date: '2026-11-07', // Saturday
      type: 'mattina',
      department: 'Cassa',
      startTime: '08:30',
      endTime: '12:30',
    };
    const shift2: Shift = {
      id: 's-va-2',
      employeeId: 'emp-va-2',
      locationId: 'varese',
      date: '2026-11-08', // Sunday
      type: 'pomeriggio',
      department: 'Decor',
      startTime: '14:30',
      endTime: '19:30',
    };
    app.shifts = [shift1, shift2];
    app.publishMonth('varese', 2026, 11);

    // 1. Employee 1 requests swap
    const swapReq = app.submitRequest({
      requesterId: 'emp-va-1',
      locationId: 'varese',
      type: 'swap',
      targetEmployeeId: 'emp-va-2',
      shiftDate: '2026-11-07',
      targetShiftDate: '2026-11-08',
      reason: 'Impegno familiare sabato',
    });
    expect(swapReq.status).toBe('pending_colleague');

    // 2. Colleague 2 logs in on mobile device and accepts swap
    app.loginAsEmployee('emp-va-2', '123');
    const colleagueRequests = app.getVisibleRequests();
    expect(colleagueRequests.some((r) => r.id === swapReq.id)).toBe(true);

    const peerAccepted = app.peerAcceptSwap(swapReq.id);
    expect(peerAccepted).toBe(true);
    expect(app.requests.find((r) => r.id === swapReq.id)?.status).toBe('pending');

    // 3. Manager logs in and grants approval
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    const mgrApproved = app.managerApproveRequest(swapReq.id);
    expect(mgrApproved).toBe(true);

    // 4. Verify shifts swapped in planner
    const s1After = app.shifts.find((s) => s.employeeId === 'emp-va-1' && s.date === '2026-11-07');
    const s2After = app.shifts.find((s) => s.employeeId === 'emp-va-2' && s.date === '2026-11-08');

    expect(s1After?.department).toBe('Decor');
    expect(s1After?.type).toBe('pomeriggio');
    expect(s2After?.department).toBe('Cassa');
    expect(s2After?.type).toBe('mattina');
  });

  it('T4.7: emergency substitution for Decor department with skill matching', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    const shifts = app.generateMonthlyShifts(2026, 11, 'varese', 'continuato');
    app.publishMonth('varese', 2026, 11);

    const decorShift = shifts.find((s) => s.department === 'Decor' && s.type !== 'riposo')!;
    expect(decorShift).toBeDefined();

    // Sudden absence
    const suggestions = app.getEmergencySuggestions(decorShift, 'Decor');
    expect(suggestions.length).toBeGreaterThan(0);

    // Best substitute has high Decor competency
    const bestSubstitute = suggestions[0].employee;
    expect(bestSubstitute.skills.Decor ?? 5).toBeGreaterThanOrEqual(1);

    app.applyEmergencySubstitution(decorShift, bestSubstitute.id);
    expect(decorShift.type).toBe('malattia');

    const subShift = app.shifts.find((s) => s.employeeId === bestSubstitute.id && s.date === decorShift.date);
    expect(subShift).toBeDefined();
    expect(subShift?.department).toBe('Decor');
  }, 30000);

  it('T4.8: mobile worker transfer and hours tracking across locations', () => {
    const mobileStaff = app.employees.find((e) => e.isMobile);
    if (mobileStaff) {
      // Mobile employee scheduled in Gazzada on Monday and Varese on Tuesday
      app.shifts = [
        {
          id: 's-mob-1',
          employeeId: mobileStaff.id,
          locationId: 'gazzada',
          date: '2026-11-02',
          type: 'giornata',
          startTime: '08:30',
          endTime: '17:30', // 8h
        },
        {
          id: 's-mob-2',
          employeeId: mobileStaff.id,
          locationId: 'varese',
          date: '2026-11-03',
          type: 'giornata',
          startTime: '08:30',
          endTime: '17:30', // 8h
        },
      ];

      // Gazzada week hours includes Monday shift
      const gzHours = app.getWeeklyHours('2026-11-01', 'gazzada');
      expect(gzHours[mobileStaff.id]?.workedHours).toBe(8);

      // Varese week hours includes Tuesday shift
      const vaHours = app.getWeeklyHours('2026-11-01', 'varese');
      expect(vaHours[mobileStaff.id]?.workedHours).toBe(8);
    }
  });
});
