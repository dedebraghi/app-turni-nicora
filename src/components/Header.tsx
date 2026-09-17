import React from 'react';
import { NicoraLogo } from './NicoraLogo';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { Employee } from '../types';
import { InstallPWAButton } from './InstallPWAButton';

interface HeaderProps {
  currentEmployeeId: string;
  employees: Employee[];
  onSelectEmployee: (id: string) => void;
  isManagerMode: boolean;
  onToggleManagerMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEmployeeId,
  employees,
  onSelectEmployee,
  isManagerMode,
  onToggleManagerMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-nicora-teal text-white shadow-md pt-safe">
      {/* Top Brand Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <NicoraLogo size={32} />
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
              NICORA GARDEN
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-nicora-orange px-1.5 py-0.5 rounded text-white">
                Turni
              </span>
            </h1>
            <p className="text-xs text-nicora-teal-light/80">Punto Vendita & Serre</p>
          </div>
        </div>

        {/* Right action buttons: Install PWA + Manager Mode */}
        <div className="flex items-center gap-2">
          <InstallPWAButton />
          
          <button
            onClick={onToggleManagerMode}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation min-h-[34px] ${
              isManagerMode
                ? 'bg-nicora-orange text-white ring-2 ring-nicora-orange-border shadow-sm'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
            title="Attiva modalità responsabile per modificare i turni"
          >
            <ShieldCheck size={16} className={isManagerMode ? 'animate-pulse' : ''} />
            <span>{isManagerMode ? 'Resp. ATTIVO' : 'Responsabile'}</span>
          </button>
        </div>
      </div>

      {/* Quick Collaborator Selector ("Chi sei tu?") */}
      <div className="bg-[#024E52] px-4 py-2 flex items-center justify-between border-t border-white/10 text-xs">
        <div className="flex items-center gap-1.5 text-nicora-teal-light font-medium">
          <UserCheck size={14} className="text-nicora-orange-border" />
          <span>Chi sei tu?</span>
        </div>
        <div className="relative">
          <select
            value={currentEmployeeId}
            onChange={(e) => onSelectEmployee(e.target.value)}
            className="bg-nicora-teal text-white font-semibold text-xs py-1 px-3 pr-7 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-nicora-orange appearance-none cursor-pointer"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id} className="text-neutral-900 bg-white">
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};
