import { useState, useEffect } from 'react';
import {
  getSiteSettings,
  saveSiteSettings,
  getSocialLinks,
  saveSocialLinks,
  DEFAULT_LOGO_URL,
  logAdminActivity,
} from '../../services/dataService';
import { SiteSettings, SocialLink } from '../../types';

export default function SiteSettingsManagement() {
  const [settings, setSettings] = useState<SiteSettings>(getSiteSettings());
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);

  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    setSettings(getSiteSettings());
    setSocialLinks(getSocialLinks());
  }, []);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteSettings(settings);
    logAdminActivity('Updated website settings');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleSaveSocial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform.trim() || !url.trim()) return;

    if (editingSocialId) {
      const updated = socialLinks.map(s =>
        s.id === editingSocialId
          ? { ...s, platform: platform.trim(), url: url.trim() }
          : s
      );
      saveSocialLinks(updated);
      setSocialLinks(updated);
      logAdminActivity(`Updated social link: ${platform.trim()}`);
      setEditingSocialId(null);
    } else {
      const created: SocialLink = {
        id: Date.now().toString(),
        platform: platform.trim(),
        url: url.trim(),
        enabled: true,
      };
      const updated = [...socialLinks, created];
      saveSocialLinks(updated);
      setSocialLinks(updated);
      logAdminActivity(`Added social platform: ${platform.trim()}`);
    }
    setPlatform('');
    setUrl('');
  };

  const toggleSocial = (id: string) => {
    const updated = socialLinks.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    saveSocialLinks(updated);
    setSocialLinks(updated);
    logAdminActivity('Toggled social media visibility');
  };

  const deleteSocial = (id: string) => {
    const target = socialLinks.find(s => s.id === id);
    const updated = socialLinks.filter(s => s.id !== id);
    saveSocialLinks(updated);
    setSocialLinks(updated);
    if (target) logAdminActivity(`Removed social link: ${target.platform}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Website Settings &amp; Social Media
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure site branding, contact details, About Us text, and official social links.
        </p>
      </div>

      <form
        onSubmit={handleSaveSettings}
        className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900">General Website Settings</h2>
          {savedNotice && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded">
              Settings saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={e => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={e => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contact Email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contact Phone</label>
            <input
              type="text"
              value={settings.contactPhone}
              onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Logo URL</label>
            <input
              type="text"
              value={settings.logoUrl}
              onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
            />
            <div className="mt-2 flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-medium hover:file:bg-slate-200"
              />
              <button
                type="button"
                onClick={() => setSettings({ ...settings, logoUrl: DEFAULT_LOGO_URL })}
                className="text-xs text-red-700 hover:underline whitespace-nowrap"
              >
                Reset Default
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={settings.logoUrl || DEFAULT_LOGO_URL}
              alt="Logo preview"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <span className="text-xs text-slate-500">Live header &amp; footer logo preview</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">About Us Content</label>
          <textarea
            value={settings.aboutText}
            onChange={e => setSettings({ ...settings, aboutText: e.target.value })}
            className="w-full p-2.5 text-sm border border-slate-300 rounded-lg h-24"
          />
        </div>

        <div>
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            Save Website Settings
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 space-y-5">
        <div>
          <h2 className="font-bold text-slate-900">Social Media Links</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enabled platforms appear in the public website footer.
          </p>
        </div>

        <form onSubmit={handleSaveSocial} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            placeholder="Platform (e.g. YouTube, Telegram)"
            className="p-2.5 text-sm border border-slate-300 rounded-lg"
            required
          />
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://..."
            className="p-2.5 text-sm border border-slate-300 rounded-lg"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap"
            >
              {editingSocialId ? 'Update Link' : 'Add Platform'}
            </button>
            {editingSocialId && (
              <button
                type="button"
                onClick={() => {
                  setEditingSocialId(null);
                  setPlatform('');
                  setUrl('');
                }}
                className="bg-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-3 text-left font-semibold text-slate-700">Platform</th>
                <th className="p-3 text-left font-semibold text-slate-700">URL</th>
                <th className="p-3 text-left font-semibold text-slate-700">Status</th>
                <th className="p-3 text-left font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {socialLinks.map(link => (
                <tr key={link.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 font-medium text-slate-900">{link.platform}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{link.url}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSocial(link.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        link.enabled
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {link.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSocialId(link.id);
                        setPlatform(link.platform);
                        setUrl(link.url);
                      }}
                      className="text-blue-600 hover:underline mr-3 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSocial(link.id)}
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
    </div>
  );
}
