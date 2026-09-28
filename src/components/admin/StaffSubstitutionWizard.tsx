import React, { useState, useEffect } from 'react';
import { Department, Employee, LocationId, Shift } from '../../domain/types';
import { DepartmentGap, findCandidatesForGap, ReplacementCandidate } from '../../engine/schedulerEngine';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  Sparkles,
  Star,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

interface StaffSubstitutionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  gaps: DepartmentGap[];
  employees: Employee[];
  shifts: Shift[];
  locationId: LocationId;
  onApplyShift: (newShift: Shift) => void;
  onIgnoreGap?: (gapId: string) => void;
  onComplete?: () => void;
}

const DEPT_COLORS: Record<Department, { bg: string; text: string; border: string }> = {
  'Cassa': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Fioreria': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'Decor': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Serra Calda': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Serra Fredda': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
};

export const StaffSubstitutionWizard: React.FC<StaffSubstitutionWizardProps> = ({
  isOpen,
  onClose,
  gaps,
  employees,
  shifts,
  locationId,
  onApplyShift,
  onIgnoreGap,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSuccessTransition, setIsSuccessTransition] = useState(false);
  const [lastAssigned, setLastAssigned] = useState<{ empName: string; dept: Department } | null>(null);

  // Reset indice all'apertura
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsSuccessTransition(false);
      setLastAssigned(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentGap: DepartmentGap | undefined = gaps[currentIndex];
  const isFinished = currentIndex >= gaps.length;

  // Candidati disponibili per la scopertura corrente
  const candidates: ReplacementCandidate[] = currentGap
    ? findCandidatesForGap({
        gap: currentGap,
        employees,
        shifts,
        locationId,
      })
    : [];

  const handleSelectCandidate = (candidate: ReplacementCandidate) => {
    if (!currentGap) return;

    const newShift: Shift = {
      id: `shift-${candidate.employee.id}-${currentGap.dateStr}`,
      employeeId: candidate.employee.id,
      locationId,
      date: currentGap.dateStr,
      type: currentGap.severity === 'critical' ? 'giornata' : 'pomeriggio',
      department: currentGap.department,
      startTime: currentGap.startMissing,
      endTime: currentGap.endMissing,
      areaNote: `${currentGap.department} (Sostituzione coperta)`,
      isCustomHours: currentGap.severity === 'partial',
      assignedSkillScore: candidate.skillScore,
    };

    onApplyShift(newShift);
    setLastAssigned({ empName: candidate.employee.name, dept: currentGap.department });
    setIsSuccessTransition(true);

    setTimeout(() => {
      setIsSuccessTransition(false);
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (nextIdx >= gaps.length && onComplete) {
        onComplete();
      }
    }, 1200);
  };

  const handleSkip = () => {
    if (currentGap && onIgnoreGap) {
      onIgnoreGap(currentGap.id);
    }
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    if (nextIdx >= gaps.length && onComplete) {
      onComplete();
    }
  };

  const deptTheme = currentGap ? DEPT_COLORS[currentGap.department] || DEPT_COLORS['Cassa'] : DEPT_COLORS['Cassa'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-nicora-teal-dark via-nicora-teal to-[#1b4332] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-nicora-orange flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg leading-tight">
                Assistente Copertura Presidi
              </h3>
              <p className="text-xs text-nicora-teal-light/85">
                Risoluzione guidata e cronologica delle scoperture settimanali
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

        {/* Progress Bar (se non completato) */}
        {!isFinished && gaps.length > 0 && (
          <div className="bg-neutral-100 px-5 py-2.5 flex items-center justify-between border-b border-neutral-200 text-xs">
            <span className="font-bold text-neutral-700">
              Scopertura {currentIndex + 1} di {gaps.length}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-28 bg-neutral-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-nicora-orange h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(((currentIndex) / gaps.length) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-neutral-500">
                {Math.round(((currentIndex) / gaps.length) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* STATO 1: Transizione Sostituzione Completata */}
          {isSuccessTransition && lastAssigned && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-emerald-950">
                  Sostituzione Completata!
                </h4>
                <p className="text-xs text-emerald-800 font-medium mt-1">
                  <strong>{lastAssigned.empName}</strong> è stato/a assegnato/a al presidio di <strong>{lastAssigned.dept}</strong>.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Caricamento problema successivo...</span>
              </div>
            </div>
          )}

          {/* STATO 2: Visualizzazione problema corrente e candidati */}
          {!isSuccessTransition && !isFinished && currentGap && (
            <div className="space-y-4">
              
              {/* Scheda Scopertura Corrente */}
              <div className={`p-4 rounded-2xl border shadow-xs space-y-2.5 ${deptTheme.bg} ${deptTheme.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} className={currentGap.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'} />
                    <span className="font-bold text-sm text-neutral-900">
                      {currentGap.dayMeta.dayName} {currentGap.dayMeta.dayNum} {currentGap.dateStr.slice(0, 7)}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      currentGap.severity === 'critical'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {currentGap.severity === 'critical' ? 'Criticità Giornaliera' : 'Presidio Orario Incompleto'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl font-bold text-xs ${deptTheme.bg} ${deptTheme.text} border ${deptTheme.border}`}>
                      {currentGap.department}
                    </span>
                    <span className="text-xs font-semibold text-neutral-800">
                      {currentGap.hoursDescription}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista Proposta Sostituti */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <UserPlus size={15} className="text-nicora-orange" />
                    <span>Migliori Sostituti Consigliati ({candidates.length}):</span>
                  </span>
                  <span className="text-[11px] text-neutral-500">Ordinati per competenza</span>
                </div>

                {candidates.length === 0 ? (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-center space-y-2 text-neutral-500">
                    <AlertTriangle size={24} className="mx-auto text-amber-500" />
                    <p className="font-semibold text-xs text-neutral-800">
                      Nessun collaboratore disponibile a riposo per questa data.
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Tutto il personale della sede è già impegnato in servizio negli orari indicati.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {candidates.map((cand, idx) => {
                      const isTopChoice = idx === 0;
                      return (
                        <div
                          key={cand.employee.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isTopChoice
                              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200 shadow-xs'
                              : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs flex-shrink-0"
                              style={{ backgroundColor: cand.employee.color || '#2d6a4f' }}
                            >
                              {cand.employee.avatar || cand.employee.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-neutral-900 truncate">
                                  {cand.employee.name}
                                </span>
                                {isTopChoice && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-600 text-white text-[9px] font-bold uppercase">
                                    Consigliato
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                                <span className="flex items-center gap-0.5 font-semibold text-emerald-800">
                                  <Star size={11} className="fill-emerald-600 text-emerald-600" />
                                  <span>{cand.skillScore}/10</span>
                                </span>
                                <span>•</span>
                                <span className="truncate">{cand.statusLabel}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSelectCandidate(cand)}
                            className="bg-nicora-orange hover:bg-nicora-orange-hover text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0 active:scale-95 transition-all"
                          >
                            <UserCheck size={14} />
                            <span>Assegna</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STATO 3: Settimana Completata con Successo */}
          {!isSuccessTransition && isFinished && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-lg text-emerald-950">
                  Settimana Risolta al 100%!
                </h4>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                  Tutti i reparti e le fasce orarie sono ora coperti. Il tabellone settimanale è pronto e conforme agli standard operativi Nicora.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition-transform"
              >
                Torna al Tabellone
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        {!isFinished && (
          <div className="bg-neutral-50 border-t border-neutral-200 p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 flex items-center gap-1.5"
            >
              <span>Ignora questo presidio</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-700 px-3 py-1.5"
            >
              Chiudi
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
