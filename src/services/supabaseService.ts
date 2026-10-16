import { Employee, LocationId, Shift, ShiftRequest, ShiftRequestStatus } from '../domain/types';
import {
  getStoredManagerToken,
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
  loadStoredEmployees,
  loadStoredRequests,
  loadStoredShifts,
  saveStoredEmployees,
  saveStoredRequests,
  saveStoredShifts,
} from './storageService';
import { INITIAL_EMPLOYEES, MANAGER_MASTER_PASSWORD } from '../domain/mockData';
import { matchesPin } from '../domain/pin';

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
    let { data, error } = await supabase
      .from('employees')
      .select('id, name, location_id, role, skills, avatar, email, phone, is_manager, contract_hours, is_active, has_custom_pin')
      .order('name');

    // Fallback se la migrazione con has_custom_pin non fosse ancora stata applicata
    if (error) {
      const fallbackRes = await supabase
        .from('employees')
        .select('id, name, location_id, role, skills, avatar, email, phone, is_manager, contract_hours, is_active')
        .order('name');
      data = fallbackRes.data as any;
      error = fallbackRes.error;
    }

    if (error) throw error;
    if (data && data.length > 0) {
      const mapped = data
        .filter((row: any) => !row.id?.startsWith('sys-'))
        .map((row: any) => {
          const emp = mapDbToEmployee(row);
          if (emp.id === 'emp-gz-5' && emp.contractHours === 30) {
            emp.contractHours = 40;
          }
          if (emp.id === 'emp-gz-3' && (emp.name === 'Teo' || emp.avatar === 'TE')) {
            emp.name = 'Matteo F.';
            emp.avatar = 'MF';
            if (emp.email === 'teo@nicoragarden.it') emp.email = 'matteo.f@nicoragarden.it';
          }
          if (emp.id === 'emp-va-6' && (emp.name === 'Matteo' || emp.avatar === 'MO')) {
            emp.name = 'Matteo Z.';
            emp.avatar = 'MZ';
            if (emp.email === 'matteo@nicoragarden.it') emp.email = 'matteo.z@nicoragarden.it';
          }
          return emp;
        });
      saveStoredEmployees(mapped);
      return mapped;
    } else {
      return INITIAL_EMPLOYEES;
    }
  } catch (err) {
    console.warn('[Supabase] Fallback a cache locale per i collaboratori:', err);
  }

  return loadStoredEmployees();
};

/**
 * Salva o aggiorna un collaboratore su Supabase e storage locale (senza sovrascrivere il PIN esistente)
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
    const token = getStoredManagerToken();

    if (token) {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_save_employee', {
        p_token: token,
        p_employee: row,
      });
      if (!rpcErr && rpcRes) {
        if ((rpcRes as any).success) return { success: true };
        return { success: false, error: (rpcRes as any).error || 'Sessione Direzione non autorizzata' };
      }
    }

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
 * Reimposta il PIN di un collaboratore a '1234' (azione riservata alla Direzione)
 */
export const resetCloudEmployeePin = async (
  empId: string
): Promise<{ success: boolean; error?: string }> => {
  const current = loadStoredEmployees();
  const updated = current.map((e) =>
    e.id === empId ? { ...e, password: '1234', hasCustomPin: false } : e
  );
  saveStoredEmployees(updated);

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
  }

  try {
    const token = getStoredManagerToken();
    if (token) {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_reset_employee_pin', {
        p_token: token,
        p_employee_id: empId,
      });
      if (!rpcErr && rpcRes) {
        if ((rpcRes as any).success) return { success: true };
        return { success: false, error: (rpcRes as any).error || 'Non autorizzato' };
      }
    }

    const { error } = await supabase
      .from('employees')
      .update({ pin: '1234', has_custom_pin: false, updated_at: new Date().toISOString() })
      .eq('id', empId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore reset PIN collaboratore:', err);
    return { success: false, error: err.message || 'Errore reset PIN' };
  }
};

/**
 * Cambia il PIN personale del collaboratore (verifica il vecchio PIN lato DB tramite RPC)
 */
export const changeCloudEmployeePin = async (
  empId: string,
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    const current = loadStoredEmployees();
    const updated = current.map((e) =>
      e.id === empId ? { ...e, password: newPin.trim(), hasCustomPin: true } : e
    );
    saveStoredEmployees(updated);
    return { success: true };
  }

  try {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('change_employee_pin', {
      p_employee_id: empId,
      p_old_pin: oldPin,
      p_new_pin: newPin.trim(),
    });

    if (rpcErr) throw rpcErr;
    if (rpcRes && typeof (rpcRes as any).success === 'boolean') {
      if ((rpcRes as any).success) {
        const current = loadStoredEmployees();
        const updated = current.map((e) =>
          e.id === empId ? { ...e, password: undefined, hasCustomPin: true } : e
        );
        saveStoredEmployees(updated);
        return { success: true };
      }
      return {
        success: false,
        error: (rpcRes as any).error || 'Impossibile aggiornare il PIN',
      };
    }

    return { success: false, error: 'Risposta non valida dal server' };
  } catch (err: any) {
    console.error('[Supabase] Errore cambio PIN collaboratore:', err);
    return { success: false, error: err.message || 'Errore durante il cambio PIN' };
  }
};

/**
 * Cambia la password della Direzione tramite RPC protetta
 */
export const changeCloudManagerPassword = async (
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true };
  }

  try {
    const token = getStoredManagerToken();
    if (!token) {
      return { success: false, error: 'Sessione Direzione non valida. Effettua nuovamente il login.' };
    }

    const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_change_password', {
      p_token: token,
      p_old_password: oldPassword,
      p_new_password: newPassword.trim(),
    });

    if (rpcErr) throw rpcErr;
    if (rpcRes && (rpcRes as any).success) {
      return { success: true };
    }
    return {
      success: false,
      error: (rpcRes as any)?.error || 'Impossibile aggiornare la password Direzione',
    };
  } catch (err: any) {
    console.error('[Supabase] Errore cambio password Direzione:', err);
    return { success: false, error: err.message || 'Errore durante il cambio password' };
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
    const token = getStoredManagerToken();
    if (token) {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_archive_employee', {
        p_token: token,
        p_employee_id: empId,
        p_is_active: isActive,
      });
      if (!rpcErr && rpcRes) {
        if ((rpcRes as any).success) return { success: true };
        return { success: false, error: (rpcRes as any).error || 'Sessione Direzione non valida' };
      }
    }

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
    const token = getStoredManagerToken();
    if (token) {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_delete_employee', {
        p_token: token,
        p_employee_id: empId,
      });
      if (!rpcErr && rpcRes) {
        if ((rpcRes as any).success) return { success: true };
        return { success: false, error: (rpcRes as any).error || 'Sessione Direzione non valida' };
      }
    }

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
    const token = getStoredManagerToken();
    if (token) {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_delete_shifts', {
        p_token: token,
        p_location_id: locationId || null,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });
      if (!rpcErr && rpcRes) {
        if ((rpcRes as any).success) return { success: true };
        return { success: false, error: (rpcRes as any).error || 'Sessione Direzione non valida' };
      }
    }

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
    const token = getStoredManagerToken();

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);

      if (token) {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_upsert_shifts', {
          p_token: token,
          p_shifts: chunk,
        });
        if (!rpcErr && rpcRes) {
          if (!(rpcRes as any).success) {
            throw new Error((rpcRes as any).error || 'Sessione Direzione non valida');
          }
          continue;
        }
      }

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
    const row = targetReq
      ? mapRequestToDb(targetReq)
      : (() => {
          let dbStatus = status;
          let note = managerNote || '';
          if (status === 'pending_colleague') {
            dbStatus = 'pending';
            note = (note ? note + ' ' : '') + '[STATO_COLLEGA:pending]';
          } else if (status === 'rejected_colleague') {
            dbStatus = 'rejected';
            note = (note ? note + ' ' : '') + '[STATO_COLLEGA:rejected]';
          }
          return {
            status: dbStatus,
            manager_note: note.trim() || null,
          };
        })();

    const token = getStoredManagerToken();
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('update_shift_request_secure', {
      p_request_id: requestId,
      p_status: row.status,
      p_manager_note: row.manager_note,
      p_token: token || null,
      p_employee_id: null,
      p_employee_pin: null,
    });

    if (!rpcErr && rpcRes) {
      if ((rpcRes as any).success) return { success: true };
      return { success: false, error: (rpcRes as any).error || 'Operazione non autorizzata' };
    }

    const { error } = await supabase
      .from('shift_requests')
      .update({ status: row.status, manager_note: row.manager_note })
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
  if (isSupabaseConfigured && supabase) {
    try {
      // Verifica via RPC protetta con rate-limit lato DB (Postgres SECURITY DEFINER - no leak di pin)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('verify_employee_pin', {
        p_employee_id: employee.id,
        p_pin: enteredPin,
      });

      if (!rpcError && typeof rpcResult === 'boolean') {
        return rpcResult;
      }
    } catch (err) {
      console.warn('[Supabase] Errore verifica PIN remoto via RPC:', err);
    }
  }

  return matchesPin(employee.password, enteredPin);
};

/**
 * Autentica la Direzione su Supabase restituendo il token crittografico di sessione
 * (Nessuna master key è presente nel bundle client!)
 */
export const authenticateCloudManager = async (
  email: string,
  enteredPassword: string
): Promise<{ success: boolean; token?: string; error?: string; locked?: boolean }> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: authData, error: authErr } = await supabase.rpc('authenticate_manager', {
        p_email: email.trim().toLowerCase(),
        p_password: enteredPassword,
      });

      if (!authErr && authData && typeof (authData as any).success === 'boolean') {
        return {
          success: (authData as any).success,
          token: (authData as any).token,
          error: (authData as any).error,
          locked: Boolean((authData as any).locked),
        };
      }

      // Fallback se la nuova RPC authenticate_manager non è ancora stata eseguita ma c'è verify_manager_password
      const { data: rpcResult, error: rpcError } = await supabase.rpc('verify_manager_password', {
        p_email: email.trim().toLowerCase(),
        p_password: enteredPassword,
      });

      if (!rpcError && typeof rpcResult === 'boolean') {
        return { success: rpcResult };
      }
    } catch (err) {
      console.warn('[Supabase] Errore autenticazione direzione remota:', err);
    }
  } else {
    // Modalità test/offline senza Supabase configurato
    const isOfflineValid = enteredPassword === MANAGER_MASTER_PASSWORD;
    return {
      success: isOfflineValid,
      token: isOfflineValid ? 'local-offline-manager-token' : undefined,
    };
  }

  return { success: false, error: 'Impossibile verificare le credenziali con il server.' };
};

/**
 * Verifica se il token di sessione Manager salvato in localStorage è realmente valido sul server
 */
export const verifyManagerSessionToken = async (token?: string): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) {
    return Boolean(token);
  }
  if (!token || token.trim().length < 16) {
    return false;
  }
  try {
    const { data, error } = await supabase.rpc('is_valid_manager_session', {
      p_token: token.trim(),
    });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (err) {
    console.warn('[Supabase] Errore verifica sessione manager:', err);
  }
  return false;
};

/**
 * Compatibilità con chiamate booleane legacy
 */
export const verifyManagerPassword = async (
  email: string,
  enteredPassword: string
): Promise<boolean> => {
  const res = await authenticateCloudManager(email, enteredPassword);
  return res.success;
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
    // Prova a leggere l'elenco centralizzato dal record di sistema
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

    const currentSkills = (data?.skills as any) || {};
    const currentMonths: string[] = Array.isArray(currentSkills.published_months)
      ? [...currentSkills.published_months]
      : [];

    if (!currentMonths.includes(monthKey)) {
      currentMonths.push(monthKey);
    }

    const nextSkills = { ...currentSkills, published_months: currentMonths };
    const token = getStoredManagerToken();

    if (token) {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_update_app_config', {
        p_token: token,
        p_skills: nextSkills,
      });
      if (!rpcErr && rpcRes && (rpcRes as any).success) {
        return { success: true };
      }
    }

    const { error: upsertErr } = await supabase.from('employees').upsert({
      id: 'sys-app-config',
      name: 'Configurazione Sistema',
      location_id: 'gazzada',
      role: 'Area Tecnica',
      avatar: 'CF',
      email: 'system-config@nicoragarden.local',
      is_active: false,
      skills: nextSkills,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) throw upsertErr;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore salvataggio pubblicazione mese su cloud:', err);
    return { success: false, error: err.message || 'Errore pubblicazione cloud' };
  }
};

/**
 * Carica dal cloud l'elenco degli ID di scoperture/presidi ignorati dalla Direzione.
 */
export const fetchCloudIgnoredGaps = async (): Promise<string[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }
  try {
    const { data: configData, error: configError } = await supabase
      .from('employees')
      .select('skills')
      .eq('id', 'sys-app-config')
      .maybeSingle();

    if (!configError && configData && configData.skills && Array.isArray((configData.skills as any).ignored_gaps)) {
      return (configData.skills as any).ignored_gaps.filter((g: any) => typeof g === 'string');
    }
  } catch (err) {
    console.warn('[Supabase] Errore caricamento avvisi ignorati dal cloud:', err);
  }
  return [];
};

/**
 * Salva sul cloud l'elenco sincronizzato delle criticità/presidi ignorati.
 */
export const saveCloudIgnoredGaps = async (
  gapIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Database Supabase Cloud non raggiungibile.' };
  }
  try {
    const { data } = await supabase
      .from('employees')
      .select('skills')
      .eq('id', 'sys-app-config')
      .maybeSingle();

    const currentSkills = (data?.skills as any) || {};
    const updatedSkills = {
      ...currentSkills,
      ignored_gaps: gapIds,
    };

    const token = getStoredManagerToken();
    if (token) {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('manager_update_app_config', {
        p_token: token,
        p_skills: updatedSkills,
      });
      if (!rpcErr && rpcRes && (rpcRes as any).success) {
        return { success: true };
      }
    }

    const { error: upsertErr } = await supabase.from('employees').upsert({
      id: 'sys-app-config',
      name: 'Configurazione Sistema',
      location_id: 'gazzada',
      role: 'Area Tecnica',
      avatar: 'CF',
      email: 'system-config@nicoragarden.local',
      is_active: false,
      skills: updatedSkills,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) throw upsertErr;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Errore salvataggio avvisi ignorati su cloud:', err);
    return { success: false, error: err.message || 'Errore salvataggio cloud' };
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
  onConfigChange?: (publishedMonths: Set<string>) => void;
  onIgnoredGapsChange?: (ignoredGapIds: string[]) => void;
  /** Aggiornamento anagrafica collaboratore (es. cambio PIN da altro dispositivo) */
  onEmployeeChange?: (employee: Employee) => void;
}

/**
 * Attiva la sottoscrizione WebSocket Realtime su Supabase per sincronizzare
 * istantaneamente turni, richieste ferie e pubblicazione tra tutti i dispositivi.
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
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      (payload) => {
        const newRecord = payload.new as any;
        if (newRecord && newRecord.id === 'sys-app-config') {
          const publishedMonths = new Set<string>();
          if (newRecord.skills && Array.isArray(newRecord.skills.published_months)) {
            for (const m of newRecord.skills.published_months) {
              if (typeof m === 'string') {
                publishedMonths.add(m);
              }
            }
          }
          handlers.onConfigChange?.(publishedMonths);

          if (newRecord.skills && Array.isArray(newRecord.skills.ignored_gaps)) {
            handlers.onIgnoredGapsChange?.(
              newRecord.skills.ignored_gaps.filter((g: any) => typeof g === 'string')
            );
          }
        } else if (
          newRecord &&
          typeof newRecord.id === 'string' &&
          !newRecord.id.startsWith('sys-') &&
          payload.eventType !== 'DELETE'
        ) {
          handlers.onEmployeeChange?.(mapDbToEmployee(newRecord));
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
