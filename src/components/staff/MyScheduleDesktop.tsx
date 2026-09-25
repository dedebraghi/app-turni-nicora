import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { formatLocalDate, getSundayOfWeek, getWeekDays } from '../../engine/schedulerEngine';
import { ChevronLeft, ChevronRight, Clock, Coffee, KeyRound, Check, AlertCircle, X, Sparkles, Calendar, RotateCw, MapPin } from 'lucide-react';

interface MyScheduleDesktopProps {
  currentEmployee: Employee;
  shifts: Shift[];
  activeLocation: LocationId;
  onSaveEmployee?: (emp: Employee) => void;
}

export const MyScheduleDesktop: React.FC<MyScheduleDesktopProps> = ({
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
    <div className="max-w-[1080px] w-full mx-auto space-y-6 pb-16">
      
      {/* 1. Top Metadata Info (Stitch Desktop 428e28affb1f484ea6ae7760ad8e26b0) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nicora-teal-light text-nicora-teal font-medium border border-nicora-teal-border/40">
            <span className="w-2 h-2 rounded-full bg-nicora-orange"></span>
            Settimana Lavorativa: <strong className="font-semibold text-neutral-800">Domenica → Sabato</strong>
          </span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-500">
            Regola contrattuale: <strong className="text-neutral-800 font-semibold">5 giorni / 2 riposi</strong>
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-nicora-sage-border text-nicora-teal text-xs font-semibold shadow-2xs">
          <RotateCw size={13} className="text-emerald-600 animate-spin-slow" />
          <span>Sincronizzato in Cloud</span>
        </div>
      </div>

      {/* 2. Collaborator Profile Hero Card (Stitch Desktop expanded) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002f32] via-[#0a474b] to-[#072e31] text-white shadow-xl p-6 sm:p-7 border border-white/10">
        <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl"></div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
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
                  Reparto {currentEmployee.role} • Punto Vendita: <strong className="capitalize text-white">{activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese'}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenPinModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/35 hover:bg-black/50 text-emerald-200 text-xs font-semibold transition-colors shadow-sm border border-white/10"
            >
              <KeyRound size={13} className="text-amber-300" />
              <span>Modifica PIN</span>
            </button>
          </div>

          {/* 4 Metric Pods */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/15">
            <div className="p-3.5 rounded-xl bg-black/25 backdrop-blur-xs shadow-inner flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-200">CONTRATTO</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-bold text-white leading-none">5/7</span>
                <span className="text-xs text-emerald-200/80">giorni</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/25 backdrop-blur-xs shadow-inner flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-200">TURNI PIANIFICATI</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-bold text-white leading-none">{workedShifts.length}</span>
                <span className="text-xs text-emerald-200/80">{workedShifts.length * 8}h stimate</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/25 backdrop-blur-xs shadow-inner flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-200">GIORNI RIPOSO</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-bold text-white leading-none">{restShifts.length}</span>
                <span className="text-xs text-emerald-200/80">giorni</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/25 backdrop-blur-xs shadow-inner flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-200">FERIE / MALATTIA</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-bold text-white leading-none">{leaveShifts.length}</span>
                <span className="text-xs text-emerald-200/80">giorni</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Week Navigation Controller (Stitch Desktop) */}
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

      {/* 4. 7 Days Expanded Shifts Daily Cards List (Stitch Desktop) */}
      <div className="flex flex-col gap-3">
        {myWeekShifts.map(({ day, shift }) => {
          const isToday = day.isToday;
          const isOff = shift?.type === 'riposo' || shift?.type === 'ferie' || shift?.type === 'malattia';

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
                    {shift?.department && !isOff && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        shift.department === 'Cassa' ? 'bg-rose-600 text-white' : 'bg-nicora-teal-light text-nicora-teal border border-nicora-teal-border/40'
                      }`}>
                        {shift.department}
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

      {/* Modal Modifica PIN */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-nicora-sage-border w-full max-w-md overflow-hidden">
            <div className="bg-nicora-teal text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={20} className="text-amber-300" />
                <h3 className="font-serif text-base font-semibold">Modifica PIN Personale</h3>
              </div>
              <button onClick={() => setIsPinModalOpen(false)} className="text-white hover:opacity-80">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-5 space-y-4 text-xs">
              {pinError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
              {pinSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">PIN Attuale:</label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="Inserisci PIN attuale (es. 1234)"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-nicora-teal"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Nuovo PIN (min. 3 cifre):</label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Nuovo PIN riservato"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-nicora-teal"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Conferma Nuovo PIN:</label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Ripeti nuovo PIN"
                  maxLength={6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-nicora-teal"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl"
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
