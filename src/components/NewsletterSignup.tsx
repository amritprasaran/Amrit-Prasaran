import { useState } from 'react';
import { subscribeToNewsletter } from '../services/dataService';
import { useLanguage } from '../context/LanguageContext';

export default function NewsletterSignup() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'subscribing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean || !clean.includes('@')) return;

    setStatus('subscribing');
    setErrorMsg(null);
    try {
      await subscribeToNewsletter(clean, 'footer');
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg(t('subscribeError'));
    }
  };

  return (
    <div className="bg-slate-800 p-5 sm:p-6 rounded-lg text-white">
      <h3 className="font-bold text-base sm:text-lg mb-1.5">{t('newsletterTitle')}</h3>
      <p className="text-xs sm:text-sm text-slate-300 mb-4">
        {t('newsletterDesc')}
      </p>
      {status === 'success' ? (
        <div className="space-y-2">
          <p className="text-emerald-400 text-sm font-semibold">
            {t('subscribeSuccess')}
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="text-xs text-slate-300 hover:text-white underline"
          >
            {t('subscribeAnother')}
          </button>
        </div>
      ) : (
        <form onSubmit={e => void handleSubmit(e)} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 min-w-0 bg-white px-3 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-red-600"
              required
            />
            <button
              type="submit"
              disabled={status === 'subscribing'}
              className="bg-red-700 hover:bg-red-800 disabled:opacity-50 transition-colors px-5 py-2.5 rounded-lg text-sm font-semibold text-white whitespace-nowrap shrink-0"
            >
              {status === 'subscribing' ? t('joiningBtn') : t('joinBtn')}
            </button>
          </div>
          {status === 'error' && errorMsg && (
            <p className="text-xs text-red-300">{errorMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}
