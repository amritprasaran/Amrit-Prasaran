import { Search, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SearchModal from './SearchModal';
import WeatherWidget from './WeatherWidget';
import PWAInstallButton from './PWAInstallButton';
import LanguageSwitcher from './LanguageSwitcher';
import {
  getNews,
  getCategories,
  getSiteSettings,
  DEFAULT_LOGO_URL,
  isNewsVisibleToPublic,
} from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useLanguage } from '../context/LanguageContext';
import { News } from '../types';

interface HeaderProps {
  onOpenMenu?: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const { lang, t, translateCategory, translateDistrict } = useLanguage();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<News[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [settings, setSettings] = useState(() => getSiteSettings());
  const [categories, setCategories] = useState(() =>
    getCategories().filter(c => c.enabled !== false)
  );
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const syncHeaderData = () => {
      setSettings(getSiteSettings());
      setCategories(getCategories().filter(c => c.enabled !== false));
    };
    window.addEventListener(DATA_UPDATED_EVENT, syncHeaderData);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, syncHeaderData);
  }, []);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const allNews = getNews().filter(n => isNewsVisibleToPublic(n));
    setResults(
      allNews.filter(
        n =>
          n.title.toLowerCase().includes(trimmed) ||
          n.content.toLowerCase().includes(trimmed) ||
          (n.district && n.district.toLowerCase().includes(trimmed))
      )
    );
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectArticle = (id: string) => {
    navigate(`/article/${id}`);
    setQuery('');
    setShowDropdown(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelectArticle(results[0].id);
    }
  };

  return (
    <>
      <WeatherWidget />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {onOpenMenu && (
              <button
                type="button"
                onClick={onOpenMenu}
                aria-label={t('openMenu')}
                className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1.5 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <img
                src={settings.logoUrl || DEFAULT_LOGO_URL}
                alt={settings.siteName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 border border-slate-200"
              />
              <span className="text-[15px] min-[390px]:text-base sm:text-xl font-extrabold tracking-tight leading-none text-red-700 whitespace-nowrap">
                {lang === 'hi' && settings.siteName.trim().toUpperCase() === 'AMRIT PRASARAN'
                  ? 'अमृत प्रसारण'
                  : settings.siteName}
              </span>
            </Link>
          </div>

          {/* Inline Header Search Bar (Tablet & Desktop) */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-md relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={query}
                onFocus={() => setShowDropdown(true)}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowDropdown(false);
                }}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchArticlesLabel')}
                className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-red-700 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  aria-label={t('clearSearch')}
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                  }}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {showDropdown && query.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
                {results.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">
                    {t('noMatchingNews')}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {results.map(article => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => handleSelectArticle(article.id)}
                        className="w-full text-left p-3 hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {article.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {translateCategory(article.category)}
                          {article.district ? ` · ${translateDistrict(article.district)}` : ''} · {article.content}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <PWAInstallButton variant="header" />

            <LanguageSwitcher variant="compact" />

            <button
              type="button"
              aria-label={t('searchNewsLabel')}
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop sticky category strip stays attached on md+ */}
        {categories.length > 0 && (
          <nav
            aria-label={t('newsCategoriesLabel')}
            className="hidden md:block border-t border-slate-100 bg-slate-50/70"
          >
            <div className="container mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
              <Link
                to="/"
                className={`px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  location.pathname === '/'
                    ? 'border-red-700 text-red-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('home')}
              </Link>
              {categories.map(cat => {
                const catPath = `/category/${encodeURIComponent(cat.name.toLowerCase())}`;
                const isActive =
                  decodeURIComponent(location.pathname).toLowerCase() ===
                  `/category/${cat.name.toLowerCase()}`;
                return (
                  <Link
                    key={cat.id}
                    to={catPath}
                    className={`px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? 'border-red-700 text-red-700'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {translateCategory(cat.name)}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Mobile scrollable category bar directly under header (non-sticky to preserve mobile viewport) */}
      {categories.length > 0 && (
        <nav
          aria-label={t('newsCategoriesLabel')}
          className="md:hidden border-b border-slate-200 bg-slate-50/90"
        >
          <div className="container mx-auto px-3 flex items-center gap-1 overflow-x-auto no-scrollbar">
            <Link
              to="/"
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                location.pathname === '/'
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('home')}
            </Link>
            {categories.map(cat => {
              const catPath = `/category/${encodeURIComponent(cat.name.toLowerCase())}`;
              const isActive =
                decodeURIComponent(location.pathname).toLowerCase() ===
                `/category/${cat.name.toLowerCase()}`;
              return (
                <Link
                  key={cat.id}
                  to={catPath}
                  className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-red-700 text-red-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {translateCategory(cat.name)}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
