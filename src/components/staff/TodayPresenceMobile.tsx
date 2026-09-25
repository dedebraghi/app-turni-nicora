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
  Utensils 
} from 'lucide-react';

interface TodayPresenceMobileProps {
  currentDate: string;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  activeLocation: LocationId;
  onEditShift: (shift: Shift) => void;
}

export const TodayPresenceMobile: React.FC<TodayPresenceMobileProps> = ({
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
      
      {/* Header Data & Context (Stitch Mobile) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-nicora-orange uppercase tracking-widest">
            {locationInfo?.shortName || (activeLocation === 'gazzada' ? 'Gazzada' : 'Varese')}
          </span>
          <h1 className="font-serif text-xl font-semibold text-nicora-title capitalize">
            {formatDisplayDate(currentDate)}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-2xs border border-nicora-sage-border text-neutral-700">
          <Sun size={15} className="text-nicora-orange" />
          <span className="text-xs font-semibold">21°C</span>
        </div>
      </div>

      {/* 3 Compact Stat Boxes (Stitch Mobile 132668eb8842442486ad04adfa3a5308) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-nicora-sage-border shadow-2xs text-center">
          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">In Servizio</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-serif text-xl font-bold text-nicora-teal">{workingShifts.length}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <span className="text-[9px] text-emerald-700 font-semibold">Operativi</span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-nicora-sage-border shadow-2xs text-center">
          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Riposo/Ferie</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-serif text-xl font-bold text-neutral-600">{restShifts.length}</span>
          </div>
          <span className="text-[9px] text-neutral-400 font-medium">Assenti oggi</span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 shadow-2xs text-center">
          <span className="text-[9px] uppercase tracking-wider text-nicora-orange font-bold">Cassa</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-serif text-xl font-bold text-nicora-orange">{cassaShifts.length}</span>
          </div>
          <span className="text-[9px] text-nicora-orange font-semibold">Linee attive</span>
        </div>
      </div>

      {/* Hero Turno Collaboratore (Ottanio Deep Scuro & Terracotta Accent) */}
      {myShift && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002f32] via-[#0a474b] to-[#072e31] text-white p-5 shadow-clean border border-white/10">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <Sparkles size={120} />
          </div>

          <div className="relative z-10 flex flex-col gap-3.5">
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white backdrop-blur-xs text-[11px]">
                <Clock size={12} className="text-emerald-300" />
                <span className="font-bold uppercase tracking-wider">Il tuo turno • {myEmployee?.name}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-nicora-orange text-white font-bold text-[10px] tracking-wide uppercase shadow-xs">
                {myShift.department || myEmployee?.role}
              </span>
            </div>

            {/* Turno & Orari */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-medium tracking-tight text-white">
                  {myShift.type === 'riposo'
                    ? 'Giorno di Riposo ☕'
                    : myShift.type === 'ferie'
                    ? 'In Ferie 🌴'
                    : myShift.type === 'malattia'
                    ? 'In Malattia 🏥'
                    : `${myShift.startTime || '08:30'} — ${myShift.endTime || '19:30'}`}
                </span>
              </div>
              {myShift.type !== 'riposo' && myShift.type !== 'ferie' && myShift.type !== 'malattia' && (
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Turno {myShift.type === 'giornata' ? 'Completo • Giornata Intera' : myShift.type}
                </p>
              )}
            </div>

            {/* Bento Details */}
            {myShift.type !== 'riposo' && myShift.type !== 'ferie' && myShift.type !== 'malattia' && (
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="p-2.5 rounded-xl bg-black/25 backdrop-blur-xs flex flex-col gap-0.5">
                  <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold flex items-center gap-1">
                    <MapPin size={11} /> Postazione
                  </span>
                  <span className="font-bold text-white text-xs truncate">
                    {myShift.areaNote || `Reparto ${myShift.department || myEmployee?.role}`}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/25 backdrop-blur-xs flex flex-col gap-0.5">
                  <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold flex items-center gap-1">
                    <Utensils size={11} /> Pausa Pranzo
                  </span>
                  <span className="font-bold text-white text-xs">
                    13:00 — 14:00
                  </span>
                </div>
              </div>
            )}

            {/* Footer Timbratura Status */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-white/90 font-medium text-[11px]">Orario verificato in Cloud</span>
              </div>
              <span className="text-[10px] text-emerald-200 uppercase font-semibold">Live</span>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Scrollable Department Filter (Stitch Mobile) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Filtro Reparto</span>
          <span className="text-[10px] text-neutral-400 font-semibold">{workingShifts.length} Presenti</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDeptFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all ${
              selectedDeptFilter === 'all'
                ? 'bg-nicora-teal text-white'
                : 'bg-white text-neutral-600 border border-nicora-sage-border'
            }`}
          >
            Tutti ({workingShifts.length})
          </button>
          {['Cassa', 'Fioreria', 'Decor', 'Serra Calda', 'Serra Fredda'].map((dept) => {
            const count = workingShifts.filter((s) => s.department === dept).length;
            const isSelected = selectedDeptFilter === dept;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDeptFilter(dept)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all ${
                  isSelected
                    ? 'bg-nicora-orange text-white'
                    : 'bg-white text-neutral-600 border border-nicora-sage-border'
                }`}
              >
                {dept} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Stack: Collaboratori Oggi in Sede (Stitch Mobile) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-serif text-sm font-semibold text-nicora-title">In Turno Oggi</h2>
          <span className="text-[10px] font-bold text-nicora-orange uppercase tracking-wider">
            {filteredWorkingShifts.length} Operativi
          </span>
        </div>

        {filteredWorkingShifts.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center text-xs text-neutral-400 border border-dashed border-nicora-sage-border">
            Nessun collaboratore in servizio per i filtri selezionati.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWorkingShifts.map((shift) => {
              const emp = getEmployee(shift.employeeId);
              if (!emp) return null;
              const isMe = shift.employeeId === currentEmployeeId;
              const isCassa = (shift.department || emp.role) === 'Cassa';

              return (
                <div
                  key={shift.id}
                  onClick={() => isManagerMode && onEditShift(shift)}
                  className={`flex items-center justify-between p-3 rounded-xl bg-white border shadow-2xs transition-all ${
                    isMe
                      ? 'border-nicora-orange ring-1 ring-nicora-orange/60 bg-amber-50/20'
                      : isCassa
                      ? 'border-rose-200'
                      : 'border-nicora-sage-border'
                  } ${isManagerMode ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isMe
                          ? 'bg-nicora-orange text-white'
                          : isCassa
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-nicora-teal-light text-nicora-teal'
                      }`}>
                        {emp.avatar || emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif text-sm font-semibold text-nicora-title truncate">
                          {emp.name}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-nicora-orange text-white text-[9px] font-bold uppercase">
                            TU
                          </span>
                        )}
                        {emp.isManager && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">
                            Resp
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold ${isCassa ? 'text-rose-700' : 'text-neutral-500'}`}>
                        {shift.areaNote || shift.department || emp.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 text-right">
                    <span className="text-xs font-bold text-neutral-800">
                      {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
                    </span>
                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                      isCassa ? 'text-emerald-700' : 'text-neutral-400'
                    }`}>
                      {isCassa ? <><CheckCircle2 size={11} /> In Cassa</> : 'In turno'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collaboratori a Riposo o in Ferie */}
      {restShifts.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-0.5 flex items-center gap-1">
            <Coffee size={12} /> A Riposo o Ferie ({restShifts.length})
          </span>
          <div className="grid grid-cols-2 gap-2">
            {restShifts.map((shift) => {
              const emp = getEmployee(shift.employeeId);
              if (!emp) return null;
              return (
                <div
                  key={shift.id}
                  onClick={() => isManagerMode && onEditShift(shift)}
                  className={`bg-white p-2.5 rounded-xl border border-nicora-sage-border flex items-center gap-2 shadow-2xs ${
                    isManagerMode ? 'cursor-pointer hover:border-nicora-orange' : ''
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {emp.avatar || emp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-800 truncate">{emp.name}</p>
                    <p className="text-[9px] text-neutral-400 capitalize">
                      {shift.type === 'ferie' ? '🌴 Ferie' : shift.type === 'malattia' ? '🏥 Malattia' : '☕ Riposo'}
                    </p>
                  </div>
                  {isManagerMode && <Edit3 size={11} className="text-nicora-orange ml-auto shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
