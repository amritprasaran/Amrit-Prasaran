import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNewspapers, saveNewspapers, logAdminActivity } from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { Newspaper } from '../../types';
import {
  savePdfFileToStorage,
  deletePdfFileFromStorage,
  formatFileSize,
} from '../../utils/epaperStorage';
import { inspectPdfBlob } from '../../utils/pdfDocument';
import { triggerEPaperPushNotification } from '../../utils/notifications';

export default function EPaperManagement() {
  const [papers, setPapers] = useState<Newspaper[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pdfUrl, setPdfUrl] = useState('/assets/aistudio/Amrat_prasaran_01_nov_2026_4574cb9e.pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedPages, setDetectedPages] = useState<number | undefined>(undefined);
  const [detectedSize, setDetectedSize] = useState<number | undefined>(undefined);
  const [sendPushAlert, setSendPushAlert] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPapers = useCallback(() => {
    setPapers(getNewspapers().sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useEffect(() => {
    loadPapers();
    window.addEventListener(DATA_UPDATED_EVENT, loadPapers);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadPapers);
  }, [loadPapers]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setPdfUrl('/assets/aistudio/Amrat_prasaran_01_nov_2026_4574cb9e.pdf');
    setSelectedFile(null);
    setDetectedPages(undefined);
    setDetectedSize(undefined);
    setErrorMsg(null);
  };

  const processPickedFile = async (file: File) => {
    setErrorMsg(null);
    const isPdfMime = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfMime) {
      setErrorMsg('Please select a valid PDF (.pdf) newspaper file.');
      return;
    }

    try {
      const { numPages } = await inspectPdfBlob(file);
      setSelectedFile(file);
      setDetectedPages(numPages);
      setDetectedSize(file.size);
      if (!title.trim()) {
        setTitle(`अमृत प्रसारण - ${file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ')}`);
      }
    } catch {
      setErrorMsg('Unable to parse this PDF file. Please verify the file is not corrupted.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processPickedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processPickedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const targetId = editingId || Date.now().toString();
      let finalPdfUrl = pdfUrl.trim() || '/assets/aistudio/Amrat_prasaran_01_nov_2026_4574cb9e.pdf';

      if (selectedFile) {
        finalPdfUrl = await savePdfFileToStorage(targetId, selectedFile);
      }

      let updated: Newspaper[];
      if (editingId) {
        updated = papers.map(p =>
          p.id === editingId
            ? {
                ...p,
                title: title.trim(),
                date,
                pdfUrl: finalPdfUrl,
                pageCount: detectedPages ?? p.pageCount,
                fileSize: detectedSize ?? p.fileSize,
              }
            : p
        );
        logAdminActivity(`Updated E-Paper: ${title.trim()}`);
      } else {
        const created: Newspaper = {
          id: targetId,
          title: title.trim(),
          date,
          pdfUrl: finalPdfUrl,
          pageCount: detectedPages,
          fileSize: detectedSize,
        };
        updated = [created, ...papers];
        logAdminActivity(`Uploaded E-Paper: ${title.trim()}`);
        if (sendPushAlert) {
          triggerEPaperPushNotification(created, { forceBrowser: true });
        }
      }

      updated.sort((a, b) => b.date.localeCompare(a.date));
      saveNewspapers(updated);
      setPapers(updated);
      resetForm();
    } catch {
      setErrorMsg('Failed to store PDF file in browser storage. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = papers.find(p => p.id === id);
    if (target) {
      await deletePdfFileFromStorage(target.pdfUrl);
      logAdminActivity(`Deleted E-Paper: ${target.title}`);
    }
    const updated = papers.filter(p => p.id !== id);
    saveNewspapers(updated);
    setPapers(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">E-Paper &amp; PDF Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload multi-page newspaper PDF broadsheets directly from your computer or phone. Files are saved persistently for full-screen reading.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 space-y-4"
      >
        <h2 className="font-bold text-slate-900">
          {editingId ? 'Edit E-Paper Edition' : 'Upload New E-Paper Edition'}
        </h2>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <label
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 sm:p-6 cursor-pointer transition-colors text-center ${
            isDragging
              ? 'border-red-600 bg-red-50'
              : 'border-slate-300 bg-slate-50 hover:border-red-400 hover:bg-red-50/40'
          }`}
        >
          <Upload className="w-7 h-7 text-red-700 mb-2" />
          <span className="text-sm font-semibold text-slate-800">
            {selectedFile ? selectedFile.name : 'Click to select or drag & drop Newspaper PDF'}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            {selectedFile && detectedPages
              ? `${detectedPages} Pages · ${formatFileSize(detectedSize)} ready to publish`
              : 'Supports large multi-page broadsheet PDFs (.pdf)'}
          </span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Edition Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. अमृत प्रसारण - 01 Nov 2026"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Publication Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Or Enter Hosted PDF URL (used if no file uploaded above)
          </label>
          <input
            type="text"
            value={pdfUrl}
            onChange={e => setPdfUrl(e.target.value)}
            placeholder="/assets/aistudio/..."
            className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
          />
        </div>

        {!editingId && (
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sendPushAlert}
              onChange={e => setSendPushAlert(e.target.checked)}
              className="rounded border-slate-300"
            />
            Send push notification to subscribers when published
          </label>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            {isSaving ? 'Saving PDF...' : editingId ? 'Save Changes' : 'Publish E-Paper'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Date</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Title</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Details</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {papers.map(paper => (
              <tr key={paper.id} className="border-b border-slate-100 last:border-0">
                <td className="p-3 sm:p-4 text-slate-600 tabular-nums whitespace-nowrap">
                  {paper.date}
                </td>
                <td className="p-3 sm:p-4 font-medium text-slate-900">{paper.title}</td>
                <td className="p-3 sm:p-4 text-xs text-slate-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-red-700" />
                    {paper.pageCount ? `${paper.pageCount} Pages` : 'PDF'}
                    {paper.fileSize ? ` · ${formatFileSize(paper.fileSize)}` : ''}
                  </span>
                </td>
                <td className="p-3 sm:p-4 whitespace-nowrap">
                  <Link
                    to={`/epaper?id=${paper.id}&fullscreen=1`}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:underline mr-3 font-medium"
                  >
                    <span>Read</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(paper.id);
                      setTitle(paper.title);
                      setDate(paper.date);
                      setPdfUrl(paper.pdfUrl);
                      setSelectedFile(null);
                      setDetectedPages(paper.pageCount);
                      setDetectedSize(paper.fileSize);
                    }}
                    className="text-blue-600 hover:underline mr-3 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(paper.id)}
                    className="text-red-600 hover:underline font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
