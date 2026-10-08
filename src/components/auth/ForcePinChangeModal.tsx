import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

interface ForcePinChangeModalProps {
  employeeName: string;
  onSave: (newPin: string) => void;
  onLogout: () => void;
}

/**
 * Modale bloccante mostrato quando un collaboratore accede con il PIN provvisorio (1234)
 * dopo un reset da parte della Direzione. Impone la scelta di un PIN personale
 * che la Direzione non conosce.
 */
export const ForcePinChangeModal: React.FC<ForcePinChangeModalProps> = ({
  employeeName,
  onSave,
  onLogout,
}) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,}$/.test(newPin)) {
      setError('Il PIN deve contenere almeno 4 cifre numeriche');
      return;
    }
    if (newPin === '1234' || newPin === '1111' || newPin === '0000') {
      setError('Scegli un PIN meno prevedibile');
      return;
    }
    if (newPin !== confirmPin) {
      setError('I due PIN inseriti non coincidono');
      return;
    }
    onSave(newPin);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4 text-xs"
      >
        <div className="flex items-center gap-2 text-amber-700">
          <KeyRound size={18} />
          <h3 className="font-extrabold text-base">Scegli il tuo PIN personale</h3>
        </div>
        <p className="text-neutral-600 leading-relaxed">
          Ciao {employeeName}, il tuo PIN è stato reimpostato dalla Direzione a un codice provvisorio.
          Imposta ora un nuovo PIN che conosci solo tu, per proteggere i tuoi dati.
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
          placeholder="Nuovo PIN (almeno 4 cifre)"
          className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm"
        />
        <input
          type="password"
          inputMode="numeric"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
          placeholder="Ripeti nuovo PIN"
          className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm"
        />
        {error && <p className="text-red-600 font-semibold">{error}</p>}
        <button
          type="submit"
          className="w-full bg-nicora-teal-dark text-white font-bold rounded-lg py-2.5"
        >
          Salva PIN e continua
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full text-neutral-500 font-semibold py-1"
        >
          Esci
        </button>
      </form>
    </div>
  );
};
