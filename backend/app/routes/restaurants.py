import os
import re
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from typing import List, Optional
from app.database import get_db, get_next_id
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse
from app.auth import get_current_user
from app.config import get_settings
from app.kafka_producer import publish

settings = get_settings()
router = APIRouter(prefix="/api/restaurants", tags=["Restaurants"])


def _to_response(r: dict) -> RestaurantResponse:
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


def _update_restaurant_stats(db, restaurant_id: int):
    reviews = list(db["reviews"].find({"restaurant_id": restaurant_id}))
    count = len(reviews)
    avg = round(sum(r["rating"] for r in reviews) / count, 2) if count else 0.0
    db["restaurants"].update_one(
        {"id": restaurant_id},
        {"$set": {"average_rating": avg, "review_count": count}},
    )


@router.post("/", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    data: RestaurantCreate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    rid = get_next_id("restaurants")
    now = datetime.now(timezone.utc)
    restaurant = {
        "id": rid,
        **data.model_dump(),
        "created_by": current_user["id"],
        "owner_id": None,  # Only assigned via /claim endpoint
        "average_rating": 0.0,
        "review_count": 0,
        "photos": [],
        "created_at": now,
        "updated_at": now,
    }
    db["restaurants"].insert_one(restaurant)
    db["activity_logs"].insert_one({
        "user_id": current_user["id"], "action": "restaurant_created",
        "restaurant_id": rid, "created_at": now,
    })
    publish("restaurant.created", {"restaurant_id": rid, "name": data.name, "created_by": current_user["id"]})
    return _to_response(restaurant)


@router.get("/", response_model=List[RestaurantResponse])
def search_restaurants(
    name: Optional[str] = Query(None),
    cuisine_type: Optional[str] = Query(None),
    keywords: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    zip_code: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_db),
):
    filt = {}
    if name:
        filt["name"] = {"$regex": name, "$options": "i"}
    if cuisine_type:
        filt["cuisine_type"] = {"$regex": cuisine_type, "$options": "i"}
    if city:
        filt["city"] = {"$regex": city, "$options": "i"}
    if zip_code:
        filt["zip_code"] = zip_code
    if keywords:
        filt["$or"] = [
            {"name": {"$regex": keywords, "$options": "i"}},
            {"cuisine_type": {"$regex": keywords, "$options": "i"}},
            {"city": {"$regex": keywords, "$options": "i"}},
            {"description": {"$regex": keywords, "$options": "i"}},
            {"amenities": {"$regex": keywords, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    restaurants = list(db["restaurants"].find(filt).skip(skip).limit(limit))
    return [_to_response(r) for r in restaurants]


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: int, db=Depends(get_db)):
    r = db["restaurants"].find_one({"id": restaurant_id})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return _to_response(r)


@router.put("/{restaurant_id}", response_model=RestaurantResponse)
def update_restaurant(
    restaurant_id: int,
    data: RestaurantUpdate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    r = db["restaurants"].find_one({"id": restaurant_id})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if r.get("owner_id") != current_user["id"] and r.get("created_by") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now(timezone.utc)
    db["restaurants"].update_one({"id": restaurant_id}, {"$set": update_data})
    publish("restaurant.updated", {"restaurant_id": restaurant_id, "updated_by": current_user["id"]})
    return _to_response(db["restaurants"].find_one({"id": restaurant_id}))


@router.post("/{restaurant_id}/photos")
async def upload_restaurant_photo(
    restaurant_id: int,
    file: UploadFile = File(...),
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not db["restaurants"].find_one({"id": restaurant_id}):
        raise HTTPException(status_code=404, detail="Restaurant not found")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = file.filename.rsplit(".", 1)[-1]
    filename = f"restaurant_{restaurant_id}_{current_user['id']}_{int(time.time())}.{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    photo_url = f"/uploads/{filename}"
    db["restaurants"].update_one(
        {"id": restaurant_id},
        {"$push": {"photos": {"photo_url": photo_url, "uploaded_by": current_user["id"],
                               "created_at": datetime.now(timezone.utc)}}},
    )
    db["activity_logs"].insert_one({
        "user_id": current_user["id"], "action": "photo_uploaded",
        "restaurant_id": restaurant_id, "created_at": datetime.now(timezone.utc),
    })
    return {"photo_url": photo_url}


@router.post("/{restaurant_id}/claim", response_model=RestaurantResponse)
def claim_restaurant(
    restaurant_id: int,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owners can claim restaurants")
    r = db["restaurants"].find_one({"id": restaurant_id})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if r.get("owner_id"):
        raise HTTPException(status_code=400, detail="Restaurant already claimed")

    db["restaurants"].update_one(
        {"id": restaurant_id},
        {"$set": {"owner_id": current_user["id"], "updated_at": datetime.now(timezone.utc)}},
    )
    # Remove owner's own review if exists
    db["reviews"].delete_one({"user_id": current_user["id"], "restaurant_id": restaurant_id})
    _update_restaurant_stats(db, restaurant_id)
    publish("restaurant.claimed", {"restaurant_id": restaurant_id, "owner_id": current_user["id"]})
    return _to_response(db["restaurants"].find_one({"id": restaurant_id}))
