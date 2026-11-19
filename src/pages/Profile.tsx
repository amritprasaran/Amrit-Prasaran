import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, User, Bookmark, Trash2, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import {
  getUserProfile,
  saveUserProfile,
  getBookmarks,
  removeBookmarkById,
} from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bookmark as BookmarkType } from '../types';
import { compressImageFileToDataUrl } from '../utils/imageCompress';

export default function Profile() {
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const { t, translateCategory, formatNumber } = useLanguage();
  const [name, setName] = useState(() => getUserProfile().name);
  const [contact, setContact] = useState(() => getUserProfile().contact);
  const [photo, setPhoto] = useState<string | null>(() => getUserProfile().photo);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>(() => getBookmarks());
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<'cloud' | 'local' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncFromStore = useCallback(() => {
    const prof = getUserProfile();
    setName(prof.name);
    setContact(prof.contact);
    setPhoto(prof.photo);
    setBookmarks(getBookmarks());
  }, []);

  useEffect(() => {
    syncFromStore();
    window.addEventListener(DATA_UPDATED_EVENT, syncFromStore);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, syncFromStore);
  }, [syncFromStore]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, {
        maxDim: 256,
        quality: 0.8,
        maxLength: 250000,
      });
      setPhoto(compressed);
    } catch {
      // ignore invalid file
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSavedNotice(null);
    try {
      await saveUserProfile({
        name: name.trim(),
        contact: contact.trim(),
        photo,
      });
      setSavedNotice(user ? 'cloud' : 'local');
      setTimeout(() => setSavedNotice(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBookmark = (newsId: string) => {
    removeBookmarkById(newsId);
    setBookmarks(getBookmarks());
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('profile')}</h1>
        {user ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-emerald-800 font-medium truncate max-w-[180px]">
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex items-center gap-1 text-red-700 font-semibold hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('signOut')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-700"
          >
            <LogIn className="w-4 h-4 text-red-700" />
            <span>{t('signInToSync')}</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 p-6 rounded-xl space-y-5">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-slate-200 overflow-hidden border-4 border-slate-100 flex items-center justify-center">
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-slate-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t('uploadPhotoLabel')}
              className="absolute bottom-0 right-0 bg-red-700 text-white p-2 rounded-full hover:bg-red-800 shadow"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={e => void handleFileChange(e)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700">
            {t('nameLabel')}
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            className="w-full mt-1 p-2.5 text-sm border border-slate-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label htmlFor="profile-contact" className="block text-sm font-medium text-slate-700">
            {t('contactNumberLabel')}
          </label>
          <input
            id="profile-contact"
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            maxLength={40}
            className="w-full mt-1 p-2.5 text-sm border border-slate-300 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {saving ? t('savingText') : t('saveChanges')}
        </button>

        {savedNotice && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedNotice === 'cloud' ? t('profileSavedCloud') : t('profileSavedLocal')}</span>
          </div>
        )}
      </form>

      {/* Saved Bookmarks Section */}
      <section className="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-red-700" />
            <h2 className="text-lg font-bold text-slate-900 tabular-nums">
              {t('savedBookmarks')} ({formatNumber(bookmarks.length)})
            </h2>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">{t('noBookmarks')}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookmarks.map(item => (
              <div
                key={item.newsId}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4"
              >
                <Link to={`/article/${item.newsId}`} className="shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-14 object-cover rounded-lg border border-slate-200"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-red-700 uppercase">
                    {translateCategory(item.category)}
                  </span>
                  <Link
                    to={`/article/${item.newsId}`}
                    className="block text-sm font-bold text-slate-900 hover:text-red-700 line-clamp-2"
                  >
                    {item.title}
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBookmark(item.newsId)}
                  aria-label={t('removeBookmarkLabel')}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
