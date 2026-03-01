from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
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


@router.get("/dashboard")
def owner_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")

    restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()

    total_reviews = 0
    total_rating = 0.0
    recent_reviews = []

    for r in restaurants:
        total_reviews += r.review_count
        total_rating += r.average_rating * r.review_count
        reviews = (
            db.query(Review)
            .filter(Review.restaurant_id == r.id)
            .order_by(Review.created_at.desc())
            .limit(5)
            .all()
        )
        for rev in reviews:
            recent_reviews.append({
                "restaurant_name": r.name,
                "user_name": rev.user.name if rev.user else "Anonymous",
                "rating": rev.rating,
                "comment": rev.comment,
                "created_at": str(rev.created_at),
            })

    avg_rating = round(total_rating / total_reviews, 2) if total_reviews > 0 else 0

    return {
        "total_restaurants": len(restaurants),
        "total_reviews": total_reviews,
        "average_rating": avg_rating,
        "recent_reviews": sorted(recent_reviews, key=lambda x: x["created_at"], reverse=True)[:10],
    }