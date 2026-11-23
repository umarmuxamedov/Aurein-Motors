import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { Language } from '../types';
import { UI_COPY } from '../i18n/translations';

interface NavbarProps {
  brandName: string;
  lang: Language;
}

export function Navbar({ brandName, lang }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = UI_COPY[lang].nav;

  const links = [
    { href: '#catalog', label: t.catalog },
    { href: '#market', label: t.market },
    { href: '#services', label: t.services },
    { href: '#contact', label: t.contact },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F4]/95 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#hero"
          className="font-editorial text-xl sm:text-2xl font-semibold tracking-tight text-stone-950 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 rounded-sm"
        >
          {brandName}
        </a>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-underline text-sm font-medium text-stone-700 hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 rounded-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action (No admin link visible to ordinary visitors) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#contact"
            className="hidden md:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wide text-white bg-stone-950 hover:bg-[#B91C1C] transition-colors duration-200 rounded-md whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            {t.primaryCta}
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 text-stone-800 hover:bg-stone-200/60 rounded-md transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#F8F7F4] px-4 py-4 space-y-3">
          <nav aria-label="Mobile" className="flex flex-col space-y-2">
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm font-medium text-stone-800 hover:text-red-700 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="block w-full text-center py-2.5 px-4 text-sm font-semibold text-white bg-stone-950 hover:bg-[#B91C1C] rounded-md transition-colors"
          >
            {t.primaryCta}
          </a>
        </div>
      )}
    </header>
  );
}
