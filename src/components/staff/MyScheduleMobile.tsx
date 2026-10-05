import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { formatLocalDate, getSundayOfWeek, getWeekDays } from '../../engine/schedulerEngine';
import { MobileHeader } from '../layout/MobileHeader';
import { ChevronLeft, ChevronRight, Clock, Coffee, Calendar, KeyRound, RefreshCw } from 'lucide-react';

interface MyScheduleMobileProps {
  currentEmployee: Employee;
  employees?: Employee[];
  shifts: Shift[];
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onLogout?: () => void;
  onSaveEmployee?: (emp: Employee) => void;
  onRefreshShifts?: () => Promise<void> | void;
}

export const MyScheduleMobile: React.FC<MyScheduleMobileProps> = ({
  currentEmployee,
  employees,
  shifts,
  activeLocation,
  onChangeLocation,
  onLogout,
  onSaveEmployee,
  onRefreshShifts,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    if (!onRefreshShifts || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshShifts();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const gazzadaStaffCount = employees?.filter((e) => e.locationId === 'gazzada' && e.isActive !== false).length || 10;
  const vareseStaffCount = employees?.filter((e) => e.locationId === 'varese' && e.isActive !== false).length || 16;

  const baseSunday = getSundayOfWeek(new Date());
  baseSunday.setDate(baseSunday.getDate() + weekOffset * 7);
  const baseSundayStr = formatLocalDate(baseSunday);

  const weekDays = getWeekDays(baseSundayStr);

  const myWeekShifts = weekDays.map((day) => {
    const shift = shifts.find(
      (s) => s.employeeId === currentEmployee.id && s.date === day.dateStr
    );
    return {
      day,
      shift,
    };
  });

  // Statistiche settimana personale
  const workedShifts = myWeekShifts.filter(
    (item) => item.shift && item.shift.type !== 'riposo' && item.shift.type !== 'ferie' && item.shift.type !== 'malattia'
  );
  const restShifts = myWeekShifts.filter(
    (item) => item.shift?.type === 'riposo'
  );
  const leaveShifts = myWeekShifts.filter(
    (item) => item.shift?.type === 'ferie' || item.shift?.type === 'malattia'
  );

  const getDeptBadgeClass = (dept?: string) => {
    switch (dept) {
      case 'Cassa': return 'bg-rose-600 text-white';
      case 'Fioreria': return 'bg-pink-100 text-pink-800';
      case 'Decor': return 'bg-purple-100 text-purple-800';
      case 'Serra Calda': return 'bg-emerald-100 text-emerald-800';
      case 'Serra Fredda': return 'bg-sky-100 text-sky-800';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#f2fcf7] text-[#151d1b] flex flex-col font-sans">
      
      {/* ========================================================
          1. HEADER NATIVO STITCH MOBILE CONDIVISO (con PIN e Logout)
          ======================================================== */}
      <MobileHeader
        title="I Miei Turni"
        employee={currentEmployee}
        activeLocation={activeLocation}
        onChangeLocation={onChangeLocation}
        gazzadaStaffCount={gazzadaStaffCount}
        vareseStaffCount={vareseStaffCount}
        onLogout={onLogout}
        onSaveEmployee={onSaveEmployee}
        onRefreshShifts={onRefreshShifts}
      />

      {/* ========================================================
          2. CORPO PRINCIPALE MOBILE
          ======================================================== */}
      <div className="pt-[calc(6.25rem+env(safe-area-inset-top,0px))] px-4 pb-24 space-y-4">
        
        {/* Banner Promemoria PIN Predefinito */}
        {(!currentEmployee.password || currentEmployee.password === '1234') && !currentEmployee.isManager && !currentEmployee.isOwner && (
          <div className="bg-amber-50/95 border border-amber-200/90 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900 shadow-xs animate-in fade-in">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <KeyRound size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[12px] leading-tight">Stai usando il PIN predefinito (1234)</p>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                Per la tua riservatezza, tocca la tua icona profilo in alto a destra per scegliere un codice segreto a tua scelta.
              </p>
            </div>
          </div>
        )}

        {/* Collaborator Profile Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002f32] via-[#0a474b] to-[#072e31] text-white shadow-clean p-4 border border-white/10">
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#fd651e] text-white font-serif font-bold text-base flex items-center justify-center shadow-xs">
                  {currentEmployee.avatar || currentEmployee.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-serif text-lg text-white font-medium tracking-tight">
                      {currentEmployee.name}
                    </h1>
                    <span className="px-1.5 py-0.2 rounded bg-[#fd651e] text-white text-[9px] font-bold uppercase">
                      ATTIVO
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5">
                    Reparto {currentEmployee.role} • {activeLocation === 'gazzada' ? 'Sede Gazzada' : 'Sede Varese'}
                  </p>
                </div>
              </div>
            </div>

            {/* Metric Pods Grid 3 items on mobile (Turni, Riposi, Assenze) */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-center">
              <div className="p-2 rounded-xl bg-black/25 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-200">TURNI</span>
                <span className="font-serif text-base font-bold text-white leading-none mt-1">{workedShifts.length}</span>
              </div>
              <div className="p-2 rounded-xl bg-black/25 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-200">RIPOSI</span>
                <span className="font-serif text-base font-bold text-white leading-none mt-1">{restShifts.length}</span>
              </div>
              <div className="p-2 rounded-xl bg-black/25 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-200">ASSENZE</span>
                <span className="font-serif text-base font-bold text-white leading-none mt-1">{leaveShifts.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation Controller */}
        <nav className="w-full bg-white rounded-2xl p-2.5 shadow-2xs border border-[#e2e8e4] flex items-center justify-between text-xs">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#a73a00]" />
              <span className="font-serif text-sm text-[#002f32] font-semibold">
                Dom {weekDays[0].dayNum} — Sab {weekDays[6].dayNum}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#a73a00] mt-0.5">
              {weekOffset === 0 ? 'Settimana In Corso' : weekOffset === 1 ? 'Prossima Settimana' : `Offset: ${weekOffset > 0 ? `+${weekOffset}` : weekOffset} sett.`}
            </span>
          </div>

          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </nav>

        {/* 7 Days Vertical Shift Cards */}
        <div className="space-y-2">
          {myWeekShifts.map(({ day, shift }) => {
            const isToday = day.isToday;
            const isOff = shift?.type === 'riposo' || shift?.type === 'ferie' || shift?.type === 'malattia';
            const dept = shift?.department || (isOff ? undefined : currentEmployee.role);

            return (
              <div
                key={day.dateStr}
                className={`bg-white rounded-xl p-3 border shadow-2xs flex items-center justify-between gap-3 ${
                  isToday
                    ? 'border-[#a73a00] ring-1 ring-[#a73a00]/60 bg-amber-50/20'
                    : 'border-[#e2e8e4]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      isToday
                        ? 'bg-[#a73a00] text-white shadow-xs'
                        : day.isWeekend
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold leading-none">{day.dayShort}</span>
                    <span className="font-serif text-base font-bold leading-none mt-1">{day.dayNum}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif text-sm font-semibold text-[#002f32]">
                        {day.dayName}
                      </span>
                      {isToday && (
                        <span className="text-[9px] bg-[#a73a00] text-white font-bold px-1.5 py-0.2 rounded uppercase">
                          Oggi
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-1.5 text-xs flex-wrap">
                      {dept && !isOff && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getDeptBadgeClass(dept)}`}>
                          {dept}
                        </span>
                      )}
                      {shift?.areaNote && !isOff && shift.areaNote !== dept && (
                        <span className="text-neutral-500 text-[11px] truncate max-w-[130px]">
                          {shift.areaNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {shift ? (
                    shift.type === 'riposo' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-lg">
                        <Coffee size={12} /> Riposo
                      </span>
                    ) : shift.type === 'ferie' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg">
                        🌴 Ferie
                      </span>
                    ) : shift.type === 'malattia' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">
                        🏥 Malattia
                      </span>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#002f32] bg-neutral-100/90 px-2 py-0.5 rounded-lg">
                          <Clock size={11} className="text-[#a73a00]" />
                          {shift.startTime || '08:30'}—{shift.endTime || '19:30'}
                        </span>
                        <span className="block text-[9px] text-neutral-400 mt-0.5">
                          {shift.type === 'giornata' ? 'Giornata Intera' : shift.type === 'mattina' ? 'Mezza Mattina' : 'Mezza Pomeriggio'}
                        </span>
                      </div>
                    )
                  ) : (
                    <span className="text-[11px] text-neutral-400 italic">Non pianificato</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
