import React, { useState } from 'react';
import { Department, Employee, LocationId, Shift } from '../../domain/types';
import { DEPARTMENTS } from '../../domain/rules';
import { findBestReplacements } from '../../engine/replacementAdvisor';
import { X, ShieldAlert, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: LocationId;
  employees: Employee[];
  shifts: Shift[];
  preselectedShift?: Shift | null;
  onApplyReplacement: (absentShift: Shift, replacementEmployeeId: string, department: Department) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  locationId,
  employees,
  shifts,
  preselectedShift,
  onApplyReplacement,
}) => {
  const storeStaff = employees.filter((e) => e.locationId === locationId);

  const [selectedShiftDate, setSelectedShiftDate] = useState<string>(
    preselectedShift?.date || new Date().toISOString().split('T')[0]
  );
  const [absentEmployeeId, setAbsentEmployeeId] = useState<string>(
    preselectedShift?.employeeId || storeStaff[0]?.id || ''
  );
  const [targetDepartment, setTargetDepartment] = useState<Department>(
    preselectedShift?.department || 'Cassa'
  );
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const absentShift = shifts.find(
    (s) => s.employeeId === absentEmployeeId && s.date === selectedShiftDate
  ) || {
    id: `temp-${absentEmployeeId}-${selectedShiftDate}`,
    employeeId: absentEmployeeId,
    locationId,
    date: selectedShiftDate,
    type: 'malattia' as const,
    department: targetDepartment,
  };

  const suggestions = findBestReplacements({
    targetShift: absentShift,
    targetDepartment,
    employees,
    shifts,
  });

  const handleConfirmReplacement = (replacementId: string) => {
    onApplyReplacement(absentShift, replacementId, targetDepartment);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Gestione Emergenza & Sostituzioni Improvvise
              </h3>
              <p className="text-xs text-rose-100">
                Trova il miglior sostituto per competenza e disponibilità
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

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {isSuccess && (
            <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-in fade-in">
              <CheckCircle2 size={20} className="text-emerald-700 flex-shrink-0" />
              <div>
                <p className="font-extrabold text-sm">Sostituzione Assegnata!</p>
                <p className="text-xs text-emerald-800">Il turno è stato aggiornato e la cassa/reparto è garantita.</p>
              </div>
            </div>
          )}

          {/* Selezione data e assente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 p-3.5 rounded-2xl border border-nicora-border">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Data dell'imprevisto / assenza:
              </label>
              <input
                type="date"
                value={selectedShiftDate}
                onChange={(e) => setSelectedShiftDate(e.target.value)}
                className="w-full bg-white border border-nicora-border rounded-xl px-3 py-2 text-neutral-800 font-semibold focus:ring-2 focus:ring-rose-500 min-h-[40px]"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Collaboratore assente:
              </label>
              <select
                value={absentEmployeeId}
                onChange={(e) => setAbsentEmployeeId(e.target.value)}
                className="w-full bg-white border border-nicora-border rounded-xl px-3 py-2 text-neutral-800 font-semibold focus:ring-2 focus:ring-rose-500 min-h-[40px]"
              >
                {storeStaff.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reparto Critico da coprire */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1.5">
              Reparto da presidiare con urgenza:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setTargetDepartment(dept)}
                  className={`py-2 px-1 rounded-xl font-extrabold text-[11px] border transition-all text-center truncate ${
                    targetDepartment === dept
                      ? dept === 'Cassa'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-nicora-teal text-white border-nicora-teal shadow-xs'
                      : 'bg-neutral-50 text-neutral-700 border-nicora-border hover:bg-neutral-100'
                  }`}
                >
                  {dept === 'Serra Calda' ? 'S. Calda' : dept === 'Serra Fredda' ? 'S. Fredda' : dept}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Candidati Suggeriti dall'Algoritmo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold uppercase tracking-wider text-neutral-700 flex items-center gap-1 text-[11px]">
                <Sparkles size={14} className="text-amber-500" />
                Candidati Sostituti Suggeriti (per competenza {targetDepartment}):
              </span>
            </div>

            <div className="space-y-2">
              {suggestions.slice(0, 5).map((sugg, idx) => {
                const emp = sugg.employee;
                const isTopPick = idx === 0;

                return (
                  <div
                    key={emp.id}
                    className={`bg-white rounded-2xl p-3.5 border transition-all shadow-clean flex items-center justify-between ${
                      isTopPick
                        ? 'border-emerald-500 ring-1 ring-emerald-400 bg-emerald-50/20'
                        : 'border-nicora-border hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isTopPick
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {emp.avatar}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-nicora-title">
                            {emp.name}
                          </span>
                          {isTopPick && (
                            <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase">
                              Consigliato
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {sugg.reasons.join(' • ')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmReplacement(emp.id)}
                      className={`px-3 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 flex-shrink-0 ${
                        isTopPick
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-nicora-orange hover:bg-nicora-orange-hover text-white'
                      }`}
                    >
                      <span>Assegna</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-nicora-border p-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-800"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
