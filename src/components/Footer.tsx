import { Send, ArrowUpRight } from 'lucide-react';
import type { Language, SiteSettings } from '../types';
import { UI_COPY } from '../i18n/translations';

interface FooterProps {
  settings: SiteSettings;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onSecretAdmin: () => void;
}

function normalizeTelegramUrl(raw?: string): string {
  const val = (raw || '').trim();
  if (!val) return 'https://t.me/aureonmotors';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  if (val.startsWith('@')) return `https://t.me/${val.slice(1)}`;
  if (val.startsWith('t.me/')) return `https://${val}`;
  return `https://t.me/${val}`;
}

export function Footer({ settings, lang, onChangeLang, onSecretAdmin }: FooterProps) {
  const t = UI_COPY[lang];
  const note = lang === 'uz' ? settings.footer_note_uz : settings.footer_note_ru;
  const telegramHref = normalizeTelegramUrl(settings.telegram_url);

  return (
    <footer className="bg-[#0C0D10] text-stone-300 border-t border-stone-800">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-3">
            <div className="font-editorial text-2xl font-semibold text-white">
              {settings.brand_name}
            </div>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              {lang === 'uz' ? settings.address_uz : settings.address_ru}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onChangeLang('uz')}
                className={`text-xs font-semibold cursor-pointer transition-colors ${
                  lang === 'uz' ? 'text-white underline underline-offset-4' : 'text-stone-400 hover:text-white'
                }`}
              >
                O&apos;zbekcha
              </button>
              <span className="text-stone-600">/</span>
              <button
                type="button"
                onClick={() => onChangeLang('ru')}
                className={`text-xs font-semibold cursor-pointer transition-colors ${
                  lang === 'ru' ? 'text-white underline underline-offset-4' : 'text-stone-400 hover:text-white'
                }`}
              >
                Русский
              </button>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2.5 text-sm">
            <div className="text-xs font-semibold text-stone-400 mb-3">
              {t.footer.navigation}
            </div>
            <div>
              <a href="#catalog" className="hover:text-white transition-colors">
                {t.nav.catalog}
              </a>
            </div>
            <div>
              <a href="#market" className="hover:text-white transition-colors">
                {t.nav.market}
              </a>
            </div>
            <div>
              <a href="#services" className="hover:text-white transition-colors">
                {t.nav.services}
              </a>
            </div>
            <div>
              <a href="#contact" className="hover:text-white transition-colors">
                {t.nav.contact}
              </a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-3 text-sm">
            <div className="text-xs font-semibold text-stone-400 mb-3">
              {t.footer.showroom}
            </div>
            <div className="font-mono text-white tabular-nums">{settings.phone}</div>
            <div className="text-stone-400">{settings.email}</div>
            <div className="text-stone-400 text-xs">
              {t.footer.hoursLabel}: {lang === 'uz' ? settings.hours_uz : settings.hours_ru}
            </div>

            <div className="pt-2">
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-white/10 hover:bg-[#229ED9] text-white border border-white/15 hover:border-[#229ED9] text-xs font-semibold transition-colors duration-200 whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>{t.footer.telegramBtn}</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span>
            <button
              type="button"
              onClick={onSecretAdmin}
              className="cursor-default select-none bg-transparent border-0 p-0 text-inherit font-inherit"
            >
              © {new Date().getFullYear()}
            </button>{' '}
            {note}
          </span>
        </div>
      </div>
    </footer>
  );
}
