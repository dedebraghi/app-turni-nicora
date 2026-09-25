import React from 'react';
import { NicoraLogo } from '../NicoraLogo';
import { InstallPWAButton } from '../InstallPWAButton';
import { LOCATIONS } from '../../domain/mockData';
import { Employee, LocationId, UserSession } from '../../domain/types';
import { LogOut, MapPin, ShieldCheck, Cloud, CloudOff } from 'lucide-react';
import { getCloudStatus } from '../../services/supabaseService';

interface AppHeaderProps {
  session: UserSession;
  onLogout: () => void;
  isManagerMode: boolean;
  onToggleManagerMode: () => void;
  activeLocation: LocationId;
  onChangeLocation: (loc: LocationId) => void;
  employees?: Employee[];
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  session,
  onLogout,
  isManagerMode,
  onToggleManagerMode,
  activeLocation,
  onChangeLocation,
  employees = [],
}) => {
  const isManagerUser = session.role === 'manager' || session.user.isManager;
  const cloudStatus = getCloudStatus();

  return (
    <header className="hidden md:block sticky top-0 z-30 bg-nicora-teal-dark text-white shadow-clean border-b border-white/10 pt-safe">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <NicoraLogo size={30} variant="white" />
          <div className="hidden sm:flex flex-col border-l border-white/20 pl-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-nicora-orange-light leading-tight">
              Atelier Botanico
            </span>
            <span className="text-[11px] font-serif text-white/90 leading-tight">
              Gestione Turni
            </span>
          </div>
        </div>

        {/* Center: Sede Switcher (Desktop & Mobile) */}
        <div className="flex items-center gap-1 bg-black/25 p-1 rounded-full border border-white/10 shadow-inner">
          {LOCATIONS.map((loc) => {
            const isActive = loc.id === activeLocation;
            const dynamicStaffCount = employees.length > 0
              ? employees.filter((e) => e.locationId === loc.id && e.isActive !== false).length
              : loc.defaultStaffCount;

            return (
              <button
                key={loc.id}
                onClick={() => onChangeLocation(loc.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-nicora-orange text-white shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin size={12} className={isActive ? 'text-white' : 'text-white/60'} />
                <span>{loc.shortName}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-white/15 text-white/70'
                  }`}
                >
                  {dynamicStaffCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Action Tools & User Profile */}
        <div className="flex items-center gap-2">
          {/* Badge Stato Connessione Cloud */}
          {cloudStatus.isConfigured ? (
            <div
              className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-200 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full font-medium"
              title="Sincronizzazione Supabase Cloud attiva"
            >
              <Cloud size={12} className="text-emerald-400" />
              <span className="hidden md:inline">Cloud Live</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          ) : (
            <div
              className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/70 bg-black/25 border border-white/10 px-2.5 py-1 rounded-full font-medium"
              title="Modalità offline / locale attiva (localStorage)"
            >
              <CloudOff size={12} className="text-white/50" />
              <span className="hidden md:inline">Locale</span>
            </div>
          )}

          <InstallPWAButton />

          {/* Badge Ruolo Direzione */}
          {isManagerUser && (
            <div
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 border border-amber-300/60 shadow-xs"
              title="Accesso effettuato come Direzione / Responsabile"
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Direzione</span>
            </div>
          )}

          {/* User Badge */}
          <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10">
            <div className="w-6 h-6 rounded-full bg-nicora-orange flex items-center justify-center text-[10px] font-black text-white">
              {session.user.avatar}
            </div>
            <div className="text-left leading-tight">
              <span className="block text-xs font-semibold text-white truncate max-w-[120px]">
                {session.user.name}
              </span>
              <span className="block text-[9px] text-nicora-teal-light/80 uppercase tracking-wider">
                {session.role === 'manager' ? 'Responsabile' : session.user.role}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 text-white/90 hover:text-white flex items-center justify-center transition-colors active:scale-90"
            title="Esci dalla sessione"
          >
            <LogOut size={14} />
          </button>
        </div>

      </div>
    </header>
  );
};
