import {
  News,
  Video,
  Newspaper,
  Category,
  Comment,
  BreakingNewsItem,
  SocialLink,
  SiteSettings,
  ActivityItem,
  UserProfile,
  Bookmark,
  NewsTip,
  Subscriber,
  SponsorAd,
  ContactInquiry,
  InquirySubject,
} from '../types';
import { auth } from '../firebase';
import {
  emitDataUpdated,
  pushNewsToCloud,
  pushCategoriesToCloud,
  pushNewspapersToCloud,
  pushBreakingToCloud,
  pushVideosToCloud,
  pushSiteSettingsToCloud,
  pushSocialLinksToCloud,
  pushAdsToCloud,
  pushActivityToCloud,
  createCommentInCloud,
  updateCommentStatusInCloud,
  deleteCommentInCloud,
  pushUserProfileToCloud,
  pushBookmarkToCloud,
  deleteBookmarkFromCloud,
  incrementArticleViewInCloud,
  submitNewsTipInCloud,
  updateNewsTipStatusInCloud,
  deleteNewsTipInCloud,
  createSubscriberInCloud,
  deleteSubscriberInCloud,
  createInquiryInCloud,
  updateInquiryStatusInCloud,
  deleteInquiryInCloud,
} from './cloudSync';

const NEWS_KEY = 'amrit_news';
const VIDEO_KEY = 'amrit_videos';
const PDF_KEY = 'amrit_pdfs';
const CATEGORY_KEY = 'amrit_categories';
const BREAKING_KEY = 'amrit_breaking_news';
const SOCIAL_KEY = 'amrit_social_links';
const SETTINGS_KEY = 'amrit_site_settings';
const ACTIVITY_KEY = 'amrit_admin_activity';
const ALL_COMMENTS_KEY = 'amrit_all_comments';
const USER_PROFILE_KEY = 'amrit_user_profile';
const BOOKMARKS_KEY = 'amrit_bookmarks';
const ARTICLE_VIEWS_KEY = 'amrit_article_views';
const NEWS_TIPS_KEY = 'amrit_news_tips';
const SUBSCRIBERS_KEY = 'amrit_subscribers';
const ADS_KEY = 'amrit_sponsor_ads';
const INQUIRIES_KEY = 'amrit_inquiries';
const PUSH_COUNT_KEY = 'amrit_push_count';

export const DEFAULT_LOGO_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-02_at_1.52.27_PM_2e1aaa34.jpeg';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Local', enabled: true, order: 1 },
  { id: '2', name: 'National', enabled: true, order: 2 },
  { id: '3', name: 'Politics', enabled: true, order: 3 },
  { id: '4', name: 'Business', enabled: true, order: 4 },
  { id: '5', name: 'Sports', enabled: true, order: 5 },
  { id: '6', name: 'Education', enabled: true, order: 6 },
  { id: '7', name: 'International', enabled: true, order: 7 },
  { id: '8', name: 'Entertainment', enabled: true, order: 8 },
  { id: '9', name: 'Technology', enabled: true, order: 9 },
  { id: '10', name: 'Health', enabled: true, order: 10 },
];

export const JK_DISTRICTS = [
  'All J&K',
  'Srinagar',
  'Jammu',
  'Rajouri',
  'Poonch',
  'Baramulla',
  'Leh',
  'Anantnag',
  'Kathua',
  'Udhampur',
];

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { id: '1', platform: 'YouTube', url: 'https://youtube.com', enabled: true },
  { id: '2', platform: 'Facebook', url: 'https://facebook.com', enabled: true },
  { id: '3', platform: 'Instagram', url: 'https://instagram.com', enabled: true },
  { id: '4', platform: 'X', url: 'https://x.com', enabled: true },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'AMRIT PRASARAN',
  tagline: 'जम्मू-कश्मीर की आवाज़ · Digital News',
  logoUrl: DEFAULT_LOGO_URL,
  contactEmail: 'amritprasaran@gmail.com',
  contactPhone: '+91 194 000 0000',
  aboutText:
    'Amrit Prasaran - J&K News is a premier digital news platform dedicated to providing accurate, timely, and unbiased news to the people of Jammu & Kashmir.',
  tickerEnabled: true,
};

export const isNewsVisibleToPublic = (article: News, nowMs = Date.now()): boolean => {
  if (article.isPublished === false) return false;
  if (!article.scheduledAt) return true;
  const scheduledMs = new Date(article.scheduledAt).getTime();
  if (Number.isNaN(scheduledMs)) return true;
  return scheduledMs <= nowMs;
};

export const logAdminActivity = (action: string) => {
  const existing = getAdminActivity();
  const item: ActivityItem = {
    id: Date.now().toString(),
    action,
    timestamp: new Date().toISOString(),
  };
  const next = [item, ...existing].slice(0, 15);
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
  emitDataUpdated('activity');
  void pushActivityToCloud(item);
};

export const setLocalAdminActivity = (items: ActivityItem[]) => {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(items));
  emitDataUpdated('activity');
};

export const getAdminActivity = (): ActivityItem[] => {
  const data = localStorage.getItem(ACTIVITY_KEY);
  return data ? JSON.parse(data) : [];
};

export const getNews = (): News[] => {
  const data = localStorage.getItem(NEWS_KEY);
  return data ? JSON.parse(data) : [];
};

export const setLocalNews = (news: News[]) => {
  localStorage.setItem(NEWS_KEY, JSON.stringify(news));
  emitDataUpdated('news');
};

export const saveNews = (news: News[]) => {
  setLocalNews(news);
  void pushNewsToCloud(news).catch(err => console.error('Cloud news sync failed:', err));
};

export const getVideos = (): Video[] => {
  const data = localStorage.getItem(VIDEO_KEY);
  return data ? JSON.parse(data) : [];
};

export const setLocalVideos = (videos: Video[]) => {
  localStorage.setItem(VIDEO_KEY, JSON.stringify(videos));
  emitDataUpdated('videos');
};

export const saveVideos = (videos: Video[]) => {
  setLocalVideos(videos);
  void pushVideosToCloud(videos).catch(err => console.error('Cloud videos sync failed:', err));
};

export const getNewspapers = (): Newspaper[] => {
  const data = localStorage.getItem(PDF_KEY);
  return data ? JSON.parse(data) : [];
};

export const setLocalNewspapers = (pdfs: Newspaper[]) => {
  localStorage.setItem(PDF_KEY, JSON.stringify(pdfs));
  emitDataUpdated('newspapers');
};

export const saveNewspapers = (pdfs: Newspaper[]) => {
  setLocalNewspapers(pdfs);
  void pushNewspapersToCloud(pdfs).catch(err => console.error('Cloud epaper sync failed:', err));
};

export const getCategories = (): Category[] => {
  const data = localStorage.getItem(CATEGORY_KEY);
  const list: Category[] = data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  return [...list].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
};

export const setLocalCategories = (categories: Category[]) => {
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
  emitDataUpdated('categories');
};

export const saveCategories = (categories: Category[]) => {
  setLocalCategories(categories);
  void pushCategoriesToCloud(categories).catch(err => console.error('Cloud categories sync failed:', err));
};

export const getBreakingNews = (): BreakingNewsItem[] => {
  const data = localStorage.getItem(BREAKING_KEY);
  if (data) return JSON.parse(data);
  const news = getNews().filter(n => isNewsVisibleToPublic(n));
  return news.slice(0, 5).map(n => ({
    id: n.id,
    text: n.title,
    enabled: true,
  }));
};

export const setLocalBreakingNews = (items: BreakingNewsItem[]) => {
  localStorage.setItem(BREAKING_KEY, JSON.stringify(items));
  emitDataUpdated('breakingNews');
};

export const saveBreakingNews = (items: BreakingNewsItem[]) => {
  setLocalBreakingNews(items);
  void pushBreakingToCloud(items).catch(err => console.error('Cloud breaking sync failed:', err));
};

export const getSocialLinks = (): SocialLink[] => {
  const data = localStorage.getItem(SOCIAL_KEY);
  return data ? JSON.parse(data) : DEFAULT_SOCIAL_LINKS;
};

export const setLocalSocialLinks = (links: SocialLink[]) => {
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(links));
  emitDataUpdated('socialLinks');
};

export const saveSocialLinks = (links: SocialLink[]) => {
  setLocalSocialLinks(links);
  void pushSocialLinksToCloud(links).catch(err => console.error('Cloud social sync failed:', err));
};

export const getSiteSettings = (): SiteSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(data) } : DEFAULT_SITE_SETTINGS;
};

export const setLocalSiteSettings = (settings: SiteSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  emitDataUpdated('siteSettings');
};

export const saveSiteSettings = (settings: SiteSettings) => {
  setLocalSiteSettings(settings);
  void pushSiteSettingsToCloud(settings).catch(err => console.error('Cloud settings sync failed:', err));
};

// Sponsor Ads
export const getAds = (): SponsorAd[] => {
  const raw = localStorage.getItem(ADS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SponsorAd[];
  } catch {
    return [];
  }
};

export const setLocalAds = (ads: SponsorAd[]) => {
  localStorage.setItem(ADS_KEY, JSON.stringify(ads));
  emitDataUpdated('ads');
};

export const saveAds = (ads: SponsorAd[]) => {
  setLocalAds(ads);
  void pushAdsToCloud(ads).catch(err => console.error('Cloud ads sync failed:', err));
};

// Newsletter Subscribers
export const getSubscribers = (): Subscriber[] => {
  const raw = localStorage.getItem(SUBSCRIBERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Subscriber[];
  } catch {
    return [];
  }
};

export const setLocalSubscribers = (subs: Subscriber[]) => {
  localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subs));
  emitDataUpdated('subscribers');
};

export const subscribeToNewsletter = async (email: string, source = 'footer'): Promise<Subscriber> => {
  const cleanEmail = email.trim().toLowerCase().slice(0, 150);
  const sub: Subscriber = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: cleanEmail,
    subscribedAt: new Date().toISOString(),
    source,
  };
  await createSubscriberInCloud(sub);
  const existing = getSubscribers();
  if (!existing.some(s => s.email === cleanEmail)) {
    setLocalSubscribers([sub, ...existing]);
  }
  return sub;
};

export const deleteSubscriber = (subId: string) => {
  setLocalSubscribers(getSubscribers().filter(s => s.id !== subId));
  void deleteSubscriberInCloud(subId).catch(err =>
    console.error('Cloud subscriber delete failed:', err)
  );
};

// Contact & Advertising Inquiries
export const getInquiries = (): ContactInquiry[] => {
  const raw = localStorage.getItem(INQUIRIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ContactInquiry[];
  } catch {
    return [];
  }
};

export const setLocalInquiries = (inquiries: ContactInquiry[]) => {
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
  emitDataUpdated('inquiries');
};

export const submitContactInquiry = async (input: {
  name: string;
  contact: string;
  subject: InquirySubject;
  message: string;
}): Promise<ContactInquiry> => {
  const inquiry: ContactInquiry = {
    id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim().slice(0, 100),
    contact: input.contact.trim().slice(0, 150),
    subject: input.subject,
    message: input.message.trim().slice(0, 3000),
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  await createInquiryInCloud(inquiry);
  setLocalInquiries([inquiry, ...getInquiries()]);
  return inquiry;
};

export const updateInquiryStatus = (inquiryId: string, status: 'new' | 'resolved') => {
  const next = getInquiries().map(item =>
    item.id === inquiryId
      ? { ...item, status, resolvedAt: new Date().toISOString() }
      : item
  );
  setLocalInquiries(next);
  void updateInquiryStatusInCloud(inquiryId, status).catch(err =>
    console.error('Cloud inquiry update failed:', err)
  );
};

export const deleteInquiry = (inquiryId: string) => {
  setLocalInquiries(getInquiries().filter(i => i.id !== inquiryId));
  void deleteInquiryInCloud(inquiryId).catch(err =>
    console.error('Cloud inquiry delete failed:', err)
  );
};

// Push Token Count
export const getPushTokenCount = (): number => {
  const raw = localStorage.getItem(PUSH_COUNT_KEY);
  return raw ? Number(raw) || 0 : 0;
};

export const setLocalPushTokenCount = (count: number) => {
  localStorage.setItem(PUSH_COUNT_KEY, String(count));
  emitDataUpdated('pushTokens');
};

// Article View Counters
export const getArticleViews = (): Record<string, number> => {
  const raw = localStorage.getItem(ARTICLE_VIEWS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
};

export const setLocalArticleViews = (views: Record<string, number>) => {
  localStorage.setItem(ARTICLE_VIEWS_KEY, JSON.stringify(views));
  emitDataUpdated('views');
};

export const incrementArticleView = (newsId: string) => {
  if (!newsId) return;
  const sessionKey = `amrit_viewed_${newsId}`;
  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
  } catch {
    // ignore sessionStorage availability
  }
  const current = getArticleViews();
  const next = {
    ...current,
    [newsId]: (current[newsId] || 0) + 1,
  };
  setLocalArticleViews(next);
  void incrementArticleViewInCloud(newsId);
};

// Citizen News Tips
export const getNewsTips = (): NewsTip[] => {
  const raw = localStorage.getItem(NEWS_TIPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as NewsTip[];
  } catch {
    return [];
  }
};

export const setLocalNewsTips = (tips: NewsTip[]) => {
  localStorage.setItem(NEWS_TIPS_KEY, JSON.stringify(tips));
  emitDataUpdated('tips');
};

export const submitNewsTip = async (
  input: Omit<NewsTip, 'id' | 'status' | 'createdAt'>
): Promise<NewsTip> => {
  const tip: NewsTip = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reporterName: input.reporterName.trim().slice(0, 100),
    contact: input.contact.trim().slice(0, 100),
    district: input.district.trim().slice(0, 80) || 'All J&K',
    headline: input.headline.trim().slice(0, 250),
    details: input.details.trim().slice(0, 5000),
    ...(input.photoDataUrl ? { photoDataUrl: input.photoDataUrl } : {}),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await submitNewsTipInCloud(tip);
  const existing = getNewsTips();
  setLocalNewsTips([tip, ...existing]);
  return tip;
};

export const updateNewsTipStatus = (
  tipId: string,
  status: 'pending' | 'reviewed' | 'converted'
) => {
  const next = getNewsTips().map(t =>
    t.id === tipId ? { ...t, status, reviewedAt: new Date().toISOString() } : t
  );
  setLocalNewsTips(next);
  void updateNewsTipStatusInCloud(tipId, status).catch(err =>
    console.error('Cloud tip update failed:', err)
  );
};

export const deleteNewsTip = (tipId: string) => {
  const next = getNewsTips().filter(t => t.id !== tipId);
  setLocalNewsTips(next);
  void deleteNewsTipInCloud(tipId).catch(err =>
    console.error('Cloud tip delete failed:', err)
  );
};

// Comments (unified flat cache + legacy per-article compatibility)
function readAllCachedComments(): Comment[] {
  const flatData = localStorage.getItem(ALL_COMMENTS_KEY);
  if (flatData) {
    return JSON.parse(flatData);
  }
  const merged: Comment[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('amrit_comments_')) {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]') as Comment[];
        list.forEach(c => merged.push({ ...c, status: c.status || 'approved' }));
      } catch {
        // ignore invalid json
      }
    }
  }
  if (merged.length > 0) {
    localStorage.setItem(ALL_COMMENTS_KEY, JSON.stringify(merged));
  }
  return merged;
}

export const getAllComments = (): Comment[] => {
  return readAllCachedComments();
};

export const setLocalComments = (comments: Comment[]) => {
  const existing = readAllCachedComments();
  const finalList = comments.length > 0 ? comments : existing;
  localStorage.setItem(ALL_COMMENTS_KEY, JSON.stringify(finalList));
  emitDataUpdated('comments');
};

export const getComments = (newsId: string): Comment[] => {
  return readAllCachedComments().filter(
    c => c.newsId === newsId && c.status !== 'hidden'
  );
};

export const addComment = (newsId: string, comment: Comment) => {
  const normalized: Comment = {
    ...comment,
    newsId,
    status: 'approved',
  };
  const all = readAllCachedComments();
  all.push(normalized);
  localStorage.setItem(ALL_COMMENTS_KEY, JSON.stringify(all));
  emitDataUpdated('comments');
  void createCommentInCloud(normalized).catch(err =>
    console.error('Cloud comment submit failed:', err)
  );
};

export const updateCommentModeration = (
  commentId: string,
  status: 'approved' | 'hidden'
) => {
  const all = readAllCachedComments().map(c =>
    c.id === commentId ? { ...c, status } : c
  );
  localStorage.setItem(ALL_COMMENTS_KEY, JSON.stringify(all));
  emitDataUpdated('comments');
  void updateCommentStatusInCloud(commentId, status).catch(err =>
    console.error('Cloud comment status update failed:', err)
  );
};

export const deleteComment = (commentId: string) => {
  const all = readAllCachedComments().filter(c => c.id !== commentId);
  localStorage.setItem(ALL_COMMENTS_KEY, JSON.stringify(all));
  emitDataUpdated('comments');
  void deleteCommentInCloud(commentId).catch(err =>
    console.error('Cloud comment delete failed:', err)
  );
};

// User Profile & Saved Bookmarks
export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Amrit Reader',
  contact: '+91 99999 99999',
  photo: null,
};

export const getUserProfile = (): UserProfile => {
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return DEFAULT_USER_PROFILE;
  try {
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
};

export const setLocalUserProfile = (profile: UserProfile) => {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  emitDataUpdated('profile');
};

export const saveUserProfile = async (profile: UserProfile) => {
  const next: UserProfile = {
    ...profile,
    uid: auth.currentUser?.uid,
    email: auth.currentUser?.email || profile.email,
    updatedAt: new Date().toISOString(),
  };
  setLocalUserProfile(next);
  if (auth.currentUser) {
    await pushUserProfileToCloud(auth.currentUser.uid, next);
  }
};

export const getBookmarks = (): Bookmark[] => {
  const raw = localStorage.getItem(BOOKMARKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const setLocalBookmarks = (bookmarks: Bookmark[]) => {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  emitDataUpdated('bookmarks');
};

export const isArticleBookmarked = (newsId: string): boolean => {
  return getBookmarks().some(b => b.newsId === newsId);
};

export const toggleArticleBookmark = (article: News): boolean => {
  const current = getBookmarks();
  const exists = current.some(b => b.newsId === article.id);

  if (exists) {
    const next = current.filter(b => b.newsId !== article.id);
    setLocalBookmarks(next);
    if (auth.currentUser) {
      void deleteBookmarkFromCloud(auth.currentUser.uid, article.id).catch(err =>
        console.error('Cloud bookmark delete failed:', err)
      );
    }
    return false;
  }

  const created: Bookmark = {
    newsId: article.id,
    title: article.title,
    category: article.category,
    imageUrl: article.imageUrl,
    publishedAt: article.publishedAt,
    savedAt: new Date().toISOString(),
  };
  const next = [created, ...current];
  setLocalBookmarks(next);
  if (auth.currentUser) {
    void pushBookmarkToCloud(auth.currentUser.uid, created).catch(err =>
      console.error('Cloud bookmark save failed:', err)
    );
  }
  return true;
};

export const removeBookmarkById = (newsId: string) => {
  const next = getBookmarks().filter(b => b.newsId !== newsId);
  setLocalBookmarks(next);
  if (auth.currentUser) {
    void deleteBookmarkFromCloud(auth.currentUser.uid, newsId).catch(err =>
      console.error('Cloud bookmark delete failed:', err)
    );
  }
};
