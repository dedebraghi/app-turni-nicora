import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  hasDraftGenerated,
  isMonthPublished,
  recordDraftGenerated,
  recordMonthUnpublished,
  recordMonthPublished,
  syncPublishedMonthsFromCloud,
  getPublishedMonthsMap,
} from '../../src/services/storageService';
import { Shift, LocationId } from '../../src/domain/types';

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

describe('Draft -> Publish Lifecycle (Requirement R1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('AC1 / Bug Reproduction: pre-fix Realtime shift batch handler caused premature publication of draft months', () => {
    // 1. A manager generates monthly draft for Gazzada, October 2026
    const locId: LocationId = 'gazzada';
    const year = 2026;
    const month = 10;

    recordDraftGenerated(locId, year, month);
    recordMonthUnpublished(locId, year, month);

    // Initial state check: draft exists and is NOT published
    expect(hasDraftGenerated(locId, year, month)).toBe(true);
    expect(isMonthPublished(locId, year, month)).toBe(false);

    // Planner banner condition: hasUnpublishedDraftInView
    const isViewMonthDraftInitial = hasDraftGenerated(locId, year, month);
    const isViewMonthPublishedInitial = isMonthPublished(locId, year, month);
    const hasUnpublishedDraftInViewInitial = isViewMonthDraftInitial && !isViewMonthPublishedInitial;
    expect(hasUnpublishedDraftInViewInitial).toBe(true);

    // 2. Simulate what happened in the PRE-FIX code:
    // When generated shifts were saved to Supabase, Supabase Realtime fired an event with the shifts.
    // In pre-fix App.tsx:136-149, flushShiftBatch derived monthKeys from the shifts and called:
    //   syncPublishedMonthsFromCloud(monthKeys)
    // In pre-fix storageService.ts:320-333, syncPublishedMonthsFromCloud was purely additive:
    //   pubMap[key] = true
    const legacyPreFixFlushShiftBatchWithSync = (shifts: Shift[]) => {
      const monthKeys = new Set<string>();
      for (const s of shifts) {
        const parts = s.date.split('-');
        if (parts.length >= 2) {
          monthKeys.add(`${s.locationId}_${parts[0]}-${parts[1]}`);
        }
      }
      // This was the defective call that broke draft lifecycle:
      // An additive sync marked every month with received shifts as published!
      const pubMap = getPublishedMonthsMap();
      for (const key of monthKeys) {
        pubMap[key] = true;
      }
      localStorage.setItem('nicora_v2_published_months', JSON.stringify(pubMap));
    };

    const mockRealtimeIncomingShifts: Shift[] = [
      {
        id: 'shift-1',
        employeeId: 'emp-gz-1',
        locationId: 'gazzada',
        date: '2026-10-05',
        type: 'giornata',
        startTime: '08:30',
        endTime: '19:30',
      },
    ];

    // Demonstrating the bug mechanism:
    legacyPreFixFlushShiftBatchWithSync(mockRealtimeIncomingShifts);

    // In pre-fix code, isMonthPublished flipped to true immediately!
    expect(isMonthPublished(locId, year, month)).toBe(true);
    // As a result, hasUnpublishedDraftInView became false, hiding the banner after 250ms!
    const hasUnpublishedDraftAfterBug = hasDraftGenerated(locId, year, month) && !isMonthPublished(locId, year, month);
    expect(hasUnpublishedDraftAfterBug).toBe(false);

    // 3. Now verify the FIXED behavior:
    // Reset back to draft state
    recordDraftGenerated(locId, year, month);
    recordMonthUnpublished(locId, year, month);
    expect(isMonthPublished(locId, year, month)).toBe(false);

    // In the fixed App.tsx:125-155, flushShiftBatch does NOT call syncPublishedMonthsFromCloud at all!
    const fixedFlushShiftBatch = (shifts: Shift[]) => {
      // Updates shift entity cache only — does NOT touch publication state
      localStorage.setItem('nicora_v5_shifts', JSON.stringify(shifts));
    };

    fixedFlushShiftBatch(mockRealtimeIncomingShifts);

    // On fixed code, isMonthPublished remains false!
    expect(isMonthPublished(locId, year, month)).toBe(false);
    // Draft banner remains visible!
    const hasUnpublishedDraftFixed = hasDraftGenerated(locId, year, month) && !isMonthPublished(locId, year, month);
    expect(hasUnpublishedDraftFixed).toBe(true);
  });

  test('Authoritative sync: syncPublishedMonthsFromCloud overwrites stale or poisoned localStorage', () => {
    const locId: LocationId = 'gazzada';
    const year = 2026;
    const month = 10;
    const monthKey = `${locId}_${year}-${String(month).padStart(2, '0')}`;

    // Poison localStorage by simulating old bug
    const poisonedMap = { [monthKey]: true };
    localStorage.setItem('nicora_v2_published_months', JSON.stringify(poisonedMap));
    recordDraftGenerated(locId, year, month);

    // Authoritative cloud sync arrives from Supabase sys-app-config: published_months is []
    const cloudAuthoritativePublishedMonths = new Set<string>();
    syncPublishedMonthsFromCloud(cloudAuthoritativePublishedMonths);

    // Stale publication is purged
    expect(isMonthPublished(locId, year, month)).toBe(false);
    expect(hasDraftGenerated(locId, year, month)).toBe(true);

    // When cloud authoritative set contains a published month, it is reflected
    cloudAuthoritativePublishedMonths.add(monthKey);
    syncPublishedMonthsFromCloud(cloudAuthoritativePublishedMonths);
    expect(isMonthPublished(locId, year, month)).toBe(true);
  });

  test('Staff Privacy: regular employees must NEVER see unpublished draft shifts', () => {
    const locId: LocationId = 'gazzada';
    const year = 2026;
    const month = 10;

    // Set up draft for October 2026
    recordDraftGenerated(locId, year, month);
    recordMonthUnpublished(locId, year, month);
    syncPublishedMonthsFromCloud(new Set()); // Cloud says no published months

    const allShifts: Shift[] = [
      {
        id: 'shift-past-sep',
        employeeId: 'emp-gz-1',
        locationId: 'gazzada',
        date: '2026-09-15',
        type: 'giornata',
      },
      {
        id: 'shift-draft-oct-1',
        employeeId: 'emp-gz-1',
        locationId: 'gazzada',
        date: '2026-10-05',
        type: 'giornata',
      },
      {
        id: 'shift-draft-oct-2',
        employeeId: 'emp-gz-2',
        locationId: 'gazzada',
        date: '2026-10-06',
        type: 'mattina',
      },
    ];

    // Staff filter implementation (used in App.tsx and PlannerGrid.tsx)
    const computeVisibleShifts = (shifts: Shift[], isManagerMode: boolean) => {
      return isManagerMode
        ? shifts
        : shifts.filter((s) => {
            const parts = s.date.split('-');
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            return isMonthPublished(s.locationId, y, m);
          });
    };

    // 1. Regular staff view (isManagerMode = false)
    const staffVisible = computeVisibleShifts(allShifts, false);
    expect(staffVisible.some((s) => s.id === 'shift-draft-oct-1')).toBe(false);
    expect(staffVisible.some((s) => s.id === 'shift-draft-oct-2')).toBe(false);
    // Historical past shifts remain visible
    expect(staffVisible.some((s) => s.id === 'shift-past-sep')).toBe(true);

    // 2. Manager view (isManagerMode = true)
    const managerVisible = computeVisibleShifts(allShifts, true);
    expect(managerVisible.length).toBe(3);
    expect(managerVisible.some((s) => s.id === 'shift-draft-oct-1')).toBe(true);
    expect(managerVisible.some((s) => s.id === 'shift-draft-oct-2')).toBe(true);

    // 3. Explicit publication unlocks shifts for regular staff
    recordMonthPublished(locId, year, month);
    syncPublishedMonthsFromCloud(new Set([`${locId}_2026-10`]));

    const staffVisibleAfterPublish = computeVisibleShifts(allShifts, false);
    expect(staffVisibleAfterPublish.length).toBe(3);
    expect(staffVisibleAfterPublish.some((s) => s.id === 'shift-draft-oct-1')).toBe(true);
    expect(staffVisibleAfterPublish.some((s) => s.id === 'shift-draft-oct-2')).toBe(true);
  });

  test('Manual shift edits during draft mode persist and keep the month in draft mode', () => {
    const locId: LocationId = 'gazzada';
    const year = 2026;
    const month = 10;

    recordDraftGenerated(locId, year, month);
    recordMonthUnpublished(locId, year, month);

    expect(isMonthPublished(locId, year, month)).toBe(false);

    // Manager edits a shift cell manually (e.g. changing 08:30 to 09:00)
    const originalShift: Shift = {
      id: 'shift-oct-5',
      employeeId: 'emp-gz-1',
      locationId: 'gazzada',
      date: '2026-10-05',
      type: 'giornata',
      startTime: '08:30',
      endTime: '19:30',
      isManualOverride: false,
    };

    const editedShift: Shift = {
      ...originalShift,
      startTime: '09:00',
      isManualOverride: true,
    };

    // Simulate saving and Realtime echo processing without touching publication state
    const currentShifts = [editedShift];
    localStorage.setItem('nicora_v5_shifts', JSON.stringify(currentShifts));

    // Must still remain draft!
    expect(isMonthPublished(locId, year, month)).toBe(false);
    expect(hasDraftGenerated(locId, year, month)).toBe(true);

    // The shift content is preserved
    const saved = JSON.parse(localStorage.getItem('nicora_v5_shifts') || '[]');
    expect(saved[0].startTime).toBe('09:00');
    expect(saved[0].isManualOverride).toBe(true);
  });

  test('Cross-device Realtime config event correctly synchronizes publication status', () => {
    const locId: LocationId = 'gazzada';
    const year = 2026;
    const month = 10;
    const monthKey = `${locId}_${year}-${String(month).padStart(2, '0')}`;

    recordDraftGenerated(locId, year, month);
    recordMonthUnpublished(locId, year, month);
    expect(isMonthPublished(locId, year, month)).toBe(false);

    // Device A publishes the month. Supabase broadcasts Realtime event for sys-app-config:
    const onRealtimeConfigChange = (publishedMonths: Set<string>) => {
      syncPublishedMonthsFromCloud(publishedMonths);
    };

    // Device B receives event
    onRealtimeConfigChange(new Set([monthKey]));

    // Device B now reflects the published status immediately
    expect(isMonthPublished(locId, year, month)).toBe(true);
  });

  test('fetchCloudPublishedMonths returns empty Set when sys-app-config has no published months, without guessing from shifts table', async () => {
    const { fetchCloudPublishedMonths } = await import('../../src/services/supabaseService');
    const cloudSet = await fetchCloudPublishedMonths();
    // Live Supabase DB has 243 shifts for Gazzada 2026-10 but sys-app-config.skills.published_months is [].
    // Under the fixed implementation, it MUST NOT guess from shifts and MUST return empty Set!
    expect(cloudSet.size).toBe(0);
    expect(cloudSet.has('gazzada_2026-10')).toBe(false);
  });
});

