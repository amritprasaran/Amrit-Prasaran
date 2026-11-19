/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import OfflineIndicator from './components/OfflineIndicator';
import Home from './pages/Home';
import EPaper from './pages/EPaper';
import Videos from './pages/Videos';
import CategoryPage from './pages/CategoryPage';
import NewsDetail from './pages/NewsDetail';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import SubmitTip from './pages/SubmitTip';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import NewsManagement from './pages/admin/NewsManagement';
import TipsManagement from './pages/admin/TipsManagement';
import AdsManagement from './pages/admin/AdsManagement';
import SubscribersManagement from './pages/admin/SubscribersManagement';
import InquiriesManagement from './pages/admin/InquiriesManagement';
import EditorManagement from './pages/admin/EditorManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import EPaperManagement from './pages/admin/EPaperManagement';
import BreakingNewsManagement from './pages/admin/BreakingNewsManagement';
import VideoManagement from './pages/admin/VideoManagement';
import CommentManagement from './pages/admin/CommentManagement';
import SiteSettingsManagement from './pages/admin/SiteSettingsManagement';
import { About, Contact, Privacy, Terms, AppVersion } from './pages/info/Pages';
import BottomNav from './components/BottomNav';
import EPaperNotificationToast from './components/EPaperNotificationToast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import {
  getNews,
  setLocalNews,
  getNewspapers,
  setLocalNewspapers,
  getVideos,
  setLocalVideos,
  getCategories,
  setLocalCategories,
  getBreakingNews,
  setLocalBreakingNews,
  getSiteSettings,
  setLocalSiteSettings,
  getSocialLinks,
  setLocalSocialLinks,
  setLocalComments,
  setLocalArticleViews,
  setLocalNewsTips,
  setLocalAds,
  setLocalSubscribers,
  setLocalInquiries,
  setLocalPushTokenCount,
  setLocalAdminActivity,
  setLocalUserProfile,
  setLocalBookmarks,
  DEFAULT_CATEGORIES,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_SOCIAL_LINKS,
} from './services/dataService';
import {
  subscribePublicCollections,
  subscribeUserPrivateData,
  seedCloudIfEmpty,
} from './services/cloudSync';
import { initForegroundFcmListener } from './utils/fcm';
import { News } from './types';

const DEFAULT_NEWS: News[] = [
  {
    id: '1',
    title: 'श्रीनगर में नई सड़क और स्मार्ट सिटी परियोजना का शुभारंभ',
    category: 'Local',
    district: 'Srinagar',
    language: 'hi',
    content: 'श्रीनगर शहर में यातायात को सुगम बनाने और बुनियादी ढांचे को मजबूत करने के लिए नई स्मार्ट सड़क परियोजना की शुरुआत की गई है। इससे स्थानीय नागरिकों और पर्यटकों दोनों को बड़ी राहत मिलेगी।',
    imageUrl: '/src/assets/images/news_hero_1_1794471785170.jpg',
    publishedAt: new Date().toISOString(),
    isFeatured: true,
    isPublished: true,
  },
  {
    id: '2',
    title: 'डल झील के संरक्षण और शिकारा पर्यटन के लिए विशेष पैकेज घोषित',
    category: 'Local',
    district: 'Srinagar',
    language: 'hi',
    content: 'कश्मीर की पहचान डल झील की स्वच्छता और शिकारा नाविकों की आजीविका को बढ़ावा देने के लिए प्रशासन ने नए पर्यटन विकास पैकेज की घोषणा की है।',
    imageUrl: '/src/assets/images/jk_dal_lake_news_1794545142769.jpg',
    publishedAt: new Date().toISOString(),
    isFeatured: true,
    isPublished: true,
  },
  {
    id: '3',
    title: 'जम्मू-श्रीनगर राष्ट्रीय राजमार्ग पर नई सुरंग से सफर होगा आसान',
    category: 'National',
    district: 'Jammu',
    language: 'hi',
    content: 'जम्मू और श्रीनगर के बीच सभी मौसमों में निर्बाध संपर्क सुनिश्चित करने के लिए आधुनिक राजमार्ग सुरंग का काम तेजी से पूरा हो रहा है, जिससे यात्रा समय में भारी कमी आएगी।',
    imageUrl: '/src/assets/images/jk_jammu_highway_1794545144505.jpg',
    publishedAt: new Date().toISOString(),
    isFeatured: true,
    isPublished: true,
  },
  {
    id: '4',
    title: 'गुलमर्ग (बारामूला) में शीतकालीन खेल और पर्यटन को मिला बड़ा बढ़ावा',
    category: 'Sports',
    district: 'Baramulla',
    language: 'hi',
    content: 'बारामूला जिले के गुलमर्ग में आगामी शीतकालीन खेलों की तैयारियां जोरों पर हैं। देश भर से खिलाड़ी और पर्यटक कश्मीर की वादियों में पहुंचने लगे हैं।',
    imageUrl: '/src/assets/images/news_hero_3_1794471785143.jpg',
    publishedAt: new Date().toISOString(),
    isFeatured: true,
    isPublished: true,
  },
  {
    id: '5',
    title: 'जम्मू विश्वविद्यालय में आधुनिक डिजिटल लाइब्रेरी और इनोवेशन हब शुरू',
    category: 'Education',
    district: 'Jammu',
    language: 'hi',
    content: 'जम्मू और कश्मीर के युवाओं को तकनीकी और शोध के क्षेत्र में आगे बढ़ाने के लिए विश्वविद्यालय परिसर में नया डिजिटल इनोवेशन केंद्र शुरू किया गया है।',
    imageUrl: '/src/assets/images/jk_tech_education_1794545144605.jpg',
    publishedAt: new Date().toISOString(),
    isFeatured: true,
    isPublished: true,
  },
  {
    id: '6',
    title: 'राजौरी और पुंछ में सीमावर्ती सड़क व स्वास्थ्य सुविधाओं का विस्तार',
    category: 'Local',
    district: 'Rajouri',
    language: 'hi',
    content: 'राजौरी और पुंछ जिलों के दूरदराज क्षेत्रों में स्वास्थ्य केंद्रों और सड़क संपर्क को मजबूत करने के लिए नई विकास परियोजनाओं को मंजूरी दी गई है।',
    imageUrl: '/src/assets/images/news_hero_2_1794471785543.jpg',
    publishedAt: new Date().toISOString(),
    isFeatured: true,
    isPublished: true,
  },
  {
    id: '7',
    title: 'High-Altitude Renewable Energy Corridor Reviewed in Leh & Ladakh',
    category: 'Business',
    district: 'Leh',
    language: 'en',
    content: 'Officials reviewed clean solar power transmission upgrades and winter connectivity resilience across Leh region to support local enterprise and tourism.',
    imageUrl: '/src/assets/images/jk_jammu_highway_1794545144505.jpg',
    publishedAt: new Date().toISOString(),
    isFeatured: false,
    isPublished: true,
  },
  {
    id: '8',
    title: 'Poonch Border Youth Sports & Skill Centre Opens New Admissions',
    category: 'Education',
    district: 'Poonch',
    language: 'en',
    content: 'New athletic tracks and digital skill training workshops in Poonch aim to connect youth across Pir Panjal with national sports and tech opportunities.',
    imageUrl: '/src/assets/images/news_hero_3_1794471785143.jpg',
    publishedAt: new Date().toISOString(),
    isFeatured: false,
    isPublished: true,
  },
];

const REAL_EPAPER_PDF = '/assets/aistudio/Amrat_prasaran_01_nov_2026_4574cb9e.pdf';

function seedInitialData() {
  const existingNews = getNews();
  if (existingNews.length === 0) {
    setLocalNews(DEFAULT_NEWS);
  } else {
    const existingIds = new Set(existingNews.map(n => n.id));
    const missingDefaults = DEFAULT_NEWS.filter(n => !existingIds.has(n.id));
    if (missingDefaults.length > 0) {
      setLocalNews([...existingNews, ...missingDefaults]);
    }
  }

  if (getVideos().length === 0) {
    setLocalVideos([
      { id: '1', title: 'Breaking: Election Results', category: 'Politics', youtubeId: 'dQw4w9WgXcQ', publishedAt: new Date().toISOString() },
      { id: '2', title: 'Market Analysis', category: 'Business', youtubeId: 'dQw4w9WgXcQ', publishedAt: new Date().toISOString() },
      { id: '3', title: 'Cricket Highlights', category: 'Sports', youtubeId: 'dQw4w9WgXcQ', publishedAt: new Date().toISOString() },
    ]);
  }

  const existingPapers = getNewspapers();
  if (existingPapers.length === 0) {
    setLocalNewspapers([
      {
        id: '1',
        date: '2026-11-01',
        title: 'अमृत प्रसारण (Amrit Prasaran) - 01 Nov 2026',
        pdfUrl: REAL_EPAPER_PDF,
        pageCount: 4,
      },
    ]);
  } else if (existingPapers.some(p => p.pdfUrl === '/sample.pdf')) {
    const migrated = existingPapers.map(p =>
      p.pdfUrl === '/sample.pdf'
        ? { ...p, pdfUrl: REAL_EPAPER_PDF, pageCount: p.pageCount || 4 }
        : p
    );
    setLocalNewspapers(migrated);
  }
}

function CloudSyncBridge() {
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const unsubPublic = subscribePublicCollections(isAdmin, {
      onNews: setLocalNews,
      onCategories: setLocalCategories,
      onNewspapers: setLocalNewspapers,
      onBreaking: setLocalBreakingNews,
      onVideos: setLocalVideos,
      onSettings: setLocalSiteSettings,
      onSocialLinks: setLocalSocialLinks,
      onComments: setLocalComments,
      onAds: setLocalAds,
      onArticleViews: setLocalArticleViews,
      onNewsTips: setLocalNewsTips,
      onSubscribers: setLocalSubscribers,
      onInquiries: setLocalInquiries,
      onPushTokenCount: setLocalPushTokenCount,
      onActivity: setLocalAdminActivity,
    });

    if (isAdmin) {
      void seedCloudIfEmpty({
        news: getNews().length > 0 ? getNews() : DEFAULT_NEWS,
        categories: getCategories().length > 0 ? getCategories() : DEFAULT_CATEGORIES,
        newspapers: getNewspapers(),
        breakingNews: getBreakingNews(),
        videos: getVideos(),
        settings: getSiteSettings() || DEFAULT_SITE_SETTINGS,
        socialLinks: getSocialLinks().length > 0 ? getSocialLinks() : DEFAULT_SOCIAL_LINKS,
      });
    }

    return () => {
      unsubPublic();
    };
  }, [isAdmin, loading]);

  useEffect(() => {
    if (!user) return;
    return subscribeUserPrivateData(user.uid, {
      onProfile: profile => {
        if (profile) setLocalUserProfile(profile);
      },
      onBookmarks: bookmarks => {
        setLocalBookmarks(bookmarks);
      },
    });
  }, [user]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const isPublicRoute = !location.pathname.startsWith('/admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-clip">
      <CloudSyncBridge />
      {isPublicRoute && (
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        {isPublicRoute && <OfflineIndicator />}
        {isPublicRoute && (
          <Header onOpenMenu={() => setIsMobileMenuOpen(true)} />
        )}
        <main className={isPublicRoute ? 'flex-grow pb-6 md:pb-8' : 'flex-grow'}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/article/:id" element={<NewsDetail />} />
            <Route path="/epaper" element={<EPaper />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/submit-tip" element={<SubmitTip />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/version" element={<AppVersion />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="news" element={<NewsManagement />} />
              <Route path="tips" element={<TipsManagement />} />
              <Route path="inquiries" element={<InquiriesManagement />} />
              <Route path="ads" element={<AdsManagement />} />
              <Route path="subscribers" element={<SubscribersManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="epaper" element={<EPaperManagement />} />
              <Route path="breaking" element={<BreakingNewsManagement />} />
              <Route path="videos" element={<VideoManagement />} />
              <Route path="comments" element={<CommentManagement />} />
              <Route path="editors" element={<EditorManagement />} />
              <Route path="settings" element={<SiteSettingsManagement />} />
            </Route>
          </Routes>
        </main>
        {isPublicRoute && <Footer />}
        {isPublicRoute && <BottomNav />}
      </div>
      <EPaperNotificationToast />
    </div>
  );
}

export default function App() {
  seedInitialData();

  useEffect(() => {
    seedInitialData();
    void initForegroundFcmListener();
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
