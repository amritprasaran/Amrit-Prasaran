import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Newspaper } from '../types';
import { getNewspapers } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import {
  Download,
  Calendar,
  Maximize2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Bell,
  BellOff,
  Loader2,
  Share2,
  Check,
} from 'lucide-react';
import EPaperFullscreenReader from '../components/EPaperFullscreenReader';
import PdfPageCanvas from '../components/PdfPageCanvas';
import SponsorBanner from '../components/SponsorBanner';
import { downloadEditionPdf } from '../utils/pdfDownload';
import { formatFileSize } from '../utils/epaperStorage';
import { searchPdfText, PdfSearchMatch } from '../utils/pdfDocument';
import { shareContentViaWebShare } from '../utils/webShare';
import {
  BREAKING_NOTIF_KEY,
  isEPaperPushEnabled,
  setEPaperPushEnabled,
  requestPushPermission,
} from '../utils/notifications';
import { syncDevicePushRegistration } from '../utils/fcm';
import { useLanguage } from '../context/LanguageContext';

export default function EPaper() {
  const { t, formatDate, formatNumber } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [papers, setPapers] = useState<Newspaper[]>([]);
  const [selected, setSelected] = useState<Newspaper | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle');

  // Full-text search inside the active PDF edition
  const [textQuery, setTextQuery] = useState('');
  const [textMatches, setTextMatches] = useState<PdfSearchMatch[]>([]);
  const [isSearchingText, setIsSearchingText] = useState(false);
  const [hasSearchedText, setHasSearchedText] = useState(false);

  const [pushSubscribed, setPushSubscribed] = useState(() => isEPaperPushEnabled());

  const handleTogglePushSubscription = async () => {
    const next = !pushSubscribed;
    if (next) {
      await requestPushPermission();
    }
    setEPaperPushEnabled(next);
    setPushSubscribed(next);
    void syncDevicePushRegistration({
      region: localStorage.getItem('breaking_news_region') || 'All Jammu & Kashmir',
      epaperEnabled: next,
      breakingEnabled: localStorage.getItem(BREAKING_NOTIF_KEY) === 'true',
    }).catch(() => undefined);
  };

  const loadPapers = useCallback(() => {
    const data = getNewspapers().sort((a, b) => b.date.localeCompare(a.date));
    setPapers(data);
    return data;
  }, []);

  useEffect(() => {
    const onCloudUpdate = () => {
      const data = loadPapers();
      if (data.length > 0) {
        setSelected(prev => (prev && data.some(d => d.id === prev.id) ? prev : data[0]));
      }
    };
    window.addEventListener(DATA_UPDATED_EVENT, onCloudUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, onCloudUpdate);
  }, [loadPapers]);

  useEffect(() => {
    const data = loadPapers();
    const paramId = searchParams.get('id');
    const paramPage = Number.parseInt(searchParams.get('page') || '', 10);
    const initialPage = Number.isFinite(paramPage) && paramPage > 0 ? paramPage : 1;
    const shouldFullscreen = searchParams.get('fullscreen') === '1';

    if (paramId) {
      const match = data.find(p => p.id === paramId);
      if (match) {
        setSelected(match);
        setCurrentPage(initialPage);
        if (shouldFullscreen) setIsFullscreen(true);
        return;
      }
    }

    if (data.length > 0) {
      setSelected(prev => {
        if (prev && data.some(d => d.id === prev.id)) return prev;
        return data[0];
      });
      if (initialPage > 1) setCurrentPage(initialPage);
      if (shouldFullscreen) setIsFullscreen(true);
    }
  }, [searchParams, loadPapers]);

  const handleSelectEdition = (paper: Newspaper) => {
    setSelected(paper);
    setCurrentPage(1);
    setNumPages(paper.pageCount || 1);
    setTextQuery('');
    setTextMatches([]);
    setHasSearchedText(false);
  };

  const handleNumPages = useCallback((count: number) => {
    setNumPages(count);
    setCurrentPage(prev => Math.max(1, Math.min(prev, count)));
  }, []);

  const handleSearchInsideEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !textQuery.trim()) {
      setTextMatches([]);
      setHasSearchedText(false);
      return;
    }
    setIsSearchingText(true);
    try {
      const matches = await searchPdfText(selected.pdfUrl, textQuery);
      setTextMatches(matches);
      setHasSearchedText(true);
      if (matches.length > 0) {
        setCurrentPage(matches[0].pageNumber);
      }
    } finally {
      setIsSearchingText(false);
    }
  };

  const filteredPapers = papers.filter(p => {
    const matchesDate = !dateFilter || p.date === dateFilter;
    const matchesQuery =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.date.includes(searchQuery);
    return matchesDate && matchesQuery;
  });

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    if (searchParams.has('fullscreen')) {
      const next = new URLSearchParams(searchParams);
      next.delete('fullscreen');
      setSearchParams(next, { replace: true });
    }
  };

  const handleShareEdition = async () => {
    if (!selected) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/epaper?id=${encodeURIComponent(selected.id)}&page=${currentPage}`;
    const outcome = await shareContentViaWebShare({
      title: `${selected.title} (${t('pageLabel')} ${currentPage})`,
      text: `${selected.title} · ${formatDate(selected.date, { dateStyle: 'medium' })} (${t('pageLabel')} ${currentPage}) — AMRIT PRASARAN`,
      url: shareUrl,
    });
    if (outcome === 'shared' || outcome === 'copied') {
      setShareStatus(outcome);
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('epaperArchive')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('epaperArchiveDesc')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleTogglePushSubscription()}
            aria-pressed={pushSubscribed}
            className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
              pushSubscribed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {pushSubscribed ? <Bell className="w-4 h-4 text-emerald-700" /> : <BellOff className="w-4 h-4 text-slate-500" />}
            <span>{pushSubscribed ? t('epaperAlertsOn') : t('notifyNewEPaper')}</span>
          </button>
        </div>
      </div>

      <SponsorBanner placement="epaper" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <aside className="order-2 lg:order-1 lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('searchEditionPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-red-700"
              />
            </div>
            <div>
              <label htmlFor="epaper-date-filter" className="block text-xs font-medium text-slate-600 mb-1">
                {t('filterByDate')}
              </label>
              <div className="flex gap-2">
                <input
                  id="epaper-date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-red-700"
                />
                {(dateFilter || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('');
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    {t('resetFilter')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {filteredPapers.length === 0 ? (
              <p className="text-sm text-slate-500 p-4 bg-white border border-slate-200 rounded-lg">
                {t('noEditionsForDate')}
              </p>
            ) : (
              filteredPapers.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectEdition(p)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors border ${
                    selected?.id === p.id
                      ? 'bg-red-50 border-red-200 text-red-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{p.title}</div>
                    <div className="text-xs text-slate-500 tabular-nums flex items-center gap-1.5">
                      <span>{formatDate(p.date, { dateStyle: 'long' })}</span>
                      {p.pageCount && <span>· {formatNumber(p.pageCount)} {t('pagesLabel')}</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="order-1 lg:order-2 lg:col-span-3 bg-white border border-slate-200 p-3.5 sm:p-6 rounded-xl">
          {selected ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{selected.title}</h2>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>
                      {t('editionPrefix')} {formatDate(selected.date, { dateStyle: 'full' })}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {formatNumber(numPages)} {numPages === 1 ? t('pageLabel') : t('pagesLabel')}
                    </span>
                    {selected.fileSize && (
                      <>
                        <span>·</span>
                        <span>{formatFileSize(selected.fileSize)}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="min-h-[42px] inline-flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-800 transition-colors whitespace-nowrap"
                  >
                    <Maximize2 className="w-4 h-4" />
                    {t('readFullScreen')}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadEditionPdf(selected)}
                    className="min-h-[42px] inline-flex items-center gap-2 bg-slate-900 text-white px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadPdf')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleShareEdition()}
                    aria-label={t('shareEPaperLabel')}
                    className="min-h-[42px] inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-800 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-200 transition-colors whitespace-nowrap"
                  >
                    {shareStatus === 'idle' ? (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>{t('shareBtn')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>{shareStatus === 'copied' ? t('copiedLink') : t('sharedBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Full-Text Search Inside Selected Edition */}
              <form
                onSubmit={e => void handleSearchInsideEdition(e)}
                className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={textQuery}
                      onChange={e => setTextQuery(e.target.value)}
                      placeholder={t('searchPdfPlaceholder')}
                      aria-label={t('searchPdfPlaceholder')}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-red-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingText || !textQuery.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-medium"
                  >
                    {isSearchingText ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('searchingText')}</span>
                      </>
                    ) : (
                      <span>{t('searchPages')}</span>
                    )}
                  </button>
                  {hasSearchedText && (
                    <button
                      type="button"
                      onClick={() => {
                        setTextQuery('');
                        setTextMatches([]);
                        setHasSearchedText(false);
                      }}
                      className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {t('clearText')}
                    </button>
                  )}
                </div>

                {hasSearchedText && (
                  <div className="space-y-1.5">
                    {textMatches.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        {t('noPdfMatches')}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                        {textMatches.map(match => (
                          <button
                            key={match.pageNumber}
                            type="button"
                            onClick={() => setCurrentPage(match.pageNumber)}
                            className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                              currentPage === match.pageNumber
                                ? 'bg-red-50 border-red-300 text-red-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="font-bold text-red-700 mr-2">
                              {t('pageLabel')} {match.pageNumber} ({match.matchCount}):
                            </span>
                            <span className="text-slate-600">{match.snippet}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Page Navigation Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {pageNumbers.map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCurrentPage(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        currentPage === num
                          ? 'bg-red-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t('pageLabel')} {num}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label={t('previousPage')}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-slate-600 tabular-nums px-1">
                    {formatNumber(currentPage)} / {formatNumber(numPages)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                    aria-label={t('nextPage')}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actual Broadsheet PDF Page Viewer */}
              <div
                onClick={() => setIsFullscreen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsFullscreen(true);
                  }
                }}
                aria-label={`Open ${selected.title} page ${currentPage} in full screen`}
                className="group relative bg-slate-100 border border-slate-200 rounded-lg p-2 sm:p-4 cursor-pointer hover:border-red-400 transition-colors"
              >
                <PdfPageCanvas
                  pdfUrl={selected.pdfUrl}
                  pageNumber={currentPage}
                  zoom={100}
                  maxWidth={880}
                  onNumPages={handleNumPages}
                />
                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-red-700 group-hover:underline">
                    <Maximize2 className="w-3.5 h-3.5" />
                    {t('tapToReadFullscreen')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500">{t('noEPapersAvailable')}</p>
          )}
        </main>
      </div>

      {isFullscreen && selected && (
        <EPaperFullscreenReader
          paper={selected}
          initialPage={currentPage}
          onClose={handleCloseFullscreen}
        />
      )}
    </div>
  );
}
