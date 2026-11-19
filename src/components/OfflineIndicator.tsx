import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function OfflineIndicator() {
  const { t } = useLanguage();
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="bg-amber-950 text-amber-50 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b border-amber-800"
    >
      <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
      <span>{t('offlineBanner')}</span>
    </div>
  );
}
