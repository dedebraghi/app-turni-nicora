/**
 * Tier 1: Core Features F04 - F09 (Draft Lifecycle & Staff Privacy)
 * Covers:
 * - F04: Bug Reproduction Test (pre-fix premature publication and banner vanishing)
 * - F05: Draft Invalidation Root Cause Fix (draft state preserved across realtime/batch flush)
 * - F06: Authoritative Published Months Sync (no guessing from shifts, no hardcoded months)
 * - F07: Realtime Publication Cross-Device Sync (sys-app-config propagation)
 * - F08: Staff Privacy - Shift Visibility Filtering (unpublished drafts hidden from regular staff)
 * - F09: Draft Persistence & Edit Persistence (draft survives edits and reloads)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import {
  isMonthPublished,
  hasDraftGenerated,
  getPublishedMonthsMap,
  recordMonthUnpublished,
  recordDraftGenerated,
  syncPublishedMonthsFromCloud,
} from '../../../src/services/storageService';

describe('Tier 1: Features F04 - F09 (Draft Lifecycle & Staff Privacy)', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  // ==========================================
  // --- F04: DRAFT BUG REPRODUCTION (>= 5 TESTS) ---
  // ==========================================
  describe('F04: Draft Lifecycle Bug Reproduction', () => {
    it('F04.1: reproduces pre-fix premature publication when realtime shift flush executes with month keys', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      expect(app.isMonthDraft('gazzada', 2026, 10)).toBe(true);
      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);

      // Simulate buggy pre-fix flush: calls syncPublishedMonthsFromCloud(monthKeys)
      app.simulateRealtimeShiftFlush(shifts, true);

      // Demonstrates the bug: storage map now falsely marks gazzada_2026-10 as published
      const pubMap = getPublishedMonthsMap();
      expect(pubMap['gazzada_2026-10']).toBe(true);
      expect(isMonthPublished('gazzada', 2026, 10)).toBe(true);
    });

    it('F04.2: pre-fix bug causes hasUnpublishedDraftInView to falsely flip to false', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      expect(app.hasUnpublishedDraftInView('gazzada', 2026, 10)).toBe(true);

      // Trigger pre-fix bug
      app.simulateRealtimeShiftFlush(shifts, true);

      // Bug outcome: draft is no longer recognized as unpublished
      expect(app.hasUnpublishedDraftInView('gazzada', 2026, 10)).toBe(false);
    });

    it('F04.3: pre-fix bug causes publish banner to vanish prematurely', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);

      // Trigger pre-fix bug
      app.simulateRealtimeShiftFlush(shifts, true);

      // Banner is now hidden even though manager never pressed 'Pubblica Turni'
      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(false);
    });

    it('F04.4: pre-fix bug causes header badge to flip from "Bozza non pubblicata" to "Presidio Cassa OK"', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      expect(app.getHeaderBadgeState('gazzada', 2026, 10)).toBe('draft_unpublished');

      // Trigger pre-fix bug
      app.simulateRealtimeShiftFlush(shifts, true);

      // Badge erroneously flips to 'cassa_ok'
      expect(app.getHeaderBadgeState('gazzada', 2026, 10)).toBe('cassa_ok');
    });

    it('F04.5: pre-fix bug violates staff privacy by prematurely leaking draft shifts to non-manager staff', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      // Regular employee logs in before publishing
      app.loginAsEmployee('emp-gz-1', '123');
      expect(app.getVisibleShifts().length).toBe(0); // Properly isolated initially

      // Simulate the pre-fix bug happening in the background
      app.simulateRealtimeShiftFlush(shifts, true);

      // Leak occurs: regular employee now sees unpublished draft shifts!
      const leakedShifts = app.getVisibleShifts().filter((s) => s.date.startsWith('2026-10'));
      expect(leakedShifts.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // --- F05: DRAFT INVALIDATION ROOT CAUSE FIX (>= 5 TESTS) ---
  // ==========================================
  describe('F05: Draft Invalidation Root Cause Fix', () => {
    it('F05.1: post-fix realtime shift flush does NOT call syncPublishedMonthsFromCloud and keeps draft unpublished', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      // Normal post-fix realtime flush (triggerBuggyAutoPublish = false)
      app.simulateRealtimeShiftFlush(shifts, false);

      expect(isMonthPublished('gazzada', 2026, 10)).toBe(false);
      expect(app.hasUnpublishedDraftInView('gazzada', 2026, 10)).toBe(true);
    });

    it('F05.2: publish banner remains stably visible across multiple consecutive realtime flush events', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);

      // 5 consecutive flushes
      for (let i = 0; i < 5; i++) {
        app.simulateRealtimeShiftFlush(shifts, false);
      }

      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });

    it('F05.3: header badge remains "draft_unpublished" during idle time and background flushes', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      app.simulateRealtimeShiftFlush(shifts, false);
      expect(app.getHeaderBadgeState('gazzada', 2026, 10)).toBe('draft_unpublished');
    });

    it('F05.4: draft state persists stably in storage map across simulated page reload', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      // Create new fresh app instance reading same storage
      const reloadedApp = new AppHarness({ storage: app.storage, cloud: app.cloud });
      reloadedApp.loginAsManager('vittore@nicoragarden.it', 'admin');
      reloadedApp.shifts = app.shifts;

      expect(reloadedApp.isMonthDraft('gazzada', 2026, 10)).toBe(true);
      expect(reloadedApp.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(reloadedApp.hasUnpublishedDraftInView('gazzada', 2026, 10)).toBe(true);
      expect(reloadedApp.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });

    it('F05.5: draft state remains unpublished for both Gazzada and Varese independently', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const gzShifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      const vaShifts = app.generateMonthlyShifts(2026, 10, 'varese');

      app.simulateRealtimeShiftFlush(gzShifts, false);
      app.simulateRealtimeShiftFlush(vaShifts, false);

      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(app.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(false);
    }, 30000);
  });

  // ==========================================
  // --- F06: AUTHORITATIVE PUBLISHED MONTHS SYNC (>= 5 TESTS) ---
  // ==========================================
  describe('F06: Authoritative Published Months Sync', () => {
    it('F06.1: cloud fetch returns empty Set when sys-app-config has empty published_months (no fallback to shifts)', () => {
      // Mock cloud has shifts for 2026-10, but sys-app-config has published_months: []
      app.cloud.upsertShifts([
        {
          id: 'shift-1',
          employeeId: 'emp-gz-1',
          locationId: 'gazzada',
          date: '2026-10-05',
          type: 'mattina',
        },
      ]);
      const cloudPublished = app.cloud.fetchPublishedMonths();
      expect(cloudPublished.size).toBe(0);
    });

    it('F06.2: cloud fetch returns exactly the set in sys-app-config and does not guess other months', () => {
      app.cloud.publishMonth('gazzada', 2026, 9);
      const set = app.cloud.fetchPublishedMonths();
      expect(set.has('gazzada_2026-09')).toBe(true);
      expect(set.has('gazzada_2026-10')).toBe(false);
    });

    it('F06.3: authoritative sync replaces local map with exact cloud set and does not append draft months', () => {
      // Setup local map with obsolete entries
      app.storage.setItem('nicora_v2_published_months', JSON.stringify({ 'gazzada_2026-10': true }));

      // Cloud says only 2026-09 is published
      app.simulateRealtimeConfigUpdate(['gazzada_2026-09']);

      const localMap = getPublishedMonthsMap();
      expect(localMap['gazzada_2026-09']).toBe(true);
      expect(localMap['gazzada_2026-10']).toBeUndefined();
    });

    it('F06.4: publishing on cloud updates sys-app-config without hardcoded legacy months', () => {
      app.cloud.publishMonth('gazzada', 2026, 10);
      const months = Array.from(app.cloud.fetchPublishedMonths());
      expect(months).toContain('gazzada_2026-10');
      // Must not inject random unrequested months
      expect(months).not.toContain('varese_2026-10');
    });

    it('F06.5: unpublishing a month on cloud immediately clears that month key from cloud set', () => {
      app.cloud.publishMonth('gazzada', 2026, 10);
      expect(app.cloud.fetchPublishedMonths().has('gazzada_2026-10')).toBe(true);

      app.cloud.unpublishMonth('gazzada', 2026, 10);
      expect(app.cloud.fetchPublishedMonths().has('gazzada_2026-10')).toBe(false);
    });
  });

  // ==========================================
  // --- F07: REALTIME CROSS-DEVICE PUBLICATION SYNC (>= 5 TESTS) ---
  // ==========================================
  describe('F07: Realtime Publication Cross-Device Sync', () => {
    it('F07.1: manager publishing on Device A propagates to Device B via config event', () => {
      // Device A (Manager)
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');
      app.publishMonth('gazzada', 2026, 10);

      // Device B (Staff session on fresh harness)
      const deviceB = new AppHarness({ cloud: app.cloud });
      deviceB.loginAsEmployee('emp-gz-1', '123');
      deviceB.shifts = app.shifts;

      // Device B receives the config update from cloud
      deviceB.simulateRealtimeConfigUpdate(Array.from(app.cloud.fetchPublishedMonths()));

      expect(deviceB.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);
    });

    it('F07.2: Device B logged in as manager immediately hides publish button when Device A publishes', () => {
      const deviceA = new AppHarness({ cloud: app.cloud });
      deviceA.loginAsManager('vittore@nicoragarden.it', 'admin');
      deviceA.generateMonthlyShifts(2026, 10, 'gazzada');

      const deviceB = new AppHarness({ cloud: app.cloud });
      deviceB.loginAsManager('vittore@nicoragarden.it', 'admin');
      deviceB.shifts = deviceA.shifts;
      recordDraftGenerated('gazzada', 2026, 10);
      recordMonthUnpublished('gazzada', 2026, 10);

      expect(deviceB.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);

      // Device A publishes
      deviceA.publishMonth('gazzada', 2026, 10);

      // Device B receives event
      deviceB.simulateRealtimeConfigUpdate(Array.from(app.cloud.fetchPublishedMonths()));
      expect(deviceB.isPublishBannerVisible('gazzada', 2026, 10)).toBe(false);
    });

    it('F07.3: Device B logged in as employee reveals shifts immediately after realtime publication event', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      const staffDevice = new AppHarness({ cloud: app.cloud });
      staffDevice.loginAsEmployee('emp-gz-1', '123');
      staffDevice.shifts = app.shifts;

      expect(staffDevice.getVisibleShifts().length).toBe(0);

      // Manager publishes
      app.publishMonth('gazzada', 2026, 10);

      // Staff device receives event
      staffDevice.simulateRealtimeConfigUpdate(Array.from(app.cloud.fetchPublishedMonths()));
      expect(staffDevice.getVisibleShifts().length).toBeGreaterThan(0);
    });

    it('F07.4: publication of Gazzada does NOT publish Varese cross-device', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');
      app.generateMonthlyShifts(2026, 10, 'varese');

      // Publish Gazzada only
      app.publishMonth('gazzada', 2026, 10);

      const deviceB = new AppHarness({ cloud: app.cloud });
      deviceB.simulateRealtimeConfigUpdate(Array.from(app.cloud.fetchPublishedMonths()));

      expect(deviceB.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(true);
      expect(deviceB.isMonthOfficiallyPublished('varese', 2026, 10)).toBe(false);
    }, 30000);

    it('F07.5: subscription listener receives notification on sys-app-config UPDATE event', () => {
      let notified = false;
      app.cloud.subscribe((table, event, payload) => {
        if (table === 'employees' && payload.id === 'sys-app-config' && event === 'UPDATE') {
          notified = true;
        }
      });

      app.cloud.publishMonth('gazzada', 2026, 10);
      expect(notified).toBe(true);
    });
  });

  // ==========================================
  // --- F08: STAFF PRIVACY - SHIFT VISIBILITY (>= 5 TESTS) ---
  // ==========================================
  describe('F08: Staff Privacy - Shift Visibility Filtering', () => {
    it('F08.1: regular employee sees exactly 0 shifts for draft month in getVisibleShifts', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      app.loginAsEmployee('emp-gz-1', '123');
      const visible = app.getVisibleShifts().filter((s) => s.date.startsWith('2026-10'));
      expect(visible.length).toBe(0);
    });

    it('F08.2: manager sees all shifts for draft month in getVisibleShifts', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const generated = app.generateMonthlyShifts(2026, 10, 'gazzada');

      const visible = app.getVisibleShifts().filter((s) => s.date.startsWith('2026-10'));
      expect(visible.length).toBe(generated.length);
    });

    it('F08.3: employee sees published past shifts but CANNOT see upcoming unpublished draft shifts', () => {
      // Seed a published past month
      app.shifts.push({
        id: 'shift-past-1',
        employeeId: 'emp-gz-1',
        locationId: 'gazzada',
        date: '2026-08-10',
        type: 'mattina',
      });
      app.publishMonth('gazzada', 2026, 8);

      // Generate future draft
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      // Regular employee login
      app.loginAsEmployee('emp-gz-1', '123');
      const visible = app.getVisibleShifts();

      const pastShifts = visible.filter((s) => s.date.startsWith('2026-08'));
      const futureShifts = visible.filter((s) => s.date.startsWith('2026-10'));

      expect(pastShifts.length).toBe(1);
      expect(futureShifts.length).toBe(0);
    });

    it('F08.4: TodayPresence returns 0 shifts for non-manager staff when today is within an unpublished draft month', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      // Regular employee checks today on 2026-10-12
      app.loginAsEmployee('emp-gz-1', '123');
      const presence = app.getTodayPresence('2026-10-12', 'gazzada');

      expect(presence.presentCount).toBe(0);
      expect(presence.mattina.length).toBe(0);
      expect(presence.pomeriggio.length).toBe(0);
      expect(presence.giornata.length).toBe(0);
    });

    it('F08.5: MySchedule indicates draft unpublished notice and hides shift cards from employee', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      app.loginAsEmployee('emp-gz-1', '123');
      const mySchedule = app.getMySchedule('emp-gz-1', 2026, 10);

      expect(mySchedule.shifts.length).toBe(0);
      expect(mySchedule.hasDraft).toBe(true);
      expect(mySchedule.isMonthPublished).toBe(false);
      expect(mySchedule.isDraftUnpublishedNoticeVisible).toBe(true);
    });
  });

  // ==========================================
  // --- F09: DRAFT PERSISTENCE & EDIT PERSISTENCE (>= 5 TESTS) ---
  // ==========================================
  describe('F09: Draft Persistence & Edit Persistence', () => {
    it('F09.1: draft shifts persist to cloud backend on generation', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      expect(app.cloud.shifts.size).toBe(shifts.length);
    });

    it('F09.2: manual shift edit on a draft shift preserves draft unpublished state', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      const target = shifts[0];

      // Edit shift
      const updated = { ...target, type: 'giornata' as const, startTime: '08:30', endTime: '19:30' };
      app.editShift(updated);

      expect(app.isMonthDraft('gazzada', 2026, 10)).toBe(true);
      expect(app.isMonthOfficiallyPublished('gazzada', 2026, 10)).toBe(false);
      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });

    it('F09.3: manual shift edit persists updated shift fields to cloud and local storage', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');
      const target = shifts[0];

      const updated = { ...target, department: 'Fioreria' as const, isManualOverride: true };
      app.editShift(updated);

      const savedCloudShift = app.cloud.shifts.get(target.id);
      expect(savedCloudShift?.department).toBe('Fioreria');
      expect(savedCloudShift?.isManualOverride).toBe(true);
    });

    it('F09.4: performing 10 consecutive cell edits preserves draft badge and banner', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      const shifts = app.generateMonthlyShifts(2026, 10, 'gazzada');

      for (let i = 0; i < 10; i++) {
        const s = shifts[i];
        app.editShift({ ...s, type: 'riposo', isManualOverride: true });
      }

      expect(app.getHeaderBadgeState('gazzada', 2026, 10)).toBe('draft_unpublished');
      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });

    it('F09.5: manual edits remain in draft mode even when manager switches active location back and forth', () => {
      app.loginAsManager('vittore@nicoragarden.it', 'admin');
      app.generateMonthlyShifts(2026, 10, 'gazzada');

      app.switchLocation('varese');
      expect(app.activeLocation).toBe('varese');

      app.switchLocation('gazzada');
      expect(app.activeLocation).toBe('gazzada');
      expect(app.hasUnpublishedDraftInView('gazzada', 2026, 10)).toBe(true);
      expect(app.isPublishBannerVisible('gazzada', 2026, 10)).toBe(true);
    });
  });
});
