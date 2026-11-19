import { useState, useEffect } from 'react';
import { getVideos, saveVideos, getCategories, logAdminActivity } from '../../services/dataService';
import { Video } from '../../types';

function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match?.[1]) return match[1];
  }

  return trimmed;
}

export default function VideoManagement() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Local');
  const [youtubeInput, setYoutubeInput] = useState('');

  useEffect(() => {
    setVideos(getVideos());
    const cats = getCategories().map(c => c.name);
    setCategories(cats);
    if (cats.length > 0) setCategory(cats[0]);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory(categories[0] || 'Local');
    setYoutubeInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYoutubeId(youtubeInput);
    if (!title.trim() || !ytId) return;

    if (editingId) {
      const updated = videos.map(v =>
        v.id === editingId
          ? { ...v, title: title.trim(), category, youtubeId: ytId }
          : v
      );
      saveVideos(updated);
      setVideos(updated);
      logAdminActivity(`Updated video: ${title.trim()}`);
    } else {
      const created: Video = {
        id: Date.now().toString(),
        title: title.trim(),
        category,
        youtubeId: ytId,
        publishedAt: new Date().toISOString(),
      };
      const updated = [created, ...videos];
      saveVideos(updated);
      setVideos(updated);
      logAdminActivity(`Added video: ${title.trim()}`);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    const target = videos.find(v => v.id === id);
    const updated = videos.filter(v => v.id !== id);
    saveVideos(updated);
    setVideos(updated);
    if (target) logAdminActivity(`Deleted video: ${target.title}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Video Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add YouTube video links or IDs to display in the public Videos section.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 space-y-4"
      >
        <h2 className="font-bold text-slate-900">
          {editingId ? 'Edit Video' : 'Add YouTube Video'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Video Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter video headline"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              YouTube URL or Video ID
            </label>
            <input
              type="text"
              value={youtubeInput}
              onChange={e => setYoutubeInput(e.target.value)}
              placeholder="https://youtu.be/... or dQw4w9WgXcQ"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            {editingId ? 'Save Video' : 'Add Video'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[580px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Title</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Category</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">YouTube ID</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  No videos added yet.
                </td>
              </tr>
            ) : (
              videos.map(video => (
                <tr key={video.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 sm:p-4 font-medium text-slate-900">{video.title}</td>
                  <td className="p-3 sm:p-4 text-slate-600 whitespace-nowrap">{video.category}</td>
                  <td className="p-3 sm:p-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {video.youtubeId}
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(video.id);
                        setTitle(video.title);
                        setCategory(video.category);
                        setYoutubeInput(video.youtubeId);
                      }}
                      className="text-blue-600 hover:underline mr-3 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(video.id)}
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
