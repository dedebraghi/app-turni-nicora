import React, { useState } from 'react';
import { Employee, LocationId, ShiftRequest } from '../../domain/types';
import { CONTINUATO_SLOTS } from '../../domain/rules';
import { ArrowLeftRight, CalendarOff, CheckCircle2, Clock, Info, Send, ShieldAlert, Sparkles, XCircle } from 'lucide-react';
import { LOCATIONS } from '../../domain/mockData';

interface LeaveRequestsDesktopProps {
  currentEmployeeId: string;
  employees: Employee[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected', note?: string) => void;
  activeLocation: LocationId;
}

export const LeaveRequestsDesktop: React.FC<LeaveRequestsDesktopProps> = ({
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
    <div className="max-w-[1280px] w-full mx-auto space-y-7 pb-16">
      
      {/* 1. Header (Stitch Desktop 212d1e3ff7974a8b8df857d245d42f94) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-nicora-orange uppercase tracking-widest">
              Sportello Collaboratori
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-nicora-orange"></span>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {locationInfo?.name || (activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese')}
            </span>
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-nicora-title font-medium tracking-tight">
            Gestione Richieste &amp; Ferie
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-white border border-nicora-sage-border px-4 py-2 rounded-xl text-neutral-600 text-xs shadow-2xs">
          <Clock size={16} className="text-nicora-teal" />
          <span>Finestra approvazione corrente: <strong className="text-nicora-teal font-semibold">Settimana Attiva</strong></span>
        </div>
      </div>

      {/* Alert di Successo */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sm">Richiesta registrata con successo!</p>
            <p className="text-emerald-700">Inoltrata alla direzione di {locationInfo?.shortName || activeLocation} per la revisione.</p>
          </div>
        </div>
      )}

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols): Form & History Feed */}
        <section className="lg:col-span-8 space-y-7">
          
          {/* Form di Inserimento Richiesta */}
          <div className="bg-white rounded-2xl shadow-2xs border border-nicora-sage-border p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-nicora-orange flex items-center justify-center shadow-2xs border border-orange-200">
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-nicora-title">
                    Invia Richiesta Ferie o Cambio Turno
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Modulo ufficiale per coordinamento orario e assenze programmate
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-nicora-teal-light text-nicora-teal text-xs font-bold border border-nicora-teal-border/40">
                {locationInfo?.shortName}
              </span>
            </div>

            {/* Type Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-neutral-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setRequestType('leave')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
                  requestType === 'leave'
                    ? 'bg-nicora-teal text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <CalendarOff size={16} />
                <span>Ferie o Permesso</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('swap')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
                  requestType === 'swap'
                    ? 'bg-nicora-orange text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ArrowLeftRight size={16} />
                <span>Scambio Turno</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('schedule_change')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
                  requestType === 'schedule_change'
                    ? 'bg-[#b7791f] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Clock size={16} />
                <span>Variazione Orario</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 flex items-center justify-between mb-1">
                  <span>Data interessata:</span>
                  <span className="text-neutral-400 font-normal">Preavviso raccomandato: almeno 7 giorni</span>
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-neutral-800 font-semibold focus:ring-2 focus:ring-nicora-orange focus:outline-none min-h-[44px]"
                  required
                />
              </div>

              {requestType === 'swap' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Collega per lo scambio concordato ({locationInfo?.shortName}):
                  </label>
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-neutral-800 font-semibold focus:ring-2 focus:ring-nicora-orange focus:outline-none min-h-[44px]"
                  >
                    {eligibleColleagues.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {requestType === 'schedule_change' && (
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
                  <label className="block font-bold text-amber-900">
                    Template orari rapidi &amp; orario continuato desiderato:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRequestedStartTime('10:00');
                        setRequestedEndTime('18:30');
                      }}
                      className="p-2 rounded-lg bg-white border border-amber-200 text-amber-900 font-bold text-[11px] text-center hover:bg-amber-100"
                    >
                      Entrata posticipata (10:00-18:30)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequestedStartTime('08:30');
                        setRequestedEndTime('17:00');
                      }}
                      className="p-2 rounded-lg bg-white border border-amber-200 text-amber-900 font-bold text-[11px] text-center hover:bg-amber-100"
                    >
                      Uscita anticipata (08:30-17:00)
                    </button>
                    {CONTINUATO_SLOTS.map((slot, idx) => (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => {
                          setRequestedStartTime(slot.start);
                          setRequestedEndTime(slot.end);
                        }}
                        className="p-2 rounded-lg bg-white border border-amber-200 text-amber-900 font-bold text-[11px] text-center hover:bg-amber-100"
                      >
                        Slot {idx + 1} ({slot.label})
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">Ora Inizio:</label>
                      <input
                        type="time"
                        value={requestedStartTime}
                        onChange={(e) => setRequestedStartTime(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">Ora Fine:</label>
                      <input
                        type="time"
                        value={requestedEndTime}
                        onChange={(e) => setRequestedEndTime(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Motivazione o note per la direzione:</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    requestType === 'swap'
                      ? 'Es. Posso coprire la tua domenica se copri il mio turno giovedì...'
                      : 'Es. Visita medica programmata, necessità personale o familiare...'
                  }
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-4 py-3 text-neutral-800 text-xs focus:ring-2 focus:ring-nicora-orange focus:outline-none min-h-[80px]"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 flex-wrap gap-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs">
                  <Info size={16} className="text-emerald-600" />
                  <span>Notifica istantanea inviata alla bacheca e sincronizzata in tempo reale</span>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-nicora-orange hover:bg-nicora-orange-hover text-white font-bold text-xs shadow-xs transition-transform active:scale-[0.99]"
                >
                  <Send size={15} />
                  <span>Invia Richiesta alla Direzione</span>
                </button>
              </div>
            </form>
          </div>

          {/* Storico Richieste Desktop */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-semibold text-nicora-title">
                Tutte le richieste — {locationInfo?.name} ({storeRequests.length})
              </h3>
              <span className="text-xs text-neutral-400">Archivio e richieste attive</span>
            </div>

            {storeRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-xs text-neutral-400 border border-dashed border-nicora-sage-border">
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
                      className={`bg-white rounded-2xl p-5 border shadow-2xs space-y-3 ${
                        isMyReq ? 'border-nicora-orange ring-1 ring-nicora-orange/40' : 'border-nicora-sage-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-nicora-teal-light text-nicora-teal flex items-center justify-center font-serif font-bold text-sm">
                            {requester?.avatar || requester?.name.slice(0, 2).toUpperCase() || 'NC'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-base font-semibold text-neutral-800">
                                {requester?.name} {isMyReq && '(Tu)'}
                              </span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                req.type === 'schedule_change'
                                  ? 'bg-amber-100 text-amber-800'
                                  : req.type === 'swap'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}>
                                {req.type === 'swap' ? 'Scambio Turno' : req.type === 'leave' ? 'Ferie / Permesso' : 'Variazione Orario'}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400">Data richiesta: {req.shiftDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200 animate-pulse'
                          }`}>
                            {req.status === 'approved' ? '✓ Approvata' : req.status === 'rejected' ? '✕ Rifiutata' : '⏳ In attesa'}
                          </span>
                        </div>
                      </div>

                      {req.type === 'swap' && target && (
                        <p className="text-xs text-neutral-700 flex items-center gap-2">
                          <ArrowLeftRight size={14} className="text-nicora-orange" />
                          <span>Proposta di scambio reciproco con <strong>{target.name}</strong></span>
                        </p>
                      )}

                      {req.type === 'schedule_change' && (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-neutral-800">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Clock size={14} className="text-amber-600" />
                            <span>Orario concordato richiesto:</span>
                          </span>
                          <span className="bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-lg">
                            {req.requestedStartTime || '09:00'} — {req.requestedEndTime || '18:30'}
                          </span>
                        </div>
                      )}

                      <div className="bg-neutral-50 rounded-xl p-3 text-neutral-700 italic text-xs">
                        "{req.reason}"
                      </div>

                      {req.managerNote && (
                        <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          <strong>Nota Direzione:</strong> {req.managerNote}
                        </p>
                      )}

                      {/* Azioni Manager */}
                      <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-100">
                        <span>Inviata: {req.createdAt}</span>

                        {isManagerMode && req.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onUpdateStatus(req.id, 'approved', 'Approvata dal responsabile')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 size={13} /> Approva Richiesta
                            </button>
                            <button
                              onClick={() => onUpdateStatus(req.id, 'rejected', 'Non conciliabile con presidio')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1"
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
        </section>

        {/* Right Column (4 cols): Policy and Guidance Cards (Stitch Desktop) */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-nicora-sage-border p-6 shadow-2xs space-y-3">
            <h3 className="font-serif text-base font-semibold text-nicora-title flex items-center gap-2">
              <Info size={18} className="text-nicora-teal" />
              <span>Regole di Preavviso</span>
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Le richieste di ferie programmate devono essere presentate con <strong>almeno 7-10 giorni</strong> di anticipo per garantire la copertura dei reparti di cassa e vivaio.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1.5 pl-3 list-disc">
              <li>Scambi turno reciproci ammessi se concordati con un collega dello stesso reparto</li>
              <li>Presidio minimo garantito di almeno 1 persona in cassa e fioreria in ogni momento</li>
            </ul>
          </div>

          <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-6 shadow-2xs space-y-3">
            <h3 className="font-serif text-base font-semibold text-nicora-orange flex items-center gap-2">
              <ShieldAlert size={18} />
              <span>Casi di Urgenza o Malattia</span>
            </h3>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Per assenze improvvise di salute o emergenze dell'ultimo minuto, comunicare tempestivamente al responsabile di punto vendita via telefono o WhatsApp oltre alla registrazione nell'app.
            </p>
          </div>
        </aside>

      </div>

    </div>
  );
};
