/**
 * Tier 1: Core Features F18 & F19 (Requests Lifecycle & Staff Privacy Isolation)
 * Covers:
 * - F18: Leave, Permission, & Swap Requests Lifecycle (types preservation, two-step swap)
 * - F19: Staff Privacy - Requests & Swaps Isolation (peer privacy, manager view)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { Shift, ShiftRequest } from '../../../src/domain/types';

describe('Tier 1: Features F18 & F19 (Requests Lifecycle & Staff Privacy)', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  // ==========================================
  // --- F18: REQUESTS LIFECYCLE (>= 5 TESTS) ---
  // ==========================================
  describe('F18: Shift Requests Lifecycle & 2-Step Swap', () => {
    it('F18.1: submitting leave request sets status "pending" directly for manager evaluation', () => {
      const req = app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-20',
        reason: 'Ferie personali',
      });

      expect(req.type).toBe('leave');
      expect(req.status).toBe('pending');
      expect(req.id).toBeDefined();
    });

    it('F18.2: preserves distinct request types: sick and schedule_change', () => {
      const sickReq = app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'sick',
        shiftDate: '2026-10-14',
        reason: 'Influenza stagionale',
        protocolNumber: 'INPS-12345678',
      });
      expect(sickReq.type).toBe('sick');
      expect(sickReq.protocolNumber).toBe('INPS-12345678');

      const changeReq = app.submitRequest({
        requesterId: 'emp-gz-2',
        locationId: 'gazzada',
        type: 'schedule_change',
        shiftDate: '2026-10-18',
        requestedStartTime: '09:00',
        requestedEndTime: '13:00',
        reason: 'Esigenze orario treno',
      });
      expect(changeReq.type).toBe('schedule_change');
      expect(changeReq.requestedStartTime).toBe('09:00');
    });

    it('F18.3: swap request initializes in "pending_colleague" status awaiting peer response', () => {
      const swapReq = app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'swap',
        targetEmployeeId: 'emp-gz-2',
        shiftDate: '2026-10-10',
        targetShiftDate: '2026-10-11',
        reason: 'Scambio sabato con domenica',
      });

      expect(swapReq.status).toBe('pending_colleague');
    });

    it('F18.4: colleague accepts swap -> status advances to "pending" for manager signoff', () => {
      const swapReq = app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'swap',
        targetEmployeeId: 'emp-gz-2',
        shiftDate: '2026-10-10',
        targetShiftDate: '2026-10-11',
        reason: 'Scambio concordato',
      });

      const accepted = app.peerAcceptSwap(swapReq.id);
      expect(accepted).toBe(true);

      const updated = app.requests.find((r) => r.id === swapReq.id);
      expect(updated?.status).toBe('pending');
    });

    it('F18.5: colleague rejects swap -> status becomes "rejected_colleague"', () => {
      const swapReq = app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'swap',
        targetEmployeeId: 'emp-gz-2',
        shiftDate: '2026-10-10',
        targetShiftDate: '2026-10-11',
        reason: 'Scambio non gradito',
      });

      const rejected = app.peerRejectSwap(swapReq.id);
      expect(rejected).toBe(true);

      const updated = app.requests.find((r) => r.id === swapReq.id);
      expect(updated?.status).toBe('rejected_colleague');
    });

    it('F18.6: manager approval of swap swaps the actual shifts in planner', () => {
      // Seed two shifts
      const shiftSab: Shift = {
        id: 's-sab',
        employeeId: 'emp-gz-1',
        locationId: 'gazzada',
        date: '2026-10-10',
        type: 'mattina',
        department: 'Cassa',
        startTime: '08:30',
        endTime: '12:30',
      };
      const shiftEle: Shift = {
        id: 's-ele',
        employeeId: 'emp-gz-2',
        locationId: 'gazzada',
        date: '2026-10-11',
        type: 'pomeriggio',
        department: 'Fioreria',
        startTime: '14:30',
        endTime: '19:30',
      };
      app.shifts = [shiftSab, shiftEle];

      const swapReq = app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'swap',
        targetEmployeeId: 'emp-gz-2',
        shiftDate: '2026-10-10',
        targetShiftDate: '2026-10-11',
        reason: 'Scambio turni',
      });

      app.peerAcceptSwap(swapReq.id);
      const approved = app.managerApproveRequest(swapReq.id);
      expect(approved).toBe(true);

      const sabShift = app.shifts.find((s) => s.employeeId === 'emp-gz-1' && s.date === '2026-10-10');
      const eleShift = app.shifts.find((s) => s.employeeId === 'emp-gz-2' && s.date === '2026-10-11');

      // Shifts swapped
      expect(sabShift?.department).toBe('Fioreria');
      expect(sabShift?.type).toBe('pomeriggio');
      expect(eleShift?.department).toBe('Cassa');
      expect(eleShift?.type).toBe('mattina');
    });
  });

  // ==========================================
  // --- F19: REQUESTS PRIVACY (>= 5 TESTS) ---
  // ==========================================
  describe('F19: Staff Privacy - Requests & Swaps Isolation', () => {
    beforeEach(() => {
      // Seed 3 requests
      // Req 1: Sabrina -> Ferie
      app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-10',
        reason: 'Sabrina ferie',
      });
      // Req 2: Eleonora -> Ferie
      app.submitRequest({
        requesterId: 'emp-gz-2',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-11',
        reason: 'Eleonora ferie',
      });
      // Req 3: Sabrina -> Swap with Eleonora
      app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'swap',
        targetEmployeeId: 'emp-gz-2',
        shiftDate: '2026-10-12',
        targetShiftDate: '2026-10-13',
        reason: 'Sabrina swap Eleonora',
      });
      // Req 4: Teo -> Ferie (unrelated)
      app.submitRequest({
        requesterId: 'emp-gz-3',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-14',
        reason: 'Teo ferie',
      });
    });

    it('F19.1: regular employee sees only their own requests', () => {
      app.loginAsEmployee('emp-gz-3', '123'); // Teo
      const visible = app.getVisibleRequests();

      expect(visible.length).toBe(1);
      expect(visible[0].requesterId).toBe('emp-gz-3');
      expect(visible[0].reason).toBe('Teo ferie');
    });

    it('F19.2: employee sees swap requests where they are the target peer', () => {
      app.loginAsEmployee('emp-gz-2', '123'); // Eleonora
      const visible = app.getVisibleRequests();

      // Eleonora should see:
      // - Req 2 (her leave request)
      // - Req 3 (swap request sent to her by Sabrina)
      // She should NOT see Req 1 (Sabrina's private leave) or Req 4 (Teo's leave)
      expect(visible.length).toBe(2);
      const reqIds = visible.map((r) => r.reason);
      expect(reqIds).toContain('Eleonora ferie');
      expect(reqIds).toContain('Sabrina swap Eleonora');
      expect(reqIds).not.toContain('Sabrina ferie');
      expect(reqIds).not.toContain('Teo ferie');
    });

    it('F19.3: employee NEVER sees private leave requests of other staff members', () => {
      app.loginAsEmployee('emp-gz-1', '123'); // Sabrina
      const visible = app.getVisibleRequests();

      const sawTeo = visible.some((r) => r.requesterId === 'emp-gz-3');
      expect(sawTeo).toBe(false);
    });

    it('F19.4: manager sees all requests submitted in the active location', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const visible = app.getVisibleRequests();

      expect(visible.length).toBe(4);
    });

    it('F19.5: manager only sees requests for active location, excluding other locations', () => {
      // Add request in Varese
      app.submitRequest({
        requesterId: 'emp-va-1',
        locationId: 'varese',
        type: 'leave',
        shiftDate: '2026-10-15',
        reason: 'Varese leave',
      });

      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.switchLocation('gazzada');
      expect(app.getVisibleRequests().every((r) => r.locationId === 'gazzada')).toBe(true);

      app.switchLocation('varese');
      expect(app.getVisibleRequests().every((r) => r.locationId === 'varese')).toBe(true);
    });
  });
});
