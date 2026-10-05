import React, { useState, useEffect } from 'react';
import { Employee, LocationId, Shift, ShiftRequest, ShiftRequestStatus, ShiftRequestType } from '../../domain/types';
import { CONTINUATO_SLOTS } from '../../domain/rules';
import { formatItalianDate } from '../../engine/schedulerEngine';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
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
  shifts: Shift[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: ShiftRequestStatus, note?: string, colleagueNote?: string) => void;
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onLogout?: () => void;
  onSaveEmployee?: (emp: Employee) => void;
}

const isWorkingShift = (s?: Shift): boolean =>
  Boolean(s && (s.type === 'giornata' || s.type === 'mattina' || s.type === 'pomeriggio'));

export const LeaveRequestsMobile: React.FC<LeaveRequestsMobileProps> = ({
  currentEmployee,
  currentEmployeeId,
  employees,
  shifts,
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
  const isManagerUser = Boolean(isManagerMode || myEmployee?.isOwner || myEmployee?.isManager);

  const gazzadaStaffCount = employees.filter((e) => e.locationId === 'gazzada' && e.isActive !== false && !e.isOwner).length;
  const vareseStaffCount = employees.filter((e) => e.locationId === 'varese' && e.isActive !== false && !e.isOwner).length;

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
  const [successMsg, setSuccessMsg] = useState('Richiesta inviata con successo!');
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

  // Proposte di scambio turno ricevute dal dipendente loggato in attesa della sua approvazione
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
          `Errore: non puoi richiedere uno scambio per il ${formatItalianDate(shiftDate)} perché in quella data ${statusLabel}. Seleziona un giorno in cui sei effettivamente in turno.`
        );
        return;
      }

      const selectedColleagueEntry = colleaguesInTurnOnTargetDate.find(
        (c) => c.employee.id === targetEmployeeId
      );

      if (!targetEmployeeId || !selectedColleagueEntry) {
        setErrorMsg(
          `Errore: il collega selezionato non ha un turno lavorativo attivo il giorno ${formatItalianDate(targetShiftDate)}. Seleziona una data e un collega effettivamente in turno.`
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
        `Proposta di scambio inviata a ${selectedColleagueEntry.employee.name} (Reparto ${colleagueEffectiveDept}). Verrà inoltrata al responsabile appena il collega accetterà.`
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
              {isManagerUser ? 'Approvazione Richieste & Ferie' : 'Sportello Richieste & Ferie'}
            </h1>
          </div>
          <span className="text-[10px] bg-white border border-[#e2e8e4] text-neutral-600 px-2.5 py-1 rounded-full font-semibold shadow-2xs">
            {isManagerUser ? 'Direzione' : 'Mobile Staff'}
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

        {/* Alert di Errore Validazione */}
        {errorMsg && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 flex items-start gap-2.5 text-rose-900 animate-in fade-in shadow-xs">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-rose-800">Impossibile inviare la proposta</p>
              <p className="text-rose-700 text-[11px] leading-snug">{errorMsg}</p>
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
              Un collega ha proposto uno scambio turno con te. Controlla il giorno, il reparto e l'orario che andrai a coprire: se accetti, la richiesta passerà alla direzione per l'approvazione finale.
            </p>

            <div className="space-y-2.5 pt-1">
              {incomingSwapRequests.map((req) => {
                const requester = getEmployee(req.requesterId);
                const swapInfo = getSwapDetails(req);
                return (
                  <div key={req.id} className="bg-white rounded-xl p-3 border border-amber-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-nicora-orange-light text-nicora-orange font-bold text-xs flex items-center justify-center">
                          {requester?.avatar || requester?.name.slice(0, 2).toUpperCase() || 'NC'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">
                            {requester?.name} <span className="font-normal text-neutral-500">• ti propone uno scambio</span>
                          </p>
                          <span className="text-[10px] text-neutral-400">Inviata: {req.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dettaglio completo del turno che il collega ricevente andrà a fare e di quello che cede */}
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="bg-teal-50/80 p-2.5 rounded-xl border border-teal-200 space-y-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-nicora-teal">
                          👉 Turno che andrai a fare (al posto di {requester?.name}):
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-600">Giorno:</span>
                          <strong className="text-neutral-900 font-bold">{swapInfo.reqDate}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-600">Reparto assegnato:</span>
                          <span className="px-2 py-0.5 rounded-md bg-nicora-teal text-white font-bold text-[10px]">
                            {swapInfo.reqDept}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-600">Orario da svolgere:</span>
                          <strong className="text-nicora-teal font-bold">{swapInfo.reqHours}</strong>
                        </div>
                      </div>

                      <div className="bg-orange-50/80 p-2.5 rounded-xl border border-orange-200 space-y-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-nicora-orange">
                          🔄 Il tuo turno che cedi a {requester?.name}:
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-600">Giorno ceduto:</span>
                          <strong className="text-neutral-900 font-bold">{swapInfo.targetDate}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-600">Il tuo reparto:</span>
                          <span className="px-2 py-0.5 rounded-md bg-orange-200/80 text-orange-950 font-bold text-[10px]">
                            {swapInfo.targetDept}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-600">Il tuo orario:</span>
                          <strong className="text-nicora-orange font-bold">{swapInfo.targetHours}</strong>
                        </div>
                      </div>
                    </div>

                    <p className="bg-neutral-50 p-2 rounded-lg text-[11px] italic text-neutral-600 border border-neutral-100">
                      "{req.reason}"
                    </p>

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
            4. FORM DI INSERIMENTO NUOVA RICHIESTA (Solo Collaboratori)
            ======================================================== */}
        {!isManagerUser && (
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
                <strong>Flusso a 2 passaggi:</strong> Scegli la data del tuo turno e quella del turno del collega. Il sistema mostra i reparti reali assegnati in quei giorni.
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
            {/* Campo Data del richiedente */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {requestType === 'sick'
                  ? 'Data inizio assenza:'
                  : requestType === 'swap'
                  ? 'Data turno da variare / scambiare (tuo turno):'
                  : 'Data turno interessato:'}
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-teal focus:outline-none"
                required
              />

              {/* Box reparto effettivo del richiedente nel giorno shiftDate */}
              {requestType === 'swap' && (
                <div className="mt-1.5">
                  {myShiftOnDate ? (
                    <div className="bg-teal-50/90 border border-teal-200 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] text-teal-950">
                      <span>
                        Il tuo turno del <strong>{formatItalianDate(shiftDate)}</strong>:
                      </span>
                      <span className="font-bold text-nicora-teal">
                        Reparto {myShiftOnDate.department || myEmployee?.role} ({myShiftOnDate.startTime || '08:30'} - {myShiftOnDate.endTime || '17:00'})
                      </span>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-1.5 text-[11px] text-rose-800 font-semibold">
                      <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                      <span>
                        Non hai un turno lavorativo attivo il {formatItalianDate(shiftDate)} (
                        {myRawShiftOnDate?.type === 'riposo'
                          ? 'Riposo'
                          : myRawShiftOnDate?.type === 'ferie'
                          ? 'Ferie'
                          : myRawShiftOnDate?.type === 'malattia'
                          ? 'Malattia'
                          : 'Nessun turno'}
                        ).
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campi specifici per SCAMBIO TURNO: 1. Data turno collega -> 2. Selettore colleghi in turno */}
            {requestType === 'swap' && (
              <>
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

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Collega effettivamente in turno il {formatItalianDate(targetShiftDate)}:
                  </label>
                  {colleaguesInTurnOnTargetDate.length > 0 ? (
                    <select
                      value={targetEmployeeId}
                      onChange={(e) => setTargetEmployeeId(e.target.value)}
                      className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3 py-2 text-neutral-800 font-semibold text-xs focus:ring-2 focus:ring-nicora-orange focus:outline-none"
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
                    <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2.5 flex items-center gap-2 text-[11px] text-amber-900 font-semibold">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span>
                        Nessun collega risulta in turno lavorativo il {formatItalianDate(targetShiftDate)} in questa sede. Seleziona un'altra data.
                      </span>
                    </div>
                  )}
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
                  {CONTINUATO_SLOTS.slice(0, 3).map((slot) => (
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
        )}

        {/* ========================================================
            5. STORICO DELLE RICHIESTE
            ======================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="font-serif text-sm font-semibold text-nicora-title">
              {isManagerUser 
                ? `Richieste di Sede (${visibleRequests.length})` 
                : `Le mie richieste (${visibleRequests.length})`}
            </h3>
            <span className="text-[10px] text-neutral-400">
              {isManagerUser ? 'Archivio e attive' : 'Storico personale'}
            </span>
          </div>

          {visibleRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center text-xs text-neutral-400 border border-dashed border-nicora-sage-border">
              {isManagerUser
                ? 'Nessuna richiesta presentata al momento per questa sede.'
                : 'Non hai ancora presentato alcuna richiesta.'}
            </div>
          ) : (
            <div className="space-y-2.5">
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

                    <div className="text-[11px] text-neutral-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Data turno: <strong>{formatItalianDate(req.shiftDate)}</strong></span>
                        <span className="font-bold text-neutral-700">
                          {req.type === 'swap'
                            ? 'Scambio Turno'
                            : req.type === 'leave'
                            ? 'Ferie'
                            : req.type === 'sick'
                            ? 'Malattia'
                            : 'Orario'}
                        </span>
                      </div>

                      {req.type === 'swap' && target && swapInfo && (
                        <div className="bg-orange-50/60 border border-orange-200/80 rounded-lg p-2 space-y-1.5 mt-1">
                          <div className="flex items-center gap-1.5 text-nicora-orange font-bold">
                            <ArrowLeftRight size={12} />
                            <span>
                              Scambio tra <strong>{requester?.name}</strong> e <strong>{target.name}</strong> {isTargetOfReq && '(Tu)'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-1 text-[10px] text-neutral-700 pt-1 border-t border-orange-200/50">
                            <div>
                              • <strong>{target.name}</strong> copre il <strong>{swapInfo.reqDate}</strong> in <strong>{swapInfo.reqDept}</strong> ({swapInfo.reqHours})
                            </div>
                            <div>
                              • <strong>{requester?.name}</strong> copre il <strong>{swapInfo.targetDate}</strong> in <strong>{swapInfo.targetDept}</strong> ({swapInfo.targetHours})
                            </div>
                          </div>
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
                          {req.type === 'swap' ? 'Colleghi concordi • Scambia i turni' : 'In attesa Direzione'}
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
