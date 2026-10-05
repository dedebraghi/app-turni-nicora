import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Employee, LocationId, Shift, ShiftRequest } from '../domain/types';

const defaultSupabaseUrl = 'https://orxvvlgaguekvdnhqqft.supabase.co';
const defaultAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHZ2bGdhZ3Vla3ZkbmhxcWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDM1NDQsImV4cCI6MjEwNTQ3OTU0NH0.m2RLp51PV_-v3T3zgmsZmMyh7ecy_8K_CUIptsyAReQ';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey)?.trim();

// Verifica che le credenziali siano effettivamente presenti e non placeholder
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// ==========================================
// MAPPER DB <-> DOMAIN MODEL
// ==========================================

export function mapDbToEmployee(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    locationId: row.location_id as LocationId,
    role: row.role,
    skills: row.skills || { Cassa: 5, Fioreria: 5, Decor: 5, 'Serra Calda': 5, 'Serra Fredda': 5 },
    avatar: row.avatar || row.name.slice(0, 2).toUpperCase(),
    email: row.email,
    phone: row.phone || undefined,
    password: row.pin || '1234',
    isManager: Boolean(row.is_manager),
    isOwner: Boolean(row.is_owner) || row.id === 'emp-gz-4' || row.email === 'vittore@nicoragarden.it',
    contractHours: (row.id === 'emp-gz-4' || row.email === 'vittore@nicoragarden.it') ? 0 : (row.contract_hours || 40),
    isActive: row.is_active !== false,
  };
}

export function mapEmployeeToDb(emp: Employee) {
  return {
    id: emp.id,
    name: emp.name,
    location_id: emp.locationId,
    role: emp.role,
    skills: emp.skills,
    avatar: emp.avatar,
    email: emp.email,
    phone: emp.phone || null,
    pin: emp.password || '1234',
    is_manager: Boolean(emp.isManager),
    is_owner: Boolean(emp.isOwner),
    contract_hours: emp.contractHours || 40,
    is_active: emp.isActive !== false,
    updated_at: new Date().toISOString(),
  };
}

export function mapDbToShift(row: any): Shift {
  return {
    id: row.id,
    employeeId: row.employee_id,
    locationId: row.location_id as LocationId,
    date: row.date,
    type: row.type,
    department: row.department || undefined,
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    areaNote: row.area_note || undefined,
    isManualOverride: Boolean(row.is_manual_override),
  };
}

export function mapShiftToDb(shift: Shift) {
  return {
    id: `shift-${shift.employeeId}-${shift.date}`,
    employee_id: shift.employeeId,
    location_id: shift.locationId,
    date: shift.date,
    type: shift.type,
    department: shift.department || null,
    start_time: shift.startTime || null,
    end_time: shift.endTime || null,
    area_note: shift.areaNote || null,
    is_manual_override: Boolean(shift.isManualOverride),
    updated_at: new Date().toISOString(),
  };
}

export function mapDbToRequest(row: any): ShiftRequest {
  let status = row.status;
  let rawNote: string = row.manager_note || '';
  let colleagueNote: string | undefined = undefined;
  let swapMeta: {
    rDept?: any;
    rStart?: string;
    rEnd?: string;
    tDept?: any;
    tStart?: string;
    tEnd?: string;
  } = {};

  // Estrai metadati scambio se presenti
  const metaMatch = rawNote.match(/\[META_SCAMBIO:(\{.*?\})\]/);
  if (metaMatch) {
    try {
      swapMeta = JSON.parse(metaMatch[1]);
    } catch {
      // ignora errori di parsing
    }
    rawNote = rawNote.replace(metaMatch[0], '').trim();
  }

  // Estrai nota del collega se presente
  const collMatch = rawNote.match(/\[NOTA_COLLEGA:(.*?)\]/);
  if (collMatch) {
    colleagueNote = collMatch[1].trim() || undefined;
    rawNote = rawNote.replace(collMatch[0], '').trim();
  }

  // Compatibilità per DB con vincolo status limitato: estrai stato collega da manager_note se presente
  if (rawNote.includes('[STATO_COLLEGA:pending]') && status === 'pending') {
    status = 'pending_colleague';
    rawNote = rawNote.replace('[STATO_COLLEGA:pending]', '').trim();
  } else if (rawNote.includes('[STATO_COLLEGA:rejected]')) {
    status = 'rejected_colleague';
    rawNote = rawNote.replace('[STATO_COLLEGA:rejected]', '').trim();
  }

  const managerNote = rawNote || undefined;

  return {
    id: row.id,
    requesterId: row.requester_id,
    locationId: row.location_id as LocationId,
    type: row.type,
    targetEmployeeId: row.target_employee_id || undefined,
    shiftDate: row.shift_date,
    targetShiftDate: row.target_shift_date || undefined,
    requesterDepartment: swapMeta.rDept || undefined,
    requesterStartTime: swapMeta.rStart || undefined,
    requesterEndTime: swapMeta.rEnd || undefined,
    targetDepartment: swapMeta.tDept || undefined,
    targetStartTime: swapMeta.tStart || undefined,
    targetEndTime: swapMeta.tEnd || undefined,
    protocolNumber: row.protocol_number || undefined,
    reason: row.reason,
    status: status,
    createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('it-IT') : 'Oggi',
    managerNote: managerNote,
    colleagueNote: colleagueNote,
  };
}

export function mapRequestToDb(req: ShiftRequest) {
  let dbStatus = req.status;
  const noteParts: string[] = [];

  if (req.managerNote) {
    noteParts.push(req.managerNote.trim());
  }

  if (req.colleagueNote) {
    noteParts.push(`[NOTA_COLLEGA:${req.colleagueNote.trim()}]`);
  }

  if (
    req.requesterDepartment ||
    req.requesterStartTime ||
    req.requesterEndTime ||
    req.targetDepartment ||
    req.targetStartTime ||
    req.targetEndTime
  ) {
    const metaJson = JSON.stringify({
      rDept: req.requesterDepartment,
      rStart: req.requesterStartTime,
      rEnd: req.requesterEndTime,
      tDept: req.targetDepartment,
      tStart: req.targetStartTime,
      tEnd: req.targetEndTime,
    });
    noteParts.push(`[META_SCAMBIO:${metaJson}]`);
  }

  // Se lo stato è in attesa del collega o rifiutato dal collega, mappa su pending/rejected con tag note di sicurezza
  if (req.status === 'pending_colleague') {
    dbStatus = 'pending';
    noteParts.push('[STATO_COLLEGA:pending]');
  } else if (req.status === 'rejected_colleague') {
    dbStatus = 'rejected';
    noteParts.push('[STATO_COLLEGA:rejected]');
  }

  // Per compatibilità con vincolo CHECK (type IN ('swap', 'leave')) sul DB
  const dbType = req.type === 'swap' ? 'swap' : 'leave';

  return {
    id: req.id,
    requester_id: req.requesterId,
    location_id: req.locationId,
    type: dbType,
    target_employee_id: req.targetEmployeeId || null,
    shift_date: req.shiftDate,
    target_shift_date: req.targetShiftDate || null,
    reason: req.reason,
    status: dbStatus,
    manager_note: noteParts.join(' ').trim() || null,
  };
}

