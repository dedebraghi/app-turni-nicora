import React from 'react';
import { LocationId, Shift } from '../../domain/types';
import { formatLocalDate } from '../../engine/schedulerEngine';
import {
  AlertTriangle,
  CalendarOff,
  Flame,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

interface ClearShiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: LocationId;
  locationName: string;
  shifts: Shift[];
  onConfirmClear: (targetLocationId: LocationId, mode: 'future' | 'all') => void;
}

export const ClearShiftsModal: React.FC<ClearShiftsModalProps> = ({
  isOpen,
  onClose,
  locationId,
  locationName,
  shifts,
  onConfirmClear,
}) => {
  if (!isOpen) return null;

  const todayStr = formatLocalDate(new Date());
  const storeShifts = (shifts || []).filter((s) => s.locationId === locationId);
  const pastShifts = storeShifts.filter((s) => s.date < todayStr);
  const futureShifts = storeShifts.filter((s) => s.date >= todayStr);

  const totalCount = storeShifts.length;
  const pastCount = pastShifts.length;
  const futureCount = futureShifts.length;

  const handleClearFuture = () => {
    onConfirmClear(locationId, 'future');
  };

  const handleClearAll = () => {
    const confirmation = window.confirm(
      `ATTENZIONE: Stai per eliminare DEFINITIVAMENTE TUTTO LO STORICO dei turni di ${locationName} (${totalCount} turni totali, inclusi i ${pastCount} turni dei giorni passati).\n\nQuesta operazione è irreversibile e cancellerà tutto dal database.\n\nVuoi davvero procedere?`
    );
    if (confirmation) {
      onConfirmClear(locationId, 'all');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg leading-tight">
                Gestione Svuotamento Turni
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Sede: <strong className="text-white">{locationName}</strong> ({totalCount} turni registrati)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          <p className="text-neutral-600 leading-relaxed">
            Seleziona la modalità di cancellazione desiderata per <strong>{locationName}</strong>. 
            Puoi azzerare i turni futuri mantenendo lo storico oppure effettuare un reset totale.
          </p>

          {/* Opzione 1: Consigliata (Solo turni da oggi in poi) */}
          <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 space-y-3 transition-all hover:shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-emerald-950 text-sm">
                      Elimina solo i turni da oggi in poi
                    </span>
                    <span className="bg-emerald-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Consigliato
                    </span>
                  </div>
                  <p className="text-emerald-900/80 text-[11px] mt-1 leading-snug">
                    Rimuove i <strong>{futureCount} turni futuri</strong> da oggi in avanti.
                    Tutti i <strong>{pastCount} turni dei giorni passati</strong> rimangono intatti e protetti al 100% per preservare lo storico presenze.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearFuture}
              disabled={futureCount === 0}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                futureCount > 0
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <CalendarOff size={15} />
              <span>
                {futureCount > 0
                  ? `Svuota turni futuri (${futureCount} turni da oggi in poi)`
                  : 'Nessun turno futuro da eliminare'}
              </span>
            </button>
          </div>

          {/* Opzione 2: ZONA PERICOLO (Reset totale del database) */}
          <div className="bg-rose-50/80 border-2 border-rose-300/80 rounded-2xl p-4 space-y-3 ring-1 ring-rose-200 transition-all">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-600/15 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-rose-950 text-sm flex items-center gap-1.5">
                    <Flame size={15} className="text-rose-600" />
                    <span>Svuota TUTTO il database (incluso lo storico)</span>
                  </span>
                  <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Danger Zone
                  </span>
                </div>
                <p className="text-rose-900/85 text-[11px] mt-1.5 leading-snug">
                  <strong>Operazione irreversibile:</strong> cancella definitivamente qualsiasi turno registrato per questa sede 
                  (<strong>{totalCount} turni totali</strong>, compresi tutti i <strong>{pastCount} turni storici passati</strong>).
                  Il database cloud e locale per questa sede verrà completamente azzerato e non sarà possibile recuperare i dati.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={totalCount === 0}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                totalCount > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Trash2 size={15} />
              <span>
                {totalCount > 0
                  ? `Elimina definitivamente tutto lo storico (${totalCount} turni)`
                  : 'Nessun turno presente nel database'}
              </span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-neutral-200 p-3.5 sm:p-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
          >
            Annulla
          </button>
        </div>

      </div>
    </div>
  );
};
