import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { getNews, isNewsVisibleToPublic } from '../services/dataService';
import { News } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, translateCategory } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<News[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const allNews = getNews().filter(n => isNewsVisibleToPublic(n));
    const q = query.toLowerCase();
    setResults(
      allNews.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      )
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center px-4 pt-12 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-4 sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('searchShortPlaceholder')}
            className="flex-1 min-w-0 text-base sm:text-lg text-slate-900 outline-none"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mt-4 max-h-[65vh] overflow-y-auto">
          {results.map(n => (
            <button
              key={n.id}
              type="button"
              className="w-full text-left p-3 hover:bg-slate-50 rounded-lg transition-colors"
              onClick={() => {
                navigate(`/article/${n.id}`);
                onClose();
              }}
            >
              <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {n.title}
              </h4>
              <p className="text-xs text-red-700 font-medium mt-1">{translateCategory(n.category)}</p>
            </button>
          ))}
          {query.trim() && results.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">{t('noResultsFound')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
