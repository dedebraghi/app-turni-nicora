import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TodayView } from './components/TodayView';
import { WeekView } from './components/WeekView';
import { RequestsView } from './components/RequestsView';
import { EditShiftModal } from './components/EditShiftModal';
import { LoginScreen } from './components/LoginScreen';
import { INITIAL_EMPLOYEES, generateWeeklyMockShifts, INITIAL_REQUESTS } from './mockData';
import { ActiveTab, Employee, Shift, ShiftRequest, UserSession } from './types';

export const App: React.FC = () => {
  // Sessione utente loggato
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('nicora_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [employees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('nicora_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('nicora_shifts');
    return saved ? JSON.parse(saved) : generateWeeklyMockShifts();
  });

  const [requests, setRequests] = useState<ShiftRequest[]>(() => {
    const saved = localStorage.getItem('nicora_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isManagerMode, setIsManagerMode] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Sincronizzazione LocalStorage
  useEffect(() => {
    localStorage.setItem('nicora_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('nicora_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('nicora_session', JSON.stringify(session));
      // Se è manager, attiva le funzioni di modifica
      setIsManagerMode(session.role === 'manager');
    } else {
      localStorage.removeItem('nicora_session');
      setIsManagerMode(false);
    }
  }, [session]);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
  };

  const handleSaveShift = (updatedShift: Shift) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === updatedShift.id ? updatedShift : s))
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
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  // Se l'utente non è ancora loggato, mostra la schermata di login
  if (!session) {
    return <LoginScreen employees={employees} onLoginSuccess={handleLoginSuccess} />;
  }

  const currentEmployeeId = session.user.id;
  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-nicora-bg text-nicora-text flex justify-center">
      {/* Container mobile simulato per test da desktop e perfetto su smartphone */}
      <div className="w-full max-w-md min-h-screen bg-nicora-bg flex flex-col relative border-x border-neutral-200/60 shadow-xl">
        
        {/* Header superiore fisso con stato utente e logout */}
        <Header
          session={session}
          onLogout={handleLogout}
          isManagerMode={isManagerMode}
          onToggleManagerMode={() => setIsManagerMode(!isManagerMode)}
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
              onEditShift={(shift) => setEditingShift(shift)}
            />
          )}

          {activeTab === 'week' && (
            <WeekView
              currentEmployeeId={currentEmployeeId}
              employees={employees}
              shifts={shifts}
              isManagerMode={isManagerMode}
              onEditShift={(shift) => setEditingShift(shift)}
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
            />
          )}
        </main>

        {/* Navigazione inferiore per pollice */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          pendingRequestsCount={pendingRequestsCount}
        />

        {/* Modal Modifica Turno (solo per Responsabile) */}
        {editingShift && isManagerMode && (
          <EditShiftModal
            shift={editingShift}
            employee={employees.find((e) => e.id === editingShift.employeeId)}
            isOpen={Boolean(editingShift)}
            onClose={() => setEditingShift(null)}
            onSave={handleSaveShift}
          />
        )}
      </div>
    </div>
  );
};

export default App;
