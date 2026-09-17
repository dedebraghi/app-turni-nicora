import React from 'react';
import { Employee, Shift, ShiftType } from '../types';
import { Clock, MapPin, Edit3, UserCheck, Coffee, Sun, Sunset, Sparkles } from 'lucide-react';

interface TodayViewProps {
  currentDate: string;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  onEditShift: (shift: Shift) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  currentDate,
  currentEmployeeId,
  employees,
  shifts,
  isManagerMode,
  onEditShift,
}) => {
  // Filtra turni di oggi
  const todayShifts = shifts.filter((s) => s.date === currentDate);

  const getEmployee = (empId: string) => employees.find((e) => e.id === empId);

  // Suddivisione fasce
  const morningShifts = todayShifts.filter((s) => s.type === 'mattina' || s.type === 'giornata');
  const afternoonShifts = todayShifts.filter((s) => s.type === 'pomeriggio' || s.type === 'giornata');
  const restShifts = todayShifts.filter((s) => s.type === 'riposo' || s.type === 'ferie');

  // Turno personale
  const myShift = todayShifts.find((s) => s.employeeId === currentEmployeeId);

  const formatDisplayDate = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Date Banner */}
      <div className="bg-white rounded-lg p-3.5 border border-nicora-border shadow-clean flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-nicora-orange uppercase tracking-wider">
            Stato Attuale Negozio
          </span>
          <h2 className="text-lg font-bold text-nicora-title capitalize leading-snug">
            {formatDisplayDate(currentDate)}
          </h2>
        </div>
        <div className="flex gap-2 text-center">
          <div className="bg-nicora-teal-light text-nicora-teal px-2.5 py-1 rounded-lg border border-nicora-teal-border/40">
            <span className="block text-[10px] uppercase font-bold text-nicora-teal/70">Mattina</span>
            <span className="text-sm font-extrabold">{morningShifts.length}</span>
          </div>
          <div className="bg-nicora-orange-light text-nicora-orange px-2.5 py-1 rounded-lg border border-nicora-orange-border/40">
            <span className="block text-[10px] uppercase font-bold text-nicora-orange/70">Pomeriggio</span>
            <span className="text-sm font-extrabold">{afternoonShifts.length}</span>
          </div>
        </div>
      </div>

      {/* Il Mio Turno di Oggi (Highlight Card) */}
      {myShift && (
        <div className="bg-gradient-to-br from-nicora-teal to-[#014145] text-white rounded-lg p-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-15">
            <Sparkles size={80} />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs uppercase font-bold tracking-wider text-nicora-orange-border bg-black/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <UserCheck size={12} /> Il tuo turno oggi
            </span>
            <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full font-semibold">
              {getEmployee(currentEmployeeId)?.role}
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
              <span>Zona: <strong>{myShift.areaNote}</strong></span>
            </p>
          )}
        </div>
      )}

      {/* Sezione Mattina */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-teal flex items-center gap-1.5">
            <Sun size={15} className="text-nicora-orange" />
            <span>Turno Mattina (08:30 - 12:30)</span>
          </h3>
          <span className="text-xs font-semibold text-nicora-muted">
            {morningShifts.length} collaboratori
          </span>
        </div>

        {morningShifts.length === 0 ? (
          <p className="text-xs text-nicora-muted italic p-3 bg-white rounded-lg border border-dashed border-nicora-border">
            Nessun collaboratore registrato al mattino.
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Sezione Pomeriggio */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-teal flex items-center gap-1.5">
            <Sunset size={15} className="text-nicora-orange" />
            <span>Turno Pomeriggio (14:30 - 19:30)</span>
          </h3>
          <span className="text-xs font-semibold text-nicora-muted">
            {afternoonShifts.length} collaboratori
          </span>
        </div>

        {afternoonShifts.length === 0 ? (
          <p className="text-xs text-nicora-muted italic p-3 bg-white rounded-lg border border-dashed border-nicora-border">
            Nessun collaboratore registrato nel pomeriggio.
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Sezione Riposo / Ferie */}
      {restShifts.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-muted flex items-center gap-1.5">
              <Coffee size={14} />
              <span>Riposo & Ferie</span>
            </h3>
            <span className="text-xs font-semibold text-nicora-muted">
              {restShifts.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {restShifts.map((shift) => {
              const emp = getEmployee(shift.employeeId);
              if (!emp) return null;
              return (
                <div
                  key={shift.id}
                  onClick={() => isManagerMode && onEditShift(shift)}
                  className={`bg-white/80 p-2.5 rounded-lg border border-nicora-border flex items-center justify-between ${
                    isManagerMode ? 'cursor-pointer hover:border-nicora-orange' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] font-bold">
                      {emp.avatar}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-neutral-700 leading-tight">{emp.name}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">{shift.type}</p>
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

// Sub-component per Card Turno Singolo
interface ShiftItemCardProps {
  shift: Shift;
  employee?: Employee;
  isMe: boolean;
  isManagerMode: boolean;
  onEdit: () => void;
}

const ShiftItemCard: React.FC<ShiftItemCardProps> = ({
  shift,
  employee,
  isMe,
  isManagerMode,
  onEdit,
}) => {
  if (!employee) return null;

  return (
    <div
      onClick={() => isManagerMode && onEdit()}
      className={`relative bg-white rounded-lg p-3 border transition-all duration-150 shadow-clean ${
        isMe
          ? 'border-nicora-orange ring-1 ring-nicora-orange bg-nicora-orange-light/20'
          : 'border-nicora-border'
      } ${isManagerMode ? 'cursor-pointer active:scale-[0.99] hover:border-nicora-teal' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {/* Avatar con iniziali */}
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
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
                <span className="text-[9px] bg-nicora-teal text-white font-semibold px-1 py-0.2 rounded">
                  Resp.
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-nicora-muted">{employee.role}</p>
          </div>
        </div>

        {/* Orario turno */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-xs font-extrabold text-nicora-teal bg-neutral-100 px-2 py-0.5 rounded">
            <Clock size={11} className="text-nicora-orange" />
            <span>
              {shift.startTime} - {shift.endTime}
            </span>
          </div>
          {shift.type === 'giornata' && (
            <span className="block text-[9px] text-nicora-orange font-bold mt-0.5">
              Spezzato / Full Day
            </span>
          )}
        </div>
      </div>

      {/* Zona o mansione speciale */}
      <div className="mt-2 pt-2 border-t border-dashed border-nicora-border/80 flex items-center justify-between text-xs text-nicora-muted">
        <span className="flex items-center gap-1 text-[11px]">
          <MapPin size={11} className="text-nicora-teal" />
          <span className="truncate max-w-[210px]">{shift.areaNote || 'Reparto Principale'}</span>
        </span>

        {isManagerMode && (
          <button
            type="button"
            className="text-nicora-orange hover:text-nicora-orange-hover font-semibold text-[11px] flex items-center gap-0.5"
          >
            <Edit3 size={12} />
            <span>Modifica</span>
          </button>
        )}
      </div>
    </div>
  );
};
