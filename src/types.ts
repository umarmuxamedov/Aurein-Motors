export type Language = 'uz' | 'ru';

export type CarCategory = 'sedan' | 'suv' | 'electric' | 'coupe';
export type CarStatus = 'available' | 'reserved' | 'sold';
export type MarketCategory = 'wheels' | 'charging' | 'accessories' | 'care';
export type RequestType = 'test-drive' | 'purchase' | 'market' | 'trade-in';
export type LeadStatus = 'new' | 'contacted' | 'completed';

export interface SiteSettings {
  id: number;
  brand_name: string;
  hero_title_uz: string;
  hero_title_ru: string;
  hero_subtitle_uz: string;
  hero_subtitle_ru: string;
  hero_cta_uz: string;
  hero_cta_ru: string;
  hero_image: string;
  about_title_uz: string;
  about_title_ru: string;
  about_body_uz: string;
  about_body_ru: string;
  stat_1_value: string;
  stat_1_label_uz: string;
  stat_1_label_ru: string;
  stat_2_value: string;
  stat_2_label_uz: string;
  stat_2_label_ru: string;
  stat_3_value: string;
  stat_3_label_uz: string;
  stat_3_label_ru: string;
  phone: string;
  email: string;
  address_uz: string;
  address_ru: string;
  hours_uz: string;
  hours_ru: string;
  footer_note_uz: string;
  footer_note_ru: string;
  telegram_url: string;
  updated_at: string;
}

export interface Car {
  id: number;
  name: string;
  brand: string;
  category: CarCategory;
  year: number;
  price_usd: number;
  power_uz: string;
  power_ru: string;
  acceleration: string;
  transmission_uz: string;
  transmission_ru: string;
  fuel_uz: string;
  fuel_ru: string;
  color_uz: string;
  color_ru: string;
  description_uz: string;
  description_ru: string;
  image_url: string;
  status: CarStatus;
  featured: number;
  created_at: string;
}

export interface MarketItem {
  id: number;
  sku: string;
  title_uz: string;
  title_ru: string;
  category: MarketCategory;
  price_usd: number;
  stock: number;
  description_uz: string;
  description_ru: string;
  image_url: string;
  active: number;
  created_at: string;
}

export interface AsideOffer {
  id: number;
  title_uz: string;
  title_ru: string;
  summary_uz: string;
  summary_ru: string;
  metric_text: string;
  sort_order: number;
  active: number;
}

export interface Lead {
  id: number;
  customer_name: string;
  phone: string;
  email: string;
  city: string;
  request_type: RequestType;
  car_id: number | null;
  car_name: string;
  market_item_name: string;
  preferred_date: string;
  budget_usd: string;
  trade_in_info: string;
  message: string;
  lang: Language;
  status: LeadStatus;
  created_at: string;
}

export interface StorefrontPayload {
  settings: SiteSettings;
  cars: Car[];
  offers: AsideOffer[];
  marketItems: MarketItem[];
}
