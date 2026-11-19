import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronDown, Newspaper as NewspaperIcon, TrendingUp, Eye } from 'lucide-react';
import {
  getNews,
  getVideos,
  getBreakingNews,
  getSiteSettings,
  getArticleViews,
  isNewsVisibleToPublic,
  JK_DISTRICTS,
} from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useLanguage } from '../context/LanguageContext';
import { News, Video } from '../types';
import HeroSlider from '../components/HeroSlider';
import BreakingNewsTicker from '../components/BreakingNewsTicker';
import HomeWeatherWidget from '../components/HomeWeatherWidget';
import NewsCard from '../components/NewsCard';
import VideoSection from '../components/VideoSection';
import EPaperHomeSection from '../components/EPaperHomeSection';
import SponsorBanner from '../components/SponsorBanner';

export default function Home() {
  const { t, translateCategory, translateDistrict, formatNumber } = useLanguage();
  const [news, setNews] = useState<News[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>(() => getArticleViews());
  const [tickerItems, setTickerItems] = useState<string[]>([]);
  const [tickerEnabled, setTickerEnabled] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('All J&K');
  const [editionFilter, setEditionFilter] = useState<'all' | 'hi' | 'en'>('all');

  const refreshData = useCallback(() => {
    const publishedNews = getNews()
      .filter(n => isNewsVisibleToPublic(n))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    setNews(publishedNews);
    setVideos(getVideos());
    setViewCounts(getArticleViews());

    const settings = getSiteSettings();
    setTickerEnabled(settings.tickerEnabled);
    setTickerItems(
      getBreakingNews()
        .filter(item => item.enabled)
        .map(item => item.text)
    );
  }, []);

  useEffect(() => {
    refreshData();
    window.addEventListener(DATA_UPDATED_EVENT, refreshData);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, refreshData);
  }, [refreshData]);

  const sliderSlides = news.filter(n => n.isFeatured);

  const filteredLatestNews = news.filter(item => {
    const matchesDistrict =
      selectedDistrict === 'All J&K' ||
      item.district?.toLowerCase() === selectedDistrict.toLowerCase() ||
      item.title.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
      item.content.toLowerCase().includes(selectedDistrict.toLowerCase());

    const itemLang = item.language || 'hi';
    const matchesLang = editionFilter === 'all' || itemLang === editionFilter;

    return matchesDistrict && matchesLang;
  });

  const mostReadStories = [...news]
    .sort((a, b) => {
      const diff = (viewCounts[b.id] || 0) - (viewCounts[a.id] || 0);
      if (diff !== 0) return diff;
      return b.publishedAt.localeCompare(a.publishedAt);
    })
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-3 sm:py-6">
      {tickerEnabled && <BreakingNewsTicker news={tickerItems} />}

      <HomeWeatherWidget />

      <div className="my-3 sm:my-6">
        <HeroSlider slides={sliderSlides} />
      </div>

      {/* Latest J&K News Feed with District & Language Filters */}
      <section className="my-6 sm:my-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <NewspaperIcon className="w-5 h-5 text-red-700 shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('latestJKNews')}
            </h2>
          </div>

          <div
            role="group"
            aria-label={t('filterLanguageLabel')}
            className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto"
          >
            {(['all', 'hi', 'en'] as const).map(code => {
              const label =
                code === 'all'
                  ? t('allEditions')
                  : code === 'hi'
                    ? t('hindiEdition')
                    : t('englishEdition');
              const active = editionFilter === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setEditionFilter(code)}
                  className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-red-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Choose Location Dropdown Menu */}
        <div className="mb-4 sm:mb-5 flex items-center gap-2.5">
          <label
            htmlFor="home-location-select"
            className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap"
          >
            {t('chooseLocation')}
          </label>
          <div className="relative flex-1 sm:flex-none inline-flex items-center sm:min-w-[230px]">
            <MapPin className="w-4 h-4 text-red-700 absolute left-3 pointer-events-none" />
            <select
              id="home-location-select"
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              aria-label={t('chooseLocation')}
              className="w-full min-h-[40px] appearance-none pl-9 pr-9 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:border-red-700 outline-none transition-colors cursor-pointer"
            >
              {JK_DISTRICTS.map(district => (
                <option key={district} value={district}>
                  {district === 'All J&K' ? t('allJK') : translateDistrict(district)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
          </div>
        </div>

        {filteredLatestNews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            {t('noArticlesFound')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
            {filteredLatestNews.map((article, idx) => (
              <div
                key={article.id}
                className={idx === 0 ? 'pb-3 border-b border-slate-100 sm:border-0 sm:pb-0' : ''}
              >
                <NewsCard news={article} variant={idx === 0 ? 'lead' : 'grid'} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Most Read in J&K Section */}
      {mostReadStories.length > 0 && (
        <section className="my-6 sm:my-10 bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="w-5 h-5 text-red-700 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t('mostReadJK')}
            </h2>
          </div>

          <div className="divide-y divide-slate-100 md:divide-y-0 md:grid md:grid-cols-2 md:gap-4">
            {mostReadStories.map((story, idx) => {
              const count = viewCounts[story.id] || 0;
              return (
                <Link
                  key={story.id}
                  to={`/article/${story.id}`}
                  className="group flex items-start gap-3.5 py-3 md:p-3 md:rounded-lg md:hover:bg-red-50/40 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-red-700 text-white font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
                    {formatNumber(idx + 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-red-700 uppercase">
                        {translateCategory(story.category)}
                      </span>
                      {story.district && story.district !== 'All J&K' && (
                        <span>· {translateDistrict(story.district)}</span>
                      )}
                      <span className="inline-flex items-center gap-1 ml-auto text-slate-500 tabular-nums">
                        <Eye className="w-3.5 h-3.5" />
                        {formatNumber(count)} {t('viewsLabel')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-700 line-clamp-2 leading-snug">
                      {story.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <SponsorBanner placement="home" className="my-6 sm:my-8" />

      <EPaperHomeSection />

      <VideoSection videos={videos} />
    </div>
  );
}
