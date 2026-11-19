import { useState, useEffect, useCallback } from 'react';
import { getVideos } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { Video } from '../types';
import { useLanguage } from '../context/LanguageContext';

export default function Videos() {
  const { t, translateCategory, formatDate } = useLanguage();
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  const loadVideos = useCallback(() => {
    setVideos(getVideos());
  }, []);

  useEffect(() => {
    loadVideos();
    window.addEventListener(DATA_UPDATED_EVENT, loadVideos);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadVideos);
  }, [loadVideos]);

  const categories = ['All', ...Array.from(new Set(videos.map(v => v.category)))];
  const filteredVideos =
    activeCategory === 'All'
      ? videos
      : videos.filter(v => v.category === activeCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{t('videoNewsTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('videoNewsSubtitle')}
        </p>
      </div>

      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8">
          {categories.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                activeCategory === category
                  ? 'bg-red-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {translateCategory(category)}
            </button>
          ))}
        </div>
      )}

      {filteredVideos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
          {t('noVideosInCategory')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <article
              key={video.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden"
            >
              <iframe
                className="w-full aspect-video"
                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                title={video.title}
                allowFullScreen
              />
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold text-red-700">{translateCategory(video.category)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {formatDate(video.publishedAt)}
                  </span>
                </div>
                <h2 className="font-bold text-slate-900 leading-snug">{video.title}</h2>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
