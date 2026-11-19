import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  getNews,
  getCategories,
  getNewspapers,
  getVideos,
  getAdminActivity,
  getAllComments,
  getNewsTips,
  getSubscribers,
  getInquiries,
  getAds,
  getPushTokenCount,
} from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { isSuperAdmin } = useAuth();
  const [counts, setCounts] = useState({
    news: 0,
    categories: 0,
    papers: 0,
    videos: 0,
    comments: 0,
    pendingTips: 0,
    subscribers: 0,
    newInquiries: 0,
    activeAds: 0,
    pushDevices: 0,
  });
  const [activities, setActivities] = useState(() => getAdminActivity());

  const refresh = useCallback(() => {
    const tips = getNewsTips();
    const inquiries = getInquiries();
    const ads = getAds();
    setCounts({
      news: getNews().length,
      categories: getCategories().length,
      papers: getNewspapers().length,
      videos: getVideos().length,
      comments: getAllComments().length,
      pendingTips: tips.filter(t => t.status === 'pending').length,
      subscribers: getSubscribers().length,
      newInquiries: inquiries.filter(i => i.status === 'new').length,
      activeAds: ads.filter(a => a.enabled).length,
      pushDevices: getPushTokenCount(),
    });
    setActivities(getAdminActivity());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(DATA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, refresh);
  }, [refresh]);

  const stats = [
    { label: 'Total News Articles', value: counts.news, path: '/admin/news' },
    { label: 'Pending Citizen Tips', value: counts.pendingTips, path: '/admin/tips' },
    { label: 'New Inquiries', value: counts.newInquiries, path: '/admin/inquiries' },
    { label: 'Newsletter Subscribers', value: counts.subscribers, path: '/admin/subscribers' },
    { label: 'E-Paper PDFs', value: counts.papers, path: '/admin/epaper' },
    { label: 'Active Sponsor Ads', value: counts.activeAds, path: '/admin/ads' },
    { label: 'Push Alert Devices', value: counts.pushDevices, path: '/settings' },
    { label: 'Reader Comments', value: counts.comments, path: '/admin/comments' },
  ];

  const quickActions = [
    { label: 'Add News Article', path: '/admin/news' },
    { label: 'Review Citizen Tips', path: '/admin/tips' },
    { label: 'Review Inquiries', path: '/admin/inquiries' },
    { label: 'Manage Sponsor Ads', path: '/admin/ads' },
    { label: 'Export Subscribers', path: '/admin/subscribers' },
    { label: 'Upload E-Paper PDF', path: '/admin/epaper' },
    { label: 'Breaking News Ticker', path: '/admin/breaking' },
    { label: 'Moderate Comments', path: '/admin/comments' },
    ...(isSuperAdmin ? [{ label: 'Manage Editors & Team', path: '/admin/editors' }] : []),
    { label: 'Site & Social Settings', path: '/admin/settings' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Control Jammu &amp; Kashmir news, citizen tips, inquiries, sponsor banners, subscribers, E-Papers, and cloud settings.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            to={stat.path}
            className="bg-white border border-slate-200 p-5 rounded-lg hover:border-red-300 transition-colors"
          >
            <h3 className="text-xs sm:text-sm text-slate-500 font-medium">{stat.label}</h3>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums mt-2 text-slate-900">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 p-5 sm:p-6 rounded-lg">
          <h2 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickActions.map(action => (
              <Link
                key={action.path}
                to={action.path}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 p-5 sm:p-6 rounded-lg">
          <h2 className="text-base font-bold text-slate-900 mb-4">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500">
              Admin changes you make will appear here automatically.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activities.slice(0, 6).map(act => (
                <li key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700">{act.action}</span>
                  <span className="text-xs text-slate-400 tabular-nums shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
