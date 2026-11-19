import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Plus, Trash2, ExternalLink, Megaphone } from 'lucide-react';
import { getAds, saveAds, logAdminActivity } from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { compressImageFileToDataUrl } from '../../utils/imageCompress';
import { SponsorAd } from '../../types';

const PLACEMENTS: { value: SponsorAd['placement']; label: string }[] = [
  { value: 'home', label: 'Homepage Feed' },
  { value: 'article', label: 'Article Detail Page' },
  { value: 'epaper', label: 'E-Paper Archive Page' },
];

export default function AdsManagement() {
  const [ads, setAds] = useState<SponsorAd[]>([]);
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [placement, setPlacement] = useState<SponsorAd['placement']>('home');
  const [compressing, setCompressing] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(() => {
    setAds(getAds());
  }, []);

  useEffect(() => {
    loadAll();
    window.addEventListener(DATA_UPDATED_EVENT, loadAll);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadAll);
  }, [loadAll]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setUploadMsg(null);
    try {
      const compressed = await compressImageFileToDataUrl(file, {
        maxDim: 1200,
        quality: 0.8,
        maxLength: 300000,
      });
      setImageUrl(compressed);
      const kb = Math.round((compressed.length * 3) / 4 / 1024);
      setUploadMsg(`Compressed banner ready (~${kb} KB JPEG)`);
    } catch {
      setUploadMsg('Failed to process image. Please choose a valid JPG/PNG.');
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || !targetUrl.trim()) return;

    const created: SponsorAd = {
      id: `ad_${Date.now()}`,
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      targetUrl: targetUrl.trim(),
      placement,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    const next = [created, ...ads];
    saveAds(next);
    setAds(next);
    logAdminActivity(`Created sponsor ad (${placement}): ${created.title}`);
    setTitle('');
    setTargetUrl('');
    setImageUrl('');
    setUploadMsg(null);
  };

  const toggleEnabled = (id: string) => {
    const next = ads.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    saveAds(next);
    setAds(next);
    logAdminActivity('Toggled sponsor banner status');
  };

  const handleDelete = (id: string) => {
    const target = ads.find(a => a.id === id);
    const next = ads.filter(item => item.id !== id);
    saveAds(next);
    setAds(next);
    if (target) logAdminActivity(`Deleted sponsor ad: ${target.title}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sponsor &amp; Ad Slot Manager</h1>
        <p className="text-sm text-slate-500 mt-1">
          Publish local J&amp;K sponsor banners cleanly across Home, Article Detail, and E-Paper pages. Empty slots hide automatically.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
      >
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-red-700" />
          <span>Create Sponsor Banner</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="ad-title" className="block text-xs font-medium text-slate-600 mb-1">
              Sponsor / Campaign Title *
            </label>
            <input
              id="ad-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Kashmir Crafts Fair 2026"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label htmlFor="ad-placement" className="block text-xs font-medium text-slate-600 mb-1">
              Placement Slot
            </label>
            <select
              id="ad-placement"
              value={placement}
              onChange={e => setPlacement(e.target.value as SponsorAd['placement'])}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {PLACEMENTS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ad-target" className="block text-xs font-medium text-slate-600 mb-1">
              Target URL / Destination *
            </label>
            <input
              id="ad-target"
              type="text"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="https://... or /contact"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="ad-image-url" className="block text-xs font-medium text-slate-600 mb-1">
              Banner Image URL (or Upload File) *
            </label>
            <input
              id="ad-image-url"
              type="text"
              value={imageUrl.startsWith('data:') ? '' : imageUrl}
              onChange={e => {
                setImageUrl(e.target.value);
                setUploadMsg(null);
              }}
              placeholder={
                imageUrl.startsWith('data:')
                  ? 'Compressed banner uploaded'
                  : 'https://... or upload from device'
              }
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required={!imageUrl.startsWith('data:')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={compressing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-800"
            >
              <Upload className="w-4 h-4 text-red-700" />
              <span>{compressing ? 'Compressing...' : 'Upload Banner Image'}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={e => void handleImageUpload(e)}
              className="hidden"
            />
            {uploadMsg && <span className="text-xs text-slate-600">{uploadMsg}</span>}
          </div>
        </div>

        {imageUrl && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-500 mb-2">Banner Preview</p>
            <img
              src={imageUrl}
              alt="Ad preview"
              referrerPolicy="no-referrer"
              className="w-full max-h-40 object-cover rounded-md border border-slate-200 bg-white"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={compressing}
          className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Sponsor Ad</span>
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {ads.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No sponsor banners configured yet. Public pages will remain clean until you activate a banner.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {ads.map(ad => (
              <div
                key={ad.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    referrerPolicy="no-referrer"
                    className="w-24 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{ad.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize">
                        {ad.placement}
                      </span>
                      <span className="inline-flex items-center gap-1 truncate max-w-xs">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {ad.targetUrl}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleEnabled(ad.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      ad.enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {ad.enabled ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ad.id)}
                    aria-label={`Delete ${ad.title}`}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
