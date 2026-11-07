/**
 * Tier 1: Core Feature F10 (PIN Login & Manager Authentication)
 * Covers:
 * - Employee PIN login
 * - Invalid PIN rejection
 * - Manager master authentication
 * - Manager unlock elevation
 * - Emergency recovery key
 * - PIN reset flow
 * - Inactive employee authentication restrictions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppHarness } from '../../harness/app-harness';
import { MANAGER_MASTER_PASSWORD } from '../../../src/domain/mockData';

describe('Tier 1: Feature F10 (PIN Login & Manager Authentication)', () => {
  let app: AppHarness;

  beforeEach(() => {
    app = new AppHarness();
  });

  it('F10.1: employee logs in successfully with valid PIN and receives role "employee"', () => {
    const res = app.loginAsEmployee('emp-gz-1', '123');
    expect(res.success).toBe(true);
    expect(app.session).not.toBeNull();
    expect(app.session?.role).toBe('employee');
    expect(app.session?.user.name).toBe('Sabrina');
    expect(app.isManagerMode).toBe(false);
  });

  it('F10.2: employee login with incorrect PIN is rejected with error', () => {
    const res = app.loginAsEmployee('emp-gz-1', '999999');
    expect(res.success).toBe(false);
    expect(res.error).toBe('PIN non corretto');
    expect(app.session).toBeNull();
  });

  it('F10.3: manager authenticates with master password and elevates to manager mode', () => {
    const res = app.loginAsManager('vittore@nicoragarden.it', MANAGER_MASTER_PASSWORD);
    expect(res.success).toBe(true);
    expect(app.session?.role).toBe('manager');
    expect(app.isManagerMode).toBe(true);
  });

  it('F10.4: employee elevates to manager mode via manager PIN unlock prompt', () => {
    app.loginAsEmployee('emp-gz-1', '123');
    expect(app.isManagerMode).toBe(false);

    // Prompt for manager elevation
    const unlocked = app.unlockManagerWithPin('admin');
    expect(unlocked).toBe(true);
    expect(app.isManagerMode).toBe(true);
  });

  it('F10.5: invalid PIN in manager unlock prompt fails to elevate', () => {
    app.loginAsEmployee('emp-gz-1', '123');
    const unlocked = app.unlockManagerWithPin('0000');
    expect(unlocked).toBe(false);
    expect(app.isManagerMode).toBe(false);
  });

  it('F10.6: master recovery key NicoraMaster2026! successfully unlocks manager mode', () => {
    const res = app.loginAsManager('recovery@nicoragarden.it', 'NicoraMaster2026!');
    expect(res.success).toBe(true);
    expect(app.isManagerMode).toBe(true);
  });

  it('F10.7: employee PIN reset updates password and permits login with new PIN', () => {
    const resetOk = app.resetPin('emp-gz-1', '5678');
    expect(resetOk).toBe(true);

    const loginOld = app.loginAsEmployee('emp-gz-1', '9999');
    expect(loginOld.success).toBe(false);

    const loginNew = app.loginAsEmployee('emp-gz-1', '5678');
    expect(loginNew.success).toBe(true);
    expect(app.session?.user.id).toBe('emp-gz-1');
  });

  it('F10.8: logout clears active session and resets manager privileges', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    expect(app.isManagerMode).toBe(true);

    app.logout();
    expect(app.session).toBeNull();
    expect(app.isManagerMode).toBe(false);
  });

  it('F10.9: employee promoted to manager (isManager: true) gets full manager capabilities and forced PIN change on 1234', () => {
    // 1. Admin logs in and promotes Sabrina (emp-gz-1) to manager
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    const promo = app.setEmployeeManagerStatus('emp-gz-1', true);
    expect(promo.success).toBe(true);
    app.logout();

    // 2. Sabrina logs in via Collaboratore with provisional PIN 1234
    const loginRes = app.loginAsEmployee('emp-gz-1', '1234');
    expect(loginRes.success).toBe(true);
    expect(app.isManagerMode).toBe(true);
    expect(app.session?.role).toBe('manager');
    expect(app.session?.managerToken).toBeDefined();

    // 3. Forced PIN change is required even though she is a manager
    expect(app.requiresForcedPinChange()).toBe(true);
    const pinChange = app.completeForcedPinChange('4321');
    expect(pinChange.success).toBe(true);
    expect(app.requiresForcedPinChange()).toBe(false);

    // 4. Promoted manager can generate draft shifts, view unpublished drafts, and publish the month
    const generated = app.generateMonthlyShifts(2026, 11, 'gazzada');
    expect(generated.length).toBeGreaterThan(0);
    expect(app.hasUnpublishedDraftInView('gazzada', 2026, 11)).toBe(true);
    expect(app.isPublishBannerVisible('gazzada', 2026, 11)).toBe(true);
    expect(app.getVisibleShifts().length).toBeGreaterThan(0);

    app.publishMonth('gazzada', 2026, 11);
    expect(app.isMonthOfficiallyPublished('gazzada', 2026, 11)).toBe(true);
  });

  it('F10.10: promoted manager logging in via Responsabile tab with 1234 is also prompted to change PIN', () => {
    app.loginAsManager('vittore@nicoragarden.it', 'admin');
    app.setEmployeeManagerStatus('emp-gz-1', true);
    app.logout();

    const mgrLogin = app.loginAsManager('sabrina@nicoragarden.it', '1234');
    expect(mgrLogin.success).toBe(true);
    expect(app.session?.user.id).toBe('emp-gz-1');
    expect(app.isManagerMode).toBe(true);
    expect(app.requiresForcedPinChange()).toBe(true);
  });

  it('F10.11: virgin ("brado") state has no non-owner employee checked as manager and no custom PINs', () => {
    const nonOwners = app.employees.filter((e) => !e.isOwner);
    expect(nonOwners.length).toBeGreaterThan(0);
    for (const emp of nonOwners) {
      expect(Boolean(emp.isManager)).toBe(false);
      expect(Boolean(emp.hasCustomPin)).toBe(false);
    }
  });
});
