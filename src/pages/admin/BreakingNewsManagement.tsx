import { useState, useEffect } from 'react';
import {
  getBreakingNews,
  saveBreakingNews,
  getSiteSettings,
  saveSiteSettings,
  logAdminActivity,
} from '../../services/dataService';
import { BreakingNewsItem } from '../../types';

export default function BreakingNewsManagement() {
  const [items, setItems] = useState<BreakingNewsItem[]>([]);
  const [tickerEnabled, setTickerEnabled] = useState(true);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(getBreakingNews());
    setTickerEnabled(getSiteSettings().tickerEnabled);
  }, []);

  const handleToggleGlobalTicker = () => {
    const nextEnabled = !tickerEnabled;
    const settings = getSiteSettings();
    saveSiteSettings({ ...settings, tickerEnabled: nextEnabled });
    setTickerEnabled(nextEnabled);
    logAdminActivity(nextEnabled ? 'Enabled breaking news ticker' : 'Disabled breaking news ticker');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingId) {
      const updated = items.map(item =>
        item.id === editingId ? { ...item, text: trimmed } : item
      );
      saveBreakingNews(updated);
      setItems(updated);
      logAdminActivity(`Updated breaking alert: ${trimmed}`);
      setEditingId(null);
    } else {
      const created: BreakingNewsItem = {
        id: Date.now().toString(),
        text: trimmed,
        enabled: true,
      };
      const updated = [created, ...items];
      saveBreakingNews(updated);
      setItems(updated);
      logAdminActivity(`Added breaking alert: ${trimmed}`);
    }
    setText('');
  };

  const toggleItemEnabled = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    saveBreakingNews(updated);
    setItems(updated);
    logAdminActivity('Toggled breaking news headline status');
  };

  const handleDelete = (id: string) => {
    const target = items.find(i => i.id === id);
    const updated = items.filter(i => i.id !== id);
    saveBreakingNews(updated);
    setItems(updated);
    if (target) logAdminActivity(`Deleted breaking alert: ${target.text}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Breaking News Ticker</h1>
          <p className="text-sm text-slate-500 mt-1">
            Control the live breaking news ticker banner and manage alert headlines.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleGlobalTicker}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            tickerEnabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }`}
        >
          Ticker Banner: {tickerEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter breaking news alert headline..."
          className="flex-1 min-w-0 p-2.5 text-sm border border-slate-300 rounded-lg"
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            {editingId ? 'Save Alert' : 'Add Alert'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setText('');
              }}
              className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Headline</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Visibility</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-500">
                  No breaking news alerts added yet.
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 sm:p-4 font-medium text-slate-900">{item.text}</td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleItemEnabled(item.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        item.enabled
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.enabled ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setText(item.text);
                      }}
                      className="text-blue-600 hover:underline mr-3 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
