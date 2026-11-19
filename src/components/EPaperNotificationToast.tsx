import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, X, ArrowRight } from 'lucide-react';
import {
  NEW_EPAPER_EVENT,
  LATEST_EPAPER_ALERT_KEY,
  EPaperNotificationPayload,
} from '../utils/notifications';
import { useLanguage } from '../context/LanguageContext';

export default function EPaperNotificationToast() {
  const { t } = useLanguage();
  const [alert, setAlert] = useState<EPaperNotificationPayload | null>(null);

  useEffect(() => {
    const handleNewEPaper = (event: Event) => {
      const custom = event as CustomEvent<EPaperNotificationPayload>;
      if (custom.detail) {
        setAlert(custom.detail);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LATEST_EPAPER_ALERT_KEY && event.newValue) {
        try {
          setAlert(JSON.parse(event.newValue) as EPaperNotificationPayload);
        } catch {
          // Ignore malformed storage payload
        }
      }
    };

    window.addEventListener(NEW_EPAPER_EVENT, handleNewEPaper);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(NEW_EPAPER_EVENT, handleNewEPaper);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 9000);
    return () => clearTimeout(timer);
  }, [alert]);

  if (!alert) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-700 text-white flex items-center justify-center shrink-0">
          <Newspaper className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-red-400">
            {t('newEPaperUploaded')}
          </p>
          <p className="text-sm font-semibold text-white mt-0.5 line-clamp-2">
            {alert.title}
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            <Link
              to={`/epaper?id=${encodeURIComponent(alert.id)}&fullscreen=1`}
              onClick={() => setAlert(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>{t('readNow')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setAlert(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAlert(null)}
          aria-label={t('closeNotification')}
          className="p-1 text-slate-400 hover:text-white shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
