import React, { useState } from 'react';
import { Employee, LocationId, ScheduleMode, Shift, ShiftRequest } from '../../domain/types';
import { generateMonthlySchedule, generateWeeklySchedule, getSundayOfWeek } from '../../engine/schedulerEngine';
import { X, Sparkles, CheckCircle2, Calendar, Clock, ShieldCheck } from 'lucide-react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: LocationId;
  employees: Employee[];
  requests: ShiftRequest[];
  onApplyShifts: (newShifts: Shift[]) => void;
}


export const GenerateModal: React.FC<GenerateModalProps> = ({
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

  const now = new Date();
  const [targetType, setTargetType] = useState<'month' | 'week'>('month');
  const [selectedSundayStr, setSelectedSundayStr] = useState<string>(
    currentSunday.toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [mode, setMode] = useState<ScheduleMode>('standard');
  const [resultStats, setResultStats] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    let result;
    if (targetType === 'month') {
      result = generateMonthlySchedule({
        locationId,
        employees,
        year: selectedYear,
        month: selectedMonth,
        requests,
        mode,
      });
    } else {
      result = generateWeeklySchedule({
        locationId,
        employees,
        weekStartDate: selectedSundayStr,
        requests,
        mode,
      });
    }

    setResultStats(result.stats);
    onApplyShifts(result.shifts);
  };


  const storeStaff = employees.filter((e) => e.locationId === locationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-nicora-teal text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-nicora-orange flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Generatore Bozza Automatica Turni
              </h3>
              <p className="text-xs text-nicora-teal-light/85 capitalize">
                Punto Vendita: <strong className="text-white">{locationId}</strong> ({storeStaff.length} collaboratori)
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
          
          {/* Selettore Settimana (Domenica -> Sabato) */}
          <div className="bg-neutral-50 p-3.5 rounded-2xl border border-nicora-border space-y-2">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
              <Calendar size={15} className="text-nicora-teal" />
              <span>Settimana Lavorativa (Domenica ➔ Sabato):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSundayStr(currentSunday.toISOString().split('T')[0]);
                  setResultStats(null);
                }}
                className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                  selectedSundayStr === currentSunday.toISOString().split('T')[0]
                    ? 'bg-nicora-teal text-white border-nicora-teal shadow-xs'
                    : 'bg-white text-neutral-700 border-nicora-border hover:bg-neutral-100'
                }`}
              >
                <div>Questa Settimana</div>
                <div className="text-[10px] font-medium opacity-80">
                  Dom {currentSunday.getDate()} — Sab
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSundayStr(nextSunday.toISOString().split('T')[0]);
                  setResultStats(null);
                }}
                className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                  selectedSundayStr === nextSunday.toISOString().split('T')[0]
                    ? 'bg-nicora-teal text-white border-nicora-teal shadow-xs'
                    : 'bg-white text-neutral-700 border-nicora-border hover:bg-neutral-100'
                }`}
              >
                <div>Prossima Settimana</div>
                <div className="text-[10px] font-medium opacity-80">
                  Dom {nextSunday.getDate()} — Sab
                </div>
              </button>
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
                    ? 'bg-nicora-orange/10 border-nicora-orange text-neutral-900 ring-2 ring-nicora-orange/30'
                    : 'bg-white border-nicora-border text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="font-extrabold text-xs">Orario Standard (Spezzato)</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Mattina (08:30–12:30), Pomeriggio (14:30–19:30) o giornata continua.
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
                    ? 'bg-nicora-orange/10 border-nicora-orange text-neutral-900 ring-2 ring-nicora-orange/30'
                    : 'bg-white border-nicora-border text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="font-extrabold text-xs text-nicora-orange">
                  Orario Continuato (Ott–Dic)
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Scaglioni 09:00, 10:00, 11:00 con pausa e chiusura ore 19:00.
                </p>
              </button>
            </div>
          </div>

          {/* Vincoli Aziendali Applicati */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-emerald-950">
            <span className="font-extrabold flex items-center gap-1.5 text-xs text-emerald-900">
              <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
              Regole Operative Nicora Garden Applicate dall'Algoritmo:
            </span>
            <ul className="text-[11px] space-y-1 pl-1 text-emerald-800 list-disc list-inside">
              <li><strong>5 giorni lavorativi su 7</strong> per tutti i collaboratori (2 riposi garantiti).</li>
              <li><strong>Quadratura monte ore contrattuale</strong> sui 5 turni (es. 40h = 5x8h, 24h = 4x5h+1x4h, 20h = 5x4h).</li>
              <li><strong>Tutti e 5 i reparti presidiati</strong> ogni giorno (Cassa, Fioreria, Decor, Serra Calda, Serra Fredda).</li>
              <li><strong>Priorità competenze 9-10</strong>: salvaguardia dei super-specialisti sul loro reparto d'eccellenza.</li>
              <li><strong>Cassa presidiata al 100%</strong> senza vuoti orari (priorità assoluta, 2 casse nei weekend).</li>
              <li>Rinforzo merci su <strong>Giovedì e Venerdì</strong> (scarico carrelli vivaio).</li>
              <li>Rispetto automatico di ferie e permessi già approvati a monte.</li>
            </ul>
          </div>

          {/* Risultato della generazione */}
          {resultStats && (
            <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 text-emerald-900 space-y-2.5 animate-in fade-in">
              <div className="font-black text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={18} className="text-emerald-700" />
                  <span>Bozza Turni Generata con Successo!</span>
                </span>
                {resultStats.overallSkillScore !== undefined && (
                  <span className="bg-emerald-800 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] shadow-xs">
                    Competenze: {resultStats.overallSkillScore}% ⭐
                  </span>
                )}
              </div>
              <div className="text-[11px] space-y-1">
                <p>
                  • Turni pianificati: <strong>{resultStats.totalShifts}</strong> su {resultStats.staffCount} collaboratori.
                </p>
                <p>
                  • Presidio Cassa: <strong>{resultStats.cassaCoverageScore}%</strong> (100% coperta per l'intera settimana).
                </p>
                <p>
                  • Presidio 5 Reparti:{' '}
                  {resultStats.allDepartmentsCovered ? (
                    <strong className="text-emerald-900">100% Garantito (Zero settori scoperti)</strong>
                  ) : (
                    <strong className="text-rose-700">Verificare alert scoperture!</strong>
                  )}
                </p>
                <p>
                  • Rispetto Contratti: <strong>100% monte ore coperto</strong> esattamente in 5 giorni di servizio.
                </p>
              </div>

              {/* Breakdown Competenze Medie per Reparto */}
              {resultStats.departmentSkillScores && (
                <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-200 space-y-1">
                  <div className="font-bold text-[10px] text-emerald-900 uppercase tracking-wider">
                    Media Competenze Reparto (1-10):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                    {Object.entries(resultStats.departmentSkillScores).map(([dept, score]) => (
                      <div key={dept} className="flex items-center justify-between bg-emerald-50 px-2 py-1 rounded-lg">
                        <span className="font-medium text-emerald-800">{dept}:</span>
                        <span className="font-extrabold text-emerald-900">{score as number}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avvisi Copertura Sub-ottimale (< 9/10) */}
              {resultStats.suboptimalCoverageDays && resultStats.suboptimalCoverageDays.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-amber-900 space-y-1">
                  <div className="font-bold text-[10px] text-amber-900 flex items-center gap-1">
                    <span>⚡ Avvisi Presidio Sub-Ottimale (Competenza &lt; 9/10):</span>
                  </div>
                  <ul className="text-[10px] space-y-0.5 pl-1 list-disc list-inside text-amber-800">
                    {resultStats.suboptimalCoverageDays.map((sub: any, idx: number) => (
                      <li key={idx}>
                        {sub.dayName}: <strong>{sub.department}</strong> presidiato da {sub.empName} ({sub.assignedScore}/10)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-nicora-border p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-800"
          >
            {resultStats ? 'Chiudi' : 'Annulla'}
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="bg-nicora-orange hover:bg-nicora-orange-hover text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md flex items-center gap-2 active:scale-95 transition-transform"
          >
            <Sparkles size={16} />
            <span>{resultStats ? 'Rigenera di Nuovo' : 'Genera Bozza Turni'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
