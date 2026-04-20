from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.database import get_db
from app.schemas.restaurant import RestaurantResponse
from app.schemas.review import ReviewResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/owner", tags=["Owner Dashboard"])


def _rest_to_response(r: dict) -> RestaurantResponse:
    photos = [p["photo_url"] for p in r.get("photos", [])]
    return RestaurantResponse(
        id=r["id"], name=r["name"], cuisine_type=r["cuisine_type"],
        description=r.get("description"), address=r.get("address"),
        city=r.get("city"), state=r.get("state"), zip_code=r.get("zip_code"),
        country=r.get("country"), phone=r.get("phone"), email=r.get("email"),
        website=r.get("website"), hours_of_operation=r.get("hours_of_operation"),
        pricing_tier=r.get("pricing_tier"), amenities=r.get("amenities"),
        average_rating=r.get("average_rating", 0.0),
        review_count=r.get("review_count", 0),
        owner_id=r.get("owner_id"), created_by=r["created_by"],
        created_at=r.get("created_at"), photos=photos,
    )


def _rev_to_response(r: dict, user_name: str = None) -> ReviewResponse:
    return ReviewResponse(
        id=r["id"], user_id=r["user_id"], restaurant_id=r["restaurant_id"],
        rating=r["rating"], comment=r.get("comment"), photo_url=r.get("photo_url"),
        created_at=r.get("created_at"), updated_at=r.get("updated_at"),
        user_name=user_name,
    )


@router.get("/restaurants", response_model=List[RestaurantResponse])
def get_owned_restaurants(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    restaurants = list(db["restaurants"].find({"owner_id": current_user["id"]}))
    return [_rest_to_response(r) for r in restaurants]


@router.get("/restaurants/{restaurant_id}/reviews", response_model=List[ReviewResponse])
def get_restaurant_reviews_for_owner(
    restaurant_id: int,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    r = db["restaurants"].find_one({"id": restaurant_id, "owner_id": current_user["id"]})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found or not owned by you")

    reviews = list(db["reviews"].find({"restaurant_id": restaurant_id}).sort("created_at", -1))
    result = []
    for rev in reviews:
        user = db["users"].find_one({"id": rev["user_id"]})
        result.append(_rev_to_response(rev, user["name"] if user else None))
    return result


@router.get("/unclaimed")
def get_unclaimed_restaurants(
    search: Optional[str] = Query(None),
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    filt = {"owner_id": None}
    if search:
        filt["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"cuisine_type": {"$regex": search, "$options": "i"}},
        ]
    restaurants = list(db["restaurants"].find(filt).limit(20))
    return [_rest_to_response(r) for r in restaurants]


@router.get("/dashboard")
def owner_dashboard(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")

    restaurants = list(db["restaurants"].find({"owner_id": current_user["id"]}))
    rest_ids = [r["id"] for r in restaurants]
    rest_map = {r["id"]: r["name"] for r in restaurants}

    all_reviews = list(db["reviews"].find({"restaurant_id": {"$in": rest_ids}})) if rest_ids else []
    total_reviews = len(all_reviews)
    total_rating = sum(r["rating"] for r in all_reviews)
    ratings_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rev in all_reviews:
        star = min(5, max(1, round(rev["rating"])))
        ratings_distribution[star] += 1

    recent_reviews = []
    sorted_reviews = sorted(all_reviews, key=lambda r: r.get("created_at") or "", reverse=True)[:10]
    for rev in sorted_reviews:
        user = db["users"].find_one({"id": rev["user_id"]})
        recent_reviews.append({
            "id": rev["id"], "restaurant_id": rev["restaurant_id"],
            "restaurant_name": rest_map.get(rev["restaurant_id"], ""),
            "user_name": user["name"] if user else "Anonymous",
            "rating": rev["rating"], "comment": rev.get("comment"),
            "created_at": str(rev.get("created_at", "")),
        })

    avg_rating = round(total_rating / total_reviews, 2) if total_reviews > 0 else 0.0
    if avg_rating >= 4.5: sentiment = "Excellent"
    elif avg_rating >= 4.0: sentiment = "Great"
    elif avg_rating >= 3.0: sentiment = "Good"
    elif avg_rating >= 2.0: sentiment = "Mixed"
    else: sentiment = "Needs Improvement"

    return {
        "total_restaurants": len(restaurants),
        "total_reviews": total_reviews,
        "average_rating": avg_rating,
        "ratings_distribution": ratings_distribution,
        "sentiment": sentiment,
        "recent_reviews": recent_reviews,
    }
