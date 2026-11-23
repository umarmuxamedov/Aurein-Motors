import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, 'autosalon.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      brand_name TEXT NOT NULL,
      hero_title_uz TEXT NOT NULL,
      hero_title_ru TEXT NOT NULL,
      hero_subtitle_uz TEXT NOT NULL,
      hero_subtitle_ru TEXT NOT NULL,
      hero_cta_uz TEXT NOT NULL,
      hero_cta_ru TEXT NOT NULL,
      hero_image TEXT NOT NULL,
      about_title_uz TEXT NOT NULL,
      about_title_ru TEXT NOT NULL,
      about_body_uz TEXT NOT NULL,
      about_body_ru TEXT NOT NULL,
      stat_1_value TEXT NOT NULL,
      stat_1_label_uz TEXT NOT NULL,
      stat_1_label_ru TEXT NOT NULL,
      stat_2_value TEXT NOT NULL,
      stat_2_label_uz TEXT NOT NULL,
      stat_2_label_ru TEXT NOT NULL,
      stat_3_value TEXT NOT NULL,
      stat_3_label_uz TEXT NOT NULL,
      stat_3_label_ru TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address_uz TEXT NOT NULL,
      address_ru TEXT NOT NULL,
      hours_uz TEXT NOT NULL,
      hours_ru TEXT NOT NULL,
      footer_note_uz TEXT NOT NULL,
      footer_note_ru TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      year INTEGER NOT NULL,
      price_usd INTEGER NOT NULL,
      power_uz TEXT NOT NULL,
      power_ru TEXT NOT NULL,
      acceleration TEXT NOT NULL,
      transmission_uz TEXT NOT NULL,
      transmission_ru TEXT NOT NULL,
      fuel_uz TEXT NOT NULL,
      fuel_ru TEXT NOT NULL,
      color_uz TEXT NOT NULL,
      color_ru TEXT NOT NULL,
      description_uz TEXT NOT NULL,
      description_ru TEXT NOT NULL,
      image_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS aside_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_uz TEXT NOT NULL,
      title_ru TEXT NOT NULL,
      summary_uz TEXT NOT NULL,
      summary_ru TEXT NOT NULL,
      metric_text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      city TEXT DEFAULT '',
      request_type TEXT DEFAULT 'test-drive',
      car_id INTEGER,
      car_name TEXT,
      market_item_name TEXT DEFAULT '',
      preferred_date TEXT,
      budget_usd TEXT DEFAULT '',
      trade_in_info TEXT DEFAULT '',
      message TEXT,
      lang TEXT NOT NULL DEFAULT 'uz',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS market_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL,
      title_uz TEXT NOT NULL,
      title_ru TEXT NOT NULL,
      category TEXT NOT NULL,
      price_usd INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 1,
      description_uz TEXT NOT NULL,
      description_ru TEXT NOT NULL,
      image_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // Safe migration for pre-existing autosalon.db leads columns
  const leadCols = db.prepare('PRAGMA table_info(leads)').all() as { name: string }[];
  const existingCols = new Set(leadCols.map((c) => c.name));
  const migrations: [string, string][] = [
    ['email', "ALTER TABLE leads ADD COLUMN email TEXT DEFAULT ''"],
    ['city', "ALTER TABLE leads ADD COLUMN city TEXT DEFAULT ''"],
    ['request_type', "ALTER TABLE leads ADD COLUMN request_type TEXT DEFAULT 'test-drive'"],
    ['market_item_name', "ALTER TABLE leads ADD COLUMN market_item_name TEXT DEFAULT ''"],
    ['budget_usd', "ALTER TABLE leads ADD COLUMN budget_usd TEXT DEFAULT ''"],
    ['trade_in_info', "ALTER TABLE leads ADD COLUMN trade_in_info TEXT DEFAULT ''"],
  ];
  for (const [colName, sql] of migrations) {
    if (!existingCols.has(colName)) {
      db.exec(sql);
    }
  }

  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM site_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO site_settings (
        id, brand_name,
        hero_title_uz, hero_title_ru,
        hero_subtitle_uz, hero_subtitle_ru,
        hero_cta_uz, hero_cta_ru,
        hero_image,
        about_title_uz, about_title_ru,
        about_body_uz, about_body_ru,
        stat_1_value, stat_1_label_uz, stat_1_label_ru,
        stat_2_value, stat_2_label_uz, stat_2_label_ru,
        stat_3_value, stat_3_label_uz, stat_3_label_ru,
        phone, email,
        address_uz, address_ru,
        hours_uz, hours_ru,
        footer_note_uz, footer_note_ru,
        updated_at
      ) VALUES (
        1, 'Aureon Motors',
        'Yangi avlod premium avtomobillari', 'Автомобили премиум-класса нового поколения',
        'Rasmiy kafolat, shaffof lizing shartlari va Toshkentdagi flagman avtosalondan tezkor yetkazib berish.', 'Официальная гарантия, прозрачные условия лизинга и быстрая выдача во флагманском автосалоне в Ташкенте.',
        'Katalogni ko''rish', 'Смотреть каталог',
        '/src/assets/images/hero_showroom_flagship_1795175525177.jpg',
        'Muhandislik aniqligi va salon madaniyati', 'Инженерная точность и культура автосалона',
        'Aureon Motors — har bir avtomobil 140 nuqtali texnik tekshiruvdan o''tgan, rasmiy servis tarixiga ega va individual buyurtma asosida yetkazib beriladigan zamonaviy avtosalon.', 'Aureon Motors — современный автосалон, где каждый автомобиль проходит 140-пунктную техническую диагностику, имеет прозрачную историю и индивидуальное сопровождение сделки.',
        '140+', 'Tekshiruv nuqtalari har bir avtoda', 'Пунктов диагностики каждого авто',
        '3 yil', 'Rasmiy kafolat va servis', 'Официальная гарантия и сервис',
        '24 soat', 'Hujjatlarni rasmiylashtirish', 'Оформление документов за сутки',
        '+998 71 200 45 00', 'concierge@aureonmotors.uz',
        'Toshkent sh., Amir Temur shoh ko''chasi, 108', 'г. Ташкент, проспект Амира Темура, 108',
        'Dushanba – Yakshanba: 09:00 – 21:00', 'Пн – Вс: 09:00 – 21:00',
        'Aureon Motors. Barcha huquqlar himoyalangan.', 'Aureon Motors. Все права защищены.',
        ?
      )
    `).run(new Date().toISOString());
  }

  const carsCount = db.prepare('SELECT COUNT(*) as count FROM cars').get() as { count: number };
  if (carsCount.count === 0) {
    const insertCar = db.prepare(`
      INSERT INTO cars (
        name, brand, category, year, price_usd,
        power_uz, power_ru, acceleration,
        transmission_uz, transmission_ru,
        fuel_uz, fuel_ru,
        color_uz, color_ru,
        description_uz, description_ru,
        image_url, status, featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertCar.run(
      'Sovereign L8 Executive',
      'Aureon',
      'sedan',
      2025,
      118500,
      '460 ot kuchi · V8 Twin-Turbo',
      '460 л.с. · V8 Twin-Turbo',
      '4.2 s',
      "8-pog'onali avtomat · AWD",
      '8-ступ. автомат · Полный привод',
      'Benzin / Mild-Hybrid',
      'Бензин / MHEV',
      'Obsidian qora',
      'Чёрный обсидиан',
      "Orqa o'rindiqlar massaj tizimi, pnevmatik osma va akustik ikki qavatli oynalar bilan jihozlangan biznes-klass flagmani.",
      'Флагманский представительский седан с пневмоподвеской, двойным акустическим остеклением и пакетом комфорта для задних пассажиров.',
      '/src/assets/images/car_sedan_obsidian_1795175524992.jpg',
      'available',
      1,
      now
    );

    insertCar.run(
      'Nordic X90 Horizon',
      'Nordic',
      'suv',
      2025,
      96400,
      '395 ot kuchi · Plug-in Hybrid',
      '395 л.с. · Plug-in Hybrid',
      '4.9 s',
      "8-pog'onali avtomat · 4x4",
      '8-ступ. автомат · 4x4',
      'Gibrid (PHEV)',
      'Гибрид (PHEV)',
      'Titan kumush',
      'Титан серебристый',
      "7 o'rinli keng oilaviy krossover. Elektr rejimida 85 km yurish zaxirasi va Nappa charm salon.",
      'Просторный 7-местный внедорожник с запасом хода 85 км на электротяге, отделкой кожей Nappa и панорамной крышей.',
      '/src/assets/images/car_suv_titanium_1795175525244.jpg',
      'available',
      1,
      now
    );

    insertCar.run(
      'Aegis E-GT Fastback',
      'Aegis',
      'electric',
      2026,
      104900,
      '610 ot kuchi · Dual Motor',
      '610 л.с. · Dual Motor',
      '3.3 s',
      "Bir pog'onali reduktor · AWD",
      'Редуктор · Полный привод',
      'Elektromobil · 640 km',
      'Электро · 640 км запас хода',
      'Marvarid oq',
      'Белый перламутр',
      '800V tezkor quvvatlash arxitekturasi: 18 daqiqada 10% dan 80% gacha. Panoramik shisha tom va Matrix LED.',
      'Архитектура быстрой зарядки 800В: от 10% до 80% за 18 минут. Панорамная крыша, адаптивные матричные фары и полный автопилот L2+.',
      '/src/assets/images/car_ev_pearl_1795175525140.jpg',
      'available',
      1,
      now
    );

    insertCar.run(
      'Veloce 812 Corsa',
      'Veloce',
      'coupe',
      2025,
      189000,
      '720 ot kuchi · 6.5L V12',
      '720 л.с. · 6.5L V12',
      '2.9 s',
      "7-pog'onali F1 DCT · RWD",
      '7-ступ. робот DCT · Задний привод',
      'Benzin (AI-98)',
      'Бензин (АИ-98)',
      'Yoqut qizil',
      'Рубиновый металлик',
      'Karbon-keramik tormoz tizimi, aktiv aerodinamika va sport eksklyuziv salon bezagi.',
      'Карбон-керамическая тормозная система, активная аэродинамика и эксклюзивная отделка салона алькантарой.',
      '/src/assets/images/car_coupe_crimson_1795175525212.jpg',
      'reserved',
      1,
      now
    );
  }

  const offersCount = db.prepare('SELECT COUNT(*) as count FROM aside_offers').get() as { count: number };
  if (offersCount.count === 0) {
    const insertOffer = db.prepare(`
      INSERT INTO aside_offers (title_uz, title_ru, summary_uz, summary_ru, metric_text, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    insertOffer.run(
      'Trade-In baholash',
      'Оценка по Trade-In',
      "Eski avtomobilingizni 45 daqiqada bozor narxida baholab, yangi model uchun boshlang'ich to'lov sifatida qabul qilamiz.",
      'Оценим ваш текущий автомобиль за 45 минут по рыночной стоимости и примем в зачёт первого взноса.',
      '45 min',
      1
    );
    insertOffer.run(
      'Qulay lizing dasturi',
      'Гибкий лизинг и кредит',
      "20% boshlang'ich to'lov bilan 12 oydan 48 oygacha moslashuvchan to'lov jadvali.",
      'Первоначальный взнос от 20%, срок финансирования от 12 до 48 месяцев без скрытых комиссий.',
      '20%+',
      2
    );
    insertOffer.run(
      'Individual yetkazib berish',
      'Доставка под ключ',
      "Yevropa va Koreyadan maxsus komplektatsiyadagi avtomobillarni sug'urta bilan yetkazib berish.",
      'Привоз редких комплектаций из Европы и Кореи с полным таможенным оформлением и страховкой.',
      '100%',
      3
    );
  }

  const marketCount = db.prepare('SELECT COUNT(*) as count FROM market_items').get() as { count: number };
  if (marketCount.count === 0) {
    const insertMarket = db.prepare(`
      INSERT INTO market_items (
        sku, title_uz, title_ru, category, price_usd, stock,
        description_uz, description_ru, image_url, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const now = new Date().toISOString();
    insertMarket.run(
      'AUR-WHL-21',
      'Aureon Forged 21" Gunmetal disklar to‘plami',
      'Комплект кованых дисков Aureon Forged 21"',
      'wheels',
      4800,
      6,
      'Yengil alyuminiydan ishlangan 4 dona forged disklar to‘plami, karbon markaziy qopqoqlar bilan.',
      'Комплект из 4 ультралёгких кованых дисков в цвете Gunmetal с карбоновыми центральными колпачками.',
      '/src/assets/images/market_forged_wheel_1795434183850.jpg',
      now
    );
    insertMarket.run(
      'AUR-CHG-22KW',
      'Aura 22kW uy quvvatlash stansiyasi (Wallbox)',
      'Домашняя зарядная станция Aura 22 кВт (Wallbox)',
      'charging',
      1350,
      12,
      'Type-2 ulagichli, mobil ilova orqali boshqariladigan 3 fazali tezkor quvvatlash qurilmasi.',
      'Трёхфазная настенная зарядная станция Type-2 с удалённым контролем через приложение и защитой IP65.',
      '/src/assets/images/market_ev_wallbox_1795434185089.jpg',
      now
    );
    insertMarket.run(
      'AUR-BOX-450',
      'AeroTour 450L tom bagaj boksi va relslar',
      'Аэродинамический бокс на крышу AeroTour 450 л',
      'accessories',
      1650,
      4,
      'Ikki tomondan ochiladigan shovqinsiz sayohat boksi va anodlangan alyuminiy ko‘ndalang relslar.',
      'Глянцевый аэродинамический автобокс на 450 л с двухсторонним открытием и алюминиевыми поперечинами.',
      '/src/assets/images/market_roof_cargo_1795434184952.jpg',
      now
    );
  }
}

initDatabase();

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin2026';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Public storefront aggregate endpoint
  app.get('/api/storefront', (_req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM site_settings WHERE id = 1').get();
      const cars = db.prepare('SELECT * FROM cars ORDER BY featured DESC, id DESC').all();
      const offers = db.prepare('SELECT * FROM aside_offers WHERE active = 1 ORDER BY sort_order ASC, id ASC').all();
      const marketItems = db.prepare('SELECT * FROM market_items WHERE active = 1 ORDER BY id DESC').all();
      res.json({ settings, cars, offers, marketItems });
    } catch (err) {
      console.error('Error fetching storefront:', err);
      res.status(500).json({ error: 'Database read failed' });
    }
  });

  // Admin auth verification
  app.post('/api/admin/login', (req, res) => {
    const { passcode } = req.body || {};
    if (passcode === ADMIN_PASSCODE) {
      return res.json({ ok: true, token: 'aureon-admin-session' });
    }
    return res.status(401).json({ ok: false, error: 'Invalid passcode' });
  });

  // Middleware for admin endpoints
  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (token !== 'aureon-admin-session') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Update site settings
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const b = req.body;
    try {
      db.prepare(`
        UPDATE site_settings SET
          brand_name = ?,
          hero_title_uz = ?, hero_title_ru = ?,
          hero_subtitle_uz = ?, hero_subtitle_ru = ?,
          hero_cta_uz = ?, hero_cta_ru = ?,
          hero_image = ?,
          about_title_uz = ?, about_title_ru = ?,
          about_body_uz = ?, about_body_ru = ?,
          stat_1_value = ?, stat_1_label_uz = ?, stat_1_label_ru = ?,
          stat_2_value = ?, stat_2_label_uz = ?, stat_2_label_ru = ?,
          stat_3_value = ?, stat_3_label_uz = ?, stat_3_label_ru = ?,
          phone = ?, email = ?,
          address_uz = ?, address_ru = ?,
          hours_uz = ?, hours_ru = ?,
          footer_note_uz = ?, footer_note_ru = ?,
          updated_at = ?
        WHERE id = 1
      `).run(
        b.brand_name,
        b.hero_title_uz, b.hero_title_ru,
        b.hero_subtitle_uz, b.hero_subtitle_ru,
        b.hero_cta_uz, b.hero_cta_ru,
        b.hero_image,
        b.about_title_uz, b.about_title_ru,
        b.about_body_uz, b.about_body_ru,
        b.stat_1_value, b.stat_1_label_uz, b.stat_1_label_ru,
        b.stat_2_value, b.stat_2_label_uz, b.stat_2_label_ru,
        b.stat_3_value, b.stat_3_label_uz, b.stat_3_label_ru,
        b.phone, b.email,
        b.address_uz, b.address_ru,
        b.hours_uz, b.hours_ru,
        b.footer_note_uz, b.footer_note_ru,
        new Date().toISOString()
      );
      const updated = db.prepare('SELECT * FROM site_settings WHERE id = 1').get();
      res.json({ settings: updated });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Admin: Cars CRUD
  app.get('/api/admin/cars', requireAdmin, (_req, res) => {
    const cars = db.prepare('SELECT * FROM cars ORDER BY id DESC').all();
    res.json({ cars });
  });

  app.post('/api/admin/cars', requireAdmin, (req, res) => {
    const c = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO cars (
          name, brand, category, year, price_usd,
          power_uz, power_ru, acceleration,
          transmission_uz, transmission_ru,
          fuel_uz, fuel_ru,
          color_uz, color_ru,
          description_uz, description_ru,
          image_url, status, featured, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        c.name, c.brand, c.category, Number(c.year), Number(c.price_usd),
        c.power_uz, c.power_ru, c.acceleration,
        c.transmission_uz, c.transmission_ru,
        c.fuel_uz, c.fuel_ru,
        c.color_uz, c.color_ru,
        c.description_uz, c.description_ru,
        c.image_url, c.status || 'available', c.featured ? 1 : 0, new Date().toISOString()
      );
      const created = db.prepare('SELECT * FROM cars WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json({ car: created });
    } catch (err) {
      console.error('Create car error:', err);
      res.status(500).json({ error: 'Failed to create car' });
    }
  });

  app.put('/api/admin/cars/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const c = req.body;
    try {
      db.prepare(`
        UPDATE cars SET
          name = ?, brand = ?, category = ?, year = ?, price_usd = ?,
          power_uz = ?, power_ru = ?, acceleration = ?,
          transmission_uz = ?, transmission_ru = ?,
          fuel_uz = ?, fuel_ru = ?,
          color_uz = ?, color_ru = ?,
          description_uz = ?, description_ru = ?,
          image_url = ?, status = ?, featured = ?
        WHERE id = ?
      `).run(
        c.name, c.brand, c.category, Number(c.year), Number(c.price_usd),
        c.power_uz, c.power_ru, c.acceleration,
        c.transmission_uz, c.transmission_ru,
        c.fuel_uz, c.fuel_ru,
        c.color_uz, c.color_ru,
        c.description_uz, c.description_ru,
        c.image_url, c.status || 'available', c.featured ? 1 : 0, id
      );
      const updated = db.prepare('SELECT * FROM cars WHERE id = ?').get(id);
      res.json({ car: updated });
    } catch (err) {
      console.error('Update car error:', err);
      res.status(500).json({ error: 'Failed to update car' });
    }
  });

  app.delete('/api/admin/cars/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM cars WHERE id = ?').run(id);
    res.json({ ok: true });
  });

  // Admin: Aside offers CRUD
  app.get('/api/admin/offers', requireAdmin, (_req, res) => {
    const offers = db.prepare('SELECT * FROM aside_offers ORDER BY sort_order ASC, id ASC').all();
    res.json({ offers });
  });

  app.post('/api/admin/offers', requireAdmin, (req, res) => {
    const o = req.body;
    const result = db.prepare(`
      INSERT INTO aside_offers (title_uz, title_ru, summary_uz, summary_ru, metric_text, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      o.title_uz, o.title_ru, o.summary_uz, o.summary_ru, o.metric_text || '',
      Number(o.sort_order || 0), o.active === false ? 0 : 1
    );
    const created = db.prepare('SELECT * FROM aside_offers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ offer: created });
  });

  app.put('/api/admin/offers/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const o = req.body;
    db.prepare(`
      UPDATE aside_offers SET
        title_uz = ?, title_ru = ?, summary_uz = ?, summary_ru = ?, metric_text = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(
      o.title_uz, o.title_ru, o.summary_uz, o.summary_ru, o.metric_text || '',
      Number(o.sort_order || 0), o.active ? 1 : 0, id
    );
    const updated = db.prepare('SELECT * FROM aside_offers WHERE id = ?').get(id);
    res.json({ offer: updated });
  });

  app.delete('/api/admin/offers/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM aside_offers WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  });

  // Admin: Market CRUD
  app.get('/api/admin/market', requireAdmin, (_req, res) => {
    const items = db.prepare('SELECT * FROM market_items ORDER BY id DESC').all();
    res.json({ items });
  });

  app.post('/api/admin/market', requireAdmin, (req, res) => {
    const m = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO market_items (
          sku, title_uz, title_ru, category, price_usd, stock,
          description_uz, description_ru, image_url, active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        m.sku || 'AUR-ITEM',
        m.title_uz,
        m.title_ru,
        m.category || 'accessories',
        Number(m.price_usd || 0),
        Number(m.stock ?? 1),
        m.description_uz || '',
        m.description_ru || '',
        m.image_url || '/src/assets/images/market_forged_wheel_1795434183850.jpg',
        m.active === false || m.active === 0 ? 0 : 1,
        new Date().toISOString()
      );
      const created = db.prepare('SELECT * FROM market_items WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json({ item: created });
    } catch (err) {
      console.error('Create market item error:', err);
      res.status(500).json({ error: 'Failed to create market item' });
    }
  });

  app.put('/api/admin/market/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const m = req.body;
    try {
      db.prepare(`
        UPDATE market_items SET
          sku = ?, title_uz = ?, title_ru = ?, category = ?, price_usd = ?, stock = ?,
          description_uz = ?, description_ru = ?, image_url = ?, active = ?
        WHERE id = ?
      `).run(
        m.sku || 'AUR-ITEM',
        m.title_uz,
        m.title_ru,
        m.category || 'accessories',
        Number(m.price_usd || 0),
        Number(m.stock ?? 0),
        m.description_uz || '',
        m.description_ru || '',
        m.image_url || '',
        m.active ? 1 : 0,
        id
      );
      const updated = db.prepare('SELECT * FROM market_items WHERE id = ?').get(id);
      res.json({ item: updated });
    } catch (err) {
      console.error('Update market item error:', err);
      res.status(500).json({ error: 'Failed to update market item' });
    }
  });

  app.delete('/api/admin/market/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM market_items WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  });

  // Public User Information / Lead Submission
  app.post('/api/leads', (req, res) => {
    const {
      customer_name,
      phone,
      email,
      city,
      request_type,
      car_id,
      car_name,
      market_item_name,
      preferred_date,
      budget_usd,
      trade_in_info,
      message,
      lang,
    } = req.body || {};

    if (!customer_name || !phone || String(customer_name).trim().length < 2 || String(phone).trim().length < 7) {
      return res.status(400).json({ error: 'Name and valid phone are required' });
    }

    const result = db.prepare(`
      INSERT INTO leads (
        customer_name, phone, email, city, request_type,
        car_id, car_name, market_item_name, preferred_date,
        budget_usd, trade_in_info, message, lang, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
    `).run(
      String(customer_name).trim(),
      String(phone).trim(),
      String(email || '').trim(),
      String(city || '').trim(),
      request_type || 'test-drive',
      car_id ? Number(car_id) : null,
      car_name || '',
      market_item_name || '',
      preferred_date || '',
      String(budget_usd || '').trim(),
      String(trade_in_info || '').trim(),
      String(message || '').trim(),
      lang === 'ru' ? 'ru' : 'uz',
      new Date().toISOString()
    );
    const created = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ lead: created });
  });

  // Admin: Leads management
  app.get('/api/admin/leads', requireAdmin, (_req, res) => {
    const leads = db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
    res.json({ leads });
  });

  app.put('/api/admin/leads/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!['new', 'contacted', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, id);
    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    res.json({ lead: updated });
  });

  app.delete('/api/admin/leads/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM leads WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  });

  // Vite / Static middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aureon Motors server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
