/**
 * Tier 1: Core Features F16 & F17 (Emergency Substitution & Svuota Turni)
 * Covers:
 * - F16: Emergency Substitution Wizard (ranking candidates, skill score, availability)
 * - F17: "Svuota Turni" Clear Shifts (future only vs whole month, state reset)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { Shift } from '../../../src/domain/types';

describe('Tier 1: Features F16 & F17 (Emergency Substitution & Svuota Turni)', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  // ==========================================
  // --- F16: EMERGENCY WIZARD (>= 5 TESTS) ---
  // ==========================================
  describe('F16: Emergency Substitution Wizard', () => {
    let absentShift: Shift;

    beforeEach(() => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      // Sabrina on Cassa
      absentShift = shifts.find((s) => s.employeeId === 'emp-gz-1' && s.department === 'Cassa') || shifts[0];
    });

    it('F16.1: excludes absent employee from list of replacement candidates', () => {
      const suggestions = app.getEmergencySuggestions(absentShift, 'Cassa');
      const candidateIds = suggestions.map((s) => s.employee.id);

      expect(candidateIds).not.toContain(absentShift.employeeId);
    });

    it('F16.2: ranks staff with higher competency score in target department higher', () => {
      const suggestions = app.getEmergencySuggestions(absentShift, 'Cassa');
      expect(suggestions.length).toBeGreaterThan(0);

      // Verify suggestions are sorted by score descending (among available candidates)
      const available = suggestions.filter((s) => s.isAvailableOnDay);
      for (let i = 0; i < available.length - 1; i++) {
        expect(available[i].score).toBeGreaterThanOrEqual(available[i + 1].score);
      }
    });

    it('F16.3: prioritizes employees currently at rest over those scheduled to work', () => {
      // Find candidate at rest
      const restEmp = app.employees.find((e) => e.locationId === 'gazzada' && e.id !== absentShift.employeeId);
      if (restEmp) {
        app.editShift({
          id: `shift-rest-${restEmp.id}`,
          employeeId: restEmp.id,
          locationId: 'gazzada',
          date: absentShift.date,
          type: 'riposo',
        });
      }

      const suggestions = app.getEmergencySuggestions(absentShift, 'Cassa');
      const match = suggestions.find((s) => s.employee.id === restEmp?.id);

      expect(match?.currentShiftType).toBe('riposo');
      expect(match?.reasons.some((r) => r.includes('riposo'))).toBe(true);
    });

    it('F16.4: heavily penalizes employees who are already absent (ferie/malattia)', () => {
      const otherEmp = app.employees.find((e) => e.locationId === 'gazzada' && e.id !== absentShift.employeeId)!;
      app.editShift({
        id: `shift-ferie-${otherEmp.id}`,
        employeeId: otherEmp.id,
        locationId: 'gazzada',
        date: absentShift.date,
        type: 'ferie',
      });

      const suggestions = app.getEmergencySuggestions(absentShift, 'Cassa');
      const match = suggestions.find((s) => s.employee.id === otherEmp.id);

      expect(match?.isAvailableOnDay).toBe(false);
      expect(match?.score).toBeLessThan(50);
    });

    it('F16.5: applying substitution updates absent shift to malattia and schedules replacement', () => {
      const suggestions = app.getEmergencySuggestions(absentShift, 'Cassa');
      const bestCandidate = suggestions[0].employee;

      app.applyEmergencySubstitution(absentShift, bestCandidate.id);

      expect(absentShift.type).toBe('malattia');
      const subShift = app.shifts.find((s) => s.employeeId === bestCandidate.id && s.date === absentShift.date);
      expect(subShift).toBeDefined();
      expect(subShift?.department).toBe(absentShift.department);
      expect(subShift?.type).toBe('giornata');
    });

    it('F16.6: allows mobile staff (isMobile: true) to be recommended across locations', () => {
      const mobileEmp = app.employees.find((e) => e.isMobile);
      if (mobileEmp) {
        const suggestions = app.getEmergencySuggestions(absentShift, 'Cassa');
        const hasMobile = suggestions.some((s) => s.employee.id === mobileEmp.id);
        expect(hasMobile).toBe(true);
      }
    });
  });

  // ==========================================
  // --- F17: SVUOTA TURNI (>= 5 TESTS) ---
  // ==========================================
  describe('F17: "Svuota Turni" Clear Shifts Action', () => {
    beforeEach(() => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');
      app.publishMonth('gazzada', 2026, 10);
    });

    it('F17.1: clearing scope "month" removes all shifts for the target month', () => {
      app.clearShifts('month', '2026-10-01', 'gazzada');
      const octShifts = app.shifts.filter((s) => s.locationId === 'gazzada' && s.date.startsWith('2026-10'));

      expect(octShifts.length).toBe(0);
    });

    it('F17.2: clearing scope "month" resets published state to unpublished', () => {
      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);

      app.clearShifts('month', '2026-10-01', 'gazzada');

      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(app.isMonthDraft('gazzada', 2026, 10)).toBe(false);
    });

    it('F17.3: clearing scope "future" deletes only shifts on or after reference date and preserves past', () => {
      const cutoff = '2026-10-15';
      const pastCount = app.shifts.filter((s) => s.locationId === 'gazzada' && s.date < cutoff).length;
      expect(pastCount).toBeGreaterThan(0);

      app.clearShifts('future', cutoff, 'gazzada');

      const remainingPast = app.shifts.filter((s) => s.locationId === 'gazzada' && s.date < cutoff);
      const remainingFuture = app.shifts.filter((s) => s.locationId === 'gazzada' && s.date >= cutoff);

      expect(remainingPast.length).toBe(pastCount);
      expect(remainingFuture.length).toBe(0);
    });

    it('F17.4: clearing shifts for Gazzada does NOT delete Varese shifts', () => {
      app.generateMonthlyShifts(2026, 10, 'varese');
      const vaCount = app.shifts.filter((s) => s.locationId === 'varese').length;
      expect(vaCount).toBeGreaterThan(0);

      app.clearShifts('month', '2026-10-01', 'gazzada');

      const vaRemaining = app.shifts.filter((s) => s.locationId === 'varese').length;
      expect(vaRemaining).toBe(vaCount);
    }, 30000);

    it('F17.5: clearing scope "all" removes all shifts for the location and resets draft status', () => {
      app.clearShifts('all', '2026-10-01', 'gazzada');

      const gzShifts = app.shifts.filter((s) => s.locationId === 'gazzada');
      expect(gzShifts.length).toBe(0);
      expect(app.isMonthDraft('gazzada', 2026, 10)).toBe(false);
    });
  });
});
