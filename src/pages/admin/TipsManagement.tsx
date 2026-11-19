import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  FilePlus2,
  Trash2,
  MapPin,
  Phone,
  User,
  Inbox,
} from 'lucide-react';
import {
  getNewsTips,
  updateNewsTipStatus,
  deleteNewsTip,
  logAdminActivity,
} from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { NewsTip } from '../../types';

export default function TipsManagement() {
  const navigate = useNavigate();
  const [tips, setTips] = useState<NewsTip[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'converted'>('all');

  const loadTips = useCallback(() => {
    setTips(getNewsTips());
  }, []);

  useEffect(() => {
    loadTips();
    window.addEventListener(DATA_UPDATED_EVENT, loadTips);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadTips);
  }, [loadTips]);

  const handleMarkReviewed = (tip: NewsTip) => {
    updateNewsTipStatus(tip.id, 'reviewed');
    logAdminActivity(`Marked citizen tip reviewed: ${tip.headline}`);
  };

  const handleConvertToDraft = (tip: NewsTip) => {
    updateNewsTipStatus(tip.id, 'converted');
    logAdminActivity(`Converted citizen tip to draft article: ${tip.headline}`);
    navigate('/admin/news', { state: { fromTip: tip } });
  };

  const handleDelete = (tip: NewsTip) => {
    deleteNewsTip(tip.id);
    logAdminActivity(`Deleted citizen tip: ${tip.headline}`);
  };

  const visibleTips = tips.filter(t => (filter === 'all' ? true : t.status === filter));
  const pendingCount = tips.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Citizen News Tips ({pendingCount} Pending)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Private newsroom queue of tips submitted via Send Us News. Review reporter contact details or convert directly into a draft article.
          </p>
        </div>

        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1">
          {(['all', 'pending', 'reviewed', 'converted'] as const).map(statusKey => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setFilter(statusKey)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                filter === statusKey
                  ? 'bg-red-700 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {statusKey}
            </button>
          ))}
        </div>
      </div>

      {visibleTips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 space-y-2">
          <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-medium">No citizen news tips in this view right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleTips.map(tip => (
            <div
              key={tip.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row gap-5"
            >
              {tip.photoDataUrl && (
                <img
                  src={tip.photoDataUrl}
                  alt={tip.headline}
                  className="w-full lg:w-56 h-40 object-cover rounded-lg border border-slate-200 shrink-0"
                />
              )}

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded font-semibold uppercase ${
                        tip.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : tip.status === 'converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tip.status}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                      <MapPin className="w-3.5 h-3.5" />
                      {tip.district}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {new Date(tip.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-slate-900">{tip.headline}</h2>
                <p className="text-sm text-slate-700 whitespace-pre-line">{tip.details}</p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {tip.reporterName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {tip.contact}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleConvertToDraft(tip)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold transition-colors"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    Convert to Draft Article
                  </button>
                  {tip.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleMarkReviewed(tip)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Reviewed
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(tip)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
