import React from 'react';
import { Department, Employee, LocationInfo, Shift, WeekDayMeta } from '../../domain/types';
import { DEPARTMENT_COLORS, SHIFT_COLORS } from '../../domain/rules';
import { Coffee, Edit3, ShieldAlert, ShieldCheck, Sparkles, User, Users } from 'lucide-react';

interface MobileDayViewProps {
  location: LocationInfo;
  employees: Employee[];
  shifts: Shift[];
  weekDays: WeekDayMeta[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  isManagerMode: boolean;
  onEditShift: (shift: Shift) => void;
  selectedDeptFilter: string;
  onSelectDeptFilter: (dept: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
}

export const MobileDayView: React.FC<MobileDayViewProps> = ({
  employees,
  shifts,
  weekDays,
  selectedDateStr,
  onSelectDate,
  isManagerMode,
  onEditShift,
  selectedDeptFilter,
  onSelectDeptFilter,
  searchQuery,
  onSearchQueryChange,
}) => {
  const selectedDayMeta = weekDays.find((d) => d.dateStr === selectedDateStr) || weekDays[0];

  // Turni del giorno selezionato per tutti i dipendenti di questa sede
  const dayShifts = shifts.filter((s) => s.date === selectedDayMeta.dateStr);

  // Calcolo statistiche giornaliere
  const workingShifts = dayShifts.filter(
    (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );
  const cassaShifts = workingShifts.filter(
    (s) => s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa')
  );
  const isCassaCovered = cassaShifts.length > 0;
  const offCount = dayShifts.filter((s) => s.type === 'riposo').length;
  const leaveCount = dayShifts.filter((s) => s.type === 'ferie' || s.type === 'malattia').length;

  // Filtraggio collaboratori
  const filteredEmployees = employees.filter((emp) => {
    if (emp.isActive === false) return false;
    const shift = dayShifts.find((s) => s.employeeId === emp.id);
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shift?.areaNote && shift.areaNote.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept =
      selectedDeptFilter === 'all' ||
      (shift?.department ? shift.department === selectedDeptFilter : emp.role === selectedDeptFilter);

    return matchesSearch && matchesDept;
  });

  // Ordina: prima chi lavora in cassa, poi gli altri al lavoro raggruppati per reparto, poi riposi/ferie
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const shiftA = dayShifts.find((s) => s.employeeId === a.id);
    const shiftB = dayShifts.find((s) => s.employeeId === b.id);

    const isOffA = !shiftA || shiftA.type === 'riposo' || shiftA.type === 'ferie' || shiftA.type === 'malattia';
    const isOffB = !shiftB || shiftB.type === 'riposo' || shiftB.type === 'ferie' || shiftB.type === 'malattia';

    if (!isOffA && isOffB) return -1;
    if (isOffA && !isOffB) return 1;

    // Se entrambi lavorano, dai priorità alla cassa
    if (!isOffA && !isOffB) {
      const isCassaA = shiftA?.department === 'Cassa';
      const isCassaB = shiftB?.department === 'Cassa';
      if (isCassaA && !isCassaB) return -1;
      if (!isCassaA && isCassaB) return 1;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-3">
      
      {/* --- SELETTORE GIORNI SETTIMANA A PILLOLE --- */}
      <div className="bg-white rounded-2xl p-2 border border-nicora-border shadow-clean">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDayMeta.dateStr;
            const curDayShifts = shifts.filter((s) => s.date === day.dateStr);
            const curWorking = curDayShifts.filter(
              (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
            );
            const curCassa = curWorking.some(
              (s) => s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa')
            );

            return (
              <button
                key={day.dateStr}
                onClick={() => onSelectDate(day.dateStr)}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-between transition-all touch-manipulation relative ${
                  isSelected
                    ? 'bg-nicora-teal text-white shadow-sm ring-2 ring-nicora-teal/30'
                    : day.isToday
                    ? 'bg-nicora-orange-light/50 text-neutral-900 border border-nicora-orange-border/60'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span className={`text-[10px] font-extrabold uppercase ${isSelected ? 'text-white/90' : 'text-neutral-500'}`}>
                  {day.dayShort}
                </span>
                <span className={`text-sm font-black my-0.5 ${isSelected ? 'text-white' : day.isToday ? 'text-nicora-orange' : 'text-neutral-800'}`}>
                  {day.dayNum}
                </span>
                
                {/* Dot stato copertura cassa */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      curCassa
                        ? isSelected
                          ? 'bg-emerald-300'
                          : 'bg-emerald-500'
                        : 'bg-rose-500 animate-pulse'
                    }`}
                    title={curCassa ? 'Cassa coperta' : 'Cassa scoperta!'}
                  />
                  {day.isMerchandiseArrival && (
                    <span className="text-[8px]" title="Arrivo Merci">🚚</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- BANNER STATO GIORNO SELEZIONATO --- */}
      <div className="bg-white rounded-2xl p-3.5 border border-nicora-border shadow-clean space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-nicora-title capitalize">
                {selectedDayMeta.dayName} {selectedDayMeta.dayNum}
              </h3>
              {selectedDayMeta.isToday && (
                <span className="bg-nicora-orange text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                  Oggi
                </span>
              )}
              {selectedDayMeta.isWeekend && (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Weekend
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {workingShifts.length} collaboratori in servizio • {offCount} a riposo {leaveCount > 0 ? `• ${leaveCount} assenze/ferie` : ''}
            </p>
          </div>

          {/* Badge Presidio Cassa */}
          {isCassaCovered ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl text-[11px] font-bold">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Cassa ({cassaShifts.length})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 text-rose-800 px-2.5 py-1 rounded-xl text-[11px] font-black animate-pulse">
              <ShieldAlert size={14} className="text-rose-600" />
              <span>Cassa Scoperta!</span>
            </div>
          )}
        </div>

        {/* Reparti Filtro Rapido a Scorrimento */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <button
            onClick={() => onSelectDeptFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors ${
              selectedDeptFilter === 'all'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Tutti ({employees.length})
          </button>
          {(['Cassa', 'Fioreria', 'Decor', 'Serra Calda', 'Serra Fredda'] as Department[]).map((dept) => {
            const isSelected = selectedDeptFilter === dept;
            const colors = DEPARTMENT_COLORS[dept];
            return (
              <button
                key={dept}
                onClick={() => onSelectDeptFilter(dept)}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors border ${
                  isSelected
                    ? `${colors.badge} shadow-xs border-transparent`
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- SCHEDE VERTICALI DEI COLLABORATORI --- */}
      <div className="space-y-2">
        {sortedEmployees.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-neutral-400 border border-nicora-border text-xs">
            <Users size={28} className="mx-auto mb-2 text-neutral-300" />
            Nessun collaboratore trovato per i filtri attuali.
          </div>
        ) : (
          sortedEmployees.map((emp) => {
            const shift = dayShifts.find((s) => s.employeeId === emp.id);
            const isOff = !shift || shift.type === 'riposo';
            const isFerie = shift?.type === 'ferie';
            const isMalattia = shift?.type === 'malattia';
            const dept = shift?.department || emp.role;
            const deptStyle = DEPARTMENT_COLORS[dept] || DEPARTMENT_COLORS['Cassa'];
            const shiftStyle = shift ? SHIFT_COLORS[shift.type] : SHIFT_COLORS.riposo;

            return (
              <div
                key={emp.id}
                onClick={() => {
                  if (isManagerMode && shift) {
                    onEditShift(shift);
                  }
                }}
                className={`bg-white rounded-2xl p-3.5 border transition-all ${
                  isManagerMode
                    ? 'cursor-pointer hover:border-nicora-teal active:scale-[0.99] shadow-clean hover:shadow-md'
                    : 'border-nicora-border shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  
                  {/* Avatar & Nome */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-extrabold text-sm text-neutral-700 flex-shrink-0">
                      {emp.avatar || <User size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs sm:text-sm text-nicora-title truncate">
                          {emp.name}
                        </span>
                        {shift?.isCustomHours && (
                          <span
                            className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                            title="Orario Concordato / Modificato su richiesta"
                          >
                            <Sparkles size={10} className="text-amber-600" />
                            <span>Orario Speciale</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-neutral-400 font-medium">
                          Ruolo: {emp.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badge Stato / Orario */}
                  <div className="text-right flex-shrink-0">
                    {isOff ? (
                      <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-neutral-200">
                        <Coffee size={12} />
                        <span>Riposo</span>
                      </span>
                    ) : isFerie ? (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-purple-200">
                        🌴 Ferie
                      </span>
                    ) : isMalattia ? (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-rose-200">
                        🏥 Malattia
                      </span>
                    ) : (
                      <div className="space-y-0.5 text-right">
                        <span className={`inline-block font-black text-xs px-2 py-0.5 rounded-lg border ${shiftStyle.bg} ${shiftStyle.text} ${shiftStyle.border}`}>
                          {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
                        </span>
                        <span className="block text-[10px] font-bold text-neutral-400 capitalize">
                          {shift.type}
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Dettagli Reparto e Postazione Assegnata */}
                {!isOff && !isFerie && !isMalattia && shift && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${deptStyle.badge}`}>
                        {shift.department || emp.role}
                      </span>
                      {shift.areaNote && (
                        <span className="text-[11px] text-neutral-600 font-medium truncate">
                          {shift.areaNote}
                        </span>
                      )}
                    </div>

                    {isManagerMode && (
                      <span className="text-[10px] text-nicora-teal font-bold flex items-center gap-0.5 flex-shrink-0">
                        <Edit3 size={11} />
                        <span>Modifica</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
