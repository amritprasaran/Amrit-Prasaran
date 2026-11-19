import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Newspaper,
  FolderTree,
  FileText,
  Zap,
  Video,
  Settings,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Loader2,
  Lock,
  Inbox,
  Users,
  Megaphone,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { DEFAULT_LOGO_URL, getSiteSettings } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../firebase';

export default function AdminLayout() {
  const location = useLocation();
  const { user, isAdmin, isSuperAdmin, loading, authError, signInWithGoogle, signOutUser } = useAuth();
  const [settings, setSettings] = useState(() => getSiteSettings());

  useEffect(() => {
    const sync = () => setSettings(getSiteSettings());
    window.addEventListener(DATA_UPDATED_EVENT, sync);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, sync);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin text-red-700" />
          <p className="text-sm font-medium text-slate-600">Verifying editor credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <img
              src={settings.logoUrl || DEFAULT_LOGO_URL}
              alt={settings.siteName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{settings.siteName} CMS</h1>
              <p className="text-sm text-slate-500 mt-1">
                Sign in with an authorized Google editor account to publish news, upload E-Papers, moderate comments, and sync across devices.
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-left">
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>

          <p className="text-xs text-slate-400">
            Authorized editor: <span className="font-medium text-slate-600">{ADMIN_EMAIL}</span>
          </p>

          <div className="pt-2 border-t border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-sm space-y-5 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Admin Access Restricted</h1>
            <p className="text-sm text-slate-600 mt-2">
              Signed in as <strong>{user.email}</strong>, which does not have editor permissions.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Please sign in with <strong>{ADMIN_EMAIL}</strong> or an invited correspondent account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch Account</span>
            </button>
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Site</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'News & Slider', path: '/admin/news', icon: Newspaper },
    { label: 'Citizen Tips', path: '/admin/tips', icon: Inbox },
    { label: 'Inquiries', path: '/admin/inquiries', icon: MessageCircle },
    { label: 'Sponsor Ads', path: '/admin/ads', icon: Megaphone },
    { label: 'Subscribers', path: '/admin/subscribers', icon: Mail },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'E-Paper PDFs', path: '/admin/epaper', icon: FileText },
    { label: 'Breaking News', path: '/admin/breaking', icon: Zap },
    { label: 'Videos', path: '/admin/videos', icon: Video },
    { label: 'Comments', path: '/admin/comments', icon: MessageSquare },
    ...(isSuperAdmin ? [{ label: 'Editors & Team', path: '/admin/editors', icon: Users }] : []),
    { label: 'Settings & Social', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100">
      <aside className="w-full md:w-64 bg-slate-900 text-white p-4 sm:p-5 shrink-0 flex flex-col">
        <div className="flex items-center justify-between md:mb-6 mb-3">
          <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
            <img
              src={settings.logoUrl || DEFAULT_LOGO_URL}
              alt={settings.siteName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <span className="block text-sm font-bold text-white truncate">
                {settings.siteName}
              </span>
              <span className="block text-xs text-emerald-400 truncate">
                {user.email}
              </span>
            </div>
          </Link>
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => void signOutUser()}
              aria-label="Sign out"
              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 whitespace-nowrap"
            >
              <span>View Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 flex-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-red-700 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex flex-col gap-1.5 pt-4 mt-4 border-t border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>Back to Website</span>
          </Link>
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
