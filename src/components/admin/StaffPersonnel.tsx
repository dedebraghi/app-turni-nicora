import React, { useState } from 'react';
import { Department, Employee, LocationId, SkillScores } from '../../domain/types';
import { DEPARTMENTS, DEPARTMENT_COLORS } from '../../domain/rules';
import {
  Archive,
  Award,
  Check,
  Clock,
  Edit3,
  Info,
  KeyRound,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';

interface StaffPersonnelProps {
  employees: Employee[];
  activeLocation: LocationId;
  onSaveEmployee: (employee: Employee) => void;
  onArchiveEmployee: (employeeId: string, isActive: boolean) => void;
  onUpdateSkillsAndHours?: (
    employeeId: string,
    skills: Record<Department, number>,
    contractHours: number
  ) => void;
}

export const StaffPersonnel: React.FC<StaffPersonnelProps> = ({
  employees,
  activeLocation,
  onSaveEmployee,
  onArchiveEmployee,
  onUpdateSkillsAndHours,
}) => {
  // Sotto-vista: 'skills-contracts' (Competenze & Contratti) o 'roster' (Anagrafica Organico)
  const [activeSubView, setActiveSubView] = useState<'skills-contracts' | 'roster'>('skills-contracts');
  const [tabFilter, setTabFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Dipendenti della sede corrente
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation);
  const activeEmployees = storeEmployees.filter((e) => e.isActive !== false);
  const archivedEmployees = storeEmployees.filter((e) => e.isActive === false);

  // Calcolo Monte Ore Totale di Sede
  const totalWeeklyStoreHours = activeEmployees.reduce(
    (sum, e) => sum + (e.contractHours || 40),
    0
  );

  // State locale per modifiche rapide competenze e ore di contratto
  const [editableStaff, setEditableStaff] = useState<
    Record<string, { skills: Record<Department, number>; contractHours: number }>
  >(() => {
    const initial: Record<string, { skills: Record<Department, number>; contractHours: number }> = {};
    employees.forEach((emp) => {
      initial[emp.id] = {
        skills: { ...emp.skills },
        contractHours: emp.contractHours || 40,
      };
    });
    return initial;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Gestione cambio punteggio competenza
  const handleScoreChange = (empId: string, dept: Department, newScore: number) => {
    const clamped = Math.max(1, Math.min(10, newScore));
    setEditableStaff((prev) => {
      const current = prev[empId] || {
        skills: employees.find((e) => e.id === empId)?.skills || {
          Cassa: 5,
          Fioreria: 5,
          Decor: 5,
          'Serra Calda': 5,
          'Serra Fredda': 5,
        },
        contractHours: employees.find((e) => e.id === empId)?.contractHours || 40,
      };
      return {
        ...prev,
        [empId]: {
          ...current,
          skills: {
            ...current.skills,
            [dept]: clamped,
          },
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Gestione cambio ore contratto
  const handleContractHoursChange = (empId: string, hours: number) => {
    const clamped = Math.max(10, Math.min(50, hours));
    setEditableStaff((prev) => {
      const current = prev[empId] || {
        skills: employees.find((e) => e.id === empId)?.skills || {
          Cassa: 5,
          Fioreria: 5,
          Decor: 5,
          'Serra Calda': 5,
          'Serra Fredda': 5,
        },
        contractHours: employees.find((e) => e.id === empId)?.contractHours || 40,
      };
      return {
        ...prev,
        [empId]: {
          ...current,
          contractHours: clamped,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Salva tutte le modifiche rapide di competenze e ore contratto
  const handleSaveAllQuickChanges = () => {
    Object.entries(editableStaff).forEach(([empId, data]) => {
      const original = employees.find((e) => e.id === empId);
      if (original) {
        if (
          JSON.stringify(original.skills) !== JSON.stringify(data.skills) ||
          (original.contractHours || 40) !== data.contractHours
        ) {
          const updated: Employee = {
            ...original,
            skills: data.skills,
            contractHours: data.contractHours,
          };
          onSaveEmployee(updated);
          if (onUpdateSkillsAndHours) {
            onUpdateSkillsAndHours(empId, data.skills, data.contractHours);
          }
        }
      }
    });
    setHasUnsavedChanges(false);
  };

  // Form State per Nuovo / Modifica Anagrafica
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    role: Department;
    contractHours: number;
    password: string;
    email: string;
    phone: string;
    isManager: boolean;
    skills: SkillScores;
  }>({
    id: '',
    name: '',
    role: 'Cassa',
    contractHours: 40,
    password: '1234',
    email: '',
    phone: '',
    isManager: false,
    skills: { Cassa: 5, Fioreria: 5, Decor: 5, 'Serra Calda': 5, 'Serra Fredda': 5 },
  });

  const openCreateModal = () => {
    setFormData({
      id: `emp-${activeLocation.slice(0, 2)}-${Date.now()}`,
      name: '',
      role: 'Cassa',
      contractHours: 40,
      password: '1234',
      email: '',
      phone: '',
      isManager: false,
      skills: { Cassa: 6, Fioreria: 5, Decor: 5, 'Serra Calda': 5, 'Serra Fredda': 5 },
    });
    setEditingEmployee(null);
    setIsNewModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    const currentQuick = editableStaff[emp.id];
    setFormData({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      contractHours: currentQuick?.contractHours || emp.contractHours || 40,
      password: emp.password || '1234',
      email: emp.email || '',
      phone: emp.phone || '',
      isManager: Boolean(emp.isManager),
      skills: currentQuick?.skills ? { ...currentQuick.skills } : { ...emp.skills },
    });
    setEditingEmployee(emp);
    setIsNewModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const avatar = formData.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const employeeToSave: Employee = {
      id: formData.id,
      name: formData.name.trim(),
      locationId: activeLocation,
      role: formData.role,
      skills: formData.skills,
      avatar,
      email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@nicoragarden.it`,
      phone: formData.phone.trim() || undefined,
      password: formData.password.trim() || '1234',
      isManager: formData.isManager,
      contractHours: Number(formData.contractHours) || 40,
      isActive: editingEmployee ? editingEmployee.isActive !== false : true,
    };

    onSaveEmployee(employeeToSave);

    setEditableStaff((prev) => ({
      ...prev,
      [employeeToSave.id]: {
        skills: { ...employeeToSave.skills },
        contractHours: employeeToSave.contractHours || 40,
      },
    }));

    setIsNewModalOpen(false);
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 8) return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
    if (score >= 5) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    return 'bg-neutral-100 text-neutral-600 border-neutral-200 font-medium';
  };

  // Filtraggio dipendenti
  const displayedEmployees = (
    activeSubView === 'skills-contracts'
      ? activeEmployees
      : tabFilter === 'active'
      ? activeEmployees
      : archivedEmployees
  ).filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 md:pb-8 max-w-5xl mx-auto">
      
      {/* Header & Dashboard Metriche Personale */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-nicora-border shadow-clean space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-nicora-teal-light text-nicora-teal flex items-center justify-center font-black">
                <Users size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-nicora-title tracking-tight">
                  Personale & Competenze
                </h2>
                <p className="text-xs text-neutral-500">
                  Punto Vendita: <strong className="text-neutral-800 capitalize">{activeLocation}</strong> ({storeEmployees.length} collaboratori registrati)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && activeSubView === 'skills-contracts' && (
              <button
                onClick={handleSaveAllQuickChanges}
                className="bg-nicora-orange hover:bg-nicora-orange-hover text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Check size={16} />
                <span>Salva Modifiche</span>
              </button>
            )}

            <button
              onClick={openCreateModal}
              className="bg-neutral-900 hover:bg-black text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all min-h-[42px]"
            >
              <UserPlus size={16} />
              <span>Nuovo Collaboratore</span>
            </button>
          </div>
        </div>

        {/* Metriche Organico & Ore Contratto */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Collaboratori Attivi</span>
            <span className="text-xl font-black text-neutral-800">{activeEmployees.length}</span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Full-Time (40h)</span>
            <span className="text-xl font-black text-emerald-800">
              {activeEmployees.filter((e) => (editableStaff[e.id]?.contractHours || e.contractHours || 40) >= 38).length}
            </span>
          </div>

          <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-100 text-center">
            <span className="text-[10px] uppercase font-bold text-sky-700 block">Part-Time (&lt;38h)</span>
            <span className="text-xl font-black text-sky-800">
              {activeEmployees.filter((e) => (editableStaff[e.id]?.contractHours || e.contractHours || 40) < 38).length}
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Monte Ore Settimana</span>
            <span className="text-xl font-black text-amber-900">{totalWeeklyStoreHours}h</span>
          </div>
        </div>

        {/* Selettore Sub-View: Competenze & Contratti VS Anagrafica Organico */}
        <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
          <button
            onClick={() => setActiveSubView('skills-contracts')}
            className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeSubView === 'skills-contracts'
                ? 'bg-nicora-teal text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Award size={15} />
            <span>Matrice Competenze (1–10) & Ore Contratto</span>
          </button>

          <button
            onClick={() => setActiveSubView('roster')}
            className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeSubView === 'roster'
                ? 'bg-nicora-teal text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Users size={15} />
            <span>Anagrafica & PIN ({activeEmployees.length})</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Ricerca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {activeSubView === 'roster' && (
          <div className="flex bg-neutral-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setTabFilter('active')}
              className={`flex-1 sm:flex-initial py-1.5 px-3.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                tabFilter === 'active'
                  ? 'bg-white text-nicora-teal shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <UserCheck size={13} />
              <span>Attivi ({activeEmployees.length})</span>
            </button>
            <button
              onClick={() => setTabFilter('archived')}
              className={`flex-1 sm:flex-initial py-1.5 px-3.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                tabFilter === 'archived'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Archive size={13} />
              <span>Archiviati ({archivedEmployees.length})</span>
            </button>
          </div>
        )}

        {activeSubView === 'skills-contracts' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-900 flex-1">
            <Info size={16} className="text-nicora-orange flex-shrink-0" />
            <span className="text-[11px] leading-tight">
              <strong>Regole Nicora:</strong> Tutti lavorano <strong>5 giorni/settimana</strong>. Le ore di contratto settimanali (es. 40h, 30h, 24h, 20h) vengono ripartite sui 5 turni garantendo la copertura dei 5 reparti.
            </span>
          </div>
        )}

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca collaboratore per nome o reparto..."
            className="w-full bg-white border border-nicora-border rounded-xl pl-8 pr-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-nicora-teal focus:outline-none shadow-clean"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* --- VISTA 1: MATRICE COMPETENZE (1-10) & ORE CONTRATTO --- */}
      {activeSubView === 'skills-contracts' && (
        <div className="space-y-3">
          {displayedEmployees.map((emp) => {
            const currentData = editableStaff[emp.id] || {
              skills: emp.skills,
              contractHours: emp.contractHours || 40,
            };
            const currentScores = currentData.skills;
            const currentHours = currentData.contractHours;
            const isFullTime = currentHours >= 38;

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-nicora-border shadow-clean space-y-3.5 transition-all hover:border-nicora-teal-border/70"
              >
                {/* Header Collaboratore & Selettore Rapido Ore Contratto */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl bg-nicora-teal-light text-nicora-teal font-black text-xs flex items-center justify-center border border-nicora-teal-border/40">
                      {emp.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-nicora-title">
                          {emp.name}
                        </span>
                        {emp.isManager && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <ShieldCheck size={10} /> Direzione
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400">
                        Reparto Primario: <strong className="text-neutral-700">{emp.role}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Controller Ore da Contratto Settimanali */}
                  <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-2xl border border-neutral-200">
                    <Clock size={15} className="text-nicora-teal flex-shrink-0" />
                    <span className="text-xs font-bold text-neutral-700">Contratto:</span>

                    {/* Preset rapidi */}
                    <div className="flex items-center gap-1">
                      {[40, 30, 24, 20].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleContractHoursChange(emp.id, h)}
                          className={`px-2 py-1 rounded-lg text-xs font-black transition-all ${
                            currentHours === h
                              ? 'bg-nicora-teal text-white shadow-xs'
                              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>

                    {/* Stepper +/- */}
                    <div className="flex items-center gap-1 pl-1 border-l border-neutral-200">
                      <button
                        type="button"
                        onClick={() => handleContractHoursChange(emp.id, currentHours - 2)}
                        className="w-6 h-6 rounded-md bg-white border border-neutral-300 text-neutral-700 font-bold text-xs flex items-center justify-center hover:bg-neutral-100 active:scale-90"
                        title="Diminuisci ore settimanali"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-neutral-800 w-8 text-center">
                        {currentHours}h
                      </span>
                      <button
                        type="button"
                        onClick={() => handleContractHoursChange(emp.id, currentHours + 2)}
                        className="w-6 h-6 rounded-md bg-white border border-neutral-300 text-neutral-700 font-bold text-xs flex items-center justify-center hover:bg-neutral-100 active:scale-90"
                        title="Aumenta ore settimanali"
                      >
                        +
                      </button>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isFullTime
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isFullTime ? 'Full' : 'Part'}
                    </span>
                  </div>
                </div>

                {/* Griglia Competenze 1–10 sui 5 Reparti */}
                <div>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Punteggio Competenze (1 = Base, 10 = Specialista Master):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    {DEPARTMENTS.map((dept) => {
                      const score = currentScores[dept] ?? 5;
                      const deptShort =
                        dept === 'Serra Calda'
                          ? 'S. Calda'
                          : dept === 'Serra Fredda'
                          ? 'S. Fredda'
                          : dept;

                      return (
                        <div
                          key={dept}
                          className="bg-neutral-50 rounded-xl p-2 border border-neutral-200 flex flex-col items-center justify-between"
                        >
                          <span
                            className="text-[11px] font-extrabold text-neutral-700 truncate w-full"
                            title={dept}
                          >
                            {deptShort}
                          </span>

                          <div className="my-1.5 flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleScoreChange(emp.id, dept, score - 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center justify-center active:scale-90 shadow-xs"
                            >
                              -
                            </button>

                            <span
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs shadow-xs ${getScoreBadgeClass(
                                score
                              )}`}
                            >
                              {score}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleScoreChange(emp.id, dept, score + 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center justify-center active:scale-90 shadow-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- VISTA 2: ANAGRAFICA, PIN & NUOVI ASSUNTI --- */}
      {activeSubView === 'roster' && (
        <div className="space-y-3">
          {displayedEmployees.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-neutral-400 border border-nicora-border text-xs">
              <Users size={32} className="mx-auto mb-2 text-neutral-300" />
              Nessun collaboratore trovato in questa categoria.
            </div>
          ) : (
            displayedEmployees.map((emp) => {
              const isArchived = emp.isActive === false;
              const deptStyle = DEPARTMENT_COLORS[emp.role] || DEPARTMENT_COLORS['Cassa'];

              return (
                <div
                  key={emp.id}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-clean ${
                    isArchived
                      ? 'opacity-75 bg-neutral-50/70 border-dashed border-neutral-300'
                      : 'border-nicora-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Info Principali */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-black text-sm text-neutral-700 flex-shrink-0 shadow-xs">
                        {emp.avatar}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-nicora-title">
                            {emp.name}
                          </h4>
                          {emp.isManager && (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <ShieldCheck size={10} /> Direzione
                            </span>
                          )}
                          {isArchived && (
                            <span className="bg-neutral-200 text-neutral-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                              Archiviato
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${deptStyle.badge}`}
                          >
                            {emp.role}
                          </span>
                          <span className="text-neutral-400">•</span>
                          <span className="text-neutral-700 font-bold text-[11px]">
                            {emp.contractHours || 40}h / settimana
                          </span>
                          <span className="text-neutral-400">•</span>
                          <span className="text-neutral-600 font-medium text-[11px] flex items-center gap-1">
                            <KeyRound size={11} className="text-amber-600" />
                            <span>PIN: •••• ({emp.password || '1234'})</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Azioni Modifica / Archiviazione */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="flex-1 sm:flex-initial px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors min-h-[40px]"
                      >
                        <Edit3 size={13} />
                        <span>Modifica Anagrafica</span>
                      </button>

                      {isArchived ? (
                        <button
                          onClick={() => onArchiveEmployee(emp.id, true)}
                          className="flex-1 sm:flex-initial px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1 transition-colors min-h-[40px]"
                          title="Riattiva questo collaboratore per la pianificazione turni"
                        >
                          <RefreshCw size={13} />
                          <span>Riattiva</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onArchiveEmployee(emp.id, false)}
                          className="flex-1 sm:flex-initial px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1 transition-colors min-h-[40px]"
                          title="Archivia cessato (preserva lo storico turni)"
                        >
                          <UserX size={13} />
                          <span>Archivia</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recapiti e Competenze sintetiche */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-500">
                    <div className="flex flex-wrap items-center gap-3">
                      {emp.email && (
                        <span className="flex items-center gap-1 text-neutral-600 truncate">
                          <Mail size={12} className="text-neutral-400" />
                          {emp.email}
                        </span>
                      )}
                      {emp.phone && (
                        <span className="flex items-center gap-1 text-neutral-600">
                          <Phone size={12} className="text-neutral-400" />
                          {emp.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {DEPARTMENTS.map((d) => {
                        const score = emp.skills?.[d] ?? 5;
                        return (
                          <span
                            key={d}
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              score >= 8
                                ? 'bg-emerald-100 text-emerald-800'
                                : score >= 5
                                ? 'bg-neutral-100 text-neutral-700'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                            title={`Competenza ${d}: ${score}/10`}
                          >
                            {d.slice(0, 3)}: {score}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- MODALE NUOVO / MODIFICA ANAGRAFICA --- */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 max-h-[92vh] flex flex-col">
            <div className="bg-nicora-teal text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-nicora-orange" />
                <h3 className="font-extrabold text-base sm:text-lg">
                  {editingEmployee ? `Modifica: ${editingEmployee.name}` : 'Nuovo Assunto / Collaboratore'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Nome e Cognome / Riferimento:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Es. Elena Rossi o Elena R."
                  className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-nicora-teal min-h-[44px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Reparto Primario:</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Department })}
                    className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-nicora-teal min-h-[44px]"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Ore Contratto Settimanali:</label>
                  <input
                    type="number"
                    min={10}
                    max={50}
                    value={formData.contractHours}
                    onChange={(e) => setFormData({ ...formData, contractHours: Number(e.target.value) })}
                    className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-nicora-teal min-h-[44px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1 flex items-center gap-1">
                    <KeyRound size={12} className="text-amber-600" />
                    <span>PIN Accesso (4 cifre):</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="1234"
                    className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-sm font-bold tracking-widest focus:ring-2 focus:ring-nicora-teal min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Recapito Telefonico:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+39 340 ..."
                    className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-nicora-teal min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Email Aziendale:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nome.cognome@nicoragarden.it"
                  className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-nicora-teal min-h-[44px]"
                />
              </div>

              {/* Matrice Competenze */}
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 space-y-2.5">
                <label className="block font-extrabold text-neutral-800 text-xs flex items-center gap-1.5">
                  <Award size={14} className="text-amber-500" />
                  <span>Competenze per Reparto (1–10):</span>
                </label>

                <div className="space-y-2">
                  {DEPARTMENTS.map((dept) => {
                    const score = formData.skills[dept] ?? 5;
                    return (
                      <div key={dept} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-neutral-700 w-28 truncate">{dept}</span>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={score}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              skills: { ...formData.skills, [dept]: Number(e.target.value) },
                            })
                          }
                          className="flex-1 accent-nicora-teal"
                        />
                        <span className="font-black text-xs text-nicora-teal w-6 text-right">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isManager"
                  checked={formData.isManager}
                  onChange={(e) => setFormData({ ...formData, isManager: e.target.checked })}
                  className="w-4 h-4 rounded text-nicora-teal accent-nicora-teal"
                />
                <label htmlFor="isManager" className="font-bold text-neutral-800 cursor-pointer">
                  Autorizza come Direzione / Manager (accesso a modifiche turni e approvazioni)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors min-h-[44px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-nicora-orange hover:bg-nicora-orange-hover text-white font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] min-h-[44px]"
                >
                  <Check size={16} />
                  <span>{editingEmployee ? 'Salva Modifiche' : 'Crea Collaboratore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default StaffPersonnel;
