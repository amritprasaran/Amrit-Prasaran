import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Layers,
  RotateCcw,
  Scissors,
  Share2,
  MessageCircle,
  Search,
  Loader2,
  Check,
} from 'lucide-react';
import { Newspaper } from '../types';
import { downloadEditionPdf } from '../utils/pdfDownload';
import { searchPdfText, PdfSearchMatch } from '../utils/pdfDocument';
import { shareContentViaWebShare } from '../utils/webShare';
import PdfPageCanvas from './PdfPageCanvas';
import { useLanguage } from '../context/LanguageContext';

interface EPaperFullscreenReaderProps {
  paper: Newspaper;
  initialPage?: number;
  onClose: () => void;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_ZOOM = 60;
const MAX_ZOOM = 250;

function getTouchDistance(t1: Touch, t2: Touch): number {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

function getTouchMidpoint(t1: Touch, t2: Touch) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

export default function EPaperFullscreenReader({
  paper,
  initialPage = 1,
  onClose,
}: EPaperFullscreenReaderProps) {
  const { t, formatDate, formatNumber } = useLanguage();
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [numPages, setNumPages] = useState(paper.pageCount || 1);
  const [zoom, setZoom] = useState(100);
  const [showPagesDrawer, setShowPagesDrawer] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle');

  // Fluid live touch-gesture visual state
  const [livePinchScale, setLivePinchScale] = useState(1);
  const [pinchOrigin, setPinchOrigin] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);

  // Clip & Share state
  const [isClipMode, setIsClipMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [clipPreviewUrl, setClipPreviewUrl] = useState<string | null>(null);
  const [clipBlob, setClipBlob] = useState<Blob | null>(null);

  // Full-text search inside PDF state
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [pdfQuery, setPdfQuery] = useState('');
  const [pdfMatches, setPdfMatches] = useState<PdfSearchMatch[]>([]);
  const [isSearchingPdf, setIsSearchingPdf] = useState(false);
  const [hasSearchedPdf, setHasSearchedPdf] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const pageStageRef = useRef<HTMLDivElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);

  // Touch gesture refs kept fresh for native listeners
  const zoomRef = useRef(zoom);
  const pageRef = useRef(pageNumber);
  const numPagesRef = useRef(numPages);
  const isClipModeRef = useRef(isClipMode);
  zoomRef.current = zoom;
  pageRef.current = pageNumber;
  numPagesRef.current = numPages;
  isClipModeRef.current = isClipMode;

  const pinchStateRef = useRef<{
    startDist: number;
    startZoom: number;
    scale: number;
  } | null>(null);

  const swipeStateRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    lockedAxis: 'horizontal' | 'vertical' | null;
    lastDx: number;
  } | null>(null);

  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  useEffect(() => {
    setPageNumber(initialPage);
    setNumPages(paper.pageCount || 1);
    setPdfQuery('');
    setPdfMatches([]);
    setHasSearchedPdf(false);
  }, [paper.id, paper.pageCount, initialPage]);

  const handleRunPdfSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfQuery.trim()) {
      setPdfMatches([]);
      setHasSearchedPdf(false);
      return;
    }
    setIsSearchingPdf(true);
    try {
      const matches = await searchPdfText(paper.pdfUrl, pdfQuery);
      setPdfMatches(matches);
      setHasSearchedPdf(true);
      if (matches.length > 0) {
        setPageNumber(matches[0].pageNumber);
      }
    } finally {
      setIsSearchingPdf(false);
    }
  };

  // Reset vertical scroll position cleanly when switching pages
  useEffect(() => {
    scrollViewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageNumber]);

  const handleNumPages = useCallback((count: number) => {
    setNumPages(count);
    setPageNumber(prev => Math.max(1, Math.min(prev, count)));
  }, []);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    activeCanvasRef.current = canvas;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (clipPreviewUrl) {
          setClipPreviewUrl(null);
          setClipBlob(null);
        } else if (isClipMode) {
          setIsClipMode(false);
          setCropRect(null);
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && !isClipMode) {
        setPageNumber(prev => Math.min(numPages, prev + 1));
      } else if (e.key === 'ArrowLeft' && !isClipMode) {
        setPageNumber(prev => Math.max(1, prev - 1));
      }
    };

    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [onClose, numPages, clipPreviewUrl, isClipMode]);

  // Native non-passive touch listeners for fluid 60fps pinch-to-zoom, double-tap, & swipe navigation
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isClipModeRef.current) return;

      if (e.touches.length === 2) {
        swipeStateRef.current = null;
        setSwipeOffsetX(0);

        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        const mid = getTouchMidpoint(e.touches[0], e.touches[1]);
        const stageRect = pageStageRef.current?.getBoundingClientRect();

        if (stageRect) {
          setPinchOrigin({
            x: mid.x - stageRect.left,
            y: mid.y - stageRect.top,
          });
        }

        pinchStateRef.current = {
          startDist: Math.max(dist, 10),
          startZoom: zoomRef.current,
          scale: 1,
        };
      } else if (e.touches.length === 1 && !pinchStateRef.current) {
        swipeStateRef.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startTime: Date.now(),
          lockedAxis: null,
          lastDx: 0,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isClipModeRef.current) return;

      // Two-finger smooth CSS scale transform during active pinch
      if (e.touches.length === 2 && pinchStateRef.current) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        const rawScale = dist / pinchStateRef.current.startDist;
        const targetZoom = pinchStateRef.current.startZoom * rawScale;
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
        const clampedScale = clampedZoom / pinchStateRef.current.startZoom;

        pinchStateRef.current.scale = clampedScale;
        setLivePinchScale(clampedScale);
        return;
      }

      // Single-finger horizontal swipe page turn when fitted (zoom <= 105%)
      if (
        e.touches.length === 1 &&
        swipeStateRef.current &&
        zoomRef.current <= 105
      ) {
        const swipe = swipeStateRef.current;
        const dx = e.touches[0].clientX - swipe.startX;
        const dy = e.touches[0].clientY - swipe.startY;

        if (!swipe.lockedAxis && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
          swipe.lockedAxis =
            Math.abs(dx) > Math.abs(dy) * 1.15 ? 'horizontal' : 'vertical';
        }

        if (swipe.lockedAxis === 'horizontal') {
          e.preventDefault();
          const atLeftEdge = pageRef.current <= 1 && dx > 0;
          const atRightEdge = pageRef.current >= numPagesRef.current && dx < 0;
          const resistedDx = atLeftEdge || atRightEdge ? dx * 0.25 : dx;
          swipe.lastDx = dx;
          setSwipeOffsetX(resistedDx);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isClipModeRef.current) return;

      // Commit final zoom cleanly once pinch fingers lift
      if (pinchStateRef.current && e.touches.length < 2) {
        const finalZoom = Math.round(
          Math.max(
            MIN_ZOOM,
            Math.min(
              MAX_ZOOM,
              pinchStateRef.current.startZoom * pinchStateRef.current.scale
            )
          )
        );
        pinchStateRef.current = null;
        setLivePinchScale(1);
        setPinchOrigin(null);
        setZoom(finalZoom);
        return;
      }

      // Check swipe page flip vs double-tap zoom
      if (swipeStateRef.current && e.changedTouches.length === 1) {
        const swipe = swipeStateRef.current;
        const elapsed = Date.now() - swipe.startTime;
        const endTouch = e.changedTouches[0];
        const dx = endTouch.clientX - swipe.startX;
        const dy = endTouch.clientY - swipe.startY;

        if (swipe.lockedAxis === 'horizontal' && zoomRef.current <= 105) {
          const isQuickFlick = elapsed < 280 && Math.abs(dx) > 35;
          const isFullSwipe = Math.abs(dx) > 60;

          if (isQuickFlick || isFullSwipe) {
            if (dx < 0 && pageRef.current < numPagesRef.current) {
              setPageNumber(p => Math.min(numPagesRef.current, p + 1));
            } else if (dx > 0 && pageRef.current > 1) {
              setPageNumber(p => Math.max(1, p - 1));
            }
          }
        } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && elapsed < 260) {
          // Double-tap toggles quick zoom (100% <-> 180%)
          const now = Date.now();
          if (
            lastTapRef.current &&
            now - lastTapRef.current.time < 300 &&
            Math.hypot(
              endTouch.clientX - lastTapRef.current.x,
              endTouch.clientY - lastTapRef.current.y
            ) < 40
          ) {
            lastTapRef.current = null;
            setZoom(prev => (prev > 115 ? 100 : 180));
          } else {
            lastTapRef.current = {
              time: now,
              x: endTouch.clientX,
              y: endTouch.clientY,
            };
          }
        }

        swipeStateRef.current = null;
        setSwipeOffsetX(0);
      }
    };

    const onTouchCancel = () => {
      pinchStateRef.current = null;
      swipeStateRef.current = null;
      setLivePinchScale(1);
      setPinchOrigin(null);
      setSwipeOffsetX(0);
    };

    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    viewport.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore iframe restriction
    }
  };

  // Clip & Crop pointer handlers directly mapped over active PDF canvas
  const getRelativePoint = (clientX: number, clientY: number) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return { x, y, rect };
  };

  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isClipMode) return;
    const pt = getRelativePoint(e.clientX, e.clientY);
    if (!pt) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    cropStartRef.current = { x: pt.x, y: pt.y };
    setCropRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isClipMode || !cropStartRef.current) return;
    const pt = getRelativePoint(e.clientX, e.clientY);
    if (!pt) return;
    const start = cropStartRef.current;
    setCropRect({
      x: Math.min(start.x, pt.x),
      y: Math.min(start.y, pt.y),
      w: Math.abs(pt.x - start.x),
      h: Math.abs(pt.y - start.y),
    });
  };

  const generateClipFromSelection = (rect: CropRect) => {
    const srcCanvas = activeCanvasRef.current;
    if (!srcCanvas || rect.w < 20 || rect.h < 20) return;

    const displayRect = srcCanvas.getBoundingClientRect();
    const scaleX = srcCanvas.width / displayRect.width;
    const scaleY = srcCanvas.height / displayRect.height;

    const sx = Math.floor(rect.x * scaleX);
    const sy = Math.floor(rect.y * scaleY);
    const sw = Math.max(1, Math.floor(rect.w * scaleX));
    const sh = Math.max(1, Math.floor(rect.h * scaleY));

    const footerHeight = 44;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = Math.max(sw, 360);
    outCanvas.height = sh + footerHeight;

    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

    const drawX = Math.floor((outCanvas.width - sw) / 2);
    ctx.drawImage(srcCanvas, sx, sy, sw, sh, drawX, 0, sw, sh);

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, sh, outCanvas.width, footerHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textBaseline = 'middle';
    const label = `AMRIT PRASARAN · ${paper.date} · Page ${pageNumber}`;
    ctx.fillText(label, 14, sh + footerHeight / 2);

    outCanvas.toBlob(blob => {
      if (!blob) return;
      const previewUrl = URL.createObjectURL(blob);
      setClipBlob(blob);
      setClipPreviewUrl(previewUrl);
      setCropRect(null);
      setIsClipMode(false);
    }, 'image/png');
  };

  const handleCropPointerUp = () => {
    if (!isClipMode || !cropStartRef.current) return;
    cropStartRef.current = null;
    if (cropRect && cropRect.w >= 24 && cropRect.h >= 24) {
      generateClipFromSelection(cropRect);
    } else {
      setCropRect(null);
    }
  };

  const handleDownloadClip = () => {
    if (!clipPreviewUrl) return;
    const a = document.createElement('a');
    a.href = clipPreviewUrl;
    a.download = `amrit-prasaran-${paper.date}-p${pageNumber}-clip.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareClip = async () => {
    if (!clipBlob) return;
    const file = new File([clipBlob], `amrit-prasaran-${paper.date}-p${pageNumber}.png`, {
      type: 'image/png',
    });

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          title: `${paper.title} (${t('pageLabel')} ${pageNumber})`,
          text: `${paper.title} (${formatDate(paper.date, { dateStyle: 'medium' })})`,
          files: [file],
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    handleDownloadClip();
  };

  const handleShareEditionLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/epaper?id=${encodeURIComponent(paper.id)}&page=${pageNumber}`;
    const outcome = await shareContentViaWebShare({
      title: `${paper.title} (${t('pageLabel')} ${pageNumber})`,
      text: `${paper.title} · ${formatDate(paper.date, { dateStyle: 'medium' })} (${t('pageLabel')} ${pageNumber}) — AMRIT PRASARAN`,
      url: shareUrl,
    });
    if (outcome === 'shared' || outcome === 'copied') {
      setShareStatus(outcome);
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  const whatsappClipUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${paper.title} (${t('pageLabel')} ${pageNumber}) — ${t('clipShareTextPrefix')} ${
      typeof window !== 'undefined' ? window.location.origin : ''
    }/epaper?id=${paper.id}&page=${pageNumber}`
  )}`;

  const displayedZoom = Math.round(zoom * livePinchScale);
  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Full screen reader for ${paper.title}`}
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none"
    >
      {/* Top Reader Toolbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-red-400 font-semibold">
            <span>AMRIT PRASARAN {t('epaper')}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-slate-300">
              {formatDate(paper.date, { dateStyle: 'medium' })}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white truncate">
            {paper.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Page Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              aria-label={t('previousPage')}
              className="p-2 text-slate-200 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-medium tabular-nums whitespace-nowrap">
              {t('pageLabel')} {formatNumber(pageNumber)} / {formatNumber(numPages)}
            </span>
            <button
              type="button"
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              aria-label={t('nextPage')}
              className="p-2 text-slate-200 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 20))}
              aria-label={t('zoomOut')}
              className="p-2 text-slate-200 hover:text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-1.5 text-xs font-medium tabular-nums w-11 text-center">
              {formatNumber(displayedZoom)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 20))}
              aria-label={t('zoomIn')}
              className="p-2 text-slate-200 hover:text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom !== 100 && (
              <button
                type="button"
                onClick={() => setZoom(100)}
                aria-label={t('resetZoom')}
                className="p-2 text-slate-300 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Inside Paper */}
          <button
            type="button"
            onClick={() => setShowSearchBar(s => !s)}
            aria-pressed={showSearchBar}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              showSearchBar
                ? 'bg-red-700 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">{t('searchBtn')}</span>
          </button>

          {/* Clip & Share Article Tool */}
          <button
            type="button"
            onClick={() => {
              setIsClipMode(m => !m);
              setCropRect(null);
            }}
            aria-pressed={isClipMode}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              isClipMode
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span className="hidden sm:inline">{isClipMode ? t('cancelClip') : t('clipAndShare')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPagesDrawer(s => !s)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              showPagesDrawer
                ? 'bg-red-700 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">{t('allPages')}</span>
          </button>

          <button
            type="button"
            onClick={() => downloadEditionPdf(paper)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('downloadPdf')}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleShareEditionLink()}
            aria-label={t('shareEPaperLabel')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap"
          >
            {shareStatus === 'idle' ? (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('shareBtn')}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">
                  {shareStatus === 'copied' ? t('copiedLink') : t('sharedBtn')}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleNativeFullscreen}
            aria-label={isBrowserFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
            className="hidden md:inline-flex p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            {isBrowserFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeReader')}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold"
          >
            <X className="w-4 h-4" />
            <span>{t('closeText')}</span>
          </button>
        </div>
      </header>

      {showSearchBar && (
        <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-3 shrink-0 space-y-2.5">
          <form onSubmit={e => void handleRunPdfSearch(e)} className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={pdfQuery}
                onChange={e => setPdfQuery(e.target.value)}
                placeholder={t('searchAcrossPages')}
                aria-label={t('searchAcrossPages')}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-400 outline-none focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingPdf || !pdfQuery.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-semibold"
            >
              {isSearchingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('searchingText')}</span>
                </>
              ) : (
                <span>{t('findBtn')}</span>
              )}
            </button>
            {hasSearchedPdf && (
              <button
                type="button"
                onClick={() => {
                  setPdfQuery('');
                  setPdfMatches([]);
                  setHasSearchedPdf(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                {t('clearText')}
              </button>
            )}
          </form>

          {hasSearchedPdf && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 max-h-32 overflow-y-auto">
              {pdfMatches.length === 0 ? (
                <p className="text-xs text-slate-400">
                  {t('noPdfMatches')}
                </p>
              ) : (
                pdfMatches.map(match => (
                  <button
                    key={match.pageNumber}
                    type="button"
                    onClick={() => setPageNumber(match.pageNumber)}
                    className={`text-left px-3 py-1.5 rounded-lg border text-xs transition-colors max-w-md ${
                      pageNumber === match.pageNumber
                        ? 'bg-red-900/50 border-red-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-bold text-red-400 mr-1.5">
                      {t('pageLabel')} {match.pageNumber}:
                    </span>
                    <span className="text-slate-300 line-clamp-1 inline">{match.snippet}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {isClipMode && (
        <div className="bg-amber-500 text-slate-950 text-xs sm:text-sm font-semibold px-4 py-2 text-center shrink-0">
          {t('clipBanner')}
        </div>
      )}

      {/* Main Reader Viewport */}
      <div
        ref={scrollViewportRef}
        className="relative flex-1 overflow-auto p-2 sm:p-6 flex flex-col lg:flex-row gap-6 items-start touch-pan-x touch-pan-y"
      >
        {/* Live swipe navigation feedback pills */}
        {Math.abs(swipeOffsetX) > 22 && (
          <div
            aria-hidden="true"
            className={`fixed top-1/2 -translate-y-1/2 z-30 px-3.5 py-2 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-semibold text-white shadow-lg flex items-center gap-1.5 pointer-events-none ${
              swipeOffsetX > 0 ? 'left-4' : 'right-4'
            }`}
          >
            {swipeOffsetX > 0 ? (
              pageNumber > 1 ? (
                <>
                  <ChevronLeft className="w-4 h-4 text-red-400" />
                  <span>{t('pageLabel')} {pageNumber - 1}</span>
                </>
              ) : (
                <span className="text-slate-400">{t('firstPage')}</span>
              )
            ) : pageNumber < numPages ? (
              <>
                <span>{t('pageLabel')} {pageNumber + 1}</span>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </>
            ) : (
              <span className="text-slate-400">{t('lastPage')}</span>
            )}
          </div>
        )}

        {showPagesDrawer && (
          <aside className="w-full lg:w-64 bg-slate-900 border border-slate-800 rounded-xl p-4 shrink-0">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
              {t('editionPages')} ({numPages})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
              {pageNumbers.map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPageNumber(num)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageNumber === num
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t('pageLabel')} {num}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="flex-1 w-full overflow-x-auto">
          <div className="w-fit min-w-full flex justify-center">
            <div
              ref={pageStageRef}
              style={{
                transform:
                  livePinchScale !== 1
                    ? `scale(${livePinchScale})`
                    : swipeOffsetX !== 0
                      ? `translateX(${swipeOffsetX * 0.35}px)`
                      : undefined,
                transformOrigin: pinchOrigin
                  ? `${pinchOrigin.x}px ${pinchOrigin.y}px`
                  : 'center center',
                transition:
                  livePinchScale === 1 && swipeOffsetX === 0
                    ? 'transform 160ms ease-out'
                    : undefined,
              }}
              className="relative inline-block will-change-transform"
            >
              <div className="w-full max-w-[1000px]">
                <PdfPageCanvas
                  pdfUrl={paper.pdfUrl}
                  pageNumber={pageNumber}
                  zoom={zoom}
                  maxWidth={1000}
                  onNumPages={handleNumPages}
                  onCanvasReady={handleCanvasReady}
                />
              </div>

              {isClipMode && (
                <div
                  onPointerDown={handleCropPointerDown}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerUp}
                  className="absolute inset-0 z-20 cursor-crosshair touch-none bg-slate-950/25"
                >
                  {cropRect && cropRect.w > 2 && cropRect.h > 2 && (
                    <div
                      style={{
                        left: `${cropRect.x}px`,
                        top: `${cropRect.y}px`,
                        width: `${cropRect.w}px`,
                        height: `${cropRect.h}px`,
                      }}
                      className="absolute border-2 border-dashed border-amber-400 bg-white/10 shadow-lg pointer-events-none"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Page Strip */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 overflow-x-auto shrink-0">
        <span className="text-[11px] sm:text-xs text-slate-400 whitespace-nowrap">
          {t('readerHint')}
        </span>
        <div className="flex items-center gap-2">
          {pageNumbers.map(num => (
            <button
              key={num}
              type="button"
              onClick={() => setPageNumber(num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                num === pageNumber
                  ? 'bg-red-700 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t('pageLabel')} {num}
            </button>
          ))}
        </div>
      </footer>

      {/* Clip Preview & Share Modal */}
      {clipPreviewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] bg-black/75 flex items-center justify-center p-4"
          onClick={() => {
            setClipPreviewUrl(null);
            setClipBlob(null);
          }}
        >
          <div
            className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">{t('newsCuttingReady')}</h3>
              <button
                type="button"
                onClick={() => {
                  setClipPreviewUrl(null);
                  setClipBlob(null);
                }}
                aria-label="Close clipping preview"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-2 flex justify-center">
              <img
                src={clipPreviewUrl}
                alt="Newspaper clipping preview"
                className="max-w-full h-auto rounded shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadClip}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>{t('downloadPng')}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleShareClip()}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                <span>{t('shareImage')}</span>
              </button>
              <a
                href={whatsappClipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
