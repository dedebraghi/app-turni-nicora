import React, { useState, useEffect } from 'react';
import { Department, Employee, LocationId, LocationInfo, Shift, WeekDayMeta } from '../../domain/types';
import { DEPARTMENT_COLORS, SHIFT_COLORS } from '../../domain/rules';
import {
  calculateDayCoverage,
  calculateEmployeeWeeklyHours,
  calculateWeekHourlyCoverage,
  WeekCoverageAnalysis,
} from '../../engine/schedulerEngine';
import { StaffSubstitutionWizard } from './StaffSubstitutionWizard';
import { MobileHeader } from '../layout/MobileHeader';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Edit3,
  Flower2,
  MapPin,
  Receipt,
  Search,
  Share2,
  Sparkles,
  Sun,
  TreePine,
  UserSearch,
  Users,
  Zap,
} from 'lucide-react';

interface MobileDayViewProps {
  location: LocationInfo;
  employees: Employee[];
  shifts: Shift[];
  weekDays: WeekDayMeta[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isManagerMode: boolean;
  onEditShift: (shift: Shift) => void;
  onOpenGenerateModal?: () => void;
  onOpenExportModal?: () => void;
  onOpenEmergencyModal?: (shift?: Shift) => void;
  onApplyShift?: (newShift: Shift) => void;
  currentEmployee?: Employee;
  activeLocation?: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onLogout?: () => void;
  onSaveEmployee?: (emp: Employee) => void;
  allStoreEmployees?: Employee[];
}

// Icone e temi per reparto in stile Stitch / Nicora
const getDeptTheme = (dept: string) => {
  switch (dept) {
    case 'Cassa':
      return {
        bgAvatar: 'bg-[#ffdbce]',
        textAvatar: 'text-[#a73a00]',
        icon: Receipt,
        badgeBg: 'bg-[#ffdbce]/70 text-[#a73a00] border-[#edd9cd]',
      };
    case 'Fioreria':
      return {
        bgAvatar: 'bg-[#d7e7d1]',
        textAvatar: 'text-[#202e1f]',
        icon: Flower2,
        badgeBg: 'bg-[#d7e7d1]/70 text-[#202e1f] border-[#c5d8be]',
      };
    case 'Decor':
      return {
        bgAvatar: 'bg-[#f3e8ff]',
        textAvatar: 'text-[#6b21a8]',
        icon: Sparkles,
        badgeBg: 'bg-[#f3e8ff]/80 text-[#6b21a8] border-[#e9d5ff]',
      };
    case 'Serra Calda':
      return {
        bgAvatar: 'bg-[#b7ecf0]',
        textAvatar: 'text-[#002f32]',
        icon: Sun,
        badgeBg: 'bg-[#b7ecf0]/70 text-[#002f32] border-[#9bd0d4]',
      };
    case 'Serra Fredda':
    default:
      return {
        bgAvatar: 'bg-[#e6f0eb]',
        textAvatar: 'text-[#285c54]',
        icon: TreePine,
        badgeBg: 'bg-[#e6f0eb] text-[#285c54] border-[#cfe0d8]',
      };
  }
};

export const MobileDayView: React.FC<MobileDayViewProps> = ({
  location,
  employees,
  shifts,
  weekDays,
  selectedDateStr,
  onSelectDate,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  isManagerMode,
  onEditShift,
  onOpenGenerateModal,
  onOpenExportModal,
  onOpenEmergencyModal,
  onApplyShift,
  currentEmployee,
  activeLocation = location.id,
  onChangeLocation,
  onLogout,
  onSaveEmployee,
  allStoreEmployees = employees,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const selectedDayMeta = weekDays.find((d) => d.dateStr === selectedDateStr) || weekDays[0];

  // Gestione stato "Ignora" per la settimana selezionata
  const weekStartDate = weekDays[0]?.dateStr || '';
  const ignoredStorageKey = `nicora_ignored_alert_${activeLocation}_${weekStartDate}`;
  const [isAlertIgnored, setIsAlertIgnored] = useState<boolean>(() => {
    return localStorage.getItem(ignoredStorageKey) === 'true';
  });

  useEffect(() => {
    setIsAlertIgnored(localStorage.getItem(ignoredStorageKey) === 'true');
  }, [ignoredStorageKey]);

  const handleIgnoreAlert = () => {
    localStorage.setItem(ignoredStorageKey, 'true');
    setIsAlertIgnored(true);
  };

  // Analisi completa delle scoperture della settimana (sia critiche che orarie parziali)
  const weekAnalysis: WeekCoverageAnalysis = calculateWeekHourlyCoverage(weekDays, shifts);

  // Turni del giorno selezionato
  const dayShifts = shifts.filter((s) => s.date === selectedDayMeta.dateStr);

  // Turni lavorativi effettivi del giorno corrente
  const workingShifts = dayShifts.filter(
    (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );

  // Calcolo conteggi per ciascun reparto per il giorno selezionato
  const getDeptWorkingCount = (dept: string) => {
    if (dept === 'all') {
      return workingShifts.length;
    }
    return workingShifts.filter((s) => {
      const emp = employees.find((e) => e.id === s.employeeId);
      const effectiveDept = s.department || emp?.role;
      return (
        effectiveDept === dept ||
        (dept === 'Cassa' && (s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa')))
      );
    }).length;
  };

  // Filtraggio collaboratori
  const filteredEmployees = employees.filter((emp) => {
    if (emp.isActive === false) return false;
    const shift = dayShifts.find((s) => s.employeeId === emp.id);
    const isWorking = shift && shift.type !== 'riposo' && shift.type !== 'ferie' && shift.type !== 'malattia';
    const effectiveDept = shift?.department || emp.role;

    // Filtro per testo ricerca
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(shift?.areaNote && shift.areaNote.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filtro per reparto
    if (selectedDeptFilter === 'all') {
      return true;
    }

    // Se è selezionato un reparto specifico (es. Cassa):
    // Mostra SOLO chi lavora effettivamente in quel reparto nel giorno selezionato!
    if (!isWorking) return false;

    const isAssignedToDept =
      effectiveDept === selectedDeptFilter ||
      (selectedDeptFilter === 'Cassa' && (shift?.department === 'Cassa' || shift?.areaNote?.toLowerCase().includes('cassa')));

    return isAssignedToDept;
  });

  // Ordinamento: chi lavora prima (Cassa, poi altri reparti), poi riposo e assenze
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const shiftA = dayShifts.find((s) => s.employeeId === a.id);
    const shiftB = dayShifts.find((s) => s.employeeId === b.id);

    const isOffA = !shiftA || shiftA.type === 'riposo' || shiftA.type === 'ferie' || shiftA.type === 'malattia';
    const isOffB = !shiftB || shiftB.type === 'riposo' || shiftB.type === 'ferie' || shiftB.type === 'malattia';

    if (!isOffA && isOffB) return -1;
    if (isOffA && !isOffB) return 1;

    if (!isOffA && !isOffB) {
      const isCassaA = shiftA?.department === 'Cassa' || shiftA?.areaNote?.toLowerCase().includes('cassa');
      const isCassaB = shiftB?.department === 'Cassa' || shiftB?.areaNote?.toLowerCase().includes('cassa');
      if (isCassaA && !isCassaB) return -1;
      if (!isCassaA && isCassaB) return 1;
    }

    return a.name.localeCompare(b.name);
  });

  const gazzadaStaffCount = allStoreEmployees.filter((e) => e.locationId === 'gazzada' && e.isActive !== false).length || 10;
  const vareseStaffCount = allStoreEmployees.filter((e) => e.locationId === 'varese' && e.isActive !== false).length || 16;

  // Formattazione intervallo settimana (es. "Dom 20 — Sab 26 Ott")
  const startDay = weekDays[0];
  const endDay = weekDays[6];
  const endDayDate = new Date(`${endDay.dateStr}T12:00:00`);
  const monthName = endDayDate.toLocaleDateString('it-IT', { month: 'short' });
  const dateRangeLabel = `${startDay.dayShort} ${startDay.dayNum} — ${endDay.dayShort} ${endDay.dayNum} ${monthName}`;

  return (
    <div className="relative min-h-screen bg-nicora-surface">
      {/* 1. HEADER MOBILE UFFICIALE (Stile Stitch) */}
      <MobileHeader
        title="Tabellone"
        employee={currentEmployee}
        activeLocation={activeLocation}
        onChangeLocation={onChangeLocation}
        gazzadaStaffCount={gazzadaStaffCount}
        vareseStaffCount={vareseStaffCount}
        onLogout={onLogout}
        onSaveEmployee={onSaveEmployee}
      />

      {/* 2. CORPO PRINCIPALE (con padding superiore per header fisso) */}
      <div className="pt-[calc(6.25rem+env(safe-area-inset-top,0px))] px-3.5 pb-24 space-y-3.5">
        
        {/* --- SCHEDA SEDE & SELETTORE PERIODO (Ispirata a Stitch) --- */}
        <div className="flex flex-col bg-white rounded-2xl p-3.5 border border-nicora-sage-border shadow-clean space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar size={18} className="text-nicora-orange flex-shrink-0" />
              <span className="font-serif font-bold text-base text-nicora-title truncate">
                {dateRangeLabel}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-nicora-orange-light text-nicora-orange border border-nicora-orange-border text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
              {weekOffset === 0 ? 'Settimana Attuale' : weekOffset === 1 ? 'Prossima Settimana' : `Offset ${weekOffset > 0 ? '+' : ''}${weekOffset} sett.`}
            </span>
          </div>

          <div className="flex items-center justify-between text-neutral-500 pt-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-nicora-teal min-w-0">
              <MapPin size={14} className="text-emerald-700 flex-shrink-0" />
              <span className="truncate">{location.name}</span>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-600 font-normal whitespace-nowrap">{employees.length} Collaboratori</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onPrevWeek}
                aria-label="Settimana precedente"
                className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 active:scale-95 transition-transform hover:bg-neutral-200"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={onNextWeek}
                aria-label="Settimana successiva"
                className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 active:scale-95 transition-transform hover:bg-neutral-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* --- BOTTONI AZIONE PRIMARI (Genera Bozza & WhatsApp/Stampa) --- */}
        <div className="grid grid-cols-2 gap-2">
          {isManagerMode && onOpenGenerateModal && (
            <button
              onClick={onOpenGenerateModal}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-nicora-orange hover:bg-nicora-orange-hover text-white shadow-xs font-bold text-xs active:scale-95 transition-all"
            >
              <Zap size={15} />
              <span>Genera Bozza Turni</span>
            </button>
          )}
          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-nicora-teal-light hover:bg-nicora-teal-border/30 text-nicora-teal border border-nicora-teal-border/40 font-bold text-xs active:scale-95 transition-all ${
                !isManagerMode || !onOpenGenerateModal ? 'col-span-2' : ''
              }`}
            >
              <Share2 size={15} />
              <span>WhatsApp / Stampa</span>
            </button>
          )}
        </div>

        {/* --- BANNER ALLERTA CRITICITÀ SETTIMANALE (Stile Fedele a Stitch: Rosso per assenza totale, Giallo per ore scoperte) --- */}
        {!isAlertIgnored && (weekAnalysis.hasCritical || weekAnalysis.hasPartial) && (
          <div
            className={`border rounded-2xl p-3.5 shadow-sm space-y-2.5 relative overflow-hidden animate-in fade-in ${
              weekAnalysis.hasCritical
                ? 'bg-[#ffdad6]/40 border-[#f5c2bc]/70'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 ${
                  weekAnalysis.hasCritical ? 'bg-[#ba1a1a]' : 'bg-amber-500'
                }`}
              >
                <AlertTriangle size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      weekAnalysis.hasCritical ? 'text-[#ba1a1a]' : 'text-amber-800'
                    }`}
                  >
                    {weekAnalysis.hasCritical ? 'Criticità Turno Rilevata' : 'Presidio Orario Incompleto'}
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-500">
                    {weekAnalysis.weekGaps.length === 1
                      ? `${weekAnalysis.weekGaps[0].dayMeta.dayShort} ${weekAnalysis.weekGaps[0].dayMeta.dayNum}`
                      : `${weekAnalysis.weekGaps.length} scoperture`}
                  </span>
                </div>
                <p
                  className={`text-xs font-semibold mt-0.5 leading-snug ${
                    weekAnalysis.hasCritical ? 'text-[#151d1b]' : 'text-amber-950'
                  }`}
                >
                  {weekAnalysis.weekGaps.length === 1 ? (
                    `${weekAnalysis.weekGaps[0].dayMeta.dayName} ${weekAnalysis.weekGaps[0].dayMeta.dayNum}: ${weekAnalysis.weekGaps[0].department} ${weekAnalysis.weekGaps[0].hoursDescription.toLowerCase()}`
                  ) : weekAnalysis.weekGaps.length <= 2 ? (
                    weekAnalysis.weekGaps
                      .map(
                        (g) =>
                          `${g.dayMeta.dayShort} ${g.dayMeta.dayNum}: ${g.department} (${g.hoursDescription.toLowerCase()})`
                      )
                      .join(' • ')
                  ) : (
                    `Rilevate ${weekAnalysis.weekGaps.length} scoperture orarie o di reparto nella settimana selezionata.`
                  )}
                </p>
              </div>
            </div>

            {/* Pulsanti: Ignora e Trova Sostituto Guidato */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleIgnoreAlert}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white/90 hover:bg-white text-neutral-700 text-xs font-semibold active:scale-95 transition-all shadow-xs"
              >
                Ignora
              </button>

              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white shadow-xs text-xs font-semibold active:scale-95 transition-all ${
                  weekAnalysis.hasCritical
                    ? 'bg-nicora-orange hover:bg-nicora-orange-hover'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <UserSearch size={15} />
                <span>Trova Sostituto</span>
              </button>
            </div>
          </div>
        )}

        {/* --- SELETTORE GIORNI SETTIMANA A PILLOLE (7 Giorni) --- */}
        <div className="bg-white rounded-2xl p-2 border border-nicora-sage-border shadow-clean">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isSelected = day.dateStr === selectedDayMeta.dateStr;
              const curDayShifts = shifts.filter((s) => s.date === day.dateStr);
              const curWorking = curDayShifts.filter(
                (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
              );
              const curCassa = curWorking.some(
                (s) => s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa')
              );

              return (
                <button
                  key={day.dateStr}
                  onClick={() => onSelectDate(day.dateStr)}
                  className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-between transition-all touch-manipulation relative ${
                    isSelected
                      ? 'bg-nicora-teal-dark text-white shadow-md scale-[1.03]'
                      : day.isToday
                      ? 'bg-nicora-orange-light text-nicora-orange border border-nicora-orange-border'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-transparent'
                  }`}
                >
                  <span
                    className={`text-[9px] font-extrabold uppercase ${
                      isSelected
                        ? 'text-white/80'
                        : day.isToday
                        ? 'text-nicora-orange'
                        : 'text-neutral-400'
                    }`}
                  >
                    {day.isToday && !isSelected ? 'OGGI' : day.dayShort}
                  </span>
                  <span
                    className={`text-sm font-black my-0.5 ${
                      isSelected ? 'text-white' : day.isToday ? 'text-nicora-orange' : 'text-neutral-800'
                    }`}
                  >
                    {day.dayNum}
                  </span>

                  {/* Dot stato copertura cassa / giorno */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        curCassa
                          ? isSelected
                            ? 'bg-emerald-300'
                            : 'bg-emerald-500'
                          : 'bg-rose-500 animate-pulse'
                      }`}
                      title={curCassa ? 'Cassa coperta' : 'Cassa scoperta!'}
                    />
                    {day.isMerchandiseArrival && (
                      <span className="text-[8px]" title="Arrivo Merci">
                        🚚
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- BARRA DI RICERCA & FILTRI REPARTO A PULSANTI (Niente Select, Niente Bottone Cassa Verde) --- */}
        <div className="space-y-2.5">
          {/* Campo di ricerca collaboratore */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca collaboratore per nome o mansione..."
              className="w-full bg-white border border-nicora-sage-border rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-nicora-teal focus:outline-none shadow-clean placeholder:text-neutral-400"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={14} />
            </div>
          </div>

          {/* Elenco bottoni cliccabili per reparti con conteggio attivo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedDeptFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedDeptFilter === 'all'
                  ? 'bg-nicora-teal-dark text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-nicora-sage-border hover:bg-neutral-50'
              }`}
            >
              <span>Tutti</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedDeptFilter === 'all' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {employees.length}
              </span>
            </button>

            {(['Cassa', 'Fioreria', 'Decor', 'Serra Calda', 'Serra Fredda'] as Department[]).map((dept) => {
              const isSelected = selectedDeptFilter === dept;
              const count = getDeptWorkingCount(dept);
              const theme = getDeptTheme(dept);

              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDeptFilter(dept)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? `${theme.badgeBg} shadow-xs ring-2 ring-current/20`
                      : 'bg-white text-neutral-600 border-nicora-sage-border hover:bg-neutral-50'
                  }`}
                >
                  <span>{dept}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-black/10' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- SCHEDE COLLABORATORI (Design Ispirato a Stitch) --- */}
        <div className="space-y-2">
          {sortedEmployees.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-neutral-400 border border-nicora-sage-border text-xs space-y-2">
              <Users size={32} className="mx-auto text-neutral-300" />
              <p className="font-semibold text-neutral-600">
                Nessun collaboratore trovato per i filtri selezionati.
              </p>
              {selectedDeptFilter !== 'all' && (
                <button
                  onClick={() => setSelectedDeptFilter('all')}
                  className="text-nicora-orange font-bold hover:underline text-xs"
                >
                  Mostra tutti i collaboratori
                </button>
              )}
            </div>
          ) : (
            sortedEmployees.map((emp) => {
              const shift = dayShifts.find((s) => s.employeeId === emp.id);
              const isOff = !shift || shift.type === 'riposo';
              const isFerie = shift?.type === 'ferie';
              const isMalattia = shift?.type === 'malattia';
              const isWorking = !isOff && !isFerie && !isMalattia && Boolean(shift);

              const effectiveDept = shift?.department || emp.role;
              const theme = getDeptTheme(effectiveDept);
              const shiftStyle = shift ? SHIFT_COLORS[shift.type] : SHIFT_COLORS.riposo;

              // Monte ore settimanale
              const weeklyHours = calculateEmployeeWeeklyHours(emp, shifts);

              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    if (isManagerMode && shift) {
                      onEditShift(shift);
                    }
                  }}
                  className={`bg-white rounded-2xl p-3.5 border border-nicora-sage-border shadow-clean transition-all ${
                    isManagerMode
                      ? 'cursor-pointer hover:border-nicora-teal active:scale-[0.99] hover:shadow-md'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    
                    {/* Lato Sinistro: Avatar Circolare & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-base flex-shrink-0 shadow-2xs ${theme.bgAvatar} ${theme.textAvatar}`}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-bold text-sm text-nicora-title truncate">
                            {emp.name}
                          </span>
                          {emp.isManager && (
                            <span className="px-1.5 py-0.2 rounded bg-nicora-teal-light text-nicora-teal text-[9px] font-black uppercase">
                              Resp.
                            </span>
                          )}
                          {emp.contractHours && emp.contractHours < 40 && (
                            <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 text-[9px] font-bold">
                              Part-Time ({emp.contractHours}h)
                            </span>
                          )}
                          {shift?.isCustomHours && (
                            <span
                              className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                              title="Orario Concordato / Modificato"
                            >
                              <Sparkles size={9} className="text-amber-600" />
                              <span>Speciale</span>
                            </span>
                          )}
                        </div>

                        {/* Reparto e Ruolo con Icona tematica */}
                        <div className="flex items-center gap-1 text-neutral-500 text-[11px] mt-0.5 truncate">
                          <theme.icon size={13} className={theme.textAvatar} />
                          <span className="font-semibold text-neutral-700 truncate">
                            {shift?.areaNote || effectiveDept}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lato Destro: Orario Turno / Stato e Monte Ore */}
                    <div className="flex flex-col items-end flex-shrink-0 space-y-1 text-right">
                      {isOff ? (
                        <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-neutral-200">
                          <Coffee size={12} />
                          <span>Riposo</span>
                        </span>
                      ) : isFerie ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-purple-200">
                          🌴 Ferie
                        </span>
                      ) : isMalattia ? (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-rose-200">
                          🏥 Malattia
                        </span>
                      ) : (
                        <span
                          className={`font-black text-xs px-2.5 py-0.5 rounded-lg border shadow-2xs ${shiftStyle.bg} ${shiftStyle.text} ${shiftStyle.border}`}
                        >
                          {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
                        </span>
                      )}

                      {/* Monte ore settimanale */}
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-neutral-400">Monte ore:</span>
                        <span
                          className={`font-bold ${
                            weeklyHours.isContractFulfilled ? 'text-emerald-700' : 'text-neutral-600'
                          }`}
                        >
                          {weeklyHours.totalAccountedHours}h / {weeklyHours.contractHours}h
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Barra footer card: se manager, mostra indicazione click modifica */}
                  {isManagerMode && isWorking && (
                    <div className="mt-2 pt-1.5 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="capitalize">{shift?.type}</span>
                      <span className="text-nicora-teal font-bold flex items-center gap-0.5">
                        <Edit3 size={11} />
                        <span>Modifica turno</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Modale Assistente Sostituzione Presidi Passo-Passo */}
      <StaffSubstitutionWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        gaps={weekAnalysis.weekGaps}
        employees={allStoreEmployees || employees}
        shifts={shifts}
        locationId={activeLocation}
        onApplyShift={(newShift) => {
          if (onApplyShift) {
            onApplyShift(newShift);
          }
        }}
      />
    </div>
  );
};
