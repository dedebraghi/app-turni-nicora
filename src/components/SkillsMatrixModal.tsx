import React, { useState } from 'react';
import { Department, Employee, LocationId } from '../types';
import { DEPARTMENTS } from '../utils/scheduler';
import { X, Check, Award, Info } from 'lucide-react';

interface SkillsMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  locationId: LocationId;
  onUpdateSkills: (employeeId: string, skills: Record<Department, number>) => void;
}

export const SkillsMatrixModal: React.FC<SkillsMatrixModalProps> = ({
  isOpen,
  onClose,
  employees,
  locationId,
  onUpdateSkills,
}) => {
  const storeEmployees = employees.filter((e) => e.locationId === locationId);

  // Stato locale di modifica temporanea
  const [editableSkills, setEditableSkills] = useState<Record<string, Record<Department, number>>>(() => {
    const initial: Record<string, Record<Department, number>> = {};
    employees.forEach((emp) => {
      initial[emp.id] = { ...emp.skills };
    });
    return initial;
  });

  const [hasChanges, setHasChanges] = useState(false);

  if (!isOpen) return null;

  const handleScoreChange = (empId: string, dept: Department, newScore: number) => {
    const clamped = Math.max(1, Math.min(10, newScore));
    setEditableSkills((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [dept]: clamped,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    Object.entries(editableSkills).forEach(([empId, skills]) => {
      onUpdateSkills(empId, skills);
    });
    setHasChanges(false);
    onClose();
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 8) return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
    if (score >= 5) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    return 'bg-neutral-100 text-neutral-600 border-neutral-200 font-medium';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-nicora-teal text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Matrice delle Competenze (1–10)
              </h3>
              <p className="text-xs text-nicora-teal-light/80">
                Punto Vendita: <strong className="capitalize">{locationId}</strong> ({storeEmployees.length} dipendenti)
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

        {/* Info Box */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 flex items-start gap-2 text-xs text-amber-900 flex-shrink-0">
          <Info size={16} className="text-nicora-orange flex-shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Come funziona:</strong> L'algoritmo di assegnazione automatica sceglie per primo il personale a punteggio più elevato su ciascun reparto (con priorità assoluta su <em>Cassa</em>, poi <em>Fioreria</em> e <em>Decor</em>).
          </p>
        </div>

        {/* Content Table / Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-neutral-100">
          {storeEmployees.map((emp) => {
            const currentScores = editableSkills[emp.id] || emp.skills;

            return (
              <div key={emp.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-nicora-teal-light text-nicora-teal font-bold text-xs flex items-center justify-center border border-nicora-teal-border/40">
                      {emp.avatar}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-nicora-title">{emp.name}</span>
                      <span className="text-[10px] text-neutral-400 ml-1.5">
                        (Principale: {emp.role})
                      </span>
                    </div>
                  </div>
                  {emp.isManager && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      Resp.
                    </span>
                  )}
                </div>

                {/* Griglia 5 Reparti */}
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {DEPARTMENTS.map((dept) => {
                    const score = currentScores[dept] ?? 5;

                    return (
                      <div
                        key={dept}
                        className="bg-neutral-50 rounded-lg p-1.5 border border-nicora-border flex flex-col items-center justify-between"
                      >
                        <span className="text-[9px] font-bold text-neutral-600 truncate w-full" title={dept}>
                          {dept === 'Serra Calda' ? 'S. Calda' : dept === 'Serra Fredda' ? 'S. Fredda' : dept}
                        </span>

                        <div className="my-1 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleScoreChange(emp.id, dept, score - 1)}
                            className="w-5 h-5 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center justify-center active:scale-90"
                          >
                            -
                          </button>

                          <span className={`w-6 h-6 rounded border flex items-center justify-center text-xs ${getScoreBadgeClass(score)}`}>
                            {score}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleScoreChange(emp.id, dept, score + 1)}
                            className="w-5 h-5 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center justify-center active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-50 border-t border-nicora-border p-3.5 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-800"
          >
            Chiudi
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!hasChanges}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all ${
              hasChanges
                ? 'bg-nicora-orange hover:bg-nicora-orange-hover text-white active:scale-95'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Check size={14} />
            <span>Salva Competenze</span>
          </button>
        </div>

      </div>
    </div>
  );
};
