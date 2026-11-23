import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Language, MarketCategory, MarketItem } from '../types';
import { UI_COPY } from '../i18n/translations';
import { CarImage } from './CarImage';

interface MarketSectionProps {
  items: MarketItem[];
  lang: Language;
  onOrderItem: (item: MarketItem) => void;
}

type MarketFilter = 'all' | MarketCategory;

export function MarketSection({ items, lang, onOrderItem }: MarketSectionProps) {
  const t = UI_COPY[lang];
  const [category, setCategory] = useState<MarketFilter>('all');

  const filtered = useMemo(() => {
    if (category === 'all') return items;
    return items.filter((item) => item.category === category);
  }, [items, category]);

  const categories: { key: MarketFilter; label: string }[] = [
    { key: 'all', label: t.market.allCategories },
    { key: 'wheels', label: t.marketCategories.wheels },
    { key: 'charging', label: t.marketCategories.charging },
    { key: 'accessories', label: t.marketCategories.accessories },
    { key: 'care', label: t.marketCategories.care },
  ];

  return (
    <section
      id="market"
      className="py-20 sm:py-24 bg-[#F1EFEA] border-t border-stone-200"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-stone-200"
          data-aos="fade-up"
        >
          <div>
            <p className="text-xs font-semibold text-red-800 tracking-wide">
              {t.market.kicker}
            </p>
            <h2 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-stone-950 tracking-tight">
              {t.market.heading}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl">
              {t.market.subheading}
            </p>
          </div>

          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-stone-200/70 rounded-lg self-start md:self-auto"
            role="tablist"
            aria-label={t.market.heading}
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
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 bg-white border border-stone-200 rounded-lg p-12 text-center text-sm text-stone-500">
            {t.market.empty}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, idx) => {
              const title = lang === 'uz' ? item.title_uz : item.title_ru;
              const desc = lang === 'uz' ? item.description_uz : item.description_ru;

              return (
                <article
                  key={item.id}
                  data-aos="fade-up"
                  data-aos-delay={(idx % 3) * 70}
                  className="group bg-white border border-stone-200 rounded-lg overflow-hidden card-lift hover:border-stone-300 flex flex-col"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    <CarImage
                      src={item.image_url}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                        <span className="font-medium text-stone-600">
                          {t.marketCategories[item.category]} · <span className="font-mono">{item.sku}</span>
                        </span>
                        <span className="font-mono tabular-nums text-stone-700 font-medium">
                          {item.stock > 0
                            ? `${t.market.inStock} ${item.stock} ${t.market.unitSuffix}`
                            : t.market.outOfStock}
                        </span>
                      </div>

                      <h3 className="mt-2 font-editorial text-xl font-semibold text-stone-950 leading-snug">
                        {title}
                      </h3>

                      <p className="mt-2 text-xs text-stone-600 leading-relaxed line-clamp-2">
                        {desc}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                      <span className="font-mono text-lg font-semibold text-stone-950 tabular-nums">
                        ${item.price_usd.toLocaleString('en-US')}
                      </span>

                      <button
                        type="button"
                        onClick={() => onOrderItem(item)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-950 hover:bg-[#B91C1C] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{t.market.orderBtn}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
