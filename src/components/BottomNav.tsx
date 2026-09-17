import React from 'react';
import { Store, CalendarDays, ArrowLeftRight } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  pendingRequestsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  pendingRequestsCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-nicora-border shadow-modal pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {/* Tab 1: Oggi in Negozio */}
        <button
          onClick={() => onChangeTab('today')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors touch-manipulation min-h-[48px] relative ${
            activeTab === 'today'
              ? 'text-nicora-orange font-bold'
              : 'text-nicora-muted hover:text-nicora-teal'
          }`}
        >
          <Store size={22} strokeWidth={activeTab === 'today' ? 2.5 : 1.8} />
          <span className="text-[11px] mt-1 tracking-tight">Oggi</span>
          {activeTab === 'today' && (
            <span className="absolute bottom-1 w-5 h-0.5 bg-nicora-orange rounded-full" />
          )}
        </button>

        {/* Tab 2: Settimana */}
        <button
          onClick={() => onChangeTab('week')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors touch-manipulation min-h-[48px] relative ${
            activeTab === 'week'
              ? 'text-nicora-orange font-bold'
              : 'text-nicora-muted hover:text-nicora-teal'
          }`}
        >
          <CalendarDays size={22} strokeWidth={activeTab === 'week' ? 2.5 : 1.8} />
          <span className="text-[11px] mt-1 tracking-tight">Settimana</span>
          {activeTab === 'week' && (
            <span className="absolute bottom-1 w-5 h-0.5 bg-nicora-orange rounded-full" />
          )}
        </button>

        {/* Tab 3: Richieste / Cambi */}
        <button
          onClick={() => onChangeTab('requests')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors touch-manipulation min-h-[48px] relative ${
            activeTab === 'requests'
              ? 'text-nicora-orange font-bold'
              : 'text-nicora-muted hover:text-nicora-teal'
          }`}
        >
          <div className="relative">
            <ArrowLeftRight size={22} strokeWidth={activeTab === 'requests' ? 2.5 : 1.8} />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-nicora-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {pendingRequestsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Richieste</span>
          {activeTab === 'requests' && (
            <span className="absolute bottom-1 w-5 h-0.5 bg-nicora-orange rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
