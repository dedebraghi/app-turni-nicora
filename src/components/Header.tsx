import React from 'react';
import { NicoraLogo } from './NicoraLogo';
import { ShieldCheck, LogOut, User } from 'lucide-react';
import { UserSession } from '../types';
import { InstallPWAButton } from './InstallPWAButton';

interface HeaderProps {
  session: UserSession;
  onLogout: () => void;
  isManagerMode: boolean;
  onToggleManagerMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onLogout,
  isManagerMode,
  onToggleManagerMode,
}) => {
  const isManagerUser = session.role === 'manager';

  return (
    <header className="sticky top-0 z-30 bg-nicora-teal text-white shadow-md pt-safe">
      {/* Top Brand Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <NicoraLogo size={32} />
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
              NICORA GARDEN
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-nicora-orange px-1.5 py-0.5 rounded text-white">
                Turni
              </span>
            </h1>
            <p className="text-[11px] text-nicora-teal-light/80">Punto Vendita & Serre</p>
          </div>
        </div>

        {/* Right action buttons: Install PWA + Logout */}
        <div className="flex items-center gap-2">
          <InstallPWAButton />

          {/* Se è Responsabile: Toggle rapido modalità modifica */}
          {isManagerUser && (
            <button
              onClick={onToggleManagerMode}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation min-h-[34px] ${
                isManagerMode
                  ? 'bg-nicora-orange text-white ring-2 ring-nicora-orange-border shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title="Attiva o disattiva modifiche rapide sui turni"
            >
              <ShieldCheck size={15} />
              <span>{isManagerMode ? 'Modifica ATTIVA' : 'Modifica Turni'}</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-600/80 text-white/90 hover:text-white flex items-center justify-center transition-colors touch-manipulation"
            title="Esci dall'account"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Profilo utente loggato */}
      <div className="bg-[#024E52] px-4 py-1.5 flex items-center justify-between border-t border-white/10 text-xs">
        <div className="flex items-center gap-2 text-white">
          <div className="w-5 h-5 rounded-full bg-nicora-orange flex items-center justify-center text-[10px] font-bold text-white">
            {session.user.avatar}
          </div>
          <span className="font-bold truncate max-w-[180px]">{session.user.name}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
            isManagerUser ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30' : 'bg-white/15 text-nicora-teal-light'
          }`}>
            {isManagerUser ? 'Responsabile' : session.user.role}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="text-[11px] text-nicora-teal-light/80 hover:text-white underline font-medium cursor-pointer"
        >
          Cambia utente
        </button>
      </div>
    </header>
  );
};
