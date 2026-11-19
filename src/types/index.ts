export interface News {
  id: string;
  title: string;
  category: string;
  district?: string;
  language?: 'hi' | 'en';
  author?: string;
  photoCaption?: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  updatedAt?: string;
  scheduledAt?: string;
  isFeatured: boolean;
  isPublished?: boolean;
  linkUrl?: string;
}

export interface Video {
  id: string;
  title: string;
  category: string;
  youtubeId: string;
  publishedAt: string;
}

export interface Newspaper {
  id: string;
  date: string;
  pdfUrl: string;
  title: string;
  pageCount?: number;
  fileSize?: number;
}

export interface Category {
  id: string;
  name: string;
  enabled?: boolean;
  order?: number;
}

export interface Comment {
  id: string;
  newsId: string;
  author: string;
  content: string;
  createdAt: string;
  status?: 'approved' | 'pending' | 'hidden';
  uid?: string;
}

export interface BreakingNewsItem {
  id: string;
  text: string;
  enabled: boolean;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  enabled: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  aboutText: string;
  tickerEnabled: boolean;
}

export interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
}

export interface UserProfile {
  uid?: string;
  name: string;
  contact: string;
  photo: string | null;
  email?: string;
  updatedAt?: string;
}

export interface Bookmark {
  newsId: string;
  title: string;
  category: string;
  imageUrl: string;
  publishedAt: string;
  savedAt: string;
}

export interface EditorInvite {
  email: string;
  name: string;
  role: 'editor' | 'admin';
  addedBy: string;
  addedAt: string;
}

export interface NewsTip {
  id: string;
  reporterName: string;
  contact: string;
  district: string;
  headline: string;
  details: string;
  photoDataUrl?: string;
  status: 'pending' | 'reviewed' | 'converted';
  createdAt: string;
  reviewedAt?: string;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source?: string;
}

export interface SponsorAd {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: 'home' | 'article' | 'epaper';
  enabled: boolean;
  createdAt: string;
}

export type InquirySubject = 'Editorial / Correction' | 'Advertisement' | 'General';

export interface ContactInquiry {
  id: string;
  name: string;
  contact: string;
  subject: InquirySubject;
  message: string;
  status: 'new' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface PushTokenRecord {
  id: string;
  token: string;
  region: string;
  epaperEnabled: boolean;
  breakingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
