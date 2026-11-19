import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, RotateCcw, Trash2, MessageSquare } from 'lucide-react';
import {
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
  logAdminActivity,
} from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { ContactInquiry } from '../../types';

export default function InquiriesManagement() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'resolved'>('all');

  const loadAll = useCallback(() => {
    setInquiries(getInquiries());
  }, []);

  useEffect(() => {
    loadAll();
    window.addEventListener(DATA_UPDATED_EVENT, loadAll);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadAll);
  }, [loadAll]);

  const handleToggleStatus = (item: ContactInquiry) => {
    const nextStatus = item.status === 'new' ? 'resolved' : 'new';
    updateInquiryStatus(item.id, nextStatus);
    setInquiries(prev =>
      prev.map(i => (i.id === item.id ? { ...i, status: nextStatus } : i))
    );
    logAdminActivity(
      nextStatus === 'resolved'
        ? `Resolved inquiry from ${item.name}`
        : `Reopened inquiry from ${item.name}`
    );
  };

  const handleDelete = (item: ContactInquiry) => {
    deleteInquiry(item.id);
    setInquiries(prev => prev.filter(i => i.id !== item.id));
    logAdminActivity(`Deleted inquiry from ${item.name}`);
  };

  const filtered = inquiries.filter(item =>
    filter === 'all' ? true : item.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Contact &amp; Ad Inquiries</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review reader corrections, editorial feedback, and local J&amp;K advertisement requests.
          </p>
        </div>

        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1">
          {(['all', 'new', 'resolved'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                filter === status
                  ? 'bg-red-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            No {filter === 'all' ? '' : `${filter} `}inquiries found.
          </div>
        ) : (
          filtered.map(item => (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <MessageSquare className="w-4 h-4 text-red-700" />
                      {item.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                      {item.subject}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                        item.status === 'new'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Contact: <strong className="text-slate-700">{item.contact}</strong> ·{' '}
                    {new Date(item.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      item.status === 'new'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.status === 'new' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label={`Delete inquiry from ${item.name}`}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 border border-slate-100 rounded-lg p-3.5">
                {item.message}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
