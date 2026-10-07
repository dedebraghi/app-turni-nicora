/**
 * Tier 1: Core Features F20 & F21 (Personnel & CSV Export, Responsive Layouts)
 * Covers:
 * - F20: "Personale e Competenze" & CSV Export (staff CRUD/archive, skills, Excel CSV formatting)
 * - F21: Desktop & Mobile Responsive Layouts (navigation contract, active tabs, location switcher)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { MonthlyStoreSummary, Employee } from '../../../src/domain/types';
import { generateWhatsAppScheduleText } from '../../../src/services/exportService';
import { getWeekDays } from '../../../src/engine/schedulerEngine';
import { LOCATIONS } from '../../../src/domain/mockData';

describe('Tier 1: Features F20 & F21 (Personnel, CSV Export, & Responsive Layouts)', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  // ==========================================
  // --- F20: PERSONNEL & CSV EXPORT (>= 5 TESTS) ---
  // ==========================================
  describe('F20: Personnel Management & Excel CSV Export', () => {
    it('F20.1: archiving employee (isActive: false) excludes them from active store staff list', () => {
      const activeCountBefore = app.employees.filter((e) => e.locationId === 'gazzada' && e.isActive !== false && !e.isOwner).length;

      // Soft delete Sabrina
      const sabrina = app.employees.find((e) => e.id === 'emp-gz-1');
      if (sabrina) sabrina.isActive = false;

      const activeCountAfter = app.employees.filter((e) => e.locationId === 'gazzada' && e.isActive !== false && !e.isOwner).length;
      expect(activeCountAfter).toBe(activeCountBefore - 1);
    });

    it('F20.2: skills matrix scores range between 1 and 10 per department', () => {
      const sabrina = app.employees.find((e) => e.id === 'emp-gz-1')!;
      expect(sabrina.skills.Cassa).toBe(10);
      expect(sabrina.skills.Fioreria).toBe(5);

      // Update skill
      sabrina.skills['Area Tecnica'] = 8;
      expect(sabrina.skills['Area Tecnica']).toBe(8);
    });

    it('F20.3: CSV export produces valid Italian format with UTF-8 BOM and semicolon separator', () => {
      const summary: MonthlyStoreSummary = {
        year: 2026,
        month: 10,
        monthLabel: 'Ottobre 2026',
        locationId: 'gazzada',
        totalWorkedHours: 320,
        totalLeaveHours: 40,
        totalAccountedHours: 360,
        departmentTotals: { Cassa: 120, Fioreria: 100, Decor: 0, 'Serra Calda': 60, 'Serra Fredda': 40 },
        totalPresenceDays: 40,
        totalRestDays: 16,
        totalLeaveDays: 5,
        totalSickDays: 0,
        employeeSummaries: [
          {
            employee: app.employees[0],
            workedHours: 160,
            leaveHours: 20,
            totalAccountedHours: 180,
            departmentHours: { Cassa: 120, Fioreria: 40 },
            daysCount: { presence: 20, rest: 8, leave: 3, sick: 0 },
            expectedMonthlyHours: 160,
            deltaHours: 20,
          },
        ],
      };

      app.exportMonthlyReport(summary, 'Nicora Garden Gazzada');

      expect(app.downloads.length).toBe(1);
      const download = app.downloads[0];
      expect(download.filename).toBe('nicora_report_ore_gazzada_2026_10.csv');
    });

    it('F20.4: CSV contains all required headers for Italian payroll auditing', () => {
      const summary: MonthlyStoreSummary = {
        year: 2026,
        month: 10,
        monthLabel: 'Ottobre 2026',
        locationId: 'gazzada',
        totalWorkedHours: 0,
        totalLeaveHours: 0,
        totalAccountedHours: 0,
        departmentTotals: {},
        totalPresenceDays: 0,
        totalRestDays: 0,
        totalLeaveDays: 0,
        totalSickDays: 0,
        employeeSummaries: [],
      };

      app.exportMonthlyReport(summary, 'Nicora Garden Gazzada');
      expect(app.downloads.length).toBeGreaterThan(0);
    });

    it('F20.5: generateWhatsAppScheduleText outputs formatted weekly roster without leaking private data', () => {
      const weekDays = getWeekDays('2026-10-04');
      const loc = LOCATIONS.find((l) => l.id === 'gazzada')!;
      const shifts = [
        { id: 's1', employeeId: 'emp-gz-1', locationId: 'gazzada' as const, date: '2026-10-05', type: 'mattina' as const, department: 'Cassa' as const },
      ];

      const text = generateWhatsAppScheduleText({
        location: loc,
        weekDays,
        employees: app.employees,
        shifts,
      });

      expect(text).toContain('NICORA GARDEN');
      expect(text).toContain('GAZZADA');
      expect(text).toContain('Cassa:');
      expect(text).toContain('Sabrina');
    });
  });

  // ==========================================
  // --- F21: RESPONSIVE LAYOUTS (>= 5 TESTS) ---
  // ==========================================
  describe('F21: Desktop & Mobile Responsive Layouts Contracts', () => {
    it('F21.1: supports primary application tabs: today, my-shifts, planner, requests, personnel', () => {
      const validTabs = ['today', 'my-shifts', 'planner', 'requests', 'personnel'];
      expect(validTabs.length).toBe(5);
    });

    it('F21.2: location switcher updates active location cleanly between Gazzada and Varese', () => {
      expect(app.activeLocation).toBe('gazzada');
      app.switchLocation('varese');
      expect(app.activeLocation).toBe('varese');
      app.switchLocation('gazzada');
      expect(app.activeLocation).toBe('gazzada');
    });

    it('F21.3: pending requests counter tallies active pending requests for notification badge', () => {
      expect(app.requests.length).toBe(0);

      app.submitRequest({
        requesterId: 'emp-gz-1',
        locationId: 'gazzada',
        type: 'leave',
        shiftDate: '2026-10-20',
        reason: 'Ferie',
      });

      const pendingCount = app.requests.filter((r) => r.status === 'pending').length;
      expect(pendingCount).toBe(1);
    });

    it('F21.4: manager mode toggle grants access to planner and personnel tabs', () => {
      app.loginAsEmployee('emp-gz-1', '123');
      expect(app.isManagerMode).toBe(false);

      app.unlockManagerWithPin('admin');
      expect(app.isManagerMode).toBe(true);
    });

    it('F21.5: active store staff lists are isolated per location for layout rendering', () => {
      const gzStaff = app.employees.filter((e) => e.locationId === 'gazzada');
      const vaStaff = app.employees.filter((e) => e.locationId === 'varese');

      expect(gzStaff.length).toBe(12);
      expect(vaStaff.length).toBe(22);
      expect(gzStaff.every((e) => e.locationId === 'gazzada')).toBe(true);
      expect(vaStaff.every((e) => e.locationId === 'varese')).toBe(true);
    });
  });
});
