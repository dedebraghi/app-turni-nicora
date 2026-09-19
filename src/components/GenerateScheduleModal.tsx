import React, { useState } from 'react';
import { Employee, LocationId, ScheduleMode, Shift, ShiftRequest } from '../types';
import { generateWeeklySchedule, getSundayOfWeek } from '../utils/scheduler';
import { X, Sparkles, CheckCircle2, Calendar, Clock, ShieldCheck } from 'lucide-react';

interface GenerateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: LocationId;
  employees: Employee[];
  requests: ShiftRequest[];
  onApplyShifts: (newShifts: Shift[]) => void;
}

export const GenerateScheduleModal: React.FC<GenerateScheduleModalProps> = ({
  isOpen,
  onClose,
  locationId,
  employees,
  requests,
  onApplyShifts,
}) => {
  const currentSunday = getSundayOfWeek(new Date());
  const nextSunday = new Date(currentSunday);
  nextSunday.setDate(currentSunday.getDate() + 7);

  const [selectedSundayStr, setSelectedSundayStr] = useState<string>(
    currentSunday.toISOString().split('T')[0]
  );
  const [mode, setMode] = useState<ScheduleMode>('standard');
  const [resultStats, setResultStats] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const result = generateWeeklySchedule({
      locationId,
      employees,
      weekStartDate: selectedSundayStr,
      requests,
      mode,
    });

    setResultStats(result.stats);
    onApplyShifts(result.shifts);
  };

  const storeStaff = employees.filter((e) => e.locationId === locationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-nicora-teal text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-nicora-orange flex items-center justify-center text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Generatore Bozza Automatica Turni
              </h3>
              <p className="text-xs text-nicora-teal-light/85 capitalize">
                Sede: {locationId} ({storeStaff.length} dipendenti)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* Selettore Settimana (Domenica -> Sabato) */}
          <div className="bg-neutral-50 p-3 rounded-xl border border-nicora-border space-y-2">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
              <Calendar size={14} className="text-nicora-teal" />
              <span>Settimana Lavorativa (Domenica $\rightarrow$ Sabato):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSundayStr(currentSunday.toISOString().split('T')[0]);
                  setResultStats(null);
                }}
                className={`p-2 rounded-lg border font-semibold text-center transition-all ${
                  selectedSundayStr === currentSunday.toISOString().split('T')[0]
                    ? 'bg-nicora-teal text-white border-nicora-teal shadow-xs'
                    : 'bg-white text-neutral-700 border-nicora-border'
                }`}
              >
                <div>Questa Settimana</div>
                <div className="text-[10px] opacity-80">Dom {currentSunday.getDate()} - Sab</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSundayStr(nextSunday.toISOString().split('T')[0]);
                  setResultStats(null);
                }}
                className={`p-2 rounded-lg border font-semibold text-center transition-all ${
                  selectedSundayStr === nextSunday.toISOString().split('T')[0]
                    ? 'bg-nicora-teal text-white border-nicora-teal shadow-xs'
                    : 'bg-white text-neutral-700 border-nicora-border'
                }`}
              >
                <div>Prossima Settimana</div>
                <div className="text-[10px] opacity-80">Dom {nextSunday.getDate()} - Sab</div>
              </button>
            </div>
          </div>

          {/* Modalità Orario (Standard vs Orario Continuato) */}
          <div className="space-y-2">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
              <Clock size={14} className="text-nicora-orange" />
              <span>Modalità Orario Stagionale:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('standard');
                  setResultStats(null);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  mode === 'standard'
                    ? 'bg-nicora-orange/10 border-nicora-orange text-neutral-900 ring-1 ring-nicora-orange/30'
                    : 'bg-white border-nicora-border text-neutral-600'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>Standard</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                  Mattina (08:30–12:30), Pomeriggio (14:30–19:30) o spezzato.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('continuato');
                  setResultStats(null);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  mode === 'continuato'
                    ? 'bg-nicora-orange/10 border-nicora-orange text-neutral-900 ring-1 ring-nicora-orange/30'
                    : 'bg-white border-nicora-border text-neutral-600'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1 text-nicora-orange">
                  <span>Continuato (Ott–Dic)</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                  Scaglioni 09:00, 10:00, 11:00 con pausa e chiusura alle 19:00.
                </p>
              </button>
            </div>
          </div>

          {/* Vincoli Applicati Automaticamente */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5 text-emerald-950">
            <span className="font-bold flex items-center gap-1 text-xs text-emerald-900">
              <ShieldCheck size={14} className="text-emerald-600" />
              Regole e Priorità di Nicora Garden Garantite:
            </span>
            <ul className="text-[11px] space-y-1 pl-1 text-emerald-800 list-disc list-inside">
              <li><strong>5 giorni lavorativi su 7</strong> per collaboratore (2 riposi garantiti).</li>
              <li><strong>Presenza Cassa 100%</strong> senza vuoti orari (priorità assoluta).</li>
              <li>Assegnazione reparti basata sulla <strong>Matrice delle Competenze (1-10)</strong>.</li>
              <li>Rinforzo merci su <strong>Giovedì e Venerdì</strong> (scarico serre).</li>
              <li>Presenza potenziata per il <strong>Weekend Garden (Sab/Dom)</strong>.</li>
              <li>Rispetto ferie/permessi già approvati dal responsabile.</li>
            </ul>
          </div>

          {/* Feedback post generazione */}
          {resultStats && (
            <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-3 text-emerald-900 space-y-1 animate-in fade-in">
              <div className="font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>Bozza Generata con Successo!</span>
              </div>
              <p className="text-[11px]">
                • Turni assegnati: <strong>{resultStats.totalShifts}</strong> su {resultStats.staffCount} collaboratori.
              </p>
              <p className="text-[11px]">
                • Copertura Cassa: <strong>{resultStats.cassaCoverageScore}%</strong> (costantemente presidiata).
              </p>
              <p className="text-[11px]">
                • Ciascun dipendente lavora esattamente <strong>5 giorni</strong> su 7.
              </p>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        <div className="bg-neutral-50 border-t border-nicora-border p-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-800"
          >
            {resultStats ? 'Fatto' : 'Annulla'}
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="bg-nicora-orange hover:bg-nicora-orange-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Sparkles size={14} />
            <span>{resultStats ? 'Rigenera di Nuovo' : 'Genera Bozza Turni'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
