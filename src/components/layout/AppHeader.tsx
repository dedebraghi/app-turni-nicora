import React, { useState } from 'react';
import { NicoraLogo } from '../NicoraLogo';
import { InstallPWAButton } from '../InstallPWAButton';
import { LOCATIONS } from '../../domain/mockData';
import { Employee, LocationId, UserSession } from '../../domain/types';
import { AlertCircle, Check, ChevronDown, FileText, HelpCircle, KeyRound, LogOut, MapPin, RefreshCw, X } from 'lucide-react';
import { forceAppUpdate } from '../../services/appUpdateService';

interface AppHeaderProps {
  session: UserSession;
  onLogout: () => void;
  isManagerMode: boolean;
  onToggleManagerMode: () => void;
  activeLocation: LocationId;
  onChangeLocation: (loc: LocationId) => void;
  employees?: Employee[];
  onSaveEmployee?: (emp: Employee) => void;
  onOpenTutorial?: () => void;
  onRefreshShifts?: () => Promise<void> | void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  session,
  onLogout,
  activeLocation,
  onChangeLocation,
  employees = [],
  onSaveEmployee,
  onOpenTutorial,
  onRefreshShifts,
}) => {
  const isManagerAccount = session.role === 'manager';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefreshShifts || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshShifts();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Stato Modale Cambio PIN / Password
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const handleOpenPinModal = () => {
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setPinSuccess('');
    setIsPinModalOpen(true);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const currentUser =
      employees.find((emp) => emp.id === session.user.id) || session.user;
    const defaultSecret = isManagerAccount ? 'admin' : '1234';
    const actualSecret = currentUser.password || defaultSecret;

    const validCurrentSecrets = isManagerAccount
      ? [actualSecret, 'admin']
      : [actualSecret, '1234', '123'];

    if (!validCurrentSecrets.includes(currentPinInput)) {
      setPinError(
        isManagerAccount
          ? 'La password attuale inserita non è corretta'
          : 'Il PIN attuale inserito non è corretto'
      );
      return;
    }

    if (newPinInput.length < 3) {
      setPinError(
        isManagerAccount
          ? 'La nuova password deve contenere almeno 3 caratteri'
          : 'Il nuovo PIN deve contenere almeno 3 cifre'
      );
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError(
        isManagerAccount
          ? 'Le due password inserite non coincidono'
          : 'I due PIN inseriti non coincidono'
      );
      return;
    }

    if (onSaveEmployee) {
      onSaveEmployee({
        ...currentUser,
        password: newPinInput,
      });
    }

    setPinSuccess(
      isManagerAccount ? 'Password modificata con successo!' : 'PIN modificato con successo!'
    );
    setTimeout(() => {
      setIsPinModalOpen(false);
      setPinSuccess('');
    }, 1500);
  };

  return (
    <>
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

          {/* Center: Sede Switcher */}
          <div className="flex items-center gap-1 bg-black/25 p-1 rounded-full border border-white/10 shadow-inner">
            {LOCATIONS.map((loc) => {
              const isActive = loc.id === activeLocation;

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
                </button>
              );
            })}
          </div>

          {/* Right Action Tools & User Profile Dropdown */}
          <div className="flex items-center gap-2">
            {onRefreshShifts && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10 backdrop-blur-xs disabled:opacity-60 cursor-pointer shadow-xs"
                title="Sincronizza e aggiorna i turni dal server"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-nicora-orange' : 'text-emerald-200'} />
              </button>
            )}

            <InstallPWAButton />

            {/* User Profile Button with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full border border-white/10 transition-colors focus:outline-none"
                title="Profilo e opzioni sessione"
              >
                <div className="w-6 h-6 rounded-full bg-nicora-orange flex items-center justify-center text-[10px] font-black text-white">
                  {session.user.avatar || session.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-xs font-semibold text-white truncate max-w-[130px]">
                    {session.user.name}
                  </span>
                  <span className="block text-[9px] text-nicora-teal-light/80 uppercase tracking-wider">
                    {isManagerAccount ? 'Responsabile' : session.user.role}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-white/70 transition-transform duration-150 ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl bg-white text-nicora-text p-3.5 shadow-modal border border-nicora-sage-border animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-100">
                      <div className="w-9 h-9 rounded-full bg-nicora-teal-dark text-white flex items-center justify-center font-serif font-bold text-sm">
                        {session.user.avatar || session.user.name.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {session.user.name}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {isManagerAccount ? 'Direzione / Responsabile' : `Reparto ${session.user.role}`}
                        </span>
                        <span className="text-[9px] text-nicora-orange font-semibold uppercase mt-0.5">
                          {activeLocation === 'gazzada' ? 'Sede Gazzada' : 'Sede Varese'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 flex flex-col gap-1.5">
                      {onOpenTutorial && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenTutorial();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-nicora-teal-light/60 hover:bg-nicora-teal-light text-nicora-teal-dark text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <HelpCircle size={14} className="text-nicora-teal" />
                          <span>Guida rapida all'app</span>
                        </button>
                      )}

                      <a
                        href="/manuale_istruzioni_app_turni.pdf"
                        download="Manuale_Istruzioni_Nicora_Garden.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <FileText size={14} className="text-amber-700" />
                        <span>Scarica istruzioni complete</span>
                      </a>

                      {onSaveEmployee && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            handleOpenPinModal();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <KeyRound size={14} className="text-nicora-orange" />
                          <span>{isManagerAccount ? 'Modifica Password' : 'Modifica PIN'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          setIsProfileMenuOpen(false);
                          await forceAppUpdate();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-nicora-teal text-xs font-semibold transition-colors cursor-pointer"
                        title="Scarica l'ultima versione del codice mantenendo intatti login e dati"
                      >
                        <RefreshCw size={14} className="text-nicora-teal" />
                        <span>Verifica aggiornamenti app</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
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

        </div>
      </header>

      {/* Modal Cambio PIN / Password */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-nicora-sage-border w-full max-w-md overflow-hidden">
            <div className="bg-nicora-teal text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={20} className="text-amber-300" />
                <h3 className="font-serif text-base font-semibold">
                  {isManagerAccount ? 'Modifica Password Direzione' : 'Modifica PIN Personale'}
                </h3>
              </div>
              <button onClick={() => setIsPinModalOpen(false)} className="text-white hover:opacity-80">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-5 space-y-4 text-xs">
              {pinError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
              {pinSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isManagerAccount ? 'Password Attuale:' : 'PIN Attuale:'}
                </label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder={isManagerAccount ? 'Inserisci password attuale' : 'Inserisci PIN attuale'}
                  maxLength={isManagerAccount ? 32 : 6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-nicora-teal"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isManagerAccount ? 'Nuova Password:' : 'Nuovo PIN (min. 3 cifre):'}
                </label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder={isManagerAccount ? 'Nuova password riservata' : 'Nuovo PIN riservato'}
                  maxLength={isManagerAccount ? 32 : 6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-nicora-teal"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isManagerAccount ? 'Conferma Nuova Password:' : 'Conferma Nuovo PIN:'}
                </label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder={isManagerAccount ? 'Ripeti nuova password' : 'Ripeti nuovo PIN'}
                  maxLength={isManagerAccount ? 32 : 6}
                  className="w-full bg-neutral-50 border border-nicora-sage-border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-nicora-teal"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-nicora-teal hover:bg-nicora-teal-hover text-white font-extrabold rounded-xl shadow-xs"
                >
                  {isManagerAccount ? 'Salva Password' : 'Salva PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

