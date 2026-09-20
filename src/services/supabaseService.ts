import { Employee, Shift, ShiftRequest } from '../domain/types';
import {
  isSupabaseConfigured,
  mapDbToEmployee,
  mapDbToRequest,
  mapDbToShift,
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
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    if (data && data.length > 0) {
      const mapped = data.map(mapDbToEmployee);
      saveStoredEmployees(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('[Supabase] Fallback a cache locale per i collaboratori:', err);
  }

  return loadStoredEmployees();
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
