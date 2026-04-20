from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.database import get_db
from app.schemas.restaurant import RestaurantResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


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


@router.post("/{restaurant_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    restaurant_id: int,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not db["restaurants"].find_one({"id": restaurant_id}):
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if db["favorites"].find_one({"user_id": current_user["id"], "restaurant_id": restaurant_id}):
        raise HTTPException(status_code=400, detail="Already in favorites")

    db["favorites"].insert_one({
        "user_id": current_user["id"],
        "restaurant_id": restaurant_id,
        "created_at": datetime.now(timezone.utc),
    })
    return {"message": "Added to favorites"}


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    restaurant_id: int,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = db["favorites"].delete_one({"user_id": current_user["id"], "restaurant_id": restaurant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in favorites")


@router.get("/", response_model=List[RestaurantResponse])
def get_favorites(
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    favs = list(db["favorites"].find({"user_id": current_user["id"]}))
    result = []
    for f in favs:
        r = db["restaurants"].find_one({"id": f["restaurant_id"]})
        if r:
            result.append(_rest_to_response(r))
    return result
