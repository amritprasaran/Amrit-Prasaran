import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { getCategories, saveCategories, logAdminActivity } from '../../services/dataService';
import { Category } from '../../types';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setCategories(getCategories());
  }, []);

  const persist = (next: Category[], logMsg: string) => {
    const normalized = next.map((c, idx) => ({ ...c, order: idx + 1 }));
    saveCategories(normalized);
    setCategories(normalized);
    logAdminActivity(logMsg);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editingId) {
      const updated = categories.map(c =>
        c.id === editingId ? { ...c, name: trimmed } : c
      );
      persist(updated, `Renamed category to ${trimmed}`);
      setEditingId(null);
    } else {
      const created: Category = {
        id: Date.now().toString(),
        name: trimmed,
        enabled: true,
        order: categories.length + 1,
      };
      persist([...categories, created], `Added category: ${trimmed}`);
    }
    setName('');
  };

  const toggleEnabled = (id: string) => {
    const updated = categories.map(c =>
      c.id === id ? { ...c, enabled: c.enabled === false } : c
    );
    persist(updated, 'Updated category visibility');
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= categories.length) return;
    const copy = [...categories];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    persist(copy, 'Reordered categories');
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    const updated = categories.filter(c => c.id !== id);
    persist(updated, `Deleted category: ${cat?.name || id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Category Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add, rename, enable/disable, and reorder news categories.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Category name (e.g. Tourism, Culture)"
          className="flex-1 min-w-0 p-2.5 text-sm border border-slate-300 rounded-lg"
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            {editingId ? 'Save Category' : 'Add Category'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setName('');
              }}
              className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Order</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Category</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Status</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, idx) => {
              const isEnabled = cat.enabled !== false;
              return (
                <tr key={cat.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move up"
                        className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(idx, 1)}
                        disabled={idx === categories.length - 1}
                        aria-label="Move down"
                        className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 font-medium text-slate-900">{cat.name}</td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleEnabled(cat.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        isEnabled
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(cat.id);
                        setName(cat.name);
                      }}
                      className="text-blue-600 hover:underline mr-3 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
