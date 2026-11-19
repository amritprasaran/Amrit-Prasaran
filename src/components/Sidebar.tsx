import { Home, Newspaper, Tag, Info, Mail, Settings, User, Video, X, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getSiteSettings, getCategories, DEFAULT_LOGO_URL } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useLanguage } from '../context/LanguageContext';
import PWAInstallButton from './PWAInstallButton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { t, translateCategory } = useLanguage();
  const [settings, setSettings] = useState(() => getSiteSettings());
  const [categories, setCategories] = useState(() =>
    getCategories().filter(c => c.enabled !== false)
  );

  useEffect(() => {
    const sync = () => {
      setSettings(getSiteSettings());
      setCategories(getCategories().filter(c => c.enabled !== false));
    };
    window.addEventListener(DATA_UPDATED_EVENT, sync);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, sync);
  }, []);

  const links = [
    { name: t('profile'), path: '/profile', icon: User },
    { name: t('home'), path: '/', icon: Home },
    ...categories.map(cat => ({
      name: translateCategory(cat.name),
      path: `/category/${encodeURIComponent(cat.name.toLowerCase())}`,
      icon: Tag,
    })),
    { name: t('epaper'), path: '/epaper', icon: Newspaper },
    { name: t('videos'), path: '/videos', icon: Video },
    { name: t('sendUsNews'), path: '/submit-tip', icon: Send },
    { name: t('about'), path: '/about', icon: Info },
    { name: t('contact'), path: '/contact', icon: Mail },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-white z-50 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-out p-6 border-r border-slate-200 overflow-y-auto shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:sticky lg:block flex flex-col`}
      >
        <div className="flex justify-between items-center mb-8 lg:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={settings.logoUrl || DEFAULT_LOGO_URL}
              alt={settings.siteName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            />
            <h2 className="text-lg font-bold text-red-700 whitespace-nowrap truncate">
              {settings.siteName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeMenu')}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="hidden lg:flex items-center gap-2.5 mb-8">
          <img
            src={settings.logoUrl || DEFAULT_LOGO_URL}
            alt={settings.siteName}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
          />
          <h2 className="text-lg font-bold text-red-700 whitespace-nowrap truncate">
            {settings.siteName}
          </h2>
        </div>
        <nav className="space-y-1.5 flex-1">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-red-50 text-red-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 mt-4 border-t border-slate-200">
          <PWAInstallButton variant="sidebar" />
        </div>
      </aside>
    </>
  );
}
