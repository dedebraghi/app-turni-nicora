import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Employee, LocationId, Shift, ShiftRequest } from '../domain/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

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
    contractHours: row.contract_hours || 40,
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
    id: shift.id,
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
  return {
    id: row.id,
    requesterId: row.requester_id,
    locationId: row.location_id as LocationId,
    type: row.type,
    targetEmployeeId: row.target_employee_id || undefined,
    shiftDate: row.shift_date,
    targetShiftDate: row.target_shift_date || undefined,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('it-IT') : 'Oggi',
    managerNote: row.manager_note || undefined,
  };
}

export function mapRequestToDb(req: ShiftRequest) {
  return {
    id: req.id,
    requester_id: req.requesterId,
    location_id: req.locationId,
    type: req.type,
    target_employee_id: req.targetEmployeeId || null,
    shift_date: req.shiftDate,
    target_shift_date: req.targetShiftDate || null,
    reason: req.reason,
    status: req.status,
    manager_note: req.managerNote || null,
  };
}
