import React, { useState } from 'react';
import { Employee, UserSession } from '../types';
import { NicoraLogo } from './NicoraLogo';
import { ShieldCheck, User, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { MANAGER_MASTER_PASSWORD } from '../mockData';

interface LoginScreenProps {
  employees: Employee[];
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ employees, onLoginSuccess }) => {
  const [loginRole, setLoginRole] = useState<'employee' | 'manager'>('employee');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[1]?.id || employees[0]?.id || '');
  const [managerEmail, setManagerEmail] = useState<string>('vittore@nicoragarden.it');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginRole === 'employee') {
      const emp = employees.find((e) => e.id === selectedEmployeeId);
      if (!emp) {
        setError('Seleziona il tuo profilo collaboratore');
        return;
      }
      // Verifica password (default '123' per tutti nell'MVP)
      if (password && password !== (emp.password || '123')) {
        setError('Password non corretta (predefinita: 123)');
        return;
      }

      onLoginSuccess({
        user: emp,
        role: 'employee',
      });
    } else {
      // Login Manager
      if (password !== MANAGER_MASTER_PASSWORD) {
        setError('Password amministratore non corretta (prova: admin)');
        return;
      }

      // Trova manager o usa Vittore
      const managerUser = employees.find((e) => e.isManager) || {
        id: 'manager-admin',
        name: 'Vittore Nicora (Titolare)',
        role: 'Serre e Piante',
        avatar: 'VN',
        email: managerEmail,
        isManager: true,
      };

      onLoginSuccess({
        user: managerUser,
        role: 'manager',
      });
    }
  };

  const selectedEmp = employees.find((e) => e.id === selectedEmployeeId);

  return (
    <div className="min-h-screen bg-nicora-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-nicora-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Brand */}
        <div className="bg-nicora-teal text-white p-6 text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <NicoraLogo size={140} />
          </div>
          <NicoraLogo size={52} className="mx-auto mb-3 shadow-md" />
          <h1 className="font-black text-xl tracking-tight leading-tight">NICORA GARDEN</h1>
          <p className="text-xs text-nicora-teal-light/85 mt-0.5 font-medium">
            Gestione Turni & Personale Punto Vendita
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          
          {/* Ruolo Selector Tab: Dipendente vs Manager */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setLoginRole('employee');
                setError('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                loginRole === 'employee'
                  ? 'bg-white text-nicora-orange shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <User size={15} />
              <span>Dipendente</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginRole('manager');
                setError('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                loginRole === 'manager'
                  ? 'bg-nicora-teal text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <ShieldCheck size={15} />
              <span>Responsabile</span>
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg flex items-center gap-2 text-xs animate-in fade-in">
              <AlertCircle size={15} className="text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            
            {/* Se Dipendente: Seleziona chi sei */}
            {loginRole === 'employee' ? (
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700">
                  Seleziona il tuo Profilo:
                </label>
                <div className="relative">
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full bg-neutral-50 border border-nicora-border rounded-lg px-3 py-2.5 text-neutral-800 font-semibold focus:ring-2 focus:ring-nicora-orange focus:outline-none min-h-[44px] appearance-none cursor-pointer pr-8"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — ({emp.role})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-500">
                    <ArrowRight size={14} />
                  </div>
                </div>

                {selectedEmp && (
                  <p className="text-[11px] text-neutral-500 pt-0.5">
                    Email collegata: <strong>{selectedEmp.email}</strong>
                  </p>
                )}
              </div>
            ) : (
              /* Se Manager: Inserisci Email Responsabile */
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700">
                  Email Aziendale Responsabile:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-nicora-border rounded-lg pl-8 pr-3 py-2.5 text-neutral-800 font-medium focus:ring-2 focus:ring-nicora-teal focus:outline-none min-h-[44px]"
                    placeholder="es. vittore@nicoragarden.it"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-neutral-400 pointer-events-none">
                    <Mail size={15} />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-neutral-700">
                  {loginRole === 'manager' ? 'Password Amministratore:' : 'Password Personale:'}
                </label>
                <span className="text-[10px] text-neutral-400">
                  {loginRole === 'manager' ? 'demo: admin' : 'demo: 123'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-50 border border-nicora-border rounded-lg pl-8 pr-3 py-2.5 text-neutral-800 font-medium focus:ring-2 focus:ring-nicora-orange focus:outline-none min-h-[44px]"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-neutral-400 pointer-events-none">
                  <Lock size={15} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98] touch-manipulation min-h-[46px] ${
                loginRole === 'manager'
                  ? 'bg-nicora-teal hover:bg-nicora-teal-hover'
                  : 'bg-nicora-orange hover:bg-nicora-orange-hover'
              }`}
            >
              <span>{loginRole === 'manager' ? 'Accedi come Responsabile' : 'Accedi ai Miei Turni'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80 text-[11px] text-neutral-500 space-y-1">
            <p className="font-semibold text-neutral-700 flex items-center gap-1">
              <Sparkles size={12} className="text-nicora-orange" /> Accesso Rapido Demo:
            </p>
            <p>• <strong>Dipendenti</strong>: seleziona il nome e premi Accedi (pw: <code>123</code>)</p>
            <p>• <strong>Responsabile</strong>: tocca il tab e inserisci password <code>admin</code></p>
          </div>

        </div>
      </div>
    </div>
  );
};
