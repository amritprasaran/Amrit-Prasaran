import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'settings';
}

export default function PWAInstallButton({ variant = 'header' }: PWAInstallButtonProps) {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIos =
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isInstalled) return null;
  if (!deferredPrompt && !isIos) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return;
    }
    if (isIos) {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-red-700 text-white hover:bg-red-800 transition-colors"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">{t('installApp')}</span>
        </button>
      ) : variant === 'settings' ? (
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{t('installApp')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>{t('installApp')}</span>
        </button>
      )}

      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{t('installAppTitle')}</h3>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                aria-label={t('closeInstallGuide')}
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('iosInstallPrefix')}{' '}
              <Share className="inline w-4 h-4 text-red-700 mx-0.5" />{' '}
              <strong>{t('iosInstallShare')}</strong> {t('iosInstallMiddle')}{' '}
              <strong>{t('iosInstallAddHome')}</strong> {t('iosInstallSuffix')}
            </p>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium"
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
