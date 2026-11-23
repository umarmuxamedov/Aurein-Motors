import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, Phone, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import type { AsideOffer, Car, CarCategory, Language, SiteSettings } from '../types';
import { UI_COPY } from '../i18n/translations';
import { CarImage } from './CarImage';

interface CatalogAndAsideProps {
  cars: Car[];
  offers: AsideOffer[];
  settings: SiteSettings;
  lang: Language;
  onSelectCarForBooking: (car: Car) => void;
}

type FilterCategory = 'all' | CarCategory;
type SortOption = 'year' | 'price-asc' | 'price-desc';

export function CatalogAndAside({
  cars,
  offers,
  settings,
  lang,
  onSelectCarForBooking,
}: CatalogAndAsideProps) {
  const t = UI_COPY[lang];
  const [category, setCategory] = useState<FilterCategory>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('year');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // Leasing calculator state
  const [calcPrice, setCalcPrice] = useState<number>(105000);
  const [downPercent, setDownPercent] = useState<number>(30);
  const [months, setMonths] = useState<number>(36);

  const monthlyPayment = useMemo(() => {
    const principal = calcPrice * (1 - downPercent / 100);
    const monthlyRate = 0.14 / 12;
    if (principal <= 0) return 0;
    const factor = Math.pow(1 + monthlyRate, months);
    return Math.round((principal * monthlyRate * factor) / (factor - 1));
  }, [calcPrice, downPercent, months]);

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = cars.filter((car) => {
      if (category !== 'all' && car.category !== category) return false;
      if (!q) return true;
      return (
        car.name.toLowerCase().includes(q) ||
        car.brand.toLowerCase().includes(q) ||
        String(car.year).includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price_usd - b.price_usd;
      if (sortBy === 'price-desc') return b.price_usd - a.price_usd;
      return b.year - a.year || b.id - a.id;
    });
  }, [cars, category, search, sortBy]);

  const categories: { key: FilterCategory; label: string }[] = [
    { key: 'all', label: t.catalog.allCategories },
    { key: 'sedan', label: t.categories.sedan },
    { key: 'suv', label: t.categories.suv },
    { key: 'electric', label: t.categories.electric },
    { key: 'coupe', label: t.categories.coupe },
  ];

  const formatUsd = (amount: number) =>
    '$' + amount.toLocaleString('en-US');

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* MAIN CATALOG SECTION */}
        <section id="catalog" className="lg:col-span-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200" data-aos="fade-up">
            <div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-stone-950 tracking-tight">
                {t.catalog.heading}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl">
                {t.catalog.subheading}
              </p>
            </div>
            <div className="font-mono text-xs text-stone-500 tabular-nums whitespace-nowrap shrink-0">
              {filteredCars.length} {t.catalog.countSuffix}
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="mt-6 flex flex-col gap-4" data-aos="fade-up" data-aos-delay="50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Interactive category segmented buttons */}
              <div
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-stone-200/70 rounded-lg"
                role="tablist"
                aria-label={t.catalog.heading}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={category === cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      category === cat.key
                        ? 'bg-white text-stone-950 shadow-xs'
                        : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-stone-500" aria-hidden="true" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort"
                  className="bg-white border border-stone-200 rounded-md px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-700 cursor-pointer"
                >
                  <option value="year">{t.catalog.sortNewest}</option>
                  <option value="price-asc">{t.catalog.sortPriceAsc}</option>
                  <option value="price-desc">{t.catalog.sortPriceDesc}</option>
                </select>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.catalog.searchPlaceholder}
                className="w-full bg-white border border-stone-200 rounded-md pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Vehicle Grid or Empty State */}
          {filteredCars.length === 0 ? (
            <div className="mt-10 bg-white border border-stone-200 rounded-lg p-12 text-center">
              <p className="font-editorial text-xl font-semibold text-stone-900">
                {t.catalog.emptyTitle}
              </p>
              <p className="mt-2 text-sm text-stone-500">{t.catalog.emptyHint}</p>
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setSearch('');
                }}
                className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-stone-950 hover:bg-red-800 rounded-md transition-colors cursor-pointer"
              >
                {t.catalog.resetFilters}
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCars.map((car, index) => {
                const power = lang === 'uz' ? car.power_uz : car.power_ru;
                const transmission = lang === 'uz' ? car.transmission_uz : car.transmission_ru;
                const statusLabel = t.carStatuses[car.status] || car.status;
                const statusTone =
                  car.status === 'available'
                    ? 'text-emerald-800'
                    : car.status === 'reserved'
                    ? 'text-amber-800'
                    : 'text-stone-500';

                return (
                  <article
                    key={car.id}
                    data-aos="fade-up"
                    data-aos-delay={(index % 4) * 60}
                    className="group bg-white border border-stone-200 rounded-lg overflow-hidden card-lift hover:border-stone-300 flex flex-col"
                  >
                    {/* 4:3 Studio Vehicle Photograph */}
                    <button
                      type="button"
                      onClick={() => setSelectedCar(car)}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                    >
                      <CarImage
                        src={car.image_url}
                        alt={`${car.brand} ${car.name}`}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </button>

                    {/* Clean Card Content — Zero Pill Discipline */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                          <span className="font-medium text-stone-600">
                            {car.brand} · {t.categories[car.category]} · <span className="tabular-nums">{car.year}</span>
                          </span>
                          <span className={`font-semibold whitespace-nowrap ${statusTone}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <h3 className="mt-2 font-editorial text-xl font-semibold text-stone-950 leading-snug">
                          {car.name}
                        </h3>

                        <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                          {power} · {transmission}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                        <div className="font-mono text-lg font-semibold text-stone-950 tabular-nums">
                          {formatUsd(car.price_usd)}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedCar(car)}
                            className="px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-950 border border-stone-200 hover:border-stone-400 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {t.catalog.detailsBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectCarForBooking(car)}
                            className="px-3.5 py-2 text-xs font-semibold text-white bg-stone-950 hover:bg-[#B91C1C] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {t.catalog.bookBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* SEMANTIC ASIDE SIDEBAR */}
        <aside
          id="services"
          aria-label={t.aside.heading}
          className="lg:col-span-4 lg:sticky lg:top-24 space-y-8"
          data-aos="fade-up"
          data-aos-delay="120"
        >
          {/* Editable Showroom Highlights (from SQLite aside_offers) */}
          <div className="bg-white border border-stone-200 rounded-lg p-6">
            <p className="text-xs font-semibold text-red-800 tracking-wide">
              {t.aside.kicker}
            </p>
            <h3 className="mt-1.5 font-editorial text-2xl font-semibold text-stone-950">
              {t.aside.heading}
            </h3>

            <div className="mt-5 divide-y divide-stone-200">
              {offers.map((offer) => (
                <div key={offer.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="text-sm font-semibold text-stone-950">
                      {lang === 'uz' ? offer.title_uz : offer.title_ru}
                    </h4>
                    {offer.metric_text && (
                      <span className="font-mono text-xs font-semibold text-red-800 tabular-nums shrink-0">
                        {offer.metric_text}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                    {lang === 'uz' ? offer.summary_uz : offer.summary_ru}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Leasing Calculator */}
          <div className="bg-white border border-stone-200 rounded-lg p-6">
            <h3 className="font-editorial text-xl font-semibold text-stone-950">
              {t.aside.calcTitle}
            </h3>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-stone-600">{t.aside.calcVehiclePrice}</span>
                  <span className="font-mono font-semibold text-stone-950 tabular-nums">
                    {formatUsd(calcPrice)}
                  </span>
                </div>
                <input
                  type="range"
                  min={40000}
                  max={250000}
                  step={2500}
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value))}
                  className="w-full accent-[#B91C1C] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-stone-600">{t.aside.calcDownPayment}</span>
                  <span className="font-mono font-semibold text-stone-950 tabular-nums">
                    {downPercent}% ({formatUsd(Math.round((calcPrice * downPercent) / 100))})
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={70}
                  step={5}
                  value={downPercent}
                  onChange={(e) => setDownPercent(Number(e.target.value))}
                  className="w-full accent-[#B91C1C] cursor-pointer"
                />
              </div>

              <div>
                <span className="block text-xs text-stone-600 mb-2">{t.aside.calcTerm}</span>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-md">
                  {[12, 24, 36, 48].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonths(m)}
                      className={`py-1.5 font-mono text-xs font-semibold rounded transition-colors cursor-pointer tabular-nums ${
                        months === m
                          ? 'bg-white text-stone-950 shadow-xs'
                          : 'text-stone-600 hover:text-stone-950'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200">
                <div className="text-xs text-stone-500">{t.aside.calcMonthly}</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-semibold text-stone-950 tabular-nums">
                    {formatUsd(monthlyPayment)}
                  </span>
                  <span className="text-xs text-stone-500">{t.aside.calcPerMonth}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">{t.aside.calcAnnualRate}</p>
              </div>
            </div>
          </div>

          {/* Direct Showroom Info */}
          <div className="bg-[#111216] text-stone-100 rounded-lg p-6 space-y-3">
            <h4 className="font-editorial text-lg font-semibold text-white">
              {t.aside.directTitle}
            </h4>
            <div className="text-xs text-stone-300 flex items-start gap-2.5 leading-relaxed">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <span>{lang === 'uz' ? settings.address_uz : settings.address_ru}</span>
            </div>
            <div className="text-xs text-stone-300 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{lang === 'uz' ? settings.hours_uz : settings.hours_ru}</span>
            </div>
            <div className="pt-2">
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-between w-full px-4 py-2.5 bg-white text-stone-950 hover:bg-stone-200 rounded-md text-xs font-semibold transition-colors"
              >
                <span className="inline-flex items-center gap-2 font-mono tabular-nums">
                  <Phone className="w-3.5 h-3.5" />
                  {settings.phone}
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Vehicle Specification Modal */}
      {selectedCar && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedCar(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedCar.name}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full overflow-hidden border border-stone-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] bg-stone-100">
              <CarImage
                src={selectedCar.image_url}
                alt={selectedCar.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedCar(null)}
                aria-label={t.catalog.close}
                className="absolute top-4 right-4 w-9 h-9 rounded-md bg-white/95 text-stone-900 hover:bg-white flex items-center justify-center shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-stone-500">
                    {selectedCar.brand} · {t.categories[selectedCar.category]} · {selectedCar.year}
                  </div>
                  <h3 className="mt-1 font-editorial text-2xl sm:text-3xl font-semibold text-stone-950">
                    {selectedCar.name}
                  </h3>
                </div>
                <div className="font-mono text-2xl font-semibold text-stone-950 tabular-nums">
                  {formatUsd(selectedCar.price_usd)}
                </div>
              </div>

              <p className="mt-4 text-sm sm:text-base text-stone-700 leading-relaxed">
                {lang === 'uz' ? selectedCar.description_uz : selectedCar.description_ru}
              </p>

              <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-200 text-xs">
                <div>
                  <dt className="text-stone-500">{t.catalog.powerLabel}</dt>
                  <dd className="mt-1 font-semibold text-stone-950">
                    {lang === 'uz' ? selectedCar.power_uz : selectedCar.power_ru}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t.catalog.accelerationLabel}</dt>
                  <dd className="mt-1 font-mono font-semibold text-stone-950 tabular-nums">
                    {selectedCar.acceleration || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t.catalog.transmissionLabel}</dt>
                  <dd className="mt-1 font-semibold text-stone-950">
                    {lang === 'uz' ? selectedCar.transmission_uz : selectedCar.transmission_ru}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t.catalog.fuelLabel}</dt>
                  <dd className="mt-1 font-semibold text-stone-950">
                    {lang === 'uz' ? selectedCar.fuel_uz : selectedCar.fuel_ru}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t.catalog.colorLabel}</dt>
                  <dd className="mt-1 font-semibold text-stone-950">
                    {lang === 'uz' ? selectedCar.color_uz : selectedCar.color_ru}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t.admin.carsTab.colStatus}</dt>
                  <dd className="mt-1 font-semibold text-stone-950">
                    {t.carStatuses[selectedCar.status]}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCar(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-700 border border-stone-200 hover:border-stone-400 rounded-md cursor-pointer"
                >
                  {t.catalog.close}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedCar;
                    setSelectedCar(null);
                    onSelectCarForBooking(target);
                  }}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md transition-colors cursor-pointer"
                >
                  {t.hero.secondaryAction}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
