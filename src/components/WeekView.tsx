import React, { useState } from 'react';
import { Department, Employee, LocationId, Shift, ShiftType } from '../types';
import { Clock, Coffee, Sparkles, Truck, ShieldAlert, Zap, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSundayOfWeek, getWeekDays } from '../utils/scheduler';

interface WeekViewProps {
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  activeLocation: LocationId;
  onEditShift: (shift: Shift) => void;
  onOpenGenerateModal: () => void;
  onOpenSkillsModal: () => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentEmployeeId,
  employees,
  shifts,
  isManagerMode,
  activeLocation,
  onEditShift,
  onOpenGenerateModal,
  onOpenSkillsModal,
}) => {
  // Filtra dipendenti e turni per la sede attiva
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation);
  const storeShifts = shifts.filter((s) => s.locationId === activeLocation);

  // Navigazione settimana (Domenica -> Sabato)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const baseSunday = getSundayOfWeek(new Date());
  baseSunday.setDate(baseSunday.getDate() + weekOffset * 7);
  const baseSundayStr = baseSunday.toISOString().split('T')[0];

  const weekDays = getWeekDays(baseSundayStr).map((d) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [y, m, day] = d.dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, day);
    const dayNameShort = dateObj.toLocaleDateString('it-IT', { weekday: 'short' });

    return {
      ...d,
      dayNum: day,
      dayShort: dayNameShort.charAt(0).toUpperCase() + dayNameShort.slice(1, 3),
      isToday: d.dateStr === todayStr,
    };
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Se oggi ricade in questa settimana, seleziona oggi, altrimenti la Domenica
    const hasToday = weekDays.some((w) => w.dateStr === todayStr);
    return hasToday ? todayStr : weekDays[0].dateStr;
  });

  const activeDayShifts = storeShifts.filter((s) => s.date === selectedDate);
  const selectedDayMeta = weekDays.find((w) => w.dateStr === selectedDate) || weekDays[0];

  // Controllo presenza Cassa nel giorno selezionato
  const cassaShifts = activeDayShifts.filter(
    (s) => (s.department === 'Cassa' || s.areaNote?.includes('Cassa')) && s.type !== 'riposo' && s.type !== 'ferie'
  );
  const isCassaCovered = cassaShifts.length > 0;

  const getShiftBadge = (type: ShiftType, startTime?: string, endTime?: string) => {
    switch (type) {
      case 'mattina':
        return (
          <span className="bg-nicora-teal-light text-nicora-teal border border-nicora-teal-border text-[10px] font-bold px-2 py-0.5 rounded">
            {startTime || '08:30'} - {endTime || '12:30'}
          </span>
        );
      case 'pomeriggio':
        return (
          <span className="bg-nicora-orange-light text-nicora-orange border border-nicora-orange-border text-[10px] font-bold px-2 py-0.5 rounded">
            {startTime || '14:30'} - {endTime || '19:30'}
          </span>
        );
      case 'giornata':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
            {startTime || '08:30'} - {endTime || '19:30'}
          </span>
        );
      case 'riposo':
        return (
          <span className="bg-neutral-100 text-neutral-500 text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
            <Coffee size={10} /> Riposo
          </span>
        );
      case 'ferie':
        return (
          <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded">
            🌴 Ferie
          </span>
        );
    }
  };

  const getDepartmentTag = (dept?: Department) => {
    switch (dept) {
      case 'Cassa':
        return <span className="bg-red-100 text-red-800 border border-red-200 text-[9px] font-extrabold px-1.5 py-0.2 rounded">CASSA</span>;
      case 'Fioreria':
        return <span className="bg-pink-100 text-pink-800 border border-pink-200 text-[9px] font-bold px-1.5 py-0.2 rounded">FIORERIA</span>;
      case 'Decor':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[9px] font-bold px-1.5 py-0.2 rounded">DECOR</span>;
      case 'Serra Calda':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded">S. CALDA</span>;
      case 'Serra Fredda':
        return <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[9px] font-bold px-1.5 py-0.2 rounded">S. FREDDA</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3.5 pb-24">
      
      {/* Barra Azioni Manager: Generatore Bozza & Matrice */}
      {isManagerMode && (
        <div className="bg-white rounded-xl p-2.5 border border-nicora-border shadow-clean flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-neutral-700">Pianificazione Turni:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSkillsModal}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all"
            >
              <Award size={13} className="text-amber-500" />
              <span>Competenze</span>
            </button>

            <button
              onClick={onOpenGenerateModal}
              className="bg-nicora-orange hover:bg-nicora-orange-hover text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Zap size={13} />
              <span>Genera Bozza</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigatore Settimana (Domenica -> Sabato) */}
      <div className="flex items-center justify-between bg-white rounded-xl p-2 border border-nicora-border shadow-clean text-xs">
        <button
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="p-1 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 active:scale-95"
          title="Settimana precedente"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center font-bold text-neutral-800">
          <span>Settimana Dom {weekDays[0].dayNum} — Sab {weekDays[6].dayNum}</span>
          <span className="block text-[10px] font-medium text-neutral-400">
            {weekOffset === 0 ? 'Settimana Corrente' : weekOffset === 1 ? 'Prossima Settimana' : `Offset: ${weekOffset} sett.`}
          </span>
        </div>

        <button
          onClick={() => setWeekOffset((prev) => prev + 1)}
          className="p-1 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 active:scale-95"
          title="Settimana successiva"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Banner dinamico in base al giorno selezionato */}
      {selectedDayMeta.isWeekend ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
          <Sparkles size={16} className="text-nicora-orange flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-snug">
            <strong>Weekend Garden:</strong> Giornata di massimo afflusso vivaio e vendite. Presenza potenziata su casse e reparti.
          </p>
        </div>
      ) : selectedDayMeta.isMerchandiseArrival ? (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5 flex items-start gap-2">
          <Truck size={16} className="text-sky-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-sky-900 leading-snug">
            <strong>Arrivo Merci Vivaio ({selectedDayMeta.dayName}):</strong> Scarico fornitori, sistemazione serre e assortimento piante.
          </p>
        </div>
      ) : null}

      {/* Selettore Giorno Orizzontale a Pillola (Domenica -> Sabato, 7 giorni) */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 px-0.5 -mx-1 scrollbar-none">
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex-1 min-w-[44px] flex flex-col items-center py-2 px-1 rounded-xl transition-all touch-manipulation relative ${
                isSelected
                  ? 'bg-nicora-orange text-white shadow-sm ring-2 ring-nicora-orange-border scale-105'
                  : day.isWeekend
                  ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300/60 hover:bg-amber-100'
                  : day.isMerchandiseArrival
                  ? 'bg-sky-50 text-sky-900 font-bold border border-sky-300/60 hover:bg-sky-100'
                  : 'bg-white text-neutral-600 border border-nicora-border hover:bg-neutral-50'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-white/90' : 'text-neutral-500'}`}>
                {day.dayShort}
              </span>
              <span className={`text-base font-extrabold leading-none my-1 ${isSelected ? 'text-white' : ''}`}>
                {day.dayNum}
              </span>
              
              {/* Dot indicatore oggi o badge merci */}
              {day.isToday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-nicora-orange" />
              )}
              {day.isMerchandiseArrival && !isSelected && !day.isToday && (
                <span className="text-[9px] text-sky-600 font-extrabold leading-none">🚚</span>
              )}
              {day.isWeekend && !isSelected && !day.isToday && (
                <span className="text-[9px] text-amber-600 font-extrabold leading-none">★</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header Giorno Selezionato con check Cassa */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Clock size={15} className="text-nicora-teal" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-title">
            Programma {selectedDayMeta.dayName} {selectedDayMeta.dayNum}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge Cassa Coperta / Allarme */}
          {isCassaCovered ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              ✓ Cassa OK ({cassaShifts.length})
            </span>
          ) : (
            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <ShieldAlert size={11} /> Cassa Scoperta!
            </span>
          )}

          <span className="text-xs font-bold text-nicora-orange">
            {activeDayShifts.filter((s) => s.type !== 'riposo' && s.type !== 'ferie').length} Presenti
          </span>
        </div>
      </div>

      {/* Griglia / Lista Collaboratori della sede */}
      <div className="space-y-2">
        {storeEmployees.map((emp) => {
          const shift = activeDayShifts.find((s) => s.employeeId === emp.id);
          const isMe = emp.id === currentEmployeeId;

          return (
            <div
              key={emp.id}
              onClick={() => shift && isManagerMode && onEditShift(shift)}
              className={`bg-white rounded-xl p-3 border transition-all shadow-clean flex items-center justify-between ${
                isMe
                  ? 'border-nicora-orange ring-1 ring-nicora-orange/60 bg-nicora-orange-light/10'
                  : 'border-nicora-border'
              } ${isManagerMode && shift ? 'cursor-pointer hover:border-nicora-teal' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isMe
                      ? 'bg-nicora-orange text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {emp.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-nicora-title">{emp.name}</span>
                    {isMe && (
                      <span className="text-[8px] bg-nicora-orange text-white font-extrabold px-1 rounded-full uppercase">
                        Tu
                      </span>
                    )}
                    {emp.isManager && (
                      <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                        Resp
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-nicora-muted">{emp.role}</span>
                    {shift?.department && shift.type !== 'riposo' && shift.type !== 'ferie' && (
                      <>
                        <span className="text-neutral-300">•</span>
                        {getDepartmentTag(shift.department)}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {shift ? (
                  <div className="flex flex-col items-end gap-1">
                    {getShiftBadge(shift.type, shift.startTime, shift.endTime)}
                    {shift.areaNote && shift.type !== 'riposo' && shift.type !== 'ferie' && (
                      <span className="text-[9px] text-neutral-400 truncate max-w-[130px]" title={shift.areaNote}>
                        {shift.areaNote}
                      </span>
                    )}
                  </div>
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
