import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateMonthHourlyCoverage,
  getIgnoredGapIds,
  saveIgnoredGapIds,
  ignoreGapId,
  clearLegacyIgnoredAlerts,
} from '../../src/engine/schedulerEngine';
import { Shift, Employee } from '../../src/domain/types';

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
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

describe('calculateMonthHourlyCoverage & Ignored Gaps Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockEmployees: Employee[] = [
    {
      id: 'emp-1',
      name: 'Mario Rossi',
      role: 'Cassa',
      contractHours: 40,
      skills: { Cassa: 10, Fioreria: 2, Decor: 2, 'Serra Calda': 2, 'Area Tecnica': 2, Vivaio: 2, Natale: 2 },
      locationId: 'gazzada',
      isOwner: false,
    },
    {
      id: 'emp-2',
      name: 'Luigi Verdi',
      role: 'Fioreria',
      contractHours: 40,
      skills: { Cassa: 2, Fioreria: 10, Decor: 2, 'Serra Calda': 2, 'Area Tecnica': 2, Vivaio: 2, Natale: 2 },
      locationId: 'gazzada',
      isOwner: false,
    },
  ];

  it('correctly aggregates month hourly coverage and identifies uncovered dates', () => {
    // Simuliamo ottobre 2026 senza turni (tutto scoperto tranne giorni passati se includePastDays è false)
    const emptyShifts: Shift[] = [];
    const analysis = calculateMonthHourlyCoverage(
      2026,
      10,
      emptyShifts,
      'standard',
      'gazzada',
      mockEmployees,
      true // include past days for deterministic unit test
    );

    expect(analysis.totalGapsCount).toBeGreaterThan(0);
    expect(analysis.criticalGapsCount).toBeGreaterThan(0);
    expect(analysis.firstGapDateStr).toBe('2026-09-27');
    expect(analysis.weeks.length).toBeGreaterThanOrEqual(4);
    expect(analysis.gapsByDate['2026-10-01']).toBeDefined();
    expect(analysis.gapsByDate['2026-10-01'].length).toBeGreaterThan(0);
  });

  it('filters out ignored gap IDs across the entire month', () => {
    const emptyShifts: Shift[] = [];
    const baseAnalysis = calculateMonthHourlyCoverage(
      2026,
      10,
      emptyShifts,
      'standard',
      'gazzada',
      mockEmployees,
      true
    );

    const firstGap = baseAnalysis.allGaps[0];
    expect(firstGap).toBeDefined();

    // Ignoriamo il primo gap
    const ignoredGapIds = [firstGap.id];
    const filteredAnalysis = calculateMonthHourlyCoverage(
      2026,
      10,
      emptyShifts,
      'standard',
      'gazzada',
      mockEmployees,
      true,
      false,
      ignoredGapIds
    );

    expect(filteredAnalysis.totalGapsCount).toBe(baseAnalysis.totalGapsCount - 1);
    expect(filteredAnalysis.allGaps.some((g) => g.id === firstGap.id)).toBe(false);
  });

  it('persists and retrieves ignored gaps reliably in storage', () => {
    clearLegacyIgnoredAlerts();
    expect(getIgnoredGapIds()).toEqual([]);

    ignoreGapId('gap-gazzada-2026-10-15-Cassa');
    expect(getIgnoredGapIds()).toContain('gap-gazzada-2026-10-15-Cassa');

    saveIgnoredGapIds(['gap-1', 'gap-2']);
    expect(getIgnoredGapIds()).toEqual(['gap-1', 'gap-2']);
  });
});
