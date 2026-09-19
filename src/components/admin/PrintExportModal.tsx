import React, { useState } from 'react';
import { Employee, LocationInfo, Shift, WeekDayMeta } from '../../domain/types';
import { generateWhatsAppScheduleText, printWeeklyBoard } from '../../services/exportService';
import { X, Printer, Share2, Copy, Check } from 'lucide-react';

interface PrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationInfo;
  weekDays: WeekDayMeta[];
  employees: Employee[];
  shifts: Shift[];
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({
  isOpen,
  onClose,
  location,
  weekDays,
  employees,
  shifts,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const whatsAppText = generateWhatsAppScheduleText({
    location,
    weekDays,
    employees,
    shifts,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    printWeeklyBoard({
      location,
      weekDays,
      employees,
      shifts,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-nicora-teal text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-nicora-orange flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Condivisione & Stampa Tabellone Turni
              </h3>
              <p className="text-xs text-nicora-teal-light/85">
                Punto Vendita: <strong>{location.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Due Opzioni di Azione Principali */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Stampa Foglio Bacheca */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-nicora-border flex flex-col justify-between space-y-3">
              <div>
                <div className="w-9 h-9 rounded-xl bg-nicora-teal-light text-nicora-teal flex items-center justify-center mb-2">
                  <Printer size={18} />
                </div>
                <h4 className="font-extrabold text-sm text-nicora-title">
                  Stampa per la Bacheca
                </h4>
                <p className="text-neutral-500 text-[11px] mt-1 leading-snug">
                  Genera la griglia settimanale ad alta leggibilità in formato A4 Orizzontale da appendere al box cassa o in sala relax.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full bg-nicora-teal hover:bg-nicora-teal-hover text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Printer size={15} />
                <span>Apri e Stampa A4</span>
              </button>
            </div>

            {/* Condivisione WhatsApp */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                  <Share2 size={18} />
                </div>
                <h4 className="font-extrabold text-sm text-emerald-950">
                  Gruppo WhatsApp Negozio
                </h4>
                <p className="text-emerald-800 text-[11px] mt-1 leading-snug">
                  Copia il testo formattato ed emojis per inviare la programmazione settimanale direttamente ai collaboratori.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? 'Testo Copiato!' : 'Copia per WhatsApp'}</span>
              </button>
            </div>

          </div>

          {/* Anteprima Testo WhatsApp */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1 flex items-center justify-between">
              <span>Anteprima Messaggio WhatsApp:</span>
              <span className="text-[10px] text-neutral-400 font-normal">
                Pronto per copia e incolla
              </span>
            </label>
            <div className="bg-neutral-900 text-neutral-100 p-3.5 rounded-2xl font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border border-neutral-700">
              {whatsAppText}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-neutral-50 border-t border-nicora-border p-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-800"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
