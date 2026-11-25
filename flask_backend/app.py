"""
Python (Flask) + SQLite3 backend mirror for Aureon Motors.
Uses the exact same `autosalon.db` schema as `server.ts`.
Run locally:
  pip install -r requirements.txt
  python app.py
"""
import os
import sqlite3
from datetime import datetime, timezone
from functools import wraps
from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "autosalon.db")
DIST_DIR = os.path.join(BASE_DIR, "dist")
ADMIN_PASSCODE = os.environ.get("ADMIN_PASSCODE", "admin2026")
ADMIN_TOKEN = "aureon-admin-session"

app = Flask(__name__, static_folder=DIST_DIR, static_url_path="")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.headers.get("x-admin-token") != ADMIN_TOKEN:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


@app.get("/api/storefront")
def get_storefront():
    conn = get_db()
    settings = conn.execute("SELECT * FROM site_settings WHERE id = 1").fetchone()
    cars = conn.execute("SELECT * FROM cars ORDER BY featured DESC, id DESC").fetchall()
    offers = conn.execute(
        "SELECT * FROM aside_offers WHERE active = 1 ORDER BY sort_order ASC, id ASC"
    ).fetchall()
    market_items = conn.execute(
        "SELECT * FROM market_items WHERE active = 1 ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return jsonify({
        "settings": dict(settings) if settings else None,
        "cars": [dict(r) for r in cars],
        "offers": [dict(r) for r in offers],
        "marketItems": [dict(r) for r in market_items],
    })


@app.post("/api/admin/login")
def admin_login():
    data = request.get_json(silent=True) or {}
    if data.get("passcode") == ADMIN_PASSCODE:
        return jsonify({"ok": True, "token": ADMIN_TOKEN})
    return jsonify({"ok": False, "error": "Invalid passcode"}), 401


@app.put("/api/admin/settings")
@require_admin
def update_settings():
    b = request.get_json(silent=True) or {}
    conn = get_db()
    conn.execute(
        """
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
          telegram_url = ?,
          updated_at = ?
        WHERE id = 1
        """,
        (
            b.get("brand_name"),
            b.get("hero_title_uz"), b.get("hero_title_ru"),
            b.get("hero_subtitle_uz"), b.get("hero_subtitle_ru"),
            b.get("hero_cta_uz"), b.get("hero_cta_ru"),
            b.get("hero_image"),
            b.get("about_title_uz"), b.get("about_title_ru"),
            b.get("about_body_uz"), b.get("about_body_ru"),
            b.get("stat_1_value"), b.get("stat_1_label_uz"), b.get("stat_1_label_ru"),
            b.get("stat_2_value"), b.get("stat_2_label_uz"), b.get("stat_2_label_ru"),
            b.get("stat_3_value"), b.get("stat_3_label_uz"), b.get("stat_3_label_ru"),
            b.get("phone"), b.get("email"),
            b.get("address_uz"), b.get("address_ru"),
            b.get("hours_uz"), b.get("hours_ru"),
            b.get("footer_note_uz"), b.get("footer_note_ru"),
            b.get("telegram_url", "https://t.me/aureonmotors"),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    updated = dict(conn.execute("SELECT * FROM site_settings WHERE id = 1").fetchone())
    conn.close()
    return jsonify({"settings": updated})


@app.route("/api/admin/cars", methods=["GET", "POST"])
@require_admin
def admin_cars():
    conn = get_db()
    if request.method == "GET":
        rows = conn.execute("SELECT * FROM cars ORDER BY id DESC").fetchall()
        conn.close()
        return jsonify({"cars": [dict(r) for r in rows]})

    c = request.get_json(silent=True) or {}
    cur = conn.execute(
        """
        INSERT INTO cars (
          name, brand, category, year, price_usd,
          power_uz, power_ru, acceleration,
          transmission_uz, transmission_ru,
          fuel_uz, fuel_ru, color_uz, color_ru,
          description_uz, description_ru,
          image_url, status, featured, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            c.get("name"), c.get("brand"), c.get("category"),
            int(c.get("year", 2025)), int(c.get("price_usd", 0)),
            c.get("power_uz"), c.get("power_ru"), c.get("acceleration", ""),
            c.get("transmission_uz"), c.get("transmission_ru"),
            c.get("fuel_uz"), c.get("fuel_ru"),
            c.get("color_uz"), c.get("color_ru"),
            c.get("description_uz"), c.get("description_ru"),
            c.get("image_url"), c.get("status", "available"),
            1 if c.get("featured") else 0, datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    car = dict(conn.execute("SELECT * FROM cars WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify({"car": car}), 201


@app.route("/api/admin/cars/<int:car_id>", methods=["PUT", "DELETE"])
@require_admin
def admin_car_detail(car_id):
    conn = get_db()
    if request.method == "DELETE":
        conn.execute("DELETE FROM cars WHERE id = ?", (car_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

    c = request.get_json(silent=True) or {}
    conn.execute(
        """
        UPDATE cars SET
          name = ?, brand = ?, category = ?, year = ?, price_usd = ?,
          power_uz = ?, power_ru = ?, acceleration = ?,
          transmission_uz = ?, transmission_ru = ?,
          fuel_uz = ?, fuel_ru = ?, color_uz = ?, color_ru = ?,
          description_uz = ?, description_ru = ?,
          image_url = ?, status = ?, featured = ?
        WHERE id = ?
        """,
        (
            c.get("name"), c.get("brand"), c.get("category"),
            int(c.get("year", 2025)), int(c.get("price_usd", 0)),
            c.get("power_uz"), c.get("power_ru"), c.get("acceleration", ""),
            c.get("transmission_uz"), c.get("transmission_ru"),
            c.get("fuel_uz"), c.get("fuel_ru"),
            c.get("color_uz"), c.get("color_ru"),
            c.get("description_uz"), c.get("description_ru"),
            c.get("image_url"), c.get("status", "available"),
            1 if c.get("featured") else 0, car_id,
        ),
    )
    conn.commit()
    car = dict(conn.execute("SELECT * FROM cars WHERE id = ?", (car_id,)).fetchone())
    conn.close()
    return jsonify({"car": car})


@app.route("/api/admin/market", methods=["GET", "POST"])
@require_admin
def admin_market():
    conn = get_db()
    if request.method == "GET":
        rows = conn.execute("SELECT * FROM market_items ORDER BY id DESC").fetchall()
        conn.close()
        return jsonify({"items": [dict(r) for r in rows]})

    m = request.get_json(silent=True) or {}
    cur = conn.execute(
        """
        INSERT INTO market_items (
          sku, title_uz, title_ru, category, price_usd, stock,
          description_uz, description_ru, image_url, active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            m.get("sku", "AUR-ITEM"), m.get("title_uz"), m.get("title_ru"),
            m.get("category", "accessories"), int(m.get("price_usd", 0)),
            int(m.get("stock", 1)), m.get("description_uz", ""),
            m.get("description_ru", ""), m.get("image_url", ""),
            1 if m.get("active", True) else 0, datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    item = dict(conn.execute("SELECT * FROM market_items WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify({"item": item}), 201


@app.route("/api/admin/market/<int:item_id>", methods=["PUT", "DELETE"])
@require_admin
def admin_market_detail(item_id):
    conn = get_db()
    if request.method == "DELETE":
        conn.execute("DELETE FROM market_items WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

    m = request.get_json(silent=True) or {}
    conn.execute(
        """
        UPDATE market_items SET
          sku = ?, title_uz = ?, title_ru = ?, category = ?, price_usd = ?, stock = ?,
          description_uz = ?, description_ru = ?, image_url = ?, active = ?
        WHERE id = ?
        """,
        (
            m.get("sku", "AUR-ITEM"), m.get("title_uz"), m.get("title_ru"),
            m.get("category", "accessories"), int(m.get("price_usd", 0)),
            int(m.get("stock", 0)), m.get("description_uz", ""),
            m.get("description_ru", ""), m.get("image_url", ""),
            1 if m.get("active") else 0, item_id,
        ),
    )
    conn.commit()
    item = dict(conn.execute("SELECT * FROM market_items WHERE id = ?", (item_id,)).fetchone())
    conn.close()
    return jsonify({"item": item})


@app.route("/api/admin/offers", methods=["GET", "POST"])
@require_admin
def admin_offers():
    conn = get_db()
    if request.method == "GET":
        rows = conn.execute("SELECT * FROM aside_offers ORDER BY sort_order ASC, id ASC").fetchall()
        conn.close()
        return jsonify({"offers": [dict(r) for r in rows]})

    o = request.get_json(silent=True) or {}
    cur = conn.execute(
        """
        INSERT INTO aside_offers (title_uz, title_ru, summary_uz, summary_ru, metric_text, sort_order, active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            o.get("title_uz"), o.get("title_ru"),
            o.get("summary_uz"), o.get("summary_ru"),
            o.get("metric_text", ""), int(o.get("sort_order", 0)),
            1 if o.get("active", True) else 0,
        ),
    )
    conn.commit()
    offer = dict(conn.execute("SELECT * FROM aside_offers WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify({"offer": offer}), 201


@app.route("/api/admin/offers/<int:offer_id>", methods=["PUT", "DELETE"])
@require_admin
def admin_offer_detail(offer_id):
    conn = get_db()
    if request.method == "DELETE":
        conn.execute("DELETE FROM aside_offers WHERE id = ?", (offer_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

    o = request.get_json(silent=True) or {}
    conn.execute(
        """
        UPDATE aside_offers SET
          title_uz = ?, title_ru = ?, summary_uz = ?, summary_ru = ?,
          metric_text = ?, sort_order = ?, active = ?
        WHERE id = ?
        """,
        (
            o.get("title_uz"), o.get("title_ru"),
            o.get("summary_uz"), o.get("summary_ru"),
            o.get("metric_text", ""), int(o.get("sort_order", 0)),
            1 if o.get("active") else 0, offer_id,
        ),
    )
    conn.commit()
    offer = dict(conn.execute("SELECT * FROM aside_offers WHERE id = ?", (offer_id,)).fetchone())
    conn.close()
    return jsonify({"offer": offer})


@app.post("/api/leads")
def create_lead():
    d = request.get_json(silent=True) or {}
    name = str(d.get("customer_name", "")).strip()
    phone = str(d.get("phone", "")).strip()
    if len(name) < 2 or len(phone) < 7:
        return jsonify({"error": "Name and valid phone are required"}), 400
    conn = get_db()
    cur = conn.execute(
        """
        INSERT INTO leads (
          customer_name, phone, email, city, request_type,
          car_id, car_name, market_item_name, preferred_date,
          budget_usd, trade_in_info, message, lang, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
        """,
        (
            name, phone, str(d.get("email", "")).strip(), str(d.get("city", "")).strip(),
            d.get("request_type", "test-drive"), d.get("car_id"), d.get("car_name", ""),
            d.get("market_item_name", ""), d.get("preferred_date", ""),
            str(d.get("budget_usd", "")).strip(), str(d.get("trade_in_info", "")).strip(),
            str(d.get("message", "")).strip(), "ru" if d.get("lang") == "ru" else "uz",
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    lead = dict(conn.execute("SELECT * FROM leads WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify({"lead": lead}), 201


@app.get("/api/admin/leads")
@require_admin
def get_leads():
    conn = get_db()
    rows = conn.execute("SELECT * FROM leads ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify({"leads": [dict(r) for r in rows]})


@app.route("/api/admin/leads/<int:lead_id>", methods=["PUT", "DELETE"])
@require_admin
def admin_lead_detail(lead_id):
    conn = get_db()
    if request.method == "DELETE":
        conn.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in ("new", "contacted", "completed"):
        conn.close()
        return jsonify({"error": "Invalid status"}), 400
    conn.execute("UPDATE leads SET status = ? WHERE id = ?", (status, lead_id))
    conn.commit()
    lead = dict(conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone())
    conn.close()
    return jsonify({"lead": lead})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_index(path):
    if path and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    if os.path.exists(os.path.join(DIST_DIR, "index.html")):
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({"status": "Flask SQLite3 backend ready. Build frontend with npm run build."})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
