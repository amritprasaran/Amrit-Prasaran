import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app } from '../firebase';
import { upsertPushTokenInCloud } from '../services/cloudSync';
import { dispatchSystemNotification } from './notifications';

const PUSH_DEVICE_ID_KEY = 'amrit_push_device_id';
const PUSH_CREATED_AT_KEY = 'amrit_push_created_at';
const FCM_TOKEN_KEY = 'amrit_fcm_token';

function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(PUSH_DEVICE_ID_KEY);
  if (existing && /^[a-zA-Z0-9_-]+$/.test(existing)) return existing;
  const generated = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem(PUSH_DEVICE_ID_KEY, generated);
  return generated;
}

export interface PushSyncResult {
  registered: boolean;
  mode: 'fcm' | 'service-worker' | 'denied';
  tokenPreview?: string;
}

export async function syncDevicePushRegistration(options: {
  region: string;
  epaperEnabled: boolean;
  breakingEnabled: boolean;
}): Promise<PushSyncResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { registered: false, mode: 'denied' };
  }

  if (Notification.permission !== 'granted') {
    return { registered: false, mode: 'denied' };
  }

  const deviceId = getOrCreateDeviceId();
  const createdAt =
    localStorage.getItem(PUSH_CREATED_AT_KEY) || new Date().toISOString();
  localStorage.setItem(PUSH_CREATED_AT_KEY, createdAt);

  let resolvedToken = localStorage.getItem(FCM_TOKEN_KEY) || '';
  let mode: 'fcm' | 'service-worker' = 'service-worker';

  try {
    const supported = await isSupported();
    if (supported && 'serviceWorker' in navigator) {
      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw-push.js'));
      const messaging = getMessaging(app);
      const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim();

      if (vapidKey) {
        const fcmToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: reg,
        });
        if (fcmToken) {
          resolvedToken = fcmToken;
          localStorage.setItem(FCM_TOKEN_KEY, fcmToken);
          mode = 'fcm';
        }
      }
    }
  } catch {
    // Graceful fallback when VAPID key or FCM push channel is not enabled in dev iframe
  }

  if (!resolvedToken) {
    resolvedToken = `sw_${deviceId}`;
  } else if (!resolvedToken.startsWith('sw_')) {
    mode = 'fcm';
  }

  await upsertPushTokenInCloud({
    id: deviceId,
    token: resolvedToken,
    region: options.region || 'All Jammu & Kashmir',
    epaperEnabled: options.epaperEnabled,
    breakingEnabled: options.breakingEnabled,
    createdAt,
    updatedAt: new Date().toISOString(),
  });

  return {
    registered: true,
    mode,
    tokenPreview: resolvedToken.slice(0, 14),
  };
}

let foregroundBound = false;

export async function initForegroundFcmListener(): Promise<void> {
  if (foregroundBound || typeof window === 'undefined') return;
  try {
    const supported = await isSupported();
    if (!supported) return;
    foregroundBound = true;
    const messaging = getMessaging(app);
    onMessage(messaging, payload => {
      const title =
        payload.notification?.title || 'AMRIT PRASARAN · Breaking & E-Paper Alert';
      const body =
        payload.notification?.body || 'New edition or breaking J&K news is available.';
      const targetUrl = payload.data?.url || '/';
      void dispatchSystemNotification(title, {
        body,
        url: targetUrl,
      });
    });
  } catch {
    // Ignore unsupported browser contexts
  }
}
