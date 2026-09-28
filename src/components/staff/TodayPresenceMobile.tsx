import React, { useState } from 'react';
import { Department, Employee, LocationId, Shift } from '../../domain/types';
import { LOCATIONS } from '../../domain/mockData';
import { MobileHeader } from '../layout/MobileHeader';
import { 
  CheckCircle2, 
  Clock, 
  Coffee,
  Sparkles, 
} from 'lucide-react';

interface TodayPresenceMobileProps {
  currentDate: string;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onEditShift: (shift: Shift) => void;
  onLogout?: () => void;
  onSaveEmployee?: (emp: Employee) => void;
}

export const TodayPresenceMobile: React.FC<TodayPresenceMobileProps> = ({
  currentDate,
  currentEmployeeId,
  employees,
  shifts,
  isManagerMode,
  activeLocation,
  onChangeLocation,
  onEditShift,
  onLogout,
  onSaveEmployee,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const storeEmployees = employees.filter((e) => e.locationId === activeLocation && e.isActive !== false);
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation);

  const gazzadaStaffCount = employees.filter((e) => e.locationId === 'gazzada' && e.isActive !== false).length;
  const vareseStaffCount = employees.filter((e) => e.locationId === 'varese' && e.isActive !== false).length;

  const todayStoreShifts = shifts.filter(
    (s) => s.locationId === activeLocation && s.date === currentDate
  );

  const getEmployee = (empId: string) => storeEmployees.find((e) => e.id === empId);

  // Helper univoco: determina il reparto effettivo assegnato al turno
  const getShiftDept = (s: Shift): Department => {
    return s.department || getEmployee(s.employeeId)?.role || 'Cassa';
  };

  // Turni in servizio vs riposo/ferie
  const workingShifts = todayStoreShifts.filter(
    (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );
  const restShifts = todayStoreShifts.filter(
    (s) => s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia'
  );

  // Presidio Cassa calcolato sul reparto effettivo
  const cassaShifts = workingShifts.filter((s) => getShiftDept(s) === 'Cassa');

  // Turno personale Sabrina / Utente loggato (cerca a livello globale sui turni di oggi)
  const myShift = shifts.find((s) => s.employeeId === currentEmployeeId && s.date === currentDate);
  const myEmployee = employees.find((e) => e.id === currentEmployeeId);
  const myShiftDept = myShift ? getShiftDept(myShift) : (myEmployee?.role || 'Cassa');

  const isMyShiftOff = !myShift || myShift.type === 'riposo' || myShift.type === 'ferie' || myShift.type === 'malattia';

  // Filtro dipartimento: assegna a ogni turno un solo reparto univoco
  const filteredWorkingShifts = workingShifts.filter((s) => {
    if (selectedDeptFilter === 'all') return true;
    return getShiftDept(s) === selectedDeptFilter;
  });

  const deptCounts: Record<Department, number> = {
    'Cassa': 0,
    'Fioreria': 0,
    'Decor': 0,
    'Serra Calda': 0,
    'Serra Fredda': 0,
  };

  workingShifts.forEach((s) => {
    const dept = getShiftDept(s);
    if (deptCounts[dept] !== undefined) {
      deptCounts[dept]++;
    }
  });

  const deptFilterList = [
    { id: 'all', label: 'Tutti', count: workingShifts.length },
    { id: 'Cassa', label: 'Cassa', count: deptCounts['Cassa'] },
    { id: 'Fioreria', label: 'Fioreria', count: deptCounts['Fioreria'] },
    { id: 'Decor', label: 'Decor', count: deptCounts['Decor'] },
    { id: 'Serra Calda', label: 'Serra Calda', count: deptCounts['Serra Calda'] },
    { id: 'Serra Fredda', label: 'Serra Fredda', count: deptCounts['Serra Fredda'] },
  ].filter((d) => d.id === 'all' || d.count > 0);

  const formatDisplayDate = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="min-h-screen bg-[#f2fcf7] text-[#151d1b] flex flex-col font-sans">
      
      {/* ========================================================
          1. HEADER NATIVO STITCH MOBILE CONDIVISO
          ======================================================== */}
      <MobileHeader
        title="Oggi"
        employee={myEmployee}
        activeLocation={activeLocation}
        onChangeLocation={onChangeLocation}
        gazzadaStaffCount={gazzadaStaffCount}
        vareseStaffCount={vareseStaffCount}
        onLogout={onLogout}
        onSaveEmployee={onSaveEmployee}
      />

      {/* ========================================================
          2. CORPO PRINCIPALE MOBILE
          ======================================================== */}
      <div className="pt-[calc(6.25rem+env(safe-area-inset-top,0px))] px-4 pb-24 space-y-4">
        
        {/* Header Data Context */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#a73a00] uppercase tracking-widest">
              {locationInfo?.shortName || (activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese')}
            </span>
            <h1 className="font-serif text-xl font-bold text-[#0a474b] capitalize">
              {formatDisplayDate(currentDate)}
            </h1>
          </div>
        </div>

        {/* 1. Quick Indicators (3 Compact Stat Boxes) */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-[#e2e8e4] shadow-2xs text-center">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">In Servizio</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-[#002f32]">{workingShifts.length}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">Sede Operativa</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-[#e2e8e4] shadow-2xs text-center">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Riposo/Ferie</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-neutral-700">{restShifts.length}</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Assenti oggi</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#fdf3ee] border border-[#edd9cd] shadow-2xs text-center">
            <span className="text-[9px] uppercase tracking-wider text-[#a73a00] font-bold">Presidio Cassa</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-[#a73a00]">{cassaShifts.length}</span>
            </div>
            <span className="text-[10px] text-[#a73a00] font-semibold">Linee attive</span>
          </div>
        </div>

        {/* 2. Hero Turno Collaboratore (Dinamico e coerente con riposo/ferie/servizio) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002f32] via-[#0a474b] to-[#072e31] text-white p-5 shadow-md border border-white/10">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3.5">
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs">
                {myShift?.type === 'riposo' ? (
                  <Coffee size={13} className="text-amber-300" />
                ) : myShift?.type === 'ferie' ? (
                  <Sparkles size={13} className="text-purple-300" />
                ) : (
                  <Clock size={13} className="text-emerald-300" />
                )}
                <span>
                  {myShift?.type === 'riposo'
                    ? 'Il tuo stato • ' + (myEmployee?.name || 'Sabrina')
                    : 'Il tuo turno • ' + (myEmployee?.name || 'Sabrina')}
                </span>
              </div>

              {myShift?.type === 'riposo' ? (
                <span className="px-3 py-1 rounded-full bg-white/20 text-emerald-200 font-bold text-xs uppercase shadow-xs">
                  Riposo
                </span>
              ) : myShift?.type === 'ferie' ? (
                <span className="px-3 py-1 rounded-full bg-purple-500 text-white font-bold text-xs uppercase shadow-xs">
                  Ferie
                </span>
              ) : myShift?.type === 'malattia' ? (
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs uppercase shadow-xs">
                  Malattia
                </span>
              ) : myShift ? (
                <span className="px-3 py-1 rounded-full bg-[#fd651e] text-white font-bold text-xs shadow-xs">
                  {myShiftDept}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-white/15 text-white/70 font-bold text-xs shadow-xs">
                  Non Assegnato
                </span>
              )}
            </div>

            {/* Turno & Orari con gestione stati reali */}
            {myShift?.type === 'riposo' ? (
              <div>
                <span className="font-serif text-3xl font-bold tracking-tight text-white">
                  Giorno di Riposo ☕
                </span>
                <p className="text-xs text-emerald-200/80 mt-1 font-medium">
                  Nessun turno di servizio programmato per oggi • Recupero contrattuale
                </p>
              </div>
            ) : myShift?.type === 'ferie' ? (
              <div>
                <span className="font-serif text-3xl font-bold tracking-tight text-white">
                  In Ferie 🌴
                </span>
                <p className="text-xs text-emerald-200/80 mt-1 font-medium">
                  {myShift.areaNote || 'Assenza programmata approvata dalla direzione'}
                </p>
              </div>
            ) : myShift?.type === 'malattia' ? (
              <div>
                <span className="font-serif text-3xl font-bold tracking-tight text-white">
                  In Malattia 🏥
                </span>
                <p className="text-xs text-emerald-200/80 mt-1 font-medium">
                  Assenza per malattia registrata
                </p>
              </div>
            ) : myShift ? (
              <div>
                <span className="font-serif text-3xl font-bold tracking-tight text-white">
                  {myShift.startTime || '08:30'} — {myShift.endTime || '19:30'}
                </span>
                <p className="text-xs text-emerald-200/80 mt-1 font-medium">
                  {myShift.type === 'mattina' || myShift.type === 'pomeriggio' ? 'Mezza Giornata' : 'Turno Completo'}
                </p>
              </div>
            ) : (
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-white">
                  Nessun Turno
                </span>
                <p className="text-xs text-emerald-200/80 mt-1 font-medium">
                  Non risultano turni assegnati per oggi
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Horizontal Scrollable Department Filter */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Filtro Reparto</span>
            <span className="text-[11px] text-neutral-500 font-medium">{filteredWorkingShifts.length} Presenti</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {deptFilterList.map((d) => {
              const isSelected = selectedDeptFilter === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDeptFilter(d.id)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all ${
                    isSelected
                      ? 'bg-[#002f32] text-white shadow-xs'
                      : 'bg-white text-neutral-600 hover:text-neutral-900 border border-[#e2e8e4]'
                  }`}
                >
                  {d.label} ({d.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Team List: Collaboratori Oggi in Sede */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-neutral-900">
              Collaboratori in turno
            </h2>
            <span className="text-xs font-semibold text-neutral-500">
              {filteredWorkingShifts.length} {filteredWorkingShifts.length === 1 ? 'presente' : 'presenti'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {filteredWorkingShifts.map((shift) => {
              const emp = getEmployee(shift.employeeId);
              if (!emp) return null;
              const isMe = emp.id === currentEmployeeId;
              const isResp = emp.isManager;
              const shiftDept = getShiftDept(shift);
              const isCassa = shiftDept === 'Cassa';

              return (
                <div
                  key={shift.id}
                  onClick={() => isManagerMode && onEditShift(shift)}
                  className={`flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#e2e8e4] shadow-2xs transition-all ${
                    isManagerMode ? 'cursor-pointer hover:border-nicora-teal' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center font-serif text-base font-bold flex-shrink-0 ${
                        isMe
                          ? 'bg-[#a73a00] text-white'
                          : isResp
                          ? 'bg-[#0a474b] text-white'
                          : 'bg-[#e1eae5] text-[#002f32]'
                      }`}
                    >
                      {emp.name.charAt(0)}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-neutral-900 truncate">{emp.name}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-[#a73a00] text-[9px] font-extrabold uppercase">
                            TU
                          </span>
                        )}
                        {isResp && (
                          <span className="px-1.5 py-0.2 rounded bg-[#e1eae5] text-[#002f32] text-[9px] font-bold uppercase">
                            RESP
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] truncate ${isCassa ? 'text-[#a73a00] font-semibold' : 'text-neutral-500'}`}>
                        {shiftDept}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 text-right">
                    <span className="font-bold text-xs text-neutral-900">
                      {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
                    </span>
                    <span className="text-[10px] font-semibold flex items-center gap-0.5 mt-0.5">
                      {isCassa ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 size={11} /> In Cassa
                        </span>
                      ) : (shift.type === 'mattina' || shift.type === 'pomeriggio') ? (
                        <span className="text-amber-600 font-semibold">Mattina (Mezza g.)</span>
                      ) : (
                        <span className="text-neutral-500 font-medium">In turno</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
