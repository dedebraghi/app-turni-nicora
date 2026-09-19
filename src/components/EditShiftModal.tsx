import React, { useState } from 'react';
import { Department, Employee, Shift, ShiftType } from '../types';
import { X, Check, Clock, MapPin, Tag } from 'lucide-react';
import { DEPARTMENTS } from '../utils/scheduler';

interface EditShiftModalProps {
  shift: Shift;
  employee?: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedShift: Shift) => void;
}

export const EditShiftModal: React.FC<EditShiftModalProps> = ({
  shift,
  employee,
  isOpen,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<ShiftType>(shift.type);
  const [department, setDepartment] = useState<Department>(shift.department || employee?.role || 'Cassa');
  const [startTime, setStartTime] = useState(shift.startTime || '08:30');
  const [endTime, setEndTime] = useState(shift.endTime || '12:30');
  const [areaNote, setAreaNote] = useState(shift.areaNote || '');

  if (!isOpen) return null;

  const handleTypeSelect = (newType: ShiftType) => {
    setType(newType);
    if (newType === 'mattina') {
      setStartTime('08:30');
      setEndTime('12:30');
    } else if (newType === 'pomeriggio') {
      setStartTime('14:30');
      setEndTime('19:30');
    } else if (newType === 'giornata') {
      setStartTime('08:30');
      setEndTime('19:30');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...shift,
      type,
      department: (type === 'riposo' || type === 'ferie') ? undefined : department,
      startTime: (type === 'riposo' || type === 'ferie') ? undefined : startTime,
      endTime: (type === 'riposo' || type === 'ferie') ? undefined : endTime,
      areaNote: (type === 'riposo' || type === 'ferie') ? undefined : areaNote,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden pb-safe animate-in slide-in-from-bottom duration-200">
        
        {/* Modal Header */}
        <div className="bg-nicora-teal text-white px-4 py-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-nicora-orange-border">
              Gestione Turno Responsabile
            </span>
            <h3 className="font-bold text-base leading-tight">
              {employee?.name}
            </h3>
            <p className="text-xs text-nicora-teal-light/80">Data: {shift.date}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
          
          {/* Shift Type Pills */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1.5">
              Tipologia Turno:
            </label>
            <div className="grid grid-cols-5 gap-1">
              {(['mattina', 'pomeriggio', 'giornata', 'riposo', 'ferie'] as ShiftType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeSelect(t)}
                  className={`py-2 px-1 rounded-lg font-bold capitalize transition-all border text-[11px] touch-manipulation min-h-[38px] ${
                    type === t
                      ? 'bg-nicora-orange text-white border-nicora-orange shadow-xs'
                      : 'bg-neutral-50 text-neutral-600 border-nicora-border hover:bg-neutral-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Reparto Assegnato (5 reparti ufficiali) */}
          {type !== 'riposo' && type !== 'ferie' && (
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
                <Tag size={13} className="text-nicora-teal" />
                <span>Reparto Assegnato:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setDepartment(dept)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all ${
                      department === dept
                        ? 'bg-nicora-teal text-white border-nicora-teal shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-nicora-border hover:bg-neutral-100'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Picker se turno attivo */}
          {type !== 'riposo' && type !== 'ferie' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-nicora-teal" /> Inizio
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-nicora-orange min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-nicora-orange" /> Fine
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-nicora-orange min-h-[44px]"
                  required
                />
              </div>
            </div>
          )}

          {/* Dettaglio mansione o postazione */}
          {type !== 'riposo' && type !== 'ferie' && (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-nicora-teal" /> Mansione o Postazione Specifica
              </label>
              <input
                type="text"
                value={areaNote}
                onChange={(e) => setAreaNote(e.target.value)}
                placeholder="Es. Cassa 1 continua, Scarico merci, Fioreria composizioni..."
                className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-nicora-orange min-h-[44px]"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors min-h-[44px]"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-nicora-orange hover:bg-nicora-orange-hover text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] min-h-[44px]"
            >
              <Check size={16} />
              <span>Salva Turno</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
