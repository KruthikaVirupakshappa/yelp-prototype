"""
seed_data.py — Populate Fork & Fire with sample data (MongoDB).
Run from the backend folder with the venv active:
    python seed_data.py
Safe to run multiple times — skips anything that already exists.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone
from app.database import _db as db, get_next_id, ensure_indexes
from app.auth import hash_password


def seed():
    ensure_indexes()
    print("\n Fork & Fire — Seed Data Script (MongoDB)")
    print("=" * 50)

    now = datetime.now(timezone.utc)

    # ── USERS ──────────────────────────────────────
    users_data = [
        {"name": "Alice Chen", "email": "alice@example.com", "password": "password123", "role": "user",
         "city": "San Jose", "state": "CA", "country": "United States", "gender": "female",
         "about_me": "Foodie who loves exploring new cuisines.", "languages": "English, Mandarin"},
        {"name": "Marcus Rivera", "email": "marcus@example.com", "password": "password123", "role": "user",
         "city": "San Francisco", "state": "CA", "country": "United States", "gender": "male",
         "about_me": "BBQ enthusiast and weekend brunch hunter.", "languages": "English, Spanish"},
        {"name": "Priya Nair", "email": "priya@example.com", "password": "password123", "role": "user",
         "city": "Sunnyvale", "state": "CA", "country": "United States", "gender": "female",
         "about_me": "Vegetarian looking for Indian and Mediterranean spots.", "languages": "English, Malayalam, Hindi"},
        {"name": "James Park", "email": "james@test.com", "password": "password123", "role": "owner",
         "city": "San Jose", "state": "CA", "country": "United States", "gender": "male",
         "about_me": "Owner of Golden Chopsticks.", "restaurant_location": "San Jose, CA"},
        {"name": "Sofia Bellini", "email": "owner.sofia@example.com", "password": "password123", "role": "owner",
         "city": "Santa Clara", "state": "CA", "country": "United States", "gender": "female",
         "about_me": "Running Bella Italia since 2018.", "restaurant_location": "Santa Clara, CA"},
        {"name": "Kevin Yoon", "email": "owner.kevin@example.com", "password": "password123", "role": "owner",
         "city": "San Jose", "state": "CA", "country": "United States", "gender": "male",
         "about_me": "Chef and owner of Seoul Kitchen. Trained in Seoul and San Francisco.", "restaurant_location": "San Jose, CA"},
        {"name": "Anh Nguyen", "email": "owner.anh@example.com", "password": "password123", "role": "owner",
         "city": "Cupertino", "state": "CA", "country": "United States", "gender": "female",
         "about_me": "Bringing authentic Thai flavors to the South Bay since 2015.", "restaurant_location": "Cupertino, CA"},
    ]

    created_users = {}
    for ud in users_data:
        existing = db["users"].find_one({"email": ud["email"]})
        if existing:
            print(f"  [skip] User: {ud['email']}")
            created_users[ud["email"]] = existing
            continue
        uid = get_next_id("users")
        user = {
            "id": uid, "name": ud["name"], "email": ud["email"],
            "password_hash": hash_password(ud["password"]),
            "role": ud["role"], "city": ud.get("city"), "state": ud.get("state"),
            "country": ud.get("country"), "gender": ud.get("gender"),
            "about_me": ud.get("about_me"), "languages": ud.get("languages"),
            "restaurant_location": ud.get("restaurant_location"),
            "created_at": now, "updated_at": now,
        }
        db["users"].insert_one(user)
        created_users[ud["email"]] = user
        print(f"  [+] User: {ud['name']} ({ud['role']})")

    # ── PREFERENCES ────────────────────────────────
    prefs_data = [
        {"email": "alice@example.com", "cuisine_preferences": "Chinese, Japanese, Korean",
         "price_range": "$$", "dietary_needs": "", "ambiance_preferences": "casual, cozy", "sort_preference": "rating"},
        {"email": "marcus@example.com", "cuisine_preferences": "BBQ, American, Mexican",
         "price_range": "$$", "dietary_needs": "", "ambiance_preferences": "casual, outdoor", "sort_preference": "popularity"},
        {"email": "priya@example.com", "cuisine_preferences": "Indian, Mediterranean, Vegan / Vegetarian",
         "price_range": "$$", "dietary_needs": "Vegetarian", "ambiance_preferences": "quiet, romantic", "sort_preference": "rating"},
    ]

    for pd in prefs_data:
        user = created_users.get(pd["email"])
        if not user:
            continue
        if db["preferences"].find_one({"user_id": user["id"]}):
            print(f"  [skip] Preferences: {pd['email']}")
            continue
        db["preferences"].insert_one({
            "id": get_next_id("preferences"), "user_id": user["id"],
            "cuisine_preferences": pd["cuisine_preferences"],
            "price_range": pd["price_range"], "dietary_needs": pd["dietary_needs"],
            "ambiance_preferences": pd["ambiance_preferences"],
            "sort_preference": pd["sort_preference"], "created_at": now,
        })
        print(f"  [+] Preferences: {pd['email']}")

    # ── RESTAURANTS ────────────────────────────────
    owner_james = created_users.get("james@test.com")
    owner_sofia = created_users.get("owner.sofia@example.com")
    owner_kevin = created_users.get("owner.kevin@example.com")
    owner_anh = created_users.get("owner.anh@example.com")
    alice = created_users.get("alice@example.com")

    restaurants_data = [
        {"name": "Golden Chopsticks", "cuisine_type": "Chinese",
         "description": "Authentic Cantonese dim sum and Hong Kong-style BBQ. Family recipes passed down three generations.",
         "address": "123 E Santa Clara St", "city": "San Jose", "state": "CA", "zip_code": "95113",
         "country": "United States", "phone": "(408) 555-0101", "pricing_tier": "$$",
         "hours_of_operation": "Mon-Sun 11am-9:30pm",
         "amenities": "Dine-in, Takeout, Parking, Halal options", "owner": owner_james},
        {"name": "Bella Italia", "cuisine_type": "Italian",
         "description": "Wood-fired Neapolitan pizzas and house-made pastas. Ingredients imported from Italy.",
         "address": "450 Lawrence Expy", "city": "Santa Clara", "state": "CA", "zip_code": "95051",
         "country": "United States", "phone": "(408) 555-0202", "pricing_tier": "$$$",
         "hours_of_operation": "Tue-Sun 5pm-10pm",
         "amenities": "Dine-in, Outdoor seating, Wine selection, Reservations", "owner": owner_sofia},
        {"name": "Spice Garden", "cuisine_type": "Indian",
         "description": "North and South Indian cuisine with a focus on vegetarian dishes. Great lunch buffet.",
         "address": "789 S Mathilda Ave", "city": "Sunnyvale", "state": "CA", "zip_code": "94087",
         "country": "United States", "phone": "(408) 555-0303", "pricing_tier": "$$",
         "hours_of_operation": "Mon-Fri 11:30am-3pm, 5:30pm-9:30pm; Sat-Sun 12pm-10pm",
         "amenities": "Dine-in, Takeout, Delivery, Vegetarian-friendly, Lunch buffet", "owner": None},
        {"name": "The Smoke Pit", "cuisine_type": "BBQ",
         "description": "Texas-style slow-smoked brisket, ribs, and pulled pork. Sides made fresh daily.",
         "address": "310 Castro St", "city": "Mountain View", "state": "CA", "zip_code": "94041",
         "country": "United States", "phone": "(650) 555-0404", "pricing_tier": "$$",
         "hours_of_operation": "Wed-Sun 11am-8pm (or until sold out)",
         "amenities": "Dine-in, Takeout, Outdoor picnic tables, Dog-friendly patio", "owner": None},
        {"name": "Sakura Sushi", "cuisine_type": "Japanese",
         "description": "Omakase and à la carte sushi with fish flown in from Tokyo twice a week.",
         "address": "200 S First St", "city": "San Jose", "state": "CA", "zip_code": "95113",
         "country": "United States", "phone": "(408) 555-0505", "pricing_tier": "$$$",
         "hours_of_operation": "Tue-Sun 12pm-2pm, 5pm-9:30pm",
         "amenities": "Dine-in, Sake bar, Reservations recommended", "owner": None},
        {"name": "Taco Loco", "cuisine_type": "Mexican",
         "description": "Authentic street tacos, burritos, and aguas frescas. Run by a family from Oaxaca.",
         "address": "88 N Winchester Blvd", "city": "Santa Clara", "state": "CA", "zip_code": "95050",
         "country": "United States", "phone": "(408) 555-0606", "pricing_tier": "$",
         "hours_of_operation": "Mon-Sat 9am-9pm, Sun 10am-7pm",
         "amenities": "Takeout, Delivery, Catering, Vegan options", "owner": None},
        {"name": "The Mediterranean Table", "cuisine_type": "Mediterranean",
         "description": "Greek and Lebanese mezze, grilled meats, and fresh salads. Perfect for groups.",
         "address": "1020 Blossom Hill Rd", "city": "San Jose", "state": "CA", "zip_code": "95123",
         "country": "United States", "phone": "(408) 555-0707", "pricing_tier": "$$",
         "hours_of_operation": "Mon-Sun 11am-9pm",
         "amenities": "Dine-in, Catering, Vegetarian-friendly, Gluten-free options", "owner": None},
        {"name": "Morning Glory Café", "cuisine_type": "Breakfast",
         "description": "All-day breakfast and brunch spot with locally sourced eggs and baked goods.",
         "address": "55 University Ave", "city": "Palo Alto", "state": "CA", "zip_code": "94301",
         "country": "United States", "phone": "(650) 555-0808", "pricing_tier": "$$",
         "hours_of_operation": "Mon-Fri 7am-3pm, Sat-Sun 8am-4pm",
         "amenities": "Dine-in, Outdoor seating, Wi-Fi, Vegan options", "owner": None},
        {"name": "Seoul Kitchen", "cuisine_type": "Korean",
         "description": "Modern Korean BBQ and traditional comfort dishes. Premium USDA meats, tabletop grills, and house-made kimchi fermented in-house.",
         "address": "630 N First St", "city": "San Jose", "state": "CA", "zip_code": "95112",
         "country": "United States", "phone": "(408) 555-0909", "pricing_tier": "$$",
         "hours_of_operation": "Mon-Thu 5pm-10pm, Fri-Sat 5pm-11pm, Sun 4pm-9:30pm",
         "amenities": "Dine-in, Tabletop BBQ grills, Reservations, Full bar, Private dining room", "owner": owner_kevin},
        {"name": "Thai Orchid", "cuisine_type": "Thai",
         "description": "Family recipes from Chiang Mai — aromatic curries, pad thai, and fresh papaya salads. Authentic flavors with locally sourced produce.",
         "address": "19800 Stevens Creek Blvd", "city": "Cupertino", "state": "CA", "zip_code": "95014",
         "country": "United States", "phone": "(408) 555-1010", "pricing_tier": "$$",
         "hours_of_operation": "Tue-Sun 11:30am-2:30pm, 5pm-9:30pm",
         "amenities": "Dine-in, Takeout, Delivery, Vegan options, Gluten-free options", "owner": owner_anh},
    ]

    created_restaurants = {}
    for rd in restaurants_data:
        existing = db["restaurants"].find_one({"name": rd["name"]})
        if existing:
            print(f"  [skip] Restaurant: {rd['name']}")
            created_restaurants[rd["name"]] = existing
            continue
        owner_obj = rd.get("owner")
        creator = owner_obj if owner_obj else (alice if alice else owner_james)
        rid = get_next_id("restaurants")
        rest = {
            "id": rid, "name": rd["name"], "cuisine_type": rd["cuisine_type"],
            "description": rd.get("description"), "address": rd.get("address"),
            "city": rd.get("city"), "state": rd.get("state"), "zip_code": rd.get("zip_code"),
            "country": rd.get("country"), "phone": rd.get("phone"),
            "pricing_tier": rd.get("pricing_tier"), "hours_of_operation": rd.get("hours_of_operation"),
            "amenities": rd.get("amenities"),
            "owner_id": owner_obj["id"] if owner_obj else None,
            "created_by": creator["id"],
            "average_rating": 0.0, "review_count": 0,
            "photos": [], "created_at": now, "updated_at": now,
        }
        db["restaurants"].insert_one(rest)
        created_restaurants[rd["name"]] = rest
        print(f"  [+] Restaurant: {rd['name']}")

    # ── REVIEWS ────────────────────────────────────
    reviews_data = [
        {"user": "alice@example.com", "restaurant": "Golden Chopsticks", "rating": 5,
         "comment": "The dim sum here is absolutely incredible — perfectly steamed har gow and the best BBQ pork buns I've had outside Hong Kong.",
         "photo_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800",
         "helpful_votes": 12, "unhelpful_votes": 1,
         "owner_reply": "Thank you Alice! We're so glad our family recipes brought back great memories. Come back soon — the weekend special is a new century egg congee!"},
        {"user": "marcus@example.com", "restaurant": "Golden Chopsticks", "rating": 4,
         "comment": "Really solid Chinese food. The Peking duck was crispy and flavorful.",
         "photo_url": "https://images.unsplash.com/photo-1600628421055-4d30de868b8f?w=800",
         "helpful_votes": 7, "unhelpful_votes": 0,
         "owner_reply": "Thanks Marcus! The Peking duck is our chef's pride. We'd love to have you try our new honey-glazed pork belly next time!"},
        {"user": "priya@example.com", "restaurant": "Golden Chopsticks", "rating": 4,
         "comment": "Good variety of vegetarian dim sum options. The tofu skin rolls were my favorite.",
         "helpful_votes": 5, "unhelpful_votes": 0},
        {"user": "alice@example.com", "restaurant": "Bella Italia", "rating": 5,
         "comment": "Best pizza I've had in the Bay Area — the margherita with buffalo mozzarella was heavenly.",
         "photo_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
         "helpful_votes": 18, "unhelpful_votes": 0,
         "owner_reply": "Cara Alice, grazie mille! Our mozzarella is flown in fresh from Campania every week — you have great taste! We look forward to welcoming you back."},
        {"user": "marcus@example.com", "restaurant": "Bella Italia", "rating": 4,
         "comment": "Excellent pasta and great wine list. The cacio e pepe was perfectly executed.",
         "photo_url": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=800",
         "helpful_votes": 9, "unhelpful_votes": 1,
         "owner_reply": "Thank you Marcus! Our sommelier hand-picks each wine to pair perfectly with the pasta. Ask for the Barolo next time — it's spectacular with the cacio e pepe!"},
        {"user": "priya@example.com", "restaurant": "Spice Garden", "rating": 5,
         "comment": "Finally a place that gets South Indian food right! The sambar is the real deal.",
         "photo_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
         "helpful_votes": 14, "unhelpful_votes": 0},
        {"user": "alice@example.com", "restaurant": "Spice Garden", "rating": 4,
         "comment": "Great butter chicken and naan. The mango lassi is refreshing.",
         "photo_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
         "helpful_votes": 6, "unhelpful_votes": 0},
        {"user": "marcus@example.com", "restaurant": "The Smoke Pit", "rating": 5,
         "comment": "This is the real deal Texas BBQ. The brisket has that perfect smoke ring.",
         "photo_url": "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800",
         "helpful_votes": 21, "unhelpful_votes": 2},
        {"user": "alice@example.com", "restaurant": "The Smoke Pit", "rating": 4,
         "comment": "Solid BBQ spot. The ribs fell off the bone. Mac and cheese was creamy and rich.",
         "helpful_votes": 8, "unhelpful_votes": 0},
        {"user": "alice@example.com", "restaurant": "Sakura Sushi", "rating": 5,
         "comment": "The omakase was a revelation. Chef Tanaka's knife work is extraordinary.",
         "photo_url": "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800",
         "helpful_votes": 16, "unhelpful_votes": 0},
        {"user": "priya@example.com", "restaurant": "Sakura Sushi", "rating": 4,
         "comment": "Beautiful presentation and the fish quality is exceptional.",
         "photo_url": "https://images.unsplash.com/photo-1562802378-063ec186a863?w=800",
         "helpful_votes": 10, "unhelpful_votes": 1},
        {"user": "marcus@example.com", "restaurant": "Taco Loco", "rating": 5,
         "comment": "Absolutely the best street tacos in the South Bay. The al pastor is perfectly seasoned.",
         "photo_url": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800",
         "helpful_votes": 19, "unhelpful_votes": 0},
        {"user": "priya@example.com", "restaurant": "Taco Loco", "rating": 4,
         "comment": "Great vegan options — the mushroom and rajas tacos were delicious.",
         "helpful_votes": 7, "unhelpful_votes": 0},
        {"user": "priya@example.com", "restaurant": "The Mediterranean Table", "rating": 5,
         "comment": "The mezze spread here is incredible. The hummus is made fresh daily.",
         "photo_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
         "helpful_votes": 11, "unhelpful_votes": 0},
        {"user": "alice@example.com", "restaurant": "Morning Glory Café", "rating": 4,
         "comment": "Lovely brunch spot. The avocado toast is actually good (rare!), and the cortado was perfect.",
         "photo_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
         "helpful_votes": 9, "unhelpful_votes": 0},
        {"user": "marcus@example.com", "restaurant": "Morning Glory Café", "rating": 4,
         "comment": "Really good eggs benedict with a light hollandaise.",
         "photo_url": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800",
         "helpful_votes": 5, "unhelpful_votes": 1},
        {"user": "priya@example.com", "restaurant": "Morning Glory Café", "rating": 5,
         "comment": "The granola bowl with seasonal fruit was incredible. Love that they source everything locally. Weekend wait is long but totally worth it.",
         "helpful_votes": 8, "unhelpful_votes": 0},

        # More Mediterranean Table reviews (was under-reviewed)
        {"user": "marcus@example.com", "restaurant": "The Mediterranean Table", "rating": 3,
         "comment": "Food was decent but service was a bit slow on a busy Saturday. The lamb kebabs were good but the pita bread came out cold.",
         "helpful_votes": 4, "unhelpful_votes": 2},
        {"user": "alice@example.com", "restaurant": "The Mediterranean Table", "rating": 4,
         "comment": "Loved the falafel wrap and the tabbouleh was light and fresh. Good spot for a group — the mezze platter feeds four easily.",
         "photo_url": "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800",
         "helpful_votes": 9, "unhelpful_votes": 0},

        # More Spice Garden
        {"user": "marcus@example.com", "restaurant": "Spice Garden", "rating": 3,
         "comment": "The lunch buffet is a great value but I found most dishes overly oily. The gulab jamun dessert was excellent though.",
         "helpful_votes": 3, "unhelpful_votes": 1},

        # More Taco Loco
        {"user": "alice@example.com", "restaurant": "Taco Loco", "rating": 3,
         "comment": "Tacos are good but not exceptional. Wait time at lunch is brutal — 25 minutes for a burrito. The salsa bar saves it.",
         "helpful_votes": 6, "unhelpful_votes": 1},

        # Smoke Pit — non-meat eater perspective
        {"user": "priya@example.com", "restaurant": "The Smoke Pit", "rating": 2,
         "comment": "Very limited options if you don't eat meat. The coleslaw and cornbread were fine but that's basically it for vegetarians. Worth knowing before you go.",
         "helpful_votes": 15, "unhelpful_votes": 3},

        # Seoul Kitchen — new restaurant reviews
        {"user": "alice@example.com", "restaurant": "Seoul Kitchen", "rating": 5,
         "comment": "Best Korean BBQ in San Jose, no contest. The wagyu beef and the spicy pork belly are must-orders. The house kimchi is perfectly fermented.",
         "photo_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800",
         "helpful_votes": 14, "unhelpful_votes": 0,
         "owner_reply": "Thank you Alice! Our kimchi is fermented for 3 weeks — we're so glad you could taste the difference. Come back for our weekend special: galbi jim!"},
        {"user": "marcus@example.com", "restaurant": "Seoul Kitchen", "rating": 4,
         "comment": "Super fun dinner experience. The tabletop grills work perfectly and the staff help you cook everything just right.",
         "photo_url": "https://images.unsplash.com/photo-1567360425618-1594206637d2?w=800",
         "helpful_votes": 10, "unhelpful_votes": 0},
        {"user": "priya@example.com", "restaurant": "Seoul Kitchen", "rating": 3,
         "comment": "Meat-heavy menu as expected but they do have some vegetarian options — the dubu jorim (spicy tofu) and japchae noodles were excellent. Gets smoky inside.",
         "helpful_votes": 7, "unhelpful_votes": 0},

        # Thai Orchid — new restaurant reviews
        {"user": "marcus@example.com", "restaurant": "Thai Orchid", "rating": 5,
         "comment": "The massaman curry here is the best I've ever had — rich, complex, with just the right amount of heat. Pad see ew was also fantastic.",
         "photo_url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
         "helpful_votes": 16, "unhelpful_votes": 0,
         "owner_reply": "Thank you so much! The massaman curry is my grandmother's recipe — we slow-cook it for 4 hours. So happy it resonated with you!"},
        {"user": "priya@example.com", "restaurant": "Thai Orchid", "rating": 5,
         "comment": "Incredible vegetarian options — the green papaya salad and tofu green curry were perfectly balanced. Not too sweet, not too spicy. Authentic flavors.",
         "photo_url": "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800",
         "helpful_votes": 11, "unhelpful_votes": 0,
         "owner_reply": "We're so glad you enjoyed the vegetarian dishes! We use fresh tofu delivered daily and our curries are all naturally vegan. Hope to see you again soon!"},
        {"user": "alice@example.com", "restaurant": "Thai Orchid", "rating": 4,
         "comment": "Really solid Thai food. The tom kha soup was coconutty and fragrant. Parking can be tricky in the plaza but totally worth the effort.",
         "helpful_votes": 6, "unhelpful_votes": 0},
    ]

    created_reviews = {}
    for rd in reviews_data:
        user = created_users.get(rd["user"])
        restaurant = created_restaurants.get(rd["restaurant"])
        if not user or not restaurant:
            continue
        existing = db["reviews"].find_one({"user_id": user["id"], "restaurant_id": restaurant["id"]})
        if existing:
            print(f"  [skip] Review: {user['name']} → {rd['restaurant']}")
            created_reviews[(rd["user"], rd["restaurant"])] = existing
            continue
        rev_id = get_next_id("reviews")
        owner_reply = rd.get("owner_reply")
        review_doc = {
            "id": rev_id, "user_id": user["id"], "restaurant_id": restaurant["id"],
            "rating": rd["rating"], "comment": rd["comment"],
            "photo_url": rd.get("photo_url"),
            "helpful_votes": rd.get("helpful_votes", 0),
            "unhelpful_votes": rd.get("unhelpful_votes", 0),
            "voters": {},
            "owner_reply": owner_reply,
            "owner_reply_at": now if owner_reply else None,
            "created_at": now, "updated_at": now,
        }
        db["reviews"].insert_one(review_doc)
        created_reviews[(rd["user"], rd["restaurant"])] = review_doc
        print(f"  [+] Review: {user['name']} → {rd['restaurant']} ({rd['rating']}★)"
              + (" [owner replied]" if owner_reply else ""))

    # Recalculate ratings
    for rest in db["restaurants"].find({}):
        reviews = list(db["reviews"].find({"restaurant_id": rest["id"]}))
        count = len(reviews)
        avg = round(sum(r["rating"] for r in reviews) / count, 2) if count else 0.0
        db["restaurants"].update_one({"id": rest["id"]}, {"$set": {"average_rating": avg, "review_count": count}})
    print("  [+] Recalculated all restaurant ratings")

    # ── FAVORITES ──────────────────────────────────
    favorites_data = [
        ("alice@example.com", "Sakura Sushi"), ("alice@example.com", "Bella Italia"),
        ("alice@example.com", "Spice Garden"), ("alice@example.com", "Seoul Kitchen"),
        ("alice@example.com", "Thai Orchid"),
        ("marcus@example.com", "The Smoke Pit"), ("marcus@example.com", "Taco Loco"),
        ("marcus@example.com", "Golden Chopsticks"), ("marcus@example.com", "Seoul Kitchen"),
        ("priya@example.com", "Spice Garden"), ("priya@example.com", "The Mediterranean Table"),
        ("priya@example.com", "Morning Glory Café"), ("priya@example.com", "Thai Orchid"),
    ]

    for user_email, rest_name in favorites_data:
        user = created_users.get(user_email)
        restaurant = created_restaurants.get(rest_name)
        if not user or not restaurant:
            continue
        if db["favorites"].find_one({"user_id": user["id"], "restaurant_id": restaurant["id"]}):
            print(f"  [skip] Favorite: {user['name']} → {rest_name}")
            continue
        db["favorites"].insert_one({
            "user_id": user["id"], "restaurant_id": restaurant["id"], "created_at": now,
        })
        print(f"  [+] Favorite: {user['name']} → {rest_name}")

    print("\n" + "=" * 50)
    print(" Seed complete!")
    print("  Users: 3 regular + 4 owners")
    print("  Restaurants: 10 total (incl. Seoul Kitchen, Thai Orchid)")
    print("  Reviews: up to 29 with photos, helpfulness votes, and owner replies")
    print("  Owner replies: 6 (Golden Chopsticks x2, Bella Italia x2, Seoul Kitchen x1, Thai Orchid x2)")
    print("  Favorites: 13")
    print("  Preferences: 3")
    print("\n  Login credentials (password: password123)")
    print("  alice@example.com / marcus@example.com / priya@example.com")
    print("  james@test.com / owner.sofia@example.com / owner.kevin@example.com / owner.anh@example.com")


if __name__ == "__main__":
    seed()
