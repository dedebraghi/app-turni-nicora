import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { LOCATIONS } from '../../domain/mockData';
import { 
  Clock, 
  Coffee, 
  Edit3, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Users 
} from 'lucide-react';

interface TodayPresenceDesktopProps {
  currentDate: string;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  activeLocation: LocationId;
  onEditShift: (shift: Shift) => void;
}

const getDeptBadgeClass = (dept?: string) => {
  switch (dept) {
    case 'Cassa':
      return 'bg-rose-600 text-white';
    case 'Fioreria':
      return 'bg-fuchsia-700 text-white';
    case 'Decor':
      return 'bg-amber-600 text-white';
    case 'Serra Calda':
      return 'bg-orange-600 text-white';
    case 'Serra Fredda':
      return 'bg-emerald-700 text-white';
    case 'Area Tecnica':
      return 'bg-slate-700 text-white';
    case 'Emporio':
      return 'bg-indigo-700 text-white';
    case 'Natale':
      return 'bg-red-700 text-white';
    default:
      return 'bg-nicora-teal text-white';
  }
};

export const TodayPresenceDesktop: React.FC<TodayPresenceDesktopProps> = ({
  currentDate,
  currentEmployeeId,
  employees,
  shifts,
  isManagerMode,
  activeLocation,
  onEditShift,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const storeEmployees = employees.filter((e) => e.locationId === activeLocation && e.isActive !== false && !e.isOwner);
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation);

  const todayStoreShifts = shifts.filter(
    (s) => s.locationId === activeLocation && s.date === currentDate
  );

  const getEmployee = (empId: string) => storeEmployees.find((e) => e.id === empId);

  // Calcolo Cassa
  const cassaShifts = todayStoreShifts.filter(
    (s) => (s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa')) &&
      s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );
  const isCassaCovered = cassaShifts.length > 0;

  // Turni suddivisi tra presenti e riposo/assenti
  const workingShifts = todayStoreShifts.filter(
    (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );
  const restShifts = todayStoreShifts.filter(
    (s) => s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia'
  );

  // Turno personale (cercato su tutti i turni del giorno come su Mobile)
  const myShift = shifts.find((s) => s.employeeId === currentEmployeeId && s.date === currentDate);
  const myEmployee = employees.find((e) => e.id === currentEmployeeId);

  const getShiftDept = (s: Shift) => {
    const emp = getEmployee(s.employeeId);
    return s.department || emp?.role || 'Altro';
  };

  // Filtro dipartimento
  const filteredWorkingShifts = workingShifts.filter((s) => {
    if (selectedDeptFilter === 'all') return true;
    return getShiftDept(s) === selectedDeptFilter;
  });

  const allDepartmentsList = [
    'Cassa',
    'Fioreria',
    'Decor',
    'Serra Calda',
    'Serra Fredda',
    'Area Tecnica',
    'Emporio',
    'Natale',
  ];

  const formatDisplayDate = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const locationAddress = activeLocation === 'gazzada' 
    ? 'Viale Gallarate 26, Gazzada Schianno (VA)' 
    : 'Via Carnia 2, Varese (VA)';

  const isMyShiftWorking =
    myShift && myShift.type !== 'riposo' && myShift.type !== 'ferie' && myShift.type !== 'malattia';
  const myDept = myShift?.department || myEmployee?.role;

  return (
    <div className="max-w-[1280px] w-full mx-auto space-y-7 pb-16">
      
      {/* 1. Top Meta & Quick KPIs Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-nicora-orange-light text-nicora-orange font-bold text-xs uppercase tracking-wider border border-nicora-orange-border">
              {locationInfo?.name || 'Nicora Garden'}
            </span>
            {isCassaCovered ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200 shadow-2xs">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Cassa Presidiata ({cassaShifts.length})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 font-bold text-xs border border-rose-200 shadow-2xs animate-pulse">
                <ShieldAlert size={14} className="text-rose-600" />
                <span>Cassa Scoperta!</span>
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 text-nicora-muted text-xs">
              <MapPin size={14} className="text-nicora-teal" />
              <span>{locationAddress}</span>
            </span>
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl text-nicora-title font-medium tracking-tight capitalize">
            {formatDisplayDate(currentDate)}
          </h1>
        </div>

        {/* 3 Quick KPI Badges */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="flex flex-col items-center justify-center px-6 py-3 rounded-xl bg-white border border-nicora-sage-border shadow-2xs min-w-[110px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-nicora-muted">In Servizio</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-serif text-2xl font-bold text-nicora-teal">{workingShifts.length}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-3 rounded-xl bg-white border border-nicora-sage-border shadow-2xs min-w-[110px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-nicora-muted">Riposo / Ferie</span>
            <span className="font-serif text-2xl font-bold text-neutral-600 mt-0.5">{restShifts.length}</span>
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-3 rounded-xl bg-nicora-orange-light border border-nicora-orange-border shadow-2xs min-w-[100px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-nicora-orange">Cassa</span>
            <span className="font-serif text-2xl font-bold text-nicora-orange mt-0.5">{cassaShifts.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Personalized Hero Shift Card (sempre visibile come su Mobile) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002f32] via-[#0a474b] to-[#072e31] text-white shadow-xl p-6 sm:p-7 border border-white/10">
        <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none opacity-10 flex items-center justify-center -mr-10">
          <Sparkles size={200} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-black/30 text-emerald-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-white/10">
                <User size={13} />
                <span>Il Tuo Turno • {myEmployee?.name || 'Collaboratore'}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <div className="font-serif text-3xl lg:text-4xl text-white tracking-tight font-medium">
                {!myShift
                  ? 'Non pianificato'
                  : myShift.type === 'riposo'
                  ? 'Giorno di Riposo ☕'
                  : myShift.type === 'ferie'
                  ? 'In Ferie 🌴'
                  : myShift.type === 'malattia'
                  ? 'In Malattia 🏥'
                  : `${myShift.startTime || '08:30'} — ${myShift.endTime || '19:30'}`}
              </div>
              {isMyShiftWorking && (
                <span className="px-3.5 py-1 rounded-lg bg-[#285c54] text-white font-semibold text-xs shadow-xs">
                  {myShift.type === 'giornata' ? 'Giornata Intera' : `Turno ${myShift.type}`}
                </span>
              )}
            </div>
          </div>

          {isMyShiftWorking && myDept && (
            <div className="flex items-center gap-3 self-start md:self-center">
              <span className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm ${getDeptBadgeClass(myDept)}`}>
                {myDept}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Filter Pills Section */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-nicora-muted">
          Filtra per Reparto
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDeptFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap shadow-2xs transition-all ${
              selectedDeptFilter === 'all'
                ? 'bg-nicora-teal text-white shadow-xs'
                : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-nicora-sage-border'
            }`}
          >
            <span>Tutti i Reparti</span>
            <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${
              selectedDeptFilter === 'all' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}>
              {workingShifts.length}
            </span>
          </button>

          {allDepartmentsList.map((dept) => {
            const count = workingShifts.filter((s) => getShiftDept(s) === dept).length;
            if (count === 0 && selectedDeptFilter !== dept) return null;
            const isSelected = selectedDeptFilter === dept;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDeptFilter(dept)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap shadow-2xs transition-all ${
                  isSelected
                    ? 'bg-nicora-orange text-white shadow-xs'
                    : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-nicora-sage-border'
                }`}
              >
                <span>{dept}</span>
                <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Collaboratori in turno (Griglia unificata senza duplicati Mattina/Pomeriggio) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-teal-50/80 to-transparent border border-teal-200/50 shadow-2xs">
          <div className="flex items-center gap-2 text-nicora-teal font-bold text-xs uppercase tracking-wider">
            <Users size={17} />
            <span>Collaboratori in turno</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white text-neutral-600 text-xs font-semibold shadow-2xs border border-nicora-sage-border">
            {filteredWorkingShifts.length} presenti
          </span>
        </div>

        {filteredWorkingShifts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-xs text-neutral-400 border border-dashed border-nicora-sage-border">
            Nessun collaboratore in servizio per questo filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredWorkingShifts.map((shift) => (
              <DesktopShiftCard
                key={shift.id}
                shift={shift}
                employee={getEmployee(shift.employeeId)}
                isMe={shift.employeeId === currentEmployeeId}
                isManagerMode={isManagerMode}
                onEdit={() => onEditShift(shift)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Bottom Section: Riposo & Ferie del Giorno */}
      {restShifts.length > 0 && (
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-nicora-title flex items-center gap-2">
              <Coffee size={18} className="text-neutral-500" />
              <span>Collaboratori a Riposo, Ferie o Assenti ({restShifts.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {restShifts.map((shift) => {
              const emp = getEmployee(shift.employeeId);
              if (!emp) return null;

              return (
                <div
                  key={shift.id}
                  onClick={() => isManagerMode && onEditShift(shift)}
                  className={`bg-white p-3.5 rounded-xl border border-nicora-sage-border flex items-center justify-between shadow-2xs transition-all ${
                    isManagerMode ? 'cursor-pointer hover:border-nicora-orange hover:shadow-xs' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {emp.avatar || emp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-sm font-semibold text-neutral-800 leading-tight truncate">
                        {emp.name}
                      </p>
                      <p className="text-[11px] text-neutral-400 capitalize">
                        {shift.type === 'ferie'
                          ? '🌴 Ferie'
                          : shift.type === 'malattia'
                          ? '🏥 Malattia'
                          : '☕ Giorno di Riposo'}
                      </p>
                    </div>
                  </div>
                  {isManagerMode && <Edit3 size={14} className="text-nicora-orange opacity-80 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

interface DesktopShiftCardProps {
  shift: Shift;
  employee?: Employee;
  isMe: boolean;
  isManagerMode: boolean;
  onEdit: () => void;
}

const DesktopShiftCard: React.FC<DesktopShiftCardProps> = ({
  shift,
  employee,
  isMe,
  isManagerMode,
  onEdit,
}) => {
  if (!employee) return null;

  const dept = shift.department || employee.role;
  const isCassa = dept === 'Cassa';

  return (
    <div
      onClick={() => isManagerMode && onEdit()}
      className={`relative p-4 rounded-xl bg-white border shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden ${
        isMe
          ? 'border-nicora-orange ring-1 ring-nicora-orange/60 bg-amber-50/20'
          : isCassa
          ? 'border-rose-200/90'
          : 'border-nicora-sage-border hover:border-nicora-teal-border'
      } ${isManagerMode ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        isMe ? 'bg-nicora-orange' : isCassa ? 'bg-rose-500' : 'bg-nicora-teal'
      }`}></div>

      <div className="flex items-center justify-between gap-3 pl-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center font-serif text-sm font-semibold shrink-0 shadow-2xs ${
              isMe
                ? 'bg-nicora-orange text-white'
                : isCassa
                ? 'bg-rose-100 text-rose-800'
                : 'bg-nicora-teal-light text-nicora-teal'
            }`}
          >
            {employee.avatar || employee.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-medium text-nicora-title truncate">
                {employee.name}
              </span>
              {isMe && (
                <span className="px-1.5 py-0.2 rounded bg-nicora-orange text-white text-[10px] uppercase font-bold">
                  TU
                </span>
              )}
              {employee.isManager && (
                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                  Resp.
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getDeptBadgeClass(dept)}`}
              >
                {dept}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end text-right shrink-0">
          <div className="flex items-center gap-1 text-nicora-teal font-bold text-sm bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-100">
            <Clock size={13} className={isCassa ? 'text-rose-600' : 'text-nicora-orange'} />
            <span>{shift.startTime || '08:30'} — {shift.endTime || '19:30'}</span>
          </div>
          <span className="text-[11px] text-nicora-muted mt-0.5 flex items-center gap-1">
            <span>{shift.type === 'giornata' ? 'Giornata Intera' : `Turno ${shift.type}`}</span>
            {isManagerMode && <Edit3 size={11} className="text-nicora-orange" />}
          </span>
        </div>
      </div>
    </div>
  );
};

