import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Send,
  CheckCircle2,
  MapPin,
  X,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { JK_DISTRICTS, submitNewsTip } from '../services/dataService';
import { compressImageFileToDataUrl } from '../utils/imageCompress';
import { useLanguage } from '../context/LanguageContext';

const DISTRICTS_FOR_TIP = JK_DISTRICTS.filter(d => d !== 'All J&K');

export default function SubmitTip() {
  const { t, translateDistrict } = useLanguage();
  const [reporterName, setReporterName] = useState('');
  const [contact, setContact] = useState('');
  const [district, setDistrict] = useState('Srinagar');
  const [headline, setHeadline] = useState('');
  const [details, setDetails] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoLabel, setPhotoLabel] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTipId, setSubmittedTipId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageFileToDataUrl(file, {
        maxDim: 1200,
        quality: 0.78,
        maxLength: 320000,
      });
      setPhotoDataUrl(compressed);
      setPhotoLabel(file.name);
    } catch {
      setError(t('tipPhotoError'));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !contact.trim() || !headline.trim() || !details.trim()) {
      setError(t('tipFillRequired'));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const created = await submitNewsTip({
        reporterName,
        contact,
        district,
        headline,
        details,
        ...(photoDataUrl ? { photoDataUrl } : {}),
      });
      setSubmittedTipId(created.id);
      setReporterName('');
      setContact('');
      setHeadline('');
      setDetails('');
      setPhotoDataUrl(null);
      setPhotoLabel(null);
    } catch {
      setError(t('tipSubmitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-2xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-700 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToHome')}
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
            <ShieldAlert className="w-4 h-4" />
            {t('citizenNewsroomDesk')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {t('sendUsNewsHeading')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('sendUsNewsDesc')}
          </p>
        </div>

        {submittedTipId && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1"
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{t('tipReceivedTitle')}</span>
            </div>
            <p className="text-xs text-emerald-800">
              {t('tipRefId')} <span className="font-mono">{submittedTipId}</span>
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tip-name" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('tipYourName')}
              </label>
              <input
                id="tip-name"
                type="text"
                value={reporterName}
                onChange={e => setReporterName(e.target.value)}
                maxLength={100}
                placeholder={t('tipNamePlaceholder')}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:border-red-700 outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="tip-contact" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('tipContactLabel')}
              </label>
              <input
                id="tip-contact"
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                maxLength={100}
                placeholder={t('tipContactPlaceholder')}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:border-red-700 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="tip-district" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('tipDistrictLabel')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-red-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="tip-district"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:border-red-700 outline-none"
                >
                  {DISTRICTS_FOR_TIP.map(d => (
                    <option key={d} value={d}>{translateDistrict(d)}</option>
                  ))}
                  <option value="All J&K">{t('tipOtherAllJK')}</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tip-headline" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('tipHeadlineLabel')}
              </label>
              <input
                id="tip-headline"
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                maxLength={250}
                placeholder={t('tipHeadlinePlaceholder')}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:border-red-700 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="tip-details" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('tipDetailsLabel')}
            </label>
            <textarea
              id="tip-details"
              value={details}
              onChange={e => setDetails(e.target.value)}
              maxLength={4500}
              placeholder={t('tipDetailsPlaceholder')}
              className="w-full p-3 text-sm border border-slate-300 rounded-lg h-32 focus:border-red-700 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('tipPhotoLabel')}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-700"
              >
                <Camera className="w-4 h-4 text-red-700" />
                <span>{isCompressing ? t('compressingPhoto') : photoDataUrl ? t('changePhoto') : t('choosePhoto')}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={e => void handlePhotoSelect(e)}
                className="hidden"
              />
              {photoLabel && (
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  {photoLabel}
                </span>
              )}
              {photoDataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoDataUrl(null);
                    setPhotoLabel(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('removePhoto')}
                </button>
              )}
            </div>

            {photoDataUrl && (
              <div className="mt-3">
                <img
                  src={photoDataUrl}
                  alt="Attached tip preview"
                  className="max-h-52 rounded-lg border border-slate-200 object-cover"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? t('submittingTip') : t('submitTipBtn')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
