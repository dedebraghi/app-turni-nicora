import React from 'react';
import { NicoraLogo } from './NicoraLogo';
import { ShieldCheck, LogOut, Award, MapPin } from 'lucide-react';
import { LocationId, UserSession } from '../types';
import { InstallPWAButton } from './InstallPWAButton';
import { LOCATIONS } from '../mockData';

interface HeaderProps {
  session: UserSession;
  onLogout: () => void;
  isManagerMode: boolean;
  onToggleManagerMode: () => void;
  activeLocation: LocationId;
  onChangeLocation: (loc: LocationId) => void;
  onOpenSkillsMatrix: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onLogout,
  isManagerMode,
  onToggleManagerMode,
  activeLocation,
  onChangeLocation,
  onOpenSkillsMatrix,
}) => {
  const isManagerUser = session.role === 'manager';

  return (
    <header className="sticky top-0 z-30 bg-nicora-teal text-white shadow-md pt-safe">
      {/* Top Brand Bar */}
      <div className="px-3.5 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <NicoraLogo size={30} />
          <div>
            <h1 className="font-bold text-sm leading-tight tracking-tight text-white flex items-center gap-1">
              NICORA GARDEN
              <span className="text-[9px] uppercase font-semibold tracking-wider bg-nicora-orange px-1.5 py-0.2 rounded text-white">
                Turni
              </span>
            </h1>
            <p className="text-[10px] text-nicora-teal-light/80">Gestione Personale & Serre</p>
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-1.5">
          <InstallPWAButton />

          {/* Se è Responsabile: Tasto rapido Matrice Competenze */}
          {isManagerUser && (
            <button
              onClick={onOpenSkillsMatrix}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white active:scale-95 transition-all"
              title="Visualizza e modifica matrice competenze 1-10"
            >
              <Award size={13} className="text-amber-300" />
              <span className="hidden xs:inline">Competenze</span>
            </button>
          )}

          {/* Toggle modalità modifica */}
          {isManagerUser && (
            <button
              onClick={onToggleManagerMode}
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all active:scale-95 ${
                isManagerMode
                  ? 'bg-nicora-orange text-white ring-1 ring-nicora-orange-border shadow-xs'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title="Attiva o disattiva modifiche rapide sui turni"
            >
              <ShieldCheck size={13} />
              <span>{isManagerMode ? 'Modifica ON' : 'Modifica'}</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-600/80 text-white/90 hover:text-white flex items-center justify-center transition-colors touch-manipulation"
            title="Esci dall'account"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Selettore Punto Vendita (Gazzada vs Varese) + Profilo Utente */}
      <div className="bg-[#024E52] px-3.5 py-1.5 flex items-center justify-between border-t border-white/10 text-xs">
        {/* Switch Sede */}
        <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/10">
          {LOCATIONS.map((loc) => {
            const isActive = loc.id === activeLocation;
            return (
              <button
                key={loc.id}
                onClick={() => onChangeLocation(loc.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-nicora-orange text-white shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin size={10} />
                <span>{loc.shortName}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-white/60'}`}>
                  {loc.defaultStaffCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Profilo utente */}
        <div className="flex items-center gap-1.5 text-white">
          <div className="w-5 h-5 rounded-full bg-nicora-orange flex items-center justify-center text-[9px] font-bold text-white">
            {session.user.avatar}
          </div>
          <span className="font-bold truncate max-w-[100px] text-[11px]">{session.user.name.split(' ')[0]}</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
            isManagerUser ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30' : 'bg-white/15 text-nicora-teal-light'
          }`}>
            {isManagerUser ? 'Resp.' : session.user.role}
          </span>
        </div>
      </div>
    </header>
  );
};
