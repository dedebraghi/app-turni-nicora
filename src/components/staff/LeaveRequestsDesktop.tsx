import React, { useState, useEffect } from 'react';
import { Employee, LocationId, Shift, ShiftRequest, ShiftRequestStatus, ShiftRequestType } from '../../domain/types';
import { CONTINUATO_SLOTS } from '../../domain/rules';
import { formatItalianDate } from '../../engine/schedulerEngine';
import { 
  AlertTriangle,
  ArrowLeftRight, 
  CalendarOff, 
  CheckCircle2, 
  Clock, 
  HeartPulse, 
  Info, 
  MapPin, 
  Send, 
  Sparkles, 
  UserCheck, 
  XCircle 
} from 'lucide-react';
import { LOCATIONS } from '../../domain/mockData';

interface LeaveRequestsDesktopProps {
  currentEmployee?: Employee;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: ShiftRequestStatus, note?: string, colleagueNote?: string) => void;
  activeLocation: LocationId;
}

const isWorkingShift = (s?: Shift): boolean =>
  Boolean(s && (s.type === 'giornata' || s.type === 'mattina' || s.type === 'pomeriggio'));

export const LeaveRequestsDesktop: React.FC<LeaveRequestsDesktopProps> = ({
  currentEmployee,
  currentEmployeeId,
  employees,
  shifts,
  requests,
  onSubmitRequest,
  isManagerMode,
  onUpdateStatus,
  activeLocation,
}) => {
  const [requestType, setRequestType] = useState<ShiftRequestType>('leave');
  
  const myEmployee = currentEmployee || employees.find((e) => e.id === currentEmployeeId);
  const isManagerUser = Boolean(isManagerMode || myEmployee?.isOwner || myEmployee?.isManager);

  const [shiftDate, setShiftDate] = useState<string>(() =>
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [targetShiftDate, setTargetShiftDate] = useState<string>(() =>
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );

  // Turno effettivo del richiedente nel giorno shiftDate
  const myRawShiftOnDate = shifts.find(
    (s) => s.employeeId === currentEmployeeId && s.date === shiftDate
  );
  const myShiftOnDate = isWorkingShift(myRawShiftOnDate) ? myRawShiftOnDate : undefined;

  // Colleghi effettivamente in turno lavorativo nel giorno targetShiftDate nella sede attiva
  const colleaguesInTurnOnTargetDate = employees
    .filter((emp) => emp.isActive !== false && !emp.isOwner && emp.id !== currentEmployeeId)
    .map((emp) => {
      const shift = shifts.find(
        (s) =>
          s.employeeId === emp.id &&
          s.date === targetShiftDate &&
          s.locationId === activeLocation &&
          isWorkingShift(s)
      );
      return shift ? { employee: emp, shift } : null;
    })
    .filter((item): item is { employee: Employee; shift: Shift } => item !== null);

  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(
    () => colleaguesInTurnOnTargetDate[0]?.employee.id || ''
  );

  // Sincronizza automaticamente il collega selezionato quando cambia targetShiftDate o i turni
  useEffect(() => {
    const stillValid = colleaguesInTurnOnTargetDate.some((c) => c.employee.id === targetEmployeeId);
    if (!stillValid) {
      setTargetEmployeeId(colleaguesInTurnOnTargetDate[0]?.employee.id || '');
    }
  }, [targetShiftDate, activeLocation, shifts, currentEmployeeId]);

  const [requestedStartTime, setRequestedStartTime] = useState('10:00');
  const [requestedEndTime, setRequestedEndTime] = useState('18:30');
  const [protocolNumber, setProtocolNumber] = useState('');
  const [reason, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('Richiesta registrata con successo!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pulisce eventuali errori quando l'utente modifica i campi
  useEffect(() => {
    setErrorMsg(null);
  }, [requestType, shiftDate, targetShiftDate, targetEmployeeId]);

  const storeRequests = requests.filter((r) => r.locationId === activeLocation);
  // Privacy collaboratore: un dipendente normale vede ESCLUSIVAMENTE le proprie richieste o scambi in cui è destinatario
  const visibleRequests = isManagerUser
    ? storeRequests
    : storeRequests.filter((r) => r.requesterId === currentEmployeeId || r.targetEmployeeId === currentEmployeeId);
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation);

  // Proposte di scambio indirizzate specificamente all'utente loggato
  const incomingSwapRequests = requests.filter(
    (r) => r.type === 'swap' && r.targetEmployeeId === currentEmployeeId && r.status === 'pending_colleague'
  );

  const getEmployee = (empId: string) => employees.find((e) => e.id === empId);

  const getSwapDetails = (req: ShiftRequest) => {
    const requester = getEmployee(req.requesterId);
    const target = req.targetEmployeeId ? getEmployee(req.targetEmployeeId) : undefined;
    const reqDate = req.shiftDate;
    const targetDate = req.targetShiftDate || req.shiftDate;

    const liveReqShift = shifts.find((s) => s.employeeId === req.requesterId && s.date === reqDate);
    const liveTargetShift = req.targetEmployeeId
      ? shifts.find((s) => s.employeeId === req.targetEmployeeId && s.date === targetDate)
      : undefined;

    const reqDept =
      (req.status === 'approved' ? req.requesterDepartment : liveReqShift?.department) ||
      req.requesterDepartment ||
      liveReqShift?.department ||
      requester?.role ||
      'Non assegnato';
    const reqStart =
      (req.status === 'approved' ? req.requesterStartTime : liveReqShift?.startTime) ||
      req.requesterStartTime ||
      liveReqShift?.startTime ||
      '08:30';
    const reqEnd =
      (req.status === 'approved' ? req.requesterEndTime : liveReqShift?.endTime) ||
      req.requesterEndTime ||
      liveReqShift?.endTime ||
      '17:00';

    const targetDept =
      (req.status === 'approved' ? req.targetDepartment : liveTargetShift?.department) ||
      req.targetDepartment ||
      liveTargetShift?.department ||
      target?.role ||
      'Non assegnato';
    const targetStart =
      (req.status === 'approved' ? req.targetStartTime : liveTargetShift?.startTime) ||
      req.targetStartTime ||
      liveTargetShift?.startTime ||
      '08:30';
    const targetEnd =
      (req.status === 'approved' ? req.targetEndTime : liveTargetShift?.endTime) ||
      req.targetEndTime ||
      liveTargetShift?.endTime ||
      '17:00';

    return {
      reqDate: formatItalianDate(reqDate),
      reqDept,
      reqHours: `${reqStart} - ${reqEnd}`,
      targetDate: formatItalianDate(targetDate),
      targetDept,
      targetHours: `${targetStart} - ${targetEnd}`,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reason.trim()) {
      setErrorMsg('Inserisci una motivazione per la richiesta.');
      return;
    }

    if (requestType === 'swap') {
      if (!myShiftOnDate) {
        const statusLabel =
          myRawShiftOnDate?.type === 'riposo'
            ? 'risulti a riposo'
            : myRawShiftOnDate?.type === 'ferie'
            ? 'risulti in ferie'
            : myRawShiftOnDate?.type === 'malattia'
            ? 'risulti in malattia'
            : 'non hai alcun turno assegnato';
        setErrorMsg(
          `Errore: non puoi inviare la proposta di scambio perché il giorno ${shiftDate} ${statusLabel}. Seleziona una data in cui hai un turno lavorativo attivo.`
        );
        return;
      }

      const selectedColleagueEntry = colleaguesInTurnOnTargetDate.find(
        (c) => c.employee.id === targetEmployeeId
      );

      if (!targetEmployeeId || !selectedColleagueEntry) {
        setErrorMsg(
          `Errore: nessun collega valido in turno selezionato per il giorno ${formatItalianDate(targetShiftDate)}. Verifica che ci sia almeno un collega in turno in quella data.`
        );
        return;
      }

      const myEffectiveDept = myShiftOnDate.department || myEmployee?.role || 'Cassa';
      const colleagueEffectiveDept =
        selectedColleagueEntry.shift.department || selectedColleagueEntry.employee.role || 'Cassa';

      onSubmitRequest({
        requesterId: currentEmployeeId,
        locationId: activeLocation,
        type: 'swap',
        targetEmployeeId,
        shiftDate,
        targetShiftDate,
        requesterDepartment: myEffectiveDept,
        requesterStartTime: myShiftOnDate.startTime || '08:30',
        requesterEndTime: myShiftOnDate.endTime || '17:00',
        targetDepartment: colleagueEffectiveDept,
        targetStartTime: selectedColleagueEntry.shift.startTime || '08:30',
        targetEndTime: selectedColleagueEntry.shift.endTime || '17:00',
        reason,
      });

      setSuccessMsg(
        `Proposta di scambio turno inviata a ${selectedColleagueEntry.employee.name} (in turno in ${colleagueEffectiveDept} il ${formatItalianDate(targetShiftDate)}). Verrà inoltrata al responsabile appena il collega accetterà.`
      );
      setReason('');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000);
      return;
    }

    onSubmitRequest({
      requesterId: currentEmployeeId,
      locationId: activeLocation,
      type: requestType,
      shiftDate,
      requestedStartTime: requestType === 'schedule_change' ? requestedStartTime : undefined,
      requestedEndTime: requestType === 'schedule_change' ? requestedEndTime : undefined,
      protocolNumber: requestType === 'sick' ? protocolNumber : undefined,
      reason,
    });

    if (requestType === 'sick') {
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
      undefined,
      `Accettato dal collega (${myEmployee?.name || 'collega'}). In attesa di approvazione della Direzione.`
    );
  };

  const handleRejectSwap = (reqId: string) => {
    onUpdateStatus(
      reqId,
      'rejected_colleague',
      undefined,
      `Rifiutato dal collega (${myEmployee?.name || 'collega'}).`
    );
  };

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
            <span className="hidden sm:inline-flex items-center gap-1 text-nicora-muted text-xs">
              <MapPin size={14} className="text-nicora-teal" />
              <span>{locationAddress}</span>
            </span>
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl text-nicora-title font-medium tracking-tight">
            {isManagerUser ? 'Approvazione Richieste & Ferie' : 'Gestione Richieste & Ferie'}
          </h1>
          <p className="text-sm text-nicora-muted">
            {isManagerUser
              ? 'Pannello Direzione per la valutazione, approvazione o rifiuto delle richieste di ferie, scambi turno e assenze del personale.'
              : 'Piattaforma collaboratori per ferie programmate, scambi diretti concordati tra colleghi e segnalazioni assenza.'}
          </p>
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

      {/* Alert di Errore Validazione */}
      {errorMsg && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-900 animate-in fade-in shadow-xs">
          <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-sm text-rose-800">Impossibile inviare la proposta</p>
            <p className="text-rose-700 leading-relaxed">{errorMsg}</p>
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
                  Un collega desidera scambiare il turno con te. Verifica il giorno, il reparto assegnato e l'orario che andrai a coprire prima di accettare.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-200/90 text-amber-900 text-xs font-bold uppercase tracking-wider animate-pulse">
              Azione Richiesta
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {incomingSwapRequests.map((req) => {
              const requester = getEmployee(req.requesterId);
              const swapInfo = getSwapDetails(req);
              return (
                <div key={req.id} className="bg-white rounded-xl p-4 border border-amber-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-nicora-orange-light text-nicora-orange font-bold text-xs flex items-center justify-center">
                        {requester?.avatar || requester?.name.slice(0, 2).toUpperCase() || 'NC'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-800">
                          {requester?.name} <span className="text-xs font-normal text-neutral-500">• ti propone uno scambio</span>
                        </p>
                        <span className="text-[11px] text-neutral-400">Inviata: {req.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Riepilogo dettagliato dei due turni coinvolti */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-teal-50/80 p-3 rounded-xl border border-teal-200 space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-nicora-teal">
                        👉 Turno che andrai a fare tu:
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Giorno:</span>
                        <strong className="text-neutral-900 font-bold">{swapInfo.reqDate}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Reparto:</span>
                        <span className="px-2 py-0.5 rounded-md bg-nicora-teal text-white font-bold text-[11px]">
                          {swapInfo.reqDept}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Orario:</span>
                        <strong className="text-nicora-teal font-bold">{swapInfo.reqHours}</strong>
                      </div>
                    </div>

                    <div className="bg-orange-50/80 p-3 rounded-xl border border-orange-200 space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-nicora-orange">
                        🔄 Il tuo turno che cedi:
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Giorno:</span>
                        <strong className="text-neutral-900 font-bold">{swapInfo.targetDate}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Reparto:</span>
                        <span className="px-2 py-0.5 rounded-md bg-orange-200/80 text-orange-950 font-bold text-[11px]">
                          {swapInfo.targetDept}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Orario:</span>
                        <strong className="text-nicora-orange font-bold">{swapInfo.targetHours}</strong>
                      </div>
                    </div>
                  </div>

                  <p className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 text-xs italic text-neutral-600">
                    "{req.reason}"
                  </p>

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
          3. GRIGLIA PRINCIPALE: Form a sinistra (se collaboratore), Archivio/Gestione
          ======================================================== */}
      <div className={`grid grid-cols-1 ${isManagerUser ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6`}>
        
        {/* Left Column (5 cols): Interactive Request Form (Solo Collaboratori) */}
        {!isManagerUser && (
          <section className="lg:col-span-5 space-y-6">
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
                    Seleziona la data del tuo turno da scambiare e la data del turno del collega. Il sistema rileva automaticamente il tuo reparto assegnato e ti mostra solo i colleghi effettivamente in turno in quella data con il loro reparto reale.
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

              {/* Riepilogo turno richiedente + Selettore collega filtrato per i presenti nel giorno targetShiftDate */}
              {requestType === 'swap' && (
                <div className="space-y-3">
                  {/* Box verifica del turno del richiedente nel giorno shiftDate */}
                  <div>
                    <span className="block font-semibold text-neutral-700 mb-1">
                      Il tuo turno rilevato il {formatItalianDate(shiftDate)}:
                    </span>
                    {myShiftOnDate ? (
                      <div className="bg-teal-50/90 border border-teal-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-teal-950">
                        <span className="font-medium">
                          Reparto affidato:{' '}
                          <strong className="px-2 py-0.5 rounded-md bg-nicora-teal text-white font-bold ml-1">
                            {myShiftOnDate.department || myEmployee?.role}
                          </strong>
                        </span>
                        <span className="font-bold text-nicora-teal">
                          Orario: {myShiftOnDate.startTime || '08:30'} – {myShiftOnDate.endTime || '17:00'}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs text-rose-800 font-semibold">
                        <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                        <span>
                          Attenzione: il giorno <strong>{formatItalianDate(shiftDate)}</strong> non hai un turno lavorativo attivo (
                          {myRawShiftOnDate?.type === 'riposo'
                            ? 'sei a riposo'
                            : myRawShiftOnDate?.type === 'ferie'
                            ? 'sei in ferie'
                            : myRawShiftOnDate?.type === 'malattia'
                            ? 'sei in malattia'
                            : 'nessun turno assegnato'}
                          ).
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Menu a tendina colleghi effettivamente in turno il giorno targetShiftDate */}
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Seleziona il collega in turno il {formatItalianDate(targetShiftDate)} con cui scambiare:
                    </label>
                    {colleaguesInTurnOnTargetDate.length > 0 ? (
                      <select
                        value={targetEmployeeId}
                        onChange={(e) => setTargetEmployeeId(e.target.value)}
                        className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-4 py-2.5 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-orange focus:outline-none cursor-pointer"
                        required
                      >
                        {colleaguesInTurnOnTargetDate.map(({ employee: emp, shift }) => {
                          const actualDept = shift.department || emp.role;
                          const actualHours = `${shift.startTime || '08:30'} - ${shift.endTime || '17:00'}`;
                          return (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} — Reparto: {actualDept} ({actualHours})
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-semibold">
                        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                        <span>
                          Nessun collega risulta in turno lavorativo il <strong>{formatItalianDate(targetShiftDate)}</strong> in questa sede. Seleziona un'altra data.
                        </span>
                      </div>
                    )}
                  </div>
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
        </section>
        )}

        {/* Right Column (7 cols or full width if manager): Storico e Approvazione Richieste */}
        <section className={`${isManagerUser ? 'lg:col-span-1 max-w-4xl mx-auto w-full' : 'lg:col-span-7'} space-y-4`}>
          {/* Storico Richieste Desktop */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-semibold text-nicora-title">
                {isManagerUser
                  ? `Tutte le richieste — ${locationInfo?.name} (${visibleRequests.length})`
                  : `Le mie richieste (${visibleRequests.length})`}
              </h3>
              <span className="text-xs text-neutral-400">
                {isManagerUser ? 'Archivio e richieste attive' : 'Storico personale'}
              </span>
            </div>

            {visibleRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-xs text-neutral-400 border border-dashed border-nicora-sage-border">
                {isManagerUser
                  ? 'Nessuna richiesta presentata al momento per questa sede.'
                  : 'Non hai ancora presentato alcuna richiesta.'}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleRequests.map((req) => {
                  const requester = getEmployee(req.requesterId);
                  const target = req.targetEmployeeId ? getEmployee(req.targetEmployeeId) : null;
                  const isMyReq = req.requesterId === currentEmployeeId;
                  const isTargetOfReq = req.targetEmployeeId === currentEmployeeId;
                  const swapInfo = req.type === 'swap' ? getSwapDetails(req) : null;

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
                            <span className="text-[11px] text-neutral-400">Data richiesta: {formatItalianDate(req.shiftDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        </div>
                      </div>

                      {req.type === 'swap' && target && swapInfo && (
                        <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-3 space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-nicora-orange font-bold">
                            <ArrowLeftRight size={14} />
                            <span>
                              Proposta di scambio tra <strong>{requester?.name}</strong> e <strong>{target.name}</strong> {isTargetOfReq && '(Tu)'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-orange-200/60">
                            <div className="bg-white/80 rounded-lg p-2 border border-orange-100">
                              <div className="text-[10px] uppercase font-bold text-nicora-teal">
                                Turno coperto da {target.name}:
                              </div>
                              <div className="text-neutral-800 mt-0.5">
                                📅 <strong>{swapInfo.reqDate}</strong> • Reparto: <strong>{swapInfo.reqDept}</strong> ({swapInfo.reqHours})
                              </div>
                            </div>
                            <div className="bg-white/80 rounded-lg p-2 border border-orange-100">
                              <div className="text-[10px] uppercase font-bold text-nicora-orange">
                                Turno coperto da {requester?.name}:
                              </div>
                              <div className="text-neutral-800 mt-0.5">
                                📅 <strong>{swapInfo.targetDate}</strong> • Reparto: <strong>{swapInfo.targetDept}</strong> ({swapInfo.targetHours})
                              </div>
                            </div>
                          </div>
                        </div>
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
                              {req.type === 'swap' ? 'Colleghi concordi • Scambia i turni' : 'In attesa Direzione'}
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

      </div>

    </div>
  );
};
