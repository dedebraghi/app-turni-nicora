import React, { useState } from 'react';
import { Employee, LocationId, ShiftRequest, ShiftRequestStatus, ShiftRequestType } from '../../domain/types';
import { CONTINUATO_SLOTS } from '../../domain/rules';
import { 
  ArrowLeftRight, 
  CalendarOff, 
  CheckCircle2, 
  Clock, 
  HeartPulse, 
  Info, 
  Send, 
  Sparkles, 
  XCircle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { LOCATIONS } from '../../domain/mockData';
import { MobileHeader } from '../layout/MobileHeader';

interface LeaveRequestsMobileProps {
  currentEmployee?: Employee;
  currentEmployeeId: string;
  employees: Employee[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: ShiftRequestStatus, note?: string) => void;
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onLogout?: () => void;
  onSaveEmployee?: (emp: Employee) => void;
}

export const LeaveRequestsMobile: React.FC<LeaveRequestsMobileProps> = ({
  currentEmployee,
  currentEmployeeId,
  employees,
  requests,
  onSubmitRequest,
  isManagerMode,
  onUpdateStatus,
  activeLocation,
  onChangeLocation,
  onLogout,
  onSaveEmployee,
}) => {
  const [requestType, setRequestType] = useState<ShiftRequestType>('leave');
  
  const myEmployee = currentEmployee || employees.find((e) => e.id === currentEmployeeId);
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation && e.isActive !== false && !e.isOwner);
  const eligibleColleagues = storeEmployees.filter((e) => e.id !== currentEmployeeId);

  const gazzadaStaffCount = employees.filter((e) => e.locationId === 'gazzada' && e.isActive !== false && !e.isOwner).length;
  const vareseStaffCount = employees.filter((e) => e.locationId === 'varese' && e.isActive !== false && !e.isOwner).length;

  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(
    eligibleColleagues[0]?.id || ''
  );
  const [shiftDate, setShiftDate] = useState<string>(() =>
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [targetShiftDate, setTargetShiftDate] = useState<string>(() =>
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [requestedStartTime, setRequestedStartTime] = useState('10:00');
  const [requestedEndTime, setRequestedEndTime] = useState('18:30');
  const [protocolNumber, setProtocolNumber] = useState('');
  const [reason, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('Richiesta inviata con successo!');

  const storeRequests = requests.filter((r) => r.locationId === activeLocation);
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation);

  // Proposte di scambio turno ricevute dal dipendente loggato in attesa della sua approvazione
  const incomingSwapRequests = requests.filter(
    (r) => r.type === 'swap' && r.targetEmployeeId === currentEmployeeId && r.status === 'pending_colleague'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onSubmitRequest({
      requesterId: currentEmployeeId,
      locationId: activeLocation,
      type: requestType,
      targetEmployeeId: requestType === 'swap' ? targetEmployeeId : undefined,
      shiftDate,
      targetShiftDate: requestType === 'swap' ? targetShiftDate : undefined,
      requestedStartTime: requestType === 'schedule_change' ? requestedStartTime : undefined,
      requestedEndTime: requestType === 'schedule_change' ? requestedEndTime : undefined,
      protocolNumber: requestType === 'sick' ? protocolNumber : undefined,
      reason,
    });

    if (requestType === 'swap') {
      const colleague = employees.find((e) => e.id === targetEmployeeId);
      setSuccessMsg(`Proposta di scambio inviata a ${colleague?.name || 'collega'}. Verrà inoltrata al responsabile appena il collega accetterà.`);
    } else if (requestType === 'sick') {
      setSuccessMsg('Segnalazione di malattia registrata e trasmessa alla direzione.');
    } else {
      setSuccessMsg('Richiesta inviata alla direzione per la valutazione.');
    }

    setReason('');
    setProtocolNumber('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4500);
  };

  const handleAcceptSwap = (reqId: string) => {
    onUpdateStatus(
      reqId,
      'pending',
      `Accettato dal collega (${myEmployee?.name || 'collega'}). In attesa di approvazione della Direzione.`
    );
  };

  const handleRejectSwap = (reqId: string) => {
    onUpdateStatus(
      reqId,
      'rejected_colleague',
      `Rifiutato dal collega (${myEmployee?.name || 'collega'}).`
    );
  };

  const getEmployee = (empId: string) => employees.find((e) => e.id === empId);

  return (
    <div className="min-h-screen bg-[#f2fcf7] text-[#151d1b] flex flex-col font-sans">
      
      {/* ========================================================
          1. HEADER NATIVO STITCH MOBILE CONDIVISO (Come in "Dentro oggi")
          ======================================================== */}
      <MobileHeader
        title="Richieste"
        employee={myEmployee}
        activeLocation={activeLocation}
        onChangeLocation={onChangeLocation}
        gazzadaStaffCount={gazzadaStaffCount}
        vareseStaffCount={vareseStaffCount}
        onLogout={onLogout}
        onSaveEmployee={onSaveEmployee}
      />

      {/* ========================================================
          2. CORPO PRINCIPALE MOBILE
          ======================================================== */}
      <div className="pt-[calc(6.25rem+env(safe-area-inset-top,0px))] px-3.5 pb-24 space-y-4">
        
        {/* Header Data Context */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#a73a00] uppercase tracking-widest">
              {locationInfo?.shortName || (activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese')}
            </span>
            <h1 className="font-serif text-xl font-bold text-[#0a474b]">
              Sportello Richieste &amp; Ferie
            </h1>
          </div>
          <span className="text-[10px] bg-white border border-[#e2e8e4] text-neutral-600 px-2.5 py-1 rounded-full font-semibold shadow-2xs">
            Mobile Staff
          </span>
        </div>

        {/* Alert di Successo */}
        {isSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2.5 text-emerald-900 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Operazione completata!</p>
              <p className="text-emerald-700 text-[11px]">{successMsg}</p>
            </div>
          </div>
        )}

        {/* ========================================================
            3. BOX PROPOSTE DI SCAMBIO RICEVUTE (Step 1: Collega)
            ======================================================== */}
        {incomingSwapRequests.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-nicora-orange/60 rounded-2xl p-4 shadow-clean space-y-3 animate-in slide-in-from-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-nicora-orange text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <ArrowLeftRight size={13} />
                </span>
                <h3 className="font-serif text-sm font-bold text-amber-950">
                  Proposte di Scambio per Te ({incomingSwapRequests.length})
                </h3>
              </div>
              <span className="text-[9px] bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                Azione Richiesta
              </span>
            </div>

            <p className="text-[11px] text-amber-900/90 leading-tight">
              Un collega ha proposto uno scambio turno con te. Se accetti, la richiesta verrà inoltrata alla direzione per la convalida definitiva.
            </p>

            <div className="space-y-2 pt-1">
              {incomingSwapRequests.map((req) => {
                const requester = getEmployee(req.requesterId);
                return (
                  <div key={req.id} className="bg-white rounded-xl p-3 border border-amber-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-nicora-orange-light text-nicora-orange font-bold text-xs flex items-center justify-center">
                          {requester?.avatar || requester?.name.slice(0, 2).toUpperCase() || 'NC'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">
                            {requester?.name} ({requester?.role})
                          </p>
                          <span className="text-[10px] text-neutral-400">Inviata: {req.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-xs space-y-1 text-neutral-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500">Turno proposto:</span>
                        <strong className="text-nicora-teal">{req.shiftDate}</strong>
                      </div>
                      {req.targetShiftDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-neutral-500">In cambio del tuo:</span>
                          <strong className="text-nicora-orange">{req.targetShiftDate}</strong>
                        </div>
                      )}
                      <p className="text-[11px] italic text-neutral-600 pt-1 border-t border-neutral-200/60">
                        "{req.reason}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAcceptSwap(req.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-transform"
                      >
                        <UserCheck size={14} />
                        <span>Accetta Scambio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectSwap(req.id)}
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                      >
                        <XCircle size={14} />
                        <span>Rifiuta</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            4. FORM DI INSERIMENTO NUOVA RICHIESTA
            ======================================================== */}
        <div className="bg-white rounded-2xl p-4 border border-nicora-sage-border shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-nicora-orange" />
              <h3 className="font-serif text-sm font-semibold text-nicora-title">
                Nuova Richiesta
              </h3>
            </div>
            <span className="text-[10px] text-neutral-400">Sede: {locationInfo?.shortName}</span>
          </div>

          {/* Slider 4 Opzioni: Ferie | Scambio | Orario | Malattia */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRequestType('leave')}
              className={`py-2 px-0.5 rounded-lg text-[11px] font-bold transition-all text-center ${
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
              className={`py-2 px-0.5 rounded-lg text-[11px] font-bold transition-all text-center ${
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
              className={`py-2 px-0.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                requestType === 'schedule_change'
                  ? 'bg-[#b7791f] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Orario
            </button>

            <button
              type="button"
              onClick={() => setRequestType('sick')}
              className={`py-2 px-0.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                requestType === 'sick'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Malattia
            </button>
          </div>

          {/* Banner illustrativo per tipologia */}
          {requestType === 'swap' && (
            <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-orange-950">
              <Info size={15} className="text-nicora-orange shrink-0 mt-0.5" />
              <span>
                <strong>Flusso a 2 passaggi:</strong> La proposta verrà inviata al collega. Se accetta, la richiesta passerà al responsabile per l'approvazione finale.
              </span>
            </div>
          )}

          {requestType === 'sick' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-rose-950">
              <HeartPulse size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Avviso tempestivo turni:</strong> Segnala l'assenza per riorganizzare il punto vendita. Ricorda di trasmettere il PUC telematico INPS alle Risorse Umane.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {/* Campo Data */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {requestType === 'sick' ? 'Data inizio assenza:' : 'Data turno interessato:'}
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-teal focus:outline-none"
                required
              />
            </div>

            {/* Campi specifici per SCAMBIO TURNO */}
            {requestType === 'swap' && (
              <>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Collega con cui scambiare:
                  </label>
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-orange focus:outline-none"
                    required
                  >
                    {eligibleColleagues.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Data del turno del collega in cambio:
                  </label>
                  <input
                    type="date"
                    value={targetShiftDate}
                    onChange={(e) => setTargetShiftDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-orange focus:outline-none"
                    required
                  />
                </div>
              </>
            )}

            {/* Campi specifici per VARIAZIONE ORARIO */}
            {requestType === 'schedule_change' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">Dalle:</label>
                    <input
                      type="time"
                      value={requestedStartTime}
                      onChange={(e) => setRequestedStartTime(e.target.value)}
                      className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-2 py-1.5 font-bold text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">Alle:</label>
                    <input
                      type="time"
                      value={requestedEndTime}
                      onChange={(e) => setRequestedEndTime(e.target.value)}
                      className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-2 py-1.5 font-bold text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CONTINUATO_SLOTS.slice(0, 3).map((slot, idx) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => {
                        setRequestedStartTime(slot.start);
                        setRequestedEndTime(slot.end);
                      }}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 shrink-0"
                    >
                      {slot.start}-{slot.end}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campi specifici per MALATTIA */}
            {requestType === 'sick' && (
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Numero Protocollo INPS / PUC (opzionale):
                </label>
                <input
                  type="text"
                  value={protocolNumber}
                  onChange={(e) => setProtocolNumber(e.target.value)}
                  placeholder="Es. PUC 12345678"
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-neutral-800 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            )}

            {/* Motivazione */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {requestType === 'sick' ? 'Note / Sintomi:' : 'Motivazione:'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  requestType === 'swap'
                    ? 'Es. Posso coprire il tuo orario di sabato se prendi il mio giovedì...'
                    : requestType === 'sick'
                    ? 'Es. Sintomi influenzali, visita medica dal curante...'
                    : 'Inserisci motivo della richiesta...'
                }
                className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-nicora-teal focus:outline-none"
                rows={2}
                required
              />
            </div>

            {/* Pulsante Invia */}
            <button
              type="submit"
              className={`w-full text-white font-extrabold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 text-xs active:scale-95 transition-transform ${
                requestType === 'swap'
                  ? 'bg-nicora-orange hover:bg-nicora-orange-hover'
                  : requestType === 'sick'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-nicora-teal hover:bg-nicora-teal-dark'
              }`}
            >
              <Send size={14} />
              <span>
                {requestType === 'swap'
                  ? 'Invia Proposta al Collega'
                  : requestType === 'sick'
                  ? 'Invia Segnalazione Malattia'
                  : 'Invia alla Direzione'}
              </span>
            </button>
          </form>
        </div>

        {/* ========================================================
            5. STORICO DELLE RICHIESTE
            ======================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="font-serif text-sm font-semibold text-nicora-title">
              Richieste di Sede ({storeRequests.length})
            </h3>
            <span className="text-[10px] text-neutral-400">Archivio e attive</span>
          </div>

          {storeRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center text-xs text-neutral-400 border border-dashed border-nicora-sage-border">
              Nessuna richiesta presentata al momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {storeRequests.map((req) => {
                const requester = getEmployee(req.requesterId);
                const target = req.targetEmployeeId ? getEmployee(req.targetEmployeeId) : null;
                const isMyReq = req.requesterId === currentEmployeeId;
                const isTargetOfReq = req.targetEmployeeId === currentEmployeeId;

                // Definizione badge e stato chiaro a due passaggi
                let badgeClass = 'bg-amber-100 text-amber-900 border-amber-200';
                let badgeLabel = '⏳ In attesa';

                if (req.status === 'approved') {
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  badgeLabel = '✓ Approvata';
                } else if (req.status === 'rejected') {
                  badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
                  badgeLabel = '✕ Rifiutata Direzione';
                } else if (req.status === 'pending_colleague') {
                  badgeClass = 'bg-orange-100 text-orange-900 border-orange-200';
                  badgeLabel = target ? `⏳ Attesa ${target.name}` : '⏳ Attesa Collega';
                } else if (req.status === 'rejected_colleague') {
                  badgeClass = 'bg-neutral-200 text-neutral-700 border-neutral-300';
                  badgeLabel = '✕ Rifiutata dal Collega';
                } else if (req.type === 'swap' && req.status === 'pending') {
                  badgeClass = 'bg-sky-100 text-sky-800 border-sky-200';
                  badgeLabel = '🤝 Accettato • Attesa Titolare';
                }

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-xl p-3.5 border shadow-2xs text-xs space-y-2.5 transition-all ${
                      isMyReq
                        ? 'border-nicora-orange ring-1 ring-nicora-orange/40'
                        : isTargetOfReq
                        ? 'border-sky-300 bg-sky-50/20'
                        : 'border-nicora-sage-border'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-nicora-teal-light text-nicora-teal font-bold text-xs flex items-center justify-center shrink-0">
                          {requester?.avatar || requester?.name.slice(0, 2).toUpperCase() || 'NC'}
                        </div>
                        <span className="font-serif font-semibold text-neutral-800 truncate">
                          {requester?.name} {isMyReq && '(Tu)'}
                        </span>
                      </div>

                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border shrink-0 ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-600 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>Data turno: <strong>{req.shiftDate}</strong></span>
                        <span className="font-bold text-neutral-700">
                          {req.type === 'swap'
                            ? 'Scambio'
                            : req.type === 'leave'
                            ? 'Ferie'
                            : req.type === 'sick'
                            ? 'Malattia'
                            : 'Orario'}
                        </span>
                      </div>

                      {req.type === 'swap' && target && (
                        <div className="flex items-center gap-1.5 text-nicora-orange font-semibold pt-0.5">
                          <ArrowLeftRight size={12} />
                          <span>Scambio con: <strong>{target.name}</strong> {isTargetOfReq && '(Tu)'}</span>
                          {req.targetShiftDate && (
                            <span className="text-neutral-500 font-normal">({req.targetShiftDate})</span>
                          )}
                        </div>
                      )}

                      {req.type === 'sick' && req.protocolNumber && (
                        <div className="text-rose-700 font-semibold">
                          Protocollo INPS: {req.protocolNumber}
                        </div>
                      )}

                      {req.type === 'schedule_change' && (
                        <div className="text-[#b7791f] font-semibold">
                          Orario concordato: {req.requestedStartTime} - {req.requestedEndTime}
                        </div>
                      )}
                    </div>

                    <p className="bg-neutral-50 p-2 rounded-lg text-neutral-600 text-[11px] italic">
                      "{req.reason}"
                    </p>

                    {req.colleagueNote && (
                      <p className="text-[10px] text-sky-900 bg-sky-50 p-2 rounded-lg border border-sky-200">
                        {req.colleagueNote}
                      </p>
                    )}

                    {req.managerNote && (
                      <p className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <strong>Nota Direzione:</strong> {req.managerNote}
                      </p>
                    )}

                    {/* AZIONI: Risposta del Collega Destinatario */}
                    {isTargetOfReq && req.status === 'pending_colleague' && (
                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-amber-800">
                          Confermi lo scambio con {requester?.name}?
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAcceptSwap(req.id)}
                            className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]"
                          >
                            Accetta
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectSwap(req.id)}
                            className="bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-[10px]"
                          >
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AZIONI: Approvazione Finale della Direzione (Manager Mode) */}
                    {isManagerMode && req.status === 'pending' && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {req.type === 'swap' ? 'Colleghi concordi' : 'In attesa Direzione'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(req.id, 'approved', 'Approvata dalla Direzione')}
                            className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-[10px] shadow-xs active:scale-95"
                          >
                            Approva
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(req.id, 'rejected', 'Non conciliabile con la copertura')}
                            className="bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-[10px] active:scale-95"
                          >
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
