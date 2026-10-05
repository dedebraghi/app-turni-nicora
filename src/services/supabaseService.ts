import { Employee, LocationId, Shift, ShiftRequest, ShiftRequestStatus } from '../domain/types';
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

      const mapped = data
        .filter((row: any) => !row.id?.startsWith('sys-'))
        .map((row: any) => {
        const emp = mapDbToEmployee(row);
        if (emp.id === 'emp-gz-5' && emp.contractHours === 30) {
          emp.contractHours = 40;
          if (supabase) {
            supabase.from('employees').update({ contract_hours: 40 }).eq('id', 'emp-gz-5').then();
          }
        }
        return emp;
      });
      saveStoredEmployees(mapped);
      return mapped;
    } else {
      // Se la tabella era vuota, inserisci i dipendenti reali in un unico batch
      await supabase.from('employees').upsert(INITIAL_EMPLOYEES.map(mapEmployeeToDb));
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
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
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
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
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
 * Elimina definitivamente un collaboratore (hard-delete) e pulisce i turni/richieste associati
 */
export const deleteCloudEmployee = async (
  empId: string
): Promise<{ success: boolean; error?: string }> => {
  const currentEmps = loadStoredEmployees();
  saveStoredEmployees(currentEmps.filter((e) => e.id !== empId));

  const currentShifts = loadStoredShifts();
  saveStoredShifts(currentShifts.filter((s) => s.employeeId !== empId));

  const currentReqs = loadStoredRequests();
  saveStoredRequests(
    currentReqs.filter((r) => r.requesterId !== empId && r.targetEmployeeId !== empId)
  );

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
  }

  try {
    await supabase.from('shifts').delete().eq('employee_id', empId);
    await supabase
      .from('shift_requests')
      .delete()
      .or(`requester_id.eq.${empId},target_employee_id.eq.${empId}`);
    const { error } = await supabase.from('employees').delete().eq('id', empId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore eliminazione definitiva collaboratore:', err);
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
      const mapped = data.map(mapDbToShift).filter((s) => s.employeeId !== 'emp-gz-4');
      saveStoredShifts(mapped);
      return mapped;
    } else {
      return [];
    }
  } catch (err) {
    console.warn('[Supabase] Fallback a cache locale per i turni:', err);
  }

  return loadStoredShifts();
};

/**
 * Cancella i turni da Supabase e da cache locale
 */
export const deleteCloudShifts = async (
  locationId?: LocationId,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
  }
  try {
    let query = supabase.from('shifts').delete();
    if (locationId) query = query.eq('location_id', locationId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (!locationId && !startDate) query = query.neq('id', 'placeholder_non_existent');
    const { error } = await query;
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore cancellazione turni:', err);
    return { success: false, error: err.message };
  }
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
      .not('id', 'in', '("req-1","req-2","req-3","req-4")')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data) {
      const mapped = data
        .filter((r: any) => !['req-1', 'req-2', 'req-3', 'req-4'].includes(r.id))
        .map(mapDbToRequest);
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
  // Normalizza gli ID e deduplica per (employeeId, date) mantenendo l'ultima versione
  const dedupMap = new Map<string, Shift>();
  for (const s of shifts) {
    if (!s.employeeId || !s.date) continue;
    const key = `${s.employeeId}_${s.date}`;
    dedupMap.set(key, {
      ...s,
      id: `shift-${s.employeeId}-${s.date}`,
    });
  }
  const normalizedShifts = Array.from(dedupMap.values());

  // Unisci con i turni correnti in memoria per non sovrascrivere mesi storici se viene salvato solo un delta
  const current = loadStoredShifts();
  const keySet = new Set(normalizedShifts.map((s) => `${s.employeeId}_${s.date}`));
  const merged = [
    ...current.filter((s) => !keySet.has(`${s.employeeId}_${s.date}`)),
    ...normalizedShifts,
  ];
  saveStoredShifts(merged);

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: 'Database Supabase Cloud non raggiungibile. I turni sono stati memorizzati solo temporaneamente nella cache locale di questo browser.',
    };
  }

  try {
    const rows = normalizedShifts.map(mapShiftToDb);
    const CHUNK_SIZE = 100;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('shifts')
        .upsert(chunk, { onConflict: 'employee_id,date' });

      if (error) throw error;
    }
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
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
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
 * Aggiorna lo stato di una richiesta (approvata/rifiutata dalla Direzione o concordata tra colleghi)
 */
export const updateCloudRequestStatus = async (
  requestId: string,
  status: ShiftRequestStatus,
  managerNote?: string,
  colleagueNote?: string
): Promise<{ success: boolean; error?: string }> => {
  const current = loadStoredRequests();
  const updated = current.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status,
          managerNote: managerNote !== undefined ? managerNote : r.managerNote,
          colleagueNote: colleagueNote !== undefined ? colleagueNote : r.colleagueNote,
        }
      : r
  );
  saveStoredRequests(updated);

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
  }

  try {
    const targetReq = updated.find((r) => r.id === requestId);
    if (targetReq) {
      const row = mapRequestToDb(targetReq);
      const { error } = await supabase
        .from('shift_requests')
        .upsert(row, { onConflict: 'id' });
      if (error) throw error;
    } else {
      let dbStatus = status;
      let note = managerNote || '';
      if (status === 'pending_colleague') {
        dbStatus = 'pending';
        note = (note ? note + ' ' : '') + '[STATO_COLLEGA:pending]';
      } else if (status === 'rejected_colleague') {
        dbStatus = 'rejected';
        note = (note ? note + ' ' : '') + '[STATO_COLLEGA:rejected]';
      }

      const { error } = await supabase
        .from('shift_requests')
        .update({ status: dbStatus, manager_note: note.trim() || null })
        .eq('id', requestId);

      if (error) throw error;
    }
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

/**
 * Carica da Supabase l'elenco dei mesi ufficialmente pubblicati (location + anno + mese).
 * Legge lo stato centralizzato dal record 'sys-app-config' sul cloud.
 * Usato per sincronizzare lo stato di pubblicazione cross-device per tutti i dispositivi.
 */
export const fetchCloudPublishedMonths = async (): Promise<Set<string>> => {
  const result = new Set<string>();

  if (!isSupabaseConfigured || !supabase) {
    return result;
  }

  try {
    // 1. Prova a leggere l'elenco centralizzato dal record di sistema
    const { data: configData, error: configError } = await supabase
      .from('employees')
      .select('skills')
      .eq('id', 'sys-app-config')
      .maybeSingle();

    if (!configError && configData && configData.skills && Array.isArray((configData.skills as any).published_months)) {
      for (const m of (configData.skills as any).published_months) {
        if (typeof m === 'string') {
          result.add(m);
        }
      }
      return result;
    }

    // 2. Fallback: se sys-app-config non è ancora popolato, deduci dai turni storici
    const { data, error } = await supabase
      .from('shifts')
      .select('location_id, date');

    if (error) throw error;
    if (data) {
      for (const row of data) {
        const parts = (row.date as string).split('-');
        if (parts.length >= 2) {
          const key = `${row.location_id}_${parts[0]}-${parts[1]}`;
          result.add(key);
        }
      }
    }
  } catch (err) {
    console.warn('[Supabase] Errore caricamento mesi pubblicati dal cloud:', err);
  }

  return result;
};

/**
 * Pubblica ufficialmente un mese su Supabase Cloud (sys-app-config).
 * Rende i turni di quel mese immediatamente visibili a tutti i collaboratori su qualsiasi dispositivo.
 */
export const publishCloudMonth = async (
  locationId: LocationId,
  year: number,
  month: number
): Promise<{ success: boolean; error?: string }> => {
  const monthKey = `${locationId}_${year}-${String(month).padStart(2, '0')}`;

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
  }

  try {
    const { data } = await supabase
      .from('employees')
      .select('skills')
      .eq('id', 'sys-app-config')
      .maybeSingle();

    const currentMonths: string[] = Array.isArray(data?.skills?.published_months)
      ? [...data.skills.published_months]
      : ['gazzada_2026-09', 'varese_2026-09', 'gazzada_2026-10', 'varese_2026-10'];

    if (!currentMonths.includes(monthKey)) {
      currentMonths.push(monthKey);
    }

    const { error: upsertErr } = await supabase.from('employees').upsert({
      id: 'sys-app-config',
      name: 'Configurazione Sistema',
      location_id: 'gazzada',
      role: 'Area Tecnica',
      avatar: 'CF',
      email: 'system-config@nicoragarden.local',
      is_active: false,
      skills: { published_months: currentMonths },
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) throw upsertErr;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore salvataggio pubblicazione mese su cloud:', err);
    return { success: false, error: err.message || 'Errore pubblicazione cloud' };
  }
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
