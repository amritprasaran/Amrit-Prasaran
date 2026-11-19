import { Link } from 'react-router-dom';
import { Video } from '../types';
import { useLanguage } from '../context/LanguageContext';

export default function VideoSection({ videos }: { videos: Video[] }) {
  const { t, translateCategory } = useLanguage();
  if (videos.length === 0) return null;

  return (
    <section className="py-6 sm:py-10">
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t('latestVideos')}</h2>
        <Link to="/videos" className="text-sm font-semibold text-red-700 hover:underline whitespace-nowrap">
          {t('viewAll')}
        </Link>
      </div>
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 no-scrollbar">
        {videos.map(v => (
          <div
            key={v.id}
            className="w-[84vw] max-w-[340px] md:w-auto md:max-w-none shrink-0 snap-start bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <iframe
              className="w-full aspect-video"
              src={`https://www.youtube.com/embed/${v.youtubeId}`}
              title={v.title}
              allowFullScreen
            />
            <div className="p-3.5 sm:p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">{translateCategory(v.category)}</p>
              <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">{v.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
