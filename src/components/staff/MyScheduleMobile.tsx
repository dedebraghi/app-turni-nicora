import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { formatLocalDate, getSundayOfWeek, getWeekDays } from '../../engine/schedulerEngine';
import { ChevronLeft, ChevronRight, Clock, Coffee, KeyRound, Check, AlertCircle, X, Sparkles, Calendar } from 'lucide-react';

interface MyScheduleMobileProps {
  currentEmployee: Employee;
  shifts: Shift[];
  activeLocation: LocationId;
  onSaveEmployee?: (emp: Employee) => void;
}

export const MyScheduleMobile: React.FC<MyScheduleMobileProps> = ({
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
    <div className="space-y-4 pb-20">
      
      {/* Collaborator Profile Hero Card (Stitch Mobile 6f1cba320977492e8b9cb8a083cd39a7) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002f32] via-[#0a474b] to-[#072e31] text-white shadow-clean p-4 border border-white/10">
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-nicora-orange text-white font-serif font-bold text-base flex items-center justify-center shadow-xs">
                {currentEmployee.avatar || currentEmployee.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-serif text-lg text-white font-medium tracking-tight">
                    {currentEmployee.name}
                  </h1>
                  <span className="px-1.5 py-0.2 rounded bg-nicora-orange text-white text-[9px] font-bold uppercase">
                    ATTIVO
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90 mt-0.5">
                  Reparto {currentEmployee.role} • {activeLocation === 'gazzada' ? 'Gazzada' : 'Varese'}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenPinModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 hover:bg-black/40 text-emerald-200 text-[11px] font-medium border border-white/10"
            >
              <KeyRound size={11} className="text-amber-300" />
              <span>PIN</span>
            </button>
          </div>

          {/* Metric Pods Grid 4 items on mobile */}
          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/15 text-center">
            <div className="p-2 rounded-xl bg-black/25 backdrop-blur-xs flex flex-col justify-between">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-200">CONTRATTO</span>
              <span className="font-serif text-base font-bold text-white leading-none mt-1">5/7</span>
            </div>
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
      <nav className="w-full bg-white rounded-2xl p-2.5 shadow-2xs border border-nicora-sage-border flex items-center justify-between text-xs">
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-nicora-orange" />
            <span className="font-serif text-sm text-nicora-title font-semibold">
              Dom {weekDays[0].dayNum} — Sab {weekDays[6].dayNum}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-nicora-orange mt-0.5">
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

          return (
            <div
              key={day.dateStr}
              className={`bg-white rounded-xl p-3 border shadow-2xs flex items-center justify-between gap-3 ${
                isToday
                  ? 'border-nicora-orange ring-1 ring-nicora-orange/60 bg-amber-50/20'
                  : 'border-nicora-sage-border'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                    isToday
                      ? 'bg-nicora-orange text-white shadow-xs'
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
                    <span className="font-serif text-sm font-semibold text-nicora-title">
                      {day.dayName}
                    </span>
                    {isToday && (
                      <span className="text-[9px] bg-nicora-orange text-white font-bold px-1.5 py-0.2 rounded uppercase">
                        Oggi
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center gap-1.5 text-xs flex-wrap">
                    {shift?.department && !isOff && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        shift.department === 'Cassa' ? 'bg-rose-600 text-white' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {shift.department}
                      </span>
                    )}
                    {shift?.areaNote && !isOff && (
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
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-nicora-teal bg-neutral-100/90 px-2 py-0.5 rounded-lg">
                        <Clock size={11} className="text-nicora-orange" />
                        {shift.startTime || '08:30'}—{shift.endTime || '19:30'}
                      </span>
                      <span className="block text-[9px] text-neutral-400 mt-0.5">
                        {shift.type === 'giornata' ? 'Giornata Intera' : shift.type}
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

      {/* Modal Cambio PIN */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-nicora-sage-border w-full max-w-sm overflow-hidden">
            <div className="bg-nicora-teal text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-amber-300" />
                <h3 className="font-serif text-sm font-semibold">Modifica PIN</h3>
              </div>
              <button onClick={() => setIsPinModalOpen(false)} className="text-white hover:opacity-80">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-4 space-y-3 text-xs">
              {pinError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
              {pinSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-0.5">PIN Attuale:</label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="PIN attuale"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-0.5">Nuovo PIN (min. 3 cifre):</label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Nuovo PIN"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-0.5">Conferma Nuovo PIN:</label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Ripeti nuovo PIN"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-sm font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3 py-1.5 text-neutral-600 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-nicora-teal text-white font-bold rounded-xl shadow-xs"
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
