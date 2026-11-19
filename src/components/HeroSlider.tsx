import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { News } from '../types';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function resolveSlideTarget(slide: News): { href: string; isExternal: boolean } {
  const custom = slide.linkUrl?.trim();
  if (!custom) {
    return { href: `/article/${slide.id}`, isExternal: false };
  }
  if (/^https?:\/\//i.test(custom)) {
    return { href: custom, isExternal: true };
  }
  return {
    href: custom.startsWith('/') ? custom : `/${custom}`,
    isExternal: false,
  };
}

export default function HeroSlider({ slides }: { slides: News[] }) {
  const { t, translateCategory } = useLanguage();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  if (slides.length === 0) return null;

  const safeIndex = index % slides.length;
  const currentSlide = slides[safeIndex];
  const { href, isExternal } = resolveSlideTarget(currentSlide);

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(prev => (prev + 1) % slides.length);
  };

  const slideContent = (
    <>
      {failedImages[currentSlide.id] ? (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-red-950" />
      ) : (
        <img
          src={currentSlide.imageUrl}
          alt={currentSlide.title}
          referrerPolicy="no-referrer"
          onError={() =>
            setFailedImages(prev => ({ ...prev, [currentSlide.id]: true }))
          }
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10 flex flex-col justify-end p-4 pb-10 sm:p-6 sm:pb-12 lg:p-8 lg:pb-12 text-white">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-red-400">
          <span>{translateCategory(currentSlide.category)}</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-300 font-normal tabular-nums">
            {safeIndex + 1} / {slides.length}
          </span>
        </div>
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold mt-1.5 leading-snug max-w-2xl line-clamp-2 text-balance group-hover:text-red-200 transition-colors">
          {currentSlide.title}
        </h2>
        <span className="mt-2 sm:mt-3 inline-flex items-center gap-1 w-fit text-xs sm:text-sm font-semibold text-white underline underline-offset-4 group-hover:text-red-300 transition-colors">
          <span>{t('readMore')}</span>
          {isExternal && <ArrowUpRight className="w-3.5 h-3.5" />}
        </span>
      </div>
    </>
  );

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative -mx-4 sm:mx-0 aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] lg:max-h-[480px] w-[calc(100%+2rem)] sm:w-full overflow-hidden rounded-none sm:rounded-2xl bg-slate-900"
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-10"
        >
          {isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={currentSlide.title}
              className="group block relative w-full h-full cursor-pointer"
            >
              {slideContent}
            </a>
          ) : (
            <Link
              to={href}
              aria-label={currentSlide.title}
              className="group block relative w-full h-full cursor-pointer"
            >
              {slideContent}
            </Link>
          )}
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label={t('previousSlide')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75 transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={t('nextSlide')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75 transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div
            className="absolute bottom-3 left-4 right-4 sm:left-6 sm:right-6 lg:left-8 lg:right-8 z-20 flex items-center gap-1.5"
            role="tablist"
            aria-label="Slide pagination"
          >
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={idx === safeIndex}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === safeIndex
                    ? 'w-7 bg-red-600'
                    : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
