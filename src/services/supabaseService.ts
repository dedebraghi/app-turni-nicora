import { Employee, Shift, ShiftRequest } from '../domain/types';
import {
  isSupabaseConfigured,
  mapDbToEmployee,
  mapDbToRequest,
  mapDbToShift,
  mapEmployeeToDb,
  mapRequestToDb,
  mapShiftToDb,
  supabase,
} from './supabaseClient';
import {
  generateInitialShifts,
  loadStoredEmployees,
  loadStoredRequests,
  loadStoredShifts,
  saveStoredEmployees,
  saveStoredRequests,
  saveStoredShifts,
} from './storageService';
import { INITIAL_EMPLOYEES } from '../domain/mockData';

/**
 * Informazioni sullo stato di connessione a Supabase
 */
export const getCloudStatus = () => {
  return {
    isConfigured: isSupabaseConfigured,
    provider: isSupabaseConfigured ? 'Supabase PostgreSQL Cloud' : 'Locale (localStorage)',
  };
};

/**
 * Carica l'elenco collaboratori da Supabase con fallback a cache locale
 */
export const fetchCloudEmployees = async (): Promise<Employee[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return loadStoredEmployees();
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');

    if (error) throw error;
    if (data && data.length > 0) {
      // Controllo se i dati su Supabase sono ancora quelli fittizi delle vecchie demo
      const hasMockDemoNames = data.some((e: any) =>
        e.name === 'Cecilia T.' || e.name === 'Marco V.' || e.name === 'Alessandro N.' || e.name === 'Andrea P.'
      );

      if (hasMockDemoNames) {
        console.info('[Supabase] Rilevati nomi fittizi nel DB: pulizia ed eliminazione definitiva...');
        
        // 1. Elimina da Supabase i vecchi dipendenti fittizi che non appartengono allo staff reale
        const realIds = INITIAL_EMPLOYEES.map((e) => e.id);
        const mockRecords = data.filter((e: any) => !realIds.includes(e.id));
        for (const mockEmp of mockRecords) {
          await supabase.from('employees').delete().eq('id', mockEmp.id);
        }

        // 2. Inserisci o aggiorna tutti i dipendenti reali
        for (const emp of INITIAL_EMPLOYEES) {
          await supabase.from('employees').upsert(mapEmployeeToDb(emp));
        }

        // 3. Ricarica la lista pulita
        const { data: updatedData } = await supabase.from('employees').select('*').order('name');
        if (updatedData && updatedData.length > 0) {
          const mapped = updatedData.map(mapDbToEmployee);
          saveStoredEmployees(mapped);
          return mapped;
        }
      }

      const mapped = data.map(mapDbToEmployee);
      saveStoredEmployees(mapped);
      return mapped;
    } else {
      // Se la tabella era vuota, inserisci i dipendenti reali
      for (const emp of INITIAL_EMPLOYEES) {
        await supabase.from('employees').upsert(mapEmployeeToDb(emp));
      }
      return INITIAL_EMPLOYEES;
    }
  } catch (err) {
    console.warn('[Supabase] Fallback a cache locale per i collaboratori:', err);
  }

  return loadStoredEmployees();
};

/**
 * Salva o aggiorna un collaboratore su Supabase e storage locale
 */
export const saveCloudEmployee = async (emp: Employee): Promise<{ success: boolean; error?: string }> => {
  const current = loadStoredEmployees();
  const exists = current.some((e) => e.id === emp.id);
  const updated = exists
    ? current.map((e) => (e.id === emp.id ? emp : e))
    : [emp, ...current];
  saveStoredEmployees(updated);

  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    const row = mapEmployeeToDb(emp);
    const { error } = await supabase
      .from('employees')
      .upsert(row, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore salvataggio collaboratore:', err);
    return { success: false, error: err.message || 'Errore salvataggio collaboratore' };
  }
};

/**
 * Archivia (soft-delete) o riattiva un collaboratore
 */
export const archiveCloudEmployee = async (
  empId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> => {
  const current = loadStoredEmployees();
  const updated = current.map((e) => (e.id === empId ? { ...e, isActive } : e));
  saveStoredEmployees(updated);

  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('employees')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', empId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore archiviazione collaboratore:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Carica i turni da Supabase con fallback a cache locale
 */
export const fetchCloudShifts = async (): Promise<Shift[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return loadStoredShifts();
  }

  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      const mapped = data.map(mapDbToShift);
      saveStoredShifts(mapped);
      return mapped;
    } else {
      // Se la tabella turni su Supabase è ancora vuota, creiamo e sincronizziamo i turni iniziali
      const initial = generateInitialShifts();
      await saveCloudShifts(initial);
      return initial;
    }
  } catch (err) {
    console.warn('[Supabase] Fallback a cache locale per i turni:', err);
  }

  return loadStoredShifts();
};

/**
 * Carica le richieste da Supabase con fallback a cache locale
 */
export const fetchCloudRequests = async (): Promise<ShiftRequest[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return loadStoredRequests();
  }

  try {
    const { data, error } = await supabase
      .from('shift_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      const mapped = data.map(mapDbToRequest);
      saveStoredRequests(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('[Supabase] Fallback a cache locale per le richieste:', err);
  }

  return loadStoredRequests();
};

/**
 * Salva i turni su Supabase e in cache locale (Cloud-First con Cache Offline)
 */
export const saveCloudShifts = async (shifts: Shift[]): Promise<{ success: boolean; error?: string }> => {
  // Salva sempre prima in locale per reattività immediata
  saveStoredShifts(shifts);

  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    const rows = shifts.map(mapShiftToDb);
    const { error } = await supabase
      .from('shifts')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore sincronizzazione turni:', err);
    return { success: false, error: err.message || 'Errore sincronizzazione Cloud' };
  }
};

/**
 * Invia una richiesta ferie o scambio turno a Supabase
 */
export const saveCloudRequest = async (req: ShiftRequest): Promise<{ success: boolean; error?: string }> => {
  const current = loadStoredRequests();
  const updated = [req, ...current.filter((r) => r.id !== req.id)];
  saveStoredRequests(updated);

  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    const row = mapRequestToDb(req);
    const { error } = await supabase
      .from('shift_requests')
      .upsert(row, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore inserimento richiesta:', err);
    return { success: false, error: err.message || 'Errore salvataggio richiesta' };
  }
};

/**
 * Aggiorna lo stato di una richiesta (approvata/rifiutata dalla Direzione)
 */
export const updateCloudRequestStatus = async (
  requestId: string,
  status: 'approved' | 'rejected',
  managerNote?: string
): Promise<{ success: boolean; error?: string }> => {
  const current = loadStoredRequests();
  const updated = current.map((r) =>
    r.id === requestId ? { ...r, status, managerNote: managerNote ?? r.managerNote } : r
  );
  saveStoredRequests(updated);

  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('shift_requests')
      .update({ status, manager_note: managerNote || null })
      .eq('id', requestId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore aggiornamento richiesta:', err);
    return { success: false, error: err.message || 'Errore aggiornamento' };
  }
};

/**
 * Verifica PIN per il login collaboratore
 */
export const verifyEmployeePin = async (
  employee: Employee,
  enteredPin: string
): Promise<boolean> => {
  // Supporta '1234', '123' o la password/pin registrata per compatibilità demo
  const validPins = [employee.password, '1234', '123'].filter(Boolean);

  if (validPins.includes(enteredPin)) {
    return true;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('pin')
        .eq('id', employee.id)
        .single();

      if (!error && data?.pin) {
        return data.pin === enteredPin;
      }
    } catch (err) {
      console.warn('[Supabase] Errore verifica PIN remoto:', err);
    }
  }

  return false;
};

// ==========================================
// CANALI REALTIME UNIFICATI (GAZZADA & VARESE)
// ==========================================

export interface RealtimeSubscriptionHandlers {
  onShiftChange: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    newShift?: Shift;
    oldId?: string;
  }) => void;
  onRequestChange: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    newRequest?: ShiftRequest;
    oldId?: string;
  }) => void;
}

/**
 * Attiva la sottoscrizione WebSocket Realtime su Supabase per sincronizzare
 * istantaneamente turni e richieste ferie tra tutti i dispositivi.
 * Restituisce la funzione di cleanup da richiamare all'unmount.
 */
export const subscribeToRealtimeChanges = (
  handlers: RealtimeSubscriptionHandlers
): (() => void) => {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const client = supabase;
  const channel = client
    .channel('nicora_realtime_unified')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shifts' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          handlers.onShiftChange({
            eventType: 'DELETE',
            oldId: (payload.old as any)?.id,
          });
        } else if (payload.new) {
          const mapped = mapDbToShift(payload.new);
          handlers.onShiftChange({
            eventType: payload.eventType as 'INSERT' | 'UPDATE',
            newShift: mapped,
          });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shift_requests' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          handlers.onRequestChange({
            eventType: 'DELETE',
            oldId: (payload.old as any)?.id,
          });
        } else if (payload.new) {
          const mapped = mapDbToRequest(payload.new);
          handlers.onRequestChange({
            eventType: payload.eventType as 'INSERT' | 'UPDATE',
            newRequest: mapped,
          });
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.info('[Realtime] Sottoscrizione canali unificati Gazzada & Varese attiva.');
      }
    });

  return () => {
    client.removeChannel(channel);
  };
};
