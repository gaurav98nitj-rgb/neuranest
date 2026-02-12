"""Seed script - populates NeuraNest with realistic sample data."""
import asyncio
import random
import uuid
import json
from datetime import datetime, timedelta
import math

import asyncpg

DB_URL = "postgresql://neuranest:neuranest_dev@postgres:5432/neuranest"

TOPICS = [
    {"name": "Portable Neck Fan", "slug": "portable-neck-fan", "category": "Electronics", "stage": "exploding", "desc": "Wearable hands-free cooling fans"},
    {"name": "Mushroom Coffee", "slug": "mushroom-coffee", "category": "Health", "stage": "emerging", "desc": "Functional mushroom-infused coffee blends"},
    {"name": "LED Face Mask", "slug": "led-face-mask", "category": "Beauty", "stage": "exploding", "desc": "LED light therapy facial devices"},
    {"name": "Under Desk Treadmill", "slug": "under-desk-treadmill", "category": "Fitness", "stage": "peaking", "desc": "Compact treadmills for WFH offices"},
    {"name": "Ice Barrel Cold Plunge", "slug": "ice-barrel-cold-plunge", "category": "Fitness", "stage": "emerging", "desc": "Cold water immersion therapy tubs"},
    {"name": "Smart Bird Feeder", "slug": "smart-bird-feeder", "category": "Outdoors", "stage": "emerging", "desc": "AI-powered bird identification feeders"},
    {"name": "Ramen Kit Subscription", "slug": "ramen-kit-subscription", "category": "Kitchen", "stage": "emerging", "desc": "Authentic ramen meal kits"},
    {"name": "Dog DNA Test", "slug": "dog-dna-test", "category": "Pets", "stage": "peaking", "desc": "At-home canine genetic testing kits"},
    {"name": "Weighted Sleep Mask", "slug": "weighted-sleep-mask", "category": "Health", "stage": "exploding", "desc": "Pressure therapy eye masks for sleep"},
    {"name": "Solar Power Bank", "slug": "solar-power-bank", "category": "Electronics", "stage": "peaking", "desc": "Solar-charged portable batteries"},
    {"name": "Matcha Whisk Set", "slug": "matcha-whisk-set", "category": "Kitchen", "stage": "emerging", "desc": "Traditional bamboo matcha preparation kits"},
    {"name": "Posture Corrector", "slug": "posture-corrector", "category": "Health", "stage": "declining", "desc": "Wearable back posture training devices"},
    {"name": "Outdoor Pizza Oven", "slug": "outdoor-pizza-oven", "category": "Kitchen", "stage": "peaking", "desc": "Portable wood/gas fired pizza ovens"},
    {"name": "Baby Monitor AI", "slug": "baby-monitor-ai", "category": "Baby", "stage": "emerging", "desc": "AI baby monitoring with cry analysis"},
    {"name": "Desk Bike", "slug": "desk-bike", "category": "Fitness", "stage": "declining", "desc": "Under-desk pedal exercise bikes"},
    {"name": "Smart Garden", "slug": "smart-garden", "category": "Home", "stage": "emerging", "desc": "Indoor hydroponic automated gardens"},
    {"name": "Portable Projector", "slug": "portable-projector", "category": "Electronics", "stage": "exploding", "desc": "Mini LED/laser projectors"},
    {"name": "Collagen Peptides", "slug": "collagen-peptides", "category": "Health", "stage": "peaking", "desc": "Hydrolyzed collagen protein supplements"},
    {"name": "Electric Spin Scrubber", "slug": "electric-spin-scrubber", "category": "Home", "stage": "exploding", "desc": "Cordless rotating cleaning brushes"},
    {"name": "Cat GPS Tracker", "slug": "cat-gps-tracker", "category": "Pets", "stage": "emerging", "desc": "Lightweight GPS collars for cats"},
]

SOURCES = ["google_trends", "keywordtool", "junglescout", "reddit", "amazon_catalog"]
BRANDS = ["BrandX", "ProMax", "EcoLife", "TechNova", "ZenWell", "PureGlow", "VitaCore", "SwiftGear", "NaturePeak", "ClearView"]
ASPECTS = ["quality", "durability", "battery_life", "ease_of_use", "value", "design", "packaging", "noise_level", "comfort", "size", "weight", "customer_service"]


def trend_curve(stage, day_offset, total_days):
    t = day_offset / total_days
    base = random.uniform(20, 40)
    noise = random.gauss(0, 3)
    if stage == "emerging":
        return base + 40 * (math.exp(2 * t) - 1) / (math.exp(2) - 1) + noise
    elif stage == "exploding":
        return base + 60 * (math.exp(3 * t) - 1) / (math.exp(3) - 1) + noise
    elif stage == "peaking":
        return base + 50 * math.sin(math.pi * t) + noise
    elif stage == "declining":
        return base + 40 * (1 - t) + noise
    return base + noise


async def seed():
    conn = await asyncpg.connect(DB_URL)
    print("Connected to database")

    count = await conn.fetchval("SELECT COUNT(*) FROM topics")
    if count > 0:
        print(f"Clearing existing data...")
        for table in ["alert_events", "alerts", "watchlists", "review_aspects", "reviews",
                       "gen_next_specs", "scores", "forecasts", "derived_features",
                       "topic_top_asins", "amazon_competition_snapshot", "source_timeseries",
                       "keywords", "topic_category_map", "topics", "asins"]:
            await conn.execute(f"DELETE FROM {table}")

    now = datetime.utcnow()
    topic_ids = []

    print("Creating 20 topics...")
    for t in TOPICS:
        tid = uuid.uuid4()
        topic_ids.append((tid, t))
        await conn.execute(
            "INSERT INTO topics (id, name, slug, primary_category, stage, description, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,true,$7)",
            tid, t["name"], t["slug"], t["category"], t["stage"], t["desc"], now)

    print("Creating keywords...")
    for tid, t in topic_ids:
        for suffix in ["", " best", " review", " cheap", " amazon"]:
            await conn.execute(
                "INSERT INTO keywords (id, topic_id, keyword, source, geo, language) VALUES ($1,$2,$3,'keywordtool','US','en')",
                uuid.uuid4(), tid, t["name"].lower() + suffix)

    print("Creating timeseries...")
    total_days = 365
    for tid, t in topic_ids:
        sources = random.sample(SOURCES, k=random.randint(2, 4))
        for source in sources:
            for day in range(0, total_days, 7):
                date = (now - timedelta(days=total_days - day)).date()
                val = max(0, trend_curve(t["stage"], day, total_days))
                norm = min(100, max(0, val))
                await conn.execute(
                    "INSERT INTO source_timeseries (topic_id, source, date, geo, raw_value, normalized_value) VALUES ($1,$2,$3,'US',$4,$5) ON CONFLICT DO NOTHING",
                    tid, source, date, round(val, 2), round(norm, 2))

    print("Creating ASINs...")
    asin_codes = []
    for i in range(60):
        asin = f"B0{random.randint(10000000, 99999999)}"
        brand = random.choice(BRANDS)
        asin_codes.append(asin)
        await conn.execute(
            "INSERT INTO asins (asin, title, brand, category_path, price, rating, review_count) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            asin,
            f"{brand} {random.choice(['Pro','Max','Ultra','Lite','Plus'])} {random.choice(['Edition','Series','V2','X'])}",
            brand, random.choice(["Electronics", "Health", "Kitchen", "Fitness", "Home"]),
            round(random.uniform(15, 299), 2), round(random.uniform(3.2, 4.9), 2),
            random.randint(50, 15000))

    print("Linking topics to ASINs...")
    for tid, t in topic_ids:
        selected = random.sample(asin_codes, k=5)
        for rank, asin in enumerate(selected, 1):
            await conn.execute(
                "INSERT INTO topic_top_asins (topic_id, asin, rank, relevance_score) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING",
                tid, asin, rank, round(random.uniform(0.7, 1.0), 4))

    print("Creating competition snapshots...")
    for tid, t in topic_ids:
        await conn.execute(
            "INSERT INTO amazon_competition_snapshot (id, topic_id, date, marketplace, listing_count, median_price, avg_price, price_std, median_reviews, avg_rating, brand_count, brand_hhi, top3_brand_share) VALUES ($1,$2,$3,'US',$4,$5,$6,$7,$8,$9,$10,$11,$12)",
            uuid.uuid4(), tid, now.date(), random.randint(30, 800),
            round(random.uniform(15, 200), 2), round(random.uniform(20, 250), 2),
            round(random.uniform(5, 80), 2), random.randint(100, 5000),
            round(random.uniform(3.5, 4.7), 2), random.randint(5, 50),
            round(random.uniform(0.05, 0.4), 6), round(random.uniform(0.15, 0.7), 4))

    print("Creating reviews...")
    review_ids = []
    for asin in asin_codes[:30]:
        for j in range(random.randint(5, 12)):
            rid = f"R{uuid.uuid4().hex[:12].upper()}"
            stars = random.choices([1, 2, 3, 4, 5], weights=[5, 8, 12, 30, 45])[0]
            review_ids.append((rid, stars))
            await conn.execute(
                "INSERT INTO reviews (review_id, asin, stars, title, body, review_date, verified_purchase) VALUES ($1,$2,$3,$4,$5,$6,$7)",
                rid, asin, stars,
                random.choice(["Great product!", "Not bad", "Exceeded expectations", "Decent quality", "Waste of money", "Love it", "OK for the price"]),
                random.choice(["Works as advertised. Very happy.", "Good build quality but could be better.", "Arrived damaged but replacement was fast.", "Best purchase this year!", "Not worth the hype.", "Perfect for daily use."]),
                (now - timedelta(days=random.randint(1, 180))).date(),
                random.random() > 0.2)

    print("Creating review aspects...")
    for rid, stars in review_ids:
        for aspect in random.sample(ASPECTS, k=random.randint(2, 4)):
            sentiment = "positive" if stars >= 4 else ("negative" if stars <= 2 else random.choice(["positive", "negative", "neutral"]))
            await conn.execute(
                "INSERT INTO review_aspects (review_id, aspect, sentiment, confidence, evidence_snippet) VALUES ($1,$2,$3,$4,$5)",
                rid, aspect, sentiment, round(random.uniform(0.6, 0.99), 2),
                f"The {aspect.replace('_', ' ')} is {'excellent' if sentiment == 'positive' else 'disappointing' if sentiment == 'negative' else 'acceptable'}.")

    print("Creating scores...")
    for tid, t in topic_ids:
        stage_map = {"emerging": (55, 85), "exploding": (65, 95), "peaking": (40, 70), "declining": (15, 45)}
        low, high = stage_map.get(t["stage"], (30, 70))
        for stype, val in [("opportunity", round(random.uniform(low, high), 2)), ("competition", round(random.uniform(20, 85), 2))]:
            await conn.execute(
                "INSERT INTO scores (id, topic_id, score_type, score_value, explanation_json, computed_at) VALUES ($1,$2,$3,$4,$5,$6)",
                uuid.uuid4(), tid, stype, val,
                json.dumps({"demand_growth": round(random.uniform(10, 30), 1), "low_competition": round(random.uniform(20, 60), 1)}),
                now)

    print("Creating forecasts...")
    for tid, t in topic_ids:
        for horizon in [3, 6]:
            for mo in range(1, horizon + 1):
                fdate = (now + timedelta(days=30 * mo)).date()
                base_val = random.uniform(40, 80)
                direction = 1.1 if t["stage"] in ("emerging", "exploding") else 0.9
                yhat = round(base_val * (direction ** mo), 2)
                await conn.execute(
                    "INSERT INTO forecasts (id, topic_id, horizon_months, forecast_date, yhat, yhat_lower, yhat_upper, model_version, generated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'prophet_v1',$8)",
                    uuid.uuid4(), tid, horizon, fdate, yhat, round(yhat * 0.75, 2), round(yhat * 1.25, 2), now)

    print("Creating Gen-Next specs...")
    for tid, t in topic_ids[:10]:
        must_fix = [
            {"issue": "Poor battery life reported", "severity": "critical", "evidence": "42% of negative reviews mention battery"},
            {"issue": "Flimsy build quality", "severity": "high", "evidence": "28% mention durability concerns"}
        ]
        must_add = [
            {"feature": "USB-C fast charging", "priority": 1, "demand_signal": "Mentioned in 35% of competitor reviews"},
            {"feature": "App connectivity", "priority": 2, "demand_signal": "Growing Reddit discussion +180% MoM"},
            {"feature": "Noise reduction mode", "priority": 3, "demand_signal": "Top pain point in review analysis"}
        ]
        differentiators = [
            {"idea": "Eco-friendly materials", "rationale": "Sustainability trending +40% in category"},
            {"idea": "Modular design system", "rationale": "No competitor offers customizable components"}
        ]
        positioning = {
            "target_price": round(random.uniform(29, 149)),
            "target_rating": 4.5,
            "tagline": f"The smarter {t['name'].lower()} for modern life",
            "target_demographic": "Health-conscious millennials, 25-40, urban"
        }
        await conn.execute(
            "INSERT INTO gen_next_specs (id, topic_id, version, must_fix_json, must_add_json, differentiators_json, positioning_json, model_used, generated_at) VALUES ($1,$2,1,$3,$4,$5,$6,'claude-sonnet-4-5-20250929',$7)",
            uuid.uuid4(), tid, json.dumps(must_fix), json.dumps(must_add), json.dumps(differentiators), json.dumps(positioning), now)

    print("Creating category mappings...")
    for tid, t in topic_ids:
        await conn.execute(
            "INSERT INTO topic_category_map (topic_id, category, confidence) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
            tid, t["category"], round(random.uniform(0.85, 0.99), 4))

    print(f"\n✅ Seeding complete!")
    print(f"   20 topics | 100 keywords | ~3000 timeseries points")
    print(f"   60 ASINs | ~250 reviews | ~750 aspects")
    print(f"   20 competition snapshots | 40 scores | 180 forecasts")
    print(f"   10 Gen-Next specs")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(seed())
