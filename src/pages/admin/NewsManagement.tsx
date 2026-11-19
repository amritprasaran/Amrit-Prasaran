import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Clock, X, Image as ImageIcon } from 'lucide-react';
import {
  getNews,
  saveNews,
  getCategories,
  logAdminActivity,
  JK_DISTRICTS,
} from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { compressImageFileToDataUrl } from '../../utils/imageCompress';
import { News, NewsTip } from '../../types';

const IMAGE_PRESETS = [
  { label: 'Dal Lake Srinagar', url: '/src/assets/images/jk_dal_lake_news_1794545142769.jpg' },
  { label: 'Jammu-Srinagar Highway', url: '/src/assets/images/jk_jammu_highway_1794545144505.jpg' },
  { label: 'Jammu Innovation Hub', url: '/src/assets/images/jk_tech_education_1794545144605.jpg' },
  { label: 'Srinagar Rally / Local', url: '/src/assets/images/news_hero_1_1794471785170.jpg' },
  { label: 'Kashmir Market / Business', url: '/src/assets/images/news_hero_2_1794471785543.jpg' },
  { label: 'Gulmarg Stadium / Sports', url: '/src/assets/images/news_hero_3_1794471785143.jpg' },
];

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewsManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Local');
  const [district, setDistrict] = useState('All J&K');
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [author, setAuthor] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState(IMAGE_PRESETS[0].url);
  const [linkUrl, setLinkUrl] = useState('');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(() => {
    setNews(getNews());
    const cats = getCategories().map(c => c.name);
    setCategories(cats);
  }, []);

  useEffect(() => {
    loadAll();
    const cats = getCategories().map(c => c.name);
    if (cats.length > 0) setCategory(cats[0]);
    window.addEventListener(DATA_UPDATED_EVENT, loadAll);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadAll);
  }, [loadAll]);

  // Prefill editor when converting a citizen tip into a draft article
  useEffect(() => {
    const state = location.state as { fromTip?: NewsTip } | null;
    if (!state?.fromTip) return;
    const tip = state.fromTip;
    setEditingId(null);
    setTitle(tip.headline);
    setCategory('Local');
    setDistrict(JK_DISTRICTS.includes(tip.district) ? tip.district : 'All J&K');
    setAuthor(tip.reporterName ? `${tip.reporterName} (Citizen Reporter)` : '');
    setPhotoCaption('');
    setContent(`${tip.details}\n\n[Citizen Report · ${tip.district} · Submitted by ${tip.reporterName}]`);
    setImageUrl(tip.photoDataUrl || IMAGE_PRESETS[0].url);
    setScheduledLocal('');
    setIsFeatured(false);
    setIsPublished(false);
    setIsFormOpen(true);
    setPhotoUploadMsg(tip.photoDataUrl ? 'Loaded compressed photo from citizen tip.' : null);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setTitle('');
    setCategory(categories[0] || 'Local');
    setDistrict('All J&K');
    setLanguage('hi');
    setAuthor('');
    setPhotoCaption('');
    setContent('');
    setImageUrl(IMAGE_PRESETS[0].url);
    setLinkUrl('');
    setScheduledLocal('');
    setIsFeatured(false);
    setIsPublished(true);
    setPhotoUploadMsg(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    setPhotoUploadMsg(null);
    try {
      const compressed = await compressImageFileToDataUrl(file, {
        maxDim: 1280,
        quality: 0.8,
        maxLength: 340000,
      });
      setImageUrl(compressed);
      const kb = Math.round((compressed.length * 3) / 4 / 1024);
      setPhotoUploadMsg(`Compressed field photo ready (~${kb} KB JPEG)`);
    } catch {
      setPhotoUploadMsg('Could not read selected photo. Please try a JPG or PNG image.');
    } finally {
      setIsCompressingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const cleanLink = linkUrl.trim() || undefined;
    const cleanAuthor = author.trim() || undefined;
    const cleanCaption = photoCaption.trim() || undefined;
    const cleanScheduled = scheduledLocal
      ? new Date(scheduledLocal).toISOString()
      : undefined;

    if (editingId) {
      const updated = news.map(item =>
        item.id === editingId
          ? {
              ...item,
              title,
              category,
              district,
              language,
              author: cleanAuthor,
              photoCaption: cleanCaption,
              content,
              imageUrl,
              linkUrl: cleanLink,
              scheduledAt: cleanScheduled,
              updatedAt: new Date().toISOString(),
              isFeatured,
              isPublished,
            }
          : item
      );
      saveNews(updated);
      setNews(updated);
      logAdminActivity(`Updated article: ${title}`);
    } else {
      const created: News = {
        id: Date.now().toString(),
        title,
        category,
        district,
        language,
        ...(cleanAuthor ? { author: cleanAuthor } : {}),
        ...(cleanCaption ? { photoCaption: cleanCaption } : {}),
        content,
        imageUrl: imageUrl.trim() || IMAGE_PRESETS[0].url,
        linkUrl: cleanLink,
        publishedAt: new Date().toISOString(),
        ...(cleanScheduled ? { scheduledAt: cleanScheduled } : {}),
        isFeatured,
        isPublished,
      };
      const updated = [created, ...news];
      saveNews(updated);
      setNews(updated);
      logAdminActivity(
        cleanScheduled
          ? `Scheduled article (${new Date(cleanScheduled).toLocaleString('en-IN')}): ${title}`
          : `Published article: ${title}`
      );
    }
    resetForm();
  };

  const handleEdit = (item: News) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setDistrict(item.district || 'All J&K');
    setLanguage(item.language || 'hi');
    setAuthor(item.author || '');
    setPhotoCaption(item.photoCaption || '');
    setContent(item.content);
    setImageUrl(item.imageUrl);
    setLinkUrl(item.linkUrl || '');
    setScheduledLocal(toDatetimeLocalValue(item.scheduledAt));
    setIsFeatured(item.isFeatured);
    setIsPublished(item.isPublished !== false);
    setPhotoUploadMsg(null);
    setIsFormOpen(true);
  };

  const toggleFeatured = (id: string) => {
    const updated = news.map(n =>
      n.id === id ? { ...n, isFeatured: !n.isFeatured } : n
    );
    saveNews(updated);
    setNews(updated);
    logAdminActivity('Toggled slider featured status');
  };

  const togglePublished = (id: string) => {
    const updated = news.map(n =>
      n.id === id ? { ...n, isPublished: n.isPublished === false } : n
    );
    saveNews(updated);
    setNews(updated);
    logAdminActivity('Updated article publish status');
  };

  const handleDelete = (id: string) => {
    const target = news.find(n => n.id === id);
    const updated = news.filter(n => n.id !== id);
    saveNews(updated);
    setNews(updated);
    if (target) logAdminActivity(`Deleted article: ${target.title}`);
  };

  const nowMs = Date.now();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">News &amp; Slider Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload field photos directly, schedule morning editions, tag J&amp;K districts, and manage homepage slider stories.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isFormOpen) resetForm();
            else setIsFormOpen(true);
          }}
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isFormOpen ? 'Cancel' : 'Add News'}
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 mb-6 space-y-4"
        >
          <h2 className="font-bold text-slate-900">
            {editingId ? 'Edit Article' : 'Publish or Schedule Article'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Headline</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter news headline"
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
              <label className="block text-xs font-medium text-slate-600 mb-1">J&amp;K District / Region</label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {JK_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Edition Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value === 'en' ? 'en' : 'hi')}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="hi">Hindi (हिंदी)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Image Preset</label>
              <select
                value={IMAGE_PRESETS.some(p => p.url === imageUrl) ? imageUrl : ''}
                onChange={e => {
                  if (e.target.value) {
                    setImageUrl(e.target.value);
                    setPhotoUploadMsg(null);
                  }
                }}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Custom / Uploaded Photo</option>
                {IMAGE_PRESETS.map(p => (
                  <option key={p.url} value={p.url}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={e => {
                  setImageUrl(e.target.value);
                  setPhotoUploadMsg(null);
                }}
                placeholder={
                  imageUrl.startsWith('data:')
                    ? 'Uploaded device photo selected'
                    : 'https://... or /src/assets/images/...'
                }
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="schedule-publish-at" className="block text-xs font-medium text-slate-600 mb-1">
                Schedule Publish Time (Optional)
              </label>
              <div className="relative flex items-center">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  id="schedule-publish-at"
                  type="datetime-local"
                  value={scheduledLocal}
                  onChange={e => setScheduledLocal(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Direct Photo Picker + Live Preview */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={imageUrl || IMAGE_PRESETS[0].url}
              alt="Article preview"
              referrerPolicy="no-referrer"
              className="w-32 h-20 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressingPhoto}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs sm:text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isCompressingPhoto ? 'Compressing Photo...' : 'Upload Photo from Device'}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => void handlePhotoUpload(e)}
                  className="hidden"
                />
                {imageUrl.startsWith('data:') && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(IMAGE_PRESETS[0].url);
                      setPhotoUploadMsg(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset to Preset
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {photoUploadMsg ||
                    'Select a photo from your phone or computer — automatically compressed for fast J&K mobile loading.'}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="article-author" className="block text-xs font-medium text-slate-600 mb-1">
                Correspondent / Author Byline (Optional)
              </label>
              <input
                id="article-author"
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="e.g. Amrit Prasaran Bureau, Srinagar"
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="article-photo-caption" className="block text-xs font-medium text-slate-600 mb-1">
                Photo Caption / Credit (Optional)
              </label>
              <input
                id="article-photo-caption"
                type="text"
                value={photoCaption}
                onChange={e => setPhotoCaption(e.target.value)}
                placeholder="Describe photo or photographer credit"
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Custom Slider / Target Link URL (Optional)
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="/epaper, /videos, or https://..."
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Article Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write article content..."
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg h-28"
              required
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                className="rounded border-slate-300"
              />
              Show in Homepage Slider
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="rounded border-slate-300"
              />
              Published on Website
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isCompressingPhoto}
              className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {editingId ? 'Save Changes' : scheduledLocal ? 'Schedule Article' : 'Publish Article'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[740px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Title</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Category / District</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Slider</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Status</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {news.map(n => {
              const published = n.isPublished !== false;
              const isScheduledFuture =
                published &&
                Boolean(n.scheduledAt) &&
                new Date(n.scheduledAt as string).getTime() > nowMs;

              return (
                <tr key={n.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 sm:p-4 text-slate-900 font-medium max-w-xs truncate">
                    {n.title}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600 whitespace-nowrap">
                    {n.category}
                    {n.district && n.district !== 'All J&K' ? ` · ${n.district}` : ''}
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(n.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        n.isFeatured
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {n.isFeatured ? 'Slider On' : 'Standard'}
                    </button>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {isScheduledFuture ? (
                      <span
                        title={`Scheduled for ${new Date(n.scheduledAt as string).toLocaleString('en-IN')}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-800"
                      >
                        <Clock className="w-3 h-3" />
                        Scheduled ({new Date(n.scheduledAt as string).toLocaleDateString('en-IN')})
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => togglePublished(n.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium ${
                          published
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {published ? 'Published' : 'Draft'}
                      </button>
                    )}
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleEdit(n)}
                      className="text-blue-600 hover:underline mr-3 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
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
