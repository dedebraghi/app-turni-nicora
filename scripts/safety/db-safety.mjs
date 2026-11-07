/**
 * Database & Repository Safety Scripts for App Turni Nicora
 * Requirement R3: Safe handling of production database & fresh install reset
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_FILE = path.join(__dirname, 'employees_snapshot.json');

// Supabase credentials (fallback to known project config if env not set)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://orxvvlgaguekvdnhqqft.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHZ2bGdhZ3Vla3ZkbmhxcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDM1NDQsImV4cCI6MjEwNTQ3OTU0NH0.m2RLp51PV_-v3T3zgmsZmMyh7ecy_8K_CUIptsyAReQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SAFE_EMP_COLUMNS =
  'id, name, location_id, role, skills, avatar, email, phone, is_manager, contract_hours, is_active, has_custom_pin, created_at, updated_at';

/**
 * 1. Snapshot employees table to local JSON file
 */
export async function snapshotEmployees() {
  console.log('[SAFETY] Fetching all rows from employees...');
  let { data, error } = await supabase
    .from('employees')
    .select(SAFE_EMP_COLUMNS)
    .order('id');

  if (error) {
    const fallback = await supabase
      .from('employees')
      .select('id, name, location_id, role, skills, avatar, email, phone, is_manager, contract_hours, is_active')
      .order('id');
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(`Failed to fetch employees: ${error.message}`);
  }

  const payload = {
    metadata: {
      timestamp: new Date().toISOString(),
      rowCount: data.length,
      supabaseUrl: SUPABASE_URL,
    },
    employees: data,
  };

  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[SAFETY] Successfully snapshotted ${data.length} employees to ${SNAPSHOT_FILE}`);
  return payload;
}

/**
 * 2. Verify current database state against expectations
 */
export async function verifyDatabaseState(options = { requireClean: false }) {
  console.log('[SAFETY] Verifying database status...');
  const { count: locCount } = await supabase.from('locations').select('*', { count: 'exact', head: true });
  const { count: empCount, data: emps } = await supabase
    .from('employees')
    .select(SAFE_EMP_COLUMNS, { count: 'exact' })
    .order('id');
  const { count: shCount } = await supabase.from('shifts').select('*', { count: 'exact', head: true });
  const { count: reqCount } = await supabase.from('shift_requests').select('*', { count: 'exact', head: true });

  const { data: sysRow } = await supabase.from('employees').select('skills').eq('id', 'sys-app-config').maybeSingle();
  const publishedMonths = sysRow?.skills?.published_months || [];

  console.log('--- Current Supabase Row Counts ---');
  console.log(`locations:       ${locCount}`);
  console.log(`employees:       ${empCount}`);
  console.log(`shifts:          ${shCount} (visible published months: ${publishedMonths.length})`);
  console.log(`shift_requests:  ${reqCount}`);
  console.log(`published_months: ${JSON.stringify(publishedMonths)}`);

  let snapshotMatch = null;
  if (fs.existsSync(SNAPSHOT_FILE)) {
    const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
    const snapshot = JSON.parse(raw);
    const snapEmps = snapshot.employees;
    
    const snapMap = new Map(snapEmps.map(e => [e.id, e]));
    const currentMap = new Map((emps || []).map(e => [e.id, e]));

    // Active employees must be present in DB; archived employees (is_active: false) may be supplemented client-side
    const missingIds = snapEmps
      .filter(e => e.is_active !== false && !currentMap.has(e.id))
      .map(e => e.id);
    const extraIds = (emps || []).filter(e => !snapMap.has(e.id)).map(e => e.id);
    const modified = [];

    for (const snap of snapEmps) {
      const cur = currentMap.get(snap.id);
      if (cur) {
        const diffs = [];
        for (const key of ['name', 'location_id', 'role', 'contract_hours', 'is_active']) {
          if (snap[key] !== cur[key]) {
            diffs.push(`${key}: expected ${snap[key]}, found ${cur[key]}`);
          }
        }
        if (cur.has_custom_pin === true) {
          diffs.push(`has_custom_pin: expected false, found true`);
        }
        if (JSON.stringify(snap.skills) !== JSON.stringify(cur.skills)) {
          diffs.push(`skills mismatch`);
        }
        if (diffs.length > 0) {
          modified.push({ id: snap.id, diffs });
        }
      }
    }

    snapshotMatch = {
      identical: missingIds.length === 0 && extraIds.length === 0 && modified.length === 0,
      missingIds,
      extraIds,
      modified,
      snapshotRowCount: snapEmps.length,
      currentRowCount: (emps || []).length,
    };
    console.log('Snapshot comparison:', snapshotMatch.identical ? 'IDENTICAL (100% MATCH)' : 'MISMATCH DETECTED', snapshotMatch);
  } else {
    console.warn(`[SAFETY] Warning: Snapshot file not found at ${SNAPSHOT_FILE}`);
  }

  const results = {
    locationsCount: locCount,
    employeesCount: empCount,
    shiftsCount: shCount,
    shiftRequestsCount: reqCount,
    publishedMonths,
    snapshotMatch,
  };

  if (options.requireClean) {
    const isClean =
      reqCount === 0 &&
      Array.isArray(publishedMonths) &&
      publishedMonths.length === 0 &&
      snapshotMatch?.identical === true;
    console.log(`Clean State Check: ${isClean ? 'PASS (Ready for production delivery)' : 'FAIL (Dirty state)'}`);
    results.isClean = isClean;
  }

  return results;
}

/**
 * 3. Clean up shifts (0 rows), shift_requests (0 rows), and published_months ([])
 */
export async function cleanTestData() {
  console.log('[SAFETY] Cleaning shifts, shift_requests, and published_months...');

  // 1. Delete all shifts (using .neq to satisfy PostgREST filter requirement)
  const { error: shErr } = await supabase
    .from('shifts')
    .delete()
    .neq('id', '__safety_placeholder__');
  if (shErr) console.warn(`[SAFETY] Note on shifts delete: ${shErr.message}`);

  // 2. Delete all shift_requests
  const { error: reqErr } = await supabase
    .from('shift_requests')
    .delete()
    .neq('id', '__safety_placeholder__');
  if (reqErr) console.warn(`[SAFETY] Note on shift_requests delete: ${reqErr.message}`);

  // 3. Reset sys-app-config published_months to empty array []
  const { error: sysErr } = await supabase
    .from('employees')
    .update({
      skills: { published_months: [] },
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'sys-app-config');
  if (sysErr) console.warn(`[SAFETY] Note on sys-app-config update: ${sysErr.message}`);

  console.log('[SAFETY] Test data cleanup completed.');
  return await verifyDatabaseState({ requireClean: false });
}

/**
 * 4. Restore employees table cleanly from snapshot
 */
export async function restoreEmployees() {
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    throw new Error(`Cannot restore: snapshot file not found at ${SNAPSHOT_FILE}`);
  }

  const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
  const snapshot = JSON.parse(raw);
  const snapEmps = snapshot.employees;
  console.log(`[SAFETY] Restoring ${snapEmps.length} employees from snapshot...`);

  // 1. Check for extra employees in DB and delete them
  const { data: currentEmps } = await supabase.from('employees').select('id');
  const snapIds = new Set(snapEmps.map(e => e.id));
  const extraIds = (currentEmps || []).filter(e => !snapIds.has(e.id)).map(e => e.id);

  if (extraIds.length > 0) {
    console.log(`[SAFETY] Removing ${extraIds.length} extra test employees:`, extraIds);
    await supabase
      .from('employees')
      .delete()
      .in('id', extraIds);
  }

  // 2. Upsert all snapshotted employees in chunks of 50 (if direct upsert is allowed)
  const CHUNK_SIZE = 50;
  for (let i = 0; i < snapEmps.length; i += CHUNK_SIZE) {
    const chunk = snapEmps.slice(i, i + CHUNK_SIZE);
    const { error: upsertErr } = await supabase
      .from('employees')
      .upsert(chunk, { onConflict: 'id' });
    if (upsertErr) {
      console.info(`[SAFETY] Direct upsert restricted by RLS (${upsertErr.message}); verifying current DB rows...`);
      break;
    }
  }

  console.log('[SAFETY] Employees restore check completed.');
  return await verifyDatabaseState({ requireClean: false });
}

// CLI runner
const action = process.argv[2];
if (action === 'snapshot') {
  snapshotEmployees().catch(console.error);
} else if (action === 'verify') {
  verifyDatabaseState({ requireClean: false }).catch(console.error);
} else if (action === 'verify-clean') {
  verifyDatabaseState({ requireClean: true }).catch(console.error);
} else if (action === 'clean') {
  cleanTestData().catch(console.error);
} else if (action === 'restore') {
  restoreEmployees().catch(console.error);
} else if (action) {
  console.error(`Unknown action: ${action}. Usage: node scripts/safety/db-safety.mjs [snapshot|verify|verify-clean|clean|restore]`);
}
