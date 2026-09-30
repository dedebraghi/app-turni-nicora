import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  LayoutGrid,
  Mail,
  Sparkles,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Users,
  Contact,
  Shield,
  Sliders,
  ArrowLeftRight,
  FileSpreadsheet,
  Cpu,
  Lock,
} from 'lucide-react';

interface SlideConfig {
  tabName: string;
  tabIcon: React.ElementType;
  title: string;
  description: string;
  activeNavTab: 'today' | 'my-shifts' | 'planner' | 'requests' | 'personnel';
  renderGraphic: () => React.ReactNode;
}

interface OnboardingTutorialProps {
  userRole: 'admin' | 'staff';
  userId?: string;
  forceOpen?: boolean;
  onClose?: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  userRole,
  userId = 'default',
  forceOpen = false,
  onClose,
}) => {
  const storageKey = `nicora_tutorial_seen_${userRole}_${userId}`;

  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (forceOpen) return true;
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(storageKey);
  });

  const [currentStep, setCurrentStep] = useState(0);

  // Aggiorna visibilità se forceOpen cambia (es. apertura da menu profilo)
  useEffect(() => {
    if (forceOpen) {
      setCurrentStep(0);
      setIsVisible(true);
    }
  }, [forceOpen]);

  // Gestione Swipe touch per mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45) {
      // Swipe verso sinistra -> Avanti
      handleNext();
    } else if (diff < -45 && currentStep > 0) {
      // Swipe verso destra -> Indietro
      setCurrentStep((prev) => prev - 1);
    }
    setTouchStartX(null);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Fallback
    }
    setIsVisible(false);
    if (onClose) onClose();
  };

  // Rilevamento viewport desktop vs mobile per adattare grafica e spiegazioni
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mini-barra di navigazione simulata: Desktop (barra orizzontale in alto) vs Mobile (dock in basso)
  const renderMiniNavBar = (activeTab: 'today' | 'my-shifts' | 'planner' | 'requests' | 'personnel') => {
    const navItems = [
      { id: 'today', label: isDesktop ? 'Oggi in Sede' : 'Oggi', icon: Clock },
      { id: 'my-shifts', label: 'I Miei Turni', icon: CalendarDays },
      { id: 'planner', label: isDesktop ? 'Tabellone' : 'Tabellone', icon: LayoutGrid },
      { id: 'requests', label: isDesktop ? 'Richieste & Ferie' : 'Richieste', icon: Mail },
      ...(userRole === 'admin'
        ? [{ id: 'personnel', label: isDesktop ? 'Personale' : 'Personale', icon: Contact }]
        : []),
    ];

    if (isDesktop) {
      return (
        <div className="w-full max-w-[340px] bg-neutral-100/90 border border-nicora-sage-border rounded-xl p-1.5 flex items-center justify-between shadow-2xs mt-2.5">
          <div className="flex items-center gap-1 w-full justify-around">
            {navItems.map((item) => {
              const isActive = item.id === activeTab;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    isActive
                      ? 'bg-nicora-teal text-white shadow-xs'
                      : 'text-neutral-500 bg-white/70'
                  }`}
                >
                  <Icon size={12} className={isActive ? 'text-amber-300' : 'text-neutral-400'} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-[310px] bg-white border border-nicora-sage-border rounded-xl p-1.5 flex items-center justify-around shadow-xs mt-3">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex flex-col items-center px-1.5 py-1 rounded-lg transition-all ${
                isActive
                  ? 'bg-nicora-teal text-white shadow-xs scale-105'
                  : 'text-neutral-400'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-neutral-400'} />
              <span className={`text-[8.5px] font-semibold mt-0.5 ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ----------------------------------------------------------------------
  // SLIDES PER COLLABORATORI (STAFF)
  // ----------------------------------------------------------------------
  const staffSlides: SlideConfig[] = [
    {
      tabName: 'I Miei Turni',
      tabIcon: CalendarDays,
      activeNavTab: 'my-shifts',
      title: 'Tutti i tuoi orari settimanali',
      description: isDesktop
        ? 'Clicca sulla scheda "I Miei Turni" nella barra di navigazione in alto per consultare il tuo orario preciso, gli stacchi pranzo e le ore pianificate della settimana.'
        : 'Tocca la scheda "I Miei Turni" in basso per consultare il tuo orario preciso, gli stacchi pranzo e le ore pianificate della settimana.',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-white border border-emerald-200/80 rounded-2xl p-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                Mercoledì 15 Ottobre
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={11} /> Confermato
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-neutral-900 block">08:30 – 13:00</span>
                <span className="text-[11px] text-neutral-500">Reparto Serra Fredda</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs">
                4.5h
              </div>
            </div>
          </div>
          {renderMiniNavBar('my-shifts')}
        </div>
      ),
    },
    {
      tabName: 'Oggi',
      tabIcon: Clock,
      activeNavTab: 'today',
      title: 'Chi lavora con te oggi',
      description: isDesktop
        ? 'Nella scheda "Oggi in Sede" in alto trovi in tempo reale i colleghi in servizio nel vivaio e nel tuo reparto, così saprai sempre su chi contare.'
        : 'Nella scheda "Oggi" in basso trovi in tempo reale i colleghi in servizio nel vivaio e nel tuo reparto, così saprai sempre su chi contare.',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-nicora-teal text-white flex items-center justify-center text-xs font-bold font-serif">
                  M
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-neutral-900 block leading-tight">Marco V.</span>
                  <span className="text-[10px] text-neutral-500">Cassa • 08:30 – 12:30</span>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                In servizio
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-nicora-orange text-white flex items-center justify-center text-xs font-bold font-serif">
                  E
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-neutral-900 block leading-tight">Elena R.</span>
                  <span className="text-[10px] text-neutral-500">Fioreria • 14:00 – 19:30</span>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                Pomeriggio
              </span>
            </div>
          </div>
          {renderMiniNavBar('today')}
        </div>
      ),
    },
    {
      tabName: 'Richieste',
      tabIcon: Mail,
      activeNavTab: 'requests',
      title: 'Ferie e permessi in pochi click',
      description: isDesktop
        ? 'Usa la scheda "Richieste & Ferie" in alto per indicare i giorni in cui hai bisogno di un permesso o di ferie. Riceverai un riscontro appena la Direzione le valuta.'
        : 'Usa la scheda "Richieste" in basso per indicare i giorni in cui hai bisogno di un permesso o di ferie. Riceverai un riscontro appena il responsabile le valuta.',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Mail size={13} className="text-nicora-orange" /> Domanda di Permesso
              </span>
              <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                In valutazione
              </span>
            </div>
            <div className="pt-2 text-left">
              <span className="text-[11px] text-neutral-700 block font-medium">Sabato 25 Ottobre (Giornata)</span>
              <span className="text-[10px] text-neutral-500 italic block mt-0.5">Motivo: Visita medica specialistica</span>
            </div>
          </div>
          {renderMiniNavBar('requests')}
        </div>
      ),
    },
  ];

  // ----------------------------------------------------------------------
  // SLIDES PER RESPONSABILI (ADMIN / MANAGER) - 6 SLIDE COMPLETE
  // ----------------------------------------------------------------------
  const adminSlides: SlideConfig[] = [
    {
      tabName: 'Tabellone',
      tabIcon: LayoutGrid,
      activeNavTab: 'planner',
      title: isDesktop ? 'Griglia turni e coperture settimanali' : 'Griglia turni e coperture da mobile',
      description: isDesktop
        ? 'Clicca sulla scheda "Tabellone Pianificatore" nella barra in alto per navigare le settimane, controllare la copertura oraria dei reparti e individuare subito gli orari vuoti.'
        : 'Tocca la scheda "Tabellone" in basso per scorrere i giorni della settimana, verificare la copertura dei reparti e individuare subito eventuali orari o mansioni scoperte.',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <span className="text-[11px] font-bold text-neutral-800">Settimana 42 • Sede Gazzada</span>
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                98% Copertura
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-2 text-center text-[10px]">
              <div className="bg-emerald-50 text-emerald-800 font-semibold p-1.5 rounded-lg border border-emerald-100">
                Lun 13<br/><span className="text-[8px] font-normal">Completo</span>
              </div>
              <div className="bg-emerald-50 text-emerald-800 font-semibold p-1.5 rounded-lg border border-emerald-100">
                Mar 14<br/><span className="text-[8px] font-normal">Completo</span>
              </div>
              <div className="bg-amber-50 text-amber-800 font-semibold p-1.5 rounded-lg border border-amber-200">
                Mer 15<br/><span className="text-[8px] font-normal">-1 Cassa</span>
              </div>
              <div className="bg-emerald-50 text-emerald-800 font-semibold p-1.5 rounded-lg border border-emerald-100">
                Gio 16<br/><span className="text-[8px] font-normal">Completo</span>
              </div>
            </div>
          </div>
          {renderMiniNavBar('planner')}
        </div>
      ),
    },
    {
      tabName: 'Tabellone',
      tabIcon: Cpu,
      activeNavTab: 'planner',
      title: 'Come funziona l\'algoritmo "Genera Bozza"',
      description:
        'Il motore calcola i turni ripartendo le ore di contratto su 5 giorni a settimana, preserva 2 giorni di riposo, garantisce 11h tra turni e assegna ogni reparto in base al punteggio competenze (1-10).',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-white border border-emerald-200 rounded-2xl p-3 shadow-xs text-left">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
              <div className="w-7 h-7 rounded-lg bg-nicora-teal text-white flex items-center justify-center">
                <Cpu size={14} />
              </div>
              <div className="leading-tight">
                <span className="text-[11px] font-bold text-neutral-900 block">Algoritmo di Calcolo</span>
                <span className="text-[9px] text-emerald-700 font-semibold">Regole contrattuali & riposi</span>
              </div>
            </div>
            <div className="pt-2 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-neutral-700">
                <span>• Ripartizione oraria:</span>
                <span className="font-bold text-neutral-900">5 gg / settimana</span>
              </div>
              <div className="flex items-center justify-between text-neutral-700">
                <span>• Rispetto vincolo riposo:</span>
                <span className="font-bold text-emerald-700">11 ore minime</span>
              </div>
              <div className="flex items-center justify-between text-neutral-700">
                <span>• Priorità competenze:</span>
                <span className="font-bold text-nicora-teal">Punteggi 1–10</span>
              </div>
            </div>
          </div>
          {renderMiniNavBar('planner')}
        </div>
      ),
    },
    {
      tabName: 'Tabellone',
      tabIcon: UserCheck,
      activeNavTab: 'planner',
      title: 'Gestione imprevisti e sostituzioni',
      description:
        'In caso di malattia o assenza improvvisa, tocca il turno nel "Tabellone": il sistema ti suggerisce all\'istante i collaboratori idonei e disponibili, privilegiando chi è a riposo senza creare vuoti altrove.',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-white border border-rose-200 rounded-2xl p-3 shadow-xs text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                <AlertTriangle size={12} /> Assenza improvvisa
              </span>
              <span className="text-[9px] text-neutral-500 font-medium">Oggi 14:00</span>
            </div>
            <div className="mt-2 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-800 block">Sostituto suggerito:</span>
                <span className="text-xs font-bold text-neutral-900">Chiara B. (Serra Fredda)</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                Assegna
              </span>
            </div>
          </div>
          {renderMiniNavBar('planner')}
        </div>
      ),
    },
    {
      tabName: 'Personale',
      tabIcon: Contact,
      activeNavTab: 'personnel',
      title: 'Scheda Personale & Competenze',
      description: isDesktop
        ? 'Dalla scheda "Personale & Competenze" in alto gestisci l\'organico, modifichi al volo le ore di contratto (40h, 30h, 24h, 20h) e tari i punteggi 1-10 per reparto usati dall\'algoritmo per bilanciare i turni.'
        : 'Tocca la scheda "Personale" per gestire l\'organico, modificare al volo le ore di contratto (40h, 30h, 24h, 20h) e tarare i punteggi da 1 a 10 per reparto usati dall\'algoritmo per bilanciare i turni.',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-white border border-gray-200 rounded-2xl p-3 shadow-xs text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <span className="text-xs font-bold text-neutral-900">Stefania (Cassa)</span>
              <span className="text-[9px] font-bold text-nicora-teal bg-emerald-50 px-2 py-0.5 rounded-full">
                40h / sett
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[10px]">
              <div className="bg-emerald-50 text-emerald-800 font-bold p-1 rounded-lg">
                Cassa 10
              </div>
              <div className="bg-amber-50 text-amber-800 font-bold p-1 rounded-lg">
                Fioreria 6
              </div>
              <div className="bg-neutral-50 text-neutral-700 font-bold p-1 rounded-lg">
                Decor 7
              </div>
            </div>
          </div>
          {renderMiniNavBar('personnel')}
        </div>
      ),
    },
    {
      tabName: 'Richieste',
      tabIcon: ArrowLeftRight,
      activeNavTab: 'requests',
      title: 'Richieste e scambi turno tra colleghi',
      description: isDesktop
        ? 'Nella scheda "Richieste & Ferie" in alto approvi ferie e permessi. Per gli scambi turno, i colleghi si accordano prima tra loro; una volta concordato, la richiesta arriva alla Direzione per la convalida finale.'
        : 'Nella scheda "Richieste" approvi ferie e permessi. Per gli scambi turno, i due collaboratori si accordano prima tra loro; una volta concordato, la richiesta arriva alla Direzione per la convalida finale.',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-white border border-gray-200 rounded-2xl p-2.5 shadow-xs text-left">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <span className="text-[11px] font-bold text-neutral-800 flex items-center gap-1">
                <ArrowLeftRight size={12} className="text-nicora-orange" /> Scambio Turno
              </span>
              <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                Concordato tra colleghi
              </span>
            </div>
            <p className="text-[10px] text-neutral-600 mt-1.5">
              <strong>Sabrina ⇄ Eleonora:</strong> scambio turno Mercoledì 15 con Giovedì 16. In attesa del tuo tocco per approvare.
            </p>
          </div>
          {renderMiniNavBar('requests')}
        </div>
      ),
    },
    {
      tabName: 'Esclusive Admin',
      tabIcon: Shield,
      activeNavTab: 'planner',
      title: 'Tutte le funzioni riservate alla Direzione',
      description:
        'Solo tu come responsabile vedi: il pulsante "Genera Bozza", la cancellazione e override manuale dei turni, l\'export PDF stampabile A4, la matrice competenze e la tab "Personale".',
      renderGraphic: () => (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] bg-gradient-to-br from-nicora-teal-dark to-nicora-teal text-white rounded-2xl p-3 shadow-xs text-left">
            <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/20">
              <Shield size={14} className="text-amber-300" />
              <span className="text-[11px] font-bold">Privilegi Esclusivi Responsabile</span>
            </div>
            <div className="pt-2 grid grid-cols-2 gap-1.5 text-[9.5px]">
              <span className="bg-white/10 px-2 py-1 rounded-lg">⚡ Genera & Pubblica</span>
              <span className="bg-white/10 px-2 py-1 rounded-lg">📄 Stampa A4 / PDF</span>
              <span className="bg-white/10 px-2 py-1 rounded-lg">👥 Gestione Organico</span>
              <span className="bg-white/10 px-2 py-1 rounded-lg">✏️ Override Turni</span>
            </div>
          </div>
          {renderMiniNavBar('planner')}
        </div>
      ),
    },
  ];

  const slides = userRole === 'admin' ? adminSlides : staffSlides;

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  const activeSlide = slides[currentStep];
  const TabIcon = activeSlide.tabIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sfondo cliccabile per uscire velocemente */}
      <div className="fixed inset-0 -z-10" onClick={handleDismiss} />

      {/* Sheet Container: Bottom Sheet su smartphone, card centrata su desktop */}
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-nicora-sage-border overflow-hidden flex flex-col pb-safe animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Banner superiore esplicito di Benvenuto & Tutorial */}
        <div className="bg-gradient-to-r from-nicora-teal-dark via-nicora-teal to-nicora-teal-dark text-white px-5 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
              Benvenuto • Guida Rapida all'App
            </span>
          </div>
          <span className="text-[10px] font-semibold text-white/70">
            Passo {currentStep + 1} di {slides.length}
          </span>
        </div>

        {/* Intestazione Sheet con Badge Scheda e Tasto Salta touch-friendly */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-2 border-b border-neutral-100 bg-neutral-50/60">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-nicora-teal-light text-nicora-teal-dark border border-nicora-teal-border/40">
            <TabIcon size={13} className="text-nicora-teal" />
            <span className="text-[11px] font-bold tracking-wide">
              {isDesktop ? 'Scheda in alto:' : 'Scheda in basso:'} "{activeSlide.tabName}"
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="flex items-center gap-1 text-neutral-500 hover:text-neutral-800 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Salta tutorial"
          >
            <span>Salta guida</span>
            <X size={14} />
          </button>
        </div>

        {/* Area Contenuto Slide */}
        <div className="px-5 pt-5 pb-3 text-center flex flex-col items-center justify-center">
          {/* Micro-anteprima grafica realistica */}
          <div className="w-full flex justify-center py-2 mb-3 bg-neutral-50/70 border border-neutral-100 rounded-2xl">
            {activeSlide.renderGraphic()}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1.5 leading-snug">
            {activeSlide.title}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xs mx-auto">
            {activeSlide.description}
          </p>
        </div>

        {/* Barra di navigazione inferiore dello Sheet */}
        <div className="px-5 py-4 bg-neutral-50/90 border-t border-neutral-100 flex items-center justify-between">
          {/* Indicatori a pallino */}
          <div className="flex gap-1.5 items-center">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-6 bg-nicora-teal'
                    : 'w-2 bg-neutral-300'
                }`}
              />
            ))}
          </div>

          {/* Pulsanti Avanti / Indietro */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 rounded-xl transition-colors cursor-pointer"
              >
                Indietro
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-nicora-teal hover:bg-nicora-teal-hover active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-transform cursor-pointer"
            >
              <span>{currentStep === slides.length - 1 ? 'Inizia' : 'Avanti'}</span>
              {currentStep === slides.length - 1 ? (
                <CheckCircle2 size={14} />
              ) : (
                <ArrowRight size={14} />
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
