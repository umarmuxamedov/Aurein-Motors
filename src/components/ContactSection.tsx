import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { Car, Language, MarketItem, RequestType } from '../types';
import { UI_COPY } from '../i18n/translations';

interface ContactSectionProps {
  cars: Car[];
  marketItems: MarketItem[];
  lang: Language;
  preselectedCar: { car: Car; ts: number } | null;
  preselectedMarketItem: { item: MarketItem; ts: number } | null;
}

export function ContactSection({
  cars,
  marketItems,
  lang,
  preselectedCar,
  preselectedMarketItem,
}: ContactSectionProps) {
  const t = UI_COPY[lang];
  const c = t.contact;

  const [requestType, setRequestType] = useState<RequestType>('test-drive');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [carId, setCarId] = useState<string>('');
  const [marketItemName, setMarketItemName] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState('');
  const [budgetUsd, setBudgetUsd] = useState('');
  const [tradeInInfo, setTradeInInfo] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedCar) {
      setSubmitted(false);
      setCarId(String(preselectedCar.car.id));
      setRequestType('purchase');
    }
  }, [preselectedCar]);

  useEffect(() => {
    if (preselectedMarketItem) {
      setSubmitted(false);
      const item = preselectedMarketItem.item;
      const title = lang === 'uz' ? item.title_uz : item.title_ru;
      setMarketItemName(`${item.sku} — ${title}`);
      setRequestType('market');
    }
  }, [preselectedMarketItem, lang]);

  const selectedCarObj = cars.find((item) => String(item.id) === carId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (customerName.trim().length < 2 || phone.trim().length < 7) {
      setError(c.validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          request_type: requestType,
          car_id: selectedCarObj ? selectedCarObj.id : null,
          car_name: selectedCarObj
            ? `${selectedCarObj.brand} ${selectedCarObj.name} ($${selectedCarObj.price_usd.toLocaleString('en-US')})`
            : '',
          market_item_name: marketItemName,
          preferred_date: preferredDate,
          budget_usd: budgetUsd.trim(),
          trade_in_info: tradeInInfo.trim(),
          message: message.trim(),
          lang,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
      setCustomerName('');
      setPhone('');
      setEmail('');
      setCity('');
      setCarId('');
      setMarketItemName('');
      setPreferredDate('');
      setBudgetUsd('');
      setTradeInInfo('');
      setMessage('');
    } catch {
      setError(c.serverError);
    } finally {
      setSubmitting(false);
    }
  };

  const requestTypes: RequestType[] = ['test-drive', 'purchase', 'market', 'trade-in'];

  return (
    <section id="contact" className="py-20 sm:py-24 bg-[#F8F7F4]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4" data-aos="fade-up">
            <p className="text-xs font-semibold text-red-800 tracking-wide">
              {c.kicker}
            </p>
            <h2 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-stone-950 leading-tight [text-wrap:balance]">
              {c.heading}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed max-w-md">
              {c.subheading}
            </p>
          </div>

          <div className="lg:col-span-8" data-aos="fade-up" data-aos-delay="100">
            {submitted ? (
              <div className="bg-white border border-stone-200 rounded-lg p-8 sm:p-10">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                <h3 className="mt-4 font-editorial text-2xl font-semibold text-stone-950">
                  {c.successTitle}
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  {c.successBody}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-4 py-2 text-xs font-semibold text-stone-900 border border-stone-300 hover:border-stone-500 rounded-md cursor-pointer"
                >
                  {c.sendAnother}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 space-y-5"
              >
                {/* Selected Order Summary Banner */}
                {(selectedCarObj || marketItemName) && (
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-md flex items-center justify-between gap-3 text-xs">
                    <div className="text-stone-800">
                      <span className="font-semibold text-red-800">{c.selectedBanner}:</span>{' '}
                      <span className="font-medium">
                        {[
                          selectedCarObj
                            ? `${selectedCarObj.brand} ${selectedCarObj.name} ($${selectedCarObj.price_usd.toLocaleString('en-US')})`
                            : '',
                          marketItemName,
                        ]
                          .filter(Boolean)
                          .join(' + ')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCarId('');
                        setMarketItemName('');
                      }}
                      aria-label={c.clearSelection}
                      className="text-stone-500 hover:text-stone-900 p-1 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Request Type Segmented Control */}
                <div>
                  <span className="block text-xs font-semibold text-stone-700 mb-2">
                    {c.requestTypeLabel}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-md">
                    {requestTypes.map((typeKey) => (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setRequestType(typeKey)}
                        className={`py-2 px-3 text-xs font-semibold rounded transition-colors cursor-pointer whitespace-nowrap truncate ${
                          requestType === typeKey
                            ? 'bg-white text-stone-950 shadow-xs'
                            : 'text-stone-600 hover:text-stone-950'
                        }`}
                      >
                        {t.requestTypes[typeKey]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.nameLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={c.namePlaceholder}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.phoneLabel} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={c.phonePlaceholder}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.emailPlaceholder}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.cityLabel}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={c.cityPlaceholder}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
                    />
                  </div>
                </div>

                {/* Vehicle & Market Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.carLabel}
                    </label>
                    <select
                      value={carId}
                      onChange={(e) => setCarId(e.target.value)}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-700"
                    >
                      <option value="">{c.carAny}</option>
                      {cars.map((car) => (
                        <option key={car.id} value={String(car.id)}>
                          {car.brand} {car.name} ({car.year}) — ${car.price_usd.toLocaleString('en-US')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.marketLabel}
                    </label>
                    <select
                      value={marketItemName}
                      onChange={(e) => setMarketItemName(e.target.value)}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-700"
                    >
                      <option value="">{c.marketAny}</option>
                      {marketItems.map((item) => {
                        const label = `${item.sku} — ${
                          lang === 'uz' ? item.title_uz : item.title_ru
                        }`;
                        return (
                          <option key={item.id} value={label}>
                            {label} (${item.price_usd.toLocaleString('en-US')})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Date, Budget, Trade-In */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.dateLabel}
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.budgetLabel}
                    </label>
                    <input
                      type="text"
                      value={budgetUsd}
                      onChange={(e) => setBudgetUsd(e.target.value)}
                      placeholder={c.budgetPlaceholder}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      {c.tradeInLabel}
                    </label>
                    <input
                      type="text"
                      value={tradeInInfo}
                      onChange={(e) => setTradeInInfo(e.target.value)}
                      placeholder={c.tradeInPlaceholder}
                      className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {c.messageLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={c.messagePlaceholder}
                    className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-red-700" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 rounded-md transition-colors cursor-pointer"
                  >
                    {submitting ? c.submitting : c.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
