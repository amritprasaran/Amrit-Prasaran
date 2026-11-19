import { Newspaper } from '../types';
import { DEFAULT_LOGO_URL, getSiteSettings } from '../services/dataService';

export const BREAKING_NOTIF_KEY = 'breaking_news_notifications';
export const EPAPER_NOTIF_KEY = 'epaper_push_notifications';
export const LATEST_EPAPER_ALERT_KEY = 'amrit_latest_epaper_alert';
export const NEW_EPAPER_EVENT = 'amrit:new-epaper';

export interface EPaperNotificationPayload {
  id: string;
  title: string;
  date: string;
  pageCount?: number;
  sentAt: string;
}

export function isEPaperPushEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(EPAPER_NOTIF_KEY) === 'true';
}

export function setEPaperPushEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EPAPER_NOTIF_KEY, enabled ? 'true' : 'false');
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function dispatchSystemNotification(
  title: string,
  options: NotificationOptions & { url?: string; onNavigate?: (url: string) => void }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const targetUrl = options.url || '/';

  // Prefer Service Worker registration notifications so background clicks focus/open app cleanly
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, {
          ...options,
          icon: options.icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: { url: targetUrl },
        });
        return true;
      }
    } catch {
      // Fallback to standard Notification API
    }
  }

  const notification = new Notification(title, {
    ...options,
    icon: options.icon || '/pwa-192x192.png',
  });
  notification.onclick = () => {
    window.focus();
    if (options.onNavigate) {
      options.onNavigate(targetUrl);
    } else {
      window.location.href = targetUrl;
    }
    notification.close();
  };
  return true;
}

export function triggerEPaperPushNotification(
  paper: Pick<Newspaper, 'id' | 'title' | 'date' | 'pageCount'>,
  options?: { forceBrowser?: boolean; onNavigate?: (url: string) => void }
): boolean {
  const payload: EPaperNotificationPayload = {
    id: paper.id,
    title: paper.title,
    date: paper.date,
    pageCount: paper.pageCount,
    sentAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LATEST_EPAPER_ALERT_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent<EPaperNotificationPayload>(NEW_EPAPER_EVENT, { detail: payload }));
  }

  const subscribed = isEPaperPushEnabled() || Boolean(options?.forceBrowser);
  if (
    subscribed &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    const settings = getSiteSettings();
    let isHindi = false;
    try {
      isHindi = localStorage.getItem('amrit_ui_lang') === 'hi';
    } catch {
      isHindi = false;
    }

    const pagesText = paper.pageCount
      ? isHindi
        ? ` (${paper.pageCount} पृष्ठ)`
        : ` (${paper.pageCount} ${paper.pageCount === 1 ? 'Page' : 'Pages'})`
      : '';
    const targetUrl = `/epaper?id=${encodeURIComponent(paper.id)}&fullscreen=1`;
    const notifTitle = isHindi
      ? `नया ई-पेपर अपलोड · ${settings.siteName}`
      : `New E-Paper Uploaded · ${settings.siteName}`;
    const notifBody = isHindi
      ? `${paper.title}${pagesText} अब पढ़ने के लिए उपलब्ध है।`
      : `${paper.title}${pagesText} is now ready to read.`;

    void dispatchSystemNotification(notifTitle, {
      body: notifBody,
      icon: settings.logoUrl || DEFAULT_LOGO_URL,
      tag: `epaper-${paper.id}`,
      url: targetUrl,
      onNavigate: options?.onNavigate,
    });
    return true;
  }

  return false;
}
