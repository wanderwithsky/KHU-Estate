import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function PwaInstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Has user dismissed the prompt previously?
    const hasDismissed = localStorage.getItem('pwa_install_dismissed');
    if (hasDismissed === 'true') {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      // Delay showing the popup slightly for better UX
      setTimeout(() => {
        setShowPopup(true);
      }, 2000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPopup(false);
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
    if (!deferredPrompt) return;

    // Show the native install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPopup(false);

    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (!showPopup || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] bg-white rounded-xl shadow-2xl border border-brand-soft-grey z-[100] overflow-hidden animate-slide-up">
      <div className="p-4 sm:p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-deep-navy flex-shrink-0 flex items-center justify-center">
          <Download size={24} className="text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-serif text-brand-deep-navy font-medium text-lg">Install KHU Developers</h3>
          <p className="text-sm text-brand-charcoal/70 mt-1">
            Install our app for faster access to your dashboard, business records, visits, and notifications.
          </p>
          
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-brand-gold text-brand-deep-navy px-4 py-2 rounded font-medium text-sm hover:bg-brand-gold/90 transition-colors shadow-sm"
            >
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded text-brand-charcoal/70 text-sm hover:bg-gray-100 transition-colors font-medium border border-gray-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
