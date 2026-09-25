import React, { useState, useRef, useEffect } from 'react';
import { Employee, LocationId, UserSession } from '../../domain/types';
import { NicoraLogo } from '../NicoraLogo';
import { LOCATIONS, MANAGER_MASTER_PASSWORD } from '../../domain/mockData';
import { 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Check, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Store, 
  User, 
  Users 
} from 'lucide-react';

interface LoginScreenProps {
  employees: Employee[];
  onLoginSuccess: (session: UserSession, activeLocation: LocationId) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ employees, onLoginSuccess }) => {
  const [activeLocation, setActiveLocation] = useState<LocationId>('gazzada');
  const [loginRole, setLoginRole] = useState<'employee' | 'manager'>('employee');

  const storeEmployees = employees.filter((e) => e.locationId === activeLocation && e.isActive !== false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    storeEmployees[0]?.id || employees[0]?.id || ''
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [managerEmail, setManagerEmail] = useState<string>('vittore@nicoragarden.it');
  const [password, setPassword] = useState<string>('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  // Handle location switch
  const handleLocationChange = (loc: LocationId) => {
    setActiveLocation(loc);
    const newStoreEmps = employees.filter((e) => e.locationId === loc && e.isActive !== false);
    if (newStoreEmps.length > 0) {
      setSelectedEmployeeId(newStoreEmps[0].id);
    }
    setIsDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update password demo default when changing roles
  const handleRoleChange = (role: 'employee' | 'manager') => {
    setLoginRole(role);
    setError('');
    setPassword(role === 'manager' ? 'admin' : '1234');
    setIsDropdownOpen(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginRole === 'employee') {
      const emp = employees.find((e) => e.id === selectedEmployeeId);
      if (!emp) {
        setError('Seleziona il tuo profilo collaboratore');
        return;
      }
      const validPins = [emp.password, '1234', '123'].filter(Boolean);
      if (password && !validPins.includes(password)) {
        setError('PIN non corretto (predefinito demo: 1234)');
        return;
      }

      onLoginSuccess(
        {
          user: emp,
          role: 'employee',
        },
        emp.locationId
      );
    } else {
      if (password !== MANAGER_MASTER_PASSWORD && password !== 'admin') {
        setError('Password direzione non corretta (demo: admin)');
        return;
      }

      const managerUser =
        employees.find((e) => e.locationId === activeLocation && e.isManager) ||
        employees.find((e) => e.isManager) || {
          id: 'manager-admin',
          name: 'Vittore Nicora',
          locationId: activeLocation,
          role: 'Serra Calda',
          skills: { Cassa: 10, Fioreria: 8, Decor: 8, 'Serra Calda': 10, 'Serra Fredda': 10 },
          avatar: 'VN',
          email: managerEmail,
          isManager: true,
        };

      onLoginSuccess(
        {
          user: managerUser,
          role: 'manager',
        },
        activeLocation
      );
    }
  };

  const selectedEmp = employees.find((e) => e.id === selectedEmployeeId) || storeEmployees[0];
  const activeLocName = activeLocation === 'gazzada' ? 'Gazzada Schianno' : 'Varese';

  return (
    <div className="min-h-screen bg-nicora-bg flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Main Card */}
        <div className="bg-nicora-card rounded-2xl shadow-clean border border-nicora-sage-border overflow-hidden">
          
          {/* Header Brand */}
          <div className="pt-7 pb-5 px-6 text-center flex flex-col items-center bg-nicora-bg border-b border-nicora-sage-border">
            <span className="text-[11px] uppercase font-bold tracking-[0.22em] text-nicora-orange block mb-2">
              Atelier Botanico &amp; Vivai
            </span>
            
            <div className="py-1 mb-2">
              <NicoraLogo size={46} />
            </div>

            <p className="text-xs text-nicora-muted font-normal max-w-xs leading-relaxed">
              Piattaforma Gestione Turni Punti Vendita
            </p>

            {/* Sede Switcher Pills */}
            <div className="mt-4 inline-flex p-1 bg-nicora-teal-light/60 rounded-full border border-nicora-teal-border/40 shadow-inner">
              {LOCATIONS.map((loc) => {
                const isSelected = loc.id === activeLocation;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleLocationChange(loc.id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-nicora-teal text-white shadow-xs'
                        : 'text-nicora-text/70 hover:text-nicora-text'
                    }`}
                  >
                    <MapPin size={13} className={isSelected ? 'text-nicora-orange-border' : 'text-nicora-muted'} />
                    <span>{loc.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-7 space-y-5">
            
            {/* Ruolo Selector Segmented Tab */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleRoleChange('employee')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  loginRole === 'employee'
                    ? 'bg-white text-nicora-teal shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <User size={15} className={loginRole === 'employee' ? 'text-nicora-orange' : ''} />
                <span>Collaboratore</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('manager')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  loginRole === 'manager'
                    ? 'bg-nicora-teal text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <ShieldCheck size={15} />
                <span>Responsabile</span>
              </button>
            </div>

            {/* Shift Card Status Row */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-medium text-nicora-muted">
                  Sede: <strong className="text-nicora-text">{activeLocName}</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-nicora-orange bg-nicora-orange/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Oggi Aperto
              </span>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs animate-in fade-in">
                <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              
              {loginRole === 'employee' ? (
                <div className="space-y-1.5" ref={dropdownRef}>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-nicora-text flex items-center gap-1">
                      <span>Seleziona il tuo nominativo:</span>
                    </label>
                    <span className="text-[11px] text-nicora-muted font-medium flex items-center gap-1">
                      <Users size={12} /> {storeEmployees.length} a {activeLocation === 'gazzada' ? 'Gazzada' : 'Varese'}
                    </span>
                  </div>

                  {/* Custom Collaborator Dropdown Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-neutral-50 hover:bg-neutral-100/70 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between transition-colors min-h-[46px] focus:outline-none focus:ring-2 focus:ring-nicora-orange"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-nicora-teal/10 text-nicora-teal flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                          {selectedEmp?.avatar || selectedEmp?.name.slice(0, 2).toUpperCase() || 'NC'}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-neutral-800 text-sm">{selectedEmp?.name}</span>
                          <span className="text-neutral-500 text-xs ml-1.5">({selectedEmp?.role})</span>
                        </div>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-nicora-orange' : ''}`} 
                      />
                    </button>

                    {/* Dropdown Menu List */}
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-nicora-sage-border rounded-xl shadow-lg py-1 z-30 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        {storeEmployees.map((emp) => {
                          const isCurrent = emp.id === selectedEmployeeId;
                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setSelectedEmployeeId(emp.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors ${
                                isCurrent 
                                  ? 'bg-nicora-orange/10 text-nicora-orange font-bold' 
                                  : 'hover:bg-neutral-50 text-neutral-800 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                  isCurrent ? 'bg-nicora-orange text-white' : 'bg-neutral-100 text-neutral-600'
                                }`}>
                                  {emp.avatar || emp.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="truncate">{emp.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                                  {emp.role}
                                </span>
                                {isCurrent && <Check size={14} className="text-nicora-orange" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Metadata Pill */}
                  {selectedEmp && (
                    <div className="p-2 bg-nicora-teal-light/40 border border-nicora-teal-border/30 rounded-xl flex items-center gap-2 text-[11px] text-nicora-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-nicora-teal flex-shrink-0"></span>
                      <p className="truncate">
                        Email: <strong className="text-neutral-800 font-semibold">{selectedEmp.email}</strong> • Reparto: <strong className="text-neutral-800 font-semibold">{selectedEmp.role}</strong>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block font-semibold text-nicora-text">
                    Email Responsabile Punto Vendita:
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl pl-9 pr-3 py-2.5 text-neutral-800 font-medium focus:ring-2 focus:ring-nicora-teal focus:outline-none min-h-[44px]"
                      placeholder="es. vittore@nicoragarden.it"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                      <Mail size={16} />
                    </div>
                  </div>
                </div>
              )}

              {/* Password / PIN */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-nicora-text">
                    {loginRole === 'manager' ? 'Password Direzione:' : 'PIN Personale:'}
                  </label>
                  <span className="text-[10px] text-nicora-orange font-bold uppercase tracking-wider">
                    {loginRole === 'manager' ? 'demo: admin' : 'demo: 1234'}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl pl-9 pr-10 py-2.5 text-neutral-800 font-semibold tracking-widest focus:ring-2 focus:ring-nicora-orange focus:outline-none min-h-[44px]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full text-white font-extrabold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98] touch-manipulation min-h-[48px] text-sm ${
                    loginRole === 'manager'
                      ? 'bg-nicora-teal hover:bg-nicora-teal-hover'
                      : 'bg-nicora-orange hover:bg-nicora-orange-hover'
                  }`}
                >
                  <span>{loginRole === 'manager' ? 'Accedi al Tabellone Direzione' : 'Accedi ai Miei Turni'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Garden Atmosphere Banner Tile (Stitch inspired) */}
        <div className="rounded-2xl overflow-hidden shadow-xs bg-nicora-teal text-white p-4 flex items-center gap-3.5 border border-nicora-teal-hover">
          <div className="w-11 h-11 rounded-full bg-[#1b433d] flex items-center justify-center flex-shrink-0 text-emerald-200">
            <Calendar size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-serif text-sm sm:text-base font-semibold text-white leading-tight truncate">
              Orario Invernale &amp; Turni
            </h3>
            <p className="text-xs text-emerald-100/80 truncate">
              Consultazione disponibilità e scambi turno
            </p>
          </div>
        </div>

        {/* Demo Quick Access Callout Box */}
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-nicora-orange font-bold">
            <Sparkles size={15} />
            <span>Accesso Rapido Demo:</span>
          </div>
          <div className="space-y-1 text-neutral-600 text-[11px] pl-1">
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-nicora-orange flex-shrink-0"></span>
              <span><strong>Collaboratore:</strong> seleziona sede e nominativo (PIN: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-bold text-amber-800">1234</code>)</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-nicora-teal flex-shrink-0"></span>
              <span><strong>Direzione / Manager:</strong> tocca tab Responsabile (password: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-bold text-amber-800">admin</code>)</span>
            </p>
          </div>
        </div>

        {/* Contextual Footer */}
        <div className="text-center space-y-1 pt-1 text-[11px] text-nicora-muted">
          <p className="uppercase tracking-wider font-semibold text-[10px]">
            Sedi Garden Center: Gazzada Schianno • Varese
          </p>
          <p className="text-[10px] text-neutral-400">
            Nicora Verde &amp; Paesaggi S.r.l.
          </p>
        </div>

      </div>
    </div>
  );
};
