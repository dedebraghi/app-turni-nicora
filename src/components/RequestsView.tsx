import React, { useState } from 'react';
import { Employee, LocationId, ShiftRequest } from '../types';
import { ArrowLeftRight, CalendarOff, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { LOCATIONS } from '../mockData';

interface RequestsViewProps {
  currentEmployeeId: string;
  employees: Employee[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
  activeLocation: LocationId;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  currentEmployeeId,
  employees,
  requests,
  onSubmitRequest,
  isManagerMode,
  onUpdateStatus,
  activeLocation,
}) => {
  const [requestType, setRequestType] = useState<'swap' | 'leave'>('swap');
  
  // Filtra colleghi della stessa sede per lo scambio turni
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation);
  const eligibleColleagues = storeEmployees.filter((e) => e.id !== currentEmployeeId);

  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(
    eligibleColleagues[0]?.id || ''
  );
  const [shiftDate, setShiftDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Filtra le richieste della sede attiva
  const storeRequests = requests.filter((r) => r.locationId === activeLocation);
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onSubmitRequest({
      requesterId: currentEmployeeId,
      locationId: activeLocation,
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
    <div className="space-y-4 pb-24">
      {/* Feedback Alert Successo */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2 text-emerald-900 animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Richiesta inoltrata con successo!</p>
            <p className="text-emerald-700">L'amministratore riceverà la notifica per l'approvazione.</p>
          </div>
        </div>
      )}

      {/* Form di Inserimento */}
      <div className="bg-white rounded-xl p-4 border border-nicora-border shadow-clean">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-nicora-orange" />
            <h3 className="font-bold text-sm text-nicora-title">Nuova Richiesta Personale</h3>
          </div>
          <span className="text-[10px] bg-neutral-100 text-neutral-600 font-bold px-2 py-0.5 rounded-full">
            {locationInfo?.shortName}
          </span>
        </div>

        {/* Tipo Richiesta: Cambio Turno o Ferie */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => setRequestType('swap')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all touch-manipulation min-h-[44px] ${
              requestType === 'swap'
                ? 'bg-nicora-orange text-white border-nicora-orange shadow-xs'
                : 'bg-neutral-50 text-neutral-600 border-nicora-border'
            }`}
          >
            <ArrowLeftRight size={14} />
            <span>Scambio Turno</span>
          </button>

          <button
            type="button"
            onClick={() => setRequestType('leave')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all touch-manipulation min-h-[44px] ${
              requestType === 'leave'
                ? 'bg-nicora-teal text-white border-nicora-teal shadow-xs'
                : 'bg-neutral-50 text-neutral-600 border-nicora-border'
            }`}
          >
            <CalendarOff size={14} />
            <span>Ferie / Permesso</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Giorno interessato */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Data interessata (consigliato con anticipo):
            </label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-nicora-orange focus:outline-none min-h-[44px]"
              required
            />
          </div>

          {/* Collega con cui scambiare (solo per swap) */}
          {requestType === 'swap' && (
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Con quale collega di {locationInfo?.shortName} vuoi scambiare?
              </label>
              <select
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-nicora-orange focus:outline-none min-h-[44px]"
              >
                {eligibleColleagues.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Motivazione o preferenza:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                requestType === 'swap'
                  ? 'Es. Posso coprire il tuo pomeriggio se prendi la mia mattina...'
                  : 'Es. Visita dentista, gita programmata o ferie...'
              }
              className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-nicora-orange focus:outline-none min-h-[70px]"
              rows={2}
              required
            />
          </div>

          {/* Pulsante Invio */}
          <button
            type="submit"
            className="w-full bg-nicora-orange hover:bg-nicora-orange-hover text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] touch-manipulation min-h-[44px]"
          >
            <Send size={14} />
            <span>Invia Richiesta al Responsabile</span>
          </button>
        </form>
      </div>

      {/* Storico Richieste Recenti */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-nicora-teal px-1">
          Richieste Recenti ({locationInfo?.shortName})
        </h3>

        {storeRequests.length === 0 ? (
          <p className="text-xs text-neutral-500 italic p-3 bg-white rounded-xl border border-nicora-border">
            Nessuna richiesta attiva al momento per questo punto vendita.
          </p>
        ) : (
          <div className="space-y-2.5">
            {storeRequests.map((req) => {
              const requester = getEmployee(req.requesterId);
              const target = req.targetEmployeeId ? getEmployee(req.targetEmployeeId) : null;
              const isMyReq = req.requesterId === currentEmployeeId;

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl p-3 border shadow-clean text-xs space-y-2 ${
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

                  <p className="text-neutral-700 bg-neutral-50 p-2 rounded-lg border border-neutral-100 italic">
                    "{req.reason}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                    <span>{req.createdAt}</span>

                    {/* Azioni Responsabile per Approvare / Rifiutare */}
                    {isManagerMode && req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateStatus(req.id, 'approved')}
                          className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-700 active:scale-95 transition-transform"
                        >
                          Approva
                        </button>
                        <button
                          onClick={() => onUpdateStatus(req.id, 'rejected')}
                          className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 active:scale-95 transition-transform"
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
