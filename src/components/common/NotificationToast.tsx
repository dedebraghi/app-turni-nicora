import React, { useEffect } from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

interface NotificationToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="bg-neutral-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/15 flex items-start gap-3">
        <div className="p-2 bg-nicora-orange/20 rounded-xl text-nicora-orange flex-shrink-0 mt-0.5">
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <Bell size={18} className="text-nicora-orange" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white leading-tight">
            {toast.title}
          </h4>
          <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
            {toast.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/40 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
          aria-label="Chiudi notifica"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
};
