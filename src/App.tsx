import React, { useState, useEffect } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { ResponsiveNav } from './components/layout/ResponsiveNav';
import { TodayPresence } from './components/staff/TodayPresence';
import { MySchedule } from './components/staff/MySchedule';
import { LeaveRequests } from './components/staff/LeaveRequests';
import { PlannerGrid } from './components/admin/PlannerGrid';
import { SkillsMatrix } from './components/admin/SkillsMatrix';
import { StaffPersonnel } from './components/admin/StaffPersonnel';
import { GenerateModal } from './components/admin/GenerateModal';
import { ClearShiftsModal } from './components/admin/ClearShiftsModal';
import { EmergencyModal } from './components/admin/EmergencyModal';
import { PrintExportModal } from './components/admin/PrintExportModal';
import { EditShiftModal } from './components/common/EditShiftModal';
import { OnboardingTutorial } from './components/common/OnboardingTutorial';
import { LoginScreen } from './components/auth/LoginScreen';
import { NotificationToast, ToastMessage } from './components/common/NotificationToast';

import { ActiveTab, Department, Employee, LocationId, Shift, ShiftRequest, ShiftRequestStatus, ShiftType, SkillScores, UserSession } from './domain/types';
import { LOCATIONS } from './domain/mockData';
import { formatLocalDate, getSundayOfWeek, getWeekDays } from './engine/schedulerEngine';
import {
  loadStoredEmployees,
  loadStoredLocation,
  loadStoredRequests,
  loadStoredSession,
  loadStoredShifts,
  saveStoredEmployees,
  saveStoredLocation,
  saveStoredRequests,
  saveStoredSession,
  saveStoredShifts,
  resetDraftGenerated,
  clearStoredShifts,
  isMonthPublished,
  recordMonthPublished,
  recordMonthUnpublished,
  syncPublishedMonthsFromCloud,
} from './services/storageService';
import {
  archiveCloudEmployee,
  deleteCloudEmployee,
  fetchCloudEmployees,
  fetchCloudRequests,
  fetchCloudShifts,
  fetchCloudPublishedMonths,
  saveCloudEmployee,
  saveCloudRequest,
  deleteCloudShifts,
  saveCloudShifts,
  subscribeToRealtimeChanges,
  updateCloudRequestStatus,
} from './services/supabaseService';

export const App: React.FC = () => {
  // Sede attiva (Gazzada o Varese)
  const [activeLocation, setActiveLocation] = useState<LocationId>(loadStoredLocation);

  // Sessione utente loggato
  const [session, setSession] = useState<UserSession | null>(loadStoredSession);

  // Collaboratori, Turni, Richieste
  const [employees, setEmployees] = useState<Employee[]>(loadStoredEmployees);
  const [shifts, setShifts] = useState<Shift[]>(loadStoredShifts);
  const [requests, setRequests] = useState<ShiftRequest[]>(loadStoredRequests);

  // Tab di navigazione
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  
  // Modalità Responsabile / Manager
  const [isManagerMode, setIsManagerMode] = useState<boolean>(() => session?.role === 'manager');

  // Modali
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isTutorialManualOpen, setIsTutorialManualOpen] = useState(false);
  const [emergencyTargetShift, setEmergencyTargetShift] = useState<Shift | null>(null);

  const todayStr = formatLocalDate(new Date());

  // Toast Notifica Realtime per il collaboratore
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Inizializzazione Cloud al mount con fallback trasparente a locale
  useEffect(() => {
    let isMounted = true;
    const initCloud = async () => {
      try {
        const [cloudEmps, cloudShifts, cloudReqs, cloudPubMonths] = await Promise.all([
          fetchCloudEmployees(),
          fetchCloudShifts(),
          fetchCloudRequests(),
          fetchCloudPublishedMonths(),
        ]);
        if (isMounted) {
          if (cloudEmps && cloudEmps.length > 0) setEmployees(cloudEmps);
          if (cloudShifts && cloudShifts.length > 0) setShifts(cloudShifts.filter((s) => s.employeeId !== 'emp-gz-4'));
          if (cloudReqs && cloudReqs.length > 0) setRequests(cloudReqs);
          // Sincronizza lo stato di pubblicazione: i mesi con turni su Supabase sono visibili su qualsiasi dispositivo
          if (cloudPubMonths.size > 0) syncPublishedMonthsFromCloud(cloudPubMonths);
        }
      } catch (err) {
        console.warn('[Cloud] Inizializzazione fallback:', err);
      }
    };
    initCloud();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sottoscrizione Realtime WebSocket per aggiornamenti in tempo reale con buffering
  useEffect(() => {
    const pendingShifts = new Map<string, Shift>();
    const pendingDeletes = new Set<string>();
    let touchedLoggedInEmployee = false;
    let shiftFlushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushShiftBatch = () => {
      if (pendingShifts.size === 0 && pendingDeletes.size === 0) return;

      const toUpsert = Array.from(pendingShifts.values());
      const toDelete = new Set(pendingDeletes);
      const hadUserShift = touchedLoggedInEmployee;

      pendingShifts.clear();
      pendingDeletes.clear();
      touchedLoggedInEmployee = false;

      setShifts((prev) => {
        let updated = prev;
        if (toDelete.size > 0) {
          updated = updated.filter((s) => !toDelete.has(s.id));
        }
        if (toUpsert.length > 0) {
          const shiftMap = new Map(updated.map((s) => [s.id, s]));
          for (const s of toUpsert) {
            shiftMap.set(s.id, s);
          }
          updated = Array.from(shiftMap.values());
        }
        return updated;
      });

      if (hadUserShift) {
        setToast({
          id: `toast-shift-${Date.now()}`,
          title: 'Turni Aggiornati',
          message: 'Il tuo orario di lavoro è stato aggiornato.',
          type: 'info',
        });
      }
    };

    const unsubscribe = subscribeToRealtimeChanges({
      onShiftChange: ({ eventType, newShift, oldId }) => {
        if (eventType === 'DELETE' && oldId) {
          pendingDeletes.add(oldId);
        } else if (newShift) {
          pendingShifts.set(newShift.id, newShift);
          if (session?.user?.id === newShift.employeeId) {
            touchedLoggedInEmployee = true;
          }
        }

        if (shiftFlushTimer) clearTimeout(shiftFlushTimer);
        shiftFlushTimer = setTimeout(flushShiftBatch, 250);
      },
      onRequestChange: ({ eventType, newRequest, oldId }) => {
        if (eventType === 'DELETE' && oldId) {
          setRequests((prev) => prev.filter((r) => r.id !== oldId));
        } else if (newRequest) {
          setRequests((prev) => {
            const index = prev.findIndex((r) => r.id === newRequest.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = newRequest;
              return updated;
            }
            return [newRequest, ...prev];
          });

          // Notifica mirata se la Direzione ha risposto alla richiesta dell'utente loggato
          if (session?.user?.id === newRequest.requesterId && newRequest.status !== 'pending') {
            const isApproved = newRequest.status === 'approved';
            setToast({
              id: `toast-req-${Date.now()}`,
              title: isApproved ? 'Richiesta Approvata! 🎉' : 'Richiesta Rifiutata',
              message: `La tua richiesta per il ${newRequest.shiftDate} è stata ${
                isApproved ? 'confermata' : 'rifiutata'
              } dalla Direzione.`,
              type: isApproved ? 'success' : 'warning',
            });
          }
        }
      },
    });

    return () => {
      if (shiftFlushTimer) clearTimeout(shiftFlushTimer);
      unsubscribe();
    };
  }, [session]);

  // Sincronizzazione automatica su Storage
  useEffect(() => {
    saveStoredLocation(activeLocation);
  }, [activeLocation]);

  useEffect(() => {
    saveStoredEmployees(employees);
  }, [employees]);

  useEffect(() => {
    saveStoredShifts(shifts);
  }, [shifts]);

  useEffect(() => {
    saveStoredRequests(requests);
  }, [requests]);

  useEffect(() => {
    saveStoredSession(session);
  }, [session]);

  useEffect(() => {
    if (!isManagerMode && (activeTab === 'personnel' || activeTab === 'skills' || activeTab === 'staff')) {
      setActiveTab('today');
    }
    if (isManagerMode && activeTab === 'my-shifts') {
      setActiveTab('today');
    }
  }, [isManagerMode, activeTab]);

  const handleLoginSuccess = (newSession: UserSession, userLocation: LocationId) => {
    setSession(newSession);
    setActiveLocation(userLocation);
    const isMgr = newSession.role === 'manager';
    setIsManagerMode(isMgr);
    if (!isMgr && (activeTab === 'personnel' || activeTab === 'skills' || activeTab === 'staff')) {
      setActiveTab('today');
    }
    if (isMgr && activeTab === 'my-shifts') {
      setActiveTab('today');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setIsManagerMode(false);
    setActiveTab('today');
  };

  const handleSaveShift = (updatedShift: Shift) => {
    setShifts((prev) => {
      const next = prev.map((s) => (s.id === updatedShift.id ? updatedShift : s));
      saveCloudShifts(next);
      return next;
    });
  };

  const handleApplyGeneratedShifts = (generatedShifts: Shift[]) => {
    const todayStr = formatLocalDate(new Date());
    const pastPreserved = generatedShifts.filter((s) => s.date < todayStr).length;
    const futureGenerated = generatedShifts.filter((s) => s.date >= todayStr).length;

    // Registra il mese e anno della bozza come non ancora pubblicato allo staff
    if (generatedShifts.length > 0) {
      const sample = generatedShifts[0];
      const [yStr, mStr] = sample.date.split('-');
      recordMonthUnpublished(sample.locationId, parseInt(yStr, 10), parseInt(mStr, 10));
    }

    setShifts((prev) => {
      const genKeys = new Set(generatedShifts.map((s) => `${s.employeeId}_${s.date}`));
      const remaining = prev.filter((s) => !genKeys.has(`${s.employeeId}_${s.date}`));
      const next = [...remaining, ...generatedShifts];
      // Salvataggio immediato in cache locale (senza inviare a Supabase, evitando sovraccarico e notifiche anticipate)
      saveStoredShifts(next);
      return next;
    });

    const msg = pastPreserved > 0
      ? `${futureGenerated} turni generati in bozza (${pastPreserved} passati preservati). Controlla il tabellone e clicca "Pubblica Turni allo Staff" per renderli ufficiali.`
      : `${generatedShifts.length} turni generati in bozza. Clicca "Pubblica Turni allo Staff" quando desideri renderli visibili ai collaboratori.`;

    setToast({
      id: `toast-gen-${Date.now()}`,
      title: 'Bozza Mensile Generata 📝',
      message: msg,
      type: 'info',
    });
  };

  const handlePublishMonth = async (locId: LocationId, year: number, month: number) => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthShifts = shifts.filter((s) => s.locationId === locId && s.date.startsWith(monthPrefix));

    if (monthShifts.length === 0) {
      setToast({
        id: `toast-pub-warn-${Date.now()}`,
        title: 'Nessun Turno Trovato',
        message: `Non sono presenti turni da pubblicare per ${monthPrefix}.`,
        type: 'warning',
      });
      return;
    }

    // Salva su Supabase esclusivamente il delta dei turni del mese (veloce e leggero)
    const res = await saveCloudShifts(monthShifts);
    if (res.success) {
      recordMonthPublished(locId, year, month);
      // Forza l'aggiornamento dello stato per aggiornare i filtri di visibilità
      setShifts((prev) => [...prev]);
      setToast({
        id: `toast-pub-${Date.now()}`,
        title: 'Turni Pubblicati! 🚀',
        message: `I turni di ${monthPrefix} sono stati pubblicati e sono ora visibili a tutto lo staff.`,
        type: 'success',
      });
    } else {
      setToast({
        id: `toast-pub-err-${Date.now()}`,
        title: 'Errore Pubblicazione',
        message: res.error || 'Impossibile pubblicare i turni sul cloud.',
        type: 'warning',
      });
    }
  };

  const handleRefreshShifts = async () => {
    try {
      clearStoredShifts();
      const [fresh, cloudPubMonths] = await Promise.all([
        fetchCloudShifts(),
        fetchCloudPublishedMonths(),
      ]);
      if (fresh && fresh.length > 0) {
        setShifts(fresh.filter((s) => s.employeeId !== 'emp-gz-4'));
      }
      // Sincronizza anche lo stato di pubblicazione dal cloud
      if (cloudPubMonths.size > 0) syncPublishedMonthsFromCloud(cloudPubMonths);
      setToast({
        id: `toast-ref-${Date.now()}`,
        title: 'Turni Aggiornati ✨',
        message: 'I tuoi orari sono stati sincronizzati direttamente dal server.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Errore rinfresco turni:', err);
      setToast({
        id: `toast-ref-err-${Date.now()}`,
        title: 'Errore Aggiornamento',
        message: 'Impossibile sincronizzare i turni in questo momento.',
        type: 'warning',
      });
    }
  };

  const handleClearShifts = async (targetLocationId: LocationId, mode: 'future' | 'all') => {
    const todayStr = formatLocalDate(new Date());
    let next: Shift[];
    let clearedCount = 0;
    let preservedCount = 0;

    if (mode === 'future') {
      next = shifts.filter((s) => {
        if (s.locationId !== targetLocationId) return true;
        if (s.date < todayStr) {
          preservedCount++;
          return true; // Preserva i giorni passati!
        }
        clearedCount++;
        return false; // Cancella solo da oggi in avanti
      });
      await deleteCloudShifts(targetLocationId, todayStr);

      setToast({
        id: `toast-clear-future-${Date.now()}`,
        title: 'Turni Futuri Rimossi',
        message: `${clearedCount} turni da oggi in poi rimossi. ${preservedCount} turni passati preservati intatti.`,
        type: 'info',
      });
    } else {
      // mode === 'all': svuota TUTTO il database (incluso lo storico)
      clearedCount = shifts.filter((s) => s.locationId === targetLocationId).length;
      next = shifts.filter((s) => s.locationId !== targetLocationId);
      await deleteCloudShifts(targetLocationId);

      setToast({
        id: `toast-clear-all-${Date.now()}`,
        title: 'Database Azzerato',
        message: `Tutti i ${clearedCount} turni (incluso lo storico) per ${targetLocationId === 'gazzada' ? 'Gazzada' : 'Varese'} sono stati eliminati definitivamente.`,
        type: 'info',
      });
    }

    setShifts(next);
    saveStoredShifts(next);
    resetDraftGenerated(targetLocationId);
    setIsClearModalOpen(false);
  };

  const handleApplySingleShift = (shiftToApply: Shift) => {
    setShifts((prev) => {
      const filtered = prev.filter(
        (s) => !(s.employeeId === shiftToApply.employeeId && s.date === shiftToApply.date)
      );
      const next = [...filtered, shiftToApply];
      saveStoredShifts(next);
      saveCloudShifts(next);
      return next;
    });

    setToast({
      id: `toast-shift-${Date.now()}`,
      title: 'Presidio Assegnato',
      message: `Turno aggiornato con successo per il presidio di ${shiftToApply.department || 'reparto'}.`,
      type: 'success',
    });
  };

  const handleUpdateEmployeeSkills = (employeeId: string, newSkills: SkillScores) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === employeeId ? { ...emp, skills: newSkills } : emp))
    );
  };

  // Gestione sostituzione d'emergenza / malattia
  const handleApplyReplacement = (
    absentShift: Shift,
    replacementEmployeeId: string,
    department: Department
  ) => {
    setShifts((prev) => {
      let absentFound = false;
      let replacementFound = false;

      const next = prev.map((s) => {
        // Se è il turno della persona assente -> diventa malattia
        if (s.employeeId === absentShift.employeeId && s.date === absentShift.date) {
          absentFound = true;
          return {
            ...s,
            type: 'malattia' as const,
            department: undefined,
            areaNote: 'Assenza per malattia / emergenza',
          };
        }

        // Se è il turno del sostituto nella stessa data -> prende in carico il turno e il reparto
        if (s.employeeId === replacementEmployeeId && s.date === absentShift.date) {
          replacementFound = true;
          return {
            ...s,
            type: s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia' ? ('giornata' as const) : s.type,
            department,
            startTime: s.startTime || absentShift.startTime || '08:30',
            endTime: s.endTime || absentShift.endTime || '19:30',
            areaNote: `Sostituzione per assenza (${department})`,
            isManualOverride: true,
          };
        }

        return s;
      });

      // Se il turno della persona assente non era nel DB/state, aggiungilo come malattia
      if (!absentFound) {
        next.push({
          id: `shift-malattia-${absentShift.employeeId}-${absentShift.date}`,
          employeeId: absentShift.employeeId,
          locationId: absentShift.locationId || activeLocation,
          date: absentShift.date,
          type: 'malattia',
          areaNote: 'Assenza per malattia / emergenza',
        });
      }

      // Se il turno del sostituto non era nel DB/state (es. era a riposo senza record), crea il turno
      if (!replacementFound) {
        const replacementEmp = employees.find((e) => e.id === replacementEmployeeId);
        next.push({
          id: `shift-repl-${replacementEmployeeId}-${absentShift.date}`,
          employeeId: replacementEmployeeId,
          locationId: replacementEmp?.locationId || activeLocation,
          date: absentShift.date,
          type: 'giornata',
          department,
          startTime: absentShift.startTime || '08:30',
          endTime: absentShift.endTime || '19:30',
          areaNote: `Sostituzione per assenza (${department})`,
          isManualOverride: true,
        });
      }

      saveCloudShifts(next);
      return next;
    });
  };

  const handleSaveEmployee = async (emp: Employee) => {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === emp.id);
      const next = exists ? prev.map((e) => (e.id === emp.id ? emp : e)) : [emp, ...prev];
      return next;
    });
    setSession((prev) => (prev && prev.user.id === emp.id ? { ...prev, user: emp } : prev));
    await saveCloudEmployee(emp);
    setToast({
      id: `toast-${Date.now()}`,
      title: 'Anagrafica Collaboratore Salvata',
      message: `${emp.name} è stato aggiornato correttamente.`,
      type: 'info',
    });
  };

  const handleArchiveEmployee = async (empId: string, isActive: boolean) => {
    setEmployees((prev) => prev.map((e) => (e.id === empId ? { ...e, isActive } : e)));
    await archiveCloudEmployee(empId, isActive);
    const emp = employees.find((e) => e.id === empId);
    setToast({
      id: `toast-${Date.now()}`,
      title: isActive ? 'Collaboratore Riattivato' : 'Collaboratore Archiviato',
      message: isActive
        ? `${emp?.name || ''} è nuovamente attivo nei turni.`
        : `${emp?.name || ''} è stato archiviato (storico turni preservato).`,
      type: 'info',
    });
  };

  const handleDeleteEmployee = async (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    setShifts((prev) => prev.filter((s) => s.employeeId !== empId));
    setRequests((prev) =>
      prev.filter((r) => r.requesterId !== empId && r.targetEmployeeId !== empId)
    );
    await deleteCloudEmployee(empId);
    setToast({
      id: `toast-del-${Date.now()}`,
      title: 'Collaboratore Eliminato',
      message: `${emp?.name || 'Il collaboratore'} è stato eliminato definitivamente dall'anagrafica e dai turni.`,
      type: 'info',
    });
  };

  const handleSubmitRequest = (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => {
    const isSwap = newReq.type === 'swap';
    const created: ShiftRequest = {
      ...newReq,
      id: `req-${Date.now()}`,
      status: isSwap ? 'pending_colleague' : 'pending',
      createdAt: 'Proprio adesso',
    };
    setRequests((prev) => [created, ...prev]);
    saveCloudRequest(created);

    if (isSwap) {
      const colleague = employees.find((e) => e.id === newReq.targetEmployeeId);
      setToast({
        id: `toast-${Date.now()}`,
        title: 'Proposta di Scambio Inviata',
        message: `Inviata a ${colleague?.name || 'collega'}. Lo scambio sarà inoltrato al responsabile appena il collega avrà accettato.`,
        type: 'info',
      });
    } else if (newReq.type === 'sick') {
      setToast({
        id: `toast-${Date.now()}`,
        title: 'Segnalazione Malattia Registrata',
        message: 'La Direzione è stata allertata per la copertura del reparto.',
        type: 'warning',
      });
    } else {
      setToast({
        id: `toast-${Date.now()}`,
        title: 'Richiesta Inoltrata',
        message: 'La richiesta è stata inviata alla Direzione per la valutazione.',
        type: 'success',
      });
    }
  };

  const handleUpdateRequestStatus = (
    id: string,
    status: ShiftRequestStatus,
    managerNote?: string,
    colleagueNote?: string
  ) => {
    const targetReq = requests.find((r) => r.id === id);
    const isColleagueAction =
      status === 'rejected_colleague' ||
      (status === 'pending' && targetReq?.status === 'pending_colleague');

    const effectiveColleagueNote = colleagueNote ?? (isColleagueAction ? managerNote : undefined);
    const effectiveManagerNote = isColleagueAction ? targetReq?.managerNote : managerNote;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              managerNote: effectiveManagerNote !== undefined ? effectiveManagerNote : r.managerNote,
              colleagueNote: effectiveColleagueNote !== undefined ? effectiveColleagueNote : r.colleagueNote,
            }
          : r
      )
    );
    updateCloudRequestStatus(id, status, effectiveManagerNote, effectiveColleagueNote);

    // Se il collega accetta lo scambio proposto da un compagno
    if (status === 'pending' && targetReq && targetReq.type === 'swap' && targetReq.status === 'pending_colleague') {
      setToast({
        id: `toast-swap-accepted-${Date.now()}`,
        title: 'Scambio Accettato tra Colleghi! 🤝',
        message: 'La richiesta è stata inoltrata al responsabile per la conferma definitiva.',
        type: 'success',
      });
      return;
    }

    // Se il collega rifiuta lo scambio
    if (status === 'rejected_colleague') {
      setToast({
        id: `toast-swap-rejected-${Date.now()}`,
        title: 'Proposta di Scambio Rifiutata',
        message: 'La proposta è stata rifiutata e archiviata.',
        type: 'info',
      });
      return;
    }

    // Se approvata richiesta ferie o malattia, converti automaticamente il turno
    if (status === 'approved' && targetReq && (targetReq.type === 'leave' || targetReq.type === 'sick')) {
      const priorShift = shifts.find(
        (s) => s.employeeId === targetReq.requesterId && s.date === targetReq.shiftDate
      );
      const priorDept = priorShift?.department;
      const newType: ShiftType = targetReq.type === 'sick' ? 'malattia' : 'ferie';
      const defaultNote = targetReq.type === 'sick'
        ? (targetReq.protocolNumber ? `Malattia (PUC ${targetReq.protocolNumber})` : 'Malattia comunicata')
        : 'Ferie concordate con la direzione';

      setShifts((prev) => {
        const next = prev.map((s) => {
          if (s.employeeId === targetReq.requesterId && s.date === targetReq.shiftDate) {
            return {
              ...s,
              type: newType,
              department: undefined,
              startTime: undefined,
              endTime: undefined,
              areaNote: defaultNote,
            };
          }
          return s;
        });
        saveCloudShifts(next);

        // Controllo se il reparto dell'assente è rimasto privo di personale
        if (priorDept) {
          const remainingInDept = next.filter(
            (s) =>
              s.date === targetReq.shiftDate &&
              s.locationId === targetReq.locationId &&
              s.department === priorDept &&
              s.type !== 'riposo' &&
              s.type !== 'ferie' &&
              s.type !== 'malattia'
          );

          if (remainingInDept.length === 0) {
            setToast({
              id: `toast-uncovered-${Date.now()}`,
              title: `⚠️ Reparto ${priorDept} Scoperto!`,
              message: `L'assenza per il ${targetReq.shiftDate} ha lasciato ${priorDept} privo di personale. Assegna un sostituto rapido.`,
              type: 'warning',
            });
          }
        }

        return next;
      });
    }

    // Se approvata richiesta di scambio turno: scambia realmente i turni sia in memoria sia su Supabase
    if (status === 'approved' && targetReq && targetReq.type === 'swap' && targetReq.targetEmployeeId) {
      const reqEmp = employees.find((e) => e.id === targetReq.requesterId);
      const targetEmp = employees.find((e) => e.id === targetReq.targetEmployeeId);
      const reqDate = targetReq.shiftDate;
      const targetDate = targetReq.targetShiftDate || targetReq.shiftDate;
      const targetEmpId = targetReq.targetEmployeeId;

      setShifts((prev) => {
        const reqShift = prev.find((s) => s.employeeId === targetReq.requesterId && s.date === reqDate);
        const targetShift = prev.find((s) => s.employeeId === targetEmpId && s.date === targetDate);

        // Dati effettivi del turno del richiedente su reqDate (con fallback allo snapshot della richiesta)
        const reqDept = reqShift?.department || targetReq.requesterDepartment || reqEmp?.role || 'Cassa';
        const reqStart = reqShift?.startTime || targetReq.requesterStartTime || '08:30';
        const reqEnd = reqShift?.endTime || targetReq.requesterEndTime || '17:00';
        const reqType: ShiftType =
          reqShift && reqShift.type !== 'riposo' && reqShift.type !== 'ferie' && reqShift.type !== 'malattia'
            ? reqShift.type
            : 'giornata';
        const reqLoc = reqShift?.locationId || targetReq.locationId;

        // Dati effettivi del turno del collega su targetDate (con fallback allo snapshot della richiesta)
        const targetDept = targetShift?.department || targetReq.targetDepartment || targetEmp?.role || 'Cassa';
        const targetStart = targetShift?.startTime || targetReq.targetStartTime || '08:30';
        const targetEnd = targetShift?.endTime || targetReq.targetEndTime || '17:00';
        const targetType: ShiftType =
          targetShift && targetShift.type !== 'riposo' && targetShift.type !== 'ferie' && targetShift.type !== 'malattia'
            ? targetShift.type
            : 'giornata';
        const targetLoc = targetShift?.locationId || targetReq.locationId;

        const upsertInList = (list: Shift[], updated: Shift): Shift[] => {
          const normalizedId = `shift-${updated.employeeId}-${updated.date}`;
          const normalizedShift: Shift = { ...updated, id: normalizedId };
          const exists = list.some(
            (s) => s.employeeId === updated.employeeId && s.date === updated.date
          );
          if (exists) {
            return list.map((s) =>
              s.employeeId === updated.employeeId && s.date === updated.date ? normalizedShift : s
            );
          }
          return [...list, normalizedShift];
        };

        let next = [...prev];

        if (reqDate === targetDate) {
          // Scambio sullo stesso giorno (es. cambio reparto/orario nella medesima giornata)
          next = upsertInList(next, {
            id: `shift-${targetReq.requesterId}-${reqDate}`,
            employeeId: targetReq.requesterId,
            locationId: targetLoc,
            date: reqDate,
            type: targetType,
            department: targetDept,
            startTime: targetStart,
            endTime: targetEnd,
            areaNote: `Scambio turno con ${targetEmp?.name || targetEmpId}`,
            isManualOverride: true,
            assignedSkillScore: reqEmp?.skills?.[targetDept] ?? 5,
          });

          next = upsertInList(next, {
            id: `shift-${targetEmpId}-${targetDate}`,
            employeeId: targetEmpId,
            locationId: reqLoc,
            date: targetDate,
            type: reqType,
            department: reqDept,
            startTime: reqStart,
            endTime: reqEnd,
            areaNote: `Scambio turno con ${reqEmp?.name || targetReq.requesterId}`,
            isManualOverride: true,
            assignedSkillScore: targetEmp?.skills?.[reqDept] ?? 5,
          });
        } else {
          // Scambio su due date differenti:
          // 1. Nel giorno reqDate (turno originario del richiedente):
          //    - Il collega (targetEmpId) subentra nel turno del richiedente (reqDept, reqStart-reqEnd)
          //    - Il richiedente (requesterId) passa a riposo su reqDate
          next = upsertInList(next, {
            id: `shift-${targetEmpId}-${reqDate}`,
            employeeId: targetEmpId,
            locationId: reqLoc,
            date: reqDate,
            type: reqType,
            department: reqDept,
            startTime: reqStart,
            endTime: reqEnd,
            areaNote: `Scambio turno con ${reqEmp?.name || targetReq.requesterId}`,
            isManualOverride: true,
            assignedSkillScore: targetEmp?.skills?.[reqDept] ?? 5,
          });

          next = upsertInList(next, {
            id: `shift-${targetReq.requesterId}-${reqDate}`,
            employeeId: targetReq.requesterId,
            locationId: reqLoc,
            date: reqDate,
            type: 'riposo',
            department: undefined,
            startTime: undefined,
            endTime: undefined,
            areaNote: `Riposo per scambio con ${targetEmp?.name || targetEmpId} (recupera il ${targetDate})`,
            isManualOverride: true,
          });

          // 2. Nel giorno targetDate (turno originario del collega):
          //    - Il richiedente (requesterId) subentra nel turno del collega (targetDept, targetStart-targetEnd)
          //    - Il collega (targetEmpId) passa a riposo su targetDate
          next = upsertInList(next, {
            id: `shift-${targetReq.requesterId}-${targetDate}`,
            employeeId: targetReq.requesterId,
            locationId: targetLoc,
            date: targetDate,
            type: targetType,
            department: targetDept,
            startTime: targetStart,
            endTime: targetEnd,
            areaNote: `Scambio turno con ${targetEmp?.name || targetEmpId}`,
            isManualOverride: true,
            assignedSkillScore: reqEmp?.skills?.[targetDept] ?? 5,
          });

          next = upsertInList(next, {
            id: `shift-${targetEmpId}-${targetDate}`,
            employeeId: targetEmpId,
            locationId: targetLoc,
            date: targetDate,
            type: 'riposo',
            department: undefined,
            startTime: undefined,
            endTime: undefined,
            areaNote: `Riposo per scambio con ${reqEmp?.name || targetReq.requesterId} (coperto il ${reqDate})`,
            isManualOverride: true,
          });
        }

        saveCloudShifts(next);
        return next;
      });

      setToast({
        id: `toast-swap-done-${Date.now()}`,
        title: 'Turni Scambiati con Successo! 🎉',
        message:
          reqDate === targetDate
            ? `I turni del ${reqDate} tra ${reqEmp?.name || 'richiedente'} e ${targetEmp?.name || 'collega'} sono stati invertiti.`
            : `${targetEmp?.name || 'Il collega'} coprirà il turno del ${reqDate} e ${reqEmp?.name || 'il richiedente'} coprirà il turno del ${targetDate}.`,
        type: 'success',
      });
    }

    // Se approvata richiesta di variazione orario / flessibilità
    if (status === 'approved' && targetReq && targetReq.type === 'schedule_change') {
      setShifts((prev) => {
        const next = prev.map((s) => {
          if (s.employeeId === targetReq.requesterId && s.date === targetReq.shiftDate) {
            return {
              ...s,
              type: (s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia') ? ('giornata' as const) : s.type,
              department: s.department || employees.find((e) => e.id === s.employeeId)?.role || 'Cassa',
              startTime: targetReq.requestedStartTime || s.startTime || '09:00',
              endTime: targetReq.requestedEndTime || s.endTime || '18:30',
              areaNote: s.areaNote ? `${s.areaNote} (Orario concordato)` : 'Orario concordato',
              isCustomHours: true,
              isManualOverride: true,
            };
          }
          return s;
        });
        saveCloudShifts(next);
        return next;
      });
    }
  };

  // Se l'utente non è ancora autenticato
  if (!session) {
    return <LoginScreen employees={employees} onLoginSuccess={handleLoginSuccess} />;
  }

  const currentEmployee = session.user;
  const storeRequests = requests.filter((r) => r.locationId === activeLocation);
  const myIncomingSwapsCount = requests.filter(
    (r) => r.targetEmployeeId === currentEmployee.id && r.status === 'pending_colleague'
  ).length;
  const pendingManagerCount = storeRequests.filter((r) => r.status === 'pending').length;
  const pendingRequestsCount = isManagerMode ? pendingManagerCount : myIncomingSwapsCount;
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation) || LOCATIONS[0];

  const currentSunday = getSundayOfWeek(new Date());
  const currentWeekDays = getWeekDays(formatLocalDate(currentSunday));

  // Filtro turni visibili allo staff:
  // Se manager vede tutto (comprese le bozze locali per verifiche).
  // Se collaboratore, esclude i turni che appartengono a mesi registrati in bozza e non ancora pubblicati
  const visibleShifts = isManagerMode
    ? shifts
    : shifts.filter((s) => {
        const parts = s.date.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return isMonthPublished(s.locationId, y, m);
      });

  return (
    <div className="min-h-screen bg-nicora-bg text-nicora-text flex flex-col antialiased">
      
      {/* Header Superiore */}
      <AppHeader
        session={session}
        onLogout={handleLogout}
        isManagerMode={isManagerMode}
        onToggleManagerMode={() => setIsManagerMode(!isManagerMode)}
        activeLocation={activeLocation}
        onChangeLocation={setActiveLocation}
        employees={employees}
        onSaveEmployee={handleSaveEmployee}
        onOpenTutorial={() => setIsTutorialManualOpen(true)}
        onRefreshShifts={handleRefreshShifts}
      />

      {/* Navigazione Responsive (Desktop Top Bar / Mobile Bottom Nav) */}
      <ResponsiveNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingRequestsCount={pendingRequestsCount}
        isManagerMode={isManagerMode}
      />

      {/* Area Contenuto Principale */}
      <main className="flex-1 w-full max-w-7xl mx-auto md:px-6 md:py-6">
        
        {/* Tab 1: Oggi in Sede */}
        {activeTab === 'today' && (
          <TodayPresence
            currentDate={todayStr}
            currentEmployeeId={currentEmployee.id}
            employees={employees}
            shifts={visibleShifts}
            isManagerMode={isManagerMode}
            activeLocation={activeLocation}
            onChangeLocation={setActiveLocation}
            onEditShift={(shift) => setEditingShift(shift)}
            onLogout={handleLogout}
            onSaveEmployee={handleSaveEmployee}
          />
        )}

        {/* Tab 2: I Miei Turni Personali */}
        {activeTab === 'my-shifts' && (
          <MySchedule
            currentEmployee={currentEmployee}
            employees={employees}
            shifts={visibleShifts}
            activeLocation={activeLocation}
            onChangeLocation={setActiveLocation}
            onLogout={handleLogout}
            onSaveEmployee={handleSaveEmployee}
            onRefreshShifts={handleRefreshShifts}
          />
        )}

        {/* Tab 3: Tabellone Settimanale / Pianificatore Direzione */}
        {activeTab === 'planner' && (
          <PlannerGrid
            location={locationInfo}
            employees={employees}
            shifts={shifts}
            requests={requests}
            isManagerMode={isManagerMode}
            currentEmployee={currentEmployee}
            activeLocation={activeLocation}
            onChangeLocation={setActiveLocation}
            onLogout={handleLogout}
            onSaveEmployee={handleSaveEmployee}
            onEditShift={(shift) => setEditingShift(shift)}
            onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
            onOpenClearModal={() => setIsClearModalOpen(true)}
            onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
            onOpenEmergencyModal={(shift) => {
              setEmergencyTargetShift(shift || null);
              setIsEmergencyModalOpen(true);
            }}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onApplyShift={handleApplySingleShift}
            onPublishMonth={handlePublishMonth}
            onApproveRequest={(id) => handleUpdateRequestStatus(id, 'approved', 'Approvata 1-click dal responsabile')}
            onRejectRequest={(id) => handleUpdateRequestStatus(id, 'rejected', 'Non conciliabile con la copertura minima')}
          />
        )}

        {/* Tab 4: Richieste Ferie & Scambi Turno */}
        {activeTab === 'requests' && (
          <LeaveRequests
            currentEmployee={currentEmployee}
            currentEmployeeId={currentEmployee.id}
            employees={employees}
            shifts={visibleShifts}
            requests={requests}
            onSubmitRequest={handleSubmitRequest}
            isManagerMode={isManagerMode}
            onUpdateStatus={handleUpdateRequestStatus}
            activeLocation={activeLocation}
            onChangeLocation={setActiveLocation}
            onLogout={handleLogout}
            onSaveEmployee={handleSaveEmployee}
          />
        )}

        {/* Tab 5: Personale & Competenze (Unificata per Direzione) */}
        {(activeTab === 'personnel' || activeTab === 'skills' || activeTab === 'staff') && isManagerMode && (
          <StaffPersonnel
            currentEmployee={currentEmployee}
            employees={employees}
            shifts={shifts}
            activeLocation={activeLocation}
            onChangeLocation={setActiveLocation}
            onLogout={handleLogout}
            onSaveEmployee={handleSaveEmployee}
            onArchiveEmployee={handleArchiveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onUpdateSkillsAndHours={(empId, newSkills, newHours) => {
              setEmployees((prev) =>
                prev.map((emp) =>
                  emp.id === empId ? { ...emp, skills: newSkills, contractHours: newHours } : emp
                )
              );
            }}
          />
        )}


      </main>

      {/* Modale Modifica Turno */}
      {editingShift && isManagerMode && (
        <EditShiftModal
          key={editingShift.id}
          shift={editingShift}
          employee={employees.find((e) => e.id === editingShift.employeeId)}
          isOpen={Boolean(editingShift)}
          onClose={() => setEditingShift(null)}
          onSave={handleSaveShift}
          onFindReplacement={(shift) => {
            setEmergencyTargetShift(shift);
            setIsEmergencyModalOpen(true);
          }}
        />
      )}

      {/* Modale Generazione Automatica Bozza Turni */}
      <GenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        locationId={activeLocation}
        employees={employees}
        requests={requests}
        existingShifts={shifts}
        onApplyShifts={handleApplyGeneratedShifts}
      />

      {/* Modale Svuotamento Turni con Opzione Sicura e Danger Zone */}
      <ClearShiftsModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        locationId={activeLocation}
        locationName={activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese'}
        shifts={shifts}
        onConfirmClear={handleClearShifts}
      />

      {/* Modale Competenze 1-10 (Overlay rapido) */}
      <SkillsMatrix
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        employees={employees}
        locationId={activeLocation}
        onUpdateSkills={handleUpdateEmployeeSkills}
      />

      {/* Modale Sostituzione Rapida / Emergenza */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => {
          setIsEmergencyModalOpen(false);
          setEmergencyTargetShift(null);
        }}
        locationId={activeLocation}
        employees={employees}
        shifts={shifts}
        preselectedShift={emergencyTargetShift}
        onApplyReplacement={handleApplyReplacement}
      />

      {/* Modale Stampa Tabellone A4 & Condivisione WhatsApp */}
      <PrintExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        location={locationInfo}
        weekDays={currentWeekDays}
        employees={employees}
        shifts={shifts}
      />

      {/* Tutorial Introduttivo (Mobile-first Bottom Sheet con memorizzazione sincrona) */}
      <OnboardingTutorial
        userRole={isManagerMode ? 'admin' : 'staff'}
        userId={session.user.id}
        forceOpen={isTutorialManualOpen}
        onClose={() => setIsTutorialManualOpen(false)}
      />

      {/* Toast Notifiche Realtime */}
      <NotificationToast toast={toast} onDismiss={() => setToast(null)} />

    </div>
  );
};

export default App;
