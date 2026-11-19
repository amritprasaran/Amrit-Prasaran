import { useEffect, useRef, useState } from 'react';
import { Loader2, FileWarning } from 'lucide-react';
import { loadPdfDocument, PDFDocumentProxy } from '../utils/pdfDocument';
import { useLanguage } from '../context/LanguageContext';

interface PdfPageCanvasProps {
  pdfUrl: string;
  pageNumber: number;
  zoom?: number;
  maxWidth?: number;
  onNumPages?: (numPages: number) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  className?: string;
}

type PdfCanvasError = { key: string; detail?: string } | null;

export default function PdfPageCanvas({
  pdfUrl,
  pageNumber,
  zoom = 100,
  maxWidth,
  onNumPages,
  onCanvasReady,
  className = '',
}: PdfPageCanvasProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<PdfCanvasError>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setPdfDoc(null);

    loadPdfDocument(pdfUrl)
      .then(doc => {
        if (!active) return;
        setPdfDoc(doc);
        onNumPages?.(doc.numPages);
        setIsLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setError({
          key: 'pdfLoadError',
          detail: err instanceof Error && err.message ? err.message : undefined,
        });
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pdfUrl, onNumPages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || containerWidth <= 0) return;

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    const safePage = Math.max(1, Math.min(pageNumber, pdfDoc.numPages));

    setIsRendering(true);

    pdfDoc
      .getPage(safePage)
      .then(page => {
        if (cancelled || !canvasRef.current) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const targetCssWidth = maxWidth
          ? Math.min(containerWidth, maxWidth) * (zoom / 100)
          : containerWidth * (zoom / 100);
        const cssScale = Math.max(0.25, targetCssWidth / baseViewport.width);
        const outputScale = Math.min(window.devicePixelRatio || 1, 2.5);

        const displayViewport = page.getViewport({ scale: cssScale });
        const renderViewport = page.getViewport({ scale: cssScale * outputScale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(displayViewport.width)}px`;
        canvas.style.height = `${Math.floor(displayViewport.height)}px`;

        renderTask = page.render({
          canvasContext: context,
          canvas,
          viewport: renderViewport,
        });

        return renderTask.promise;
      })
      .then(() => {
        if (!cancelled) {
          setIsRendering(false);
          onCanvasReady?.(canvasRef.current);
        }
      })
      .catch(err => {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          setIsRendering(false);
          setError({ key: 'pdfRenderError' });
        }
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNumber, zoom, containerWidth, maxWidth, onCanvasReady]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {isLoading && (
        <div className="max-w-[560px] mx-auto aspect-[3/4] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-red-700" />
          <span className="text-sm font-medium">{t('loadingNewspaper')}</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-600 gap-2 bg-slate-50 rounded-lg border border-slate-200">
          <FileWarning className="w-8 h-8 text-red-600" />
          <p className="text-sm font-semibold text-slate-900">{t('couldNotDisplayPdf')}</p>
          <p className="text-xs text-slate-500 max-w-md">{error.detail || t(error.key)}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="relative flex justify-center">
          <canvas
            ref={canvasRef}
            className="block bg-white shadow-md rounded border border-slate-200"
          />
          {isRendering && (
            <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t('renderingText')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
