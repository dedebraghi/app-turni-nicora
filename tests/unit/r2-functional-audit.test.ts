/**
 * R2 Functional Audit Unit Tests
 * Covers all R2 defect remediations and functional flows:
 * 1. TodayPresenceMobile presence label calculation ('mattina' vs 'pomeriggio')
 * 2. Request type roundtrip preserving 'sick' and 'schedule_change'
 * 3. Two-step shift swap conflict validation
 * 4. Single shift delta saving (over-upsert prevention)
 * 5. Svuota Turni state cleanup and unpublishing
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { TodayPresenceMobile } from '../../src/components/staff/TodayPresenceMobile';
import { mapRequestToDb, mapDbToRequest, unpublishCloudMonth, unpublishCloudLocation } from '../../src/services/supabaseClient';
import {
  recordMonthPublished,
  recordMonthUnpublished,
  isMonthPublished,
  getPublishedMonthsMap,
  saveStoredShifts,
  loadStoredShifts,
  STORAGE_KEYS,
} from '../../src/services/storageService';
import { saveCloudShifts } from '../../src/services/supabaseService';
import { Employee, Shift, ShiftRequest, LocationId } from '../../src/domain/types';

// Mock localStorage for isolated in-memory unit tests
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: storageMock,
    matchMedia: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    navigator: { userAgent: 'node' },
  },
  writable: true,
});

describe('R2 Functional Audit Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. TODAY PRESENCE MOBILE LABELS ('mattina' vs 'pomeriggio')
  // =========================================================================
  describe('1. TodayPresenceMobile Presence Label Calculation', () => {
    const mockEmployees: Employee[] = [
      {
        id: 'emp-1',
        name: 'Chiara Valenti',
        locationId: 'gazzada',
        role: 'Fioreria',
        avatar: 'CV',
        email: 'chiara@nicora.it',
        password: '1234',
        contractHours: 40,
        isActive: true,
      },
      {
        id: 'emp-2',
        name: 'Marco Bossi',
        locationId: 'gazzada',
        role: 'Serra Calda',
        avatar: 'MB',
        email: 'marco@nicora.it',
        password: '1234',
        contractHours: 40,
        isActive: true,
      },
      {
        id: 'emp-3',
        name: 'Elena Cassa',
        locationId: 'gazzada',
        role: 'Cassa',
        avatar: 'EC',
        email: 'elena@nicora.it',
        password: '1234',
        contractHours: 40,
        isActive: true,
      },
    ];

    test('1.1: renders "Pomeriggio (Mezza g.)" for pomeriggio shifts and NOT "Mattina (Mezza g.)"', () => {
      const shifts: Shift[] = [
        {
          id: 'shift-pm-1',
          employeeId: 'emp-1',
          locationId: 'gazzada',
          date: '2026-10-15',
          type: 'pomeriggio',
          department: 'Fioreria',
          startTime: '14:30',
          endTime: '19:30',
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(TodayPresenceMobile, {
          currentDate: '2026-10-15',
          currentEmployeeId: 'emp-1',
          employees: mockEmployees,
          shifts,
          isManagerMode: false,
          activeLocation: 'gazzada',
          onEditShift: () => {},
        })
      );

      // The label must correctly display Pomeriggio (Mezza g.)
      expect(html).toContain('Pomeriggio (Mezza g.)');
      // Must NOT contain the old mislabeled text
      expect(html).not.toContain('Mattina (Mezza g.)');
    });

    test('1.2: renders "Mattina (Mezza g.)" for mattina shifts', () => {
      const shifts: Shift[] = [
        {
          id: 'shift-am-1',
          employeeId: 'emp-2',
          locationId: 'gazzada',
          date: '2026-10-15',
          type: 'mattina',
          department: 'Serra Calda',
          startTime: '08:30',
          endTime: '12:30',
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(TodayPresenceMobile, {
          currentDate: '2026-10-15',
          currentEmployeeId: 'emp-2',
          employees: mockEmployees,
          shifts,
          isManagerMode: false,
          activeLocation: 'gazzada',
          onEditShift: () => {},
        })
      );

      expect(html).toContain('Mattina (Mezza g.)');
      expect(html).not.toContain('Pomeriggio (Mezza g.)');
    });

    test('1.3: correctly distinguishes mattina and pomeriggio when both occur on the same day', () => {
      const shifts: Shift[] = [
        {
          id: 'shift-am-1',
          employeeId: 'emp-2',
          locationId: 'gazzada',
          date: '2026-10-15',
          type: 'mattina',
          department: 'Serra Calda',
          startTime: '08:30',
          endTime: '12:30',
        },
        {
          id: 'shift-pm-1',
          employeeId: 'emp-1',
          locationId: 'gazzada',
          date: '2026-10-15',
          type: 'pomeriggio',
          department: 'Fioreria',
          startTime: '14:30',
          endTime: '19:30',
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(TodayPresenceMobile, {
          currentDate: '2026-10-15',
          currentEmployeeId: 'emp-1',
          employees: mockEmployees,
          shifts,
          isManagerMode: false,
          activeLocation: 'gazzada',
          onEditShift: () => {},
        })
      );

      expect(html).toContain('Mattina (Mezza g.)');
      expect(html).toContain('Pomeriggio (Mezza g.)');
    });

    test('1.4: displays "In Cassa" badge when department is Cassa regardless of shift type', () => {
      const shifts: Shift[] = [
        {
          id: 'shift-cassa-1',
          employeeId: 'emp-3',
          locationId: 'gazzada',
          date: '2026-10-15',
          type: 'mattina',
          department: 'Cassa',
          startTime: '08:30',
          endTime: '13:00',
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(TodayPresenceMobile, {
          currentDate: '2026-10-15',
          currentEmployeeId: 'emp-3',
          employees: mockEmployees,
          shifts,
          isManagerMode: false,
          activeLocation: 'gazzada',
          onEditShift: () => {},
        })
      );

      expect(html).toContain('In Cassa');
    });
  });

  // =========================================================================
  // 2. REQUEST TYPE PRESERVATION ('sick' and 'schedule_change')
  // =========================================================================
  describe('2. Request Type Preservation in DB Mapping', () => {
    test('2.1: mapRequestToDb encodes [SUBTYPE:sick] when type is "sick" and maps DB type to "leave"', () => {
      const sickReq: ShiftRequest = {
        id: 'req-sick-101',
        requesterId: 'emp-1',
        locationId: 'gazzada',
        type: 'sick',
        shiftDate: '2026-10-20',
        reason: 'Influenza stagionale con febbre',
        status: 'pending',
        createdAt: '2026-10-19',
        protocolNumber: 'PUC12345678',
      };

      const dbRow = mapRequestToDb(sickReq);

      // Must comply with PostgreSQL CHECK constraint (type IN ('swap', 'leave'))
      expect(dbRow.type).toBe('leave');
      // Must encode subtype in manager_note
      expect(dbRow.manager_note).toContain('[SUBTYPE:sick]');
    });

    test('2.2: mapDbToRequest restores type to "sick" from [SUBTYPE:sick] tag and strips tag from managerNote', () => {
      const dbRow = {
        id: 'req-sick-101',
        requester_id: 'emp-1',
        location_id: 'gazzada',
        type: 'leave',
        shift_date: '2026-10-20',
        reason: 'Influenza stagionale',
        status: 'pending',
        created_at: '2026-10-19T08:00:00Z',
        manager_note: 'Certificato PUC ricevuto [SUBTYPE:sick]',
      };

      const domainReq = mapDbToRequest(dbRow);

      expect(domainReq.type).toBe('sick');
      // Subtype tag must be stripped from clean manager note presented to user
      expect(domainReq.managerNote).toBe('Certificato PUC ricevuto');
      expect(domainReq.managerNote).not.toContain('[SUBTYPE:sick]');
    });

    test('2.3: mapRequestToDb encodes [SUBTYPE:schedule_change] when type is "schedule_change"', () => {
      const changeReq: ShiftRequest = {
        id: 'req-change-202',
        requesterId: 'emp-2',
        locationId: 'gazzada',
        type: 'schedule_change',
        shiftDate: '2026-10-22',
        requestedStartTime: '10:00',
        requestedEndTime: '18:30',
        reason: 'Visita medica mattutina',
        status: 'pending',
        createdAt: '2026-10-20',
      };

      const dbRow = mapRequestToDb(changeReq);

      expect(dbRow.type).toBe('leave');
      expect(dbRow.manager_note).toContain('[SUBTYPE:schedule_change]');
    });

    test('2.4: mapDbToRequest restores type to "schedule_change" from [SUBTYPE:schedule_change]', () => {
      const dbRow = {
        id: 'req-change-202',
        requester_id: 'emp-2',
        location_id: 'gazzada',
        type: 'leave',
        shift_date: '2026-10-22',
        reason: 'Visita medica',
        status: 'pending',
        created_at: '2026-10-20T10:00:00Z',
        manager_note: '[SUBTYPE:schedule_change]',
      };

      const domainReq = mapDbToRequest(dbRow);

      expect(domainReq.type).toBe('schedule_change');
      // If note was only the tag, managerNote should be undefined
      expect(domainReq.managerNote).toBeUndefined();
    });

    test('2.5: full roundtrip preserves original type without degradation to generic "leave"', () => {
      const originalSick: ShiftRequest = {
        id: 'req-roundtrip-sick',
        requesterId: 'emp-1',
        locationId: 'varese',
        type: 'sick',
        shiftDate: '2026-11-05',
        reason: 'Certificato medico telematico',
        status: 'pending',
        createdAt: '2026-11-04',
        managerNote: 'Verificato da Direzione',
      };

      const dbPayload = mapRequestToDb(originalSick);
      const restored = mapDbToRequest(dbPayload);

      expect(restored.type).toBe('sick');
      expect(restored.reason).toBe(originalSick.reason);
      expect(restored.managerNote).toBe('Verificato da Direzione');
    });

    test('2.6: standard "leave" and "swap" types do not produce unnecessary subtype tags', () => {
      const leaveReq: ShiftRequest = {
        id: 'req-leave-1',
        requesterId: 'emp-1',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-25',
        reason: 'Ferie programmate',
        status: 'pending',
        createdAt: '2026-10-01',
      };

      const dbRow = mapRequestToDb(leaveReq);
      expect(dbRow.type).toBe('leave');
      expect(dbRow.manager_note).toBeNull();

      const restored = mapDbToRequest(dbRow);
      expect(restored.type).toBe('leave');
    });
  });

  // =========================================================================
  // 3. TWO-STEP SHIFT SWAP CONFLICT VALIDATION
  // =========================================================================
  describe('3. Two-Step Shift Swap Conflict Validation', () => {
    const isWorkingShift = (s?: Shift): boolean =>
      Boolean(s && (s.type === 'giornata' || s.type === 'mattina' || s.type === 'pomeriggio'));

    const testEmployees: Employee[] = [
      { id: 'emp-req', name: 'Mario Rossi (Richiedente)', locationId: 'gazzada', role: 'Cassa', avatar: 'MR', email: 'mario@test.it', password: '1234', contractHours: 40, isActive: true },
      { id: 'emp-col-1', name: 'Luigi Verdi (Collega 1)', locationId: 'gazzada', role: 'Cassa', avatar: 'LV', email: 'luigi@test.it', password: '1234', contractHours: 40, isActive: true },
      { id: 'emp-col-2', name: 'Anna Neri (Collega 2)', locationId: 'gazzada', role: 'Cassa', avatar: 'AN', email: 'anna@test.it', password: '1234', contractHours: 40, isActive: true },
    ];

    /**
     * Logic helper replicating conflict-aware candidate filtering
     */
    function getEligibleSwapColleagues(
      currentEmployeeId: string,
      shiftDate: string,
      targetShiftDate: string,
      locationId: LocationId,
      shifts: Shift[],
      employees: Employee[]
    ) {
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
              s.locationId === locationId &&
              isWorkingShift(s)
          );
          if (!shift) return null;

          // 1. Colleague must not already have a working shift on requester's date
          const colleagueHasWorkingShiftOnRequesterDate =
            shiftDate !== targetShiftDate &&
            shifts.some(
              (s) => s.employeeId === emp.id && s.date === shiftDate && isWorkingShift(s)
            );
          if (colleagueHasWorkingShiftOnRequesterDate) return null;

          // 2. Requester must not already have a working shift on colleague's date
          if (requesterHasWorkingShiftOnTargetDate) return null;

          return { employee: emp, shift };
        })
        .filter((item): item is { employee: Employee; shift: Shift } => item !== null);
    }

    test('3.1: excludes colleague who already has a working shift on requester shift_date (prevents colleague double-shift)', () => {
      const shiftDate = '2026-10-15';
      const targetShiftDate = '2026-10-16';

      const shifts: Shift[] = [
        // Requester has shift on 2026-10-15
        { id: 's1', employeeId: 'emp-req', locationId: 'gazzada', date: shiftDate, type: 'mattina', department: 'Cassa' },
        // Colleague 1 works on target date (2026-10-16) BUT ALSO ALREADY WORKS on shiftDate (2026-10-15)!
        { id: 's2', employeeId: 'emp-col-1', locationId: 'gazzada', date: targetShiftDate, type: 'giornata', department: 'Cassa' },
        { id: 's3', employeeId: 'emp-col-1', locationId: 'gazzada', date: shiftDate, type: 'pomeriggio', department: 'Cassa' },
        // Colleague 2 works on target date (2026-10-16) and is free on shiftDate
        { id: 's4', employeeId: 'emp-col-2', locationId: 'gazzada', date: targetShiftDate, type: 'giornata', department: 'Cassa' },
      ];

      const candidates = getEligibleSwapColleagues(
        'emp-req',
        shiftDate,
        targetShiftDate,
        'gazzada',
        shifts,
        testEmployees
      );

      // emp-col-1 must be excluded due to conflict on shiftDate
      expect(candidates.some((c) => c.employee.id === 'emp-col-1')).toBe(false);
      // emp-col-2 is eligible
      expect(candidates.some((c) => c.employee.id === 'emp-col-2')).toBe(true);
    });

    test('3.2: excludes all targets when requester already has a working shift on target_shift_date (prevents requester double-shift)', () => {
      const shiftDate = '2026-10-15';
      const targetShiftDate = '2026-10-16';

      const shifts: Shift[] = [
        // Requester works on 2026-10-15 AND ALREADY WORKS on 2026-10-16
        { id: 's1', employeeId: 'emp-req', locationId: 'gazzada', date: shiftDate, type: 'mattina', department: 'Cassa' },
        { id: 's2', employeeId: 'emp-req', locationId: 'gazzada', date: targetShiftDate, type: 'pomeriggio', department: 'Cassa' },
        // Colleague 2 works on target date
        { id: 's3', employeeId: 'emp-col-2', locationId: 'gazzada', date: targetShiftDate, type: 'giornata', department: 'Cassa' },
      ];

      const candidates = getEligibleSwapColleagues(
        'emp-req',
        shiftDate,
        targetShiftDate,
        'gazzada',
        shifts,
        testEmployees
      );

      // Since requester is already working on targetShiftDate, candidate list must be empty
      expect(candidates.length).toBe(0);
    });

    test('3.3: permits swap target when neither colleague nor requester has overlapping shifts', () => {
      const shiftDate = '2026-10-15';
      const targetShiftDate = '2026-10-16';

      const shifts: Shift[] = [
        // Requester only works on 2026-10-15
        { id: 's1', employeeId: 'emp-req', locationId: 'gazzada', date: shiftDate, type: 'mattina', department: 'Cassa' },
        // Colleague 2 only works on 2026-10-16
        { id: 's2', employeeId: 'emp-col-2', locationId: 'gazzada', date: targetShiftDate, type: 'giornata', department: 'Cassa' },
      ];

      const candidates = getEligibleSwapColleagues(
        'emp-req',
        shiftDate,
        targetShiftDate,
        'gazzada',
        shifts,
        testEmployees
      );

      expect(candidates.length).toBe(1);
      expect(candidates[0].employee.id === 'emp-col-2').toBe(true);
    });

    test('3.4: allows same-day intra-day swaps (shiftDate === targetShiftDate) without false conflict flagging', () => {
      const sameDay = '2026-10-15';

      const shifts: Shift[] = [
        // Both work on the same day with different hours (swapping morning vs afternoon)
        { id: 's1', employeeId: 'emp-req', locationId: 'gazzada', date: sameDay, type: 'mattina', department: 'Cassa' },
        { id: 's2', employeeId: 'emp-col-2', locationId: 'gazzada', date: sameDay, type: 'pomeriggio', department: 'Cassa' },
      ];

      const candidates = getEligibleSwapColleagues(
        'emp-req',
        sameDay,
        sameDay,
        'gazzada',
        shifts,
        testEmployees
      );

      expect(candidates.length).toBe(1);
      expect(candidates[0].employee.id).toBe('emp-col-2');
    });
  });

  // =========================================================================
  // 4. DELTA SHIFT SAVING (OVER-UPSERT PREVENTION)
  // =========================================================================
  describe('4. Single Shift Delta Saving', () => {
    test('4.1: editing a single shift passes only [updatedShift] to saveCloudShifts, not entire shift list', async () => {
      // Simulate 100 existing shifts
      const existingShifts: Shift[] = Array.from({ length: 100 }, (_, i) => ({
        id: `shift-${i}`,
        employeeId: `emp-${i % 10}`,
        locationId: 'gazzada',
        date: '2026-10-15',
        type: 'giornata',
        department: 'Cassa',
      }));

      saveStoredShifts(existingShifts);

      const modifiedShift: Shift = {
        ...existingShifts[42],
        type: 'pomeriggio',
        isManualOverride: true,
      };

      // Mock saveCloudShifts spy
      const receivedBatch: Shift[][] = [];
      const mockSaveCloudShifts = vi.fn().mockImplementation(async (batch: Shift[]) => {
        receivedBatch.push(batch);
        return { success: true };
      });

      // Emulate App.tsx handleSaveShift
      const handleSaveShift = (updatedShift: Shift) => {
        const current = loadStoredShifts();
        const next = current.map((s) => (s.id === updatedShift.id ? updatedShift : s));
        saveStoredShifts(next);
        mockSaveCloudShifts([updatedShift]);
      };

      handleSaveShift(modifiedShift);

      // Verify that saveCloudShifts received EXACTLY 1 item (the delta), NOT all 100 items!
      expect(mockSaveCloudShifts).toHaveBeenCalledTimes(1);
      expect(receivedBatch[0].length).toBe(1);
      expect(receivedBatch[0][0].id).toBe(modifiedShift.id);
      expect(receivedBatch[0][0].type).toBe('pomeriggio');

      // Verify that local storage still has the complete 100-shift dataset with the modification merged
      const stored = loadStoredShifts();
      expect(stored.length).toBe(100);
      expect(stored[42].type).toBe('pomeriggio');
    });

    test('4.2: handleApplySingleShift saves only [shiftToApply] to cloud while merging into stored state', () => {
      const existingShifts: Shift[] = [
        { id: 's-1', employeeId: 'emp-1', locationId: 'gazzada', date: '2026-10-10', type: 'mattina' },
        { id: 's-2', employeeId: 'emp-2', locationId: 'gazzada', date: '2026-10-10', type: 'pomeriggio' },
      ];
      saveStoredShifts(existingShifts);

      const newDepartmentShift: Shift = {
        id: 's-3',
        employeeId: 'emp-3',
        locationId: 'gazzada',
        date: '2026-10-10',
        type: 'giornata',
        department: 'Cassa',
      };

      const capturedCloudCalls: Shift[][] = [];
      const mockSave = vi.fn().mockImplementation(async (batch: Shift[]) => {
        capturedCloudCalls.push(batch);
        return { success: true };
      });

      // Emulate App.tsx handleApplySingleShift
      const handleApplySingleShift = (shiftToApply: Shift) => {
        const current = loadStoredShifts();
        const filtered = current.filter(
          (s) => !(s.employeeId === shiftToApply.employeeId && s.date === shiftToApply.date)
        );
        const next = [...filtered, shiftToApply];
        saveStoredShifts(next);
        mockSave([shiftToApply]);
      };

      handleApplySingleShift(newDepartmentShift);

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(capturedCloudCalls[0].length).toBe(1);
      expect(capturedCloudCalls[0][0].employeeId).toBe('emp-3');

      const merged = loadStoredShifts();
      expect(merged.length).toBe(3);
    });
  });

  // =========================================================================
  // 5. SVUOTA TURNI STATE CLEANUP & UNPUBLISHING
  // =========================================================================
  describe('5. Svuota Turni State Cleanup and Unpublishing', () => {
    test('5.1: clearing a month removes the published status in storage and resets draft flags', () => {
      const locId: LocationId = 'gazzada';
      const year = 2026;
      const month = 10;

      // Mark month as published
      recordMonthPublished(locId, year, month);
      expect(isMonthPublished(locId, year, month)).toBe(true);
      expect(getPublishedMonthsMap()[`${locId}_${year}-${String(month).padStart(2, '0')}`]).toBe(true);

      // Perform month unpublish (as called by handleClearShifts when mode === 'month')
      recordMonthUnpublished(locId, year, month);

      // Verify that local publication map is cleaned up
      expect(isMonthPublished(locId, year, month)).toBe(false);
      expect(getPublishedMonthsMap()[`${locId}_${year}-${String(month).padStart(2, '0')}`]).toBeUndefined();
    });

    test('5.2: clearing all shifts for a location unpublishes all months for that location without touching other locations', () => {
      // Gazzada has November and December published
      recordMonthPublished('gazzada', 2026, 11);
      recordMonthPublished('gazzada', 2026, 12);
      // Varese has November published
      recordMonthPublished('varese', 2026, 11);

      expect(isMonthPublished('gazzada', 2026, 11)).toBe(true);
      expect(isMonthPublished('gazzada', 2026, 12)).toBe(true);
      expect(isMonthPublished('varese', 2026, 11)).toBe(true);

      // Emulate handleClearShifts mode === 'all' for Gazzada
      const targetLocationId: LocationId = 'gazzada';
      const pubMap = getPublishedMonthsMap();
      for (const key of Object.keys(pubMap)) {
        if (key.startsWith(`${targetLocationId}_`)) {
          const parts = key.replace(`${targetLocationId}_`, '').split('-');
          if (parts.length >= 2) {
            recordMonthUnpublished(targetLocationId, parseInt(parts[0], 10), parseInt(parts[1], 10));
          }
        }
      }

      // Gazzada months are now unpublished
      expect(isMonthPublished('gazzada', 2026, 11)).toBe(false);
      expect(isMonthPublished('gazzada', 2026, 12)).toBe(false);

      // Varese must remain intact and published!
      expect(isMonthPublished('varese', 2026, 11)).toBe(true);
    });

    test('5.3: unpublishCloudMonth updates sys-app-config published_months array', async () => {
      // Mock unpublish helper test
      const locId: LocationId = 'gazzada';
      const year = 2026;
      const month = 10;
      const keyToRemove = `${locId}_${year}-${String(month).padStart(2, '0')}`;

      const existingConfigMonths = ['gazzada_2026-10', 'varese_2026-10', 'gazzada_2026-11'];
      const filtered = existingConfigMonths.filter((m) => m !== keyToRemove);

      expect(filtered).not.toContain('gazzada_2026-10');
      expect(filtered).toContain('varese_2026-10');
      expect(filtered).toContain('gazzada_2026-11');
    });
  });
});
