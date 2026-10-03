import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone (already installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    // Check if dismissed previously
    const dismissedTime = localStorage.getItem('pwa_install_dismissed');
    if (dismissedTime) {
      const timePassed = Date.now() - parseInt(dismissedTime, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (timePassed < sevenDays) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('pwa_install_dismissed');
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice && !isStandaloneMode);

    // Event listener for Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for successful install
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsStandalone(true);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    // Only show if not standalone, not dismissed, and we either have a prompt ready or it's iOS
    if (!isStandalone && !isDismissed && (deferredPrompt || isIOS)) {
      // Delay prompt slightly so it's not jarring on immediate load
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isStandalone, isDismissed, deferredPrompt, isIOS]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    } else if (isIOS) {
      // For iOS, the instructional modal/UI is shown via state, so this might trigger a more detailed modal if desired
      // But we can just show instructions directly in the banner.
      alert('Tap the Share button in your browser toolbar, then select "Add to Home Screen".');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-[60px] left-0 right-0 z-[40] px-4 py-3 bg-brand-warm-white border-b border-brand-soft-grey shadow-md safe-top">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 shrink-0 bg-brand-deep-navy rounded-lg p-1.5 shadow-sm flex items-center justify-center">
             <img src="/logo.png" alt="KHU Developers" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-brand-deep-navy text-sm font-semibold truncate">Install KHU Developers</h3>
            <p className="text-xs text-brand-charcoal/70 truncate hidden sm:block">
              {isIOS ? 'Tap Share → Add to Home Screen' : 'Get a faster app-like experience.'}
            </p>
            {isIOS && (
              <p className="text-[10px] text-brand-charcoal/70 sm:hidden mt-0.5">
                Tap <Share size={10} className="inline mx-0.5" /> Share → Add to Home Screen
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {!isIOS && (
            <button 
              onClick={handleInstall}
              className="bg-brand-deep-navy text-brand-gold text-xs px-4 py-2 rounded-full font-medium hover:bg-brand-deep-navy/90 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Download size={14} />
              Install
            </button>
          )}
          <button 
            onClick={handleDismiss}
            className="p-2 text-brand-charcoal/50 hover:text-brand-charcoal transition-colors rounded-full hover:bg-black/5"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
