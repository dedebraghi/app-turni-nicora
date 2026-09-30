import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { formatLocalDate, getSundayOfWeek, getWeekDays } from '../../engine/schedulerEngine';
import { ChevronLeft, ChevronRight, Clock, Coffee, Calendar, MapPin, RefreshCw } from 'lucide-react';

interface MyScheduleDesktopProps {
  currentEmployee: Employee;
  shifts: Shift[];
  activeLocation: LocationId;
  onSaveEmployee?: (emp: Employee) => void;
  onRefreshShifts?: () => Promise<void> | void;
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

export const MyScheduleDesktop: React.FC<MyScheduleDesktopProps> = ({
  currentEmployee,
  shifts,
  activeLocation,
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

  // Statistiche settimana personale (identiche a Mobile)
  const workedShifts = myWeekShifts.filter(
    (item) => item.shift && item.shift.type !== 'riposo' && item.shift.type !== 'ferie' && item.shift.type !== 'malattia'
  );
  const restShifts = myWeekShifts.filter(
    (item) => item.shift?.type === 'riposo'
  );
  const leaveShifts = myWeekShifts.filter(
    (item) => item.shift?.type === 'ferie' || item.shift?.type === 'malattia'
  );

  return (
    <div className="max-w-[1080px] w-full mx-auto space-y-6 pb-16">
      {/* 1. Collaborator Profile Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002f32] via-[#0a474b] to-[#072e31] text-white shadow-xl p-6 sm:p-7 border border-white/10">
        <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-nicora-orange text-white font-serif font-bold text-2xl flex items-center justify-center shadow-md">
                {currentEmployee.avatar || currentEmployee.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#002f32]"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl text-white font-medium tracking-tight">
                  {currentEmployee.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-nicora-orange text-white text-[10px] font-bold uppercase tracking-wider">
                  ATTIVO
                </span>
              </div>
              <p className="text-sm text-emerald-200/90 mt-0.5">
                Reparto {currentEmployee.role} • Sede: <strong className="capitalize text-white">{activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese'}</strong>
              </p>
            </div>
          </div>

          {/* 3 Indicatori sintetici allineati alla vista Mobile */}
          <div className="flex items-center gap-6 px-4 py-2.5 rounded-2xl bg-black/25 border border-white/10">
            <div className="text-center">
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/80 font-bold">Turni</span>
              <span className="font-serif text-xl font-bold text-white leading-tight">{workedShifts.length}</span>
            </div>
            <div className="w-px h-7 bg-white/15"></div>
            <div className="text-center">
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/80 font-bold">Riposi</span>
              <span className="font-serif text-xl font-bold text-white leading-tight">{restShifts.length}</span>
            </div>
            <div className="w-px h-7 bg-white/15"></div>
            <div className="text-center">
              <span className="block text-[10px] uppercase tracking-wider text-emerald-200/80 font-bold">Assenze</span>
              <span className="font-serif text-xl font-bold text-white leading-tight">{leaveShifts.length}</span>
            </div>
          </div>

          {onRefreshShifts && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all border border-white/20 backdrop-blur-xs disabled:opacity-60 cursor-pointer shadow-xs shrink-0"
              title="Elimina la cache e risincronizza i turni aggiornati dal server"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-nicora-orange' : 'text-emerald-200'}`} />
              <span>{isRefreshing ? 'Sincronizzazione...' : 'Aggiorna turni'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Week Navigation Controller */}
      <nav className="w-full bg-white rounded-2xl p-3 shadow-2xs border border-nicora-sage-border flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-nicora-teal hover:bg-neutral-100 transition-colors shadow-2xs border border-nicora-sage-border"
          title="Settimana precedente"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Calendar size={17} className="text-nicora-orange" />
            <span className="font-serif text-base sm:text-lg text-nicora-title font-semibold">
              Domenica {weekDays[0].dayNum} — Sabato {weekDays[6].dayNum}
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-nicora-orange mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-nicora-orange animate-pulse"></span>
            {weekOffset === 0 ? 'SETTIMANA IN CORSO' : weekOffset === 1 ? 'PROSSIMA SETTIMANA' : `OFFSET: ${weekOffset > 0 ? `+${weekOffset}` : weekOffset} SETT.`}
          </span>
        </div>

        <button
          onClick={() => setWeekOffset((p) => p + 1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-nicora-teal hover:bg-neutral-100 transition-colors shadow-2xs border border-nicora-sage-border"
          title="Settimana successiva"
        >
          <ChevronRight size={20} />
        </button>
      </nav>

      {/* 3. 7 Days Expanded Shifts Daily Cards List */}
      <div className="flex flex-col gap-3">
        {myWeekShifts.map(({ day, shift }) => {
          const isToday = day.isToday;
          const isOff = shift?.type === 'riposo' || shift?.type === 'ferie' || shift?.type === 'malattia';
          const dept = shift?.department || (isOff ? undefined : currentEmployee.role);

          return (
            <article
              key={day.dateStr}
              className={`bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border flex items-center justify-between gap-4 transition-all hover:shadow-sm ${
                isToday
                  ? 'border-nicora-orange ring-1 ring-nicora-orange/60 bg-amber-50/20'
                  : 'border-nicora-sage-border'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-2xs ${
                    isToday
                      ? 'bg-nicora-orange text-white shadow-xs'
                      : day.isWeekend
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                    {day.dayShort}
                  </span>
                  <span className="font-serif text-lg font-bold leading-tight mt-0.5">
                    {day.dayNum}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-base font-semibold text-neutral-800 capitalize">
                      {day.dayName}
                    </h2>
                    {isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-nicora-orange text-white">
                        Oggi
                      </span>
                    )}
                    {day.isMerchandiseArrival && (
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                        🚚 Arrivo Merci
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs flex-wrap">
                    {dept && !isOff && shift && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getDeptBadgeClass(dept)}`}>
                        {dept}
                      </span>
                    )}
                    {shift?.areaNote && !isOff && (
                      <span className="text-neutral-500 text-xs flex items-center gap-1">
                        <MapPin size={12} className="text-nicora-teal" />
                        <span>{shift.areaNote}</span>
                      </span>
                    )}
                    {isOff && (
                      <span className="text-neutral-400 text-xs">
                        {shift?.type === 'ferie' ? 'Assenza programmata per ferie' : shift?.type === 'malattia' ? 'Certificato medico registrato' : 'Giorno di riposo contrattuale'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Hours / Status */}
              <div className="text-right shrink-0">
                {shift ? (
                  shift.type === 'riposo' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 bg-neutral-100 px-3.5 py-1.5 rounded-xl">
                      <Coffee size={14} /> Giorno di Riposo
                    </span>
                  ) : shift.type === 'ferie' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100 px-3.5 py-1.5 rounded-xl">
                      🌴 In Ferie
                    </span>
                  ) : shift.type === 'malattia' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-3.5 py-1.5 rounded-xl">
                      🏥 In Malattia
                    </span>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 text-sm font-bold text-nicora-teal bg-neutral-100 px-3 py-1 rounded-xl">
                        <Clock size={13} className="text-nicora-orange" />
                        <span>{shift.startTime || '08:30'} — {shift.endTime || '19:30'}</span>
                      </div>
                      <span className="block text-[11px] text-neutral-400">
                        Turno {shift.type === 'giornata' ? 'Giornata Intera' : shift.type}
                      </span>
                    </div>
                  )
                ) : (
                  <span className="text-xs text-neutral-400 italic">Non pianificato</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

