import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';
import { getSiteSettings, getSocialLinks, DEFAULT_LOGO_URL } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t, getLocalizedTagline } = useLanguage();
  const [settings, setSettings] = useState(() => getSiteSettings());
  const [socialLinks, setSocialLinks] = useState(() => getSocialLinks().filter(s => s.enabled));

  const sync = useCallback(() => {
    setSettings(getSiteSettings());
    setSocialLinks(getSocialLinks().filter(s => s.enabled));
  }, []);

  useEffect(() => {
    window.addEventListener(DATA_UPDATED_EVENT, sync);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, sync);
  }, [sync]);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 pb-24 md:py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-center">
          <NewsletterSignup />
          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-3">
            <div className="flex items-center gap-3">
              <img
                src={settings.logoUrl || DEFAULT_LOGO_URL}
                alt={settings.siteName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="text-left md:text-right">
                <p className="text-base font-bold text-white">{settings.siteName}</p>
                <p className="text-xs text-slate-400">{getLocalizedTagline(settings.tagline)}</p>
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-end gap-2">
                {socialLinks.map(social => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-700 text-slate-200 hover:text-white text-xs font-medium transition-colors"
                  >
                    {social.platform}
                  </a>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-center md:justify-end gap-4 text-xs mt-1">
              <Link to="/submit-tip" className="text-red-300 hover:text-white font-medium transition-colors">{t('sendUsNews')}</Link>
              <Link to="/about" className="hover:text-white transition-colors">{t('aboutUs')}</Link>
              <Link to="/contact" className="hover:text-white transition-colors">{t('contact')}</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link>
              <Link to="/terms" className="hover:text-white transition-colors">{t('terms')}</Link>
              <Link to="/settings" className="hover:text-white transition-colors">{t('notificationSettings')}</Link>
            </div>
          </div>
        </div>
        <div className="text-center border-t border-slate-700 pt-8">
          <p className="text-sm">© {new Date().getFullYear()} {settings.siteName}. {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}
