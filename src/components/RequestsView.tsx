import React, { useState } from 'react';
import { Employee, ShiftRequest } from '../types';
import { ArrowLeftRight, CalendarOff, CheckCircle2, Clock, Send, Sparkles } from 'lucide-react';

interface RequestsViewProps {
  currentEmployeeId: string;
  employees: Employee[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  currentEmployeeId,
  employees,
  requests,
  onSubmitRequest,
  isManagerMode,
  onUpdateStatus,
}) => {
  const [requestType, setRequestType] = useState<'swap' | 'leave'>('swap');
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(
    employees.find((e) => e.id !== currentEmployeeId)?.id || ''
  );
  const [shiftDate, setShiftDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onSubmitRequest({
      requesterId: currentEmployeeId,
      type: requestType,
      targetEmployeeId: requestType === 'swap' ? targetEmployeeId : undefined,
      shiftDate,
      reason,
    });

    setReason('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3500);
  };

  const getEmployee = (empId: string) => employees.find((e) => e.id === empId);

  return (
    <div className="space-y-5 pb-24">
      {/* Feedback Alert Successo */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 flex items-center gap-2 text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Richiesta inviata con successo!</p>
            <p className="text-emerald-700">Il responsabile e il collega riceveranno la notifica.</p>
          </div>
        </div>
      )}

      {/* Form di Inserimento */}
      <div className="bg-white rounded-lg p-4 border border-nicora-border shadow-clean">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-nicora-orange" />
          <h3 className="font-bold text-sm text-nicora-title">Nuova Richiesta Personale</h3>
        </div>

        {/* Tipo Richiesta: Cambio Turno o Ferie */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => setRequestType('swap')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold border transition-all touch-manipulation min-h-[44px] ${
              requestType === 'swap'
                ? 'bg-nicora-orange text-white border-nicora-orange shadow-sm'
                : 'bg-neutral-50 text-neutral-600 border-nicora-border'
            }`}
          >
            <ArrowLeftRight size={15} />
            <span>Scambio Turno</span>
          </button>

          <button
            type="button"
            onClick={() => setRequestType('leave')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold border transition-all touch-manipulation min-h-[44px] ${
              requestType === 'leave'
                ? 'bg-nicora-teal text-white border-nicora-teal shadow-sm'
                : 'bg-neutral-50 text-neutral-600 border-nicora-border'
            }`}
          >
            <CalendarOff size={15} />
            <span>Assenza / Ferie</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Giorno interessato */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Data interessata:
            </label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-neutral-50 border border-nicora-border rounded-lg px-3 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-nicora-orange focus:outline-none min-h-[44px]"
              required
            />
          </div>

          {/* Collega con cui scambiare (solo per swap) */}
          {requestType === 'swap' && (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Con chi desideri scambiare?
              </label>
              <select
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="w-full bg-neutral-50 border border-nicora-border rounded-lg px-3 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-nicora-orange focus:outline-none min-h-[44px]"
              >
                {employees
                  .filter((e) => e.id !== currentEmployeeId)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Motivazione o orario preferito:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                requestType === 'swap'
                  ? 'Es. Posso coprire il tuo pomeriggio se prendi la mia mattina...'
                  : 'Es. Visita medica programmata o permesso familiare...'
              }
              className="w-full bg-neutral-50 border border-nicora-border rounded-lg px-3 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-nicora-orange focus:outline-none min-h-[70px]"
              rows={2}
              required
            />
          </div>

          {/* Pulsante Invio */}
          <button
            type="submit"
            className="w-full bg-nicora-orange hover:bg-nicora-orange-hover text-white font-bold py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] touch-manipulation min-h-[44px]"
          >
            <Send size={15} />
            <span>Invia Richiesta al Team</span>
          </button>
        </form>
      </div>

      {/* Storico Richieste Recenti */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-teal px-1">
          Richieste Recenti del Reparto
        </h3>

        {requests.length === 0 ? (
          <p className="text-xs text-neutral-500 italic p-3 bg-white rounded-lg border border-nicora-border">
            Nessuna richiesta attiva al momento.
          </p>
        ) : (
          <div className="space-y-2.5">
            {requests.map((req) => {
              const requester = getEmployee(req.requesterId);
              const target = req.targetEmployeeId ? getEmployee(req.targetEmployeeId) : null;
              const isMyReq = req.requesterId === currentEmployeeId;

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-lg p-3 border shadow-clean text-xs space-y-2 ${
                    isMyReq ? 'border-nicora-orange/60 ring-1 ring-nicora-orange/20' : 'border-nicora-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-nicora-title">
                        {requester?.name} {isMyReq && '(Tu)'}
                      </span>
                      <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium">
                        {req.type === 'swap' ? 'Scambio' : 'Ferie'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'approved' ? 'Approvata' : req.status === 'rejected' ? 'Rifiutata' : 'In attesa'}
                    </span>
                  </div>

                  {req.type === 'swap' && target && (
                    <p className="text-neutral-600 flex items-center gap-1">
                      <ArrowLeftRight size={12} className="text-nicora-orange" />
                      <span>Scambio proposto con <strong>{target.name}</strong> per il {req.shiftDate}</span>
                    </p>
                  )}

                  {req.type === 'leave' && (
                    <p className="text-neutral-600 flex items-center gap-1">
                      <CalendarOff size={12} className="text-nicora-teal" />
                      <span>Data assenza: <strong>{req.shiftDate}</strong></span>
                    </p>
                  )}

                  <p className="text-neutral-700 bg-neutral-50 p-2 rounded border border-neutral-100 italic">
                    "{req.reason}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                    <span>{req.createdAt}</span>

                    {/* Azioni Responsabile per Approvare / Rifiutare */}
                    {isManagerMode && req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateStatus(req.id, 'approved')}
                          className="bg-emerald-600 text-white font-bold px-2 py-1 rounded hover:bg-emerald-700 min-h-[32px]"
                        >
                          Approva
                        </button>
                        <button
                          onClick={() => onUpdateStatus(req.id, 'rejected')}
                          className="bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded border border-rose-200 hover:bg-rose-100 min-h-[32px]"
                        >
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
