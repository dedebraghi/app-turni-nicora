import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { getSundayOfWeek, getWeekDays } from '../../engine/schedulerEngine';
import { ChevronLeft, ChevronRight, Clock, Coffee } from 'lucide-react';

interface MyScheduleProps {
  currentEmployee: Employee;
  shifts: Shift[];
  activeLocation: LocationId;
}

export const MySchedule: React.FC<MyScheduleProps> = ({
  currentEmployee,
  shifts,
  activeLocation,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const baseSunday = getSundayOfWeek(new Date());
  baseSunday.setDate(baseSunday.getDate() + weekOffset * 7);
  const baseSundayStr = baseSunday.toISOString().split('T')[0];

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

  return (
    <div className="space-y-4 pb-20 md:pb-8 max-w-3xl mx-auto">
      
      {/* Profile & Week Stats Header */}
      <div className="bg-gradient-to-r from-[#035F64] to-[#024347] text-white rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-nicora-orange flex items-center justify-center text-white font-black text-base shadow-sm">
              {currentEmployee.avatar}
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">
                {currentEmployee.name}
              </h2>
              <p className="text-xs text-nicora-teal-light/80">
                Reparto: <strong>{currentEmployee.role}</strong> • Sede: <strong className="capitalize">{activeLocation}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-nicora-orange-border block">
              Contratto 5/7
            </span>
            <span className="text-xl font-black">
              {workedShifts.length} / 5 <span className="text-xs font-medium text-nicora-teal-light">giorni</span>
            </span>
          </div>
        </div>

        {/* Counters summary */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
          <div className="bg-white/10 rounded-xl p-2">
            <span className="block text-[10px] uppercase font-bold text-nicora-teal-light/80">Lavoro</span>
            <span className="text-sm font-black">{workedShifts.length} turni</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <span className="block text-[10px] uppercase font-bold text-nicora-teal-light/80">Riposi</span>
            <span className="text-sm font-black">{restShifts.length} giorni</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <span className="block text-[10px] uppercase font-bold text-nicora-teal-light/80">Ferie / Permessi</span>
            <span className="text-sm font-black">{leaveShifts.length}</span>
          </div>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-nicora-border shadow-clean text-xs">
        <button
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="p-1.5 rounded-xl text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
          title="Settimana precedente"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center font-bold text-neutral-800">
          <span className="text-sm">
            Domenica {weekDays[0].dayNum} — Sabato {weekDays[6].dayNum}
          </span>
          <span className="block text-[11px] font-semibold text-nicora-orange">
            {weekOffset === 0 ? 'Settimana in Corso' : weekOffset === 1 ? 'Prossima Settimana' : `Offset: ${weekOffset} sett.`}
          </span>
        </div>

        <button
          onClick={() => setWeekOffset((prev) => prev + 1)}
          className="p-1.5 rounded-xl text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
          title="Settimana successiva"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 7 Days Schedule Cards */}
      <div className="space-y-2.5">
        {myWeekShifts.map(({ day, shift }) => {
          const isToday = day.isToday;
          const isOff = shift?.type === 'riposo' || shift?.type === 'ferie' || shift?.type === 'malattia';

          return (
            <div
              key={day.dateStr}
              className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all shadow-clean flex items-center justify-between ${
                isToday
                  ? 'border-nicora-orange ring-2 ring-nicora-orange/40 bg-nicora-orange-light/15'
                  : 'border-nicora-border'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Day Pill */}
                <div
                  className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 transition-colors ${
                    isToday
                      ? 'bg-nicora-orange text-white font-black shadow-xs'
                      : day.isWeekend
                      ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                      : 'bg-neutral-100 text-neutral-700 font-bold'
                  }`}
                >
                  <span className="text-[10px] uppercase leading-none">{day.dayShort}</span>
                  <span className="text-lg leading-none mt-1">{day.dayNum}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-nicora-title">
                      {day.dayName}
                    </span>
                    {isToday && (
                      <span className="text-[9px] bg-nicora-orange text-white font-black px-2 py-0.5 rounded-full uppercase">
                        Oggi
                      </span>
                    )}
                    {day.isMerchandiseArrival && (
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">
                        🚚 Arrivo Merci
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs">
                    {shift?.department && !isOff && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          shift.department === 'Cassa'
                            ? 'bg-rose-600 text-white'
                            : 'bg-nicora-teal-light text-nicora-teal border border-nicora-teal-border/50'
                        }`}
                      >
                        {shift.department}
                      </span>
                    )}
                    {shift?.areaNote && !isOff && (
                      <span className="text-neutral-500 truncate max-w-[200px]">
                        {shift.areaNote}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status / Hours */}
              <div className="text-right">
                {shift ? (
                  shift.type === 'riposo' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-xl">
                      <Coffee size={13} /> Riposo
                    </span>
                  ) : shift.type === 'ferie' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-xl">
                      🌴 Ferie
                    </span>
                  ) : shift.type === 'malattia' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl">
                      🏥 Malattia
                    </span>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-nicora-teal bg-neutral-100 px-2.5 py-1 rounded-xl">
                        <Clock size={12} className="text-nicora-orange" />
                        {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
                      </span>
                      <span className="block text-[10px] font-semibold text-neutral-400 mt-0.5 capitalize">
                        Turno {shift.type}
                      </span>
                    </div>
                  )
                ) : (
                  <span className="text-xs text-neutral-400 italic">Non pianificato</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
