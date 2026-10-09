import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Apple, CheckCircle2, X, Share, Monitor, RefreshCw } from 'lucide-react';

interface InstallPWAButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const InstallPWAButton: React.FC<InstallPWAButtonProps> = ({
  className = '',
  variant = 'full',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    if (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt) {
      return (window as any).__pwaDeferredPrompt;
    }
    return null;
  });

  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });

  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'desktop' | 'ios' | 'android'>('desktop');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(userAgent);

    if (isIOS) {
      setSelectedTab('ios');
    } else if (isAndroid) {
      setSelectedTab('android');
    } else {
      setSelectedTab('desktop');
    }

    if ((window as any).__pwaDeferredPrompt) {
      setDeferredPrompt((window as any).__pwaDeferredPrompt);
    }

    // Se supportato dal browser desktop/mobile, controlla se l'app è già installata
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        if (apps && apps.length > 0) {
          setIsAppInstalled(true);
        }
      }).catch(() => {});
    }

    const handlePromptReady = () => {
      if ((window as any).__pwaDeferredPrompt) {
        setDeferredPrompt((window as any).__pwaDeferredPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      (window as any).__pwaDeferredPrompt = null;
      setShowGuideModal(false);
    };

    window.addEventListener('pwa-deferred-prompt-ready', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-deferred-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__pwaDeferredPrompt : null);

    // 1. Se il browser supporta il prompt PWA nativo (es. Chrome su Windows o Android)
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') (window as any).__pwaDeferredPrompt = null;
          setIsAppInstalled(true);
          return;
        }
      } catch (err) {
        console.warn('Errore prompt nativo PWA:', err);
      }
    }

    // 2. Se non c'è il prompt nativo (es. browser desktop dove non è scattato, o già installata, o iOS), apri la guida
    setShowGuideModal(true);
  };

  // Se l'utente sta già navigando all'interno dell'app installata a schermo intero (standalone), nascondi il pulsante
  if (isAppInstalled && typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Installa App sul tuo dispositivo (PC / Android / iOS)"
        className={`flex items-center gap-1.5 bg-gradient-to-r from-nicora-orange to-orange-600 hover:from-nicora-orange-hover hover:to-orange-700 text-white font-extrabold rounded-xl shadow-xs transition-transform active:scale-95 touch-manipulation cursor-pointer border border-white/25 ${
          variant === 'compact'
            ? 'px-2.5 py-1 text-[11px]'
            : 'px-3 py-1.5 text-xs min-h-[34px]'
        } ${className}`}
      >
        <Download size={variant === 'compact' ? 13 : 15} className="shrink-0 animate-bounce" />
        <span>Installa App</span>
      </button>

      {/* Modale con istruzioni complete per PC, Android e iOS */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 pt-safe pb-safe animate-in fade-in duration-200">
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setShowGuideModal(false)}
          />

          <div className="bg-white rounded-3xl shadow-2xl border border-nicora-sage-border w-full max-w-md max-h-[88dvh] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
            {/* Header Modale */}
            <div className="bg-gradient-to-r from-nicora-teal-dark via-nicora-teal to-nicora-teal-dark text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Monitor size={18} className="text-amber-300" />
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

            {/* Contenuto scrollabile */}
            <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3.5 text-left">
              {/* Tab selettore a 3 piattaforme: PC/Desktop, iPhone, Android */}
              <div className="grid grid-cols-3 p-1 bg-neutral-100 rounded-xl text-xs font-bold text-neutral-600 gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedTab('desktop')}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                    selectedTab === 'desktop'
                      ? 'bg-white text-nicora-teal-dark shadow-xs'
                      : 'hover:text-neutral-900'
                  }`}
                >
                  <Monitor size={14} className="shrink-0" />
                  <span>PC / Mac</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab('ios')}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                    selectedTab === 'ios'
                      ? 'bg-white text-nicora-teal-dark shadow-xs'
                      : 'hover:text-neutral-900'
                  }`}
                >
                  <Apple size={14} className="shrink-0" />
                  <span>iPhone / iPad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab('android')}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                    selectedTab === 'android'
                      ? 'bg-white text-nicora-teal-dark shadow-xs'
                      : 'hover:text-neutral-900'
                  }`}
                >
                  <Smartphone size={14} className="shrink-0" />
                  <span>Android</span>
                </button>
              </div>

              {/* Guida Specifica PC / Mac Desktop */}
              {selectedTab === 'desktop' && (
                <div className="space-y-3">
                  <div className="p-3 bg-sky-50/90 border border-sky-200/80 rounded-2xl">
                    <p className="text-xs text-sky-950 font-semibold leading-relaxed">
                      Su <strong>Google Chrome o Microsoft Edge</strong> su PC Windows o Mac:
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs text-neutral-700">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-nicora-teal text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="leading-snug">
                        Guarda in alto a destra nella <strong>barra degli indirizzi</strong> del browser: clicca sull'icona con il monitor e la freccia o il pulsante <strong>"Installa"</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-nicora-teal text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="leading-snug">
                        Oppure clicca sui <strong>tre puntini del browser in alto a destra</strong> &rarr; voce <strong>"Salva e condividi"</strong> (o <strong>"App"</strong>) &rarr; <strong>"Installa Nicora Garden - Turni..."</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Box di spiegazione specifica per aggiornare l'icona desktop */}
                  <div className="p-3 bg-amber-50/95 border border-amber-300/80 rounded-2xl flex items-start gap-2 text-left">
                    <RefreshCw size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-950 space-y-1">
                      <p className="font-bold">L'icona sul desktop è rimasta quella vecchia?</p>
                      <p className="leading-relaxed">
                        Windows memorizza il vecchio collegamento sul desktop finché non viene disinstallato. 
                        Per avere la nuova icona ufficiale: apri l'app attualmente sul PC &rarr; clicca sui <strong>tre puntini in alto nella finestra dell'app</strong> &rarr; <strong>"Disinstalla Nicora Garden"</strong>. 
                        Poi torna qui sul browser e clicca <strong>Installa</strong>: Windows creerà subito il nuovo collegamento con la nuova icona!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Guida Specifica iOS */}
              {selectedTab === 'ios' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                    <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                      Su <strong>Safari (iPhone o iPad)</strong> aggiungi l'app in 2 tocchi:
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

                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] text-neutral-600">
                    Se vedi ancora la vecchia icona, elimina il vecchio segnalibro dalla schermata Home e riaggiungilo da Safari.
                  </div>
                </div>
              )}

              {/* Guida Specifica Android */}
              {selectedTab === 'android' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
                    <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                      Su <strong>Google Chrome o Samsung Internet (Android)</strong>:
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

                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] text-neutral-600">
                    Se vedi ancora la vecchia icona, disinstalla l'app e reinstallala dal menu di Chrome.
                  </div>
                </div>
              )}

              {/* Pulsante Chiusura */}
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
