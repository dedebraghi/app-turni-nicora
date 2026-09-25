import React, { useState } from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { LOCATIONS } from '../../domain/mockData';
import { NicoraLogo } from '../NicoraLogo';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Store, 
  Sun, 
  Truck, 
  Utensils 
} from 'lucide-react';

interface TodayPresenceMobileProps {
  currentDate: string;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onEditShift: (shift: Shift) => void;
}

export const TodayPresenceMobile: React.FC<TodayPresenceMobileProps> = ({
  currentDate,
  currentEmployeeId,
  employees,
  shifts,
  isManagerMode,
  activeLocation,
  onChangeLocation,
  onEditShift,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const storeEmployees = employees.filter((e) => e.locationId === activeLocation && e.isActive !== false);
  const locationInfo = LOCATIONS.find((l) => l.id === activeLocation);

  const gazzadaStaffCount = employees.filter((e) => e.locationId === 'gazzada' && e.isActive !== false).length;
  const vareseStaffCount = employees.filter((e) => e.locationId === 'varese' && e.isActive !== false).length;

  const todayStoreShifts = shifts.filter(
    (s) => s.locationId === activeLocation && s.date === currentDate
  );

  const getEmployee = (empId: string) => storeEmployees.find((e) => e.id === empId);

  // Turni in servizio vs riposo/ferie
  const workingShifts = todayStoreShifts.filter(
    (s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia'
  );
  const restShifts = todayStoreShifts.filter(
    (s) => s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia'
  );

  // Presidio Cassa
  const cassaShifts = workingShifts.filter(
    (s) => s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa') || getEmployee(s.employeeId)?.role === 'Cassa'
  );

  // Turno personale
  const myShift = todayStoreShifts.find((s) => s.employeeId === currentEmployeeId);
  const myEmployee = employees.find((e) => e.id === currentEmployeeId);

  // Filtro dipartimento
  const filteredWorkingShifts = workingShifts.filter((s) => {
    if (selectedDeptFilter === 'all') return true;
    return s.department === selectedDeptFilter || (selectedDeptFilter === 'Cassa' && (s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa')));
  });

  const deptCounts: Record<string, number> = {
    cassa: workingShifts.filter((s) => s.department === 'Cassa' || s.areaNote?.toLowerCase().includes('cassa') || getEmployee(s.employeeId)?.role === 'Cassa').length,
    fioreria: workingShifts.filter((s) => s.department === 'Fioreria' || getEmployee(s.employeeId)?.role === 'Fioreria').length,
    decor: workingShifts.filter((s) => s.department === 'Decor' || getEmployee(s.employeeId)?.role === 'Decor').length,
    serraCalda: workingShifts.filter((s) => s.department === 'Serra Calda' || getEmployee(s.employeeId)?.role === 'Serra Calda').length,
    serraFredda: workingShifts.filter((s) => s.department === 'Serra Fredda' || getEmployee(s.employeeId)?.role === 'Serra Fredda').length,
  };

  const deptFilterList = [
    { id: 'all', label: 'Tutti', count: workingShifts.length },
    { id: 'Cassa', label: 'Cassa', count: deptCounts.cassa },
    { id: 'Fioreria', label: 'Fioreria', count: deptCounts.fioreria },
    { id: 'Decor', label: 'Decor', count: deptCounts.decor },
    { id: 'Serra Calda', label: 'Serra Calda', count: deptCounts.serraCalda },
    { id: 'Serra Fredda', label: 'Serra Fredda', count: deptCounts.serraFredda },
  ].filter((d) => d.id === 'all' || d.count > 0);

  const formatDisplayDate = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="min-h-screen bg-[#f2fcf7] text-[#151d1b] flex flex-col font-sans">
      
      {/* ========================================================
          1. HEADER NATIVO STITCH MOBILE (132668eb8842442486ad04adfa3a5308)
          ======================================================== */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#f2fcf7]/95 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(10,71,75,0.06)] border-b border-[#e2e8e4]/60 pt-safe">
        <div className="h-32 px-4 flex flex-col justify-between py-2.5">
          {/* Riga 1: Logo & Brand + Utente loggato */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <NicoraLogo size={32} variant="icon" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#a73a00] font-bold uppercase tracking-widest leading-none truncate">
                  ATELIER BOTANICO &amp; VIVAI
                </span>
                <span className="font-serif text-xl font-bold text-[#0a474b] leading-tight truncate">
                  Oggi
                </span>
              </div>
            </div>

            {/* Profilo Sabrina / Utente */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-bold text-neutral-900 leading-tight">
                  {myEmployee?.name || 'Sabrina'}
                </span>
                <span className="text-[10px] text-neutral-500 leading-none">
                  {myEmployee?.role ? `Rep. ${myEmployee.role}` : 'Rep. Cassa'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#002f32] flex items-center justify-center text-white font-serif font-bold text-xs shadow-xs">
                {myEmployee?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>

          {/* Riga 2: Switch Sedi & Orario Operativo */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center p-0.5 rounded-full bg-[#e1eae5]">
              <button
                type="button"
                onClick={() => onChangeLocation?.('gazzada')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeLocation === 'gazzada'
                    ? 'bg-[#a73a00] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Gazzada {gazzadaStaffCount || 12}
              </button>
              <button
                type="button"
                onClick={() => onChangeLocation?.('varese')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeLocation === 'varese'
                    ? 'bg-[#a73a00] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Varese {vareseStaffCount || 20}
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f0eb] text-[#072e31]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-neutral-600 font-medium">08:30-12:30 / 14:30-19:30</span>
              <span className="text-[10px] font-bold text-emerald-700 ml-0.5">100%</span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. CORPO PRINCIPALE MOBILE (Stitch 132668eb8842442486ad04adfa3a5308)
          ======================================================== */}
      <div className="pt-34 px-4 pb-24 space-y-4">
        
        {/* Header Data & Meteo Context */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#a73a00] uppercase tracking-widest">
              {locationInfo?.shortName || (activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese')}
            </span>
            <h1 className="font-serif text-xl font-bold text-[#0a474b] capitalize">
              {formatDisplayDate(currentDate)}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-2xs border border-[#e2e8e4] text-neutral-800">
            <Sun size={16} className="text-[#a73a00]" />
            <span className="text-xs font-semibold">21°C</span>
          </div>
        </div>

        {/* 1. Quick Indicators (3 Compact Stat Boxes) */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-[#e2e8e4] shadow-2xs text-center">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">In Servizio</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-[#002f32]">{workingShifts.length}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">Sede Operativa</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-[#e2e8e4] shadow-2xs text-center">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Riposo/Ferie</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-neutral-700">{restShifts.length}</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Assenti oggi</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#fdf3ee] border border-[#edd9cd] shadow-2xs text-center">
            <span className="text-[9px] uppercase tracking-wider text-[#a73a00] font-bold">Presidio Cassa</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-serif text-2xl font-bold text-[#a73a00]">{cassaShifts.length}</span>
            </div>
            <span className="text-[10px] text-[#a73a00] font-semibold">Linee attive</span>
          </div>
        </div>

        {/* 2. Hero Turno Collaboratore (Ottanio Deep Scuro & Terracotta Accent) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002f32] via-[#0a474b] to-[#072e31] text-white p-4.5 shadow-md border border-white/10">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3.5">
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white backdrop-blur-xs text-[11px]">
                <Clock size={13} className="text-emerald-300" />
                <span className="font-bold tracking-wider">
                  IL TUO TURNO • {myEmployee?.name?.toUpperCase() || 'SABRINA'} #{myEmployee?.id || '4082'}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fd651e] text-white font-bold text-[10px] tracking-wide uppercase shadow-xs">
                {myShift?.department ? `REP. ${myShift.department.toUpperCase()}` : (myEmployee?.role ? `REP. ${myEmployee.role.toUpperCase()}` : 'REP. CASSA')}
              </span>
            </div>

            {/* Turno & Orari */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-semibold tracking-tight text-white">
                  {myShift?.startTime || '08:30'} — {myShift?.endTime || '19:30'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5 font-medium">
                {myShift?.type === 'mattina' || myShift?.type === 'pomeriggio' ? 'Mezza Giornata' : 'Turno Completo • Giornata Intera'}
              </p>
            </div>

            {/* Shift Details Bento Inside Hero */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-black/25 backdrop-blur-xs flex flex-col gap-0.5 border border-white/5">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider flex items-center gap-1 font-bold">
                  <Store size={12} /> Postazione
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {myShift?.areaNote || (myEmployee?.role === 'Cassa' ? 'Cassa 1 Principale' : 'Presidio di Reparto')}
                </span>
                <span className="text-[10px] text-white/70">
                  {myEmployee?.role === 'Cassa' ? 'Barriera Continua' : 'Assistenza Clienti'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/25 backdrop-blur-xs flex flex-col gap-0.5 border border-white/5">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider flex items-center gap-1 font-bold">
                  <Utensils size={12} /> Pausa Pranzo
                </span>
                <span className="text-xs font-bold text-white">
                  13:00 — 14:00
                </span>
                <span className="text-[10px] text-white/70">
                  Sala Relax Piano 1
                </span>
              </div>
            </div>

            {/* Timbratura Status Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-0.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-white font-medium">Badge Timbrato regolarmente</span>
              </div>
              <span className="text-[11px] text-emerald-300 font-bold">08:24 IN</span>
            </div>
          </div>
        </div>

        {/* 3. Horizontal Scrollable Department Filter */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Filtro Reparto</span>
            <span className="text-[11px] text-neutral-500 font-medium">{filteredWorkingShifts.length} Presenti</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {deptFilterList.map((d) => {
              const isSelected = selectedDeptFilter === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDeptFilter(d.id)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all ${
                    isSelected
                      ? 'bg-[#002f32] text-white shadow-xs'
                      : 'bg-white text-neutral-600 hover:text-neutral-900 border border-[#e2e8e4]'
                  }`}
                >
                  {d.label} ({d.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Team List: Collaboratori Oggi in Sede */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-neutral-900">
              Fascia Mattina &amp; Pomeriggio
            </h2>
            <span className="text-[10px] font-bold text-[#a73a00] uppercase tracking-wider">
              Orario Continuato
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {filteredWorkingShifts.map((shift) => {
              const emp = getEmployee(shift.employeeId);
              if (!emp) return null;
              const isMe = emp.id === currentEmployeeId;
              const isResp = emp.isManager;

              return (
                <div
                  key={shift.id}
                  onClick={() => isManagerMode && onEditShift(shift)}
                  className={`flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#e2e8e4] shadow-2xs transition-all ${
                    isManagerMode ? 'cursor-pointer hover:border-nicora-teal' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center font-serif text-base font-bold flex-shrink-0 ${
                        isMe
                          ? 'bg-[#a73a00] text-white'
                          : isResp
                          ? 'bg-[#0a474b] text-white'
                          : 'bg-[#e1eae5] text-[#002f32]'
                      }`}
                    >
                      {emp.name.charAt(0)}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-neutral-900 truncate">{emp.name}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-[#a73a00] text-[9px] font-extrabold uppercase">
                            TU
                          </span>
                        )}
                        {isResp && (
                          <span className="px-1.5 py-0.2 rounded bg-[#e1eae5] text-[#002f32] text-[9px] font-bold uppercase">
                            RESP
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] truncate ${emp.role === 'Cassa' ? 'text-[#a73a00] font-semibold' : 'text-neutral-500'}`}>
                        {shift.areaNote || (emp.role === 'Cassa' ? 'Cassa 1 Principale' : `Reparto ${emp.role}`)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 text-right">
                    <span className="font-bold text-xs text-neutral-900">
                      {shift.startTime || '08:30'} — {shift.endTime || '19:30'}
                    </span>
                    <span className="text-[10px] font-semibold flex items-center gap-0.5 mt-0.5">
                      {emp.role === 'Cassa' ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 size={11} /> In Cassa
                        </span>
                      ) : (shift.type === 'mattina' || shift.type === 'pomeriggio') ? (
                        <span className="text-amber-600 font-semibold">Mattina (Mezza g.)</span>
                      ) : isResp ? (
                        <span className="text-[#0a474b] font-semibold">Ricevimento Piante</span>
                      ) : (
                        <span className="text-neutral-500 font-medium">In turno</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Operational Notes Card */}
        <div className="p-4 rounded-xl bg-[#fdf3ee] border border-[#edd9cd] shadow-2xs flex items-start gap-3 mt-2">
          <div className="w-8 h-8 rounded-full bg-[#a73a00] flex items-center justify-center text-white flex-shrink-0 mt-0.5">
            <Truck size={17} />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] uppercase text-[#a73a00] font-bold tracking-wider">
                Nota Operativa del Giorno
              </span>
              <span className="text-[10px] text-[#a73a00] font-bold">15:30</span>
            </div>
            <p className="text-xs text-neutral-800 leading-snug">
              Consegna speciale alberature vivaio e piante esemplari prevista per le <strong>15:30</strong>. Richiesto presidio carrello elevatore all'ingresso merci.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
