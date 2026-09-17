import React, { useState } from 'react';
import { Employee, Shift, ShiftType } from '../types';
import { Clock, Coffee, Sparkles, AlertCircle } from 'lucide-react';

interface WeekViewProps {
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  onEditShift: (shift: Shift) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentEmployeeId,
  employees,
  shifts,
  isManagerMode,
  onEditShift,
}) => {
  // Calcolo 7 giorni della settimana corrente partendo da Lunedì
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('it-IT', { weekday: 'short' });
    const dayNum = d.getDate();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isToday = dateStr === today.toISOString().split('T')[0];

    return {
      dateStr,
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
      dayNum,
      isWeekend,
      isToday,
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().split('T')[0]
  );

  const activeDayShifts = shifts.filter((s) => s.date === selectedDate);
  const selectedDayMeta = weekDays.find((w) => w.dateStr === selectedDate);

  const getShiftBadge = (type: ShiftType) => {
    switch (type) {
      case 'mattina':
        return <span className="bg-nicora-teal-light text-nicora-teal border border-nicora-teal-border text-[10px] font-bold px-2 py-0.5 rounded">08:30 - 12:30</span>;
      case 'pomeriggio':
        return <span className="bg-nicora-orange-light text-nicora-orange border border-nicora-orange-border text-[10px] font-bold px-2 py-0.5 rounded">14:30 - 19:30</span>;
      case 'giornata':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">08:30 - 19:30</span>;
      case 'riposo':
        return <span className="bg-neutral-100 text-neutral-500 text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1"><Coffee size={10} /> Riposo</span>;
      case 'ferie':
        return <span className="bg-purple-100 text-purple-700 text-[10px] font-medium px-2 py-0.5 rounded">🌴 Ferie</span>;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Weekend Highlight Info */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2">
        <Sparkles size={16} className="text-nicora-orange flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-snug">
          <strong>Sabato e Domenica:</strong> Giornate di massimo afflusso vivaio. Presenza potenziata su casse e serre.
        </p>
      </div>

      {/* Selettore Giorno Orizzontale a Pillola */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 px-0.5 -mx-1 scrollbar-none">
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex-1 min-w-[46px] flex flex-col items-center py-2 px-1 rounded-lg transition-all touch-manipulation relative ${
                isSelected
                  ? 'bg-nicora-orange text-white shadow-sm ring-2 ring-nicora-orange-border scale-105'
                  : day.isWeekend
                  ? 'bg-white text-nicora-teal font-bold border border-nicora-teal/30 hover:bg-neutral-50'
                  : 'bg-white text-neutral-600 border border-nicora-border hover:bg-neutral-50'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-white/90' : 'text-neutral-500'}`}>
                {day.dayName}
              </span>
              <span className={`text-base font-extrabold leading-none my-1 ${isSelected ? 'text-white' : ''}`}>
                {day.dayNum}
              </span>
              
              {/* Indicatori giorno caldo o oggi */}
              {day.isToday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-nicora-orange" />
              )}
              {day.isWeekend && !isSelected && !day.isToday && (
                <span className="text-[9px] text-amber-600 font-extrabold leading-none">★</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Titolo Giorno Selezionato */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Clock size={15} className="text-nicora-teal" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-title">
            Programma {selectedDayMeta?.dayName} {selectedDayMeta?.dayNum}
            {selectedDayMeta?.isWeekend && ' (Weekend Garden)'}
          </h3>
        </div>
        <span className="text-xs font-bold text-nicora-orange">
          {activeDayShifts.filter((s) => s.type !== 'riposo' && s.type !== 'ferie').length} Presenti
        </span>
      </div>

      {/* Griglia / Lista Collaboratori per il giorno */}
      <div className="space-y-2">
        {employees.map((emp) => {
          const shift = activeDayShifts.find((s) => s.employeeId === emp.id);
          const isMe = emp.id === currentEmployeeId;

          return (
            <div
              key={emp.id}
              onClick={() => shift && isManagerMode && onEditShift(shift)}
              className={`bg-white rounded-lg p-3 border transition-all shadow-clean flex items-center justify-between ${
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
                  </div>
                  <p className="text-[10px] text-nicora-muted">{emp.role}</p>
                </div>
              </div>

              <div>
                {shift ? (
                  <div className="flex flex-col items-end gap-0.5">
                    {getShiftBadge(shift.type)}
                    {shift.areaNote && shift.type !== 'riposo' && (
                      <span className="text-[9px] text-neutral-400 truncate max-w-[130px]">
                        {shift.areaNote}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">Non assegnato</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
