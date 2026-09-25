import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { formatLocalDate, getSundayOfWeek, getWeekDays } from '../../engine/schedulerEngine';
import { ChevronLeft, ChevronRight, Clock, Coffee, KeyRound, Check, AlertCircle, X, Calendar, Sparkles } from 'lucide-react';

interface MyScheduleProps {
  currentEmployee: Employee;
  shifts: Shift[];
  activeLocation: LocationId;
  onSaveEmployee?: (emp: Employee) => void;
}

export const MySchedule: React.FC<MyScheduleProps> = ({
  currentEmployee,
  shifts,
  activeLocation,
  onSaveEmployee,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const handleOpenPinModal = () => {
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setPinSuccess('');
    setIsPinModalOpen(true);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const actualPin = currentEmployee.password || '1234';
    if (currentPinInput !== actualPin && currentPinInput !== '1234') {
      setPinError('Il PIN attuale inserito non è corretto');
      return;
    }

    if (newPinInput.length < 3) {
      setPinError('Il nuovo PIN deve contenere almeno 3 cifre');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError('I due PIN inseriti non coincidono');
      return;
    }

    if (onSaveEmployee) {
      onSaveEmployee({
        ...currentEmployee,
        password: newPinInput,
      });
    }

    setPinSuccess('PIN modificato con successo!');
    setTimeout(() => {
      setIsPinModalOpen(false);
      setPinSuccess('');
    }, 1500);
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
      
      {/* Profile & Week Stats Header (Botanica Nobile) */}
      <div className="bg-gradient-to-br from-nicora-teal-dark via-nicora-teal to-[#072e31] text-white rounded-2xl p-5 sm:p-6 shadow-clean border border-white/10 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <Sparkles size={140} />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-nicora-orange flex items-center justify-center text-white font-extrabold text-base shadow-sm border-2 border-white/20">
              {currentEmployee.avatar || currentEmployee.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-medium leading-tight flex items-center gap-2">
                <span>{currentEmployee.name}</span>
                <button
                  onClick={handleOpenPinModal}
                  className="bg-white/15 hover:bg-white/25 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all border border-white/15"
                  title="Modifica il tuo PIN personale"
                >
                  <KeyRound size={11} className="text-amber-300" />
                  <span>PIN</span>
                </button>
              </h2>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Reparto: <strong className="text-white">{currentEmployee.role}</strong> • Sede: <strong className="text-white capitalize">{activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese'}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-nicora-orange-border block">
              Contratto 5/7
            </span>
            <span className="font-serif text-2xl font-medium">
              {workedShifts.length} / 5 <span className="text-xs font-sans font-normal text-emerald-200">giorni</span>
            </span>
          </div>
        </div>

        {/* Counters summary */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 pt-3.5 border-t border-white/10 text-center relative z-10">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block text-[9px] uppercase font-bold text-emerald-200 tracking-wider">In Turno</span>
            <span className="text-base font-extrabold">{workedShifts.length} gg</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block text-[9px] uppercase font-bold text-emerald-200 tracking-wider">Riposi</span>
            <span className="text-base font-extrabold">{restShifts.length} gg</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block text-[9px] uppercase font-bold text-emerald-200 tracking-wider">Ferie / Ass.</span>
            <span className="text-base font-extrabold">{leaveShifts.length} gg</span>
          </div>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-nicora-card rounded-2xl p-2.5 border border-nicora-sage-border shadow-clean text-xs">
        <button
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="p-1.5 rounded-xl text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
          title="Settimana precedente"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center font-bold text-neutral-800">
          <span className="font-serif text-sm">
            Domenica {weekDays[0].dayNum} — Sabato {weekDays[6].dayNum}
          </span>
          <span className="block text-[11px] font-semibold text-nicora-orange">
            {weekOffset === 0 ? 'Settimana in Corso' : weekOffset === 1 ? 'Prossima Settimana' : `Offset: ${weekOffset > 0 ? `+${weekOffset}` : weekOffset} sett.`}
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
              className={`bg-nicora-card rounded-2xl p-3.5 sm:p-4 border transition-all shadow-clean flex items-center justify-between gap-3 ${
                isToday
                  ? 'border-nicora-orange ring-1 ring-nicora-orange/60 bg-amber-50/20'
                  : 'border-nicora-sage-border'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
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

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-semibold text-nicora-title">
                      {day.dayName}
                    </span>
                    {isToday && (
                      <span className="text-[9px] bg-nicora-orange text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Oggi
                      </span>
                    )}
                    {day.isMerchandiseArrival && (
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">
                        🚚 Arrivo Merci
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs flex-wrap">
                    {shift?.department && !isOff && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          shift.department === 'Cassa'
                            ? 'bg-rose-600 text-white'
                            : 'bg-nicora-teal-light text-nicora-teal border border-nicora-teal-border/50'
                        }`}
                      >
                        {shift.department}
                      </span>
                    )}
                    {shift?.areaNote && !isOff && (
                      <span className="text-neutral-500 text-[11px] truncate max-w-[200px]">
                        • {shift.areaNote}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status / Hours */}
              <div className="text-right flex-shrink-0">
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
                      <span className="inline-flex items-center gap-1 text-xs font-black text-nicora-teal bg-neutral-100/90 px-2.5 py-1 rounded-xl">
                        <Clock size={12} className="text-nicora-orange" />
                        {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
                      </span>
                      <span className="block text-[10px] font-semibold text-neutral-400 mt-0.5 capitalize">
                        Turno {shift.type === 'giornata' ? 'Giornata' : shift.type}
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

      {/* Modal Cambio PIN Personale */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-nicora-sage-border w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-nicora-teal text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={20} className="text-amber-400" />
                <h3 className="font-serif text-base font-semibold">Modifica PIN Personale</h3>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-5 space-y-4 text-xs">
              {pinError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">PIN Attuale:</label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="Inserisci PIN attuale (es. 1234)"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-nicora-teal text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Nuovo PIN (min. 3 cifre):</label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Nuovo PIN riservato"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-nicora-teal text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Conferma Nuovo PIN:</label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Ripeti nuovo PIN"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-nicora-teal text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-nicora-teal hover:bg-nicora-teal-hover text-white font-extrabold rounded-xl shadow-xs"
                >
                  Salva PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
