import React, { useState } from 'react';
import { Employee, LocationId } from '../../domain/types';
import { NicoraLogo } from '../NicoraLogo';
import { LogOut } from 'lucide-react';

export interface MobileHeaderProps {
  title: string;
  employee?: Employee;
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  gazzadaStaffCount?: number;
  vareseStaffCount?: number;
  onLogout?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  employee,
  activeLocation,
  onChangeLocation,
  gazzadaStaffCount = 10,
  vareseStaffCount = 16,
  onLogout,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#f2fcf7]/95 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(10,71,75,0.06)] border-b border-[#e2e8e4]/60 pt-safe">
      <div className="px-4 pt-2.5 pb-2 flex flex-col gap-2">
        {/* Riga 1: Logo & Brand + Utente loggato con menu profilo */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <NicoraLogo size={32} variant="icon" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#a73a00] font-bold uppercase tracking-widest leading-none truncate">
                ATELIER BOTANICO &amp; VIVAI
              </span>
              <span className="font-serif text-xl font-bold text-[#0a474b] leading-tight truncate">
                {title}
              </span>
            </div>
          </div>

          {/* Profilo Utente con dropdown di logout */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 text-left focus:outline-none active:opacity-80 transition-opacity"
              title="Profilo e opzioni sessione"
            >
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-bold text-neutral-900 leading-tight">
                  {employee?.name || 'Sabrina'}
                </span>
                <span className="text-[10px] text-neutral-500 leading-none">
                  {employee?.role ? `Rep. ${employee.role}` : 'Rep. Cassa'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#002f32] flex items-center justify-center text-white font-serif font-bold text-xs shadow-xs ring-2 ring-transparent active:ring-[#a73a00]">
                {employee?.name?.charAt(0) || 'S'}
              </div>
            </button>

            {/* Menu Profilo e Logout Popup */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl bg-white p-3.5 shadow-modal border border-[#e2e8e4] animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-full bg-[#002f32] text-white flex items-center justify-center font-serif font-bold text-sm">
                      {employee?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-neutral-900 truncate">
                        {employee?.name || 'Sabrina'}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {employee?.role ? `Reparto ${employee.role}` : 'Collaboratore'}
                      </span>
                      <span className="text-[9px] text-[#a73a00] font-semibold uppercase mt-0.5">
                        {activeLocation === 'gazzada' ? 'Sede Gazzada' : 'Sede Varese'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                    >
                      <LogOut size={14} />
                      <span>Esci dalla sessione</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Riga 2: Switch Sedi compatto */}
        <div className="flex items-center">
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
              Gazzada {gazzadaStaffCount}
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
              Varese {vareseStaffCount}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
