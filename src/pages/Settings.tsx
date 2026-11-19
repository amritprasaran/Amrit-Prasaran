import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCircle2, AlertCircle, Newspaper, Languages, Smartphone } from 'lucide-react';
import { getNewspapers } from '../services/dataService';
import { useLanguage } from '../context/LanguageContext';
import PWAInstallButton from '../components/PWAInstallButton';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  BREAKING_NOTIF_KEY,
  isEPaperPushEnabled,
  setEPaperPushEnabled,
  requestPushPermission,
  triggerEPaperPushNotification,
} from '../utils/notifications';
import { syncDevicePushRegistration, PushSyncResult } from '../utils/fcm';

const REGION_STORAGE_KEY = 'breaking_news_region';

type SettingsFeedback =
  | { kind: 'breaking-on'; region: string }
  | { kind: 'breaking-off' }
  | { kind: 'breaking-blocked' }
  | { kind: 'epaper-on' }
  | { kind: 'epaper-off' }
  | { kind: 'epaper-blocked' }
  | { kind: 'region-updated'; region: string }
  | { kind: 'test-sent' }
  | { kind: 'test-preview'; region: string }
  | { kind: 'epaper-sent'; title: string }
  | { kind: 'epaper-inapp'; title: string };

export default function Settings() {
  const navigate = useNavigate();
  const { t, translateDistrict } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [epaperEnabled, setEpaperEnabled] = useState(false);
  const [region, setRegion] = useState('All Jammu & Kashmir');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushSync, setPushSync] = useState<PushSyncResult | null>(null);
  const [feedback, setFeedback] = useState<SettingsFeedback | null>(null);

  useEffect(() => {
    const pref = localStorage.getItem(BREAKING_NOTIF_KEY) === 'true';
    const epaperPref = isEPaperPushEnabled();
    const savedRegion = localStorage.getItem(REGION_STORAGE_KEY) || 'All Jammu & Kashmir';
    setEnabled(pref);
    setEpaperEnabled(epaperPref);
    setRegion(savedRegion);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if ((pref || epaperPref) && Notification.permission === 'granted') {
        void syncDevicePushRegistration({
          region: savedRegion,
          epaperEnabled: epaperPref,
          breakingEnabled: pref,
        })
          .then(setPushSync)
          .catch(() => undefined);
      }
    } else {
      setPermission('unsupported');
    }
  }, []);

  const syncPushPrefs = async (nextBreaking: boolean, nextEpaper: boolean, nextRegion: string) => {
    try {
      const result = await syncDevicePushRegistration({
        region: nextRegion,
        epaperEnabled: nextEpaper,
        breakingEnabled: nextBreaking,
      });
      setPushSync(result);
    } catch {
      // Keep local notification preferences active even if cloud push registration fails
    }
  };

  const handleToggle = async () => {
    const newState = !enabled;
    let nextFeedback: SettingsFeedback = newState
      ? { kind: 'breaking-on', region }
      : { kind: 'breaking-off' };

    if (newState) {
      const result = await requestPushPermission();
      setPermission(result);
      if (result === 'denied') {
        nextFeedback = { kind: 'breaking-blocked' };
      }
    }

    setEnabled(newState);
    localStorage.setItem(BREAKING_NOTIF_KEY, newState.toString());
    await syncPushPrefs(newState, epaperEnabled, region);
    setFeedback(nextFeedback);
  };

  const handleEpaperToggle = async () => {
    const newState = !epaperEnabled;
    let nextFeedback: SettingsFeedback = newState
      ? { kind: 'epaper-on' }
      : { kind: 'epaper-off' };

    if (newState) {
      const result = await requestPushPermission();
      setPermission(result);
      if (result === 'denied') {
        nextFeedback = { kind: 'epaper-blocked' };
      }
    }

    setEpaperEnabled(newState);
    setEPaperPushEnabled(newState);
    await syncPushPrefs(enabled, newState, region);
    setFeedback(nextFeedback);
  };

  const handleRegionChange = (nextRegion: string) => {
    setRegion(nextRegion);
    localStorage.setItem(REGION_STORAGE_KEY, nextRegion);
    if (enabled || epaperEnabled) {
      void syncPushPrefs(enabled, epaperEnabled, nextRegion);
      setFeedback({ kind: 'region-updated', region: nextRegion });
    }
  };

  const sendTestAlert = () => {
    const regionLabel = translateDistrict(region);
    const title = `${t('testAlertTitlePrefix')} (${regionLabel})`;
    const body = t('testAlertBody');

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
      setFeedback({ kind: 'test-sent' });
    } else {
      setFeedback({ kind: 'test-preview', region });
    }
  };

  const sendTestEPaperAlert = () => {
    const papers = getNewspapers().sort((a, b) => b.date.localeCompare(a.date));
    const latest = papers[0] || {
      id: '1',
      title: 'अमृत प्रसारण (Amrit Prasaran)',
      date: new Date().toISOString().split('T')[0],
      pageCount: 4,
    };
    const sentNative = triggerEPaperPushNotification(latest, {
      forceBrowser: true,
      onNavigate: url => navigate(url),
    });
    setFeedback(
      sentNative
        ? { kind: 'epaper-sent', title: latest.title }
        : { kind: 'epaper-inapp', title: latest.title }
    );
  };

  const permissionLabel =
    permission === 'granted'
      ? t('permGranted')
      : permission === 'denied'
        ? t('permDenied')
        : permission === 'unsupported'
          ? t('permUnsupported')
          : t('permDefault');

  const feedbackText = feedback
    ? (() => {
        switch (feedback.kind) {
          case 'breaking-on':
            return `${t('fbBreakingOn')} (${translateDistrict(feedback.region)}).`;
          case 'breaking-off':
            return t('fbBreakingOff');
          case 'breaking-blocked':
            return t('fbBreakingBlocked');
          case 'epaper-on':
            return t('fbEpaperOn');
          case 'epaper-off':
            return t('fbEpaperOff');
          case 'epaper-blocked':
            return t('fbEpaperBlocked');
          case 'region-updated':
            return `${t('fbRegionUpdated')} ${translateDistrict(feedback.region)}.`;
          case 'test-sent':
            return t('fbTestSent');
          case 'test-preview':
            return `${t('fbTestPreview')} — ${t('testAlertTitlePrefix')} (${translateDistrict(
              feedback.region
            )}): ${t('testAlertBody')}`;
          case 'epaper-sent':
            return `${t('fbEpaperSent')} "${feedback.title}".`;
          case 'epaper-inapp':
            return `${t('fbEpaperInApp')} "${feedback.title}".`;
        }
      })()
    : null;

  const regions = ['All Jammu & Kashmir', 'Kashmir Valley', 'Jammu Division', 'Ladakh'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('userSettings')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('userSettingsDesc')}
        </p>
      </div>

      {/* Language & App Install Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-lg space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t('displayLanguage')}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {t('displayLanguageDesc')}
              </p>
            </div>
          </div>
          <LanguageSwitcher variant="full" />
        </div>

        <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t('mobileOfflineApp')}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {t('mobileOfflineAppDesc')}
              </p>
            </div>
          </div>
          <PWAInstallButton variant="settings" />
        </div>
      </div>

      {/* Breaking News Alerts Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-lg space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 shrink-0">
              {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="jk-alerts-label" className="text-base font-semibold text-slate-900">
                {t('jkBreakingAlerts')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {t('jkBreakingAlertsDesc')}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <span>{t('statusLabel')} {enabled ? t('subscribedStatus') : t('offStatus')}</span>
                {permission !== 'unsupported' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t('browserPermission')} {permissionLabel}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby="jk-alerts-label"
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 ${
              enabled ? 'bg-red-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <label htmlFor="jk-region-select" className="block text-sm font-medium text-slate-700 mb-2">
            {t('alertRegionFocus')}
          </label>
          <select
            id="jk-region-select"
            value={region}
            onChange={e => handleRegionChange(e.target.value)}
            disabled={!enabled}
            className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
          >
            {regions.map(r => (
              <option key={r} value={r}>
                {translateDistrict(r)}
              </option>
            ))}
          </select>
        </div>

        {enabled && (
          <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-600">
              {t('verifyBreakingAlerts')}
            </span>
            <button
              type="button"
              onClick={sendTestAlert}
              className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {t('sendTestAlert')}
            </button>
          </div>
        )}
      </div>

      {/* E-Paper Upload Push Notifications Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-lg space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 id="epaper-alerts-label" className="text-base font-semibold text-slate-900">
                {t('epaperPushTitle')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {t('epaperPushDesc')}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <span>{t('statusLabel')} {epaperEnabled ? t('subscribedStatus') : t('offStatus')}</span>
                {permission !== 'unsupported' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t('browserPermission')} {permissionLabel}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={epaperEnabled}
            aria-labelledby="epaper-alerts-label"
            onClick={handleEpaperToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 ${
              epaperEnabled ? 'bg-red-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                epaperEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {epaperEnabled && (
          <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-600">
              {t('testEPaperAlertsDesc')}
            </span>
            <button
              type="button"
              onClick={sendTestEPaperAlert}
              className="px-4 py-2 text-sm font-medium bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors whitespace-nowrap shrink-0"
            >
              {t('testEPaperAlert')}
            </button>
          </div>
        )}
      </div>

      {pushSync && (
        <div className="bg-white border border-slate-200 px-5 py-3.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            {t('devicePushChannel')}{' '}
            <strong className="text-slate-900">
              {pushSync.registered
                ? pushSync.mode === 'fcm'
                  ? t('fcmChannel')
                  : t('swChannel')
                : t('notRegistered')}
            </strong>
          </span>
          {pushSync.tokenPreview && (
            <span className="font-mono text-slate-400">ID: {pushSync.tokenPreview}...</span>
          )}
        </div>
      )}

      {feedbackText && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700"
        >
          {permission === 'denied' ? (
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          )}
          <span>{feedbackText}</span>
        </div>
      )}
    </div>
  );
}
