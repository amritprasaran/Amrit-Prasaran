import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  Share2,
  MessageCircle,
  Link2,
  Check,
  Type,
  Bookmark,
  MapPin,
  Eye,
  User,
  Clock,
  Send,
} from 'lucide-react';
import {
  getNews,
  isArticleBookmarked,
  toggleArticleBookmark,
  isNewsVisibleToPublic,
  getArticleViews,
  incrementArticleView,
} from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useLanguage } from '../context/LanguageContext';
import { News } from '../types';
import CommentSection from '../components/CommentSection';
import NewsCard from '../components/NewsCard';
import SponsorBanner from '../components/SponsorBanner';
import { copyTextToClipboard, shareContentViaWebShare } from '../utils/webShare';

type FontSizePreset = 'small' | 'medium' | 'large';

const FONT_SIZE_OPTIONS: { id: FontSizePreset; labelKey: string; bodyClass: string }[] = [
  { id: 'small', labelKey: 'smallSize', bodyClass: 'text-sm leading-relaxed' },
  { id: 'medium', labelKey: 'mediumSize', bodyClass: 'text-base sm:text-lg leading-relaxed' },
  { id: 'large', labelKey: 'largeSize', bodyClass: 'text-xl sm:text-2xl leading-relaxed' },
];

function getInitialFontSize(): FontSizePreset {
  const saved = localStorage.getItem('article_text_size');
  if (saved === 'small' || saved === 'text-sm') return 'small';
  if (saved === 'large' || saved === 'text-xl' || saved === 'text-2xl') return 'large';
  return 'medium';
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { locale, t, translateCategory, translateDistrict, formatDate, formatNumber } = useLanguage();
  const [news, setNews] = useState<News | null>(null);
  const [relatedStories, setRelatedStories] = useState<News[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [fontSize, setFontSize] = useState<FontSizePreset>(getInitialFontSize);

  const loadArticleAndRelated = useCallback(() => {
    const allNews = getNews().filter(n => isNewsVisibleToPublic(n));
    const article = allNews.find(n => n.id === id) || null;
    setNews(article);
    setSaved(article ? isArticleBookmarked(article.id) : false);
    const views = getArticleViews();
    setViewCount(article ? views[article.id] || 0 : 0);

    if (article) {
      const candidates = allNews.filter(n => n.id !== article.id);
      const sameCategoryOrDistrict = candidates.filter(
        n =>
          n.category === article.category ||
          (article.district && n.district === article.district)
      );
      const remaining = candidates.filter(
        n => !sameCategoryOrDistrict.some(m => m.id === n.id)
      );
      setRelatedStories([...sameCategoryOrDistrict, ...remaining].slice(0, 3));
    } else {
      setRelatedStories([]);
    }
  }, [id]);

  useEffect(() => {
    loadArticleAndRelated();
    window.addEventListener(DATA_UPDATED_EVENT, loadArticleAndRelated);

    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, loadArticleAndRelated);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [loadArticleAndRelated]);

  useEffect(() => {
    if (news?.id) {
      incrementArticleView(news.id);
    }
  }, [news?.id]);

  const handleFontSizeChange = (size: FontSizePreset) => {
    setFontSize(size);
    localStorage.setItem('article_text_size', size);
  };

  const activeFontClass =
    FONT_SIZE_OPTIONS.find(opt => opt.id === fontSize)?.bodyClass ||
    'text-base sm:text-lg leading-relaxed';

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else if (news) {
      const fullText = `${news.title}. ${news.content}`;
      const utterance = new SpeechSynthesisUtterance(fullText);
      const hasDevanagari = /[\u0900-\u097F]/.test(fullText);
      utterance.lang =
        news.language === 'en'
          ? 'en-IN'
          : news.language === 'hi'
            ? 'hi-IN'
            : hasDevanagari
              ? 'hi-IN'
              : locale;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleToggleBookmark = () => {
    if (!news) return;
    const next = toggleArticleBookmark(news);
    setSaved(next);
  };

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-slate-600 mb-4">{t('articleNotFound')}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {t('backToNews')}
        </Link>
      </div>
    );
  }

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/article/${news.id}`
      : `/article/${news.id}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${news.title}\n${shareUrl}`
  )}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(news.title)}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    news.title
  )}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopyLink = async () => {
    const ok = await copyTextToClipboard(shareUrl);
    setCopied(ok);
    if (ok) {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    const outcome = await shareContentViaWebShare({
      title: news.title,
      text: `${news.title} — AMRIT PRASARAN`,
      url: shareUrl,
    });
    if (outcome === 'shared') {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } else if (outcome === 'copied') {
      setShared(true);
      setCopied(true);
      setTimeout(() => {
        setShared(false);
        setCopied(false);
      }, 2000);
    }
  };

  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    setHeroImgError(false);
  }, [news?.id]);

  return (
    <article className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-700 transition-colors mb-4 sm:mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToNews')}
      </Link>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span className="font-semibold text-red-700 uppercase">{translateCategory(news.category)}</span>
            {news.district && news.district !== 'All J&K' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-red-700" />
                  {translateDistrict(news.district)}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {formatDate(news.publishedAt)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-slate-600 tabular-nums">
              <Eye className="w-3.5 h-3.5" />
              {formatNumber(viewCount)} {t('viewsLabel')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold sm:font-bold mt-2 text-slate-900 leading-tight text-balance">
            {news.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <User className="w-3.5 h-3.5 text-red-700" />
              {t('byLabel')} {news.author?.trim() || t('defaultAuthor')}
            </span>
            {news.updatedAt && news.updatedAt !== news.publishedAt && (
              <span className="inline-flex items-center gap-1.5 text-slate-500 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {t('updatedLabel')}{' '}
                {formatDate(news.updatedAt, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="Article font size"
            className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200"
          >
            <span className="px-2 text-slate-500 flex items-center" aria-hidden="true">
              <Type className="w-4 h-4" />
            </span>
            {FONT_SIZE_OPTIONS.map(option => {
              const isSelected = fontSize === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleFontSizeChange(option.id)}
                  aria-pressed={isSelected}
                  aria-label={`${t(option.labelKey)} text size`}
                  className={`min-h-[36px] px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-pressed={saved}
            aria-label={saved ? t('removeBookmarkLabel') : t('saveBookmarkLabel')}
            className={`min-h-[42px] px-3 py-2 rounded-lg border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              saved
                ? 'bg-red-700 border-red-700 text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
            <span>{saved ? t('savedArticle') : t('saveArticle')}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleNativeShare()}
            aria-label={t('shareArticle')}
            className="min-w-[42px] min-h-[42px] p-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
          >
            {shared ? (
              <Check className="w-5 h-5 text-emerald-700" />
            ) : (
              <Share2 className="w-5 h-5 text-slate-700" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleSpeech}
            aria-label={isPlaying ? t('stopListeningLabel') : t('listenArticleLabel')}
            className="min-w-[42px] min-h-[42px] p-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
          >
            {isPlaying ? (
              <VolumeX className="w-5 h-5 text-red-700" />
            ) : (
              <Volume2 className="w-5 h-5 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      <figure className="mt-5 sm:mt-6 -mx-4 sm:mx-0">
        <div className="w-full aspect-[16/10] sm:aspect-video overflow-hidden rounded-none sm:rounded-xl bg-slate-100">
          {heroImgError || !news.imageUrl ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-200 to-red-50 flex items-center justify-center p-6 text-center">
              <span className="text-sm font-semibold text-slate-500 max-w-md">{news.title}</span>
            </div>
          ) : (
            <img
              src={news.imageUrl}
              alt={news.title}
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {news.photoCaption?.trim() && (
          <figcaption className="mt-2 px-4 sm:px-0 text-xs sm:text-sm text-slate-500 italic">
            {news.photoCaption}
          </figcaption>
        )}
      </figure>

      <div className="mt-5 py-3 border-y border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
          <Share2 className="w-4 h-4 text-slate-500" />
          {t('shareArticle')}
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            aria-label={t('shareArticle')}
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-700 text-white text-xs sm:text-sm font-medium hover:bg-red-800 transition-colors whitespace-nowrap shrink-0"
          >
            {shared ? (
              <>
                <Check className="w-4 h-4 shrink-0" />
                {copied ? t('copiedLink') : t('sharedBtn')}
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 shrink-0" />
                {t('shareBtn')}
              </>
            )}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            WhatsApp
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Telegram"
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-600 text-white text-xs sm:text-sm font-medium hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="w-4 h-4 shrink-0" />
            Telegram
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on X (Twitter)"
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <span className="font-bold leading-none">𝕏</span>
            Twitter / X
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label={t('copyLinkLabel')}
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                {t('copiedLink')}
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 shrink-0" />
                {t('copyLink')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className={`mt-6 space-y-4 text-slate-800 ${activeFontClass}`}>
        {news.content
          .split(/\n+/)
          .map(p => p.trim())
          .filter(Boolean)
          .map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
      </div>

      <SponsorBanner placement="article" className="my-8" />

      {relatedStories.length > 0 && (
        <section className="mt-10 pt-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            {t('relatedStories')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedStories.map(item => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        </section>
      )}

      <CommentSection newsId={news.id} />
    </article>
  );
}
