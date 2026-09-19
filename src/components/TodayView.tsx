import React from 'react';
import { Department, Employee, LocationId, Shift } from '../types';
import { Clock, MapPin, Edit3, UserCheck, Coffee, Sun, Sunset, Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';
import { LOCATIONS } from '../mockData';

interface TodayViewProps {
  currentDate: string;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  activeLocation: LocationId;
  onEditShift: (shift: Shift) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  currentDate,
  currentEmployeeId,
  employees,
  shifts,
  isManagerMode,
  activeLocation,
  onEditShift,
}) => {
  // Filtra dipendenti e turni per la sede attiva
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation);
  const todayStoreShifts = shifts.filter(
    (s) => s.locationId === activeLocation && s.date === currentDate
  );

  const getEmployee = (empId: string) => storeEmployees.find((e) => e.id === empId);
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation);

  // Suddivisione fasce
  const morningShifts = todayStoreShifts.filter((s) => s.type === 'mattina' || s.type === 'giornata');
  const afternoonShifts = todayStoreShifts.filter((s) => s.type === 'pomeriggio' || s.type === 'giornata');
  const restShifts = todayStoreShifts.filter((s) => s.type === 'riposo' || s.type === 'ferie');

  // Controllo presenza Cassa
  const cassaShifts = todayStoreShifts.filter(
    (s) => (s.department === 'Cassa' || s.areaNote?.includes('Cassa')) && s.type !== 'riposo' && s.type !== 'ferie'
  );
  const isCassaCovered = cassaShifts.length > 0;

  // Turno personale
  const myShift = todayStoreShifts.find((s) => s.employeeId === currentEmployeeId);

  const formatDisplayDate = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getDeptColor = (dept?: Department) => {
    switch (dept) {
      case 'Cassa':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Fioreria':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Decor':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Serra Calda':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Serra Fredda':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Date Banner con Presidio Cassa */}
      <div className="bg-white rounded-xl p-3.5 border border-nicora-border shadow-clean flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold text-nicora-orange uppercase tracking-wider">
              {locationInfo?.shortName}
            </span>
            <span className="text-neutral-300">•</span>
            {isCassaCovered ? (
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                <ShieldCheck size={11} /> Cassa Coperta
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-full flex items-center gap-0.5 animate-pulse">
                <ShieldAlert size={11} /> Cassa Scoperta
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-nicora-title capitalize leading-snug">
            {formatDisplayDate(currentDate)}
          </h2>
        </div>

        <div className="flex gap-1.5 text-center">
          <div className="bg-nicora-teal-light text-nicora-teal px-2 py-1 rounded-lg border border-nicora-teal-border/40 min-w-[50px]">
            <span className="block text-[9px] uppercase font-bold text-nicora-teal/70">Mattina</span>
            <span className="text-xs font-black">{morningShifts.length}</span>
          </div>
          <div className="bg-nicora-orange-light text-nicora-orange px-2 py-1 rounded-lg border border-nicora-orange-border/40 min-w-[50px]">
            <span className="block text-[9px] uppercase font-bold text-nicora-orange/70">Pomeriggio</span>
            <span className="text-xs font-black">{afternoonShifts.length}</span>
          </div>
        </div>
      </div>

      {/* Il Mio Turno di Oggi (Highlight Card) */}
      {myShift && (
        <div className="bg-gradient-to-br from-nicora-teal to-[#014145] text-white rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-15">
            <Sparkles size={80} />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs uppercase font-bold tracking-wider text-nicora-orange-border bg-black/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <UserCheck size={12} /> Il tuo turno oggi
            </span>
            <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full font-semibold">
              {myShift.department || getEmployee(currentEmployeeId)?.role}
            </span>
          </div>

          <div className="mt-3 relative z-10 flex items-baseline gap-2">
            <h3 className="text-2xl font-black tracking-tight">
              {myShift.type === 'riposo'
                ? 'Giorno di Riposo ☕'
                : myShift.type === 'ferie'
                ? 'In Ferie 🌴'
                : `${myShift.startTime || '08:30'} - ${myShift.endTime || '19:30'}`}
            </h3>
            {myShift.type !== 'riposo' && myShift.type !== 'ferie' && (
              <span className="text-xs text-nicora-teal-light font-medium capitalize">
                ({myShift.type})
              </span>
            )}
          </div>

          {myShift.areaNote && (
            <p className="text-xs text-nicora-teal-light mt-1.5 flex items-center gap-1.5 relative z-10">
              <MapPin size={13} className="text-nicora-orange" />
              <span>Mansione: <strong>{myShift.areaNote}</strong></span>
            </p>
          )}
        </div>
      )}

      {/* Sezione Mattina */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-teal flex items-center gap-1.5">
            <Sun size={15} className="text-nicora-orange" />
            <span>Turno Mattina / Giornata</span>
          </h3>
          <span className="text-xs font-semibold text-nicora-muted">
            {morningShifts.length} in servizio
          </span>
        </div>

        {morningShifts.length === 0 ? (
          <p className="text-xs text-nicora-muted italic p-3 bg-white rounded-xl border border-dashed border-nicora-border">
            Nessun collaboratore registrato al mattino per {locationInfo?.shortName}.
          </p>
        ) : (
          <div className="space-y-2">
            {morningShifts.map((shift) => (
              <ShiftItemCard
                key={shift.id}
                shift={shift}
                employee={getEmployee(shift.employeeId)}
                isMe={shift.employeeId === currentEmployeeId}
                isManagerMode={isManagerMode}
                onEdit={() => onEditShift(shift)}
                getDeptColor={getDeptColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sezione Pomeriggio */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-teal flex items-center gap-1.5">
            <Sunset size={15} className="text-nicora-orange" />
            <span>Turno Pomeriggio / Continuato</span>
          </h3>
          <span className="text-xs font-semibold text-nicora-muted">
            {afternoonShifts.length} in servizio
          </span>
        </div>

        {afternoonShifts.length === 0 ? (
          <p className="text-xs text-nicora-muted italic p-3 bg-white rounded-xl border border-dashed border-nicora-border">
            Nessun collaboratore registrato nel pomeriggio per {locationInfo?.shortName}.
          </p>
        ) : (
          <div className="space-y-2">
            {afternoonShifts.map((shift) => (
              <ShiftItemCard
                key={shift.id}
                shift={shift}
                employee={getEmployee(shift.employeeId)}
                isMe={shift.employeeId === currentEmployeeId}
                isManagerMode={isManagerMode}
                onEdit={() => onEditShift(shift)}
                getDeptColor={getDeptColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sezione Riposo / Ferie */}
      {restShifts.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-muted flex items-center gap-1.5">
              <Coffee size={14} />
              <span>A Riposo o in Ferie ({restShifts.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {restShifts.map((shift) => {
              const emp = getEmployee(shift.employeeId);
              if (!emp) return null;
              return (
                <div
                  key={shift.id}
                  onClick={() => isManagerMode && onEditShift(shift)}
                  className={`bg-white p-2.5 rounded-xl border border-nicora-border flex items-center justify-between shadow-xs ${
                    isManagerMode ? 'cursor-pointer hover:border-nicora-orange' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-[10px] font-bold">
                      {emp.avatar}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-neutral-800 leading-tight">{emp.name}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">
                        {shift.type === 'ferie' ? '🌴 Ferie' : 'Riposo 5/7'}
                      </p>
                    </div>
                  </div>
                  {isManagerMode && <Edit3 size={12} className="text-nicora-orange" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

// Card Turno Singolo
interface ShiftItemCardProps {
  shift: Shift;
  employee?: Employee;
  isMe: boolean;
  isManagerMode: boolean;
  onEdit: () => void;
  getDeptColor: (dept?: Department) => string;
}

const ShiftItemCard: React.FC<ShiftItemCardProps> = ({
  shift,
  employee,
  isMe,
  isManagerMode,
  onEdit,
  getDeptColor,
}) => {
  if (!employee) return null;

  return (
    <div
      onClick={() => isManagerMode && onEdit()}
      className={`relative bg-white rounded-xl p-3 border transition-all duration-150 shadow-clean ${
        isMe
          ? 'border-nicora-orange ring-1 ring-nicora-orange bg-nicora-orange-light/20'
          : 'border-nicora-border'
      } ${isManagerMode ? 'cursor-pointer active:scale-[0.99] hover:border-nicora-teal' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 ${
              isMe
                ? 'bg-nicora-orange text-white'
                : 'bg-nicora-teal-light text-nicora-teal border border-nicora-teal-border/40'
            }`}
          >
            {employee.avatar}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-nicora-title">{employee.name}</span>
              {isMe && (
                <span className="text-[9px] bg-nicora-orange text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                  Tu
                </span>
              )}
              {employee.isManager && (
                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                  Resp.
                </span>
              )}
            </div>
            
            {/* Reparto Assegnato */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getDeptColor(shift.department)}`}>
                {shift.department || employee.role}
              </span>
            </div>
          </div>
        </div>

        {/* Orario turno */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-xs font-extrabold text-nicora-teal bg-neutral-100 px-2 py-0.5 rounded-lg">
            <Clock size={11} className="text-nicora-orange" />
            <span>
              {shift.startTime || '08:30'} - {shift.endTime || '19:30'}
            </span>
          </div>
          {shift.type === 'giornata' && (
            <span className="block text-[9px] text-nicora-orange font-bold mt-0.5">
              Full / Continuato
            </span>
          )}
        </div>
      </div>

      {/* Dettaglio mansione o reparto */}
      <div className="mt-2 pt-2 border-t border-dashed border-nicora-border flex items-center justify-between text-xs text-nicora-muted">
        <span className="flex items-center gap-1 text-[11px] truncate max-w-[220px]">
          <MapPin size={11} className="text-nicora-teal flex-shrink-0" />
          <span className="truncate">{shift.areaNote || 'Reparto Principale'}</span>
        </span>

        {isManagerMode && (
          <button
            type="button"
            className="text-nicora-orange hover:text-nicora-orange-hover font-bold text-[11px] flex items-center gap-0.5"
          >
            <Edit3 size={11} />
            <span>Modifica</span>
          </button>
        )}
      </div>
    </div>
  );
};
