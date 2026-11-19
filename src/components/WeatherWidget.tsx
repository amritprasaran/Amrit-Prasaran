import { useEffect, useState } from 'react';
import { CloudSun, Sun, CloudSnow, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchOpenMeteoWeather } from '../utils/weather';

interface StripCity {
  city: string;
  lat: number;
  lon: number;
  temp: number;
  icon: LucideIcon;
  iconClass: string;
}

const INITIAL_CITIES: StripCity[] = [
  { city: 'Srinagar', lat: 34.0837, lon: 74.7973, temp: 12, icon: CloudSun, iconClass: 'text-amber-500' },
  { city: 'Jammu', lat: 32.7266, lon: 74.857, temp: 22, icon: Sun, iconClass: 'text-amber-500' },
  { city: 'Leh', lat: 34.1526, lon: 77.5771, temp: 2, icon: CloudSnow, iconClass: 'text-cyan-600' },
];

export default function WeatherWidget() {
  const { translateDistrict, formatNumber } = useLanguage();
  const [cities, setCities] = useState<StripCity[]>(INITIAL_CITIES);

  useEffect(() => {
    let active = true;
    void Promise.all(
      INITIAL_CITIES.map(async item => {
        try {
          const live = await fetchOpenMeteoWeather(item.lat, item.lon);
          return {
            ...item,
            temp: live.temperature,
            icon: live.icon,
            iconClass: live.iconClass,
          };
        } catch {
          return item;
        }
      })
    ).then(updated => {
      if (active) setCities(updated);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-slate-50/90 text-slate-600 text-xs py-1.5 border-b border-slate-200/80">
      <div className="container mx-auto px-4 flex items-center gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        {cities.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={c.city} className="inline-flex items-center gap-3 shrink-0">
              {idx > 0 && (
                <span aria-hidden="true" className="text-slate-300 select-none">
                  ·
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${c.iconClass}`} aria-hidden="true" />
                <span className="font-medium text-slate-700">{translateDistrict(c.city)}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatNumber(c.temp)}°C
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
