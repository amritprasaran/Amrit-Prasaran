import { Link } from 'react-router-dom';
import {
  MapPin,
  Flag,
  Landmark,
  Briefcase,
  Trophy,
  GraduationCap,
  Globe,
  Film,
  Cpu,
  HeartPulse,
  Tag,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { News } from '../types';
import { useLanguage } from '../context/LanguageContext';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  local: MapPin,
  national: Flag,
  politics: Landmark,
  business: Briefcase,
  sports: Trophy,
  education: GraduationCap,
  international: Globe,
  entertainment: Film,
  technology: Cpu,
  health: HeartPulse,
};

interface TopCategoriesProps {
  categories: string[];
  news: News[];
}

export default function TopCategories({ categories, news }: TopCategoriesProps) {
  const { t, translateCategory, formatNumber } = useLanguage();
  if (categories.length === 0) return null;

  const countByCategory = news.reduce<Record<string, number>>((acc, item) => {
    const key = item.category.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="my-6 sm:my-8" aria-labelledby="top-categories-heading">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="top-categories-heading" className="text-xl sm:text-2xl font-bold text-slate-900">
            {t('topCategories')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('topCategoriesSub')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {categories.map(name => {
          const key = name.toLowerCase();
          const Icon = CATEGORY_ICON_MAP[key] || Tag;
          const count = countByCategory[key] || 0;

          return (
            <Link
              key={name}
              to={`/category/${encodeURIComponent(key)}`}
              className="group bg-white border border-slate-200 hover:border-red-300 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 transition-all hover:shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 group-hover:bg-red-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 group-hover:text-red-700 truncate transition-colors">
                  {translateCategory(name)}
                </span>
                <span className="block text-xs text-slate-500 tabular-nums">
                  {formatNumber(count)} {count === 1 ? t('story') : t('stories')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-700 shrink-0 transition-colors" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
