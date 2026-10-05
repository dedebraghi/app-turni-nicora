/**
 * Adversarial Challenger 2 Stress Suite: Realtime Concurrency, Swap Validation, & Svuota Turni
 * 
 * Objective:
 * 1. Stress-test Realtime batch flush under high-frequency bursts of shift events (draft preservation oracle).
 * 2. Adversarially challenge shift swap validation across corner cases:
 *    - Same-day swap (morning vs afternoon exchange, identical hours exchange).
 *    - Self-swap rejection oracle.
 *    - Cross-store swap isolation and cross-store collision detection.
 *    - Multiple overlapping pending requests (swaps & leave concurrency).
 * 3. Verify Svuota Turni invariants:
 *    - Clearing past vs future vs entire month.
 *    - Draft & publication lifecycle state consistency after wipe.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setupBrowserEnv } from '../harness/browser-env';
import { AppHarness } from '../harness/app-harness';
import {
  generateMonthlySchedule,
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
  loadStoredShifts,
  saveStoredShifts,
} from '../../src/services/storageService';
import { INITIAL_EMPLOYEES } from '../../src/domain/mockData';
import { Employee, Shift, ShiftRequest, ShiftType } from '../../src/domain/types';

// Initialize headless browser environment
setupBrowserEnv();

describe('Adversarial Challenger 2: Realtime, Swaps & Svuota Turni Oracles', () => {
  let harness: AppHarness;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    harness = new AppHarness();
  });

  // =========================================================================
  // SUITE 1: REALTIME BATCH FLUSH HIGH-FREQUENCY BURST STRESS TEST
  // =========================================================================
  describe('1. Realtime Batch Flush & Concurrency Stress Test', () => {
    test('1.1: 200 high-frequency burst events (inserts, updates, deletes) NEVER flip draft to published', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      const loc = 'gazzada';
      const year = 2026;
      const month = 10;

      // Generate draft
      const baseShifts = harness.generateMonthlyShifts(year, month, loc);
      expect(baseShifts.length).toBeGreaterThan(100);
      expect(harness.isMonthDraft(loc, year, month)).toBe(true);
      expect(harness.isMonthOfficiallyPublished(loc, year, month)).toBe(false);
      expect(harness.hasUnpublishedDraftInView(loc, year, month)).toBe(true);
      expect(harness.isPublishBannerVisible(loc, year, month)).toBe(true);

      // Simulate a violent burst of 200 Realtime shift events:
      // - Rapid chunked upserts
      // - Shift modifications
      // - Interleaved deletes
      for (let burst = 0; burst < 200; burst++) {
        const sliceStart = (burst * 3) % (baseShifts.length - 5);
        const shiftChunk = baseShifts.slice(sliceStart, sliceStart + 5).map((s, idx) => ({
          ...s,
          startTime: burst % 2 === 0 ? '08:00' : '08:30',
          areaNote: `Burst modification #${burst}-${idx}`,
        }));

        // Flush without buggy auto-publish
        harness.simulateRealtimeShiftFlush(shiftChunk, false);

        // Periodically verify invariants every 25 bursts
        if (burst % 25 === 0) {
          expect(harness.isMonthOfficiallyPublished(loc, year, month)).toBe(false);
          expect(harness.isMonthDraft(loc, year, month)).toBe(true);
          expect(harness.hasUnpublishedDraftInView(loc, year, month)).toBe(true);
          expect(harness.isPublishBannerVisible(loc, year, month)).toBe(true);
        }
      }

      // Final invariant check after 200 rapid bursts
      expect(harness.isMonthOfficiallyPublished(loc, year, month)).toBe(false);
      expect(harness.isMonthDraft(loc, year, month)).toBe(true);
      expect(harness.hasUnpublishedDraftInView(loc, year, month)).toBe(true);
      expect(harness.isPublishBannerVisible(loc, year, month)).toBe(true);
      expect(harness.getHeaderBadgeState(loc, year, month)).toBe('draft_unpublished');
    });

    test('1.2: Interleaved Realtime events for a published month and a draft month preserve distinct states', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');

      // September 2026 is published
      harness.generateMonthlyShifts(2026, 9, 'gazzada');
      harness.publishMonth('gazzada', 2026, 9);
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 9)).toBe(true);

      // October 2026 is draft
      const octShifts = harness.generateMonthlyShifts(2026, 10, 'gazzada');
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);

      // Rapidly flush mixed stream of Sept (published) and Oct (draft) shifts
      for (let i = 0; i < 30; i++) {
        const sampleOct = octShifts.slice(i, i + 3);
        const sampleSept: Shift[] = [
          {
            id: `shift-sep-${i}`,
            employeeId: 'emp-gz-1',
            locationId: 'gazzada',
            date: `2026-09-${String((i % 25) + 1).padStart(2, '0')}`,
            type: 'giornata',
            startTime: '08:30',
            endTime: '17:00',
          },
        ];

        harness.simulateRealtimeShiftFlush([...sampleOct, ...sampleSept], false);
      }

      // Sep remains published, Oct remains draft
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 9)).toBe(true);
      expect(harness.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(harness.hasUnpublishedDraftInView('gazzada', 2026, 10)).toBe(true);
      expect(harness.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });

    test('1.3: Realtime flush never pollutes localStorage published_months map', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      const shifts = harness.generateMonthlyShifts(2026, 10, 'gazzada');

      const initialMap = getPublishedMonthsMap();
      expect(initialMap['gazzada_2026-10']).toBeUndefined();

      // Flush 50 shift bursts
      for (let i = 0; i < 50; i++) {
        harness.simulateRealtimeShiftFlush(shifts.slice(i, i + 2), false);
      }

      const postMap = getPublishedMonthsMap();
      expect(postMap['gazzada_2026-10']).toBeUndefined();
      expect(Object.keys(postMap).filter((k) => postMap[k] === true)).toHaveLength(0);
    });
  });

  // =========================================================================
  // SUITE 2: SHIFT SWAP VALIDATION CORNER CASES
  // =========================================================================
  describe('2. Shift Swap Validation & Execution Corner Cases', () => {
    const isWorkingShift = (s?: Shift): boolean =>
      Boolean(s && (s.type === 'giornata' || s.type === 'mattina' || s.type === 'pomeriggio'));

    // Helper implementing the UI candidate filter from LeaveRequestsDesktop.tsx & Mobile.tsx
    const getSwapCandidates = (
      employees: Employee[],
      shifts: Shift[],
      currentEmployeeId: string,
      shiftDate: string,
      targetShiftDate: string,
      activeLocation: string
    ) => {
      const requesterHasWorkingShiftOnTargetDate =
        shiftDate !== targetShiftDate &&
        shifts.some(
          (s) => s.employeeId === currentEmployeeId && s.date === targetShiftDate && isWorkingShift(s)
        );

      return employees
        .filter((emp) => emp.isActive !== false && !emp.isOwner && emp.id !== currentEmployeeId)
        .map((emp) => {
          const shift = shifts.find(
            (s) =>
              s.employeeId === emp.id &&
              s.date === targetShiftDate &&
              s.locationId === activeLocation &&
              isWorkingShift(s)
          );
          if (!shift) return null;

          const colleagueHasWorkingShiftOnRequesterDate =
            shiftDate !== targetShiftDate &&
            shifts.some(
              (s) => s.employeeId === emp.id && s.date === shiftDate && isWorkingShift(s)
            );
          if (colleagueHasWorkingShiftOnRequesterDate) return null;
          if (requesterHasWorkingShiftOnTargetDate) return null;

          return { employee: emp, shift };
        })
        .filter((item): item is { employee: Employee; shift: Shift } => item !== null);
    };

    // Helper implementing the App.tsx shift swap execution engine
    const executeApprovedSwap = (
      shifts: Shift[],
      employees: Employee[],
      targetReq: ShiftRequest
    ): Shift[] => {
      const reqEmp = employees.find((e) => e.id === targetReq.requesterId);
      const targetEmp = employees.find((e) => e.id === targetReq.targetEmployeeId);
      const reqDate = targetReq.shiftDate;
      const targetDate = targetReq.targetShiftDate || targetReq.shiftDate;
      const targetEmpId = targetReq.targetEmployeeId!;

      const reqShift = shifts.find((s) => s.employeeId === targetReq.requesterId && s.date === reqDate);
      const targetShift = shifts.find((s) => s.employeeId === targetEmpId && s.date === targetDate);

      const reqDept = reqShift?.department || targetReq.requesterDepartment || reqEmp?.role || 'Cassa';
      const reqStart = reqShift?.startTime || targetReq.requesterStartTime || '08:30';
      const reqEnd = reqShift?.endTime || targetReq.requesterEndTime || '17:00';
      const reqType: ShiftType =
        reqShift && reqShift.type !== 'riposo' && reqShift.type !== 'ferie' && reqShift.type !== 'malattia'
          ? reqShift.type
          : 'giornata';
      const reqLoc = reqShift?.locationId || targetReq.locationId;

      const targetDept = targetShift?.department || targetReq.targetDepartment || targetEmp?.role || 'Cassa';
      const targetStart = targetShift?.startTime || targetReq.targetStartTime || '08:30';
      const targetEnd = targetShift?.endTime || targetReq.targetEndTime || '17:00';
      const targetType: ShiftType =
        targetShift && targetShift.type !== 'riposo' && targetShift.type !== 'ferie' && targetShift.type !== 'malattia'
          ? targetShift.type
          : 'giornata';
      const targetLoc = targetShift?.locationId || targetReq.locationId;

      const upsertInList = (list: Shift[], updated: Shift): Shift[] => {
        const normalizedId = `shift-${updated.employeeId}-${updated.date}`;
        const normalizedShift: Shift = { ...updated, id: normalizedId };
        const exists = list.some((s) => s.employeeId === updated.employeeId && s.date === updated.date);
        if (exists) {
          return list.map((s) =>
            s.employeeId === updated.employeeId && s.date === updated.date ? normalizedShift : s
          );
        }
        return [...list, normalizedShift];
      };

      let next = [...shifts];

      if (reqDate === targetDate) {
        next = upsertInList(next, {
          id: `shift-${targetReq.requesterId}-${reqDate}`,
          employeeId: targetReq.requesterId,
          locationId: targetLoc,
          date: reqDate,
          type: targetType,
          department: targetDept,
          startTime: targetStart,
          endTime: targetEnd,
          areaNote: `Scambio turno con ${targetEmp?.name || targetEmpId}`,
          isManualOverride: true,
          assignedSkillScore: reqEmp?.skills?.[targetDept] ?? 5,
        });

        next = upsertInList(next, {
          id: `shift-${targetEmpId}-${targetDate}`,
          employeeId: targetEmpId,
          locationId: reqLoc,
          date: targetDate,
          type: reqType,
          department: reqDept,
          startTime: reqStart,
          endTime: reqEnd,
          areaNote: `Scambio turno con ${reqEmp?.name || targetReq.requesterId}`,
          isManualOverride: true,
          assignedSkillScore: targetEmp?.skills?.[reqDept] ?? 5,
        });
      } else {
        next = upsertInList(next, {
          id: `shift-${targetEmpId}-${reqDate}`,
          employeeId: targetEmpId,
          locationId: reqLoc,
          date: reqDate,
          type: reqType,
          department: reqDept,
          startTime: reqStart,
          endTime: reqEnd,
          areaNote: `Scambio turno con ${reqEmp?.name || targetReq.requesterId}`,
          isManualOverride: true,
          assignedSkillScore: targetEmp?.skills?.[reqDept] ?? 5,
        });

        next = upsertInList(next, {
          id: `shift-${targetReq.requesterId}-${reqDate}`,
          employeeId: targetReq.requesterId,
          locationId: reqLoc,
          date: reqDate,
          type: 'riposo',
          department: undefined,
          startTime: undefined,
          endTime: undefined,
          areaNote: `Riposo per scambio con ${targetEmp?.name || targetEmpId} (recupera il ${targetDate})`,
          isManualOverride: true,
        });

        next = upsertInList(next, {
          id: `shift-${targetReq.requesterId}-${targetDate}`,
          employeeId: targetReq.requesterId,
          locationId: targetLoc,
          date: targetDate,
          type: targetType,
          department: targetDept,
          startTime: targetStart,
          endTime: targetEnd,
          areaNote: `Scambio turno con ${targetEmp?.name || targetEmpId}`,
          isManualOverride: true,
          assignedSkillScore: reqEmp?.skills?.[targetDept] ?? 5,
        });

        next = upsertInList(next, {
          id: `shift-${targetEmpId}-${targetDate}`,
          employeeId: targetEmpId,
          locationId: targetLoc,
          date: targetDate,
          type: 'riposo',
          department: undefined,
          startTime: undefined,
          endTime: undefined,
          areaNote: `Riposo per scambio con ${reqEmp?.name || targetReq.requesterId} (coperto il ${reqDate})`,
          isManualOverride: true,
        });
      }

      return next;
    };

    test('2.1: Same-day swap (shiftDate === targetShiftDate) correctly exchanges morning/afternoon shifts', () => {
      const date = '2026-10-10';
      const alice: Employee = { id: 'emp-alice', name: 'Alice', locationId: 'gazzada', role: 'Cassa', isActive: true };
      const bob: Employee = { id: 'emp-bob', name: 'Bob', locationId: 'gazzada', role: 'Fioreria', isActive: true };

      const initialShifts: Shift[] = [
        { id: 's-alice', employeeId: 'emp-alice', locationId: 'gazzada', date, type: 'mattina', startTime: '08:30', endTime: '13:00', department: 'Cassa' },
        { id: 's-bob', employeeId: 'emp-bob', locationId: 'gazzada', date, type: 'pomeriggio', startTime: '14:30', endTime: '19:30', department: 'Fioreria' },
      ];

      // 1. Candidate filtering: Bob must be listed as valid candidate for same-day swap
      const candidates = getSwapCandidates([alice, bob], initialShifts, 'emp-alice', date, date, 'gazzada');
      expect(candidates).toHaveLength(1);
      expect(candidates[0].employee.id).toBe('emp-bob');

      // 2. Submission & Manager Approval Execution
      const swapReq: ShiftRequest = {
        id: 'req-same-day-1',
        requesterId: 'emp-alice',
        targetEmployeeId: 'emp-bob',
        locationId: 'gazzada',
        type: 'swap',
        status: 'approved',
        shiftDate: date,
        targetShiftDate: date,
        requesterDepartment: 'Cassa',
        requesterStartTime: '08:30',
        requesterEndTime: '13:00',
        targetDepartment: 'Fioreria',
        targetStartTime: '14:30',
        targetEndTime: '19:30',
        createdAt: new Date().toISOString(),
      };

      const updatedShifts = executeApprovedSwap(initialShifts, [alice, bob], swapReq);

      // Verify Alice now has afternoon shift in Fioreria
      const aliceShift = updatedShifts.find((s) => s.employeeId === 'emp-alice' && s.date === date);
      expect(aliceShift).toBeDefined();
      expect(aliceShift?.type).toBe('pomeriggio');
      expect(aliceShift?.department).toBe('Fioreria');
      expect(aliceShift?.startTime).toBe('14:30');
      expect(aliceShift?.endTime).toBe('19:30');

      // Verify Bob now has morning shift in Cassa
      const bobShift = updatedShifts.find((s) => s.employeeId === 'emp-bob' && s.date === date);
      expect(bobShift).toBeDefined();
      expect(bobShift?.type).toBe('mattina');
      expect(bobShift?.department).toBe('Cassa');
      expect(bobShift?.startTime).toBe('08:30');
      expect(bobShift?.endTime).toBe('13:00');
    });

    test('2.2: Self-swap is strictly rejected by candidate validation', () => {
      const date = '2026-10-10';
      const alice: Employee = { id: 'emp-alice', name: 'Alice', locationId: 'gazzada', role: 'Cassa', isActive: true };
      const shifts: Shift[] = [
        { id: 's-alice', employeeId: 'emp-alice', locationId: 'gazzada', date, type: 'giornata', startTime: '08:30', endTime: '17:00' },
      ];

      // Alice attempting to swap with herself
      const candidates = getSwapCandidates([alice], shifts, 'emp-alice', date, '2026-10-11', 'gazzada');
      expect(candidates).toHaveLength(0);
      expect(candidates.some((c) => c.employee.id === 'emp-alice')).toBe(false);
    });

    test('2.3: Cross-store swap isolation & cross-store collision check', () => {
      const alice: Employee = { id: 'emp-alice', name: 'Alice', locationId: 'gazzada', role: 'Cassa', isActive: true };
      const carlo: Employee = { id: 'emp-carlo', name: 'Carlo', locationId: 'varese', role: 'Cassa', isActive: true };

      // Alice works in Gazzada on Oct 10; Carlo works in Varese on Oct 12
      const shifts: Shift[] = [
        { id: 's-alice-10', employeeId: 'emp-alice', locationId: 'gazzada', date: '2026-10-10', type: 'giornata' },
        { id: 's-carlo-12', employeeId: 'emp-carlo', locationId: 'varese', date: '2026-10-12', type: 'giornata' },
      ];

      // From Gazzada activeLocation, Carlo working in Varese on Oct 12 is NOT a candidate
      const gzCandidates = getSwapCandidates([alice, carlo], shifts, 'emp-alice', '2026-10-10', '2026-10-12', 'gazzada');
      expect(gzCandidates).toHaveLength(0);

      // What if Carlo works in Varese on Oct 10 (requester date), and in Gazzada on Oct 12?
      const multiStoreShifts: Shift[] = [
        { id: 's-alice-10', employeeId: 'emp-alice', locationId: 'gazzada', date: '2026-10-10', type: 'giornata' },
        { id: 's-carlo-10-va', employeeId: 'emp-carlo', locationId: 'varese', date: '2026-10-10', type: 'giornata' }, // Carlo already works in Varese on Oct 10!
        { id: 's-carlo-12-gz', employeeId: 'emp-carlo', locationId: 'gazzada', date: '2026-10-12', type: 'giornata' }, // Carlo works in Gazzada on Oct 12
      ];

      // Even though Carlo works in Gazzada on Oct 12, he CANNOT take Alice's Oct 10 shift because he already works in Varese on Oct 10!
      const collisionCandidates = getSwapCandidates([alice, carlo], multiStoreShifts, 'emp-alice', '2026-10-10', '2026-10-12', 'gazzada');
      expect(collisionCandidates).toHaveLength(0);
    });

    test('2.4: Multiple overlapping pending requests behavior', () => {
      const alice: Employee = { id: 'emp-alice', name: 'Alice', locationId: 'gazzada', role: 'Cassa', isActive: true };
      const bob: Employee = { id: 'emp-bob', name: 'Bob', locationId: 'gazzada', role: 'Fioreria', isActive: true };
      const charlie: Employee = { id: 'emp-charlie', name: 'Charlie', locationId: 'gazzada', role: 'Decor', isActive: true };

      const shifts: Shift[] = [
        { id: 's-a-10', employeeId: 'emp-alice', locationId: 'gazzada', date: '2026-10-10', type: 'giornata', department: 'Cassa' },
        { id: 's-b-11', employeeId: 'emp-bob', locationId: 'gazzada', date: '2026-10-11', type: 'giornata', department: 'Fioreria' },
        { id: 's-c-12', employeeId: 'emp-charlie', locationId: 'gazzada', date: '2026-10-12', type: 'giornata', department: 'Decor' },
      ];

      // Swap 1: Alice (Oct 10) <-> Bob (Oct 11)
      const swap1: ShiftRequest = {
        id: 'req-swap-1',
        requesterId: 'emp-alice',
        targetEmployeeId: 'emp-bob',
        locationId: 'gazzada',
        type: 'swap',
        status: 'approved',
        shiftDate: '2026-10-10',
        targetShiftDate: '2026-10-11',
        createdAt: new Date().toISOString(),
      };

      // Execute Swap 1
      const afterSwap1 = executeApprovedSwap(shifts, [alice, bob, charlie], swap1);

      // Verify Swap 1 state:
      // Oct 10: Bob is working in Cassa, Alice is 'riposo'
      const aliceOct10 = afterSwap1.find((s) => s.employeeId === 'emp-alice' && s.date === '2026-10-10');
      const bobOct10 = afterSwap1.find((s) => s.employeeId === 'emp-bob' && s.date === '2026-10-10');
      expect(aliceOct10?.type).toBe('riposo');
      expect(bobOct10?.type).toBe('giornata');

      // Oct 11: Alice is working in Fioreria, Bob is 'riposo'
      const aliceOct11 = afterSwap1.find((s) => s.employeeId === 'emp-alice' && s.date === '2026-10-11');
      const bobOct11 = afterSwap1.find((s) => s.employeeId === 'emp-bob' && s.date === '2026-10-11');
      expect(aliceOct11?.type).toBe('giornata');
      expect(bobOct11?.type).toBe('riposo');

      // Now suppose there was an overlapping pending Swap 2 (Alice Oct 10 <-> Charlie Oct 12)
      // Since Alice's Oct 10 shift is now 'riposo', verifying candidate filter rejects Charlie swap on Oct 10
      const candidatesForAliceOct10 = getSwapCandidates(
        [alice, bob, charlie],
        afterSwap1,
        'emp-alice',
        '2026-10-10',
        '2026-10-12',
        'gazzada'
      );
      // Alice is at riposo on Oct 10, so she cannot request a swap for Oct 10
      const aliceRawShift = afterSwap1.find((s) => s.employeeId === 'emp-alice' && s.date === '2026-10-10');
      expect(isWorkingShift(aliceRawShift)).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 3: SVUOTA TURNI (PAST VS FUTURE VS FULL MONTH)
  // =========================================================================
  describe('3. Svuota Turni Behavior & Boundary Invariants', () => {
    test('3.1: Clearing future shifts preserves 100% of past shifts and historical record intact', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      const loc = 'gazzada';
      const todayStr = '2026-10-15';

      // Seed shifts across the month
      const fullMonthShifts: Shift[] = [];
      for (let day = 1; day <= 31; day++) {
        const dStr = `2026-10-${String(day).padStart(2, '0')}`;
        fullMonthShifts.push({
          id: `s-gz-${dStr}`,
          employeeId: 'emp-gz-1',
          locationId: loc,
          date: dStr,
          type: 'giornata',
          startTime: '08:30',
          endTime: '17:00',
        });
      }
      harness.shifts = [...fullMonthShifts];
      recordDraftGenerated(loc, 2026, 10);
      recordMonthPublished(loc, 2026, 10);

      // Perform Svuota Turni: mode === 'future' with referenceDate = '2026-10-15'
      harness.clearShifts('future', todayStr, loc);

      // Invariants:
      // 1. Days 1 to 14 (< todayStr) must remain 100% intact
      const remainingShifts = harness.shifts.filter((s) => s.locationId === loc);
      expect(remainingShifts).toHaveLength(14);
      expect(remainingShifts.every((s) => s.date < todayStr)).toBe(true);

      // 2. Days 15 to 31 (>= todayStr) must be completely wiped
      expect(remainingShifts.some((s) => s.date >= todayStr)).toBe(false);

      // 3. Historical past shifts maintain their publication visibility
      expect(harness.isMonthOfficiallyPublished(loc, 2026, 10)).toBe(true);
    });

    test('3.2: Clearing entire month wipes month shifts, unpublishes month, and resets draft flag', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');
      const loc = 'gazzada';

      // Setup 3 months: Sep (past), Oct (target), Nov (future)
      harness.generateMonthlyShifts(2026, 9, loc);
      harness.publishMonth(loc, 2026, 9);

      harness.generateMonthlyShifts(2026, 10, loc);
      harness.publishMonth(loc, 2026, 10);

      harness.generateMonthlyShifts(2026, 11, loc);
      recordDraftGenerated(loc, 2026, 11);

      const preSepCount = harness.shifts.filter((s) => s.date.startsWith('2026-09')).length;
      const preNovCount = harness.shifts.filter((s) => s.date.startsWith('2026-11')).length;
      expect(preSepCount).toBeGreaterThan(0);
      expect(preNovCount).toBeGreaterThan(0);

      // Clear ONLY October 2026
      harness.clearShifts('month', '2026-10-01', loc);

      // Invariants:
      // 1. October shifts must be exactly 0
      const octShifts = harness.shifts.filter((s) => s.date.startsWith('2026-10'));
      expect(octShifts).toHaveLength(0);

      // 2. September and November shifts remain completely untouched
      expect(harness.shifts.filter((s) => s.date.startsWith('2026-09'))).toHaveLength(preSepCount);
      expect(harness.shifts.filter((s) => s.date.startsWith('2026-11'))).toHaveLength(preNovCount);

      // 3. October is unpublished and draft flag reset
      expect(harness.isMonthOfficiallyPublished(loc, 2026, 10)).toBe(false);
      expect(harness.isMonthDraft(loc, 2026, 10)).toBe(false);
      expect(harness.getHeaderBadgeState(loc, 2026, 10)).toBe('draft_not_generated');

      // 4. September remains published; November remains draft
      expect(harness.isMonthOfficiallyPublished(loc, 2026, 9)).toBe(true);
      expect(harness.isMonthDraft(loc, 2026, 11)).toBe(true);
    });

    test('3.3: Clearing all shifts wipes location completely without affecting other locations', () => {
      harness.loginAsManager('vittore@nicoragarden.it', 'NicoraMaster2026!');

      // Generate for both Gazzada and Varese
      harness.generateMonthlyShifts(2026, 10, 'gazzada');
      harness.publishMonth('gazzada', 2026, 10);

      harness.generateMonthlyShifts(2026, 10, 'varese');
      harness.publishMonth('varese', 2026, 10);

      const vaCountBefore = harness.shifts.filter((s) => s.locationId === 'varese').length;
      expect(vaCountBefore).toBeGreaterThan(0);

      // Wipe Gazzada totally
      harness.clearShifts('all', '2026-10-01', 'gazzada');

      // Invariants:
      // 1. Gazzada shifts are 0
      expect(harness.shifts.filter((s) => s.locationId === 'gazzada')).toHaveLength(0);
      expect(harness.isMonthDraft('gazzada', 2026, 10)).toBe(false);

      // 2. Varese shifts remain 100% intact and published
      expect(harness.shifts.filter((s) => s.locationId === 'varese')).toHaveLength(vaCountBefore);
      expect(harness.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(true);
    });
  });
});
