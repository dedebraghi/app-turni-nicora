import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { LOCATIONS } from '../../domain/mockData';
import { 
  CheckCircle2, 
  Clock, 
  Coffee, 
  Edit3, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Sunset, 
  UserCheck, 
  Users, 
  Utensils 
} from 'lucide-react';

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

  const storeEmployees = employees.filter((e) => e.locationId === activeLocation && e.isActive !== false);
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
      <div className="bg-nicora-card rounded-2xl p-4 sm:p-5 border border-nicora-sage-border shadow-clean flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-nicora-orange uppercase tracking-wider bg-nicora-orange-light px-2.5 py-0.5 rounded-full border border-nicora-orange-border">
              {locationInfo?.name || (activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese')}
            </span>
            <span className="text-neutral-300">•</span>
            {isCassaCovered ? (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-700" />
                <span>Cassa Presidiata ({cassaShifts.length})</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <ShieldAlert size={13} className="text-rose-700" />
                <span>ATTENZIONE: Cassa Scoperta!</span>
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-nicora-title capitalize leading-tight">
            {formatDisplayDate(currentDate)}
          </h2>
        </div>

        {/* 3 Quick Indicator Cards (Stitch Botanica Nobile) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 border border-nicora-sage-border shadow-2xs text-center min-w-[76px]">
            <span className="block text-[9px] uppercase font-bold text-nicora-muted tracking-wider">In Servizio</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black text-nicora-teal">{workingShifts.length}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[9px] text-emerald-700 font-medium hidden sm:block">Operativi</span>
          </div>

          <div className="bg-white rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 border border-nicora-sage-border shadow-2xs text-center min-w-[76px]">
            <span className="block text-[9px] uppercase font-bold text-nicora-muted tracking-wider">Riposo/Ferie</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black text-neutral-600">{restShifts.length}</span>
            </div>
            <span className="text-[9px] text-neutral-400 font-medium hidden sm:block">Assenti oggi</span>
          </div>

          <div className="bg-nicora-orange-light rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 border border-nicora-orange-border shadow-2xs text-center min-w-[76px]">
            <span className="block text-[9px] uppercase font-bold text-nicora-orange tracking-wider">Cassa</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black text-nicora-orange">{cassaShifts.length}</span>
            </div>
            <span className="text-[9px] text-nicora-orange font-medium hidden sm:block">Linee attive</span>
          </div>
        </div>
      </div>

      {/* Il Mio Turno di Oggi (Hero Bento Card da Stitch) */}
      {myShift && (
        <div className="bg-gradient-to-br from-nicora-teal-dark via-nicora-teal to-[#072e31] text-white rounded-2xl p-5 sm:p-6 shadow-clean border border-white/10 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <Sparkles size={140} />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white backdrop-blur-xs text-xs font-semibold border border-white/10">
              <UserCheck size={14} className="text-emerald-300" />
              <span>Il tuo turno • {myEmployee?.name || 'Collaboratore'}</span>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-nicora-orange text-white uppercase tracking-wider shadow-xs">
              {myShift.department || myEmployee?.role}
            </span>
          </div>

          <div className="mt-3.5 relative z-10">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white">
                {myShift.type === 'riposo'
                  ? 'Giorno di Riposo ☕'
                  : myShift.type === 'ferie'
                  ? 'In Ferie 🌴'
                  : myShift.type === 'malattia'
                  ? 'In Malattia 🏥'
                  : `${myShift.startTime || '08:30'} — ${myShift.endTime || '19:30'}`}
              </h3>
              {myShift.type !== 'riposo' && myShift.type !== 'ferie' && myShift.type !== 'malattia' && (
                <span className="text-xs text-emerald-200 font-semibold capitalize bg-white/10 px-2.5 py-0.5 rounded-full">
                  Turno {myShift.type === 'giornata' ? 'Giornata Intera' : myShift.type}
                </span>
              )}
            </div>
          </div>

          {/* Shift Details Bento Inside Hero */}
          {myShift.type !== 'riposo' && myShift.type !== 'ferie' && myShift.type !== 'malattia' && (
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-2 border-t border-white/15 relative z-10">
              <div className="p-3 rounded-xl bg-black/20 backdrop-blur-xs flex flex-col gap-0.5">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold flex items-center gap-1">
                  <MapPin size={12} /> Postazione Assegnata
                </span>
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  {myShift.areaNote || `Reparto ${myShift.department || myEmployee?.role}`}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/20 backdrop-blur-xs flex flex-col gap-0.5">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold flex items-center gap-1">
                  <Utensils size={12} /> Pausa Pranzo
                </span>
                <span className="font-bold text-white text-xs sm:text-sm">
                  13:00 — 14:00
                </span>
                <span className="text-[10px] text-emerald-200/80">Sala Relax Piano 1</span>
              </div>
            </div>
          )}

          {/* Footer Timbratura */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 relative z-10 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span className="text-white/90 font-medium">Orario turno pianificato e convalidato</span>
            </div>
            <span className="text-emerald-200 text-[11px] font-semibold">Live Cloud</span>
          </div>
        </div>
      )}

      {/* Reparti Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setSelectedDeptFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedDeptFilter === 'all'
              ? 'bg-nicora-teal text-white shadow-xs'
              : 'bg-white text-neutral-600 border border-nicora-sage-border hover:bg-neutral-50'
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-nicora-orange text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-nicora-sage-border hover:bg-neutral-50'
              }`}
            >
              <span>{dept}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
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
              <Sun size={15} className="text-nicora-orange" />
              <span>Fascia Mattina &amp; Giornata Intera</span>
            </h3>
            <span className="text-xs font-bold text-neutral-500">
              {morningShifts.length} in turno
            </span>
          </div>

          {morningShifts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-dashed border-nicora-sage-border text-center text-xs text-neutral-400">
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
              <Sunset size={15} className="text-nicora-orange" />
              <span>Fascia Pomeriggio &amp; Continuato</span>
            </h3>
            <span className="text-xs font-bold text-neutral-500">
              {afternoonShifts.length} in turno
            </span>
          </div>

          {afternoonShifts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-dashed border-nicora-sage-border text-center text-xs text-neutral-400">
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
                  className={`bg-white p-3 rounded-xl border border-nicora-sage-border flex items-center justify-between shadow-2xs ${
                    isManagerMode ? 'cursor-pointer hover:border-nicora-orange hover:shadow-xs' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {emp.avatar || emp.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-800 leading-tight truncate">
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
          ? 'border-nicora-orange ring-1 ring-nicora-orange/60 bg-amber-50/20'
          : isCassa
          ? 'border-rose-200/90 hover:border-rose-300'
          : 'border-nicora-sage-border hover:border-nicora-teal-border'
      } ${isManagerMode ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        
        {/* Collaboratore Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                isMe
                  ? 'bg-nicora-orange text-white'
                  : isCassa
                  ? 'bg-rose-100 text-rose-800 font-extrabold'
                  : 'bg-nicora-teal-light text-nicora-teal'
              }`}
            >
              {employee.avatar || employee.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-sm font-semibold text-nicora-title truncate">
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

            {/* Reparto e Postazione */}
            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isCassa
                    ? 'bg-rose-600 text-white'
                    : dept === 'Fioreria'
                    ? 'bg-pink-100 text-pink-800'
                    : dept === 'Decor'
                    ? 'bg-purple-100 text-purple-800'
                    : dept === 'Serra Calda'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {dept}
              </span>
              {shift.areaNote && (
                <span className="text-[11px] text-neutral-500 truncate max-w-[150px]">
                  • {shift.areaNote}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Orario turno */}
        <div className="text-right flex-shrink-0">
          <div className="inline-flex items-center gap-1 text-xs font-extrabold text-nicora-teal bg-neutral-100/80 px-2.5 py-1 rounded-lg">
            <Clock size={12} className={isCassa ? 'text-rose-600' : 'text-nicora-orange'} />
            <span>
              {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            {isCassa ? (
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                <CheckCircle2 size={11} /> In Cassa
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400 font-medium">
                {shift.type === 'giornata' ? 'Giornata Intera' : 'In turno'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pulsante modifica per manager */}
      {isManagerMode && (
        <div className="mt-2 pt-1.5 border-t border-dashed border-neutral-100 flex items-center justify-end text-xs">
          <span className="text-nicora-orange font-bold text-[11px] flex items-center gap-0.5">
            <Edit3 size={11} /> Modifica Turno
          </span>
        </div>
      )}
    </div>
  );
};
