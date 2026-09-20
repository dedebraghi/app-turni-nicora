import React, { useState, useEffect } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { ResponsiveNav } from './components/layout/ResponsiveNav';
import { TodayPresence } from './components/staff/TodayPresence';
import { MySchedule } from './components/staff/MySchedule';
import { LeaveRequests } from './components/staff/LeaveRequests';
import { PlannerGrid } from './components/admin/PlannerGrid';
import { SkillsMatrix } from './components/admin/SkillsMatrix';
import { GenerateModal } from './components/admin/GenerateModal';
import { EmergencyModal } from './components/admin/EmergencyModal';
import { PrintExportModal } from './components/admin/PrintExportModal';
import { EditShiftModal } from './components/common/EditShiftModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { NotificationToast, ToastMessage } from './components/common/NotificationToast';

import { ActiveTab, Department, Employee, LocationId, Shift, ShiftRequest, UserSession } from './domain/types';
import { LOCATIONS } from './domain/mockData';
import { getSundayOfWeek, getWeekDays } from './engine/schedulerEngine';
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
} from './services/storageService';
import {
  fetchCloudEmployees,
  fetchCloudRequests,
  fetchCloudShifts,
  saveCloudRequest,
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
  const [emergencyTargetShift, setEmergencyTargetShift] = useState<Shift | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Toast Notifica Realtime per il collaboratore
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Inizializzazione Cloud al mount con fallback trasparente a locale
  useEffect(() => {
    let isMounted = true;
    const initCloud = async () => {
      try {
        const [cloudEmps, cloudShifts, cloudReqs] = await Promise.all([
          fetchCloudEmployees(),
          fetchCloudShifts(),
          fetchCloudRequests(),
        ]);
        if (isMounted) {
          if (cloudEmps && cloudEmps.length > 0) setEmployees(cloudEmps);
          if (cloudShifts && cloudShifts.length > 0) setShifts(cloudShifts);
          if (cloudReqs && cloudReqs.length > 0) setRequests(cloudReqs);
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

  // Sottoscrizione Realtime WebSocket per aggiornamenti in tempo reale
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeChanges({
      onShiftChange: ({ eventType, newShift, oldId }) => {
        if (eventType === 'DELETE' && oldId) {
          setShifts((prev) => prev.filter((s) => s.id !== oldId));
        } else if (newShift) {
          setShifts((prev) => {
            const index = prev.findIndex((s) => s.id === newShift.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = newShift;
              return updated;
            }
            return [...prev, newShift];
          });

          // Notifica mirata se l'aggiornamento tocca il dipendente attualmente loggato
          if (session?.user?.id === newShift.employeeId) {
            setToast({
              id: `toast-shift-${Date.now()}`,
              title: 'Turno Aggiornato',
              message: `Il tuo orario per il ${newShift.date} è stato aggiornato.`,
              type: 'info',
            });
          }
        }
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

  const handleLoginSuccess = (newSession: UserSession, userLocation: LocationId) => {
    setSession(newSession);
    setActiveLocation(userLocation);
    setIsManagerMode(newSession.role === 'manager');
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
    setShifts((prev) => {
      const newShiftsMap = new Map(generatedShifts.map((s) => [s.id, s]));
      const untouchedShifts = prev.filter((s) => !newShiftsMap.has(s.id));
      const next = [...untouchedShifts, ...generatedShifts];
      saveCloudShifts(next);
      return next;
    });
  };

  const handleUpdateEmployeeSkills = (employeeId: string, newSkills: Record<Department, number>) => {
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
      const next = prev.map((s) => {
        // Se è il turno della persona assente -> diventa malattia
        if (s.employeeId === absentShift.employeeId && s.date === absentShift.date) {
          return {
            ...s,
            type: 'malattia' as const,
            department: undefined,
            areaNote: 'Assenza per malattia / emergenza',
          };
        }

        // Se è il turno del sostituto nella stessa data -> prende in carico il turno e il reparto
        if (s.employeeId === replacementEmployeeId && s.date === absentShift.date) {
          return {
            ...s,
            type: s.type === 'riposo' ? ('giornata' as const) : s.type,
            department,
            areaNote: `Sostituzione per assenza ${absentShift.employeeId} (${department})`,
            isManualOverride: true,
          };
        }

        return s;
      });
      saveCloudShifts(next);
      return next;
    });
  };

  const handleSubmitRequest = (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => {
    const created: ShiftRequest = {
      ...newReq,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: 'Proprio adesso',
    };
    setRequests((prev) => [created, ...prev]);
    saveCloudRequest(created);
  };

  const handleUpdateRequestStatus = (id: string, status: 'approved' | 'rejected', managerNote?: string) => {
    const targetReq = requests.find((r) => r.id === id);

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, managerNote } : r))
    );
    updateCloudRequestStatus(id, status, managerNote);

    // Se approvata richiesta ferie, converti automaticamente il turno in 'ferie'
    if (status === 'approved' && targetReq && targetReq.type === 'leave') {
      setShifts((prev) => {
        const next = prev.map((s) => {
          if (s.employeeId === targetReq.requesterId && s.date === targetReq.shiftDate) {
            return {
              ...s,
              type: 'ferie' as const,
              department: undefined,
              startTime: undefined,
              endTime: undefined,
              areaNote: 'Ferie concordate con la direzione',
            };
          }
          return s;
        });
        saveCloudShifts(next);
        return next;
      });
    }

    // Se approvata richiesta di scambio turno
    if (status === 'approved' && targetReq && targetReq.type === 'swap' && targetReq.targetEmployeeId) {
      setShifts((prev) => {
        const reqShift = prev.find((s) => s.employeeId === targetReq.requesterId && s.date === targetReq.shiftDate);
        const targetShift = prev.find((s) => s.employeeId === targetReq.targetEmployeeId && s.date === targetReq.shiftDate);

        if (!reqShift || !targetShift) return prev;

        const next = prev.map((s) => {
          if (s.id === reqShift.id) {
            return {
              ...s,
              type: targetShift.type,
              department: targetShift.department,
              startTime: targetShift.startTime,
              endTime: targetShift.endTime,
              areaNote: `Scambiato con ${targetShift.employeeId}`,
            };
          }
          if (s.id === targetShift.id) {
            return {
              ...s,
              type: reqShift.type,
              department: reqShift.department,
              startTime: reqShift.startTime,
              endTime: reqShift.endTime,
              areaNote: `Scambiato con ${reqShift.employeeId}`,
            };
          }
          return s;
        });
        saveCloudShifts(next);
        return next;
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
  const pendingRequestsCount = storeRequests.filter((r) => r.status === 'pending').length;
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation) || LOCATIONS[0];

  const currentSunday = getSundayOfWeek(new Date());
  const currentWeekDays = getWeekDays(currentSunday.toISOString().split('T')[0]);

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
      />

      {/* Navigazione Responsive (Desktop Top Bar / Mobile Bottom Nav) */}
      <ResponsiveNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingRequestsCount={pendingRequestsCount}
        isManagerMode={isManagerMode}
      />

      {/* Area Contenuto Principale */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {/* Tab 1: Oggi in Sede */}
        {activeTab === 'today' && (
          <TodayPresence
            currentDate={todayStr}
            currentEmployeeId={currentEmployee.id}
            employees={employees}
            shifts={shifts}
            isManagerMode={isManagerMode}
            activeLocation={activeLocation}
            onEditShift={(shift) => setEditingShift(shift)}
          />
        )}

        {/* Tab 2: I Miei Turni Personali */}
        {activeTab === 'my-shifts' && (
          <MySchedule
            currentEmployee={currentEmployee}
            shifts={shifts}
            activeLocation={activeLocation}
          />
        )}

        {/* Tab 3: Tabellone Settimanale / Pianificatore Direzione */}
        {activeTab === 'planner' && (
          <PlannerGrid
            location={locationInfo}
            employees={employees}
            shifts={shifts}
            isManagerMode={isManagerMode}
            onEditShift={(shift) => setEditingShift(shift)}
            onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
            onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
            onOpenEmergencyModal={(shift) => {
              setEmergencyTargetShift(shift || null);
              setIsEmergencyModalOpen(true);
            }}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}

        {/* Tab 4: Richieste Ferie & Scambi Turno */}
        {activeTab === 'requests' && (
          <LeaveRequests
            currentEmployeeId={currentEmployee.id}
            employees={employees}
            requests={requests}
            onSubmitRequest={handleSubmitRequest}
            isManagerMode={isManagerMode}
            onUpdateStatus={handleUpdateRequestStatus}
            activeLocation={activeLocation}
          />
        )}

        {/* Tab 5: Matrice Competenze (Solo per Direzione) */}
        {activeTab === 'skills' && isManagerMode && (
          <SkillsMatrix
            employees={employees}
            locationId={activeLocation}
            onUpdateSkills={handleUpdateEmployeeSkills}
            isStandaloneTab={true}
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
        onApplyShifts={handleApplyGeneratedShifts}
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

      {/* Toast Notifiche Realtime */}
      <NotificationToast toast={toast} onDismiss={() => setToast(null)} />

    </div>
  );
};

export default App;
