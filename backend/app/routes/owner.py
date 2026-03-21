from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.review import Review
from app.schemas.restaurant import RestaurantResponse
from app.schemas.review import ReviewResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/owner", tags=["Owner Dashboard"])


@router.get("/restaurants", response_model=List[RestaurantResponse])
def get_owned_restaurants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
    result = []
    for r in restaurants:
        resp = RestaurantResponse.model_validate(r)
        resp.photos = [p.photo_url for p in r.photos]
        result.append(resp)
    return result


@router.get("/restaurants/{restaurant_id}/reviews", response_model=List[ReviewResponse])
def get_restaurant_reviews_for_owner(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id, Restaurant.owner_id == current_user.id
    ).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found or not owned by you")

    reviews = (
        db.query(Review)
        .filter(Review.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        resp = ReviewResponse.model_validate(r)
        resp.user_name = r.user.name if r.user else None
        result.append(resp)
    return result


@router.get("/unclaimed")
def get_unclaimed_restaurants(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    query = db.query(Restaurant).filter(Restaurant.owner_id == None)
    if search:
        query = query.filter(
            Restaurant.name.ilike(f"%{search}%") |
            Restaurant.city.ilike(f"%{search}%") |
            Restaurant.cuisine_type.ilike(f"%{search}%")
        )
    restaurants = query.limit(20).all()
    result = []
    for r in restaurants:
        resp = RestaurantResponse.model_validate(r)
        resp.photos = [p.photo_url for p in r.photos]
        result.append(resp)
    return result


@router.get("/dashboard")
def owner_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")

    restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
    rest_ids = [r.id for r in restaurants]

    total_reviews = 0
    total_rating = 0.0
    ratings_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    recent_reviews = []

    if rest_ids:
        all_reviews = (
            db.query(Review)
            .filter(Review.restaurant_id.in_(rest_ids))
            .all()
        )
        total_reviews = len(all_reviews)
        for rev in all_reviews:
            total_rating += rev.rating
            star = min(5, max(1, round(rev.rating)))
            ratings_distribution[star] += 1

        recent_q = (
            db.query(Review)
            .filter(Review.restaurant_id.in_(rest_ids))
            .order_by(Review.created_at.desc())
            .limit(10)
            .all()
        )
        rest_map = {r.id: r.name for r in restaurants}
        for rev in recent_q:
            recent_reviews.append({
                "id": rev.id,
                "restaurant_id": rev.restaurant_id,
                "restaurant_name": rest_map.get(rev.restaurant_id, ""),
                "user_name": rev.user.name if rev.user else "Anonymous",
                "rating": rev.rating,
                "comment": rev.comment,
                "created_at": str(rev.created_at),
            })

    avg_rating = round(total_rating / total_reviews, 2) if total_reviews > 0 else 0.0

    if avg_rating >= 4.5:
        sentiment = "Excellent"
    elif avg_rating >= 4.0:
        sentiment = "Great"
    elif avg_rating >= 3.0:
        sentiment = "Good"
    elif avg_rating >= 2.0:
        sentiment = "Mixed"
    else:
        sentiment = "Needs Improvement"

    return {
        "total_restaurants": len(restaurants),
        "total_reviews": total_reviews,
        "average_rating": avg_rating,
        "ratings_distribution": ratings_distribution,
        "sentiment": sentiment,
        "recent_reviews": recent_reviews,
    }
