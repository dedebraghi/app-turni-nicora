import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TodayView } from './components/TodayView';
import { WeekView } from './components/WeekView';
import { RequestsView } from './components/RequestsView';
import { EditShiftModal } from './components/EditShiftModal';
import { InstallPWAButton } from './components/InstallPWAButton';
import { INITIAL_EMPLOYEES, generateWeeklyMockShifts, INITIAL_REQUESTS } from './mockData';
import { ActiveTab, Employee, Shift, ShiftRequest } from './types';

export const App: React.FC = () => {
  // Persistenza LocalStorage per turni e richieste
  const [employees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('nicora_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>(() => {
    return localStorage.getItem('nicora_current_emp') || INITIAL_EMPLOYEES[0].id;
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

  // Data di oggi in formato ISO YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Sincronizzazione LocalStorage
  useEffect(() => {
    localStorage.setItem('nicora_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('nicora_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('nicora_current_emp', currentEmployeeId);
  }, [currentEmployeeId]);

  // Handler per aggiornare turno
  const handleSaveShift = (updatedShift: Shift) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === updatedShift.id ? updatedShift : s))
    );
  };

  // Handler per invio nuova richiesta
  const handleSubmitRequest = (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => {
    const created: ShiftRequest = {
      ...newReq,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: 'Proprio adesso',
    };
    setRequests((prev) => [created, ...prev]);
  };

  // Handler per aggiornare stato richiesta (Responsabile)
  const handleUpdateRequestStatus = (id: string, status: 'approved' | 'rejected') => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-nicora-bg text-nicora-text flex justify-center">
      {/* Container mobile simulato per test da desktop e perfetto su smartphone */}
      <div className="w-full max-w-md min-h-screen bg-nicora-bg flex flex-col relative border-x border-neutral-200/60 shadow-xl">
        {/* Header superiore fisso */}
        <Header
          currentEmployeeId={currentEmployeeId}
          employees={employees}
          onSelectEmployee={setCurrentEmployeeId}
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

        {/* Modal Modifica Turno (Responsabile) */}
        {editingShift && (
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
