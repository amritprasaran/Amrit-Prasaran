import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getNews, isNewsVisibleToPublic } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { News } from '../types';
import NewsCard from '../components/NewsCard';
import { useLanguage } from '../context/LanguageContext';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { t, translateCategory } = useLanguage();
  const [articles, setArticles] = useState<News[]>([]);

  const loadCategoryNews = useCallback(() => {
    const allNews = getNews()
      .filter(n => isNewsVisibleToPublic(n))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    if (!category) {
      setArticles(allNews);
      return;
    }
    const normalized = decodeURIComponent(category).toLowerCase();
    setArticles(allNews.filter(n => n.category.toLowerCase() === normalized));
  }, [category]);

  useEffect(() => {
    loadCategoryNews();
    window.addEventListener(DATA_UPDATED_EVENT, loadCategoryNews);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadCategoryNews);
  }, [loadCategoryNews]);

  const decoded = category ? decodeURIComponent(category) : '';
  const rawTitle = decoded
    ? decoded.charAt(0).toUpperCase() + decoded.slice(1)
    : '';
  const displayCategory = rawTitle ? translateCategory(rawTitle) : t('allNewsTitle');

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToHome')}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {rawTitle ? `${displayCategory} ${t('newsHeadingSuffix')}` : displayCategory}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('categoryUpdatesPrefix')} {displayCategory}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
          {t('noCategoryArticles')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
          {articles.map((article, idx) => (
            <div
              key={article.id}
              className={idx === 0 ? 'pb-3 border-b border-slate-100 sm:border-0 sm:pb-0' : ''}
            >
              <NewsCard news={article} variant={idx === 0 ? 'lead' : 'grid'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
