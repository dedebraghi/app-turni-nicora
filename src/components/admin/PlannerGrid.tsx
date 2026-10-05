import React, { useState, useEffect } from 'react';
import { Department, Employee, LocationId, LocationInfo, Shift, ShiftRequest } from '../../domain/types';
import { getLocationDepartments } from '../../domain/rules';
import { calculateFairnessMetrics } from '../../engine/fairnessTracker';
import {
  calculateDayCoverage,
  calculateEmployeeWeeklyHours,
  calculateWeekHourlyCoverage,
  clearLegacyIgnoredAlerts,
  formatItalianDate,
  formatLocalDate,
  getIgnoredGapIds,
  getSundayOfWeek,
  getWeekDays,
  ignoreGapId,
  WeekCoverageAnalysis,
} from '../../engine/schedulerEngine';
import { StaffSubstitutionWizard } from './StaffSubstitutionWizard';
import { hasDraftGenerated, isMonthPublished } from '../../services/storageService';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  MapPin,
  Monitor,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  UserSearch,
  Zap,
} from 'lucide-react';
import { MobileDayView } from './MobileDayView';
import { PendingRequestsBanner } from './PendingRequestsBanner';

interface PlannerGridProps {
  location: LocationInfo;
  employees: Employee[];
  shifts: Shift[];
  requests?: ShiftRequest[];
  isManagerMode: boolean;
  onEditShift: (shift: Shift) => void;
  onOpenGenerateModal: () => void;
  onOpenSkillsModal: () => void;
  onOpenClearModal?: () => void;
  onOpenEmergencyModal: (shift?: Shift) => void;
  onOpenExportModal: () => void;
  onApplyShift?: (shift: Shift) => void;
  onApproveRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onPublishMonth?: (locationId: LocationId, year: number, month: number) => Promise<void> | void;
  currentEmployee?: Employee;
  activeLocation?: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onLogout?: () => void;
  onSaveEmployee?: (emp: Employee) => void;
}

export const PlannerGrid: React.FC<PlannerGridProps> = ({
  location,
  employees,
  shifts,
  requests,
  isManagerMode,
  onEditShift,
  onOpenGenerateModal,
  onOpenSkillsModal,
  onOpenClearModal,
  onOpenEmergencyModal,
  onOpenExportModal,
  onApplyShift,
  onApproveRequest,
  onRejectRequest,
  onPublishMonth,
  currentEmployee,
  activeLocation,
  onChangeLocation,
  onLogout,
  onSaveEmployee,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const baseSunday = getSundayOfWeek(new Date());
  baseSunday.setDate(baseSunday.getDate() + weekOffset * 7);
  const baseSundayStr = formatLocalDate(baseSunday);

  const weekDays = getWeekDays(baseSundayStr);

  // Gestione stato "Ignora" puntuale per singola scopertura (sede + giorno + reparto + orario)
  const [ignoredGapIds, setIgnoredGapIds] = useState<string[]>(() => {
    clearLegacyIgnoredAlerts();
    return getIgnoredGapIds();
  });

  const handleIgnoreGap = (gapId: string) => {
    ignoreGapId(gapId);
    setIgnoredGapIds(getIgnoredGapIds());
  };

  const [selectedMobileDateStr, setSelectedMobileDateStr] = useState<string>(() => {
    return formatLocalDate(new Date());
  });
  const [viewMode, setViewMode] = useState<'responsive' | 'mobile' | 'desktop'>('responsive');

  useEffect(() => {
    const exists = weekDays.some((d) => d.dateStr === selectedMobileDateStr);
    if (!exists) {
      const today = formatLocalDate(new Date());
      const todayInWeek = weekDays.find((d) => d.dateStr === today);
      setSelectedMobileDateStr(todayInWeek ? todayInWeek.dateStr : weekDays[0].dateStr);
    }
  }, [baseSundayStr]);

  const storeEmployees = employees.filter((e) => (e.locationId === location.id || e.isMobile) && e.isActive !== false && !e.isOwner);

  // Se non in modalità manager, filtra i turni escludendo quelli dei mesi non ancora pubblicati (privacy collaboratori)
  const storeShifts = isManagerMode
    ? shifts
    : shifts.filter((s) => {
        const parts = s.date.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return isMonthPublished(s.locationId, y, m);
      });

  // Turni della sola settimana correntemente visualizzata (per calcolo monte ore settimanale e presenze)
  const weekDateSet = new Set(weekDays.map((d) => d.dateStr));
  const currentWeekShifts = storeShifts.filter((s) => weekDateSet.has(s.date));

  // Metriche di equità settimanali
  const fairnessMetrics = calculateFairnessMetrics(storeEmployees, currentWeekShifts);

  // Helper per verificare se un turno corrisponde a un determinato reparto
  const isShiftInDept = (s: Shift, targetDept: string, empRole?: string) => {
    if (s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia') {
      return false;
    }
    const effectiveDept = s.department || empRole;
    if (targetDept === 'Cassa') {
      return effectiveDept === 'Cassa' || Boolean(s.areaNote && s.areaNote.toLowerCase().includes('cassa'));
    }
    return effectiveDept === targetDept;
  };

  // Rilevamento presenza di turni lavorativi nella settimana visualizzata
  const weekStoreShifts = storeShifts.filter((s) => weekDateSet.has(s.date) && s.locationId === location.id);
  const weekHasWorkingShifts = weekStoreShifts.some(
    (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );

  // Calcolo se il collaboratore lavora nel reparto durante i 7 giorni della settimana visualizzata
  const doesEmployeeBelongToDeptInWeek = (emp: Employee, targetDept: string) => {
    if (targetDept === 'all') return true;
    if (!weekHasWorkingShifts) {
      // Se non ci sono ancora turni generati per questa settimana, fallback al ruolo nominale
      return emp.role === targetDept;
    }
    // Ha almeno un turno lavorato nel reparto durante i 7 giorni della settimana
    return weekDays.some((d) => {
      const shift = storeShifts.find((s) => s.employeeId === emp.id && s.date === d.dateStr);
      return shift ? isShiftInDept(shift, targetDept, emp.role) : false;
    });
  };

  // Filtro collaboratori
  const filteredEmployees = storeEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = doesEmployeeBelongToDeptInWeek(emp, selectedDeptFilter);
    return matchesSearch && matchesDept;
  });

  // Calcolo statistiche giornaliere per la sede corrente
  const todayStr = formatLocalDate(new Date());
  const dayStats = weekDays.map((d) => {
    const dayShifts = storeShifts.filter((s) => s.locationId === location.id && s.date === d.dateStr);
    const working = dayShifts.filter(
      (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
    );
    const cassaShifts = working.filter(
      (s) => s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa')
    );

    const parts = d.dateStr.split('-');
    const dYear = parseInt(parts[0], 10);
    const dMonth = parseInt(parts[1], 10);
    const hasDraft = hasDraftGenerated(activeLocation || location.id, dYear, dMonth);
    const isPastDay = d.dateStr < todayStr;
    const shouldSkipAlerts = !hasDraft || isPastDay;

    const isCassaCovered = cassaShifts.length > 0;

    return {
      dateStr: d.dateStr,
      workingCount: working.length,
      cassaCount: cassaShifts.length,
      hasDraft,
      isPastDay,
      isCassaCovered,
      shouldSkipAlerts,
    };
  });

  const weekHasAnyDraft = dayStats.some((d) => d.hasDraft);
  // Se non c'è nessuna bozza generata nella settimana, non mostriamo allarmi di cassa scoperta
  const isCassaWarningActive = weekHasAnyDraft && dayStats.some((d) => !d.isPastDay && d.hasDraft && !d.isCassaCovered);
  const totalWorkedShifts = storeShifts.filter((s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia').length;
  const startDay = weekDays[0];
  const endDay = weekDays[6];
  const weekLabel = `Domenica ${formatItalianDate(startDay.dateStr)} — Sabato ${formatItalianDate(endDay.dateStr)}`;
  const locationAddress = (activeLocation || location.id) === 'gazzada'
    ? 'Viale Gallarate 26, Gazzada Schianno (VA)'
    : 'Via Carnia 2, Varese (VA)';

  const viewParts = startDay.dateStr.split('-');
  const viewYear = parseInt(viewParts[0], 10);
  const viewMonth = parseInt(viewParts[1], 10);
  const locId = (activeLocation || location.id) as LocationId;
  const isViewMonthDraft = hasDraftGenerated(locId, viewYear, viewMonth);
  const isViewMonthPublished = isMonthPublished(locId, viewYear, viewMonth);
  const hasUnpublishedDraftInView = isViewMonthDraft && !isViewMonthPublished;
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const handlePublish = async () => {
    if (!onPublishMonth || isPublishing) return;
    setIsPublishing(true);
    try {
      await onPublishMonth(locId, viewYear, viewMonth);
    } finally {
      setIsPublishing(false);
    }
  };

  const [displayMode, setDisplayMode] = useState<'shifts' | 'coverage'>('shifts');

  return (
    <div className="space-y-4 pb-20 md:pb-8 max-w-full">

      {/* --- HEADER DESKTOP UFFICIALE (Stile Stitch / "Dentro oggi") --- */}
      <div className="hidden md:flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-nicora-orange-light text-nicora-orange font-bold text-xs uppercase tracking-wider border border-nicora-orange-border">
              {location.name || 'Nicora Garden'}
            </span>
            {hasUnpublishedDraftInView ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 shadow-2xs">
                <Clock size={13} className="text-amber-700" />
                <span>Bozza non pubblicata</span>
              </span>
            ) : !weekHasAnyDraft ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 font-semibold text-xs border border-neutral-200 shadow-2xs">
                <span>Bozza non generata</span>
              </span>
            ) : !isCassaWarningActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200 shadow-2xs">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Presidio Cassa OK</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 font-bold text-xs border border-rose-200 shadow-2xs animate-pulse">
                <ShieldAlert size={14} className="text-rose-600" />
                <span>Attenzione: Cassa Scoperta nella Settimana!</span>
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 text-nicora-muted text-xs">
              <MapPin size={14} className="text-nicora-teal" />
              <span>{locationAddress}</span>
            </span>
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl text-nicora-title font-medium tracking-tight">
            Tabellone Turni &amp; Pianificazione
          </h1>
          <p className="text-sm text-nicora-muted">
            Supervisione settimanale dei turni ({weekLabel}), presidi cassa continui e monitoraggio organico di punto vendita.
          </p>
        </div>

      </div>
      
      {/* Banner Approvazione Ferie & Richieste 1-Click Direzione (Desktop) */}
      {isManagerMode && requests && onApproveRequest && onRejectRequest && (
        <div className="hidden md:block">
          <PendingRequestsBanner
            requests={requests.filter((r) => r.locationId === location.id)}
            employees={employees}
            shifts={shifts}
            onApprove={onApproveRequest}
            onReject={onRejectRequest}
          />
        </div>
      )}

      {/* --- CONTROLLI DESKTOP (Toolbar, Allarmi, Filtri) --- */}
      <div className="hidden md:block space-y-4">
        {/* Management Toolbar Desktop */}
        <div className="bg-nicora-card rounded-2xl p-4.5 border border-nicora-sage-border shadow-clean flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Left: Week Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-nicora-sage-light p-1 rounded-full border border-nicora-sage-border">
              <button
                onClick={() => setWeekOffset((p) => p - 1)}
                className="p-1.5 rounded-full text-nicora-text hover:bg-white active:scale-90 transition-all shadow-xs"
                title="Settimana precedente"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-serif font-semibold text-xs px-2.5 text-nicora-title whitespace-nowrap">
                Dom {weekDays[0].dayNum} — Sab {weekDays[6].dayNum}
              </span>
              <button
                onClick={() => setWeekOffset((p) => p + 1)}
                className="p-1.5 rounded-full text-nicora-text hover:bg-white active:scale-90 transition-all shadow-xs"
                title="Settimana successiva"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <span className="text-xs font-semibold text-nicora-orange bg-nicora-orange-light px-3 py-1 rounded-full border border-nicora-orange-border whitespace-nowrap">
              {weekOffset === 0 ? 'Settimana Attuale' : weekOffset === 1 ? 'Prossima Settimana' : `Offset: ${weekOffset} sett.`}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stampa / WhatsApp */}
            <button
              onClick={onOpenExportModal}
              className="bg-nicora-teal-light hover:bg-nicora-teal-border/30 text-nicora-teal font-semibold text-xs px-3.5 py-2 rounded-xl border border-nicora-teal-border/40 flex items-center gap-1.5 active:scale-95 transition-all"
              title="Stampa bacheca A4 o copia testo WhatsApp"
            >
              <Share2 size={14} />
              <span>Stampa & WhatsApp</span>
            </button>

            {/* Genera Bozza */}
            {isManagerMode && (
              <button
                onClick={onOpenGenerateModal}
                className="bg-nicora-orange hover:bg-nicora-orange-hover text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Zap size={15} />
                <span>Genera Bozza Turni</span>
              </button>
            )}

            {/* Svuota Turni Sede (Apre ClearShiftsModal) */}
            {isManagerMode && onOpenClearModal && storeShifts.length > 0 && (
              <button
                type="button"
                onClick={onOpenClearModal}
                className="bg-white hover:bg-rose-50 text-neutral-600 hover:text-rose-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-neutral-200 hover:border-rose-300 flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Gestione svuotamento turni (futuri o storico completo)"
              >
                <Trash2 size={14} className="text-neutral-400 group-hover:text-rose-600" />
                <span>Svuota Turni</span>
              </button>
            )}
          </div>

        </div>

        {/* Banner Bozza Mensile in Elaborazione (solo admin) */}
        {isManagerMode && hasUnpublishedDraftInView && onPublishMonth && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-amber-900">
                  Bozza del mese in elaborazione (non ancora visibile allo staff)
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                  I turni generati sono al momento salvati come bozza di lavoro. I collaboratori continuano a vedere i turni ufficiali precedenti finché non pubblichi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="self-end sm:self-center bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-60"
            >
              <Send size={13} />
              <span>{isPublishing ? 'Pubblicazione...' : 'Pubblica Turni Ora'}</span>
            </button>
          </div>
        )}

        {/* Banner Allarme Scopertura Reparti Desktop (solo admin) */}
        {isManagerMode && (() => {
          const weekAnalysis: WeekCoverageAnalysis = calculateWeekHourlyCoverage(
            weekDays,
            storeShifts,
            'standard',
            activeLocation || location.id,
            employees
          );
          const activeGaps = weekAnalysis.weekGaps.filter((g) => {
            if (ignoredGapIds.includes(g.id)) return false;
            const parts = g.dateStr.split('-');
            const gYear = parseInt(parts[0], 10);
            const gMonth = parseInt(parts[1], 10);
            return hasDraftGenerated(activeLocation || location.id, gYear, gMonth);
          });
          if (activeGaps.length === 0) return null;

          const currentGap = activeGaps[0];
          const hasCritical = activeGaps.some((g) => g.severity === 'critical');

          return (
            <div
              className={`border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-sm ${
                currentGap.severity === 'critical'
                  ? 'bg-[#ffdad6]/40 border-[#f5c2bc]/70 text-neutral-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-xs ${
                    currentGap.severity === 'critical' ? 'bg-[#ba1a1a]' : 'bg-amber-500'
                  }`}
                >
                  <AlertTriangle size={17} />
                </div>
                <div>
                  <h4
                    className={`font-bold text-xs sm:text-sm ${
                      currentGap.severity === 'critical' ? 'text-[#ba1a1a]' : 'text-amber-800'
                    }`}
                  >
                    {currentGap.severity === 'critical'
                      ? 'Criticità Turno Rilevata: Reparto Privo di Presidio nella Settimana'
                      : 'Presidio Orario Incompleto: Rilevate Ore Scoperte nella Settimana'}
                  </h4>
                  <p
                    className={`text-[11px] mt-0.5 font-medium ${
                      currentGap.severity === 'critical' ? 'text-neutral-600' : 'text-amber-900'
                    }`}
                  >
                    <span className="font-bold underline">
                      {currentGap.dayMeta.dayName} {formatItalianDate(currentGap.dateStr)}
                    </span>
                    {`: ${currentGap.department} ${currentGap.hoursDescription.toLowerCase()}`}
                    {activeGaps.length > 1 && (
                      <span className="text-neutral-500 font-normal ml-1">
                        (+ altre {activeGaps.length - 1} criticità nei giorni successivi)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleIgnoreGap(currentGap.id)}
                  title={`Ignora solo ${currentGap.department} del ${currentGap.dayMeta.dayShort} (${currentGap.startMissing}–${currentGap.endMissing})`}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 bg-white/90 hover:bg-white text-neutral-700 text-xs font-semibold active:scale-95 transition-all shadow-xs"
                >
                  Ignora questo presidio
                </button>

                <button
                  type="button"
                  onClick={() => setIsWizardOpen(true)}
                  className={`font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all whitespace-nowrap text-white ${
                    hasCritical
                      ? 'bg-nicora-orange hover:bg-nicora-orange-hover'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <UserSearch size={15} />
                  <span>Trova Sostituto ({activeGaps.length})</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Filter & Search Bar Desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap py-1">
            <div className="relative sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtra collaboratore..."
                className="w-full bg-white border border-nicora-sage-border rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-nicora-teal focus:outline-none shadow-clean"
              />
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
                <Search size={13} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDeptFilter('all')}
              className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap shadow-2xs transition-all ${
                selectedDeptFilter === 'all'
                  ? 'bg-nicora-teal text-white shadow-xs'
                  : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-nicora-sage-border'
              }`}
            >
              Tutti ({storeEmployees.length})
            </button>
            {getLocationDepartments(location.id, true).map((dept) => {
              const count = storeEmployees.filter((e) => doesEmployeeBelongToDeptInWeek(e, dept)).length;
              const isSelected = selectedDeptFilter === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDeptFilter(dept)}
                  className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap shadow-2xs transition-all ${
                    isSelected
                      ? 'bg-nicora-orange text-white shadow-xs ring-2 ring-nicora-orange/30'
                      : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-nicora-sage-border'
                  }`}
                >
                  {dept} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- VISTA MOBILE (Device-Dedicated Smartphone, Stile Stitch) --- */}
      {(viewMode === 'mobile' || viewMode === 'responsive') && (
        <div className={viewMode === 'responsive' ? 'block md:hidden' : 'block'}>
          <MobileDayView
            location={location}
            employees={storeEmployees}
            shifts={storeShifts}
            weekDays={weekDays}
            selectedDateStr={selectedMobileDateStr}
            onSelectDate={setSelectedMobileDateStr}
            weekOffset={weekOffset}
            onPrevWeek={() => setWeekOffset((p) => p - 1)}
            onNextWeek={() => setWeekOffset((p) => p + 1)}
            isManagerMode={isManagerMode}
            onEditShift={onEditShift}
            onOpenGenerateModal={onOpenGenerateModal}
            onOpenClearModal={onOpenClearModal}
            onOpenExportModal={onOpenExportModal}
            onOpenEmergencyModal={onOpenEmergencyModal}
            onApplyShift={onApplyShift}
            onPublishMonth={onPublishMonth}
            currentEmployee={currentEmployee}
            activeLocation={activeLocation}
            onChangeLocation={onChangeLocation}
            onLogout={onLogout}
            onSaveEmployee={onSaveEmployee}
            allStoreEmployees={employees}
          />
        </div>
      )}

      {/* --- MASTER SPREADSHEET GRID (DESKTOP) --- */}
      {(viewMode === 'desktop' || viewMode === 'responsive') && (
        <div className={viewMode === 'responsive' ? 'hidden md:block' : 'block'}>
          <div className="bg-white rounded-2xl border border-nicora-sage-border shadow-clean overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[950px]">
            
            {/* Table Header: Giorni della settimana (Domenica -> Sabato) */}
            <thead>
              <tr className="bg-neutral-50 border-b border-nicora-sage-border">
                
                {/* Colonna Collaboratore */}
                <th className="py-3 px-3.5 text-xs font-extrabold text-neutral-700 w-52 sticky left-0 bg-neutral-50 z-10 border-r border-nicora-sage-border">
                  <div className="flex items-center justify-between">
                    <span>Collaboratore ({filteredEmployees.length})</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Giorni</span>
                  </div>
                </th>

                {/* 7 Colonne Giorni */}
                {weekDays.map((day, idx) => {
                  const stat = dayStats[idx];

                  return (
                    <th
                      key={day.dateStr}
                      className={`py-2 px-2.5 text-center border-r border-nicora-sage-border last:border-r-0 min-w-[110px] ${
                        day.isToday
                          ? 'bg-nicora-orange-light/40 ring-1 ring-inset ring-nicora-orange/40'
                          : day.isWeekend
                          ? 'bg-amber-50/60'
                          : day.isMerchandiseArrival
                          ? 'bg-sky-50/60'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-extrabold text-xs text-nicora-title uppercase">
                          {day.dayShort}
                        </span>
                        <span className={`text-xs font-black ${day.isToday ? 'text-nicora-orange' : 'text-neutral-700'}`}>
                          {day.dayNum}
                        </span>
                        {day.isMerchandiseArrival && (
                          <span title="Arrivo Merci Vivaio" className="text-[10px]">🚚</span>
                        )}
                        {day.isWeekend && (
                          <span title="Weekend Vivaio" className="text-[10px]">★</span>
                        )}
                      </div>

                      {/* Header Coverage Indicator */}
                      <div className="mt-1 flex items-center justify-center gap-1 text-[10px]">
                        <span className="font-bold text-neutral-500">
                          {stat.workingCount} pres.
                        </span>
                        <span>•</span>
                        {stat.isCassaCovered ? (
                          <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">
                            <ShieldCheck size={10} /> Cassa OK
                          </span>
                        ) : stat.shouldSkipAlerts ? (
                          <span className="text-neutral-400 font-medium flex items-center gap-0.5">
                            <span>-</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 font-black flex items-center gap-0.5 animate-pulse bg-rose-100 px-1 rounded">
                            <ShieldAlert size={10} /> SCOPERTA!
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Sub-row: Dettaglio Copertura Reparti del Giorno (visibile quando lo switch è su 'coverage' o come riga di riepilogo) */}
              {displayMode === 'coverage' && (
                <tr className="bg-neutral-100/90 border-b border-nicora-sage-border text-[10px]">
                  <th className="py-2.5 px-3 sticky left-0 bg-neutral-100 font-extrabold text-neutral-700 border-r border-nicora-sage-border">
                    <span className="block text-xs font-black">Copertura Reparti</span>
                    <span className="text-[9px] text-neutral-500 font-normal">Chi presidia ciascun reparto</span>
                  </th>
                  {weekDays.map((day, idx) => {
                    const coverage = calculateDayCoverage(day.dateStr, storeShifts, employees, location.id);
                    const activeLocationDepts = getLocationDepartments(location.id, true);
                    const shouldSkip = dayStats[idx]?.shouldSkipAlerts;
                    return (
                      <th key={`cov-${day.dateStr}`} className="py-2 px-2 border-r border-nicora-sage-border align-top font-normal bg-neutral-50/80">
                        <div className="space-y-1.5">
                          {activeLocationDepts.map((dept) => {
                            const staffList = coverage.departmentStaff?.[dept] || [];
                            const isCovered = staffList.length > 0;
                            const deptShort = dept === 'Serra Calda' ? 'S. Calda' : dept === 'Serra Fredda' ? 'S. Fredda' : dept === 'Area Tecnica' ? 'Area Tec.' : dept;
                            return (
                              <div
                                key={dept}
                                className={`p-1.5 rounded-xl text-[10px] leading-tight flex flex-col border shadow-xs ${
                                  isCovered
                                    ? 'bg-white border-neutral-200 text-neutral-800'
                                    : shouldSkip
                                    ? 'bg-neutral-100 border-neutral-200 text-neutral-500'
                                    : 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                                }`}
                              >
                                <div className="flex justify-between items-center font-black text-nicora-title">
                                  <span>{deptShort}</span>
                                  <span className={isCovered ? 'text-nicora-teal font-extrabold' : shouldSkip ? 'text-neutral-400 font-medium' : 'text-rose-600'}>
                                    {isCovered ? `(${staffList.length})` : shouldSkip ? '-' : '⚠️ Vuoto'}
                                  </span>
                                </div>
                                {isCovered ? (
                                  <div className="text-[9.5px] text-neutral-600 font-semibold mt-1 space-y-0.5">
                                    {staffList.map((s) => (
                                      <div key={s.employeeId} className="truncate bg-neutral-100 px-1 py-0.5 rounded text-neutral-800 font-bold">
                                        • {s.name}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className={`text-[8.5px] font-extrabold uppercase mt-0.5 ${shouldSkip ? 'text-neutral-400 font-normal' : 'text-rose-700'}`}>
                                    {shouldSkip ? 'Non pianificato' : 'Nessun Presidio'}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              )}
            </thead>

            {/* Table Body: Righe Collaboratori (visibili in displayMode === 'shifts') */}
            {displayMode === 'shifts' && (
              <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredEmployees.map((emp) => {
                const metrics = fairnessMetrics[emp.id];
                const workedDaysCount = metrics?.totalWorkingShifts || 0;

                return (
                  <tr key={emp.id} className="hover:bg-neutral-50/70 transition-colors">
                    
                    {/* Collaboratore Info Cell */}
                    <td className="py-2.5 px-3.5 sticky left-0 bg-white hover:bg-neutral-50 z-10 border-r border-nicora-sage-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {emp.avatar}
                          </span>
                          <div className="truncate max-w-[110px]">
                            <span className="font-bold text-xs text-nicora-title block truncate">
                              {emp.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {emp.role}
                            </span>
                          </div>
                        </div>

                        {/* Indicatore Ore Contratto & Giorni */}
                        {(() => {
                          const weeklyHours = calculateEmployeeWeeklyHours(emp, currentWeekShifts);
                          return (
                            <div className="flex flex-col items-end gap-0.5">
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  weeklyHours.isContractFulfilled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : weeklyHours.deltaHours < 0
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                                title={`Totale computato (lavoro + ferie/permessi): ${weeklyHours.totalAccountedHours}h su ${weeklyHours.contractHours}h contrattuali`}
                              >
                                {weeklyHours.totalAccountedHours}h/{weeklyHours.contractHours}h
                              </span>
                              <span
                                className="text-[9px] font-bold text-neutral-400"
                                title={`${workedDaysCount} giorni lavorati su 5 contrattuali`}
                              >
                                {workedDaysCount}/5 gg
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>

                    {/* 7 Giorni del dipendente */}
                    {weekDays.map((day) => {
                      const shift = storeShifts.find(
                        (s) => s.employeeId === emp.id && s.date === day.dateStr
                      );

                      if (!shift) {
                        return (
                          <td
                            key={day.dateStr}
                            className="py-2 px-1 text-center border-r border-nicora-sage-border last:border-r-0 text-neutral-300"
                          >
                            -
                          </td>
                        );
                      }

                      const isOtherLocation = shift.locationId !== location.id;
                      const otherLocationName = shift.locationId === 'gazzada' ? 'Gazzada' : 'Varese';

                      if (isOtherLocation && shift.type !== 'riposo' && shift.type !== 'ferie' && shift.type !== 'malattia') {
                        return (
                          <td
                            key={day.dateStr}
                            className={`py-1.5 px-1.5 text-center border-r border-nicora-sage-border last:border-r-0 ${
                              day.isToday ? 'bg-nicora-orange-light/10' : ''
                            }`}
                          >
                            <div className="py-1 px-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold flex flex-col items-center justify-center gap-0.5 shadow-xs">
                              <span>🔄 Trasferta</span>
                              <span className="text-[9px] text-amber-800 font-bold">In turno a {otherLocationName}</span>
                            </div>
                          </td>
                        );
                      }

                      const isOff = shift.type === 'riposo';
                      const isFerie = shift.type === 'ferie';
                      const isMalattia = shift.type === 'malattia';
                      const isCassa = shift.department === 'Cassa';
                      const isTargetDeptMatch = selectedDeptFilter !== 'all' && isShiftInDept(shift, selectedDeptFilter, emp.role);
                      const isDimmed = selectedDeptFilter !== 'all' && !isTargetDeptMatch;

                      return (
                        <td
                          key={day.dateStr}
                          onClick={() => isManagerMode && onEditShift(shift)}
                          className={`py-1.5 px-1.5 text-center border-r border-nicora-sage-border last:border-r-0 transition-all ${
                            isManagerMode
                              ? 'cursor-pointer hover:bg-nicora-orange-light/30 active:scale-[0.98]'
                              : ''
                          } ${day.isToday ? 'bg-nicora-orange-light/10' : ''} ${
                            isDimmed ? 'opacity-35 hover:opacity-100' : ''
                          }`}
                        >
                          {isOff ? (
                            <div className="py-1 px-1 rounded-lg bg-neutral-100 text-neutral-500 text-[10px] font-medium flex flex-col items-center justify-center gap-0.5">
                              <div className="flex items-center gap-1 font-semibold text-neutral-600">
                                <Coffee size={10} />
                                <span>Riposo</span>
                              </div>
                              <span className="text-[9px] text-neutral-400 block leading-none">
                                Riposo
                              </span>
                            </div>
                          ) : isFerie ? (
                            <div className="py-1 px-1 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-bold">
                              🌴 Ferie
                            </div>
                          ) : isMalattia ? (
                            <div className="py-1 px-1 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-bold">
                              🏥 Malat.
                            </div>
                          ) : (
                            <div
                              className={`p-1 rounded-lg border text-center transition-colors relative group ${
                                isTargetDeptMatch ? 'ring-2 ring-nicora-teal/70 shadow-xs' : ''
                              } ${
                                isCassa
                                  ? 'bg-rose-50 border-rose-200 text-rose-900 font-extrabold'
                                  : shift.department === 'Fioreria'
                                  ? 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900 font-bold'
                                  : shift.department === 'Decor'
                                  ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold'
                                  : shift.department === 'Serra Calda'
                                  ? 'bg-orange-50 border-orange-200 text-orange-900 font-bold'
                                  : shift.department === 'Serra Fredda'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                                  : shift.department === 'Area Tecnica'
                                  ? 'bg-slate-50 border-slate-200 text-slate-900 font-bold'
                                  : shift.department === 'Emporio'
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                                  : shift.department === 'Natale'
                                  ? 'bg-red-50 border-red-200 text-red-900 font-bold'
                                  : 'bg-sky-50 border-sky-200 text-sky-900 font-bold'
                              }`}
                            >
                              <div className="text-[10px] truncate leading-tight flex items-center justify-between gap-0.5">
                                <span className="truncate">{shift.department || emp.role}</span>
                                {isManagerMode && (() => {
                                  const score = shift.assignedSkillScore ?? emp.skills?.[shift.department || emp.role] ?? 1;
                                  return (
                                    <span
                                      className={`text-[8px] font-black px-1 rounded-full shadow-2xs leading-none flex-shrink-0 ${
                                        score >= 9
                                          ? 'bg-emerald-700 text-white'
                                          : score >= 7
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-neutral-500 text-white'
                                      }`}
                                      title={`Competenza in ${shift.department || emp.role}: ${score}/10`}
                                    >
                                      {score}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                <span className="text-[9px] text-neutral-500 block leading-none">
                                  {shift.startTime || '08:30'}-{shift.endTime || '19:30'}
                                </span>
                                {shift.isCustomHours && (
                                  <span title="Orario speciale concordato" className="text-[10px] text-amber-600 font-bold leading-none">
                                    ★
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}

                  </tr>
                );
              })}
            </tbody>
            )}

            {/* Table Footer: Riga Copertura Presidio Reparti */}
            <tfoot className="bg-neutral-50/95 border-t-2 border-neutral-300 font-extrabold text-[11px]">
              <tr>
                <td className="py-2.5 px-3.5 sticky left-0 bg-neutral-100/95 z-10 border-r border-nicora-border text-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-nicora-teal" />
                    <span className="font-black text-xs text-nicora-title">
                      {selectedDeptFilter === 'all'
                        ? (location.id === 'gazzada' ? 'Presidio Gazzada (5 Rep.)' : 'Presidio Varese')
                        : `Presidio ${selectedDeptFilter}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    {selectedDeptFilter === 'all' ? 'Copertura e Competenze' : 'Copertura e presidi del reparto'}
                  </span>
                </td>
                {weekDays.map((day, idx) => {
                  const cov = calculateDayCoverage(day.dateStr, storeShifts, employees, location.id);
                  const activeLocationDepts = getLocationDepartments(location.id, true);
                  const shouldSkip = dayStats[idx]?.shouldSkipAlerts;
                  const isOk = shouldSkip ? true : cov.uncoveredDepartments.length === 0;

                  // Se c'è un filtro di reparto attivo, mostriamo il presidio puntuale di quel reparto
                  if (selectedDeptFilter !== 'all') {
                    const deptStaff = cov.departmentStaff?.[selectedDeptFilter as Department] || [];
                    const isDeptCovered = deptStaff.length > 0;
                    return (
                      <td
                        key={day.dateStr}
                        className={`py-2 px-1 text-center border-r border-nicora-border last:border-r-0 ${
                          !isDeptCovered && !shouldSkip ? 'bg-rose-50/80' : 'bg-nicora-teal/5'
                        }`}
                      >
                        {isDeptCovered ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md block text-emerald-800 bg-emerald-100">
                              ✓ {deptStaff.length} {deptStaff.length === 1 ? 'presidio' : 'presidi'}
                            </span>
                            <div className="text-[9px] text-neutral-700 font-bold leading-tight truncate" title={deptStaff.map((s) => s.name).join(', ')}>
                              {deptStaff.map((s) => s.name).join(', ')}
                            </div>
                          </div>
                        ) : shouldSkip ? (
                          <span className="text-[9.5px] text-neutral-400 font-medium block py-1">
                            {dayStats[idx]?.isPastDay ? 'Passato' : 'Non pianificato'}
                          </span>
                        ) : (
                          <div className="p-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-800">
                            <span className="text-[9px] font-black block leading-tight">
                              ⚠️ Scoperto
                            </span>
                            <span className="text-[8px] font-bold text-rose-700 block truncate">
                              0 {selectedDeptFilter}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={day.dateStr}
                      className={`py-2 px-1 text-center border-r border-nicora-border last:border-r-0 ${
                        !isOk ? 'bg-rose-50/80' : ''
                      }`}
                    >
                      {isOk ? (
                        <div className="space-y-0.5">
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md block ${shouldSkip ? 'text-neutral-500 bg-neutral-100' : 'text-emerald-800 bg-emerald-100'}`}>
                            {shouldSkip ? (dayStats[idx]?.isPastDay ? 'Giorno passato' : 'Non pianificato') : `✓ ${activeLocationDepts.length}/${activeLocationDepts.length} Coperti`}
                          </span>
                          {location.id === 'gazzada' ? (
                            <div className="text-[9px] text-neutral-600 font-bold leading-tight">
                              C:{cov.cassaCount} • F:{cov.fioreriaCount} • AT:{cov.areaTecnicaCount} • SC:{cov.serraCaldaCount} • SF:{cov.serraFreddaCount}
                            </div>
                          ) : (
                            <>
                              <div className="text-[9px] text-neutral-600 font-bold leading-tight">
                                C:{cov.cassaCount} • F:{cov.fioreriaCount} • D:{cov.decorCount} • E:{cov.emporioCount}
                              </div>
                              <div className="text-[9px] text-neutral-500 font-medium leading-none">
                                SC:{cov.serraCaldaCount} • SF:{cov.serraFreddaCount}{cov.nataleCount ? ` • N:${cov.nataleCount}` : ''}
                              </div>
                            </>
                          )}
                          {isManagerMode && cov.averageSkillScore !== undefined && cov.averageSkillScore > 0 && (
                            <div className="text-[8px] font-extrabold text-emerald-900 bg-emerald-50 rounded px-1 py-0.2 mt-0.5 inline-block">
                              Comp: {cov.averageSkillScore}/10
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-800">
                          <span className="text-[9px] font-black block leading-tight">
                            ⚠️ Scoperti:
                          </span>
                          <span
                            className="text-[8px] font-bold text-rose-700 block truncate"
                            title={cov.uncoveredDepartments.join(', ')}
                          >
                            {cov.uncoveredDepartments.join(', ')}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>

          </table>
        </div>
      </div>
        </div>
      )}

      {/* Modale Assistente Sostituzione Presidi Passo-Passo (Desktop) */}
      <StaffSubstitutionWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        gaps={
          calculateWeekHourlyCoverage(
            weekDays,
            storeShifts,
            'standard',
            activeLocation || location.id,
            employees
          ).weekGaps.filter((g) => {
            if (ignoredGapIds.includes(g.id)) return false;
            const parts = g.dateStr.split('-');
            const gYear = parseInt(parts[0], 10);
            const gMonth = parseInt(parts[1], 10);
            return hasDraftGenerated(activeLocation || location.id, gYear, gMonth);
          })
        }
        employees={employees}
        shifts={storeShifts}
        locationId={activeLocation || location.id}
        onApplyShift={(newShift) => {
          if (onApplyShift) {
            onApplyShift(newShift);
          }
        }}
        onIgnoreGap={handleIgnoreGap}
      />

    </div>
  );
};
