import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      // Setup regular polling for updates every 1 hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error: any) {
      console.error('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100] bg-brand-deep-navy text-white rounded-xl shadow-2xl border border-brand-soft-grey/20 p-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-serif text-brand-gold text-base mb-1">New version available</h3>
          <p className="text-xs text-white/80 leading-relaxed">
            A new version of KHU Developers is available. Update now for the latest features.
          </p>
        </div>
        <button 
          onClick={() => setNeedRefresh(false)}
          className="text-white/50 hover:text-white transition-colors p-1"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => updateServiceWorker(true)}
          className="flex items-center gap-2 bg-brand-gold text-brand-deep-navy px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-gold/90 transition-colors"
        >
          <RefreshCw size={14} className="animate-spin-slow" />
          Update
        </button>
      </div>
    </div>
  );
}
