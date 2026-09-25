import React, { useState } from 'react';
import { Employee, LocationId, ShiftRequest } from '../../domain/types';
import { CONTINUATO_SLOTS } from '../../domain/rules';
import { ArrowLeftRight, CalendarOff, CheckCircle2, Clock, Send, Sparkles, XCircle } from 'lucide-react';
import { LOCATIONS } from '../../domain/mockData';

interface LeaveRequestsMobileProps {
  currentEmployeeId: string;
  employees: Employee[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected', note?: string) => void;
  activeLocation: LocationId;
}

export const LeaveRequestsMobile: React.FC<LeaveRequestsMobileProps> = ({
  currentEmployeeId,
  employees,
  requests,
  onSubmitRequest,
  isManagerMode,
  onUpdateStatus,
  activeLocation,
}) => {
  const [requestType, setRequestType] = useState<'swap' | 'leave' | 'schedule_change'>('leave');
  
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation && e.isActive !== false);
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
    <div className="space-y-4 pb-20">
      
      {/* Alert di Successo */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2.5 text-emerald-900 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Richiesta inviata con successo!</p>
            <p className="text-emerald-700 text-[11px]">La direzione valuterà la richiesta.</p>
          </div>
        </div>
      )}

      {/* Header Mobile */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <span className="text-[10px] font-bold text-nicora-orange uppercase tracking-wider">
            {locationInfo?.shortName}
          </span>
          <h1 className="font-serif text-xl font-semibold text-nicora-title">
            Richieste &amp; Ferie
          </h1>
        </div>
        <span className="text-[10px] bg-white border border-nicora-sage-border text-neutral-600 px-2.5 py-1 rounded-full font-semibold shadow-2xs">
          Sportello Mobile
        </span>
      </div>

      {/* Form di Inserimento Richiesta */}
      <div className="bg-white rounded-2xl p-4 border border-nicora-sage-border shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-nicora-orange" />
          <h3 className="font-serif text-sm font-semibold text-nicora-title">
            Nuova Richiesta
          </h3>
        </div>

        {/* Tipo Selezione */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRequestType('leave')}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
              requestType === 'leave'
                ? 'bg-nicora-teal text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Ferie
          </button>

          <button
            type="button"
            onClick={() => setRequestType('swap')}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
              requestType === 'swap'
                ? 'bg-nicora-orange text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Scambio
          </button>

          <button
            type="button"
            onClick={() => setRequestType('schedule_change')}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
              requestType === 'schedule_change'
                ? 'bg-[#b7791f] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Orario
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Data:</label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-neutral-800 font-semibold text-xs"
              required
            />
          </div>

          {requestType === 'swap' && (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Collega:</label>
              <select
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-neutral-800 font-semibold text-xs"
              >
                {eligibleColleagues.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {requestType === 'schedule_change' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">Dalle:</label>
                <input
                  type="time"
                  value={requestedStartTime}
                  onChange={(e) => setRequestedStartTime(e.target.value)}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-2 py-1.5 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">Alle:</label>
                <input
                  type="time"
                  value={requestedEndTime}
                  onChange={(e) => setRequestedEndTime(e.target.value)}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-2 py-1.5 font-bold"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Motivazione:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Inserisci motivo della richiesta..."
              className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-xs"
              rows={2}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-nicora-orange hover:bg-nicora-orange-hover text-white font-extrabold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 text-xs"
          >
            <Send size={14} />
            <span>Invia alla Direzione</span>
          </button>
        </form>
      </div>

      {/* Storico Richieste */}
      <div className="space-y-2">
        <h3 className="font-serif text-sm font-semibold text-nicora-title px-0.5">
          Richieste Inoltrate ({storeRequests.length})
        </h3>

        {storeRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center text-xs text-neutral-400 border border-dashed border-nicora-sage-border">
            Nessuna richiesta presentata al momento.
          </div>
        ) : (
          <div className="space-y-2">
            {storeRequests.map((req) => {
              const requester = getEmployee(req.requesterId);
              const target = req.targetEmployeeId ? getEmployee(req.targetEmployeeId) : null;
              const isMyReq = req.requesterId === currentEmployeeId;

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl p-3 border shadow-2xs text-xs space-y-2 ${
                    isMyReq ? 'border-nicora-orange ring-1 ring-nicora-orange/40' : 'border-nicora-sage-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-neutral-800">
                      {requester?.name} {isMyReq && '(Tu)'}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}>
                      {req.status === 'approved' ? '✓ Approvata' : req.status === 'rejected' ? '✕ Rifiutata' : '⏳ In attesa'}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-600">
                    Data: <strong>{req.shiftDate}</strong> • Tipo: <strong>{req.type === 'swap' ? 'Scambio' : req.type === 'leave' ? 'Ferie' : 'Orario'}</strong>
                    {target && ` con ${target.name}`}
                  </p>

                  <p className="bg-neutral-50 p-2 rounded-lg text-neutral-600 text-[11px] italic">
                    "{req.reason}"
                  </p>

                  {isManagerMode && req.status === 'pending' && (
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-neutral-100">
                      <button
                        onClick={() => onUpdateStatus(req.id, 'approved')}
                        className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]"
                      >
                        Approva
                      </button>
                      <button
                        onClick={() => onUpdateStatus(req.id, 'rejected')}
                        className="bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-[10px]"
                      >
                        Rifiuta
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
