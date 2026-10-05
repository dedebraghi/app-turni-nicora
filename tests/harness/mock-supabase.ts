/**
 * In-Memory Mock Supabase Backend
 * Accurately models tables: employees, shifts, shift_requests, and sys-app-config.
 */
import { Employee, LocationId, Shift, ShiftRequest } from '../../src/domain/types';
import { INITIAL_EMPLOYEES } from '../../src/domain/mockData';

export interface SupabaseDatabaseState {
  employees: Map<string, any>;
  shifts: Map<string, Shift>;
  shiftRequests: Map<string, ShiftRequest>;
  publishedMonths: Set<string>;
}

export class MockSupabaseServer {
  public employees: Map<string, any> = new Map();
  public shifts: Map<string, Shift> = new Map();
  public shiftRequests: Map<string, ShiftRequest> = new Map();
  public publishedMonths: Set<string> = new Set();
  public listeners: Array<(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void> = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.employees.clear();
    this.shifts.clear();
    this.shiftRequests.clear();
    this.publishedMonths.clear();
    this.listeners = [];

    // Seed employees from INITIAL_EMPLOYEES
    for (const emp of INITIAL_EMPLOYEES) {
      this.employees.set(emp.id, {
        id: emp.id,
        name: emp.name,
        location_id: emp.locationId,
        role: emp.role,
        skills: emp.skills,
        avatar: emp.avatar,
        email: emp.email,
        phone: emp.phone,
        pin: emp.password || '123',
        is_manager: Boolean(emp.isManager),
        contract_hours: emp.contractHours ?? 40,
        is_active: emp.isActive !== false,
      });
    }

    // Seed sys-app-config record
    this.employees.set('sys-app-config', {
      id: 'sys-app-config',
      name: 'System Config',
      location_id: 'gazzada',
      role: 'System',
      skills: { published_months: [] },
      avatar: 'SY',
      email: 'system@internal.app',
      is_manager: false,
      contract_hours: 0,
      is_active: false,
    });
  }

  // Cloud API simulations
  fetchPublishedMonths(): Set<string> {
    const sysRow = this.employees.get('sys-app-config');
    const months = sysRow?.skills?.published_months;
    if (Array.isArray(months)) {
      return new Set(months);
    }
    return new Set();
  }

  publishMonth(locationId: LocationId, year: number, month: number): void {
    const key = `${locationId}_${year}-${String(month).padStart(2, '0')}`;
    this.publishedMonths.add(key);

    const sysRow = this.employees.get('sys-app-config') || {
      id: 'sys-app-config',
      name: 'System Config',
      location_id: 'gazzada',
      skills: { published_months: [] },
    };

    const currentMonths: string[] = Array.isArray(sysRow.skills?.published_months)
      ? [...sysRow.skills.published_months]
      : [];

    if (!currentMonths.includes(key)) {
      currentMonths.push(key);
    }

    sysRow.skills = { ...sysRow.skills, published_months: currentMonths };
    this.employees.set('sys-app-config', sysRow);

    // Notify listeners of sys-app-config update
    this.broadcast('employees', 'UPDATE', sysRow);
  }

  unpublishMonth(locationId: LocationId, year: number, month: number): void {
    const key = `${locationId}_${year}-${String(month).padStart(2, '0')}`;
    this.publishedMonths.delete(key);

    const sysRow = this.employees.get('sys-app-config');
    if (sysRow && Array.isArray(sysRow.skills?.published_months)) {
      sysRow.skills.published_months = sysRow.skills.published_months.filter((k: string) => k !== key);
      this.employees.set('sys-app-config', sysRow);
      this.broadcast('employees', 'UPDATE', sysRow);
    }
  }

  upsertShifts(shifts: Shift[]): void {
    for (const s of shifts) {
      this.shifts.set(s.id, s);
      this.broadcast('shifts', 'INSERT', s);
    }
  }

  deleteShifts(shiftIds: string[]): void {
    for (const id of shiftIds) {
      const s = this.shifts.get(id);
      if (s) {
        this.shifts.delete(id);
        this.broadcast('shifts', 'DELETE', s);
      }
    }
  }

  clearShiftsForMonth(locationId: LocationId, year: number, month: number): void {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const toDelete: string[] = [];
    for (const [id, s] of this.shifts.entries()) {
      if (s.locationId === locationId && s.date.startsWith(prefix)) {
        toDelete.push(id);
      }
    }
    this.deleteShifts(toDelete);
  }

  subscribe(callback: (table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private broadcast(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any): void {
    for (const cb of this.listeners) {
      cb(table, event, payload);
    }
  }
}
