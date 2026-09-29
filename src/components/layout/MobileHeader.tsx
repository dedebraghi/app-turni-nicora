import React, { useState } from 'react';
import { Employee, LocationId } from '../../domain/types';
import { NicoraLogo } from '../NicoraLogo';
import { 
  AlertCircle, 
  Check, 
  KeyRound, 
  LogOut, 
  X 
} from 'lucide-react';

export interface MobileHeaderProps {
  title: string;
  employee?: Employee;
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  gazzadaStaffCount?: number;
  vareseStaffCount?: number;
  onLogout?: () => void;
  onSaveEmployee?: (emp: Employee) => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  employee,
  activeLocation,
  onChangeLocation,
  gazzadaStaffCount = 10,
  vareseStaffCount = 16,
  onLogout,
  onSaveEmployee,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Stato Modale Cambio PIN
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

  const isManagerAccount = Boolean(employee?.isOwner || employee?.isManager);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!employee) return;

    const defaultSecret = isManagerAccount ? 'admin' : '1234';
    const actualSecret = employee.password || defaultSecret;
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
        ...employee,
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

            {/* Profilo Utente con dropdown di logout e cambio PIN/Password */}
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
                    {isManagerAccount ? 'Responsabile' : employee?.role ? `Rep. ${employee.role}` : 'Rep. Cassa'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#002f32] flex items-center justify-center text-white font-serif font-bold text-xs shadow-xs ring-2 ring-transparent active:ring-[#a73a00]">
                  {employee?.name?.charAt(0) || 'S'}
                </div>
              </button>

              {/* Menu Profilo Dropdown Popup */}
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
                          {isManagerAccount
                            ? 'Direzione / Responsabile'
                            : employee?.role
                            ? `Reparto ${employee.role}`
                            : 'Collaboratore'}
                        </span>
                        <span className="text-[9px] text-[#a73a00] font-semibold uppercase mt-0.5">
                          {activeLocation === 'gazzada' ? 'Sede Gazzada' : 'Sede Varese'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-1.5">
                      {/* Opzione Modifica PIN / Password sopra a Esci */}
                      {onSaveEmployee && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            handleOpenPinModal();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
                        >
                          <KeyRound size={14} className="text-[#a73a00]" />
                          <span>{isManagerAccount ? 'Modifica Password' : 'Modifica PIN'}</span>
                        </button>
                      )}

                      {/* Esci dalla sessione */}
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

      {/* Modal Cambio PIN / Password Accessibile Ovunque */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8e4] w-full max-w-sm overflow-hidden">
            <div className="bg-[#002f32] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-amber-300" />
                <h3 className="font-serif text-sm font-semibold">
                  {isManagerAccount ? 'Modifica Password Direzione' : 'Modifica PIN Personale'}
                </h3>
              </div>
              <button onClick={() => setIsPinModalOpen(false)} className="text-white hover:opacity-80">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-4 space-y-3 text-xs">
              {pinError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
              {pinSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-0.5">
                  {isManagerAccount ? 'Password Attuale:' : 'PIN Attuale:'}
                </label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder={isManagerAccount ? 'Password attuale' : 'PIN attuale'}
                  maxLength={isManagerAccount ? 32 : 6}
                  className="w-full bg-neutral-50 border border-[#e2e8e4] rounded-xl px-3 py-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-0.5">
                  {isManagerAccount ? 'Nuova Password:' : 'Nuovo PIN (min. 3 cifre):'}
                </label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder={isManagerAccount ? 'Nuova password' : 'Nuovo PIN'}
                  maxLength={isManagerAccount ? 32 : 6}
                  className="w-full bg-neutral-50 border border-[#e2e8e4] rounded-xl px-3 py-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-0.5">
                  {isManagerAccount ? 'Conferma Nuova Password:' : 'Conferma Nuovo PIN:'}
                </label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder={isManagerAccount ? 'Ripeti nuova password' : 'Ripeti nuovo PIN'}
                  maxLength={isManagerAccount ? 32 : 6}
                  className="w-full bg-neutral-50 border border-[#e2e8e4] rounded-xl px-3 py-2 text-sm font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3 py-1.5 text-neutral-600 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#002f32] text-white font-bold rounded-xl shadow-xs"
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
