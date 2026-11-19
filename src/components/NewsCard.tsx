import { useState, useEffect } from 'react';
import { Bookmark, MapPin, Newspaper as NewspaperIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { News } from '../types';
import { isArticleBookmarked, toggleArticleBookmark } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useLanguage } from '../context/LanguageContext';

interface NewsCardProps {
  news: News;
  variant?: 'grid' | 'lead';
}

export default function NewsCard({ news, variant = 'grid' }: NewsCardProps) {
  const { t, translateCategory, translateDistrict, formatDate } = useLanguage();
  const [saved, setSaved] = useState(() => isArticleBookmarked(news.id));
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isArticleBookmarked(news.id));
    window.addEventListener(DATA_UPDATED_EVENT, sync);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, sync);
  }, [news.id]);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleArticleBookmark(news);
    setSaved(next);
  };

  const custom = news.linkUrl?.trim();
  const isExternal = Boolean(custom && /^https?:\/\//i.test(custom));
  const target = custom
    ? isExternal
      ? custom
      : custom.startsWith('/')
        ? custom
        : `/${custom}`
    : `/article/${news.id}`;

  const isLead = variant === 'lead';

  const mediaFallback = (
    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-200 to-red-50 flex items-center justify-center p-3">
      <NewspaperIcon className="w-7 h-7 text-slate-400" aria-hidden="true" />
    </div>
  );

  const cardInner = isLead ? (
    <div>
      <div className="relative aspect-[16/10] sm:aspect-video overflow-hidden rounded-xl mb-3 bg-slate-100">
        {imgError || !news.imageUrl ? (
          mediaFallback
        ) : (
          <img
            src={news.imageUrl}
            alt={news.title}
            onError={() => setImgError(true)}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        )}
        <button
          type="button"
          onClick={handleToggleBookmark}
          aria-label={saved ? t('removeBookmarkLabel') : t('saveBookmarkLabel')}
          className={`absolute top-2.5 right-2.5 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
            saved
              ? 'bg-red-700 text-white shadow-sm'
              : 'bg-slate-900/65 text-white hover:bg-red-700'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="text-red-700 uppercase">{translateCategory(news.category)}</span>
        {news.district && news.district !== 'All J&K' && (
          <>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-0.5 text-slate-500">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {translateDistrict(news.district)}
            </span>
          </>
        )}
      </div>
      <h3 className="text-xl sm:text-lg font-extrabold sm:font-bold text-slate-900 mt-1 leading-snug sm:leading-tight line-clamp-2 group-hover:text-red-700 transition-colors">
        {news.title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 tabular-nums">
        {formatDate(news.publishedAt)}
      </p>
    </div>
  ) : (
    <div className="flex flex-row-reverse sm:block items-start gap-3.5 py-3.5 border-b border-slate-100 sm:border-0 sm:py-0">
      <div className="relative w-28 aspect-[4/3] sm:w-full sm:aspect-video overflow-hidden rounded-lg sm:mb-3 shrink-0 bg-slate-100">
        {imgError || !news.imageUrl ? (
          mediaFallback
        ) : (
          <img
            src={news.imageUrl}
            alt={news.title}
            onError={() => setImgError(true)}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        )}
        <button
          type="button"
          onClick={handleToggleBookmark}
          aria-label={saved ? t('removeBookmarkLabel') : t('saveBookmarkLabel')}
          className={`hidden sm:flex absolute top-2.5 right-2.5 w-9 h-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
            saved
              ? 'bg-red-700 text-white shadow-sm'
              : 'bg-slate-900/65 text-white hover:bg-red-700'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold">
          <span className="text-red-700 uppercase">{translateCategory(news.category)}</span>
          {news.district && news.district !== 'All J&K' && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-0.5 text-slate-500">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                {translateDistrict(news.district)}
              </span>
            </>
          )}
        </div>
        <h3 className="text-[15px] sm:text-lg font-bold text-slate-900 mt-1 leading-snug sm:leading-tight line-clamp-3 sm:line-clamp-2 group-hover:text-red-700 transition-colors">
          {news.title}
        </h3>
        <div className="flex items-center justify-between gap-2 mt-1.5 sm:mt-2">
          <p className="text-xs sm:text-sm text-slate-500 tabular-nums">
            {formatDate(news.publishedAt)}
          </p>
          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-label={saved ? t('removeBookmarkLabel') : t('saveBookmarkLabel')}
            className={`sm:hidden inline-flex items-center justify-center w-8 h-8 -mr-1.5 rounded-lg transition-colors ${
              saved
                ? 'text-red-700 bg-red-50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {cardInner}
      </a>
    );
  }

  return (
    <Link to={target} className="group block">
      {cardInner}
    </Link>
  );
}
