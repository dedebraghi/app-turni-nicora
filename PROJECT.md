# Project: Nicora Garden Shift Scheduling PWA

## Architecture
- **Frontend Stack**: React 19 (`19.2.8`), TypeScript (`~6.0.2`), Vite (`8.3.0`), Tailwind CSS, Lucide React.
- **Backend / Database**: Supabase (`@supabase/supabase-js` `^2.116.0`) with PostgreSQL database (`locations`, `employees`, `shifts`, `shift_requests`).
- **Authentication**: Client-side PIN-based authentication (`pin`, `is_manager`, owner/admin flags).
- **Publication & Draft Model**:
  - Global configuration stored in the `employees` table under record `id = 'sys-app-config'`, specifically JSONB field `skills.published_months` (array of `"<location>_<YYYY-MM>"` strings).
  - Draft shifts are saved to Supabase `shifts` table so they are preserved across devices and sessions.
  - Staff privacy: regular employees MUST only see published shifts (`isMonthPublished`), while managers see all shifts including unpublished drafts.
- **Realtime Sync**: Supabase Realtime WebSocket subscription (`postgres_changes`) syncing shifts, shift requests, and configuration across multiple open devices.
- **Test Infrastructure**: Vitest test runner with unit and integration tests executing automated checks against state, storage, business logic, components, and cloud sync.

## Code Layout
- `src/App.tsx`: Top-level app controller, authentication state, tab navigation, global shifts/requests/employees state, and Realtime sync listener.
- `src/components/layout/`: `AppHeader.tsx`, `MobileHeader.tsx`, `ResponsiveNav.tsx`.
- `src/components/admin/`: `PlannerGrid.tsx`, `MobileDayView.tsx`, `GenerateModal.tsx`, `ClearShiftsModal.tsx`, `EmergencyModal.tsx`, `StaffSubstitutionWizard.tsx`, `StaffPersonnel.tsx`.
- `src/components/staff/`: `TodayPresenceDesktop.tsx`, `TodayPresenceMobile.tsx`, `MyScheduleDesktop.tsx`, `MyScheduleMobile.tsx`, `LeaveRequestsDesktop.tsx`, `LeaveRequestsMobile.tsx`.
- `src/components/auth/`: `LoginScreen.tsx`.
- `src/services/`:
  - `storageService.ts`: Local storage caching and published months state management.
  - `supabaseService.ts`: Cloud persistence, RPCs, configuration fetch/update, and Realtime subscription.
  - `supabaseClient.ts`: Supabase client initialization, DB ↔ domain model mappers.
  - `exportService.ts`: CSV and formatted printable timesheet export.
- `scripts/safety/`:
  - `db-safety.mjs`: Database safety and verification CLI (`snapshot`, `verify`, `verify-clean`, `clean`, `restore`).
  - `employees_snapshot.json`: Pristine 33-row snapshot of the employees table.
- `tests/`:
  - `tests/e2e/`: Requirement-driven E2E test suites (Tiers 1-4).
  - `tests/unit/`: Unit and integration test suites for draft lifecycle, requests, security, and flows.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Git Safety Branching | Work isolated on local branch `fix/draft-publish-lifecycle-and-audit`; no push to `main` | M0 | R3 / Survey Miner |
| F02 | Employee Snapshot & Safety Harness | Baseline snapshot of all 33 employees in `employees_snapshot.json` and verification CLI | M0 | R3 / Survey Miner |
| F03 | Automated Test Infrastructure | Install Vitest + test environment to execute automated test suites | M1 / E2E | R1, R2 / Survey Explorer 2 |
| F04 | Draft Lifecycle Bug Reproduction Test | Automated test reproducing the pre-fix instant publication and flashing banner bug | M1 | R1 AC1 / Survey Explorer 1 |
| F05 | Draft Invalidation Root Cause Fix | Remove `syncPublishedMonthsFromCloud` from `flushShiftBatch` in `App.tsx:136-149` | M1 | R1 / Survey Explorer 1 |
| F06 | Authoritative Published Months Sync | Fix `syncPublishedMonthsFromCloud` and `fetchCloudPublishedMonths` (eliminate fallback marking shifts as published and hardcoded 2026-10) | M1 | R1 / Survey Explorer 1 & 2 |
| F07 | Realtime Publication Cross-Device Sync | Add `employees` table / `sys-app-config` listening to Realtime channel so publish propagates cross-device | M1 | R1 / Survey Explorer 1 |
| F08 | Staff Privacy - Shift Visibility Filtering | Filter shifts for regular employees across all views (`PlannerGrid`, `TodayPresence`, `MySchedule`) so drafts are strictly hidden | M1 | R1 / Survey Explorer 1 |
| F09 | Draft Persistence & Edit Persistence | Verify draft shifts persist to Supabase on generation and remain drafts after manual cell edits | M1 | R1 / Survey Explorer 1 |
| F10 | PIN Login & Manager Authentication | Audit & verify PIN login, master PIN, manager unlock modal, and PIN reset flow | M2 | R2 / Survey Explorer 2 |
| F11 | "Oggi in Sede" View & Labels | Audit today's presence on desktop/mobile; fix mobile "Pomeriggio" label typo | M2 | R2 / Survey Explorer 2 |
| F12 | "I Miei Turni" Employee View | Audit personal schedule view, draft awareness, request creation actions | M2 | R2 / Survey Explorer 2 |
| F13 | Planner Weekly/Monthly & Hours Calculation | Audit weekly hours calculations vs contract quotas, day counters, and week navigation | M2 | R2 / Survey Explorer 2 |
| F14 | Shift Generation Modal & Engine | Audit monthly shift generation parameters, constraint handling, and draft flag setting | M2 | R2 / Survey Explorer 2 |
| F15 | Manual Shift Edits & Delta Saving | Fix over-upsert of entire shifts array on single cell edit; save single/batch deltas | M2 | R2 / Survey Explorer 2 |
| F16 | Emergency Substitution Wizard | Audit sick/absence replacement logic, ranking criteria, and shift reassignment | M2 | R2 / Survey Explorer 2 |
| F17 | "Svuota Turni" Clear Shifts | Fix "Svuota Turni" to properly clear published_months when a month is emptied | M2 | R2 / Survey Explorer 2 |
| F18 | Leave, Permission, & Swap Requests Lifecycle | Fix request type loss (`sick`/`schedule_change` collapsed to `leave`) and add two-step swap conflict check | M2 | R2 / Survey Explorer 2 |
| F19 | Staff Privacy - Requests & Swaps Isolation | Audit employee isolation so staff members see only their own requests and swaps addressed to them | M2 | R2 / Survey Explorer 2 |
| F20 | "Personale e Competenze" & CSV Export | Audit staff management (add/edit/archive), skills, monthly hours report, and CSV/print export | M2 | R2 / Survey Explorer 2 |
| F21 | Desktop & Mobile Responsive Layouts | Audit responsive navigation, headers, modals, and touch controls | M2 | R2 / Survey Explorer 2 |
| F22 | Full E2E Test Suite (Tiers 1-4) | Comprehensive opaque-box test suite covering all features with >=11N + scenarios | E2E Track | Project Pattern / AC |
| F23 | Adversarial Coverage Hardening (Tier 5) | White-box stress testing, edge case mutation, and coverage validation | M3 | Project Pattern |
| F24 | Database Fresh-Install Restoration | Safe database cleanup: `shifts = 0`, `shift_requests = 0`, `published_months = []`, employees 100% snapshot match | M4 | R3 / Survey Miner |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Safety Pre-flight & Snapshot | Verify Git branch isolation and ensure pristine snapshot is captured and verifiable | none | DONE |
| M1 | Draft/Publish Lifecycle & Staff Privacy | Reproduce bug via automated test, fix client Realtime echo, fix storage sync, fix cloud fallback, add cross-device publication sync, and seal staff privacy | M0 | IN_PROGRESS |
| M2 | Full Functional Audit & Defect Remediation | Audit & fix all 13 R2 flows: PIN login, Oggi in Sede (mobile label typo), I Miei Turni, Planner calculations, single-shift delta saving, Emergency wizard, Svuota Turni state reset, Leave/Swap request type preservation and conflict check, staff privacy, Personale/CSV export | M1 | PLANNED |
| M3 | E2E Test Suite Pass & Adversarial Hardening | Run 100% of E2E test suite (Tiers 1-4) published by E2E track, then run Tier 5 adversarial coverage hardening | M2, E2E | PLANNED |
| M4 | Final Database Safety & Fresh Install Cleanup | Execute `node scripts/safety/db-safety.mjs clean`, verify `shifts = 0`, `shift_requests = 0`, `published_months = []`, restore pristine employees, verify clean | M3 | PLANNED |
| E2E | E2E Testing Track | Design and build comprehensive opaque-box test runner and test cases across Tiers 1-4 | M0 | IN_PROGRESS |

## Interface Contracts
### Client Storage ↔ Cloud Supabase (`storageService` ↔ `supabaseService`)
- `getPublishedMonthsMap()` returns `{ [key: string]: boolean }` where `key = "${locationId}_${YYYY-MM}"`.
- `syncPublishedMonthsFromCloud(authoritativeSet: Set<string>)`: Replaces `localStorage` map with the exact authoritative cloud set (does not blindly append `true` to every seen month).
- `fetchCloudPublishedMonths()`: Reads `employees` row `id = 'sys-app-config'`, extracting `skills.published_months: string[]`. Returns `Set<string>`. If `sys-app-config` is missing or array is empty, returns empty `Set<string>()` (NEVER falls back to guessing from `shifts` table).
- `publishCloudMonth(locationId: string, year: number, month: number)`: Updates `sys-app-config.skills.published_months` array. Does not inject default published months.

### Realtime Subscription ↔ App State (`supabaseService` ↔ `App.tsx`)
- Channel `nicora_realtime_unified` listens on:
  - `shifts` table (INSERT, UPDATE, DELETE): updates `shifts` state via `flushShiftBatch`. Does NOT call `syncPublishedMonthsFromCloud`!
  - `shift_requests` table (INSERT, UPDATE, DELETE): updates `shiftRequests` state.
  - `employees` table (UPDATE where `id = 'sys-app-config'`): updates `publishedMonths` state across all connected clients.

### Staff Privacy Filtering Contract (`App.tsx` ↔ Views)
- `visibleShifts`:
  - When `isManagerMode`: returns all `shifts`.
  - When `!isManagerMode`: returns `shifts.filter(s => isMonthPublished(s.locationId, y, m))`.
- All staff-accessible views (`PlannerGrid`, `TodayPresence`, `MySchedule`, `LeaveRequests`) must receive `visibleShifts` or enforce `isMonthPublished` when `!isManagerMode`.
