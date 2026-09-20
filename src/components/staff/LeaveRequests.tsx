import React, { useState } from 'react';
import { Employee, LocationId, ShiftRequest } from '../../domain/types';
import { CONTINUATO_SLOTS } from '../../domain/rules';
import { ArrowLeftRight, CalendarOff, CheckCircle2, Clock, Send, Sparkles, XCircle } from 'lucide-react';
import { LOCATIONS } from '../../domain/mockData';

interface LeaveRequestsProps {
  currentEmployeeId: string;
  employees: Employee[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected', note?: string) => void;
  activeLocation: LocationId;
}

export const LeaveRequests: React.FC<LeaveRequestsProps> = ({
  currentEmployeeId,
  employees,
  requests,
  onSubmitRequest,
  isManagerMode,
  onUpdateStatus,
  activeLocation,
}) => {
  const [requestType, setRequestType] = useState<'swap' | 'leave' | 'schedule_change'>('leave');
  
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation);
  const eligibleColleagues = storeEmployees.filter((e) => e.id !== currentEmployeeId);

  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(
    eligibleColleagues[0]?.id || ''
  );
  const [shiftDate, setShiftDate] = useState<string>(() =>
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [requestedStartTime, setRequestedStartTime] = useState('10:00');
  const [requestedEndTime, setRequestedEndTime] = useState('18:30');
  const [reason, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
      requestedStartTime: requestType === 'schedule_change' ? requestedStartTime : undefined,
      requestedEndTime: requestType === 'schedule_change' ? requestedEndTime : undefined,
      reason,
    });

    setReason('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3500);
  };

  const getEmployee = (empId: string) => employees.find((e) => e.id === empId);

  return (
    <div className="space-y-4 pb-20 md:pb-8 max-w-3xl mx-auto">
      
      {/* Alert di Successo */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold text-sm">Richiesta inoltrata con successo!</p>
            <p className="text-emerald-700">La direzione di {locationInfo?.shortName} esaminerà la tua richiesta.</p>
          </div>
        </div>
      )}

      {/* Form di Inserimento Richiesta */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-nicora-border shadow-clean">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-nicora-orange" />
            <h3 className="font-extrabold text-sm sm:text-base text-nicora-title">
              Invia Richiesta Ferie o Cambio Turno
            </h3>
          </div>
          <span className="text-xs bg-neutral-100 text-neutral-600 font-bold px-2.5 py-1 rounded-full">
            {locationInfo?.shortName}
          </span>
        </div>

        {/* Tipo Selezione */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setRequestType('leave')}
            className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
              requestType === 'leave'
                ? 'bg-nicora-teal text-white border-nicora-teal shadow-xs'
                : 'bg-neutral-50 text-neutral-600 border-nicora-border hover:bg-neutral-100'
            }`}
          >
            <CalendarOff size={15} />
            <span>Ferie o Permesso</span>
          </button>

          <button
            type="button"
            onClick={() => setRequestType('swap')}
            className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
              requestType === 'swap'
                ? 'bg-nicora-orange text-white border-nicora-orange shadow-xs'
                : 'bg-neutral-50 text-neutral-600 border-nicora-border hover:bg-neutral-100'
            }`}
          >
            <ArrowLeftRight size={15} />
            <span>Scambio Turno</span>
          </button>

          <button
            type="button"
            onClick={() => setRequestType('schedule_change')}
            className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
              requestType === 'schedule_change'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-neutral-50 text-neutral-600 border-nicora-border hover:bg-neutral-100'
            }`}
          >
            <Clock size={15} />
            <span>Variazione Orario</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Data richiesta */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Data interessata (si raccomanda preavviso):
            </label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2.5 text-neutral-800 font-semibold focus:ring-2 focus:ring-nicora-orange min-h-[44px]"
              required
            />
          </div>

          {/* Variazione Orario (Preset e Time Picker) */}
          {requestType === 'schedule_change' && (
            <div className="space-y-2.5 bg-amber-50/50 p-3 rounded-2xl border border-amber-200">
              <label className="block font-bold text-neutral-800">
                Template Rapidi & Orario Flessibile Richiesto:
              </label>

              {/* Preset 1-Click */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setRequestedStartTime('10:00');
                    setRequestedEndTime('18:30');
                  }}
                  className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 font-bold text-[10px] text-center hover:bg-amber-100 transition-colors"
                >
                  Entrata posticipata (10:00)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRequestedStartTime('08:30');
                    setRequestedEndTime('17:00');
                  }}
                  className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 font-bold text-[10px] text-center hover:bg-amber-100 transition-colors"
                >
                  Uscita anticipata (17:00)
                </button>
                {CONTINUATO_SLOTS.map((slot, idx) => (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => {
                      setRequestedStartTime(slot.start);
                      setRequestedEndTime(slot.end);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 font-bold text-[10px] text-center hover:bg-amber-100 transition-colors"
                  >
                    Slot {idx + 1} ({slot.label})
                  </button>
                ))}
              </div>

              {/* Inserimento Libero Orari */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-0.5 text-[11px]">
                    Ora Inizio Desiderata:
                  </label>
                  <input
                    type="time"
                    value={requestedStartTime}
                    onChange={(e) => setRequestedStartTime(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold text-sm min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-0.5 text-[11px]">
                    Ora Fine Desiderata:
                  </label>
                  <input
                    type="time"
                    value={requestedEndTime}
                    onChange={(e) => setRequestedEndTime(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold text-sm min-h-[44px]"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Collega con cui scambiare (solo per swap) */}
          {requestType === 'swap' && (
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Collega con cui concordare lo scambio ({locationInfo?.shortName}):
              </label>
              <select
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2.5 text-neutral-800 font-semibold focus:ring-2 focus:ring-nicora-orange min-h-[44px]"
              >
                {eligibleColleagues.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Motivazione */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Motivazione o dettagli:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                requestType === 'swap'
                  ? 'Es. Posso coprire la tua domenica se copri il mio giovedì...'
                  : 'Es. Visita medica dal dentista, gita programmata al mercoledì...'
              }
              className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-neutral-800 font-medium focus:ring-2 focus:ring-nicora-orange min-h-[75px]"
              rows={3}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-nicora-orange hover:bg-nicora-orange-hover text-white font-extrabold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.99] touch-manipulation text-sm"
          >
            <Send size={16} />
            <span>Invia Richiesta alla Direzione</span>
          </button>
        </form>
      </div>

      {/* Storico Richieste */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-nicora-teal px-1">
          Tutte le Richieste — {locationInfo?.name} ({storeRequests.length})
        </h3>

        {storeRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-dashed border-nicora-border text-center text-xs text-neutral-400">
            Nessuna richiesta presentata al momento per questa sede.
          </div>
        ) : (
          <div className="space-y-3">
            {storeRequests.map((req) => {
              const requester = getEmployee(req.requesterId);
              const target = req.targetEmployeeId ? getEmployee(req.targetEmployeeId) : null;
              const isMyReq = req.requesterId === currentEmployeeId;

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl p-4 border shadow-clean text-xs space-y-2.5 ${
                    isMyReq
                      ? 'border-nicora-orange/60 ring-1 ring-nicora-orange/20'
                      : 'border-nicora-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-nicora-title">
                        {requester?.name} {isMyReq && '(Tu)'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        req.type === 'schedule_change'
                          ? 'bg-amber-100 text-amber-800'
                          : req.type === 'swap'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {req.type === 'swap'
                          ? 'Scambio Turno'
                          : req.type === 'leave'
                          ? 'Ferie / Permesso'
                          : 'Variazione Orario'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      }`}
                    >
                      {req.status === 'approved'
                        ? '✓ Approvata'
                        : req.status === 'rejected'
                        ? '✕ Rifiutata'
                        : '⏳ In attesa'}
                    </span>
                  </div>

                  {req.type === 'swap' && target && (
                    <p className="text-neutral-700 flex items-center gap-1.5">
                      <ArrowLeftRight size={13} className="text-nicora-orange flex-shrink-0" />
                      <span>Proposta di scambio con <strong>{target.name}</strong> per la data {req.shiftDate}</span>
                    </p>
                  )}

                  {req.type === 'leave' && (
                    <p className="text-neutral-700 flex items-center gap-1.5">
                      <CalendarOff size={13} className="text-nicora-teal flex-shrink-0" />
                      <span>Data di assenza desiderata: <strong>{req.shiftDate}</strong></span>
                    </p>
                  )}

                  {req.type === 'schedule_change' && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between text-neutral-800">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock size={14} className="text-amber-600 flex-shrink-0" />
                        <span>Orario richiesto per il <strong>{req.shiftDate}</strong>:</span>
                      </div>
                      <span className="bg-amber-200 text-amber-950 font-black px-2.5 py-0.5 rounded-lg text-xs shadow-xs">
                        {req.requestedStartTime || '09:00'} — {req.requestedEndTime || '18:30'}
                      </span>
                    </div>
                  )}

                  <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 text-neutral-700 italic">
                    "{req.reason}"
                  </div>

                  {req.managerNote && (
                    <p className="text-amber-800 text-[11px] font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <strong>Nota Direzione:</strong> {req.managerNote}
                    </p>
                  )}

                  {/* Azioni Manager */}
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100">
                    <span>{req.createdAt}</span>

                    {isManagerMode && req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateStatus(req.id, 'approved', 'Confermata dal responsabile')}
                          className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-700 active:scale-95 shadow-xs transition-transform flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} /> Approva
                        </button>
                        <button
                          onClick={() => onUpdateStatus(req.id, 'rejected', 'Non conciliabile con la copertura minima')}
                          className="bg-rose-50 text-rose-700 font-bold px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-100 active:scale-95 transition-transform flex items-center gap-1"
                        >
                          <XCircle size={13} /> Rifiuta
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
