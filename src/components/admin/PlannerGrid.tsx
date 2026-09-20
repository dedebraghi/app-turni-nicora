import React, { useState, useEffect } from 'react';
import { Department, Employee, LocationInfo, Shift, ShiftRequest } from '../../domain/types';
import { calculateFairnessMetrics } from '../../engine/fairnessTracker';
import {
  calculateDayCoverage,
  calculateEmployeeWeeklyHours,
  getSundayOfWeek,
  getWeekDays,
} from '../../engine/schedulerEngine';
import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Monitor,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
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
  onOpenEmergencyModal: (shift?: Shift) => void;
  onOpenExportModal: () => void;
  onApproveRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
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
  onOpenEmergencyModal,
  onOpenExportModal,
  onApproveRequest,
  onRejectRequest,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const baseSunday = getSundayOfWeek(new Date());
  baseSunday.setDate(baseSunday.getDate() + weekOffset * 7);
  const baseSundayStr = baseSunday.toISOString().split('T')[0];

  const weekDays = getWeekDays(baseSundayStr);

  const [selectedMobileDateStr, setSelectedMobileDateStr] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [viewMode, setViewMode] = useState<'responsive' | 'mobile' | 'desktop'>('responsive');

  useEffect(() => {
    const exists = weekDays.some((d) => d.dateStr === selectedMobileDateStr);
    if (!exists) {
      const today = new Date().toISOString().split('T')[0];
      const todayInWeek = weekDays.find((d) => d.dateStr === today);
      setSelectedMobileDateStr(todayInWeek ? todayInWeek.dateStr : weekDays[0].dateStr);
    }
  }, [baseSundayStr]);

  const storeEmployees = employees.filter((e) => e.locationId === location.id && e.isActive !== false);
  const storeShifts = shifts.filter((s) => s.locationId === location.id);

  // Metriche di equità
  const fairnessMetrics = calculateFairnessMetrics(storeEmployees, storeShifts);

  // Filtro collaboratori
  const filteredEmployees = storeEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      selectedDeptFilter === 'all' || emp.role === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Calcolo statistiche giornaliere
  const dayStats = weekDays.map((d) => {
    const dayShifts = storeShifts.filter((s) => s.date === d.dateStr);
    const working = dayShifts.filter(
      (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
    );
    const cassaShifts = working.filter(
      (s) => s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa')
    );
    const isCassaCovered = cassaShifts.length > 0;

    return {
      dateStr: d.dateStr,
      workingCount: working.length,
      cassaCount: cassaShifts.length,
      isCassaCovered,
    };
  });

  return (
    <div className="space-y-4 pb-20 md:pb-8 max-w-full">
      
      {/* Banner Approvazione Ferie & Richieste 1-Click Direzione */}
      {isManagerMode && requests && onApproveRequest && onRejectRequest && (
        <PendingRequestsBanner
          requests={requests.filter((r) => r.locationId === location.id)}
          employees={employees}
          onApprove={onApproveRequest}
          onReject={onRejectRequest}
        />
      )}

      {/* Management Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-nicora-border shadow-clean flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        
        {/* Left: Week Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              className="p-1.5 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 active:scale-90 transition-all shadow-xs"
              title="Settimana precedente"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-extrabold text-xs px-2 text-neutral-800 whitespace-nowrap">
              Dom {weekDays[0].dayNum} — Sab {weekDays[6].dayNum}
            </span>
            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              className="p-1.5 rounded-lg text-neutral-600 hover:bg-white hover:text-neutral-900 active:scale-90 transition-all shadow-xs"
              title="Settimana successiva"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <span className="text-xs font-bold text-nicora-orange bg-nicora-orange-light px-2.5 py-1 rounded-xl border border-nicora-orange-border/40 whitespace-nowrap">
            {weekOffset === 0 ? 'Settimana Attuale' : weekOffset === 1 ? 'Prossima Settimana' : `Offset: ${weekOffset} sett.`}
          </span>

          {/* Selettore Vista Dispositivo */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-neutral-600">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'mobile' ? 'bg-white text-nicora-teal shadow-xs' : 'hover:text-neutral-900'
              }`}
              title="Vista Schede Verticali Touch (Smartphone)"
            >
              <Smartphone size={13} />
              <span className="hidden sm:inline">Schede</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'desktop' ? 'bg-white text-nicora-teal shadow-xs' : 'hover:text-neutral-900'
              }`}
              title="Vista Tabellone Settimanale (Spreadsheet)"
            >
              <Monitor size={13} />
              <span className="hidden sm:inline">Tabellone</span>
            </button>
            <button
              onClick={() => setViewMode('responsive')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'responsive' ? 'bg-white text-neutral-800 shadow-xs' : 'hover:text-neutral-900'
              }`}
              title="Layout automatico in base alle dimensioni dello schermo"
            >
              Auto
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sostituzione Emergenza */}
          <button
            onClick={() => onOpenEmergencyModal()}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl border border-rose-200 flex items-center gap-1.5 active:scale-95 transition-all"
            title="Trova sostituto per assenza imprevista o malattia"
          >
            <ShieldAlert size={14} className="text-rose-600" />
            <span>Sostituzione Rapida</span>
          </button>

          {/* Matrice Competenze & Personale */}
          <button
            onClick={onOpenSkillsModal}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
            title="Visualizza o modifica ore da contratto e competenze 1-10"
          >
            <Award size={14} className="text-amber-500" />
            <span>Personale & Competenze</span>
          </button>

          {/* Stampa / WhatsApp */}
          <button
            onClick={onOpenExportModal}
            className="bg-nicora-teal-light hover:bg-nicora-teal-border/30 text-nicora-teal font-bold text-xs px-3 py-2 rounded-xl border border-nicora-teal-border/40 flex items-center gap-1.5 active:scale-95 transition-all"
            title="Stampa bacheca A4 o copia testo WhatsApp"
          >
            <Share2 size={14} />
            <span>Stampa & WhatsApp</span>
          </button>

          {/* Genera Bozza */}
          <button
            onClick={onOpenGenerateModal}
            className="bg-nicora-orange hover:bg-nicora-orange-hover text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Zap size={15} />
            <span>Genera Bozza Turni</span>
          </button>
        </div>

      </div>

      {/* Banner Allarme Scopertura Reparti (se ci sono reparti a 0) */}
      {(() => {
        const weekCoverage = weekDays.map((d) => calculateDayCoverage(d.dateStr, storeShifts));
        const daysWithUncovered = weekCoverage.filter((c) => c.uncoveredDepartments.length > 0);

        if (daysWithUncovered.length === 0) return null;

        return (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={24} className="text-rose-600 flex-shrink-0 animate-pulse" />
              <div>
                <h4 className="font-black text-xs sm:text-sm text-rose-900">
                  ⚠️ Attenzione Direzione: Rilevati Reparti Privi di Presidio nella Settimana!
                </h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  {daysWithUncovered
                    .map((d) => {
                      const dayMeta = weekDays.find((w) => w.dateStr === d.dateStr);
                      return `${dayMeta?.dayShort || ''} ${d.dateStr.slice(8)}: ${d.uncoveredDepartments.join(', ')} scoperto`;
                    })
                    .join(' • ')}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenEmergencyModal()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all whitespace-nowrap self-start sm:self-auto"
            >
              <ShieldAlert size={14} />
              <span>Trova Sostituto Rapido</span>
            </button>
          </div>
        );
      })()}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtra collaboratore..."
              className="w-full bg-white border border-nicora-border rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-nicora-teal focus:outline-none shadow-clean"
            />
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
              <Search size={13} />
            </div>
          </div>

          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-white border border-nicora-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-clean cursor-pointer"
          >
            <option value="all">Tutti i reparti ({storeEmployees.length})</option>
            <option value="Cassa">Cassa</option>
            <option value="Fioreria">Fioreria</option>
            <option value="Decor">Decor</option>
            <option value="Serra Calda">Serra Calda</option>
            <option value="Serra Fredda">Serra Fredda</option>
          </select>
        </div>

        <div className="text-[11px] text-neutral-500 font-medium flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Cassa
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Fioreria
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Decor
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Serre
          </span>
        </div>
      </div>

      {/* --- VISTA MOBILE (Device-Dedicated Smartphone) --- */}
      {(viewMode === 'mobile' || viewMode === 'responsive') && (
        <div className={viewMode === 'responsive' ? 'block md:hidden' : 'block'}>
          <MobileDayView
            location={location}
            employees={filteredEmployees}
            shifts={storeShifts}
            weekDays={weekDays}
            selectedDateStr={selectedMobileDateStr}
            onSelectDate={setSelectedMobileDateStr}
            isManagerMode={isManagerMode}
            onEditShift={onEditShift}
            selectedDeptFilter={selectedDeptFilter}
            onSelectDeptFilter={setSelectedDeptFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>
      )}

      {/* --- MASTER SPREADSHEET GRID (DESKTOP) --- */}
      {(viewMode === 'desktop' || viewMode === 'responsive') && (
        <div className={viewMode === 'responsive' ? 'hidden md:block' : 'block'}>
          <div className="bg-white rounded-2xl border border-nicora-border shadow-clean overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[950px]">
            
            {/* Table Header: Giorni della settimana (Domenica -> Sabato) */}
            <thead>
              <tr className="bg-neutral-50 border-b border-nicora-border">
                
                {/* Colonna Collaboratore */}
                <th className="py-3 px-3.5 text-xs font-extrabold text-neutral-700 w-52 sticky left-0 bg-neutral-50 z-10 border-r border-nicora-border">
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
                      className={`py-2 px-2.5 text-center border-r border-nicora-border last:border-r-0 min-w-[110px] ${
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
            </thead>

            {/* Table Body: Righe Collaboratori */}
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredEmployees.map((emp) => {
                const metrics = fairnessMetrics[emp.id];
                const workedDaysCount = metrics?.totalWorkingShifts || 0;

                return (
                  <tr key={emp.id} className="hover:bg-neutral-50/70 transition-colors">
                    
                    {/* Collaboratore Info Cell */}
                    <td className="py-2.5 px-3.5 sticky left-0 bg-white hover:bg-neutral-50 z-10 border-r border-nicora-border">
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
                          const weeklyHours = calculateEmployeeWeeklyHours(emp, storeShifts);
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
                            className="py-2 px-1 text-center border-r border-nicora-border last:border-r-0 text-neutral-300"
                          >
                            -
                          </td>
                        );
                      }

                      const isOff = shift.type === 'riposo';
                      const isFerie = shift.type === 'ferie';
                      const isMalattia = shift.type === 'malattia';
                      const isCassa = shift.department === 'Cassa';

                      return (
                        <td
                          key={day.dateStr}
                          onClick={() => isManagerMode && onEditShift(shift)}
                          className={`py-1.5 px-1.5 text-center border-r border-nicora-border last:border-r-0 transition-all ${
                            isManagerMode
                              ? 'cursor-pointer hover:bg-nicora-orange-light/30 active:scale-[0.98]'
                              : ''
                          } ${day.isToday ? 'bg-nicora-orange-light/10' : ''}`}
                        >
                          {isOff ? (
                            <div className="py-1 px-1 rounded-lg bg-neutral-100 text-neutral-500 text-[10px] font-medium flex items-center justify-center gap-1">
                              <Coffee size={10} />
                              <span>Riposo</span>
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
                              className={`p-1 rounded-lg border text-center transition-colors ${
                                isCassa
                                  ? 'bg-rose-50 border-rose-200 text-rose-900 font-extrabold'
                                  : shift.department === 'Fioreria'
                                  ? 'bg-pink-50 border-pink-200 text-pink-900 font-bold'
                                  : shift.department === 'Decor'
                                  ? 'bg-purple-50 border-purple-200 text-purple-900 font-bold'
                                  : 'bg-sky-50 border-sky-200 text-sky-900 font-bold'
                              }`}
                            >
                              <div className="text-[10px] truncate leading-tight">
                                {shift.department || emp.role}
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

            {/* Table Footer: Riga Copertura Presidio 5 Reparti */}
            <tfoot className="bg-neutral-50/95 border-t-2 border-neutral-300 font-extrabold text-[11px]">
              <tr>
                <td className="py-2.5 px-3.5 sticky left-0 bg-neutral-100/95 z-10 border-r border-nicora-border text-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-nicora-teal" />
                    <span className="font-black text-xs text-nicora-title">Presidio 5 Reparti</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">Copertura giornaliera</span>
                </td>
                {weekDays.map((day) => {
                  const cov = calculateDayCoverage(day.dateStr, storeShifts);
                  const isOk = cov.uncoveredDepartments.length === 0;

                  return (
                    <td
                      key={day.dateStr}
                      className={`py-2 px-1 text-center border-r border-nicora-border last:border-r-0 ${
                        !isOk ? 'bg-rose-50/80' : ''
                      }`}
                    >
                      {isOk ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md block">
                            ✓ 5/5 Coperti
                          </span>
                          <div className="text-[9px] text-neutral-600 font-bold leading-tight">
                            C:{cov.cassaCount} • F:{cov.fioreriaCount} • D:{cov.decorCount}
                          </div>
                          <div className="text-[9px] text-neutral-500 font-medium leading-none">
                            SC:{cov.serraCaldaCount} • SF:{cov.serraFreddaCount}
                          </div>
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

      {/* Note Legali e Contratto Nicora Garden */}
      <div className="bg-neutral-50 rounded-2xl p-3 border border-nicora-border text-[11px] text-neutral-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <span>
          💡 <strong>Regola Turni:</strong> 5 giorni lavorativi su 7 per dipendente • Riposo garantito 2 giorni.
        </span>
        <span>
          Presidio Cassa contrassegnato in <strong className="text-rose-600">rosso</strong> (priorità assoluta).
        </span>
      </div>

    </div>
  );
};
