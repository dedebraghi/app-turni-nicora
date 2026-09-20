import React, { useState } from 'react';
import { Department, Employee, LocationId, SkillScores } from '../../domain/types';
import { DEPARTMENTS, DEPARTMENT_COLORS } from '../../domain/rules';
import { Archive, Award, Check, Edit3, KeyRound, Mail, Phone, Plus, RefreshCw, Search, ShieldCheck, UserCheck, UserPlus, Users, UserX, X } from 'lucide-react';

interface StaffManagementProps {
  employees: Employee[];
  activeLocation: LocationId;
  onSaveEmployee: (employee: Employee) => void;
  onArchiveEmployee: (employeeId: string, isActive: boolean) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  employees,
  activeLocation,
  onSaveEmployee,
  onArchiveEmployee,
}) => {
  const [tabFilter, setTabFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Filtra dipendenti della sede corrente
  const storeEmployees = employees.filter((e) => e.locationId === activeLocation);
  const activeEmployees = storeEmployees.filter((e) => e.isActive !== false);
  const archivedEmployees = storeEmployees.filter((e) => e.isActive === false);

  const displayedEmployees = (tabFilter === 'active' ? activeEmployees : archivedEmployees).filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Form State per Nuovo / Modifica
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
    setFormData({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      contractHours: emp.contractHours || 40,
      password: emp.password || '1234',
      email: emp.email || '',
      phone: emp.phone || '',
      isManager: Boolean(emp.isManager),
      skills: { ...emp.skills },
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
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 max-w-4xl mx-auto">
      
      {/* Header & Riepilogo Organico */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-nicora-border shadow-clean space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users size={22} className="text-nicora-teal" />
              <h2 className="text-lg sm:text-xl font-black text-nicora-title">
                Gestione Staff & Collaboratori
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Organico della sede di <strong className="text-neutral-800 capitalize">{activeLocation}</strong> ({storeEmployees.length} totali registrati)
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-nicora-orange hover:bg-nicora-orange-hover text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 touch-manipulation min-h-[44px]"
          >
            <UserPlus size={16} />
            <span>Nuovo Collaboratore</span>
          </button>
        </div>

        {/* Metriche Rapide Organico */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 text-center">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Attivi</span>
            <span className="text-lg font-black text-neutral-800">{activeEmployees.length}</span>
          </div>
          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Full-Time (40h)</span>
            <span className="text-lg font-black text-emerald-800">
              {activeEmployees.filter((e) => (e.contractHours || 40) >= 36).length}
            </span>
          </div>
          <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 text-center">
            <span className="text-[10px] uppercase font-bold text-sky-700 block">Part-Time</span>
            <span className="text-lg font-black text-sky-800">
              {activeEmployees.filter((e) => (e.contractHours || 40) < 36).length}
            </span>
          </div>
          <div className="bg-neutral-100 p-2.5 rounded-xl border border-neutral-200 text-center">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Archiviati</span>
            <span className="text-lg font-black text-neutral-600">{archivedEmployees.length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filtri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Tab Attivi vs Archiviati */}
        <div className="flex bg-neutral-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setTabFilter('active')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              tabFilter === 'active'
                ? 'bg-white text-nicora-teal shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <UserCheck size={14} />
            <span>Collaboratori Attivi ({activeEmployees.length})</span>
          </button>

          <button
            onClick={() => setTabFilter('archived')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              tabFilter === 'archived'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Archive size={14} />
            <span>Archiviati / Cessati ({archivedEmployees.length})</span>
          </button>
        </div>

        {/* Barra di Ricerca */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per nome o reparto..."
            className="w-full bg-white border border-nicora-border rounded-xl pl-8 pr-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-nicora-teal focus:outline-none shadow-clean"
          />
          <Search size={14} className="absolute left-2.5 top-3 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Lista Schede Collaboratori */}
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
                  isArchived ? 'opacity-75 bg-neutral-50/70 border-dashed border-neutral-300' : 'border-nicora-border'
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${deptStyle.badge}`}>
                          {emp.role}
                        </span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-600 font-semibold text-[11px]">
                          {emp.contractHours || 40}h/settimana
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
                      <span>Modifica</span>
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

                {/* Recapiti e Competenze */}
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

                  {/* Competenze sintetiche */}
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

      {/* --- MODALE NUOVO / MODIFICA COLLABORATORE --- */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 max-h-[92vh] flex flex-col">
            
            {/* Header Modale */}
            <div className="bg-nicora-teal text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-nicora-orange" />
                <h3 className="font-extrabold text-base sm:text-lg">
                  {editingEmployee ? `Modifica Anagrafica: ${editingEmployee.name}` : 'Nuovo Assunto / Collaboratore'}
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

            {/* Form Scrollabile */}
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Nome Completo */}
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

              {/* Reparto e Ore Contratto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Reparto Primario:
                  </label>
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
                  <label className="block font-bold text-neutral-800 mb-1">
                    Ore Contratto Settimanali:
                  </label>
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

              {/* PIN e Telefono */}
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
                  <label className="block font-bold text-neutral-800 mb-1">
                    Recapito Telefonico:
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+39 340 ..."
                    className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-nicora-teal min-h-[44px]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Email Aziendale:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nome.cognome@nicoragarden.it"
                  className="w-full bg-neutral-50 border border-nicora-border rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-nicora-teal min-h-[44px]"
                />
              </div>

              {/* Matrice Competenze (1-10) */}
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
                        <span className="font-black text-xs text-nicora-teal w-6 text-right">
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkbox Manager */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isManager"
                  checked={formData.isManager}
                  onChange={(e) => setFormData({ ...formData, isManager: e.target.checked })}
                  className="w-4 h-4 rounded text-nicora-teal accent-nicora-teal"
                />
                <label htmlFor="isManager" className="font-bold text-neutral-800 cursor-pointer">
                  Autorizza come Manager / Direzione (accesso a modifica turni e approvazioni)
                </label>
              </div>

              {/* Pulsanti Azione */}
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
