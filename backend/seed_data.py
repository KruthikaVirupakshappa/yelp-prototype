"""
seed_data.py — Populate Fork & Fire with sample data.

Run this from the backend folder with the venv active:
    python seed_data.py

Safe to run multiple times — skips anything that already exists.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.review import Review
from app.models.favorite import Favorite
from app.models.user_preferences import UserPreferences
import bcrypt as _bcrypt
from sqlalchemy import func

def hash_pw(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")

def seed():
    db = SessionLocal()
    print("\n Fork & Fire — Seed Data Script")
    print("=" * 45)

    # ──────────────────────────────────────────
    # USERS
    # ──────────────────────────────────────────
    users_data = [
        {
            "name": "Alice Chen",
            "email": "alice@example.com",
            "password": "password123",
            "role": "user",
            "city": "San Jose",
            "state": "CA",
            "country": "United States",
            "gender": "female",
            "about_me": "Foodie who loves exploring new cuisines, especially Asian fusion.",
            "languages": "English, Mandarin",
        },
        {
            "name": "Marcus Rivera",
            "email": "marcus@example.com",
            "password": "password123",
            "role": "user",
            "city": "San Francisco",
            "state": "CA",
            "country": "United States",
            "gender": "male",
            "about_me": "BBQ enthusiast and weekend brunch hunter.",
            "languages": "English, Spanish",
        },
        {
            "name": "Priya Nair",
            "email": "priya@example.com",
            "password": "password123",
            "role": "user",
            "city": "Sunnyvale",
            "state": "CA",
            "country": "United States",
            "gender": "female",
            "about_me": "Vegetarian looking for the best Indian and Mediterranean spots.",
            "languages": "English, Malayalam, Hindi",
        },
        {
            "name": "James Park",
            "email": "owner.james@example.com",
            "password": "password123",
            "role": "owner",
            "city": "San Jose",
            "state": "CA",
            "country": "United States",
            "gender": "male",
            "about_me": "Owner of Golden Chopsticks. 15 years in the restaurant business.",
            "restaurant_location": "San Jose, CA",
        },
        {
            "name": "Sofia Bellini",
            "email": "owner.sofia@example.com",
            "password": "password123",
            "role": "owner",
            "city": "Santa Clara",
            "state": "CA",
            "country": "United States",
            "gender": "female",
            "about_me": "Passionate about authentic Italian cooking. Running Bella Italia since 2018.",
            "restaurant_location": "Santa Clara, CA",
        },
    ]

    created_users = {}
    for ud in users_data:
        existing = db.query(User).filter(User.email == ud["email"]).first()
        if existing:
            print(f"  [skip] User already exists: {ud['email']}")
            created_users[ud["email"]] = existing
            continue

        user = User(
            name=ud["name"],
            email=ud["email"],
            password_hash=hash_pw(ud["password"]),
            role=ud["role"],
            city=ud.get("city"),
            state=ud.get("state"),
            country=ud.get("country"),
            gender=ud.get("gender"),
            about_me=ud.get("about_me"),
            languages=ud.get("languages"),
            restaurant_location=ud.get("restaurant_location"),
        )
        db.add(user)
        db.flush()
        created_users[ud["email"]] = user
        print(f"  [+] Created user: {ud['name']} ({ud['role']})")

    db.commit()

    # ──────────────────────────────────────────
    # USER PREFERENCES
    # ──────────────────────────────────────────
    prefs_data = [
        {
            "email": "alice@example.com",
            "cuisine_preferences": "Chinese, Japanese, Korean",
            "price_range": "$$",
            "dietary_needs": "",
            "ambiance_preferences": "casual, cozy",
            "sort_preference": "rating",
        },
        {
            "email": "marcus@example.com",
            "cuisine_preferences": "BBQ, American, Mexican",
            "price_range": "$$",
            "dietary_needs": "",
            "ambiance_preferences": "casual, outdoor",
            "sort_preference": "popularity",
        },
        {
            "email": "priya@example.com",
            "cuisine_preferences": "Indian, Mediterranean, Vegan / Vegetarian",
            "price_range": "$$",
            "dietary_needs": "Vegetarian",
            "ambiance_preferences": "quiet, romantic",
            "sort_preference": "rating",
        },
    ]

    for pd in prefs_data:
        user = created_users.get(pd["email"])
        if not user or not user.id:
            continue
        existing = db.query(UserPreferences).filter(UserPreferences.user_id == user.id).first()
        if existing:
            print(f"  [skip] Preferences already exist for: {pd['email']}")
            continue
        pref = UserPreferences(
            user_id=user.id,
            cuisine_preferences=pd["cuisine_preferences"],
            price_range=pd["price_range"],
            dietary_needs=pd["dietary_needs"],
            ambiance_preferences=pd["ambiance_preferences"],
            sort_preference=pd["sort_preference"],
        )
        db.add(pref)
        print(f"  [+] Created preferences for: {pd['email']}")

    db.commit()

    # ──────────────────────────────────────────
    # RESTAURANTS
    # ──────────────────────────────────────────
    owner_james = created_users.get("owner.james@example.com")
    owner_sofia = created_users.get("owner.sofia@example.com")
    alice = created_users.get("alice@example.com")  # non-owner who adds some listings

    restaurants_data = [
        {
            "name": "Golden Chopsticks",
            "cuisine_type": "Chinese",
            "description": "Authentic Cantonese dim sum and Hong Kong-style BBQ. Family recipes passed down three generations.",
            "address": "123 E Santa Clara St",
            "city": "San Jose",
            "state": "CA",
            "zip_code": "95113",
            "country": "United States",
            "phone": "(408) 555-0101",
            "pricing_tier": "$$",
            "hours_of_operation": "Mon-Sun 11am-9:30pm",
            "amenities": "Dine-in, Takeout, Parking, Halal options",
            "owner": owner_james,
        },
        {
            "name": "Bella Italia",
            "cuisine_type": "Italian",
            "description": "Wood-fired Neapolitan pizzas and house-made pastas. Ingredients imported directly from Italy.",
            "address": "450 Lawrence Expy",
            "city": "Santa Clara",
            "state": "CA",
            "zip_code": "95051",
            "country": "United States",
            "phone": "(408) 555-0202",
            "pricing_tier": "$$$",
            "hours_of_operation": "Tue-Sun 5pm-10pm",
            "amenities": "Dine-in, Outdoor seating, Wine selection, Reservations",
            "owner": owner_sofia,
        },
        {
            "name": "Spice Garden",
            "cuisine_type": "Indian",
            "description": "North and South Indian cuisine with a focus on vegetarian dishes. Great lunch buffet on weekdays.",
            "address": "789 S Mathilda Ave",
            "city": "Sunnyvale",
            "state": "CA",
            "zip_code": "94087",
            "country": "United States",
            "phone": "(408) 555-0303",
            "pricing_tier": "$$",
            "hours_of_operation": "Mon-Fri 11:30am-3pm, 5:30pm-9:30pm; Sat-Sun 12pm-10pm",
            "amenities": "Dine-in, Takeout, Delivery, Vegetarian-friendly, Lunch buffet",
            "owner": None,  # unclaimed — for the claim feature demo
        },
        {
            "name": "The Smoke Pit",
            "cuisine_type": "BBQ",
            "description": "Texas-style slow-smoked brisket, ribs, and pulled pork. Sides made fresh daily.",
            "address": "310 Castro St",
            "city": "Mountain View",
            "state": "CA",
            "zip_code": "94041",
            "country": "United States",
            "phone": "(650) 555-0404",
            "pricing_tier": "$$",
            "hours_of_operation": "Wed-Sun 11am-8pm (or until sold out)",
            "amenities": "Dine-in, Takeout, Outdoor picnic tables, Dog-friendly patio",
            "owner": None,  # unclaimed
        },
        {
            "name": "Sakura Sushi",
            "cuisine_type": "Japanese",
            "description": "Omakase and à la carte sushi with fish flown in from Tokyo's Tsukiji market twice a week.",
            "address": "200 S First St",
            "city": "San Jose",
            "state": "CA",
            "zip_code": "95113",
            "country": "United States",
            "phone": "(408) 555-0505",
            "pricing_tier": "$$$",
            "hours_of_operation": "Tue-Sun 12pm-2pm, 5pm-9:30pm",
            "amenities": "Dine-in, Sake bar, Reservations recommended",
            "owner": None,
        },
        {
            "name": "Taco Loco",
            "cuisine_type": "Mexican",
            "description": "Authentic street tacos, burritos, and aguas frescas. Run by a family from Oaxaca.",
            "address": "88 N Winchester Blvd",
            "city": "Santa Clara",
            "state": "CA",
            "zip_code": "95050",
            "country": "United States",
            "phone": "(408) 555-0606",
            "pricing_tier": "$",
            "hours_of_operation": "Mon-Sat 9am-9pm, Sun 10am-7pm",
            "amenities": "Takeout, Delivery, Catering, Vegan options",
            "owner": None,
        },
        {
            "name": "The Mediterranean Table",
            "cuisine_type": "Mediterranean",
            "description": "Greek and Lebanese mezze, grilled meats, and fresh salads. Perfect for groups.",
            "address": "1020 Blossom Hill Rd",
            "city": "San Jose",
            "state": "CA",
            "zip_code": "95123",
            "country": "United States",
            "phone": "(408) 555-0707",
            "pricing_tier": "$$",
            "hours_of_operation": "Mon-Sun 11am-9pm",
            "amenities": "Dine-in, Catering, Vegetarian-friendly, Gluten-free options",
            "owner": None,
        },
        {
            "name": "Morning Glory Café",
            "cuisine_type": "Breakfast",
            "description": "All-day breakfast and brunch spot with locally sourced eggs and baked goods.",
            "address": "55 University Ave",
            "city": "Palo Alto",
            "state": "CA",
            "zip_code": "94301",
            "country": "United States",
            "phone": "(650) 555-0808",
            "pricing_tier": "$$",
            "hours_of_operation": "Mon-Fri 7am-3pm, Sat-Sun 8am-4pm",
            "amenities": "Dine-in, Outdoor seating, Wi-Fi, Vegan options",
            "owner": None,
        },
    ]

    created_restaurants = {}
    for rd in restaurants_data:
        existing = db.query(Restaurant).filter(Restaurant.name == rd["name"]).first()
        if existing:
            print(f"  [skip] Restaurant already exists: {rd['name']}")
            created_restaurants[rd["name"]] = existing
            continue

        owner_obj = rd.get("owner")
        creator = owner_obj if owner_obj else (alice if alice else owner_james)

        rest = Restaurant(
            name=rd["name"],
            cuisine_type=rd["cuisine_type"],
            description=rd.get("description"),
            address=rd.get("address"),
            city=rd.get("city"),
            state=rd.get("state"),
            zip_code=rd.get("zip_code"),
            country=rd.get("country"),
            phone=rd.get("phone"),
            pricing_tier=rd.get("pricing_tier"),
            hours_of_operation=rd.get("hours_of_operation"),
            amenities=rd.get("amenities"),
            owner_id=owner_obj.id if owner_obj else None,
            created_by=creator.id,
            average_rating=0.0,
            review_count=0,
        )
        db.add(rest)
        db.flush()
        created_restaurants[rd["name"]] = rest
        owned_by = owner_obj.name if owner_obj else "unclaimed"
        print(f"  [+] Created restaurant: {rd['name']} ({owned_by})")

    db.commit()

    # ──────────────────────────────────────────
    # REVIEWS
    # ──────────────────────────────────────────
    reviews_data = [
        # Golden Chopsticks
        {"user_email": "alice@example.com",  "restaurant": "Golden Chopsticks", "rating": 5, "comment": "The dim sum here is absolutely incredible — perfectly steamed har gow and the best BBQ pork buns I've had outside Hong Kong. Came on a Sunday morning and the place was packed, but the wait was worth it."},
        {"user_email": "marcus@example.com", "restaurant": "Golden Chopsticks", "rating": 4, "comment": "Really solid Chinese food. The Peking duck was crispy and flavorful. Service was a bit slow on a Friday evening but the food made up for it."},
        {"user_email": "priya@example.com",  "restaurant": "Golden Chopsticks", "rating": 4, "comment": "Good variety of vegetarian dim sum options. The tofu skin rolls were my favorite. Will definitely come back."},
        # Bella Italia
        {"user_email": "alice@example.com",  "restaurant": "Bella Italia", "rating": 5, "comment": "Best pizza I've had in the Bay Area — the margherita with buffalo mozzarella was heavenly. The burrata starter is a must-order. Slightly pricey but worth every dollar."},
        {"user_email": "marcus@example.com", "restaurant": "Bella Italia", "rating": 4, "comment": "Excellent pasta and great wine list. The cacio e pepe was perfectly executed. Book ahead — it fills up fast on weekends."},
        # Spice Garden
        {"user_email": "priya@example.com",  "restaurant": "Spice Garden", "rating": 5, "comment": "Finally a place that gets South Indian food right in the South Bay! The sambar is the real deal and the dosas are perfectly crispy. The lunch buffet is a fantastic deal."},
        {"user_email": "alice@example.com",  "restaurant": "Spice Garden", "rating": 4, "comment": "Great butter chicken and naan. The mango lassi is refreshing. A bit crowded at lunch but the food quality is consistently good."},
        # The Smoke Pit
        {"user_email": "marcus@example.com", "restaurant": "The Smoke Pit", "rating": 5, "comment": "This is the real deal Texas BBQ. The brisket has that perfect smoke ring and the bark is incredible. Get there early — they run out by 5pm most days."},
        {"user_email": "alice@example.com",  "restaurant": "The Smoke Pit", "rating": 4, "comment": "Solid BBQ spot. The ribs fell off the bone. Mac and cheese side was creamy and rich. Cash only so come prepared."},
        # Sakura Sushi
        {"user_email": "alice@example.com",  "restaurant": "Sakura Sushi", "rating": 5, "comment": "The omakase was a revelation. Chef Tanaka's knife work is extraordinary and you can really taste the freshness of the fish. Not cheap but an unforgettable experience."},
        {"user_email": "priya@example.com",  "restaurant": "Sakura Sushi", "rating": 4, "comment": "Beautiful presentation and the fish quality is exceptional. Went for the à la carte — the salmon belly and sea urchin were standouts. Will save up to come back for omakase."},
        # Taco Loco
        {"user_email": "marcus@example.com", "restaurant": "Taco Loco", "rating": 5, "comment": "Absolutely the best street tacos in the South Bay. The al pastor is perfectly seasoned and the handmade tortillas make all the difference. $3 tacos that blow any $18 taco bar out of the water."},
        {"user_email": "priya@example.com",  "restaurant": "Taco Loco", "rating": 4, "comment": "Great vegan options — the mushroom and rajas tacos were delicious. Friendly family-run vibe and quick service."},
        # Mediterranean Table
        {"user_email": "priya@example.com",  "restaurant": "The Mediterranean Table", "rating": 5, "comment": "The mezze spread here is incredible. The hummus is made fresh daily and the falafel is crispy on the outside, fluffy inside. Perfect spot for a vegetarian who wants a full, satisfying meal."},
        # Morning Glory Café
        {"user_email": "alice@example.com",  "restaurant": "Morning Glory Café", "rating": 4, "comment": "Lovely brunch spot. The avocado toast is actually good (rare!), and the cortado was perfectly pulled. Gets busy on weekends — go on a weekday if you can."},
        {"user_email": "marcus@example.com", "restaurant": "Morning Glory Café", "rating": 4, "comment": "Really good eggs benedict with a light hollandaise. The baked goods in the display case are all house-made and excellent. Only complaint is the wait on Sunday mornings."},
    ]

    for rd in reviews_data:
        user = created_users.get(rd["user_email"])
        restaurant = created_restaurants.get(rd["restaurant"])
        if not user or not restaurant:
            print(f"  [skip] Missing user/restaurant for review: {rd['user_email']} → {rd['restaurant']}")
            continue

        existing = db.query(Review).filter(
            Review.user_id == user.id,
            Review.restaurant_id == restaurant.id
        ).first()
        if existing:
            print(f"  [skip] Review already exists: {user.name} → {rd['restaurant']}")
            continue

        review = Review(
            user_id=user.id,
            restaurant_id=restaurant.id,
            rating=rd["rating"],
            comment=rd["comment"],
        )
        db.add(review)
        db.flush()
        print(f"  [+] Review: {user.name} → {rd['restaurant']} ({rd['rating']}★)")

    db.commit()

    # Update restaurant average ratings
    all_rests = db.query(Restaurant).all()
    for r in all_rests:
        stats = db.query(
            func.avg(Review.rating).label("avg"),
            func.count(Review.id).label("cnt"),
        ).filter(Review.restaurant_id == r.id).first()
        r.average_rating = round(float(stats.avg or 0), 2)
        r.review_count = stats.cnt or 0
    db.commit()
    print("  [+] Recalculated all restaurant ratings")

    # ──────────────────────────────────────────
    # FAVORITES
    # ──────────────────────────────────────────
    favorites_data = [
        ("alice@example.com",  "Sakura Sushi"),
        ("alice@example.com",  "Bella Italia"),
        ("alice@example.com",  "Spice Garden"),
        ("marcus@example.com", "The Smoke Pit"),
        ("marcus@example.com", "Taco Loco"),
        ("marcus@example.com", "Golden Chopsticks"),
        ("priya@example.com",  "Spice Garden"),
        ("priya@example.com",  "The Mediterranean Table"),
        ("priya@example.com",  "Morning Glory Café"),
    ]

    for user_email, rest_name in favorites_data:
        user = created_users.get(user_email)
        restaurant = created_restaurants.get(rest_name)
        if not user or not restaurant:
            continue

        existing = db.query(Favorite).filter(
            Favorite.user_id == user.id,
            Favorite.restaurant_id == restaurant.id,
        ).first()
        if existing:
            print(f"  [skip] Favorite already exists: {user.name} → {rest_name}")
            continue

        fav = Favorite(user_id=user.id, restaurant_id=restaurant.id)
        db.add(fav)
        print(f"  [+] Favorite: {user.name} → {rest_name}")

    db.commit()
    db.close()

    print("\n" + "=" * 45)
    print(" Seed complete! Here's what was created:")
    print("=" * 45)
    print("  Users         : 3 regular users + 2 owners")
    print("  Restaurants   : 8 total (2 owned, 6 unclaimed)")
    print("  Reviews       : up to 17 reviews across all restaurants")
    print("  Favorites     : 9 saved restaurants")
    print("  Preferences   : set for all 3 regular users")
    print()
    print("  Login credentials (all use password: password123)")
    print("  alice@example.com        — regular user")
    print("  marcus@example.com       — regular user")
    print("  priya@example.com        — regular user")
    print("  owner.james@example.com  — owner (Golden Chopsticks)")
    print("  owner.sofia@example.com  — owner (Bella Italia)")
    print()

if __name__ == "__main__":
    seed()
