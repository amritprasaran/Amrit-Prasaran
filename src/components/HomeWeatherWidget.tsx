import { useState, useEffect, useCallback } from 'react';
import {
  Wind,
  Droplets,
  RefreshCw,
  LocateFixed,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { AppLanguage, useLanguage } from '../context/LanguageContext';
import { fetchOpenMeteoWeather } from '../utils/weather';

type WeatherLocationMode = 'both' | 'jammu' | 'srinagar' | 'current';

interface SavedCustomLocation {
  name: string;
  nameEn?: string;
  nameHi?: string;
  lat: number;
  lon: number;
}

interface CityWeather {
  key: string;
  name: string;
  nameEn?: string;
  nameHi?: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: LucideIcon;
  iconClass: string;
  updatedAt: string;
}

const MODE_STORAGE_KEY = 'amrit_weather_mode';
const CUSTOM_LOC_STORAGE_KEY = 'amrit_weather_custom_loc';

const JK_CITIES = [
  { key: 'jammu', name: 'Jammu', lat: 32.7266, lon: 74.857 },
  { key: 'srinagar', name: 'Srinagar', lat: 34.0837, lon: 74.7973 },
];

async function fetchCityWeather(
  key: string,
  name: string,
  lat: number,
  lon: number,
  options?: { localized?: { nameEn?: string; nameHi?: string }; forceRefresh?: boolean }
): Promise<CityWeather> {
  const summary = await fetchOpenMeteoWeather(lat, lon, options?.forceRefresh);
  return {
    key,
    name,
    nameEn: options?.localized?.nameEn,
    nameHi: options?.localized?.nameHi,
    temperature: summary.temperature,
    humidity: summary.humidity,
    windSpeed: summary.windSpeed,
    condition: summary.conditionKey,
    icon: summary.icon,
    iconClass: summary.iconClass,
    updatedAt: summary.updatedAt,
  };
}

async function resolveLocationName(
  lat: number,
  lon: number,
  lang: AppLanguage
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const resolved = data.city || data.locality || data.principalSubdivision || '';
    return typeof resolved === 'string' && resolved.trim() ? resolved.trim() : null;
  } catch {
    return null;
  }
}

export default function HomeWeatherWidget() {
  const { lang, t, translateDistrict, formatNumber } = useLanguage();
  const [mode, setMode] = useState<WeatherLocationMode>(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === 'jammu' || saved === 'srinagar' || saved === 'current' || saved === 'both') {
      return saved;
    }
    return 'both';
  });
  const [customLocation, setCustomLocation] = useState<SavedCustomLocation | null>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_LOC_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedCustomLocation) : null;
    } catch {
      return null;
    }
  });
  const [weatherList, setWeatherList] = useState<CityWeather[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const loadWeatherForMode = useCallback(
    async (
      targetMode: WeatherLocationMode,
      locOverride?: SavedCustomLocation | null,
      forceRefresh = false
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        if (targetMode === 'current') {
          const activeLoc = locOverride ?? customLocation;
          if (!activeLoc) {
            setWeatherList([]);
            setIsLoading(false);
            return;
          }
          const currentWeather = await fetchCityWeather(
            'current',
            activeLoc.name,
            activeLoc.lat,
            activeLoc.lon,
            {
              localized: { nameEn: activeLoc.nameEn, nameHi: activeLoc.nameHi },
              forceRefresh,
            }
          );
          setWeatherList([currentWeather]);
        } else {
          const targets =
            targetMode === 'both'
              ? JK_CITIES
              : JK_CITIES.filter(c => c.key === targetMode);
          const results = await Promise.all(
            targets.map(c =>
              fetchCityWeather(c.key, c.name, c.lat, c.lon, { forceRefresh })
            )
          );
          setWeatherList(results);
        }
      } catch {
        setError('weatherUnavailable');
      } finally {
        setIsLoading(false);
      }
    },
    [customLocation]
  );

  // Backfill localized reverse-geocoded place name when switching language in 'current' mode
  useEffect(() => {
    if (mode !== 'current' || !customLocation) return;
    const missingForLang =
      (lang === 'hi' && !customLocation.nameHi) ||
      (lang === 'en' && !customLocation.nameEn);
    if (!missingForLang) return;

    let cancelled = false;
    void resolveLocationName(customLocation.lat, customLocation.lon, lang).then(resolved => {
      if (cancelled || !resolved) return;
      setCustomLocation(prev => {
        if (!prev) return prev;
        const updated: SavedCustomLocation = {
          ...prev,
          name: prev.name || resolved,
          ...(lang === 'hi' ? { nameHi: resolved } : { nameEn: resolved }),
        };
        try {
          localStorage.setItem(CUSTOM_LOC_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore storage errors
        }
        return updated;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [lang, mode, customLocation]);

  const detectCurrentLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationNotice('locationUnsupported');
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const localizedName = await resolveLocationName(lat, lon, lang);
        const saved: SavedCustomLocation = {
          name: localizedName || '',
          ...(localizedName
            ? lang === 'hi'
              ? { nameHi: localizedName }
              : { nameEn: localizedName }
            : {}),
          lat,
          lon,
        };
        localStorage.setItem(CUSTOM_LOC_STORAGE_KEY, JSON.stringify(saved));
        localStorage.setItem(MODE_STORAGE_KEY, 'current');
        setCustomLocation(saved);
        setMode('current');
        setIsLocating(false);
        await loadWeatherForMode('current', saved, true);
      },
      err => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationNotice('locationDenied');
        } else {
          setLocationNotice('locationFailed');
        }
        setMode('both');
        localStorage.setItem(MODE_STORAGE_KEY, 'both');
        void loadWeatherForMode('both');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [lang, loadWeatherForMode]);

  useEffect(() => {
    if (mode === 'current' && !customLocation) {
      detectCurrentLocation();
    } else {
      void loadWeatherForMode(mode);
    }
  }, [mode, customLocation, detectCurrentLocation, loadWeatherForMode]);

  const handleSelectMode = (nextMode: WeatherLocationMode) => {
    setLocationNotice(null);
    if (nextMode === 'current') {
      if (customLocation) {
        setMode('current');
        localStorage.setItem(MODE_STORAGE_KEY, 'current');
      } else {
        detectCurrentLocation();
      }
      return;
    }
    setMode(nextMode);
    localStorage.setItem(MODE_STORAGE_KEY, nextMode);
  };

  return (
    <section
      aria-label={t('liveWeather')}
      className="my-3 sm:my-5 bg-white border border-slate-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        {/* Single-line Live Weather Strip */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar min-w-0">
          {(isLoading || isLocating) && weatherList.length === 0 ? (
            <div className="flex items-center gap-3 py-1">
              <div className="h-5 w-44 rounded bg-slate-100 animate-pulse" />
              <div className="h-5 w-40 rounded bg-slate-100 animate-pulse hidden sm:block" />
            </div>
          ) : error && weatherList.length === 0 ? (
            <div className="flex items-center gap-3 text-xs text-slate-600 whitespace-nowrap py-1">
              <span>{t(error)}</span>
              <button
                type="button"
                onClick={() => void loadWeatherForMode(mode, undefined, true)}
                className="text-red-700 font-semibold hover:underline shrink-0"
              >
                {t('tryAgain')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4 whitespace-nowrap">
              {weatherList.map((city, idx) => {
                const Icon = city.icon;
                const currentCityName =
                  city.key === 'current'
                    ? lang === 'hi'
                      ? city.nameHi || city.name
                      : city.nameEn || city.name
                    : city.name;
                const displayCity =
                  !currentCityName || currentCityName === 'Current Location'
                    ? t('currentLocation')
                    : translateDistrict(currentCityName);

                return (
                  <div
                    key={city.key}
                    className={`inline-flex items-center gap-2 shrink-0 ${
                      idx > 0 ? 'pl-3 sm:pl-4 border-l border-slate-200' : ''
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 ${city.iconClass}`}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-slate-900">
                      {displayCity}
                    </span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatNumber(city.temperature)}°C
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-xs text-slate-500">
                      {t(city.condition)}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-2 text-xs text-slate-400 tabular-nums ml-1">
                      <span className="inline-flex items-center gap-0.5">
                        <Droplets className="w-3 h-3" aria-hidden="true" />
                        {formatNumber(city.humidity)}%
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Wind className="w-3 h-3" aria-hidden="true" />
                        {formatNumber(city.windSpeed)} {t('kmPerHour')}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Single-line Location Selector & Refresh */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
          <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200/80">
            {(
              [
                { id: 'both', label: t('jammuAndSrinagar') },
                { id: 'jammu', label: translateDistrict('Jammu') },
                { id: 'srinagar', label: translateDistrict('Srinagar') },
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectMode(opt.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  mode === opt.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                if (mode === 'current') {
                  detectCurrentLocation();
                } else {
                  handleSelectMode('current');
                }
              }}
              disabled={isLocating}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                mode === 'current'
                  ? 'bg-white text-red-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? t('locating') : t('currentLocation')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => void loadWeatherForMode(mode, undefined, true)}
            disabled={isLoading || isLocating}
            aria-label={t('refresh')}
            title={t('refresh')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {locationNotice && (
        <div
          role="status"
          className="mt-2 pt-2 border-t border-slate-100 text-xs text-amber-800 flex items-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{t(locationNotice)}</span>
        </div>
      )}
    </section>
  );
}
