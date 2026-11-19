import { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { AppLanguage, useLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const LANGUAGE_OPTIONS: { code: AppLanguage; label: string; shortLabel: string }[] = [
  { code: 'hi', label: 'हिंदी', shortLabel: 'हिंदी' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
];

export default function LanguageSwitcher({
  variant = 'compact',
  className = '',
}: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (variant === 'full') {
    return (
      <div
        role="group"
        aria-label={t('languageSwitchLabel')}
        className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 shrink-0 ${className}`}
      >
        <button
          type="button"
          onClick={() => setLang('en')}
          aria-pressed={lang === 'en'}
          aria-label={t('switchToEnglish')}
          className={`px-3 py-1.5 font-semibold rounded-md text-xs transition-colors whitespace-nowrap ${
            lang === 'en'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLang('hi')}
          aria-pressed={lang === 'hi'}
          aria-label={t('switchToHindi')}
          className={`px-3 py-1.5 font-semibold rounded-md text-xs transition-colors whitespace-nowrap ${
            lang === 'hi'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          हिंदी
        </button>
      </div>
    );
  }

  const activeOption = LANGUAGE_OPTIONS.find(o => o.code === lang) || LANGUAGE_OPTIONS[0];

  return (
    <div ref={dropdownRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('languageSwitchLabel')}
        className="min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors whitespace-nowrap shrink-0"
      >
        <Languages className="w-3.5 h-3.5 text-red-700 shrink-0" aria-hidden="true" />
        <span>{activeOption.shortLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('languageSwitchLabel')}
          className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50"
        >
          {LANGUAGE_OPTIONS.map(option => {
            const isSelected = lang === option.code;
            return (
              <li key={option.code} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    setLang(option.code);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-red-50 text-red-700'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-red-700 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
