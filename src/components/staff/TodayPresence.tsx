import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { LOCATIONS } from '../../domain/mockData';
import { Clock, Coffee, Edit3, MapPin, ShieldAlert, ShieldCheck, Sparkles, Sun, Sunset, UserCheck } from 'lucide-react';

interface TodayPresenceProps {
  currentDate: string;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  activeLocation: LocationId;
  onEditShift: (shift: Shift) => void;
}

export const TodayPresence: React.FC<TodayPresenceProps> = ({
  currentDate,
  currentEmployeeId,
  employees,
  shifts,
  isManagerMode,
  activeLocation,
  onEditShift,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const storeEmployees = employees.filter((e) => e.locationId === activeLocation);
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

  // Turni suddivisi per orario
  const workingShifts = todayStoreShifts.filter(
    (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );
  const restShifts = todayStoreShifts.filter(
    (s) => s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia'
  );

  // Turno personale
  const myShift = todayStoreShifts.find((s) => s.employeeId === currentEmployeeId);
  const myEmployee = getEmployee(currentEmployeeId);

  // Filtro dipartimento
  const filteredWorkingShifts = workingShifts.filter((s) => {
    if (selectedDeptFilter === 'all') return true;
    return s.department === selectedDeptFilter;
  });

  const morningShifts = filteredWorkingShifts.filter(
    (s) => s.type === 'mattina' || s.type === 'giornata'
  );
  const afternoonShifts = filteredWorkingShifts.filter(
    (s) => s.type === 'pomeriggio' || s.type === 'giornata'
  );

  const formatDisplayDate = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 max-w-5xl mx-auto">
      
      {/* Date & Cassa Status Banner */}
      <div className="bg-white rounded-2xl p-4 border border-nicora-border shadow-clean flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-nicora-orange uppercase tracking-wider bg-nicora-orange-light px-2 py-0.5 rounded-md border border-nicora-orange-border/50">
              {locationInfo?.name}
            </span>
            <span className="text-neutral-300">•</span>
            {isCassaCovered ? (
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-700" />
                <span>Cassa Presidiata ({cassaShifts.length})</span>
              </span>
            ) : (
              <span className="text-xs font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                <ShieldAlert size={13} className="text-rose-700" />
                <span>ATTENZIONE: Cassa Scoperta!</span>
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-nicora-title capitalize leading-tight">
            {formatDisplayDate(currentDate)}
          </h2>
        </div>

        {/* Quick Counters */}
        <div className="flex items-center gap-2">
          <div className="bg-nicora-teal-light text-nicora-teal px-3 py-1.5 rounded-xl border border-nicora-teal-border/40 text-center min-w-[70px]">
            <span className="block text-[10px] uppercase font-bold text-nicora-teal/70">In Servizio</span>
            <span className="text-sm font-black">{workingShifts.length}</span>
          </div>
          <div className="bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-xl border border-neutral-200 text-center min-w-[70px]">
            <span className="block text-[10px] uppercase font-bold text-neutral-500">Riposo / Ferie</span>
            <span className="text-sm font-black">{restShifts.length}</span>
          </div>
          <div className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200 text-center min-w-[70px]">
            <span className="block text-[10px] uppercase font-bold text-rose-500">Cassa</span>
            <span className="text-sm font-black">{cassaShifts.length}</span>
          </div>
        </div>
      </div>

      {/* Il Mio Turno di Oggi (Highlight Card) */}
      {myShift && (
        <div className="bg-gradient-to-r from-nicora-teal to-[#014145] text-white rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
            <Sparkles size={110} />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs uppercase font-extrabold tracking-wider text-nicora-orange-border bg-black/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
              <UserCheck size={13} /> Il tuo orario di oggi
            </span>
            <span className="text-xs bg-white/20 px-3 py-0.5 rounded-full font-bold">
              {myShift.department || myEmployee?.role}
            </span>
          </div>

          <div className="mt-3 relative z-10 flex flex-wrap items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {myShift.type === 'riposo'
                ? 'Giorno di Riposo ☕'
                : myShift.type === 'ferie'
                ? 'In Ferie 🌴'
                : myShift.type === 'malattia'
                ? 'In Malattia 🏥'
                : `${myShift.startTime || '08:30'} — ${myShift.endTime || '19:30'}`}
            </h3>
            {myShift.type !== 'riposo' && myShift.type !== 'ferie' && myShift.type !== 'malattia' && (
              <span className="text-xs text-nicora-teal-light font-semibold capitalize bg-white/10 px-2 py-0.5 rounded">
                Turno {myShift.type}
              </span>
            )}
          </div>

          {myShift.areaNote && (
            <p className="text-xs text-nicora-teal-light mt-2 flex items-center gap-1.5 relative z-10">
              <MapPin size={14} className="text-nicora-orange flex-shrink-0" />
              <span>Postazione Assegnata: <strong>{myShift.areaNote}</strong></span>
            </p>
          )}
        </div>
      )}

      {/* Reparti Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setSelectedDeptFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedDeptFilter === 'all'
              ? 'bg-nicora-title text-white shadow-xs'
              : 'bg-white text-neutral-600 border border-nicora-border hover:bg-neutral-50'
          }`}
        >
          Tutti i Reparti ({workingShifts.length})
        </button>

        {['Cassa', 'Fioreria', 'Decor', 'Serra Calda', 'Serra Fredda'].map((dept) => {
          const count = workingShifts.filter((s) => s.department === dept).length;
          const isSelected = selectedDeptFilter === dept;

          return (
            <button
              key={dept}
              onClick={() => setSelectedDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-nicora-orange text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-nicora-border hover:bg-neutral-50'
              }`}
            >
              <span>{dept}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid delle Presenze: Mattina e Pomeriggio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Sezione Mattina */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-nicora-teal flex items-center gap-1.5">
              <Sun size={16} className="text-nicora-orange" />
              <span>Fascia Mattina & Giornata Intera</span>
            </h3>
            <span className="text-xs font-bold text-neutral-500">
              {morningShifts.length} presenti
            </span>
          </div>

          {morningShifts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-dashed border-nicora-border text-center text-xs text-neutral-400">
              Nessun collaboratore in servizio per i filtri selezionati.
            </div>
          ) : (
            <div className="space-y-2">
              {morningShifts.map((shift) => (
                <ShiftRowCard
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

        {/* Sezione Pomeriggio */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-nicora-teal flex items-center gap-1.5">
              <Sunset size={16} className="text-nicora-orange" />
              <span>Fascia Pomeriggio & Continuato</span>
            </h3>
            <span className="text-xs font-bold text-neutral-500">
              {afternoonShifts.length} presenti
            </span>
          </div>

          {afternoonShifts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-dashed border-nicora-border text-center text-xs text-neutral-400">
              Nessun collaboratore in servizio nel pomeriggio per i filtri selezionati.
            </div>
          ) : (
            <div className="space-y-2">
              {afternoonShifts.map((shift) => (
                <ShiftRowCard
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

      </div>

      {/* Collaboratori a Riposo o in Ferie Oggi */}
      {restShifts.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Coffee size={15} />
              <span>A Riposo, Ferie o Malattia Oggi ({restShifts.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {restShifts.map((shift) => {
              const emp = getEmployee(shift.employeeId);
              if (!emp) return null;

              return (
                <div
                  key={shift.id}
                  onClick={() => isManagerMode && onEditShift(shift)}
                  className={`bg-white p-3 rounded-xl border border-nicora-border flex items-center justify-between shadow-xs ${
                    isManagerMode ? 'cursor-pointer hover:border-nicora-orange' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center text-xs font-bold">
                      {emp.avatar}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-neutral-800 leading-tight truncate max-w-[110px]">
                        {emp.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 capitalize">
                        {shift.type === 'ferie'
                          ? '🌴 Ferie'
                          : shift.type === 'malattia'
                          ? '🏥 Malattia'
                          : '☕ Riposo'}
                      </p>
                    </div>
                  </div>
                  {isManagerMode && <Edit3 size={13} className="text-nicora-orange opacity-80" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

interface ShiftRowCardProps {
  shift: Shift;
  employee?: Employee;
  isMe: boolean;
  isManagerMode: boolean;
  onEdit: () => void;
}

const ShiftRowCard: React.FC<ShiftRowCardProps> = ({
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
      className={`relative bg-white rounded-xl p-3.5 border transition-all duration-150 shadow-clean ${
        isMe
          ? 'border-nicora-orange ring-1 ring-nicora-orange/60 bg-nicora-orange-light/20'
          : isCassa
          ? 'border-rose-200 hover:border-rose-300'
          : 'border-nicora-border hover:border-nicora-teal-border'
      } ${isManagerMode ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      <div className="flex items-start justify-between">
        
        {/* Collaboratore Info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
              isMe
                ? 'bg-nicora-orange text-white'
                : isCassa
                ? 'bg-rose-100 text-rose-800 font-black'
                : 'bg-nicora-teal-light text-nicora-teal'
            }`}
          >
            {employee.avatar}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-nicora-title">
                {employee.name}
              </span>
              {isMe && (
                <span className="text-[9px] bg-nicora-orange text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                  Tu
                </span>
              )}
              {employee.isManager && (
                <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                  Resp.
                </span>
              )}
            </div>

            {/* Reparto Badge */}
            <div className="mt-1 flex items-center gap-1">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  isCassa
                    ? 'bg-rose-600 text-white'
                    : dept === 'Fioreria'
                    ? 'bg-pink-100 text-pink-800 border border-pink-200'
                    : dept === 'Decor'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : dept === 'Serra Calda'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                }`}
              >
                {dept}
              </span>
            </div>
          </div>
        </div>

        {/* Orario turno */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-xs font-extrabold text-nicora-teal bg-neutral-100 px-2.5 py-1 rounded-lg">
            <Clock size={12} className={isCassa ? 'text-rose-600' : 'text-nicora-orange'} />
            <span>
              {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
            </span>
          </div>
          {shift.type === 'giornata' && (
            <span className="block text-[9px] text-nicora-orange font-bold mt-0.5">
              Giornata Intera
            </span>
          )}
        </div>
      </div>

      {/* Mansione o postazione */}
      {shift.areaNote && (
        <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1.5 text-[11px] truncate">
            <MapPin size={12} className="text-nicora-teal flex-shrink-0" />
            <span className="truncate">{shift.areaNote}</span>
          </span>

          {isManagerMode && (
            <span className="text-nicora-orange font-bold text-[11px] flex items-center gap-0.5 flex-shrink-0">
              <Edit3 size={11} /> Modifica
            </span>
          )}
        </div>
      )}
    </div>
  );
};
