import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { getAds } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { SponsorAd } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SponsorBannerProps {
  placement: 'home' | 'article' | 'epaper';
  className?: string;
}

function getSafeHref(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // ignore invalid URL
  }
  return '#';
}

export default function SponsorBanner({ placement, className = '' }: SponsorBannerProps) {
  const { t } = useLanguage();
  const [ad, setAd] = useState<SponsorAd | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const sync = () => {
      const matching = getAds().filter(item => item.enabled && item.placement === placement);
      setAd(matching[0] || null);
      setImgError(false);
    };
    sync();
    window.addEventListener(DATA_UPDATED_EVENT, sync);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, sync);
  }, [placement]);

  if (!ad) return null;

  const href = getSafeHref(ad.targetUrl);
  const isExternal = href.startsWith('http');

  return (
    <aside
      aria-label="Sponsored advertisement"
      className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs ${className}`}
    >
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-slate-500">
        <span>{t('sponsored')}</span>
        <span className="text-slate-400 font-medium normal-case truncate ml-2">{ad.title}</span>
      </div>
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer sponsored' : undefined}
        className="group block relative bg-slate-100 aspect-[21/9] sm:aspect-[4/1] max-h-48 sm:max-h-56 overflow-hidden"
      >
        {imgError || !ad.imageUrl ? (
          <div className="w-full h-full bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center px-4 text-sm font-semibold text-slate-600">
            {ad.title}
          </div>
        ) : (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
          />
        )}
        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 bg-slate-900/80 text-white text-xs font-medium px-2.5 py-1 rounded-md backdrop-blur-xs">
          <span>{t('visitAd')}</span>
          <ExternalLink className="w-3 h-3" />
        </span>
      </a>
    </aside>
  );
}
