import React, { useState } from 'react';
import { Employee, LocationId, ScheduleMode, Shift, ShiftRequest } from '../../domain/types';
import { formatItalianDate, formatLocalDate, generateMonthlySchedule } from '../../engine/schedulerEngine';
import { recordDraftGenerated } from '../../services/storageService';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  UserSearch,
  X,
  Zap,
} from 'lucide-react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: LocationId;
  employees: Employee[];
  requests: ShiftRequest[];
  existingShifts?: Shift[];
  onApplyShifts: (newShifts: Shift[]) => void;
  onJumpToDate?: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

export const GenerateModal: React.FC<GenerateModalProps> = ({
  isOpen,
  onClose,
  locationId,
  employees,
  requests,
  existingShifts = [],
  onApplyShifts,
  onJumpToDate,
}) => {
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1; // 1 - 12
  const currentYearNum = now.getFullYear();

  const nextMonthNum = currentMonthNum === 12 ? 1 : currentMonthNum + 1;
  const nextYearNum = currentMonthNum === 12 ? currentYearNum + 1 : currentYearNum;

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);
  const [mode, setMode] = useState<ScheduleMode>('standard');
  const [isChristmasSeason, setIsChristmasSeason] = useState<boolean>(false);
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [resultStats, setResultStats] = useState<any | null>(null);

  if (!isOpen) return null;

  const todayStr = formatLocalDate(new Date());
  const monthPrefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const existingMonthShifts = (existingShifts || []).filter(
    (s) => s.locationId === locationId && s.date.startsWith(monthPrefix)
  );
  const existingMonthShiftsCount = existingMonthShifts.length;
  const isCurrentMonthSelected = selectedYear === currentYearNum && selectedMonth === currentMonthNum;
  const pastProtectedCount = existingMonthShifts.filter((s) => s.date < todayStr).length;

  const handleGenerate = () => {
    const result = generateMonthlySchedule({
      locationId,
      employees,
      year: selectedYear,
      month: selectedMonth,
      requests,
      existingShifts,
      mode,
      isChristmasSeason,
      overwriteExisting,
    });

    recordDraftGenerated(locationId, selectedYear, selectedMonth);
    setResultStats(result.stats);
    onApplyShifts(result.shifts);
  };

  const storeStaff = employees.filter((e) => e.locationId === locationId && e.isActive !== false && !e.isOwner);
  const selectedMonthName = MONTH_NAMES[selectedMonth - 1];

  // Generazione opzioni tendina (anno corrente e successivo)
  const dropdownOptions: { month: number; year: number; label: string }[] = [];
  [currentYearNum, currentYearNum + 1].forEach((yr) => {
    MONTH_NAMES.forEach((mName, idx) => {
      const mNum = idx + 1;
      // Includi mesi dal mese corrente in poi per l'anno attuale, e tutti per l'anno prossimo
      if (yr > currentYearNum || mNum >= currentMonthNum) {
        dropdownOptions.push({
          month: mNum,
          year: yr,
          label: `${mName} ${yr}`,
        });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-nicora-teal text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-nicora-orange flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg leading-tight">
                Pianificazione Mensile Turni
              </h3>
              <p className="text-xs text-nicora-teal-light/85 capitalize mt-0.5">
                Punto Vendita: <strong className="text-white">{locationId === 'gazzada' ? 'Gazzada Schianno' : 'Varese'}</strong> ({storeStaff.length} collaboratori)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Selettore Mese (Ispirato a decisione /grill-me: Pulsanti rapidi + tendina) */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-nicora-sage-border space-y-3">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
              <Calendar size={15} className="text-nicora-orange" />
              <span>Seleziona il Mese da Pianificare:</span>
            </label>

            {/* Pulsanti Rapidi Mese Corrente & Prossimo Mese */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(currentMonthNum);
                  setSelectedYear(currentYearNum);
                  setResultStats(null);
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedMonth === currentMonthNum && selectedYear === currentYearNum
                    ? 'bg-nicora-teal-dark text-white border-nicora-teal-dark shadow-sm'
                    : 'bg-white text-neutral-700 border-nicora-sage-border hover:bg-neutral-100'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Mese Corrente</div>
                <div className="font-serif font-bold text-sm mt-0.5">
                  {MONTH_NAMES[currentMonthNum - 1]} {currentYearNum}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(nextMonthNum);
                  setSelectedYear(nextYearNum);
                  setResultStats(null);
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedMonth === nextMonthNum && selectedYear === nextYearNum
                    ? 'bg-nicora-teal-dark text-white border-nicora-teal-dark shadow-sm'
                    : 'bg-white text-neutral-700 border-nicora-sage-border hover:bg-neutral-100'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Prossimo Mese</div>
                <div className="font-serif font-bold text-sm mt-0.5">
                  {MONTH_NAMES[nextMonthNum - 1]} {nextYearNum}
                </div>
              </button>
            </div>

            {/* Tendina Mese Altro */}
            <div className="pt-1 flex items-center justify-between gap-2 border-t border-neutral-200">
              <span className="text-[11px] font-semibold text-neutral-600">Oppure scegli un altro mese:</span>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [yr, m] = e.target.value.split('-').map(Number);
                  setSelectedYear(yr);
                  setSelectedMonth(m);
                  setResultStats(null);
                }}
                className="bg-white border border-nicora-sage-border rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs cursor-pointer focus:ring-2 focus:ring-nicora-teal focus:outline-none"
              >
                {dropdownOptions.map((opt) => (
                  <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modalità Orario (Standard vs Continuato) */}
          <div className="space-y-2">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
              <Clock size={15} className="text-nicora-orange" />
              <span>Modalità Orario di Servizio:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('standard');
                  setResultStats(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === 'standard'
                    ? 'bg-nicora-orange-light border-nicora-orange text-neutral-900 ring-2 ring-nicora-orange/20 shadow-xs'
                    : 'bg-white border-nicora-sage-border text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="font-bold text-xs text-nicora-title">Orario Standard (Spezzato)</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Mattina (08:30–12:30), Pomeriggio (14:30–19:30) o giornata intera.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('continuato');
                  setResultStats(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === 'continuato'
                    ? 'bg-nicora-orange-light border-nicora-orange text-neutral-900 ring-2 ring-nicora-orange/20 shadow-xs'
                    : 'bg-white border-nicora-sage-border text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="font-bold text-xs text-nicora-orange">
                  Orario Continuato (Ott–Dic)
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Scaglioni 09:00, 10:00, 11:00 con pausa e chiusura ore 19:00.
                </p>
              </button>
            </div>
          </div>

          {/* Opzione Stagionale Natale (Solo per Varese da Settembre in poi) */}
          {locationId === 'varese' && (
            <div className={`p-3.5 rounded-2xl border transition-all ${
              isChristmasSeason
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200'
                : 'bg-neutral-50/80 border-neutral-200'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">🎄</span>
                  <div>
                    <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                      <span>Stagione Autunno / Allestimento Natale</span>
                      {isChristmasSeason && (
                        <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                          Attivo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                      Assegna prioritariamente i 2 collaboratori specializzati al reparto <strong>Natale</strong> (Matteo & Stefano).
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isChristmasSeason}
                    onChange={(e) => {
                      setIsChristmasSeason(e.target.checked);
                      setResultStats(null);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Modalità di Sovrascrittura */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <RefreshCw size={17} className="text-nicora-teal flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5 flex-wrap">
                    <span>Sovrascrivi bozza esistente del mese</span>
                    {existingMonthShiftsCount > 0 && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                        {existingMonthShiftsCount} turni presenti
                      </span>
                    )}
                    {isCurrentMonthSelected && pastProtectedCount > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1">
                        <ShieldCheck size={11} className="text-emerald-700" />
                        {pastProtectedCount} passati congelati
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                    {isCurrentMonthSelected
                      ? `Ricalcola i turni da oggi in avanti applicando le impostazioni correnti. I ${pastProtectedCount} turni passati sono protetti e congelati al 100% per non perdere lo storico.`
                      : 'Ricalcola tutti i turni del mese da zero applicando le modifiche attuali (toggle Natale, orari, competenze). Se disattivato, preserva i turni compilati.'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => {
                    setOverwriteExisting(e.target.checked);
                    setResultStats(null);
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nicora-teal"></div>
              </label>
            </div>
          </div>

          {/* Vincoli e Regole Nicora Applicate */}
          <div className="bg-[#e6f0eb]/70 border border-[#80b4b9]/50 rounded-2xl p-3.5 space-y-1.5 text-neutral-800">
            <span className="font-bold flex items-center gap-1.5 text-xs text-nicora-teal">
              <ShieldCheck size={16} className="text-emerald-700 flex-shrink-0" />
              <span>Regole Operative Nicora Applicate alla Generazione:</span>
            </span>
            <ul className="text-[11px] space-y-1 pl-1 text-neutral-700 list-disc list-inside">
              <li><strong>Pianifica l'intero mese in una sola botta</strong> (tutte le settimane Domenica ➔ Sabato).</li>
              <li><strong>Protezione Storico Turni Passati</strong>: nei mesi correnti tutti i turni con data precedente a oggi sono congelati e protetti al 100%.</li>
              <li><strong>Gestione turni futuri</strong>: {overwriteExisting ? 'Bozza da oggi in poi sovrascritta e ricalcolata per recepire tutti i nuovi parametri.' : 'Preserva i turni già fissati a mano.'}</li>
              <li><strong>Recepisce ferie e malattie già approvate</strong>: chi è in permesso non viene assegnato ai reparti.</li>
              <li><strong>Recepisce entrate posticipate e uscite anticipate</strong> approvate con orario personalizzato.</li>
              <li><strong>5 giorni lavorativi su 7</strong> per ciascun collaboratore (2 riposi settimanali garantiti).</li>
              <li><strong>Presidio reparti specifici di sede</strong>: {locationId === 'gazzada' ? 'Gazzada (Cassa, Fioreria, Serra Calda, Serra Fredda, Area Tecnica).' : `Varese (Cassa, Fioreria, Decor, Emporio, Serra Calda, Serra Fredda${isChristmasSeason ? ', Natale' : ''}).`}</li>
            </ul>
          </div>

          {/* Risultato della generazione */}
          {resultStats && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-2.5 animate-in fade-in">
              <div className="font-bold text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Bozza di {selectedMonthName} {selectedYear} Generata!</span>
                </span>
                <span className="bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] shadow-xs">
                  {resultStats.totalShifts} Turni
                </span>
              </div>

              <div className="text-[11px] space-y-1 text-emerald-900">
                <p>
                  • Turni totali per il mese: <strong>{resultStats.totalShifts}</strong>.
                </p>
                {resultStats.preservedPastShiftsCount !== undefined && resultStats.preservedPastShiftsCount > 0 && (
                  <p className="flex items-center gap-1 text-emerald-800 font-medium">
                    <ShieldCheck size={13} className="text-emerald-700 flex-shrink-0" />
                    <span><strong>{resultStats.preservedPastShiftsCount}</strong> turni passati congelati e preservati al 100%.</span>
                  </p>
                )}
                {resultStats.newlyGeneratedShiftsCount !== undefined && (
                  <p>
                    • Turni generati da oggi in poi: <strong>{resultStats.newlyGeneratedShiftsCount}</strong>.
                  </p>
                )}
                <p>
                  • Presidio Cassa medio: <strong>{resultStats.cassaCoverageScore}%</strong>.
                </p>
                <p className="flex items-center gap-1 text-emerald-800 font-medium">
                  <CheckCircle2 size={13} className="text-emerald-700 flex-shrink-0" />
                  <span>Regola riposi applicata: 2 gg contigui garantiti al mese a rotazione per ciascun dipendente (giorni disaccoppiati nelle altre settimane).</span>
                </p>
                <div>
                  • Stato Copertura Reparti:{' '}
                  {resultStats.allDepartmentsCovered ? (
                    <strong className="text-emerald-800">✅ 100% Tutti i reparti presidiati per l'intero mese.</strong>
                  ) : (
                    <div className="mt-2 p-3 bg-rose-100/80 border border-rose-300/80 rounded-2xl space-y-2">
                      <div className="flex items-start gap-2 text-rose-950 font-bold">
                        <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span>Rilevati {resultStats.uncoveredDays.length} giorni con presidi incompleti</span>
                          <span className="block text-[10px] text-rose-800 font-normal mt-0.5">
                            Date: {resultStats.uncoveredDays.map((d: any) => formatItalianDate(typeof d === 'string' ? d : d.dateStr)).join(', ')}
                          </span>
                        </div>
                      </div>
                      {onJumpToDate && resultStats.uncoveredDays.length > 0 && (() => {
                        const firstItem = resultStats.uncoveredDays[0];
                        const firstDate = typeof firstItem === 'string' ? firstItem : firstItem.dateStr;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onJumpToDate(firstDate);
                            }}
                            className="w-full bg-nicora-orange hover:bg-nicora-orange-hover text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                          >
                            <UserSearch size={14} />
                            <span>Risolvi Prima Criticità ({formatItalianDate(firstDate)})</span>
                            <ArrowRight size={14} />
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-nicora-sage-border p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-800"
          >
            {resultStats ? 'Chiudi' : 'Annulla'}
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="bg-nicora-orange hover:bg-nicora-orange-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 transition-transform"
          >
            <Sparkles size={16} />
            <span>{resultStats ? 'Rigenera Mese' : `Genera Bozza ${selectedMonthName} ${selectedYear}`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
