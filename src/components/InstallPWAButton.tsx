import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Apple, CheckCircle2, X, Share } from 'lucide-react';

interface InstallPWAButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const InstallPWAButton: React.FC<InstallPWAButtonProps> = ({
  className = '',
  variant = 'full',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });

  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [detectedPlatform, setDetectedPlatform] = useState<'ios' | 'android' | 'desktop'>('android');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(userAgent);

    if (isIOS) {
      setDetectedPlatform('ios');
    } else if (isAndroid) {
      setDetectedPlatform('android');
    } else {
      setDetectedPlatform('desktop');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1. Se il browser supporta il prompt PWA nativo (es. Chrome su Android / Edge)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          return;
        }
      } catch {
        // Fallback a modale istruzioni
      }
    }

    // 2. Se già installata
    if (isAppInstalled) {
      alert("L'applicazione è già installata sul tuo dispositivo.");
      return;
    }

    // 3. Mostra la modale dedicata e intuitiva con istruzioni iOS & Android
    setShowGuideModal(true);
  };

  if (isAppInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Installa App sul tuo dispositivo (Android / iOS / PC)"
        className={`flex items-center gap-1.5 bg-gradient-to-r from-nicora-orange to-orange-600 hover:from-nicora-orange-hover hover:to-orange-700 text-white font-extrabold rounded-xl shadow-xs transition-transform active:scale-95 touch-manipulation cursor-pointer border border-white/25 ${
          variant === 'compact'
            ? 'px-2.5 py-1 text-[11px]'
            : 'px-3 py-1.5 text-xs min-h-[34px]'
        } ${className}`}
      >
        <Download size={variant === 'compact' ? 13 : 15} className="shrink-0 animate-bounce" />
        <span>Installa App</span>
      </button>

      {/* Modale con istruzioni dettagliate sia per Android che per iOS */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 pt-safe pb-safe animate-in fade-in duration-200">
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setShowGuideModal(false)}
          />

          <div className="bg-white rounded-3xl shadow-2xl border border-nicora-sage-border w-full max-w-sm max-h-[88dvh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
            {/* Header Modale fisso in alto al box */}
            <div className="bg-gradient-to-r from-nicora-teal-dark via-nicora-teal to-nicora-teal-dark text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-amber-300" />
                <h3 className="font-serif text-sm sm:text-base font-bold text-white leading-tight">
                  Installa App Nicora Turni
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Chiudi guida installazione"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenuto scrollabile fluidamente in caso di schermi compatti o barre browser visibili */}
            <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3.5 text-left">
              {/* Tab selettore piattaforma */}
              <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl text-xs font-bold text-neutral-600">
                <button
                  type="button"
                  onClick={() => setDetectedPlatform('ios')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    detectedPlatform === 'ios'
                      ? 'bg-white text-nicora-teal-dark shadow-xs'
                      : 'hover:text-neutral-900'
                  }`}
                >
                  <Apple size={15} />
                  <span>iPhone / iPad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetectedPlatform('android')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                    detectedPlatform !== 'ios'
                      ? 'bg-white text-nicora-teal-dark shadow-xs'
                      : 'hover:text-neutral-900'
                  }`}
                >
                  <Smartphone size={15} />
                  <span>Android &amp; Altri</span>
                </button>
              </div>

              {/* Guida Specifica iOS */}
              {detectedPlatform === 'ios' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                    <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                      Su <strong>Safari (iPhone o iPad)</strong> puoi aggiungere l'app alla Home in 2 semplici passi:
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs text-neutral-700">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-nicora-teal text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="leading-snug">
                        Tocca il tasto <strong>Condividi</strong> in Safari{' '}
                        <span className="inline-flex items-center align-middle px-1 py-0.5 bg-neutral-100 rounded text-neutral-800">
                          <Share size={12} className="inline mr-1" /> icona col quadrato e freccia
                        </span>
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-nicora-teal text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="leading-snug">
                        Scorri le opzioni verso il basso e tocca <strong>"Aggiungi alla schermata Home"</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-nicora-teal text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="leading-snug">
                        Conferma cliccando in alto a destra su <strong>Aggiungi</strong>. L'icona apparirà tra le tue app!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Guida Specifica Android / Browser Desktop */
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
                    <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                      Su <strong>Google Chrome, Edge o Samsung Internet</strong>:
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs text-neutral-700">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-nicora-teal text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="leading-snug">
                        Apri il menu del browser (<strong>tre puntini verticali</strong> in alto a destra).
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-nicora-teal text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="leading-snug">
                        Seleziona la voce <strong>"Installa app"</strong> oppure <strong>"Aggiungi a schermata Home"</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-nicora-teal text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="leading-snug">
                        Tocca <strong>Installa</strong>. L'app verrà installata a schermo intero senza barre del browser!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pulsante Chiusura / Ho Capito */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-nicora-teal hover:bg-nicora-teal-hover active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-transform cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Ho capito</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
