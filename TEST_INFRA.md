# TEST_INFRA.md: E2E Test Infrastructure & Methodology
**Project**: App Turni Nicora (Nicora Garden Shift Scheduling PWA)  
**Author**: E2E Test Writer (Specialist & QA)  
**Status**: ACTIVE  
**Last Updated**: 2026-10-05  

---

## 1. Test Philosophy & Principles

### 1.1 Opaque-Box & Requirement-Driven
The testing strategy is strictly **opaque-box** and **requirement-driven**, derived directly from:
- User requirements in `ORIGINAL_REQUEST.md` (R1: Draft -> Publish Lifecycle & Privacy; R2: Full Functional Employee/Manager Flows; R3: Database & Repository Safety).
- The comprehensive Feature Inventory in `PROJECT.md` (F01 through F24).
- The public Interface Contracts in `PROJECT.md § Interface Contracts`.

Tests do not inspect or rely on private, volatile component implementation details. Instead, tests interact with the application through public domain contracts, state lifecycle APIs, storage services, scheduler engines, and user-facing action channels.

### 1.2 Anti-Cheat & Test Integrity
All tests are **genuine and execute against actual application code and services**:
1. **No Dummy / Facade Tests**: Every assertion verifies real business logic, state transitions, date computations, department coverage rules, or data isolation.
2. **Explicit Expected Outputs**: Expected values are derived from mathematical formulas, contractual rules (40h/24h contracts, 5 workdays/week, CCIL florovivaisti quotas), or documented business specifications in `PROJECT.md`.
3. **Bug Reproduction & Contract Enforcement**: Tests explicitly reproduce the draft-invalidation flaw (F04) and enforce the authoritative publication contracts (F05-F08) so regressions cannot go unnoticed.
4. **Idempotence & Independence**: Each test initializes its own clean state (isolated in-memory storage, pristine employee rosters, reset timers), executes independently, and cleans up after itself.

---

## 2. 4-Tier Test Design Methodology

The test suite is organized into four rigorous tiers providing full horizontal and vertical verification:

```
tests/
├── harness/
│   ├── browser-env.ts                 # Headless browser globals (localStorage, window, document, URL)
│   ├── app-harness.ts                 # Full app simulation (auth, roles, views, storage, realtime, privacy)
│   └── mock-supabase.ts               # In-memory Supabase provider for deterministic network isolation
└── e2e/
    ├── tier1-features/
    │   ├── f04-f09-draft-lifecycle.test.ts   # Core Features F04-F09 (>= 5 tests per feature = 30 tests)
    │   ├── f10-auth-roles.test.ts            # Core Feature F10 (>= 5 tests)
    │   ├── f11-f12-today-myschedule.test.ts  # Core Features F11-F12 (>= 5 tests per feature = 10 tests)
    │   ├── f13-f15-planner-edits.test.ts     # Core Features F13-F15 (>= 5 tests per feature = 15 tests)
    │   ├── f16-f17-emergency-clear.test.ts   # Core Features F16-F17 (>= 5 tests per feature = 10 tests)
    │   ├── f18-f19-requests-privacy.test.ts  # Core Features F18-F19 (>= 5 tests per feature = 10 tests)
    │   └── f20-f21-personnel-export.test.ts  # Core Features F20-F21 (>= 5 tests per feature = 10 tests)
    ├── tier2-boundaries/
    │   └── boundary-corner-cases.test.ts     # Boundary conditions & edge cases (15+ tests)
    ├── tier3-combinations/
    │   └── cross-feature-flows.test.ts       # Complex multi-feature workflows (10+ tests)
    └── tier4-scenarios/
        ├── gazzada-workflow.test.ts          # Realistic Gazzada Garden Center monthly lifecycle (4 tests)
        └── varese-workflow.test.ts           # Realistic Varese Garden Center Christmas season lifecycle (4 tests)
```

### Tier 1: Feature Coverage (Core Features F04–F21)
Every core feature is covered by at least 5 distinct test cases (totaling >= 90 tests):
- **F04 (Draft Bug Reproduction)**: Reproduces premature publication when Realtime shift flushes trigger storage overrides; asserts banner flash.
- **F05 (Draft Invalidation Root Cause)**: Verifies `flushShiftBatch` does not mark draft months as published; draft status remains stable.
- **F06 (Authoritative Published Months Sync)**: Verifies `fetchCloudPublishedMonths` and `syncPublishedMonthsFromCloud` adhere strictly to cloud truth; eliminates fallback guessing from shifts.
- **F07 (Realtime Cross-Device Publication Sync)**: Tests `sys-app-config` update propagation across multiple simulated client contexts.
- **F08 (Staff Privacy - Shift Visibility)**: Verifies `visibleShifts` hides unpublished drafts from regular staff while revealing them to managers.
- **F09 (Draft Persistence & Manual Edit Persistence)**: Verifies draft shifts survive page reload, persist to cloud, and remain in draft mode after cell edits.
- **F10 (PIN Login & Manager Authentication)**: Tests employee PIN login, manager PIN elevation, master override, invalid PIN rejection, and PIN reset flow.
- **F11 ("Oggi in Sede" View & Labels)**: Verifies today's presence grouping (Mattina, Pomeriggio, Giornata, Riposo, Assenti), statistics counters, and mobile label spelling.
- **F12 ("I Miei Turni" Employee View)**: Verifies personal schedule projection, draft month notice, shift type rendering, and request entry triggers.
- **F13 (Planner Weekly/Monthly & Hours Calculation)**: Verifies weekly hours summation against contracts (40h, 24h), delta badges (+/-), day counters, and week navigation.
- **F14 (Shift Generation Modal & Engine)**: Verifies monthly schedule generation algorithm, preferred days off, Sunday coverage, and draft state assignment.
- **F15 (Manual Shift Edits & Delta Saving)**: Verifies cell modification, shift type changes, and single-shift delta saving.
- **F16 (Emergency Substitution Wizard)**: Verifies absent staff detection, ranking candidate substitutes by skill, availability, and contract quotas.
- **F17 ("Svuota Turni" Clear Shifts)**: Verifies future-only vs whole-month deletion, and unpublishing months when cleared completely.
- **F18 (Leave, Permission, & Swap Requests Lifecycle)**: Verifies preservation of request types (`leave`, `sick`, `schedule_change`, `swap`) and two-step swap peer accept -> manager approval.
- **F19 (Staff Privacy - Requests & Swaps Isolation)**: Verifies regular staff see only their own requests and swaps addressed to them; managers see all.
- **F20 ("Personale e Competenze" & CSV Export)**: Verifies employee CRUD/archival, skills matrix, monthly summary metrics, and Excel CSV formatted export (UTF-8 BOM, semicolon separator).
- **F21 (Desktop & Mobile Responsive Layouts)**: Verifies responsive navigation contracts, header state, mobile day view vs desktop grid.

### Tier 2: Boundary & Corner Cases
Targeted stress testing against fragile conditions:
1. **Empty Inputs & Zero State**: Zero shifts, zero employees, empty request lists, empty localStorage.
2. **Edge Dates & Calendar Boundaries**: Leap year (Feb 29), month boundaries (day 28 vs 30 vs 31), year rollover (Dec 31 -> Jan 1), daylight saving time transitions.
3. **Multi-Location Isolation**: Strict partitioning between `gazzada` and `varese`; shifts or requests in Gazzada never leak into Varese.
4. **Inactive & Archived Staff**: Inactive employees (`isActive: false`) and owner (`isOwner: true`) are excluded from operational rosters and shift generation.
5. **Rapid Re-renders & Out-of-Order Events**: Burst updates, out-of-order Realtime events, and storage race conditions.
6. **Corrupt / Malformed Local Storage**: Graceful recovery and fallback to initial defaults when storage contains malformed JSON or unexpected schema.

### Tier 3: Cross-Feature Combinations
End-to-end integration flows that chain multiple subsystems together:
1. **Draft Generation -> Manual Edit -> Emergency Replacement -> Publish**: Full manager authoring cycle.
2. **Leave Request -> Approval -> Shift Replacement -> Planner Hours Recalculation**: Complete leave workflow updating weekly contract fulfillment.
3. **Two-Step Shift Swap**: Colleague A requests swap with Colleague B -> Colleague B accepts (`pending_colleague` -> `pending`) -> Manager approves -> Shifts swapped in Planner.
4. **Svuota Turni (Future-only) -> Partial Shift Preserved -> Regeneration of Remaining Days**: Selective clearing without losing historical data.
5. **Role Elevation & Switching**: Regular employee logs in -> views limited data -> enters Manager PIN -> elevates to Manager -> views drafts and all requests -> logs out -> privacy restored.

### Tier 4: Real-World Application Scenarios
Full-scale simulation of actual Garden Center operations:
1. **Nicora Garden Gazzada — Monthly October Workflow**:
   - 12 real staff members (Sabrina, Eleonora, Teo, Vittore, etc.).
   - Shift generation for October 2026.
   - Verification of mandatory Cassa and Fioreria daily presence.
   - Manager reviews weekly hours and resolves department gaps.
   - Publication to staff and verification that Sabrina can now see her schedule.
   - Excel CSV report generation and verification of total store hours.
2. **Nicora Garden Varese — Peak Christmas Season Workflow**:
   - 20 staff members across 6 departments plus seasonal 'Natale' department.
   - High customer flow, merchandise arrival bilici (Thursday/Friday).
   - Emergency substitution when a florist reports sick on Saturday morning.
   - Two-step shift swap between weekend cashiers.
   - Verification of complete fairness and contract quotas.

---

## 3. Test Runner & Execution Guide

The test suite runs with **Vitest**:

```bash
# Run all E2E test suites (Tiers 1-4)
npx vitest run tests/e2e

# Run with verbose reporting
npx vitest run tests/e2e --reporter=verbose

# Run a specific tier
npx vitest run tests/e2e/tier1-features
npx vitest run tests/e2e/tier2-boundaries
npx vitest run tests/e2e/tier3-combinations
npx vitest run tests/e2e/tier4-scenarios

# Run full project test command (defined in package.json)
npm test
```

---

## 4. Requirement Traceability Matrix

| Requirement | PROJECT.md Features | Test Files | Coverage Verification |
|-------------|---------------------|------------|-----------------------|
| **R1 (Draft Lifecycle)** | F04, F05, F06, F07, F09 | `tests/e2e/tier1-features/f04-f09-draft-lifecycle.test.ts` | Bug reproduction, stable draft persistence, cross-device publication, edit persistence |
| **R1 (Staff Privacy)** | F08 | `tests/e2e/tier1-features/f04-f09-draft-lifecycle.test.ts` | Draft shifts strictly hidden from non-manager employees |
| **R2 (Auth & Elevation)** | F10 | `tests/e2e/tier1-features/f10-auth-roles.test.ts` | PIN authentication, manager elevation, master override, PIN reset |
| **R2 (Today in Sede)** | F11 | `tests/e2e/tier1-features/f11-f12-today-myschedule.test.ts` | Presence grouping, label spelling, daily counters |
| **R2 (I Miei Turni)** | F12 | `tests/e2e/tier1-features/f11-f12-today-myschedule.test.ts` | Personal calendar, draft banner, shift details |
| **R2 (Planner & Hours)** | F13, F14, F15 | `tests/e2e/tier1-features/f13-f15-planner-edits.test.ts` | Weekly hour quotas, delta badges, generation engine, manual cell edits |
| **R2 (Emergency & Reset)** | F16, F17 | `tests/e2e/tier1-features/f16-f17-emergency-clear.test.ts` | Best replacement advisor, svuota turni future/month, publish state reset |
| **R2 (Requests & Privacy)** | F18, F19 | `tests/e2e/tier1-features/f18-f19-requests-privacy.test.ts` | 4 request types, 2-step peer swap, employee request isolation |
| **R2 (Personnel & CSV)** | F20 | `tests/e2e/tier1-features/f20-f21-personnel-export.test.ts` | Staff CRUD/archive, skills matrix, Italian Excel CSV formatting |
| **R2 (Responsive Layouts)**| F21 | `tests/e2e/tier1-features/f20-f21-personnel-export.test.ts` | Navigation contracts, active tab switching, mobile vs desktop views |
| **Cross-Cutting Quality** | F22 | `tests/e2e/tier2-boundaries/`, `tier3-combinations/`, `tier4-scenarios/` | Edge cases, year boundaries, multi-feature workflows, realistic store simulations |
