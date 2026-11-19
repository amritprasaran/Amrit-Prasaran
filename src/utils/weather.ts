import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from 'lucide-react';

export interface WeatherSummary {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditionKey: string;
  icon: LucideIcon;
  iconClass: string;
  updatedAt: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const weatherCache = new Map<string, { data: WeatherSummary; fetchedAt: number }>();
const inflightRequests = new Map<string, Promise<WeatherSummary>>();

export function decodeWeatherCode(code: number): {
  conditionKey: string;
  icon: LucideIcon;
  iconClass: string;
} {
  if (code === 0) {
    return { conditionKey: 'condClearSky', icon: Sun, iconClass: 'text-amber-500' };
  }
  if (code === 1 || code === 2) {
    return { conditionKey: 'condPartlyCloudy', icon: CloudSun, iconClass: 'text-amber-500' };
  }
  if (code === 3) {
    return { conditionKey: 'condOvercast', icon: Cloud, iconClass: 'text-slate-500' };
  }
  if (code === 45 || code === 48) {
    return { conditionKey: 'condFoggy', icon: CloudFog, iconClass: 'text-slate-400' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { conditionKey: 'condRain', icon: CloudRain, iconClass: 'text-sky-600' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { conditionKey: 'condSnowfall', icon: CloudSnow, iconClass: 'text-cyan-600' };
  }
  if (code >= 95) {
    return {
      conditionKey: 'condThunderstorm',
      icon: CloudLightning,
      iconClass: 'text-indigo-600',
    };
  }
  return { conditionKey: 'condFair', icon: CloudSun, iconClass: 'text-amber-500' };
}

export async function fetchOpenMeteoWeather(
  lat: number,
  lon: number,
  forceRefresh = false
): Promise<WeatherSummary> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const now = Date.now();

  if (!forceRefresh) {
    const cached = weatherCache.get(cacheKey);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.data;
    }
    const inflight = inflightRequests.get(cacheKey);
    if (inflight) return inflight;
  }

  const req = (async () => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const current = data.current;
    const decoded = decodeWeatherCode(Number(current?.weather_code ?? 0));
    const summary: WeatherSummary = {
      temperature: Math.round(Number(current?.temperature_2m ?? 0)),
      humidity: Math.round(Number(current?.relative_humidity_2m ?? 0)),
      windSpeed: Math.round(Number(current?.wind_speed_10m ?? 0)),
      conditionKey: decoded.conditionKey,
      icon: decoded.icon,
      iconClass: decoded.iconClass,
      updatedAt: current?.time || '',
    };
    weatherCache.set(cacheKey, { data: summary, fetchedAt: Date.now() });
    return summary;
  })();

  inflightRequests.set(cacheKey, req);
  try {
    return await req;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}
