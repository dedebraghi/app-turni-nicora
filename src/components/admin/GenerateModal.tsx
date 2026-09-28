import React, { useState } from 'react';
import { Employee, LocationId, ScheduleMode, Shift, ShiftRequest } from '../../domain/types';
import { generateMonthlySchedule } from '../../engine/schedulerEngine';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: LocationId;
  employees: Employee[];
  requests: ShiftRequest[];
  existingShifts?: Shift[];
  onApplyShifts: (newShifts: Shift[]) => void;
}

const MONTH_NAMES = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

export const GenerateModal: React.FC<GenerateModalProps> = ({
  isOpen,
  onClose,
  locationId,
  employees,
  requests,
  existingShifts = [],
  onApplyShifts,
}) => {
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1; // 1 - 12
  const currentYearNum = now.getFullYear();

  const nextMonthNum = currentMonthNum === 12 ? 1 : currentMonthNum + 1;
  const nextYearNum = currentMonthNum === 12 ? currentYearNum + 1 : currentYearNum;

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);
  const [mode, setMode] = useState<ScheduleMode>('standard');
  const [resultStats, setResultStats] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const result = generateMonthlySchedule({
      locationId,
      employees,
      year: selectedYear,
      month: selectedMonth,
      requests,
      existingShifts,
      mode,
    });

    setResultStats(result.stats);
    onApplyShifts(result.shifts);
  };

  const storeStaff = employees.filter((e) => e.locationId === locationId && e.isActive !== false);
  const selectedMonthName = MONTH_NAMES[selectedMonth - 1];

  // Generazione opzioni tendina (anno corrente e successivo)
  const dropdownOptions: { month: number; year: number; label: string }[] = [];
  [currentYearNum, currentYearNum + 1].forEach((yr) => {
    MONTH_NAMES.forEach((mName, idx) => {
      const mNum = idx + 1;
      // Includi mesi dal mese corrente in poi per l'anno attuale, e tutti per l'anno prossimo
      if (yr > currentYearNum || mNum >= currentMonthNum) {
        dropdownOptions.push({
          month: mNum,
          year: yr,
          label: `${mName} ${yr}`,
        });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-nicora-teal text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-nicora-orange flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg leading-tight">
                Pianificazione Mensile Turni
              </h3>
              <p className="text-xs text-nicora-teal-light/85 capitalize mt-0.5">
                Punto Vendita: <strong className="text-white">{locationId === 'gazzada' ? 'Gazzada Schianno' : 'Varese'}</strong> ({storeStaff.length} collaboratori)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Selettore Mese (Ispirato a decisione /grill-me: Pulsanti rapidi + tendina) */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-nicora-sage-border space-y-3">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
              <Calendar size={15} className="text-nicora-orange" />
              <span>Seleziona il Mese da Pianificare:</span>
            </label>

            {/* Pulsanti Rapidi Mese Corrente & Prossimo Mese */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(currentMonthNum);
                  setSelectedYear(currentYearNum);
                  setResultStats(null);
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedMonth === currentMonthNum && selectedYear === currentYearNum
                    ? 'bg-nicora-teal-dark text-white border-nicora-teal-dark shadow-sm'
                    : 'bg-white text-neutral-700 border-nicora-sage-border hover:bg-neutral-100'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Mese Corrente</div>
                <div className="font-serif font-bold text-sm mt-0.5">
                  {MONTH_NAMES[currentMonthNum - 1]} {currentYearNum}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(nextMonthNum);
                  setSelectedYear(nextYearNum);
                  setResultStats(null);
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedMonth === nextMonthNum && selectedYear === nextYearNum
                    ? 'bg-nicora-teal-dark text-white border-nicora-teal-dark shadow-sm'
                    : 'bg-white text-neutral-700 border-nicora-sage-border hover:bg-neutral-100'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Prossimo Mese</div>
                <div className="font-serif font-bold text-sm mt-0.5">
                  {MONTH_NAMES[nextMonthNum - 1]} {nextYearNum}
                </div>
              </button>
            </div>

            {/* Tendina Mese Altro */}
            <div className="pt-1 flex items-center justify-between gap-2 border-t border-neutral-200">
              <span className="text-[11px] font-semibold text-neutral-600">Oppure scegli un altro mese:</span>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [yr, m] = e.target.value.split('-').map(Number);
                  setSelectedYear(yr);
                  setSelectedMonth(m);
                  setResultStats(null);
                }}
                className="bg-white border border-nicora-sage-border rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs cursor-pointer focus:ring-2 focus:ring-nicora-teal focus:outline-none"
              >
                {dropdownOptions.map((opt) => (
                  <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modalità Orario (Standard vs Continuato) */}
          <div className="space-y-2">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
              <Clock size={15} className="text-nicora-orange" />
              <span>Modalità Orario di Servizio:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('standard');
                  setResultStats(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === 'standard'
                    ? 'bg-nicora-orange-light border-nicora-orange text-neutral-900 ring-2 ring-nicora-orange/20 shadow-xs'
                    : 'bg-white border-nicora-sage-border text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="font-bold text-xs text-nicora-title">Orario Standard (Spezzato)</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Mattina (08:30–12:30), Pomeriggio (14:30–19:30) o giornata intera.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('continuato');
                  setResultStats(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === 'continuato'
                    ? 'bg-nicora-orange-light border-nicora-orange text-neutral-900 ring-2 ring-nicora-orange/20 shadow-xs'
                    : 'bg-white border-nicora-sage-border text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="font-bold text-xs text-nicora-orange">
                  Orario Continuato (Ott–Dic)
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Scaglioni 09:00, 10:00, 11:00 con pausa e chiusura ore 19:00.
                </p>
              </button>
            </div>
          </div>

          {/* Vincoli e Regole Nicora Applicate */}
          <div className="bg-[#e6f0eb]/70 border border-[#80b4b9]/50 rounded-2xl p-3.5 space-y-1.5 text-neutral-800">
            <span className="font-bold flex items-center gap-1.5 text-xs text-nicora-teal">
              <ShieldCheck size={16} className="text-emerald-700 flex-shrink-0" />
              <span>Regole Operative Nicora Applicate alla Generazione:</span>
            </span>
            <ul className="text-[11px] space-y-1 pl-1 text-neutral-700 list-disc list-inside">
              <li><strong>Pianifica l'intero mese in una sola botta</strong> (tutte le settimane Domenica ➔ Sabato).</li>
              <li><strong>Preserva i turni già esistenti</strong>: se la prima settimana era già stata pianificata dal mese precedente o ritoccata a mano, non viene sovrascritta.</li>
              <li><strong>Recepisce ferie e malattie già approvate</strong>: chi è in permesso non viene assegnato ai reparti.</li>
              <li><strong>Recepisce entrate posticipate e uscite anticipate</strong> approvate con orario personalizzato.</li>
              <li><strong>5 giorni lavorativi su 7</strong> per ciascun collaboratore (2 riposi settimanali garantiti).</li>
              <li><strong>Priorità di presidio a tutti i 5 reparti</strong> (Cassa, Fioreria, Decor, Serra Calda, Serra Fredda).</li>
            </ul>
          </div>

          {/* Risultato della generazione */}
          {resultStats && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-2.5 animate-in fade-in">
              <div className="font-bold text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Bozza di {selectedMonthName} {selectedYear} Generata!</span>
                </span>
                <span className="bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-xs">
                  {resultStats.totalShifts} Turni
                </span>
              </div>

              <div className="text-[11px] space-y-1 text-emerald-900">
                <p>
                  • Turni totali pianificati per il mese: <strong>{resultStats.totalShifts}</strong>.
                </p>
                <p>
                  • Presidio Cassa medio: <strong>{resultStats.cassaCoverageScore}%</strong>.
                </p>
                <p>
                  • Stato Copertura Reparti:{' '}
                  {resultStats.allDepartmentsCovered ? (
                    <strong className="text-emerald-800">✅ 100% Tutti i reparti presidiati per l'intero mese.</strong>
                  ) : (
                    <span className="text-rose-800 font-bold flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={14} className="text-rose-600 flex-shrink-0" />
                      <span>Rilevati {resultStats.uncoveredDays.length} giorni con presidi incompleti (il banner 'Criticità' ti guiderà nella ricerca sostituti).</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-nicora-sage-border p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-800"
          >
            {resultStats ? 'Chiudi' : 'Annulla'}
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="bg-nicora-orange hover:bg-nicora-orange-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 transition-transform"
          >
            <Sparkles size={16} />
            <span>{resultStats ? 'Rigenera Mese' : `Genera Bozza ${selectedMonthName} ${selectedYear}`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
