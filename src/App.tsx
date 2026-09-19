import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TodayView } from './components/TodayView';
import { WeekView } from './components/WeekView';
import { RequestsView } from './components/RequestsView';
import { EditShiftModal } from './components/EditShiftModal';
import { SkillsMatrixModal } from './components/SkillsMatrixModal';
import { GenerateScheduleModal } from './components/GenerateScheduleModal';
import { LoginScreen } from './components/LoginScreen';
import { INITIAL_EMPLOYEES, generateInitialMockShifts, INITIAL_REQUESTS } from './mockData';
import { ActiveTab, Department, Employee, LocationId, Shift, ShiftRequest, UserSession } from './types';

export const App: React.FC = () => {
  // Sede attiva (Gazzada o Varese)
  const [activeLocation, setActiveLocation] = useState<LocationId>(() => {
    const saved = localStorage.getItem('nicora_location') as LocationId | null;
    return saved === 'gazzada' || saved === 'varese' ? saved : 'gazzada';
  });

  // Sessione utente loggato
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('nicora_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('nicora_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('nicora_shifts');
    return saved ? JSON.parse(saved) : generateInitialMockShifts();
  });

  const [requests, setRequests] = useState<ShiftRequest[]>(() => {
    const saved = localStorage.getItem('nicora_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isManagerMode, setIsManagerMode] = useState<boolean>(() => session?.role === 'manager');
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Sincronizzazione LocalStorage
  useEffect(() => {
    localStorage.setItem('nicora_location', activeLocation);
  }, [activeLocation]);

  useEffect(() => {
    localStorage.setItem('nicora_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('nicora_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('nicora_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('nicora_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('nicora_session');
    }
  }, [session]);

  const handleLoginSuccess = (newSession: UserSession, userLocation: LocationId) => {
    setSession(newSession);
    setActiveLocation(userLocation);
    setIsManagerMode(newSession.role === 'manager');
  };

  const handleLogout = () => {
    setSession(null);
    setIsManagerMode(false);
  };

  const handleSaveShift = (updatedShift: Shift) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === updatedShift.id ? updatedShift : s))
    );
  };

  const handleApplyGeneratedShifts = (generatedShifts: Shift[]) => {
    setShifts((prev) => {
      // Sostituisce i turni con lo stesso ID o combina preservando gli altri
      const newShiftsMap = new Map(generatedShifts.map((s) => [s.id, s]));
      const untouchedShifts = prev.filter((s) => !newShiftsMap.has(s.id));
      return [...untouchedShifts, ...generatedShifts];
    });
  };

  const handleUpdateEmployeeSkills = (employeeId: string, newSkills: Record<Department, number>) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === employeeId ? { ...emp, skills: newSkills } : emp))
    );
  };

  const handleSubmitRequest = (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => {
    const created: ShiftRequest = {
      ...newReq,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: 'Proprio adesso',
    };
    setRequests((prev) => [created, ...prev]);
  };

  const handleUpdateRequestStatus = (id: string, status: 'approved' | 'rejected') => {
    const targetReq = requests.find((r) => r.id === id);

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    // Se approvata richiesta ferie, converti il turno in 'ferie' automaticamente
    if (status === 'approved' && targetReq && targetReq.type === 'leave') {
      setShifts((prev) =>
        prev.map((s) => {
          if (s.employeeId === targetReq.requesterId && s.date === targetReq.shiftDate) {
            return {
              ...s,
              type: 'ferie',
              department: undefined,
              startTime: undefined,
              endTime: undefined,
              areaNote: undefined,
            };
          }
          return s;
        })
      );
    }
  };

  // Se l'utente non è ancora autenticato
  if (!session) {
    return <LoginScreen employees={employees} onLoginSuccess={handleLoginSuccess} />;
  }

  const currentEmployeeId = session.user.id;
  const storeRequests = requests.filter((r) => r.locationId === activeLocation);
  const pendingRequestsCount = storeRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-nicora-bg text-nicora-text flex justify-center">
      {/* Container mobile simulato per test da desktop e perfetto su smartphone */}
      <div className="w-full max-w-md min-h-screen bg-nicora-bg flex flex-col relative border-x border-neutral-200/60 shadow-xl">
        
        {/* Header superiore con switcher sede e stato utente */}
        <Header
          session={session}
          onLogout={handleLogout}
          isManagerMode={isManagerMode}
          onToggleManagerMode={() => setIsManagerMode(!isManagerMode)}
          activeLocation={activeLocation}
          onChangeLocation={setActiveLocation}
          onOpenSkillsMatrix={() => setIsSkillsModalOpen(true)}
        />

        {/* Contenuto dinamico delle schermate */}
        <main className="flex-1 p-3.5 overflow-y-auto">
          {activeTab === 'today' && (
            <TodayView
              currentDate={todayStr}
              currentEmployeeId={currentEmployeeId}
              employees={employees}
              shifts={shifts}
              isManagerMode={isManagerMode}
              activeLocation={activeLocation}
              onEditShift={(shift) => setEditingShift(shift)}
            />
          )}

          {activeTab === 'week' && (
            <WeekView
              currentEmployeeId={currentEmployeeId}
              employees={employees}
              shifts={shifts}
              isManagerMode={isManagerMode}
              activeLocation={activeLocation}
              onEditShift={(shift) => setEditingShift(shift)}
              onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
              onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
            />
          )}

          {activeTab === 'requests' && (
            <RequestsView
              currentEmployeeId={currentEmployeeId}
              employees={employees}
              requests={requests}
              onSubmitRequest={handleSubmitRequest}
              isManagerMode={isManagerMode}
              onUpdateStatus={handleUpdateRequestStatus}
              activeLocation={activeLocation}
            />
          )}
        </main>

        {/* Navigazione inferiore per pollice */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          pendingRequestsCount={pendingRequestsCount}
        />

        {/* Modale Modifica Turno (Responsabile) */}
        {editingShift && isManagerMode && (
          <EditShiftModal
            key={editingShift.id}
            shift={editingShift}
            employee={employees.find((e) => e.id === editingShift.employeeId)}
            isOpen={Boolean(editingShift)}
            onClose={() => setEditingShift(null)}
            onSave={handleSaveShift}
          />
        )}

        {/* Modale Matrice Competenze 1-10 */}
        <SkillsMatrixModal
          isOpen={isSkillsModalOpen}
          onClose={() => setIsSkillsModalOpen(false)}
          employees={employees}
          locationId={activeLocation}
          onUpdateSkills={handleUpdateEmployeeSkills}
        />

        {/* Modale Generazione Automatica Bozza */}
        <GenerateScheduleModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          locationId={activeLocation}
          employees={employees}
          requests={requests}
          onApplyShifts={handleApplyGeneratedShifts}
        />
      </div>
    </div>
  );
};

export default App;
