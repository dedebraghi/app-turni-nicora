import React, { useState } from 'react';
import { CONTINUATO_SLOTS, DEPARTMENTS, SHIFT_TYPES, STANDARD_HOURS } from '../../domain/rules';
import { Department, Employee, Shift, ShiftType } from '../../domain/types';
import { X, Check, Clock, MapPin, Tag, ShieldAlert, Sparkles } from 'lucide-react';

interface EditShiftModalProps {
  shift: Shift;
  employee?: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedShift: Shift) => void;
  onFindReplacement?: (shift: Shift) => void;
}

export const EditShiftModal: React.FC<EditShiftModalProps> = ({
  shift,
  employee,
  isOpen,
  onClose,
  onSave,
  onFindReplacement,
}) => {
  const [type, setType] = useState<ShiftType>(shift.type);
  const [department, setDepartment] = useState<Department>(shift.department || employee?.role || 'Cassa');
  const [startTime, setStartTime] = useState(shift.startTime || STANDARD_HOURS.mattina.start);
  const [endTime, setEndTime] = useState(shift.endTime || STANDARD_HOURS.giornata.end);
  const [areaNote, setAreaNote] = useState(shift.areaNote || '');
  const [isCustomHours, setIsCustomHours] = useState(shift.isCustomHours || false);

  if (!isOpen) return null;

  const handleTypeSelect = (newType: ShiftType) => {
    setType(newType);
    setIsCustomHours(false);
    if (newType === 'mattina') {
      setStartTime(STANDARD_HOURS.mattina.start);
      setEndTime(STANDARD_HOURS.mattina.end);
    } else if (newType === 'pomeriggio') {
      setStartTime(STANDARD_HOURS.pomeriggio.start);
      setEndTime(STANDARD_HOURS.pomeriggio.end);
    } else if (newType === 'giornata') {
      setStartTime(STANDARD_HOURS.giornata.start);
      setEndTime(STANDARD_HOURS.giornata.end);
    }
  };

  const handleContinuatoSlot = (slot: { start: string; end: string; label: string }) => {
    setType('giornata');
    setStartTime(slot.start);
    setEndTime(slot.end);
    setIsCustomHours(true);
    if (!areaNote.includes('(Continuato)')) {
      setAreaNote(prev => prev ? `${prev} (Continuato)` : 'Continuato');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isOff = type === 'riposo' || type === 'ferie' || type === 'malattia';
    const isStandard =
      (type === 'mattina' && startTime === STANDARD_HOURS.mattina.start && endTime === STANDARD_HOURS.mattina.end) ||
      (type === 'pomeriggio' && startTime === STANDARD_HOURS.pomeriggio.start && endTime === STANDARD_HOURS.pomeriggio.end) ||
      (type === 'giornata' && startTime === STANDARD_HOURS.giornata.start && endTime === STANDARD_HOURS.giornata.end);

    onSave({
      ...shift,
      type,
      department: isOff ? undefined : department,
      startTime: isOff ? undefined : startTime,
      endTime: isOff ? undefined : endTime,
      areaNote: isOff ? undefined : areaNote,
      isManualOverride: true,
      isCustomHours: !isOff && (isCustomHours || !isStandard),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
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
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
          
          {/* Tipologia Turno */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1.5">
              Tipologia Turno:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {SHIFT_TYPES.map((t) => (
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
                  {t === 'riposo' ? 'Riposo' : t === 'ferie' ? '🌴 Ferie' : t === 'malattia' ? '🏥 Malat.' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Sostituzione rapida se malattia o imprevisto */}
          {(type === 'malattia' || type === 'riposo') && onFindReplacement && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-nicora-orange flex-shrink-0" />
                <span className="text-xs text-amber-900 font-medium">
                  Collaboratore assente in questo giorno?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFindReplacement(shift);
                }}
                className="bg-nicora-orange hover:bg-nicora-orange-hover text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs active:scale-95"
              >
                Trova Sostituto
              </button>
            </div>
          )}

          {/* Reparto Assegnato */}
          {type !== 'riposo' && type !== 'ferie' && type !== 'malattia' && (
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
                <Tag size={13} className="text-nicora-teal" />
                <span>Reparto di Servizio:</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setDepartment(dept)}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[11px] border transition-all truncate text-center ${
                      department === dept
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
          )}

          {/* Preset Orario Continuato (9-19 a scaglioni) */}
          {type !== 'riposo' && type !== 'ferie' && type !== 'malattia' && (
            <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-800 flex items-center gap-1">
                  <Sparkles size={12} className="text-nicora-orange" />
                  <span>Template Orario Continuato (9–19):</span>
                </span>
                <span className="text-[10px] font-medium text-orange-800 bg-orange-100/80 px-1.5 py-0.5 rounded">
                  Alta Stagione
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {CONTINUATO_SLOTS.map((slot, sIdx) => {
                  const isSelected = startTime === slot.start && endTime === slot.end;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => handleContinuatoSlot(slot)}
                      className={`py-1.5 px-1 rounded-lg text-center font-bold text-[10px] border transition-all ${
                        isSelected
                          ? 'bg-nicora-orange text-white border-nicora-orange shadow-xs'
                          : 'bg-white text-neutral-700 border-orange-200 hover:bg-orange-100/60'
                      }`}
                      title={`Scaglione ${sIdx + 1}: ${slot.label}`}
                    >
                      <div className="font-black leading-tight">{slot.label}</div>
                      <div className={`text-[9px] ${isSelected ? 'text-white/90' : 'text-neutral-400'}`}>
                        Scaglione {sIdx + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orari */}
          {type !== 'riposo' && type !== 'ferie' && type !== 'malattia' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-nicora-teal" /> Ora Inizio:
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
                  <Clock size={12} className="text-nicora-orange" /> Ora Fine:
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
          {type !== 'riposo' && type !== 'ferie' && type !== 'malattia' && (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-nicora-teal" /> Postazione o Mansione Specifica:
              </label>
              <input
                type="text"
                value={areaNote}
                onChange={(e) => setAreaNote(e.target.value)}
                placeholder="Es. Cassa 1 Continua, Scarico merci vivaio..."
                className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-nicora-orange min-h-[44px]"
              />
            </div>
          )}

          {/* Pulsanti Azione */}
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
              <span>Salva Modifiche</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
