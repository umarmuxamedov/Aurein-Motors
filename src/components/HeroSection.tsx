import { ArrowRight, Globe } from 'lucide-react';
import type { Language, SiteSettings } from '../types';
import { UI_COPY } from '../i18n/translations';
import { CarImage } from './CarImage';

interface HeroSectionProps {
  settings: SiteSettings;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onBookTestDrive: () => void;
}

export function HeroSection({
  settings,
  lang,
  onChangeLang,
  onBookTestDrive,
}: HeroSectionProps) {
  const title = lang === 'uz' ? settings.hero_title_uz : settings.hero_title_ru;
  const subtitle = lang === 'uz' ? settings.hero_subtitle_uz : settings.hero_subtitle_ru;
  const cta = lang === 'uz' ? settings.hero_cta_uz : settings.hero_cta_ru;
  const t = UI_COPY[lang].hero;

  return (
    <section
      id="hero"
      className="relative bg-[#0C0D10] text-white overflow-hidden"
    >
      <div className="relative min-h-[540px] lg:min-h-[640px] flex flex-col justify-between">
        {/* Background 16:9 showroom photography */}
        <div className="absolute inset-0">
          <CarImage
            src={settings.hero_image}
            alt={settings.brand_name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0D10]/90 via-[#0C0D10]/65 to-[#0C0D10]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D10]/85 via-transparent to-[#0C0D10]/40" />
        </div>

        {/* Hero Top Toolbar: Language Switcher (UZ | RU) */}
        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-8 pt-6 flex items-center justify-between gap-4">
          <div className="text-xs tracking-wide text-stone-300 font-medium">
            {lang === 'uz' ? settings.address_uz : settings.address_ru}
          </div>

          <div
            className="inline-flex items-center gap-1 p-1 rounded-md bg-black/55 backdrop-blur-md border border-white/15"
            role="group"
            aria-label={t.languageLabel}
          >
            <Globe className="w-3.5 h-3.5 text-stone-300 ml-2 mr-1" aria-hidden="true" />
            <button
              type="button"
              onClick={() => onChangeLang('uz')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'uz'
                  ? 'bg-white text-stone-950'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              O&apos;zbekcha
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('ru')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'ru'
                  ? 'bg-white text-stone-950'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              Русский
            </button>
          </div>
        </div>

        {/* Hero Main Content — Zero-latency immediate availability */}
        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-8 py-16 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="font-editorial text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold leading-[1.1] tracking-tight text-white [text-wrap:balance]">
              {title}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-stone-200 leading-relaxed max-w-xl font-normal tracking-[0.01em]">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>{cta}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onBookTestDrive}
                className="inline-flex items-center px-6 py-3.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-sm rounded-md transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {t.secondaryAction}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
