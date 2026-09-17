import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Proviamo ad avviare subito il prompt di installazione nativo se concesso dal browser
      try {
        (e as any).prompt();
      } catch {
        // Se il browser richiede interazione utente, rimane pronto sul pulsante
      }
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isAppInstalled) {
      alert("L'applicazione e' gia' installata sul tuo dispositivo.");
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("Per installare l'app su iOS (iPhone/iPad):\n1. Tocca il tasto Condividi (icona col quadrato e freccia in alto)\n2. Seleziona 'Aggiungi alla schermata Home'");
      } else {
        alert("Per installare l'app dal browser:\n- Su Chrome/Edge/Android: tocca il menu a tre pallini in alto a destra e seleziona 'Installa app' o 'Aggiungi a schermata Home'.");
      }
    }
  };

  if (isAppInstalled) return null;

  return (
    <button
      onClick={handleInstallClick}
      title="Installa App sul tuo dispositivo"
      className="flex items-center gap-1.5 bg-nicora-orange hover:bg-nicora-orange-hover text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-transform active:scale-95 touch-manipulation min-h-[34px] border border-white/20"
    >
      <Download size={15} />
      <span>Installa App</span>
    </button>
  );
};
