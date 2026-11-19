import { useState, useEffect } from 'react';
import { Mail, Phone, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import InfoPage from './InfoPage';
import { getSiteSettings, submitContactInquiry } from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { InquirySubject } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

function useSyncedSiteSettings() {
  const [settings, setSettings] = useState(() => getSiteSettings());
  useEffect(() => {
    const sync = () => setSettings(getSiteSettings());
    window.addEventListener(DATA_UPDATED_EVENT, sync);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, sync);
  }, []);
  return settings;
}

export const About = () => {
  const { t, getLocalizedAboutText } = useLanguage();
  const settings = useSyncedSiteSettings();
  return <InfoPage title={t('aboutUsTitle')} content={getLocalizedAboutText(settings.aboutText)} />;
};

const INQUIRY_SUBJECTS: { value: InquirySubject; labelKey: string }[] = [
  { value: 'Editorial / Correction', labelKey: 'subjEditorial' },
  { value: 'Advertisement', labelKey: 'subjAd' },
  { value: 'General', labelKey: 'subjGeneral' },
];

export const Contact = () => {
  const { t } = useLanguage();
  const settings = useSyncedSiteSettings();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState<InquirySubject>('Editorial / Correction');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) {
      setError(t('inquiryFillRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitContactInquiry({ name, contact, subject, message });
      setSubmitted(true);
      setName('');
      setContact('');
      setMessage('');
    } catch {
      setError(t('inquirySubmitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('contactUsTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('contactUsDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-50 text-red-700 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-semibold uppercase text-slate-500">{t('newsroomEmail')}</h2>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-sm font-semibold text-slate-900 hover:text-red-700 break-all"
                >
                  {settings.contactEmail}
                </a>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-50 text-red-700 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-semibold uppercase text-slate-500">{t('phoneHelpline')}</h2>
                <a
                  href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}
                  className="text-sm font-semibold text-slate-900 hover:text-red-700"
                >
                  {settings.contactPhone}
                </a>
              </div>
            </div>
          </div>
        </aside>

        <section className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{t('sendMessageTitle')}</h2>

          {submitted ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('inquiryReceived')}</span>
              </div>
              <p className="text-sm text-emerald-700">
                {t('inquiryReceivedDesc')}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold"
              >
                {t('sendAnotherMsg')}
              </button>
            </div>
          ) : (
            <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inq-name" className="block text-xs font-semibold text-slate-600 mb-1">
                    {t('inquiryNameLabel')}
                  </label>
                  <input
                    id="inq-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('inquiryNamePlaceholder')}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="inq-contact" className="block text-xs font-semibold text-slate-600 mb-1">
                    {t('inquiryPhoneEmail')}
                  </label>
                  <input
                    id="inq-contact"
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder={t('inquiryContactPlaceholder')}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inq-subject" className="block text-xs font-semibold text-slate-600 mb-1">
                  {t('inquiryTopic')}
                </label>
                <select
                  id="inq-subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value as InquirySubject)}
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {INQUIRY_SUBJECTS.map(item => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="inq-message" className="block text-xs font-semibold text-slate-600 mb-1">
                  {t('inquiryMsgLabel')}
                </label>
                <textarea
                  id="inq-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t('inquiryMsgPlaceholder')}
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-lg h-32"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? t('sendingBtn') : t('sendMessageBtn')}</span>
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export const Privacy = () => {
  const { t } = useLanguage();
  return <InfoPage title={t('privacyTitle')} content={t('privacyBody')} />;
};

export const Terms = () => {
  const { t } = useLanguage();
  return <InfoPage title={t('termsTitle')} content={t('termsBody')} />;
};

export const AppVersion = () => {
  const { t } = useLanguage();
  return <InfoPage title={t('appVersionTitle')} content="Amrit Prasaran v1.0.0" />;
};
