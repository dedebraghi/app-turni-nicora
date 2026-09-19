import React, { useState } from 'react';
import { DEPARTMENTS } from '../../domain/rules';
import { Department, Employee, LocationId } from '../../domain/types';
import { Award, Check, Info, Search, X } from 'lucide-react';

interface SkillsMatrixProps {
  isOpen?: boolean;
  onClose?: () => void;
  employees: Employee[];
  locationId: LocationId;
  onUpdateSkills: (employeeId: string, skills: Record<Department, number>) => void;
  isStandaloneTab?: boolean;
}

export const SkillsMatrix: React.FC<SkillsMatrixProps> = ({
  isOpen = true,
  onClose,
  employees,
  locationId,
  onUpdateSkills,
  isStandaloneTab = false,
}) => {
  const storeEmployees = employees.filter((e) => e.locationId === locationId);
  const [searchQuery, setSearchQuery] = useState('');

  const [editableSkills, setEditableSkills] = useState<Record<string, Record<Department, number>>>(() => {
    const initial: Record<string, Record<Department, number>> = {};
    employees.forEach((emp) => {
      initial[emp.id] = { ...emp.skills };
    });
    return initial;
  });

  const [hasChanges, setHasChanges] = useState(false);

  if (!isStandaloneTab && !isOpen) return null;

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
    if (onClose) onClose();
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 8) return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
    if (score >= 5) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    return 'bg-neutral-100 text-neutral-600 border-neutral-200 font-medium';
  };

  const filteredStaff = storeEmployees.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const content = (
    <div className="space-y-4">
      {/* Header Info & Search */}
      <div className="bg-white rounded-2xl p-4 border border-nicora-border shadow-clean space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-nicora-title">
                Matrice delle Competenze Reparti (Punteggio 1–10)
              </h3>
              <p className="text-xs text-neutral-500">
                Punto Vendita: <strong className="capitalize text-nicora-teal">{locationId}</strong> ({storeEmployees.length} collaboratori)
              </p>
            </div>
          </div>

          {hasChanges && (
            <button
              onClick={handleSaveAll}
              className="bg-nicora-orange hover:bg-nicora-orange-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Check size={14} />
              <span>Salva Modifiche</span>
            </button>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900">
          <Info size={16} className="text-nicora-orange flex-shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Principio di Assegnazione Nicora:</strong> L'algoritmo sceglie prioritariamente le risorse a punteggio più alto per la <strong>Cassa (priorità assoluta)</strong>, poi <strong>Fioreria</strong> e <strong>Decor</strong>. In caso di emergenze/malattie, il sistema suggerirà chi ha la competenza migliore.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca collaboratore per nome o ruolo..."
            className="w-full bg-neutral-50 border border-nicora-border rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-nicora-teal focus:outline-none"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search size={14} />
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="space-y-3">
        {filteredStaff.map((emp) => {
          const currentScores = editableSkills[emp.id] || emp.skills;

          return (
            <div
              key={emp.id}
              className="bg-white rounded-2xl p-4 border border-nicora-border shadow-clean space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-nicora-teal-light text-nicora-teal font-black text-xs flex items-center justify-center border border-nicora-teal-border/40">
                    {emp.avatar}
                  </span>
                  <div>
                    <span className="font-extrabold text-sm text-nicora-title">{emp.name}</span>
                    <span className="text-xs text-neutral-400 ml-2">
                      (Reparto primario: <strong>{emp.role}</strong>)
                    </span>
                  </div>
                </div>

                {emp.isManager && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Responsabile
                  </span>
                )}
              </div>

              {/* 5 Reparti Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                {DEPARTMENTS.map((dept) => {
                  const score = currentScores[dept] ?? 5;

                  return (
                    <div
                      key={dept}
                      className="bg-neutral-50 rounded-xl p-2 border border-nicora-border flex flex-col items-center justify-between"
                    >
                      <span className="text-[10px] font-extrabold text-neutral-700 truncate w-full" title={dept}>
                        {dept === 'Serra Calda' ? 'S. Calda' : dept === 'Serra Fredda' ? 'S. Fredda' : dept}
                      </span>

                      <div className="my-1.5 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleScoreChange(emp.id, dept, score - 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center justify-center active:scale-90 shadow-xs"
                        >
                          -
                        </button>

                        <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shadow-xs ${getScoreBadgeClass(score)}`}>
                          {score}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleScoreChange(emp.id, dept, score + 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center justify-center active:scale-90 shadow-xs"
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
    </div>
  );

  if (isStandaloneTab) {
    return <div className="max-w-4xl mx-auto pb-20 md:pb-8">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-nicora-teal text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Matrice delle Competenze
              </h3>
              <p className="text-xs text-nicora-teal-light/80 capitalize">
                Sede di {locationId} ({storeEmployees.length} dipendenti)
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {content}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-nicora-border p-4 flex items-center justify-between flex-shrink-0">
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
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ${
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
