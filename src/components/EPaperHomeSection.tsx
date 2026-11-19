import { useState, useEffect, useCallback } from 'react';
import { Newspaper } from '../types';
import { getNewspapers } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { Link } from 'react-router-dom';
import { Calendar, Download, Maximize2, Share2, Check } from 'lucide-react';
import EPaperFullscreenReader from './EPaperFullscreenReader';
import { downloadEditionPdf } from '../utils/pdfDownload';
import { shareContentViaWebShare } from '../utils/webShare';
import { useLanguage } from '../context/LanguageContext';

export default function EPaperHomeSection() {
  const { t, formatDate, formatNumber } = useLanguage();
  const [papers, setPapers] = useState<Newspaper[]>([]);
  const [activePaper, setActivePaper] = useState<Newspaper | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);

  const loadPapers = useCallback(() => {
    const data = getNewspapers();
    setPapers(data.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3));
  }, []);

  useEffect(() => {
    loadPapers();
    window.addEventListener(DATA_UPDATED_EVENT, loadPapers);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadPapers);
  }, [loadPapers]);

  if (papers.length === 0) return null;

  const handleSharePaper = async (paper: Newspaper) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/epaper?id=${encodeURIComponent(paper.id)}`;
    const outcome = await shareContentViaWebShare({
      title: paper.title,
      text: `${paper.title} · ${formatDate(paper.date, { dateStyle: 'medium' })} — AMRIT PRASARAN`,
      url: shareUrl,
    });
    if (outcome === 'shared' || outcome === 'copied') {
      setSharedId(paper.id);
      setTimeout(() => setSharedId(prev => (prev === paper.id ? null : prev)), 2000);
    }
  };

  return (
    <section className="py-6 sm:py-10 px-4 sm:px-6 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t('todaysEPaper')}</h2>
        <Link to="/epaper" className="text-sm text-red-700 font-semibold hover:underline whitespace-nowrap">
          {t('viewArchive')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {papers.map(p => (
          <div
            key={p.id}
            className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl flex flex-col justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div
                aria-hidden="true"
                className="w-14 sm:w-16 aspect-[3/4] shrink-0 rounded-md border border-slate-200 bg-slate-50 p-1.5 flex flex-col justify-between overflow-hidden"
              >
                <div className="border-b-2 border-red-700 pb-0.5 text-[7px] font-extrabold tracking-tight text-red-700 leading-none truncate">
                  AMRIT
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-800 rounded-xs" />
                  <div className="h-1 w-4/5 bg-slate-300 rounded-xs" />
                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    <div className="h-4 bg-slate-200 rounded-xs" />
                    <div className="space-y-0.5">
                      <div className="h-1 bg-slate-300 rounded-xs" />
                      <div className="h-1 bg-slate-300 rounded-xs" />
                      <div className="h-1 bg-slate-300 rounded-xs" />
                    </div>
                  </div>
                </div>
                <div className="text-[7px] font-semibold text-slate-500 tabular-nums truncate">
                  {p.pageCount ? `${formatNumber(p.pageCount)}p` : 'PDF'}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">
                    {formatDate(p.date)}
                  </span>
                  {p.pageCount && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-semibold text-red-700 tabular-nums">
                        {formatNumber(p.pageCount)} {t('pagesLabel')}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">{p.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePaper(p)}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 bg-red-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-800 transition-colors whitespace-nowrap"
              >
                <Maximize2 className="w-4 h-4 shrink-0" />
                {t('readFullScreen')}
              </button>
              <button
                type="button"
                onClick={() => void downloadEditionPdf(p)}
                aria-label={`${t('downloadPdf')} — ${p.title}`}
                className="min-w-[42px] min-h-[42px] flex items-center justify-center border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleSharePaper(p)}
                aria-label={`${t('shareEPaperLabel')} — ${p.title}`}
                className="min-w-[42px] min-h-[42px] flex items-center justify-center border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                {sharedId === p.id ? (
                  <Check className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {activePaper && (
        <EPaperFullscreenReader
          paper={activePaper}
          onClose={() => setActivePaper(null)}
        />
      )}
    </section>
  );
}
