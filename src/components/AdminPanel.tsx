import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Car as CarIcon,
  FileEdit,
  LayoutList,
  Users,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Check,
  X,
  Lock,
} from 'lucide-react';
import type {
  AsideOffer,
  Car,
  CarCategory,
  CarStatus,
  Language,
  Lead,
  LeadStatus,
  MarketCategory,
  MarketItem,
  RequestType,
  SiteSettings,
} from '../types';
import { PRESET_CAR_IMAGES, PRESET_MARKET_IMAGES, UI_COPY } from '../i18n/translations';
import { CarImage } from './CarImage';

interface AdminPanelProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onExit: () => void;
  onDataChanged: () => Promise<void>;
  initialSettings: SiteSettings;
}

type AdminTab = 'cars' | 'market' | 'users' | 'content' | 'aside';

const EMPTY_CAR: Omit<Car, 'id' | 'created_at'> = {
  name: '',
  brand: '',
  category: 'sedan',
  year: 2026,
  price_usd: 85000,
  power_uz: '',
  power_ru: '',
  acceleration: '4.5 s',
  transmission_uz: '',
  transmission_ru: '',
  fuel_uz: '',
  fuel_ru: '',
  color_uz: '',
  color_ru: '',
  description_uz: '',
  description_ru: '',
  image_url: PRESET_CAR_IMAGES[1].url,
  status: 'available',
  featured: 1,
};

const EMPTY_MARKET_ITEM: Omit<MarketItem, 'id' | 'created_at'> = {
  sku: 'AUR-',
  title_uz: '',
  title_ru: '',
  category: 'accessories',
  price_usd: 950,
  stock: 5,
  description_uz: '',
  description_ru: '',
  image_url: PRESET_MARKET_IMAGES[0].url,
  active: 1,
};

const EMPTY_OFFER: Omit<AsideOffer, 'id'> = {
  title_uz: '',
  title_ru: '',
  summary_uz: '',
  summary_ru: '',
  metric_text: '',
  sort_order: 1,
  active: 1,
};

export function AdminPanel({
  lang,
  onChangeLang,
  onExit,
  onDataChanged,
  initialSettings,
}: AdminPanelProps) {
  const t = UI_COPY[lang];
  const [token, setToken] = useState<string>(
    () => localStorage.getItem('aureon_admin_token') || ''
  );
  const [passcode, setPasscode] = useState('admin2026');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState<AdminTab>('cars');

  const [cars, setCars] = useState<Car[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [offers, setOffers] = useState<AsideOffer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Cars tab state
  const [carSearch, setCarSearch] = useState('');
  const [editingCar, setEditingCar] = useState<Partial<Car> | null>(null);
  const [savingCar, setSavingCar] = useState(false);

  // Market tab state
  const [marketSearch, setMarketSearch] = useState('');
  const [editingMarket, setEditingMarket] = useState<Partial<MarketItem> | null>(null);
  const [savingMarket, setSavingMarket] = useState(false);

  // Users tab state
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | RequestType>('all');

  // Offers tab state
  const [editingOffer, setEditingOffer] = useState<Partial<AsideOffer> | null>(null);

  useEffect(() => {
    setSettingsForm(initialSettings);
  }, [initialSettings]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAdminData = async (authToken: string) => {
    setLoading(true);
    try {
      const headers = { 'x-admin-token': authToken };
      const [carsRes, marketRes, offersRes, leadsRes] = await Promise.all([
        fetch('/api/admin/cars', { headers }),
        fetch('/api/admin/market', { headers }),
        fetch('/api/admin/offers', { headers }),
        fetch('/api/admin/leads', { headers }),
      ]);
      if (carsRes.status === 401) {
        localStorage.removeItem('aureon_admin_token');
        setToken('');
        return;
      }
      const carsData = await carsRes.json();
      const marketData = await marketRes.json();
      const offersData = await offersRes.json();
      const leadsData = await leadsRes.json();
      setCars(carsData.cars || []);
      setMarketItems(marketData.items || []);
      setOffers(offersData.offers || []);
      setLeads(leadsData.leads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData(token);
    }
  }, [token]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    if (!res.ok) {
      setAuthError(t.admin.loginError);
      return;
    }
    const data = await res.json();
    localStorage.setItem('aureon_admin_token', data.token);
    setToken(data.token);
  };

  const handleLogout = () => {
    localStorage.removeItem('aureon_admin_token');
    setToken('');
  };

  const filteredCars = useMemo(() => {
    const q = carSearch.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        String(c.year).includes(q)
    );
  }, [cars, carSearch]);

  const filteredMarket = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();
    if (!q) return marketItems;
    return marketItems.filter(
      (m) =>
        m.title_uz.toLowerCase().includes(q) ||
        m.title_ru.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q)
    );
  }, [marketItems, marketSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return leads.filter((l) => {
      if (userTypeFilter !== 'all' && l.request_type !== userTypeFilter) return false;
      if (!q) return true;
      return (
        l.customer_name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.car_name || '').toLowerCase().includes(q) ||
        (l.market_item_name || '').toLowerCase().includes(q)
      );
    });
  }, [leads, userSearch, userTypeFilter]);

  const handleSaveCar = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCar) return;
    setSavingCar(true);
    try {
      const isEdit = Boolean(editingCar.id);
      const url = isEdit ? `/api/admin/cars/${editingCar.id}` : '/api/admin/cars';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(editingCar),
      });
      if (res.ok) {
        setEditingCar(null);
        await fetchAdminData(token);
        await onDataChanged();
        showToast(lang === 'uz' ? 'Avtomobil saqlandi' : 'Автомобиль сохранён');
      }
    } finally {
      setSavingCar(false);
    }
  };

  const handleDeleteCar = async (id: number) => {
    await fetch(`/api/admin/cars/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    });
    await fetchAdminData(token);
    await onDataChanged();
    showToast(lang === 'uz' ? 'Avtomobil o‘chirildi' : 'Автомобиль удалён');
  };

  const handleSaveMarketItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingMarket) return;
    setSavingMarket(true);
    try {
      const isEdit = Boolean(editingMarket.id);
      const url = isEdit ? `/api/admin/market/${editingMarket.id}` : '/api/admin/market';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(editingMarket),
      });
      if (res.ok) {
        setEditingMarket(null);
        await fetchAdminData(token);
        await onDataChanged();
        showToast(lang === 'uz' ? 'Market mahsuloti saqlandi' : 'Товар Маркета сохранён');
      }
    } finally {
      setSavingMarket(false);
    }
  };

  const handleDeleteMarketItem = async (id: number) => {
    await fetch(`/api/admin/market/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    });
    await fetchAdminData(token);
    await onDataChanged();
    showToast(lang === 'uz' ? 'Mahsulot o‘chirildi' : 'Товар удалён');
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify(settingsForm),
    });
    if (res.ok) {
      await onDataChanged();
      showToast(t.admin.contentTab.savedToast);
    }
  };

  const handleSaveOffer = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    const isEdit = Boolean(editingOffer.id);
    const url = isEdit ? `/api/admin/offers/${editingOffer.id}` : '/api/admin/offers';
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify(editingOffer),
    });
    if (res.ok) {
      setEditingOffer(null);
      await fetchAdminData(token);
      await onDataChanged();
      showToast(lang === 'uz' ? 'Taklif saqlandi' : 'Предложение сохранено');
    }
  };

  const handleDeleteOffer = async (id: number) => {
    await fetch(`/api/admin/offers/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    });
    await fetchAdminData(token);
    await onDataChanged();
  };

  const handleLeadStatus = async (id: number, status: LeadStatus) => {
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ status }),
    });
    await fetchAdminData(token);
  };

  const handleDeleteLead = async (id: number) => {
    await fetch(`/api/admin/leads/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    });
    await fetchAdminData(token);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.admin.backToSite}
            </button>
            <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-md">
              <button
                type="button"
                onClick={() => onChangeLang('uz')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  lang === 'uz' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600'
                }`}
              >
                UZ
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('ru')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  lang === 'ru' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600'
                }`}
              >
                RU
              </button>
            </div>
          </div>

          <div className="w-10 h-10 rounded-md bg-stone-950 text-white flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-editorial text-2xl font-semibold text-stone-950">
            {t.admin.loginHeading}
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            {t.admin.loginSubheading}
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                {t.admin.passcodeLabel}
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm font-mono text-stone-950 focus:outline-none focus:ring-2 focus:ring-red-700"
              />
              <p className="mt-1.5 text-xs font-mono text-stone-500">
                {t.admin.demoHint}
              </p>
            </div>

            {authError && (
              <p className="text-xs font-medium text-red-700" role="alert">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-stone-950 hover:bg-[#B91C1C] rounded-md transition-colors cursor-pointer"
            >
              {t.admin.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: typeof CarIcon; badge?: number }[] = [
    { id: 'cars', label: t.admin.tabs.cars, icon: CarIcon, badge: cars.length },
    { id: 'market', label: t.admin.tabs.market, icon: ShoppingBag, badge: marketItems.length },
    {
      id: 'users',
      label: t.admin.tabs.users,
      icon: Users,
      badge: leads.length,
    },
    { id: 'content', label: t.admin.tabs.content, icon: FileEdit },
    { id: 'aside', label: t.admin.tabs.aside, icon: LayoutList, badge: offers.length },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-stone-950 flex flex-col md:flex-row">
      {/* Left Sidebar (240px) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-stone-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-stone-200">
            <span className="font-editorial text-lg font-semibold text-stone-950 truncate">
              {settingsForm.brand_name}
            </span>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-stone-950 text-white'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        active ? 'text-stone-300' : 'text-stone-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-stone-200 space-y-2 hidden md:block">
          <button
            type="button"
            onClick={onExit}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.admin.backToSite}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-md cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t.admin.logout}
          </button>
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 truncate">
            <span className="font-medium text-stone-900">{t.admin.title}</span>
            <span>/</span>
            <span className="truncate">{navItems.find((i) => i.id === tab)?.label}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-md">
              <button
                type="button"
                onClick={() => onChangeLang('uz')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  lang === 'uz' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600'
                }`}
              >
                UZ
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('ru')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  lang === 'ru' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600'
                }`}
              >
                RU
              </button>
            </div>

            <button
              type="button"
              onClick={onExit}
              className="md:hidden px-3 py-1.5 text-xs font-semibold border border-stone-200 rounded-md"
            >
              {t.admin.backToSite}
            </button>
          </div>
        </header>

        {toast && (
          <div className="mx-4 sm:mx-8 mt-4 px-4 py-3 bg-emerald-950 text-white text-xs font-semibold rounded-md flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {/* TAB 1: CARS INVENTORY */}
          {tab === 'cars' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <input
                  type="text"
                  value={carSearch}
                  onChange={(e) => setCarSearch(e.target.value)}
                  placeholder={t.admin.carsTab.searchPlaceholder}
                  className="bg-white border border-stone-200 rounded-md px-3.5 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-red-700"
                />
                <button
                  type="button"
                  onClick={() => setEditingCar({ ...EMPTY_CAR })}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {t.admin.carsTab.addCar}
                </button>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500">
                      <th className="py-3 px-4">{t.admin.carsTab.colModel}</th>
                      <th className="py-3 px-4">{t.admin.carsTab.colCategory}</th>
                      <th className="py-3 px-4 text-right">{t.admin.carsTab.colYear}</th>
                      <th className="py-3 px-4 text-right">{t.admin.carsTab.colPrice}</th>
                      <th className="py-3 px-4">{t.admin.carsTab.colStatus}</th>
                      <th className="py-3 px-4 text-right">{t.admin.carsTab.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {loading && cars.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400">
                          ...
                        </td>
                      </tr>
                    ) : filteredCars.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-stone-500">
                          {t.admin.carsTab.empty}
                        </td>
                      </tr>
                    ) : (
                      filteredCars.map((car) => (
                        <tr key={car.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-10 rounded overflow-hidden bg-stone-100 shrink-0">
                                <CarImage
                                  src={car.image_url}
                                  alt={car.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-stone-950">{car.name}</div>
                                <div className="text-xs text-stone-500">{car.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-stone-700">
                            {t.categories[car.category]}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                            {car.year}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                            ${car.price_usd.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold">
                            <span
                              className={
                                car.status === 'available'
                                  ? 'text-emerald-700'
                                  : car.status === 'reserved'
                                  ? 'text-amber-700'
                                  : 'text-stone-500'
                              }
                            >
                              {t.carStatuses[car.status]}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingCar({ ...car })}
                                aria-label="Edit"
                                className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCar(car.id)}
                                aria-label="Delete"
                                className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MARKET MANAGEMENT */}
          {tab === 'market' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-stone-950">
                    {t.admin.marketTab.heading}
                  </h2>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={marketSearch}
                    onChange={(e) => setMarketSearch(e.target.value)}
                    placeholder={t.admin.marketTab.searchPlaceholder}
                    className="bg-white border border-stone-200 rounded-md px-3.5 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-red-700"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingMarket({ ...EMPTY_MARKET_ITEM })}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {t.admin.marketTab.addItem}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500">
                      <th className="py-3 px-4">{t.admin.marketTab.colProduct}</th>
                      <th className="py-3 px-4">{t.admin.marketTab.colSku}</th>
                      <th className="py-3 px-4">{t.admin.marketTab.colCategory}</th>
                      <th className="py-3 px-4 text-right">{t.admin.marketTab.colPrice}</th>
                      <th className="py-3 px-4 text-right">{t.admin.marketTab.colStock}</th>
                      <th className="py-3 px-4">{t.admin.marketTab.colState}</th>
                      <th className="py-3 px-4 text-right">{t.admin.marketTab.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {filteredMarket.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-stone-500">
                          {t.admin.marketTab.empty}
                        </td>
                      </tr>
                    ) : (
                      filteredMarket.map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-10 rounded overflow-hidden bg-stone-100 shrink-0">
                                <CarImage
                                  src={item.image_url}
                                  alt={item.title_uz}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="font-semibold text-stone-950 max-w-xs truncate">
                                {lang === 'uz' ? item.title_uz : item.title_ru}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-stone-600">
                            {item.sku}
                          </td>
                          <td className="py-3 px-4 text-xs text-stone-700">
                            {t.marketCategories[item.category]}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                            ${item.price_usd.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                            {item.stock}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold">
                            <span className={item.active ? 'text-emerald-700' : 'text-stone-400'}>
                              {item.active ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingMarket({ ...item })}
                                aria-label="Edit"
                                className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMarketItem(item.id)}
                                aria-label="Delete"
                                className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USER SUBMITTED INFORMATION */}
          {tab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-editorial text-2xl font-semibold text-stone-950">
                  {t.admin.usersTab.heading}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={t.admin.usersTab.searchPlaceholder}
                    className="bg-white border border-stone-200 rounded-md px-3.5 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-red-700"
                  />
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value as 'all' | RequestType)}
                    className="bg-white border border-stone-200 rounded-md px-3 py-2 text-xs font-semibold text-stone-800 cursor-pointer"
                  >
                    <option value="all">{t.admin.usersTab.allTypes}</option>
                    <option value="test-drive">{t.requestTypes['test-drive']}</option>
                    <option value="purchase">{t.requestTypes.purchase}</option>
                    <option value="market">{t.requestTypes.market}</option>
                    <option value="trade-in">{t.requestTypes['trade-in']}</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500">
                      <th className="py-3 px-4">{t.admin.usersTab.colClient}</th>
                      <th className="py-3 px-4">{t.admin.usersTab.colType}</th>
                      <th className="py-3 px-4">{t.admin.usersTab.colDetails}</th>
                      <th className="py-3 px-4">{t.admin.usersTab.colDate}</th>
                      <th className="py-3 px-4">{t.admin.usersTab.colStatus}</th>
                      <th className="py-3 px-4 text-right">{t.admin.usersTab.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-stone-500">
                          {t.admin.usersTab.empty}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((lead) => (
                        <tr key={lead.id} className="hover:bg-stone-50 align-top">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-stone-950">{lead.customer_name}</div>
                            <div className="font-mono text-xs text-stone-700 tabular-nums mt-0.5">
                              {lead.phone}
                            </div>
                            {(lead.email || lead.city) && (
                              <div className="text-xs text-stone-500 mt-0.5">
                                {[lead.city, lead.email].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="font-semibold text-red-800">
                              {t.requestTypes[lead.request_type] || lead.request_type}
                            </div>
                            {lead.car_name && (
                              <div className="text-stone-800 mt-0.5">{lead.car_name}</div>
                            )}
                            {lead.market_item_name && (
                              <div className="text-stone-700 mt-0.5">{lead.market_item_name}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-stone-600 max-w-xs space-y-1">
                            {lead.budget_usd && (
                              <div>
                                <span className="font-semibold text-stone-800">Budget:</span>{' '}
                                {lead.budget_usd}
                              </div>
                            )}
                            {lead.trade_in_info && (
                              <div>
                                <span className="font-semibold text-stone-800">Trade-In:</span>{' '}
                                {lead.trade_in_info}
                              </div>
                            )}
                            {lead.message && <div className="text-stone-500">{lead.message}</div>}
                            {!lead.budget_usd && !lead.trade_in_info && !lead.message && '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-stone-600 tabular-nums whitespace-nowrap">
                            {lead.preferred_date || lead.created_at.slice(0, 10)}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                handleLeadStatus(lead.id, e.target.value as LeadStatus)
                              }
                              className="text-xs font-semibold border border-stone-200 rounded px-2 py-1 bg-white cursor-pointer"
                            >
                              <option value="new">{t.admin.leadStatuses.new}</option>
                              <option value="contacted">{t.admin.leadStatuses.contacted}</option>
                              <option value="completed">{t.admin.leadStatuses.completed}</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SITE CONTENT EDITOR */}
          {tab === 'content' && (
            <form onSubmit={handleSaveSettings} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-editorial text-2xl font-semibold text-stone-950">
                  {t.admin.contentTab.heading}
                </h2>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.admin.contentTab.saveChanges}
                </button>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
                <h3 className="text-sm font-semibold text-stone-950 border-b border-stone-100 pb-3">
                  {t.admin.contentTab.sectionBrand}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field
                    label="Brand Name"
                    value={settingsForm.brand_name}
                    onChange={(v) => setSettingsForm({ ...settingsForm, brand_name: v })}
                  />
                  <Field
                    label="Phone"
                    value={settingsForm.phone}
                    onChange={(v) => setSettingsForm({ ...settingsForm, phone: v })}
                  />
                  <Field
                    label="Email"
                    value={settingsForm.email}
                    onChange={(v) => setSettingsForm({ ...settingsForm, email: v })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Manzil (UZ)"
                    value={settingsForm.address_uz}
                    onChange={(v) => setSettingsForm({ ...settingsForm, address_uz: v })}
                  />
                  <Field
                    label="Адрес (RU)"
                    value={settingsForm.address_ru}
                    onChange={(v) => setSettingsForm({ ...settingsForm, address_ru: v })}
                  />
                  <Field
                    label="Ish vaqti (UZ)"
                    value={settingsForm.hours_uz}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hours_uz: v })}
                  />
                  <Field
                    label="Режим работы (RU)"
                    value={settingsForm.hours_ru}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hours_ru: v })}
                  />
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
                <h3 className="text-sm font-semibold text-stone-950 border-b border-stone-100 pb-3">
                  {t.admin.contentTab.sectionHero}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Hero sarlavha (UZ)"
                    value={settingsForm.hero_title_uz}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hero_title_uz: v })}
                  />
                  <Field
                    label="Заголовок Hero (RU)"
                    value={settingsForm.hero_title_ru}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hero_title_ru: v })}
                  />
                  <Field
                    label="Hero tavsif (UZ)"
                    multiline
                    value={settingsForm.hero_subtitle_uz}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hero_subtitle_uz: v })}
                  />
                  <Field
                    label="Описание Hero (RU)"
                    multiline
                    value={settingsForm.hero_subtitle_ru}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hero_subtitle_ru: v })}
                  />
                  <Field
                    label="Tugma matni (UZ)"
                    value={settingsForm.hero_cta_uz}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hero_cta_uz: v })}
                  />
                  <Field
                    label="Текст кнопки (RU)"
                    value={settingsForm.hero_cta_ru}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hero_cta_ru: v })}
                  />
                </div>
                <div>
                  <Field
                    label="Hero Image URL"
                    value={settingsForm.hero_image}
                    onChange={(v) => setSettingsForm({ ...settingsForm, hero_image: v })}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PRESET_CAR_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, hero_image: img.url })}
                        className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-stone-200 rounded text-stone-700 cursor-pointer"
                      >
                        {lang === 'uz' ? img.labelUz : img.labelRu}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
                <h3 className="text-sm font-semibold text-stone-950 border-b border-stone-100 pb-3">
                  {t.admin.contentTab.sectionAbout}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Salon sarlavha (UZ)"
                    value={settingsForm.about_title_uz}
                    onChange={(v) => setSettingsForm({ ...settingsForm, about_title_uz: v })}
                  />
                  <Field
                    label="Заголовок О салоне (RU)"
                    value={settingsForm.about_title_ru}
                    onChange={(v) => setSettingsForm({ ...settingsForm, about_title_ru: v })}
                  />
                  <Field
                    label="Salon matni (UZ)"
                    multiline
                    value={settingsForm.about_body_uz}
                    onChange={(v) => setSettingsForm({ ...settingsForm, about_body_uz: v })}
                  />
                  <Field
                    label="Текст О салоне (RU)"
                    multiline
                    value={settingsForm.about_body_ru}
                    onChange={(v) => setSettingsForm({ ...settingsForm, about_body_ru: v })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-2">
                    <Field
                      label="Metric 1 Value"
                      value={settingsForm.stat_1_value}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_1_value: v })}
                    />
                    <Field
                      label="Label UZ"
                      value={settingsForm.stat_1_label_uz}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_1_label_uz: v })}
                    />
                    <Field
                      label="Label RU"
                      value={settingsForm.stat_1_label_ru}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_1_label_ru: v })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Field
                      label="Metric 2 Value"
                      value={settingsForm.stat_2_value}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_2_value: v })}
                    />
                    <Field
                      label="Label UZ"
                      value={settingsForm.stat_2_label_uz}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_2_label_uz: v })}
                    />
                    <Field
                      label="Label RU"
                      value={settingsForm.stat_2_label_ru}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_2_label_ru: v })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Field
                      label="Metric 3 Value"
                      value={settingsForm.stat_3_value}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_3_value: v })}
                    />
                    <Field
                      label="Label UZ"
                      value={settingsForm.stat_3_label_uz}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_3_label_uz: v })}
                    />
                    <Field
                      label="Label RU"
                      value={settingsForm.stat_3_label_ru}
                      onChange={(v) => setSettingsForm({ ...settingsForm, stat_3_label_ru: v })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
                <h3 className="text-sm font-semibold text-stone-950 border-b border-stone-100 pb-3">
                  {t.admin.contentTab.sectionFooter}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Footer (UZ)"
                    value={settingsForm.footer_note_uz}
                    onChange={(v) => setSettingsForm({ ...settingsForm, footer_note_uz: v })}
                  />
                  <Field
                    label="Footer (RU)"
                    value={settingsForm.footer_note_ru}
                    onChange={(v) => setSettingsForm({ ...settingsForm, footer_note_ru: v })}
                  />
                </div>
              </div>
            </form>
          )}

          {/* TAB 5: ASIDE OFFERS EDITOR */}
          {tab === 'aside' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-editorial text-2xl font-semibold text-stone-950">
                  {t.admin.asideTab.heading}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingOffer({ ...EMPTY_OFFER })}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {t.admin.asideTab.addOffer}
                </button>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-200">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm text-stone-950">
                          {lang === 'uz' ? offer.title_uz : offer.title_ru}
                        </span>
                        {offer.metric_text && (
                          <span className="font-mono text-xs font-semibold text-red-800">
                            {offer.metric_text}
                          </span>
                        )}
                        <span className="text-xs text-stone-400">
                          {offer.active ? '● Active' : '○ Hidden'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 max-w-2xl">
                        {lang === 'uz' ? offer.summary_uz : offer.summary_ru}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingOffer({ ...offer })}
                        className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Car Modal */}
      {editingCar && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setEditingCar(null)}
        >
          <form
            onSubmit={handleSaveCar}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-stone-200 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h3 className="font-editorial text-xl font-semibold text-stone-950">
                {editingCar.id ? t.admin.carsTab.editCar : t.admin.carsTab.addCar}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCar(null)}
                className="p-1.5 text-stone-500 hover:text-stone-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Brand"
                required
                value={editingCar.brand || ''}
                onChange={(v) => setEditingCar({ ...editingCar, brand: v })}
              />
              <Field
                label="Model Name"
                required
                value={editingCar.name || ''}
                onChange={(v) => setEditingCar({ ...editingCar, name: v })}
              />
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.admin.carsTab.colCategory}
                </label>
                <select
                  value={editingCar.category || 'sedan'}
                  onChange={(e) =>
                    setEditingCar({ ...editingCar, category: e.target.value as CarCategory })
                  }
                  className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="sedan">{t.categories.sedan}</option>
                  <option value="suv">{t.categories.suv}</option>
                  <option value="electric">{t.categories.electric}</option>
                  <option value="coupe">{t.categories.coupe}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field
                label={t.admin.carsTab.colYear}
                type="number"
                required
                value={String(editingCar.year || 2026)}
                onChange={(v) => setEditingCar({ ...editingCar, year: Number(v) })}
              />
              <Field
                label={t.admin.carsTab.colPrice}
                type="number"
                required
                value={String(editingCar.price_usd || 0)}
                onChange={(v) => setEditingCar({ ...editingCar, price_usd: Number(v) })}
              />
              <Field
                label="0–100 km/h"
                value={editingCar.acceleration || ''}
                onChange={(v) => setEditingCar({ ...editingCar, acceleration: v })}
              />
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.admin.carsTab.colStatus}
                </label>
                <select
                  value={editingCar.status || 'available'}
                  onChange={(e) =>
                    setEditingCar({ ...editingCar, status: e.target.value as CarStatus })
                  }
                  className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="available">{t.carStatuses.available}</option>
                  <option value="reserved">{t.carStatuses.reserved}</option>
                  <option value="sold">{t.carStatuses.sold}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Quvvat (UZ)"
                required
                value={editingCar.power_uz || ''}
                onChange={(v) => setEditingCar({ ...editingCar, power_uz: v })}
              />
              <Field
                label="Мощность (RU)"
                required
                value={editingCar.power_ru || ''}
                onChange={(v) => setEditingCar({ ...editingCar, power_ru: v })}
              />
              <Field
                label="Uzatma (UZ)"
                required
                value={editingCar.transmission_uz || ''}
                onChange={(v) => setEditingCar({ ...editingCar, transmission_uz: v })}
              />
              <Field
                label="Трансмиссия (RU)"
                required
                value={editingCar.transmission_ru || ''}
                onChange={(v) => setEditingCar({ ...editingCar, transmission_ru: v })}
              />
              <Field
                label="Yoqilg‘i (UZ)"
                required
                value={editingCar.fuel_uz || ''}
                onChange={(v) => setEditingCar({ ...editingCar, fuel_uz: v })}
              />
              <Field
                label="Топливо (RU)"
                required
                value={editingCar.fuel_ru || ''}
                onChange={(v) => setEditingCar({ ...editingCar, fuel_ru: v })}
              />
              <Field
                label="Rang (UZ)"
                required
                value={editingCar.color_uz || ''}
                onChange={(v) => setEditingCar({ ...editingCar, color_uz: v })}
              />
              <Field
                label="Цвет (RU)"
                required
                value={editingCar.color_ru || ''}
                onChange={(v) => setEditingCar({ ...editingCar, color_ru: v })}
              />
              <Field
                label="Tavsif (UZ)"
                multiline
                required
                value={editingCar.description_uz || ''}
                onChange={(v) => setEditingCar({ ...editingCar, description_uz: v })}
              />
              <Field
                label="Описание (RU)"
                multiline
                required
                value={editingCar.description_ru || ''}
                onChange={(v) => setEditingCar({ ...editingCar, description_ru: v })}
              />
            </div>

            <div>
              <Field
                label="Image URL"
                required
                value={editingCar.image_url || ''}
                onChange={(v) => setEditingCar({ ...editingCar, image_url: v })}
              />
              <div className="mt-2">
                <span className="text-xs text-stone-500 block mb-1.5">
                  {t.admin.carsTab.imagePresetLabel}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CAR_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setEditingCar({ ...editingCar, image_url: img.url })}
                      className={`px-2.5 py-1 text-xs rounded border cursor-pointer ${
                        editingCar.image_url === img.url
                          ? 'bg-stone-950 text-white border-stone-950'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {lang === 'uz' ? img.labelUz : img.labelRu}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingCar(null)}
                className="px-4 py-2 text-xs font-semibold border border-stone-200 rounded-md cursor-pointer"
              >
                {t.admin.carsTab.cancel}
              </button>
              <button
                type="submit"
                disabled={savingCar}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md cursor-pointer"
              >
                {t.admin.carsTab.saveCar}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Market Item Modal */}
      {editingMarket && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setEditingMarket(null)}
        >
          <form
            onSubmit={handleSaveMarketItem}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-stone-200 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-editorial text-xl font-semibold text-stone-950">
                {editingMarket.id ? t.admin.marketTab.editItem : t.admin.marketTab.addItem}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMarket(null)}
                className="p-1 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="SKU"
                required
                value={editingMarket.sku || ''}
                onChange={(v) => setEditingMarket({ ...editingMarket, sku: v })}
              />
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.admin.marketTab.colCategory}
                </label>
                <select
                  value={editingMarket.category || 'accessories'}
                  onChange={(e) =>
                    setEditingMarket({
                      ...editingMarket,
                      category: e.target.value as MarketCategory,
                    })
                  }
                  className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="wheels">{t.marketCategories.wheels}</option>
                  <option value="charging">{t.marketCategories.charging}</option>
                  <option value="accessories">{t.marketCategories.accessories}</option>
                  <option value="care">{t.marketCategories.care}</option>
                </select>
              </div>
              <Field
                label={t.admin.marketTab.colPrice}
                type="number"
                required
                value={String(editingMarket.price_usd || 0)}
                onChange={(v) => setEditingMarket({ ...editingMarket, price_usd: Number(v) })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Mahsulot nomi (UZ)"
                required
                value={editingMarket.title_uz || ''}
                onChange={(v) => setEditingMarket({ ...editingMarket, title_uz: v })}
              />
              <Field
                label="Название товара (RU)"
                required
                value={editingMarket.title_ru || ''}
                onChange={(v) => setEditingMarket({ ...editingMarket, title_ru: v })}
              />
              <Field
                label="Tavsif (UZ)"
                multiline
                required
                value={editingMarket.description_uz || ''}
                onChange={(v) => setEditingMarket({ ...editingMarket, description_uz: v })}
              />
              <Field
                label="Описание (RU)"
                multiline
                required
                value={editingMarket.description_ru || ''}
                onChange={(v) => setEditingMarket({ ...editingMarket, description_ru: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <Field
                label={t.admin.marketTab.colStock}
                type="number"
                required
                value={String(editingMarket.stock ?? 0)}
                onChange={(v) => setEditingMarket({ ...editingMarket, stock: Number(v) })}
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingMarket.active)}
                  onChange={(e) =>
                    setEditingMarket({ ...editingMarket, active: e.target.checked ? 1 : 0 })
                  }
                  className="accent-[#B91C1C]"
                />
                {t.admin.marketTab.activeLabel}
              </label>
            </div>

            <div>
              <Field
                label="Image URL"
                required
                value={editingMarket.image_url || ''}
                onChange={(v) => setEditingMarket({ ...editingMarket, image_url: v })}
              />
              <div className="mt-2">
                <span className="text-xs text-stone-500 block mb-1.5">
                  {t.admin.marketTab.imagePresetLabel}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_MARKET_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setEditingMarket({ ...editingMarket, image_url: img.url })}
                      className={`px-2.5 py-1 text-xs rounded border cursor-pointer ${
                        editingMarket.image_url === img.url
                          ? 'bg-stone-950 text-white border-stone-950'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {lang === 'uz' ? img.labelUz : img.labelRu}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingMarket(null)}
                className="px-4 py-2 text-xs font-semibold border border-stone-200 rounded-md cursor-pointer"
              >
                {t.admin.carsTab.cancel}
              </button>
              <button
                type="submit"
                disabled={savingMarket}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md cursor-pointer"
              >
                {t.admin.marketTab.saveItem}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Aside Offer Modal */}
      {editingOffer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setEditingOffer(null)}
        >
          <form
            onSubmit={handleSaveOffer}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-stone-200 rounded-lg max-w-xl w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-editorial text-xl font-semibold text-stone-950">
                {t.admin.asideTab.heading}
              </h3>
              <button
                type="button"
                onClick={() => setEditingOffer(null)}
                className="p-1 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Sarlavha (UZ)"
                required
                value={editingOffer.title_uz || ''}
                onChange={(v) => setEditingOffer({ ...editingOffer, title_uz: v })}
              />
              <Field
                label="Заголовок (RU)"
                required
                value={editingOffer.title_ru || ''}
                onChange={(v) => setEditingOffer({ ...editingOffer, title_ru: v })}
              />
            </div>

            <Field
              label="Matn (UZ)"
              multiline
              required
              value={editingOffer.summary_uz || ''}
              onChange={(v) => setEditingOffer({ ...editingOffer, summary_uz: v })}
            />
            <Field
              label="Текст (RU)"
              multiline
              required
              value={editingOffer.summary_ru || ''}
              onChange={(v) => setEditingOffer({ ...editingOffer, summary_ru: v })}
            />

            <div className="grid grid-cols-2 gap-4 items-end">
              <Field
                label="Metric (e.g. 45 min, 20%+)"
                value={editingOffer.metric_text || ''}
                onChange={(v) => setEditingOffer({ ...editingOffer, metric_text: v })}
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingOffer.active)}
                  onChange={(e) =>
                    setEditingOffer({ ...editingOffer, active: e.target.checked ? 1 : 0 })
                  }
                  className="accent-[#B91C1C]"
                />
                {t.admin.asideTab.activeLabel}
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingOffer(null)}
                className="px-4 py-2 text-xs font-semibold border border-stone-200 rounded-md cursor-pointer"
              >
                {t.admin.carsTab.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md cursor-pointer"
              >
                {t.admin.asideTab.saveOffer}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  required?: boolean;
  type?: string;
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  type = 'text',
}: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          rows={2}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700"
        />
      )}
    </div>
  );
}
