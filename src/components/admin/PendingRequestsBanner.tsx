import React, { useState } from 'react';
import { Employee, ShiftRequest } from '../../domain/types';
import { ArrowLeftRight, CalendarOff, CheckCircle2, ChevronLeft, ChevronRight, Clock, Sparkles, X, XCircle } from 'lucide-react';

interface PendingRequestsBannerProps {
  requests: ShiftRequest[];
  employees: Employee[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const PendingRequestsBanner: React.FC<PendingRequestsBannerProps> = ({
  requests,
  employees,
  onApprove,
  onReject,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (pendingRequests.length === 0 || isDismissed) {
    return null;
  }

  // Assicura che l'indice corrente sia valido
  const safeIndex = Math.min(currentIndex, pendingRequests.length - 1);
  const currentReq = pendingRequests[safeIndex];

  const requester = employees.find((e) => e.id === currentReq.requesterId);
  const target = currentReq.targetEmployeeId
    ? employees.find((e) => e.id === currentReq.targetEmployeeId)
    : null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 rounded-2xl p-3 sm:p-4 shadow-clean animate-in slide-in-from-top duration-200">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs animate-pulse">
            !
          </span>
          <span className="font-extrabold text-xs text-amber-950 uppercase tracking-wide">
            Richieste in Sospeso ({pendingRequests.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {pendingRequests.length > 1 && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-800 mr-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={safeIndex === 0}
                className="p-1 rounded hover:bg-amber-100 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span>{safeIndex + 1}/{pendingRequests.length}</span>
              <button
                type="button"
                onClick={() => setCurrentIndex((p) => Math.min(pendingRequests.length - 1, p + 1))}
                disabled={safeIndex === pendingRequests.length - 1}
                className="p-1 rounded hover:bg-amber-100 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-amber-700 hover:text-amber-950 p-1 rounded-lg"
            title="Nascondi momentaneamente"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Dettagli Richiesta */}
      <div className="py-2.5 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-neutral-900 text-sm">
            <span>{requester?.name || 'Collaboratore'}</span>
            <span className="text-[10px] bg-amber-200/90 text-amber-900 px-2 py-0.2 rounded-full font-bold uppercase">
              {currentReq.type === 'leave'
                ? 'Ferie / Permesso'
                : currentReq.type === 'swap'
                ? 'Scambio Turno'
                : 'Variazione Orario'}
            </span>
          </div>

          <span className="text-xs font-bold text-neutral-600 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
            Data: <strong>{currentReq.shiftDate}</strong>
          </span>
        </div>

        {/* Dettagli specifici per tipo */}
        {currentReq.type === 'schedule_change' && (
          <p className="text-amber-900 font-bold flex items-center gap-1 bg-white/70 p-1.5 rounded-lg border border-amber-200/60">
            <Clock size={13} className="text-amber-600" />
            <span>Nuovo orario richiesto: <strong>{currentReq.requestedStartTime} — {currentReq.requestedEndTime}</strong></span>
          </p>
        )}

        {currentReq.type === 'swap' && target && (
          <p className="text-amber-900 font-medium flex items-center gap-1 bg-white/70 p-1.5 rounded-lg border border-amber-200/60">
            <ArrowLeftRight size={13} className="text-nicora-orange" />
            <span>Scambio con: <strong>{target.name}</strong></span>
          </p>
        )}

        {currentReq.type === 'leave' && (
          <p className="text-amber-900 font-medium flex items-center gap-1 bg-white/70 p-1.5 rounded-lg border border-amber-200/60">
            <CalendarOff size={13} className="text-nicora-teal" />
            <span>Richiesta assenza/ferie per l'intera giornata</span>
          </p>
        )}

        <div className="text-[11px] text-neutral-600 italic bg-white/50 p-2 rounded-lg border border-amber-100">
          "{currentReq.reason}"
        </div>
      </div>

      {/* Azioni 1-Click */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onApprove(currentReq.id)}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] touch-manipulation min-h-[44px]"
        >
          <CheckCircle2 size={15} />
          <span>Approva 1-Click</span>
        </button>

        <button
          type="button"
          onClick={() => onReject(currentReq.id)}
          className="py-2.5 px-4 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1 transition-colors active:scale-[0.98] touch-manipulation min-h-[44px]"
        >
          <XCircle size={15} />
          <span>Rifiuta</span>
        </button>
      </div>

    </div>
  );
};
