import { Home, Newspaper, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const links = [
    { name: t('home'), path: '/', icon: Home },
    { name: t('epaper'), path: '/epaper', icon: Newspaper },
    { name: t('videos'), path: '/videos', icon: Video },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] z-40"
    >
      {links.map(link => {
        const Icon = link.icon;
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 h-14 px-2 transition-colors whitespace-nowrap ${
              isActive
                ? 'text-red-700 font-semibold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-red-700"
              />
            )}
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[11px] leading-none">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
