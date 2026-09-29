import React, { useState } from 'react';
import { Employee, LocationId, ShiftRequest, ShiftRequestStatus, ShiftRequestType } from '../../domain/types';
import { CONTINUATO_SLOTS } from '../../domain/rules';
import { 
  ArrowLeftRight, 
  Calendar, 
  CalendarOff, 
  CheckCircle2, 
  Clock, 
  HeartPulse, 
  Info, 
  MapPin, 
  Send, 
  ShieldAlert, 
  Sparkles, 
  UserCheck, 
  Users, 
  XCircle 
} from 'lucide-react';
import { LOCATIONS } from '../../domain/mockData';

interface LeaveRequestsDesktopProps {
  currentEmployee?: Employee;
  currentEmployeeId: string;
  employees: Employee[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: ShiftRequestStatus, note?: string) => void;
  activeLocation: LocationId;
}

export const LeaveRequestsDesktop: React.FC<LeaveRequestsDesktopProps> = ({
  currentEmployee,
  currentEmployeeId,
  employees,
  requests,
  onSubmitRequest,
  isManagerMode,
  onUpdateStatus,
  activeLocation,
}) => {
  const [requestType, setRequestType] = useState<ShiftRequestType>('leave');
  
  const myEmployee = currentEmployee || employees.find((e) => e.id === currentEmployeeId);
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation && e.isActive !== false && !e.isOwner);
  const eligibleColleagues = storeEmployees.filter((e) => e.id !== currentEmployeeId);

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
  const [successMsg, setSuccessMsg] = useState('Richiesta registrata con successo!');

  const storeRequests = requests.filter((r) => r.locationId === activeLocation);
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation);

  // Proposte di scambio indirizzate specificamente all'utente loggato
  const incomingSwapRequests = requests.filter(
    (r) => r.type === 'swap' && r.targetEmployeeId === currentEmployeeId && r.status === 'pending_colleague'
  );

  const pendingManagerCount = storeRequests.filter((r) => r.status === 'pending').length;
  const swapCount = storeRequests.filter((r) => r.type === 'swap').length;
  const myRequestsCount = storeRequests.filter((r) => r.requesterId === currentEmployeeId).length;

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
      setSuccessMsg(`Proposta di scambio turno inviata a ${colleague?.name || 'collega'}. Verrà inoltrata al responsabile appena il collega accetterà.`);
    } else if (requestType === 'sick') {
      setSuccessMsg('Segnalazione assenza per malattia registrata e trasmessa alla Direzione.');
    } else {
      setSuccessMsg(`Richiesta inoltrata alla direzione di ${locationInfo?.shortName || activeLocation} per la revisione.`);
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

  const locationAddress = activeLocation === 'gazzada' 
    ? 'Viale Gallarate 26, Gazzada Schianno (VA)' 
    : 'Via Carnia 2, Varese (VA)';

  return (
    <div className="max-w-[1280px] w-full mx-auto space-y-7 pb-16">
      
      {/* ========================================================
          1. HEADER DESKTOP ELEGANTE (Stile "Dentro oggi")
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-nicora-orange-light text-nicora-orange font-bold text-xs uppercase tracking-wider border border-nicora-orange-border">
              {locationInfo?.name || 'Nicora Garden'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200 shadow-2xs">
              <Sparkles size={14} className="text-emerald-600" />
              <span>Sportello Collaboratori</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-nicora-muted text-xs">
              <MapPin size={14} className="text-nicora-teal" />
              <span>{locationAddress}</span>
            </span>
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl text-nicora-title font-medium tracking-tight">
            Gestione Richieste &amp; Ferie
          </h1>
          <p className="text-sm text-nicora-muted">
            Piattaforma collaboratori per ferie programmate, scambi diretti concordati tra colleghi e segnalazioni assenza.
          </p>
        </div>

        {/* 3 Quick KPI Badges */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-white border border-nicora-sage-border shadow-2xs min-w-[110px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-nicora-muted">In Attesa Titolare</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-serif text-2xl font-bold text-nicora-orange">{pendingManagerCount}</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">Da convalidare</span>
          </div>

          <div className="flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-white border border-nicora-sage-border shadow-2xs min-w-[110px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-nicora-muted">Scambi Turno</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-serif text-2xl font-bold text-nicora-teal">{swapCount}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">Reciproci</span>
          </div>

          <div className="flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-white border border-nicora-sage-border shadow-2xs min-w-[110px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-nicora-muted">Tue Richieste</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-serif text-2xl font-bold text-neutral-800">{myRequestsCount}</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">{myEmployee?.name || 'Personali'}</span>
          </div>
        </div>
      </div>

      {/* Alert di Successo */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sm">Operazione completata con successo!</p>
            <p className="text-emerald-700">{successMsg}</p>
          </div>
        </div>
      )}

      {/* ========================================================
          2. BANNER PROPOSTE DI SCAMBIO RICEVUTE (Step 1: Collega)
          ======================================================== */}
      {incomingSwapRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-nicora-orange/60 rounded-2xl p-5 shadow-clean space-y-4 animate-in slide-in-from-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-nicora-orange text-white flex items-center justify-center shadow-xs">
                <ArrowLeftRight size={16} />
              </span>
              <div>
                <h3 className="font-serif text-base font-bold text-amber-950">
                  Proposte di Scambio Turno Ricevute ({incomingSwapRequests.length})
                </h3>
                <p className="text-xs text-amber-900/80">
                  Un collega desidera scambiare il turno con te. Se accetti, la proposta verrà inoltrata alla Direzione per la conferma ufficiale.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-200/90 text-amber-900 text-xs font-bold uppercase tracking-wider animate-pulse">
              Azione Richiesta
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {incomingSwapRequests.map((req) => {
              const requester = getEmployee(req.requesterId);
              return (
                <div key={req.id} className="bg-white rounded-xl p-4 border border-amber-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-nicora-orange-light text-nicora-orange font-bold text-xs flex items-center justify-center">
                        {requester?.avatar || requester?.name.slice(0, 2).toUpperCase() || 'NC'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-800">
                          {requester?.name} <span className="text-xs font-normal text-neutral-500">({requester?.role})</span>
                        </p>
                        <span className="text-[11px] text-neutral-400">Inviata: {req.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs space-y-1.5 text-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Turno proposto da {requester?.name}:</span>
                      <strong className="text-nicora-teal font-bold">{req.shiftDate}</strong>
                    </div>
                    {req.targetShiftDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">In cambio del tuo turno del:</span>
                        <strong className="text-nicora-orange font-bold">{req.targetShiftDate}</strong>
                      </div>
                    )}
                    <p className="text-xs italic text-neutral-600 pt-1.5 border-t border-neutral-200/60">
                      "{req.reason}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAcceptSwap(req.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
                    >
                      <UserCheck size={15} />
                      <span>Accetta Scambio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectSwap(req.id)}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <XCircle size={15} />
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
          3. GRIGLIA PRINCIPALE: Form a sinistra, Archivio a destra
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Interactive Request Form */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-nicora-sage-border p-6 shadow-2xs space-y-6">
            
            {/* Header del Form */}
            <div className="flex items-center justify-between border-b border-nicora-sage-border pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-nicora-orange" />
                <h2 className="font-serif text-lg font-semibold text-nicora-title">
                  Compila Nuova Richiesta
                </h2>
              </div>
              <span className="text-xs text-neutral-400">Punto vendita: {locationInfo?.shortName}</span>
            </div>

            {/* Slider 4 Opzioni: Ferie | Scambio | Orario | Malattia */}
            <div className="grid grid-cols-4 gap-2 p-1.5 bg-neutral-100/90 rounded-2xl">
              <button
                type="button"
                onClick={() => setRequestType('leave')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  requestType === 'leave'
                    ? 'bg-nicora-teal text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <CalendarOff size={15} />
                <span>Ferie &amp; Permessi</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('swap')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  requestType === 'swap'
                    ? 'bg-nicora-orange text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <ArrowLeftRight size={15} />
                <span>Scambio Turno</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('schedule_change')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  requestType === 'schedule_change'
                    ? 'bg-[#b7791f] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <Clock size={15} />
                <span>Variazione Orario</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('sick')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  requestType === 'sick'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <HeartPulse size={15} />
                <span>Malattia</span>
              </button>
            </div>

            {/* Banner esplicativi per tipo */}
            {requestType === 'swap' && (
              <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-orange-950">
                <Info size={18} className="text-nicora-orange shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Workflow di Scambio a Due Passaggi:</p>
                  <p className="text-orange-900 leading-relaxed">
                    La richiesta viene inoltrata primariamente al collega selezionato. Solo quando il collega esprime il suo assenso ("Accetta Scambio"), la richiesta viene trasmessa al titolare/responsabile per l'approvazione formale e la modifica dei turni.
                  </p>
                </div>
              </div>
            )}

            {requestType === 'sick' && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-rose-950">
                <HeartPulse size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Avviso Tempestivo Turnazione Punto Vendita:</p>
                  <p className="text-rose-900 leading-relaxed">
                    La segnalazione nell'app consente di visualizzare immediatamente l'assenza e suggerire sostituti rapidi per i reparti di cassa e vivaio. Il certificato telematico medico (PUC INPS) va comunque inviato entro le 48 ore canoniche alle Risorse Umane/Amministrazione.
                  </p>
                </div>
              </div>
            )}

            {/* Form effettivo */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {requestType === 'sick' ? 'Data inizio assenza:' : 'Data turno da variare / scambiare:'}
                  </label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-4 py-2.5 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-teal focus:outline-none"
                    required
                  />
                </div>

                {requestType === 'swap' && (
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Data del turno del collega in cambio:
                    </label>
                    <input
                      type="date"
                      value={targetShiftDate}
                      onChange={(e) => setTargetShiftDate(e.target.value)}
                      className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-4 py-2.5 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-orange focus:outline-none"
                      required
                    />
                  </div>
                )}

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
                      className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-4 py-2.5 text-neutral-800 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {requestType === 'swap' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Seleziona il collega con cui desideri effettuare lo scambio:
                  </label>
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-4 py-2.5 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-orange focus:outline-none cursor-pointer"
                    required
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
                <label className="block font-semibold text-neutral-700 mb-1">
                  {requestType === 'sick' ? 'Dettagli / Sintomi per la sede:' : 'Motivazione o note per la direzione:'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    requestType === 'swap'
                      ? 'Es. Posso coprire la tua domenica se copri il mio turno giovedì...'
                      : requestType === 'sick'
                      ? 'Es. Sintomi influenzali, visita medica dal curante...'
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
                  className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-bold text-xs shadow-xs transition-transform active:scale-[0.99] ${
                    requestType === 'swap'
                      ? 'bg-nicora-orange hover:bg-nicora-orange-hover'
                      : requestType === 'sick'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-nicora-teal hover:bg-nicora-teal-dark'
                  }`}
                >
                  <Send size={15} />
                  <span>
                    {requestType === 'swap'
                      ? 'Invia Proposta al Collega'
                      : requestType === 'sick'
                      ? 'Invia Segnalazione Malattia'
                      : 'Invia Richiesta alla Direzione'}
                  </span>
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
                      className={`bg-white rounded-2xl p-5 border shadow-2xs space-y-3 transition-all ${
                        isMyReq
                          ? 'border-nicora-orange ring-1 ring-nicora-orange/40'
                          : isTargetOfReq
                          ? 'border-sky-300 bg-sky-50/20'
                          : 'border-nicora-sage-border'
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
                                  : req.type === 'sick'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}>
                                {req.type === 'swap'
                                  ? 'Scambio Turno'
                                  : req.type === 'leave'
                                  ? 'Ferie / Permesso'
                                  : req.type === 'sick'
                                  ? 'Malattia'
                                  : 'Variazione Orario'}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400">Data richiesta: {req.shiftDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        </div>
                      </div>

                      {req.type === 'swap' && target && (
                        <p className="text-xs text-neutral-700 flex items-center gap-2">
                          <ArrowLeftRight size={14} className="text-nicora-orange" />
                          <span>
                            Proposta di scambio con <strong>{target.name}</strong> {isTargetOfReq && '(Tu)'}
                            {req.targetShiftDate && (
                              <span className="text-neutral-500 ml-1">
                                (Turno suo del: <strong>{req.targetShiftDate}</strong>)
                              </span>
                            )}
                          </span>
                        </p>
                      )}

                      {req.type === 'sick' && req.protocolNumber && (
                        <p className="text-xs text-rose-800 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                          Numero Protocollo Telematico INPS (PUC): <strong>{req.protocolNumber}</strong>
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

                      {req.colleagueNote && (
                        <p className="text-xs text-sky-900 bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                          <strong>Risposta Collega:</strong> {req.colleagueNote}
                        </p>
                      )}

                      {req.managerNote && (
                        <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          <strong>Nota Direzione:</strong> {req.managerNote}
                        </p>
                      )}

                      {/* Azioni del Collega o del Manager */}
                      <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-100 flex-wrap gap-2">
                        <span>Inviata: {req.createdAt}</span>

                        {/* Se sono il collega bersaglio e la richiesta attende me */}
                        {isTargetOfReq && req.status === 'pending_colleague' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-900 mr-1">
                              Accetti lo scambio con {requester?.name}?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAcceptSwap(req.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs"
                            >
                              <UserCheck size={13} /> Accetta Scambio
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectSwap(req.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                            >
                              <XCircle size={13} /> Rifiuta
                            </button>
                          </div>
                        )}

                        {/* Se sono il manager e la richiesta è pronta per approvazione finale */}
                        {isManagerMode && req.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-500 mr-1">
                              {req.type === 'swap' ? 'Colleghi concordi' : 'In attesa Direzione'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(req.id, 'approved', 'Approvata dalla Direzione')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 size={13} /> Approva Richiesta
                            </button>
                            <button
                              type="button"
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
              <span>Regole di Preavviso &amp; Scambi</span>
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Le richieste di ferie programmate devono essere presentate con <strong>almeno 7-10 giorni</strong> di anticipo per garantire la copertura dei reparti di cassa e vivaio.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1.5 pl-3 list-disc">
              <li><strong>Scambi tra colleghi:</strong> Richiedono prima l'accettazione del collega destinatario, e successivamente il nulla osta della direzione.</li>
              <li>Presidio minimo garantito di almeno 1 persona in cassa e fioreria in ogni momento.</li>
            </ul>
          </div>

          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-6 shadow-2xs space-y-3">
            <h3 className="font-serif text-base font-semibold text-rose-700 flex items-center gap-2">
              <HeartPulse size={18} />
              <span>Assenze per Malattia</span>
            </h3>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Per assenze improvvise di salute, compila tempestivamente la segnalazione qui per riorganizzare il punto vendita e contatta il responsabile.
            </p>
            <p className="text-[11px] text-neutral-500">
              Ricordati di trasmettere il numero di protocollo telematico INPS (PUC) all'amministrazione/HR entro 48 ore dall'inizio dell'evento.
            </p>
          </div>
        </aside>

      </div>

    </div>
  );
};
