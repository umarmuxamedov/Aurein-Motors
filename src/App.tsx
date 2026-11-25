import { useCallback, useEffect, useState } from 'react';
import AOS from 'aos';
import type { Car, Language, MarketItem, StorefrontPayload } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CatalogAndAside } from './components/CatalogAndAside';
import { MarketSection } from './components/MarketSection';
import { ShowroomSection } from './components/ShowroomSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';

function isAdminRoute(): boolean {
  return (
    window.location.pathname === '/admin' ||
    window.location.pathname === '/admin/' ||
    window.location.hash === '#admin' ||
    new URLSearchParams(window.location.search).has('admin')
  );
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('aureon_lang');
    return saved === 'ru' ? 'ru' : 'uz';
  });
  const [view, setView] = useState<'storefront' | 'admin'>(() =>
    isAdminRoute() ? 'admin' : 'storefront'
  );
  const [data, setData] = useState<StorefrontPayload | null>(null);
  const [error, setError] = useState('');
  const [bookingCar, setBookingCar] = useState<{ car: Car; ts: number } | null>(null);
  const [bookingMarketItem, setBookingMarketItem] = useState<{ item: MarketItem; ts: number } | null>(null);

  const openAdmin = useCallback(() => {
    window.history.pushState({}, '', '/admin');
    setView('admin');
  }, []);

  const loadStorefront = useCallback(async () => {
    try {
      const res = await fetch('/api/storefront');
      if (!res.ok) throw new Error('Failed to load storefront');
      const payload: StorefrontPayload = await res.json();
      setData(payload);
      setError('');
    } catch {
      setError('Server bilan aloqa uzildi / Ошибка загрузки данных');
    }
  }, []);

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  useEffect(() => {
    const onRouteChange = () => {
      setView(isAdminRoute() ? 'admin' : 'storefront');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        openAdmin();
      }
    };
    window.addEventListener('popstate', onRouteChange);
    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
      window.removeEventListener('hashchange', onRouteChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openAdmin]);

  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
    });
  }, []);

  useEffect(() => {
    if (data && view === 'storefront') {
      setTimeout(() => AOS.refresh(), 50);
    }
  }, [data, lang, view]);

  const handleChangeLang = (next: Language) => {
    setLang(next);
    localStorage.setItem('aureon_lang', next);
    document.documentElement.lang = next;
  };

  const handleSelectCarForBooking = (car: Car) => {
    setBookingCar({ car, ts: Date.now() });
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectMarketItem = (item: MarketItem) => {
    setBookingMarketItem({ item, ts: Date.now() });
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExitAdmin = () => {
    window.history.pushState({}, '', '/');
    setView('storefront');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-editorial text-2xl text-stone-900">{error}</p>
        <button
          type="button"
          onClick={loadStorefront}
          className="mt-4 px-5 py-2.5 text-xs font-semibold text-white bg-stone-950 rounded-md cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-950 rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <AdminPanel
        lang={lang}
        onChangeLang={handleChangeLang}
        onExit={handleExitAdmin}
        onDataChanged={loadStorefront}
        initialSettings={data.settings}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-stone-950">
      <Navbar brandName={data.settings.brand_name} lang={lang} />

      <main className="flex-1">
        <HeroSection
          settings={data.settings}
          lang={lang}
          onChangeLang={handleChangeLang}
          onBookTestDrive={scrollToContact}
        />

        <CatalogAndAside
          cars={data.cars}
          offers={data.offers}
          settings={data.settings}
          lang={lang}
          onSelectCarForBooking={handleSelectCarForBooking}
        />

        <MarketSection
          items={data.marketItems || []}
          lang={lang}
          onOrderItem={handleSelectMarketItem}
        />

        <ShowroomSection settings={data.settings} lang={lang} />

        <ContactSection
          cars={data.cars}
          marketItems={data.marketItems || []}
          lang={lang}
          preselectedCar={bookingCar}
          preselectedMarketItem={bookingMarketItem}
        />
      </main>

      <Footer
        settings={data.settings}
        lang={lang}
        onChangeLang={handleChangeLang}
        onSecretAdmin={openAdmin}
      />
    </div>
  );
}
