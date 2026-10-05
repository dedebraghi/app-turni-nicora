/**
 * Tier 1: Core Features F11 & F12 ("Oggi in Sede" & "I Miei Turni")
 * Covers:
 * - F11: "Oggi in Sede" View & Labels (presence grouping, mobile label spelling, presence stats)
 * - F12: "I Miei Turni" Employee View (personal schedule, draft notice, requests history)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { Shift } from '../../../src/domain/types';
import { recordDraftGenerated, recordMonthUnpublished } from '../../../src/services/storageService';

describe('Tier 1: Features F11 & F12 ("Oggi in Sede" & "I Miei Turni")', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  // ==========================================
  // --- F11: "OGGI IN SEDE" (>= 5 TESTS) ---
  // ==========================================
  describe('F11: "Oggi in Sede" View & Presence Labels', () => {
    beforeEach(() => {
      // Seed a published day with diverse shifts
      app.shifts = [
        { id: 's1', employeeId: 'emp-gz-1', locationId: 'gazzada', date: '2026-10-15', type: 'mattina', department: 'Cassa', startTime: '08:30', endTime: '12:30' },
        { id: 's2', employeeId: 'emp-gz-2', locationId: 'gazzada', date: '2026-10-15', type: 'pomeriggio', department: 'Fioreria', startTime: '14:30', endTime: '19:30' },
        { id: 's3', employeeId: 'emp-gz-3', locationId: 'gazzada', date: '2026-10-15', type: 'giornata', department: 'Serra Calda', startTime: '08:30', endTime: '19:30' },
        { id: 's4', employeeId: 'emp-gz-5', locationId: 'gazzada', date: '2026-10-15', type: 'riposo' },
        { id: 's5', employeeId: 'emp-gz-6', locationId: 'gazzada', date: '2026-10-15', type: 'ferie' },
        { id: 's6', employeeId: 'emp-gz-7', locationId: 'gazzada', date: '2026-10-15', type: 'malattia' },
      ];
      app.publishMonth('gazzada', 2026, 10);
    });

    it('F11.1: partitions presence into mattina, pomeriggio, giornata, riposo, ferie, and malattia', () => {
      app.loginAsEmployee('emp-gz-1', '123');
      const today = app.getTodayPresence('2026-10-15', 'gazzada');

      expect(today.mattina.length).toBe(1);
      expect(today.mattina[0].employeeId).toBe('emp-gz-1');

      expect(today.pomeriggio.length).toBe(1);
      expect(today.pomeriggio[0].employeeId).toBe('emp-gz-2');

      expect(today.giornata.length).toBe(1);
      expect(today.giornata[0].employeeId).toBe('emp-gz-3');

      expect(today.riposo.length).toBe(1);
      expect(today.ferie.length).toBe(1);
      expect(today.malattia.length).toBe(1);
    });

    it('F11.2: correctly tallies presentCount as mattina + pomeriggio + giornata', () => {
      app.loginAsEmployee('emp-gz-1', '123');
      const today = app.getTodayPresence('2026-10-15', 'gazzada');

      // 1 mattina + 1 pomeriggio + 1 giornata = 3
      expect(today.presentCount).toBe(3);
    });

    it('F11.3: verifies label spelling "Pomeriggio" and department assignment on shifts', () => {
      app.loginAsEmployee('emp-gz-1', '123');
      const today = app.getTodayPresence('2026-10-15', 'gazzada');

      const pmShift = today.pomeriggio[0];
      expect(pmShift.type).toBe('pomeriggio');
      expect(pmShift.department).toBe('Fioreria');
    });

    it('F11.4: excludes inactive staff and store owner from operational presence list', () => {
      app.loginAsEmployee('emp-gz-1', '123');
      const today = app.getTodayPresence('2026-10-15', 'gazzada');

      // Active Gazzada staff excluding inactive and owner
      const activeStaffIds = app.employees
        .filter((e) => e.locationId === 'gazzada' && e.isActive !== false && !e.isOwner)
        .map((e) => e.id);

      expect(today.totalStaff).toBe(activeStaffIds.length);
      expect(activeStaffIds).not.toContain('emp-gz-4'); // Vittore (owner)
      expect(activeStaffIds).not.toContain('emp-gz-11'); // Inactive
    });

    it('F11.5: returns 0 presence when day is in unpublished draft for non-manager staff', () => {
      // Unpublish month
      app.storage.setItem('nicora_v2_published_months', JSON.stringify({}));
      recordDraftGenerated('gazzada', 2026, 10);

      app.loginAsEmployee('emp-gz-1', '123');
      const today = app.getTodayPresence('2026-10-15', 'gazzada');

      expect(today.presentCount).toBe(0);
      expect(today.mattina.length).toBe(0);
    });

    it('F11.6: manager mode sees full presence even when month is still draft', () => {
      app.storage.setItem('nicora_v2_published_months', JSON.stringify({}));
      recordDraftGenerated('gazzada', 2026, 10);

      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const today = app.getTodayPresence('2026-10-15', 'gazzada');

      expect(today.presentCount).toBe(3);
    });
  });

  // ==========================================
  // --- F12: "I MIEI TURNI" (>= 5 TESTS) ---
  // ==========================================
  describe('F12: "I Miei Turni" Employee Personal View', () => {
    beforeEach(() => {
      app.shifts = [
        { id: 's-sab-1', employeeId: 'emp-gz-1', locationId: 'gazzada', date: '2026-10-05', type: 'mattina', department: 'Cassa' },
        { id: 's-sab-2', employeeId: 'emp-gz-1', locationId: 'gazzada', date: '2026-10-06', type: 'pomeriggio', department: 'Cassa' },
        { id: 's-ele-1', employeeId: 'emp-gz-2', locationId: 'gazzada', date: '2026-10-05', type: 'giornata', department: 'Fioreria' },
      ];
    });

    it('F12.1: filters shifts strictly for the authenticated employee', () => {
      app.publishMonth('gazzada', 2026, 10);
      app.loginAsEmployee('emp-gz-1', '123');

      const schedule = app.getMySchedule('emp-gz-1', 2026, 10);
      expect(schedule.shifts.length).toBe(2);
      expect(schedule.shifts.every((s) => s.employeeId === 'emp-gz-1')).toBe(true);
      expect(schedule.shifts.some((s) => s.employeeId === 'emp-gz-2')).toBe(false);
    });

    it('F12.2: shows "Bozza non pubblicata" notice and hides shift details when month is draft', () => {
      recordDraftGenerated('gazzada', 2026, 10);
      recordMonthUnpublished('gazzada', 2026, 10);

      app.loginAsEmployee('emp-gz-1', '123');
      const schedule = app.getMySchedule('emp-gz-1', 2026, 10);

      expect(schedule.hasDraft).toBe(true);
      expect(schedule.isMonthPublished).toBe(false);
      expect(schedule.isDraftUnpublishedNoticeVisible).toBe(true);
      expect(schedule.shifts.length).toBe(0);
    });

    it('F12.3: reveals shifts and removes draft notice once manager publishes the month', () => {
      recordDraftGenerated('gazzada', 2026, 10);
      recordMonthUnpublished('gazzada', 2026, 10);

      app.loginAsEmployee('emp-gz-1', '123');
      expect(app.getMySchedule('emp-gz-1', 2026, 10).shifts.length).toBe(0);

      // Manager publishes
      app.publishMonth('gazzada', 2026, 10);

      const publishedSchedule = app.getMySchedule('emp-gz-1', 2026, 10);
      expect(publishedSchedule.isMonthPublished).toBe(true);
      expect(publishedSchedule.isDraftUnpublishedNoticeVisible).toBe(false);
      expect(publishedSchedule.shifts.length).toBe(2);
    });

    it('F12.4: retrieves active requests submitted by the employee', () => {
      app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-20',
        reason: 'Visita medica',
      });
      app.submitRequest({
        requesterId: 'emp-gz-2',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-22',
        reason: 'Ferie personali',
      });

      app.loginAsEmployee('emp-gz-1', '123');
      const schedule = app.getMySchedule('emp-gz-1', 2026, 10);

      expect(schedule.userRequests.length).toBe(1);
      expect(schedule.userRequests[0].requesterId).toBe('emp-gz-1');
      expect(schedule.userRequests[0].reason).toBe('Visita medica');
    });

    it('F12.5: reflects status changes on employee personal requests', () => {
      const req = app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-25',
        reason: 'Permesso studio',
      });
      expect(req.status).toBe('pending');

      app.managerApproveRequest(req.id);

      app.loginAsEmployee('emp-gz-1', '123');
      const schedule = app.getMySchedule('emp-gz-1', 2026, 10);
      expect(schedule.userRequests[0].status).toBe('approved');
    });
  });
});
