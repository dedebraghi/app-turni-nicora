import React from 'react';
import { ActiveTab } from '../../domain/types';
import { Award, CalendarDays, Clock, MessageSquareQuote, UserCheck, Users } from 'lucide-react';

interface ResponsiveNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  pendingRequestsCount: number;
  isManagerMode: boolean;
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  activeTab,
  onChangeTab,
  pendingRequestsCount,
  isManagerMode,
}) => {
  const tabs = [
    {
      id: 'today' as ActiveTab,
      label: 'Oggi in Sede',
      mobileLabel: 'Oggi',
      icon: Clock,
    },
    {
      id: 'my-shifts' as ActiveTab,
      label: 'I Miei Turni',
      mobileLabel: 'I Miei',
      icon: UserCheck,
    },
    {
      id: 'planner' as ActiveTab,
      label: isManagerMode ? 'Tabellone Pianificatore' : 'Settimana Completa',
      mobileLabel: 'Tabellone',
      icon: CalendarDays,
    },
    {
      id: 'requests' as ActiveTab,
      label: 'Richieste & Ferie',
      mobileLabel: 'Richieste',
      icon: MessageSquareQuote,
      badge: pendingRequestsCount,
    },
    ...(isManagerMode
      ? [
          {
            id: 'personnel' as ActiveTab,
            label: 'Personale & Competenze',
            mobileLabel: 'Personale',
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* --- DESKTOP / TABLET TOP TAB BAR --- */}
      <nav className="hidden md:flex items-center justify-between border-b border-nicora-sage-border bg-nicora-card/95 backdrop-blur-sm px-6 py-2 shadow-clean sticky top-[57px] z-20">
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.id === 'personnel'
                ? activeTab === 'personnel' || activeTab === 'skills' || activeTab === 'staff'
                : activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-nicora-teal text-white shadow-xs'
                    : 'text-nicora-muted hover:text-nicora-title hover:bg-nicora-sage-light'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-amber-300' : 'text-nicora-muted'} />
                <span>{tab.label}</span>

                {Boolean(tab.badge && tab.badge > 0) && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none ml-1 ${
                      isActive ? 'bg-nicora-orange text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-nicora-muted font-normal flex items-center gap-2">
          <span>Settimana Lavorativa: <strong className="font-semibold text-nicora-text">Domenica ➔ Sabato</strong></span>
          <span>•</span>
          <span>Regola: <strong className="font-semibold text-nicora-text">5 giorni / 2 riposi</strong></span>
        </div>
      </nav>

      {/* --- MOBILE FIXED BOTTOM BAR --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-nicora-card/95 backdrop-blur-md border-t border-nicora-sage-border shadow-modal pb-safe">
        <div className="grid grid-flow-col auto-cols-fr items-center justify-around h-15 max-w-lg mx-auto px-1 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.id === 'personnel'
                ? activeTab === 'personnel' || activeTab === 'skills' || activeTab === 'staff'
                : activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex flex-col items-center justify-center relative py-1 transition-all touch-manipulation ${
                  isActive ? 'text-nicora-orange font-bold' : 'text-nicora-muted hover:text-nicora-text'
                }`}
              >
                <div className="relative">
                  <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="absolute -top-1 -right-2.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight leading-tight mt-0.5">
                  {tab.mobileLabel}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-nicora-orange rounded-full absolute bottom-0 shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
