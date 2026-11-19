import { useState, useEffect, useCallback } from 'react';
import { Download, Mail, Trash2 } from 'lucide-react';
import { getSubscribers, deleteSubscriber, logAdminActivity } from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { Subscriber } from '../../types';

export default function SubscribersManagement() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const loadAll = useCallback(() => {
    setSubscribers(getSubscribers());
  }, []);

  useEffect(() => {
    loadAll();
    window.addEventListener(DATA_UPDATED_EVENT, loadAll);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadAll);
  }, [loadAll]);

  const handleExportCsv = () => {
    if (subscribers.length === 0) return;
    const rows = [
      ['Email', 'Subscribed At', 'Source'],
      ...subscribers.map(s => [
        `"${s.email.replace(/"/g, '""')}"`,
        `"${s.subscribedAt}"`,
        `"${(s.source || 'footer').replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amrit-prasaran-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logAdminActivity(`Exported ${subscribers.length} newsletter subscribers to CSV`);
  };

  const handleRemove = (sub: Subscriber) => {
    deleteSubscriber(sub.id);
    setSubscribers(prev => prev.filter(s => s.id !== sub.id));
    logAdminActivity(`Removed subscriber: ${sub.email}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Newsletter Subscribers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reader emails collected from the footer signup box ({subscribers.length} total).
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={subscribers.length === 0}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        {subscribers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No newsletter subscribers yet. Reader signups will appear here in real time.
          </div>
        ) : (
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Email Address</th>
                <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Source</th>
                <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Joined</th>
                <th className="p-3 sm:p-4 text-right font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(sub => (
                <tr key={sub.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 sm:p-4 font-medium text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="w-4 h-4 text-red-700 shrink-0" />
                      {sub.email}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600 capitalize">
                    {sub.source || 'footer'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-500 tabular-nums">
                    {new Date(sub.subscribedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-3 sm:p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(sub)}
                      aria-label={`Delete ${sub.email}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-2.5 py-1 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
