import type { Language, SiteSettings } from '../types';
import { UI_COPY } from '../i18n/translations';

interface ShowroomSectionProps {
  settings: SiteSettings;
  lang: Language;
}

export function ShowroomSection({ settings, lang }: ShowroomSectionProps) {
  const t = UI_COPY[lang].about;
  const title = lang === 'uz' ? settings.about_title_uz : settings.about_title_ru;
  const body = lang === 'uz' ? settings.about_body_uz : settings.about_body_ru;

  const stats = [
    {
      value: settings.stat_1_value,
      label: lang === 'uz' ? settings.stat_1_label_uz : settings.stat_1_label_ru,
    },
    {
      value: settings.stat_2_value,
      label: lang === 'uz' ? settings.stat_2_label_uz : settings.stat_2_label_ru,
    },
    {
      value: settings.stat_3_value,
      label: lang === 'uz' ? settings.stat_3_label_uz : settings.stat_3_label_ru,
    },
  ];

  return (
    <section
      id="about"
      className="bg-[#111216] text-stone-100 py-20 sm:py-24 border-y border-stone-800"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Editorial narrative */}
          <div className="lg:col-span-6" data-aos="fade-up">
            <p className="text-xs font-medium tracking-wide text-stone-400 mb-3">
              {t.kicker}
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold leading-tight text-white [text-wrap:balance]">
              {title}
            </h2>
            <p className="mt-5 text-base sm:text-lg text-stone-300 leading-relaxed max-w-xl">
              {body}
            </p>
          </div>

          {/* Adjacent quantitative proof metrics */}
          <div
            className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-8 pt-2 lg:pt-8 border-t lg:border-t-0 lg:border-l border-stone-800 lg:pl-12"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="font-mono text-3xl sm:text-4xl font-semibold text-white tabular-nums tracking-tight">
                  {stat.value}
                </div>
                <p className="text-sm text-stone-400 leading-snug">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
