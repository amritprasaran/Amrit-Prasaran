import { useLanguage } from '../context/LanguageContext';

export default function BreakingNewsTicker({ news }: { news: string[] }) {
  const { t } = useLanguage();
  if (news.length === 0) return null;

  const loopedNews = news.length > 1 ? [...news, ...news] : [...news, ...news];

  return (
    <div className="bg-red-700 text-white rounded-lg overflow-hidden flex items-center">
      <span className="bg-red-900 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0 z-10">
        {t('breaking')}
      </span>
      <div className="flex-1 overflow-hidden py-1.5 sm:py-2 px-3">
        <div className="flex items-center gap-6 sm:gap-8 animate-marquee w-max">
          {loopedNews.map((item, i) => (
            <span key={i} className="whitespace-nowrap text-xs sm:text-sm font-medium inline-flex items-center gap-6 sm:gap-8">
              <span>{item}</span>
              <span aria-hidden="true" className="text-red-300/70">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
