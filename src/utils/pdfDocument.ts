import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getPdfArrayBuffer } from './epaperStorage';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export type PDFDocumentProxy = pdfjsLib.PDFDocumentProxy;

export interface PdfSearchMatch {
  pageNumber: number;
  matchCount: number;
  snippet: string;
}

const documentCache = new Map<string, Promise<PDFDocumentProxy>>();
const pageTextCache = new Map<string, string[]>();

export function loadPdfDocument(pdfUrl: string): Promise<PDFDocumentProxy> {
  const cached = documentCache.get(pdfUrl);
  if (cached) return cached;

  const loadPromise = (async () => {
    const buffer = await getPdfArrayBuffer(pdfUrl);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    return loadingTask.promise;
  })();

  loadPromise.catch(() => {
    documentCache.delete(pdfUrl);
  });

  documentCache.set(pdfUrl, loadPromise);
  return loadPromise;
}

export async function inspectPdfBlob(file: Blob): Promise<{ numPages: number }> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  await loadingTask.destroy();
  return { numPages };
}

export async function searchPdfText(
  pdfUrl: string,
  rawQuery: string
): Promise<PdfSearchMatch[]> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  let pages = pageTextCache.get(pdfUrl);
  if (!pages) {
    const doc = await loadPdfDocument(pdfUrl);
    const extracted: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const joined = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      extracted.push(joined);
    }
    pages = extracted;
    pageTextCache.set(pdfUrl, extracted);
  }

  const results: PdfSearchMatch[] = [];
  pages.forEach((text, idx) => {
    if (!text) return;
    const lower = text.toLowerCase();
    const firstIdx = lower.indexOf(query);
    if (firstIdx === -1) return;

    let count = 0;
    let searchPos = 0;
    while (true) {
      const found = lower.indexOf(query, searchPos);
      if (found === -1) break;
      count += 1;
      searchPos = found + query.length;
    }

    const start = Math.max(0, firstIdx - 42);
    const end = Math.min(text.length, firstIdx + query.length + 78);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    const snippet = `${prefix}${text.slice(start, end)}${suffix}`;

    results.push({
      pageNumber: idx + 1,
      matchCount: count,
      snippet,
    });
  });

  return results;
}
